"""Windows-only, read-only physical disk access. Never requests write permissions.

Raw Windows device offsets/read lengths are sector-aligned; reads are deliberately
single attempt so unhealthy media should first be imaged with specialized tools.
"""
from __future__ import annotations
import ctypes
from ctypes import wintypes
import os
import re
from contextlib import contextmanager
from pathlib import Path

DRIVE_RE = re.compile(r'^\\\\\.\\PhysicalDrive(\d{1,3})$', re.IGNORECASE)
GENERIC_READ = 0x80000000
FILE_SHARE_READ = 1
FILE_SHARE_WRITE = 2
OPEN_EXISTING = 3
FILE_BEGIN = 0
IOCTL_DISK_GET_LENGTH_INFO = 0x0007405C
IOCTL_DISK_GET_DRIVE_GEOMETRY = 0x00070000
IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS = 0x00560000
INVALID_HANDLE_VALUE = ctypes.c_void_p(-1).value


def is_physical(path: str) -> bool:
    return DRIVE_RE.fullmatch(str(path)) is not None


def _kernel():
    if os.name != 'nt':
        raise OSError('Physical disk mode is only supported on Windows')
    k = ctypes.WinDLL('kernel32', use_last_error=True)
    k.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD,
                              ctypes.c_void_p, wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
    k.CreateFileW.restype = wintypes.HANDLE
    k.DeviceIoControl.argtypes = [wintypes.HANDLE, wintypes.DWORD, ctypes.c_void_p,
                                  wintypes.DWORD, ctypes.c_void_p, wintypes.DWORD,
                                  ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
    k.DeviceIoControl.restype = wintypes.BOOL
    k.SetFilePointerEx.argtypes = [wintypes.HANDLE, ctypes.c_longlong,
                                   ctypes.POINTER(ctypes.c_longlong), wintypes.DWORD]
    k.SetFilePointerEx.restype = wintypes.BOOL
    k.ReadFile.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD,
                           ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
    k.ReadFile.restype = wintypes.BOOL
    k.CloseHandle.argtypes = [wintypes.HANDLE]
    k.CloseHandle.restype = wintypes.BOOL
    return k


def _open_readonly(k, device):
    h = k.CreateFileW(device, GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE,
                      None, OPEN_EXISTING, 0, None)
    if h == INVALID_HANDLE_VALUE or h is None:
        raise ctypes.WinError(ctypes.get_last_error())
    return h


def _ioctl(k, h, code, outsize):
    buf = (ctypes.c_ubyte * outsize)()
    read = wintypes.DWORD()
    if not k.DeviceIoControl(h, code, None, 0, buf, outsize, ctypes.byref(read), None):
        raise ctypes.WinError(ctypes.get_last_error())
    return bytes(buf[:read.value])


class WindowsPhysicalDisk:
    def __init__(self, path: str):
        if not is_physical(path):
            raise ValueError('Only explicit \\\\.\\PhysicalDriveN device paths are allowed')
        self.path = path
        self.k = _kernel()
        self.handle = _open_readonly(self.k, path)
        try:
            self.length = int.from_bytes(_ioctl(self.k, self.handle, IOCTL_DISK_GET_LENGTH_INFO, 8)[:8], 'little')
            geo = _ioctl(self.k, self.handle, IOCTL_DISK_GET_DRIVE_GEOMETRY, 24)
            self.sector_size = int.from_bytes(geo[20:24], 'little') if len(geo) >= 24 else 512
            if self.sector_size not in (512,1024,2048,4096):
                raise ValueError('Unsupported logical sector size')
            if self.length <= 0:
                raise ValueError('Invalid drive size')
            self.cursor = 0
        except Exception:
            self.close()
            raise

    def seek(self, offset: int, whence: int=0):
        if whence == 1: offset += self.cursor
        elif whence == 2: offset += self.length
        elif whence != 0: raise ValueError('Unsupported whence')
        if offset < 0: raise ValueError('Negative offset')
        self.cursor = offset
        return offset

    def tell(self): return self.cursor

    def read(self, count: int=-1):
        if count == -1: raise ValueError('Unbounded reads are disabled for physical disks')
        if count < 0: raise ValueError('Negative read length')
        if not count or self.cursor >= self.length: return b''
        count = min(count, self.length-self.cursor)
        sector = self.sector_size
        start = self.cursor - self.cursor % sector
        end = min(self.length, ((self.cursor+count+sector-1)//sector)*sector)
        out = bytearray()
        while start < end:
            amount = min(end-start, 4*1024*1024)
            amount -= amount % sector
            if amount <= 0: raise IOError('Unaligned device request')
            if not self.k.SetFilePointerEx(self.handle, start, None, FILE_BEGIN):
                raise ctypes.WinError(ctypes.get_last_error())
            buf=(ctypes.c_ubyte*amount)()
            got=wintypes.DWORD()
            if not self.k.ReadFile(self.handle,buf,amount,ctypes.byref(got),None):
                raise ctypes.WinError(ctypes.get_last_error())
            if got.value != amount: raise IOError('Short physical disk read; stop and image damaged drive')
            out.extend(buf[:got.value]); start += amount
        head=self.cursor-(self.cursor//sector)*sector
        self.cursor += count
        return bytes(out[head:head+count])

    def close(self):
        if getattr(self,'handle',None) not in (None, INVALID_HANDLE_VALUE):
            self.k.CloseHandle(self.handle)
            self.handle = None

    def __enter__(self): return self
    def __exit__(self,*exc): self.close()


def enumerate_drives(max_index=24):
    if os.name != 'nt': return []
    disks=[]
    for i in range(max_index):
        path=rf'\\.\PhysicalDrive{i}'
        try:
            with WindowsPhysicalDisk(path) as d:
                disks.append({'path':path,'size':d.length,'sector':d.sector_size})
        except OSError:
            continue
    return disks


def destination_is_different_disk(source: str, destination: str) -> bool:
    """Fail closed if source and output could resolve to the same physical disk.
    Windows output must be on an assigned local volume with inspectable extents.
    """
    if not is_physical(source): return True
    if os.name != 'nt': return False
    output = Path(destination).resolve()
    drive = output.drive
    if not re.fullmatch(r'[A-Za-z]:', drive): return False
    k = _kernel()
    h = _open_readonly(k, "\\\\.\\" + drive)
    try:
        ext = _ioctl(k,h,IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS,8192)
        if len(ext)<32:return False
        n=int.from_bytes(ext[:4],'little')
        if n<1 or len(ext)<8+n*24:return False
        disk_nums={int.from_bytes(ext[8+i*24:12+i*24],'little') for i in range(n)}
        source_num=int(DRIVE_RE.fullmatch(source).group(1))
        return source_num not in disk_nums
    finally:
        k.CloseHandle(h)


@contextmanager
def open_source(path: str):
    if is_physical(path):
        with WindowsPhysicalDisk(path) as d:
            yield d, d.length
    else:
        with open(path, 'rb') as fp:
            yield fp, os.path.getsize(path)
