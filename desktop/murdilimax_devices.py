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
IOCTL_DISK_GET_DRIVE_GEOMETRY_EX = 0x000700A0
IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS = 0x00560000
INVALID_HANDLE_VALUE = ctypes.c_void_p(-1).value


def is_physical(path: str) -> bool:
    return DRIVE_RE.fullmatch(str(path)) is not None


VOLUME_RE = re.compile(r'^\\\\\.\\([A-Za-z]):$')


def is_volume(path: str) -> bool:
    return VOLUME_RE.fullmatch(str(path)) is not None


def is_device(path: str) -> bool:
    return is_physical(path) or is_volume(path)


def volume_device(letter: str) -> str:
    """Accept a drive letter, never a folder or an arbitrary device namespace."""
    if not re.fullmatch(r'[A-Za-z]:?', str(letter)):
        raise ValueError('Expected one Windows drive letter')
    return '\\\\.\\' + letter[0].upper() + ':'


def enumerate_volumes():
    """List local disk/USB volumes without opening them or browsing directories."""
    if os.name != 'nt':
        return []
    k = _kernel()
    k.GetLogicalDrives.restype = wintypes.DWORD
    k.GetDriveTypeW.argtypes = [wintypes.LPCWSTR]
    k.GetDriveTypeW.restype = wintypes.UINT
    k.GetVolumeInformationW.argtypes = [wintypes.LPCWSTR, wintypes.LPWSTR, wintypes.DWORD,
        ctypes.POINTER(wintypes.DWORD), ctypes.POINTER(wintypes.DWORD),
        ctypes.POINTER(wintypes.DWORD), wintypes.LPWSTR, wintypes.DWORD]
    k.GetVolumeInformationW.restype = wintypes.BOOL
    k.GetDiskFreeSpaceExW.argtypes = [wintypes.LPCWSTR, ctypes.POINTER(ctypes.c_ulonglong),
        ctypes.POINTER(ctypes.c_ulonglong), ctypes.POINTER(ctypes.c_ulonglong)]
    k.GetDiskFreeSpaceExW.restype = wintypes.BOOL
    mask = k.GetLogicalDrives()
    result = []
    for i in range(26):
        if not mask & (1 << i):
            continue
        letter = chr(65 + i) + ':'
        root = letter + '\\'
        if k.GetDriveTypeW(root) not in (2, 3):  # removable or fixed; never network/CD-ROM
            continue
        label = ctypes.create_unicode_buffer(261)
        fs = ctypes.create_unicode_buffer(64)
        serial, maximum, flags = wintypes.DWORD(), wintypes.DWORD(), wintypes.DWORD()
        if not k.GetVolumeInformationW(root, label, len(label), ctypes.byref(serial),
                ctypes.byref(maximum), ctypes.byref(flags), fs, len(fs)):
            continue  # no media / locked volume / unavailable
        free, total, unused = ctypes.c_ulonglong(), ctypes.c_ulonglong(), ctypes.c_ulonglong()
        if not k.GetDiskFreeSpaceExW(root, ctypes.byref(free), ctypes.byref(total), ctypes.byref(unused)):
            continue
        result.append({'path': volume_device(letter), 'letter': letter,
                       'label': label.value, 'fs': fs.value, 'size': total.value})
    return result


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
    k.VirtualAlloc.argtypes = [ctypes.c_void_p, ctypes.c_size_t, wintypes.DWORD, wintypes.DWORD]
    k.VirtualAlloc.restype = ctypes.c_void_p
    k.VirtualFree.argtypes = [ctypes.c_void_p, ctypes.c_size_t, wintypes.DWORD]
    k.VirtualFree.restype = wintypes.BOOL
    return k


def _open_readonly(k, device):
    h = k.CreateFileW(device, GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE,
                      None, OPEN_EXISTING, 0, None)
    if h == INVALID_HANDLE_VALUE or h is None:
        error = ctypes.get_last_error()
        if error == 5:
            raise PermissionError('Нет доступа к диску. Запустите программу от имени администратора; разблокируйте BitLocker при необходимости. / Run as administrator and unlock BitLocker if needed.')
        raise ctypes.WinError(error)
    return h


def _ioctl(k, h, code, outsize):
    buf = (ctypes.c_ubyte * outsize)()
    read = wintypes.DWORD()
    if not k.DeviceIoControl(h, code, None, 0, buf, outsize, ctypes.byref(read), None):
        raise ctypes.WinError(ctypes.get_last_error())
    return bytes(buf[:read.value])


class WindowsPhysicalDisk:
    _valid_path = staticmethod(is_physical)

    def __init__(self, path: str):
        if not self._valid_path(path):
            raise ValueError('Invalid explicit Windows disk or volume path')
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
            # DASD handles can be noncached: buffer addresses must also be sector aligned.
            buf = self.k.VirtualAlloc(None, amount, 0x3000, 0x04)
            if not buf:
                raise MemoryError('Could not allocate aligned disk read buffer')
            try:
                got=wintypes.DWORD()
                if not self.k.ReadFile(self.handle,buf,amount,ctypes.byref(got),None):
                    raise ctypes.WinError(ctypes.get_last_error())
                if got.value != amount: raise IOError('Short physical disk read; stop and image damaged drive')
                out.extend(ctypes.string_at(buf, got.value)); start += amount
            finally:
                self.k.VirtualFree(buf, 0, 0x8000)
        head=self.cursor-(self.cursor//sector)*sector
        self.cursor += count
        return bytes(out[head:head+count])

    def close(self):
        if getattr(self,'handle',None) not in (None, INVALID_HANDLE_VALUE):
            self.k.CloseHandle(self.handle)
            self.handle = None

    def __enter__(self): return self
    def __exit__(self,*exc): self.close()


class WindowsVolume(WindowsPhysicalDisk):
    """Read-only logical volume, e.g. \\\\.\\C:, not the C:\\ directory."""
    _valid_path = staticmethod(is_volume)


def enumerate_drives(max_index=24):
    """Discover physical disks without requesting data-read access.

    Enumeration must work for non-admin users too: the raw read handle needed
    for a scan is opened *later*, with an explicit permission error if denied.
    Drives without a mount letter are included when Windows exposes metadata.
    """
    if os.name != 'nt': return []
    k = _kernel()
    disks = []
    for i in range(max_index):
        path = rf'\\.\PhysicalDrive{i}'
        h = k.CreateFileW(path, 0, FILE_SHARE_READ | FILE_SHARE_WRITE,
                          None, OPEN_EXISTING, 0, None)
        if h in (INVALID_HANDLE_VALUE, None):
            continue
        try:
            size = 0
            sector = 512
            geometry_ex = b''
            try:
                info = _ioctl(k, h, IOCTL_DISK_GET_LENGTH_INFO, 8)
                if len(info) >= 8:
                    size = int.from_bytes(info[:8], 'little')
            except OSError:
                pass
            try:
                geometry = _ioctl(k, h, IOCTL_DISK_GET_DRIVE_GEOMETRY, 24)
                if len(geometry) >= 24:
                    reported = int.from_bytes(geometry[20:24], 'little')
                    if reported in (512, 1024, 2048, 4096):
                        sector = reported
            except OSError:
                pass
            if not size:
                try:
                    geometry_ex = _ioctl(k, h, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX, 32)
                    if len(geometry_ex) >= 32:
                        size = int.from_bytes(geometry_ex[24:32], 'little')
                        reported = int.from_bytes(geometry_ex[20:24], 'little')
                        if reported in (512, 1024, 2048, 4096):
                            sector = reported
                except OSError:
                    pass
            if size > 0:
                disks.append({'path': path, 'size': size, 'sector': sector})
        finally:
            k.CloseHandle(h)
    return disks


def destination_is_different_disk(source: str, destination: str) -> bool:
    """Fail closed if source and output could resolve to the same physical disk.
    Windows output must be on an assigned local volume with inspectable extents.
    """
    if not is_device(source): return True
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
        if is_physical(source):
            source_nums = {int(DRIVE_RE.fullmatch(source).group(1))}
        else:
            src_handle = _open_readonly(k, source)
            try:
                from murdilimax_safety import parse_volume_disk_numbers
                source_nums = parse_volume_disk_numbers(_ioctl(k, src_handle,
                    IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS, 32768))
            finally:
                k.CloseHandle(src_handle)
        return bool(source_nums) and source_nums.isdisjoint(disk_nums)
    finally:
        k.CloseHandle(h)


@contextmanager
def open_source(path: str):
    if is_volume(path):
        # Explicit logical-volume scan is read-only, including the live C: volume.
        # No lock, dismount or write IOCTL is issued. This is not an offline snapshot.
        with WindowsVolume(path) as d:
            yield d, d.length
    elif is_physical(path):
        # Protect the running Windows OS disk even during direct scan.
        from murdilimax_safety import system_disk_numbers
        physical_number = int(DRIVE_RE.fullmatch(path).group(1))
        if physical_number in system_disk_numbers():
            raise ValueError('Live Windows system disk: direct scan blocked. Use an offline disk image.')
        with WindowsPhysicalDisk(path) as d:
            yield d, d.length
    else:
        with open(path, 'rb') as fp:
            yield fp, os.path.getsize(path)
