"""Conservative preflight checks for physical-disk acquisition on Windows.

No writes to source. Refuses live OS disks and ambiguous device identity on
resume. Read-only access is not a guarantee against OS/background writes.
"""
from __future__ import annotations

import ctypes
import hashlib
import os
import re
import struct
from ctypes import wintypes

from murdilimax_devices import (
    DRIVE_RE, _kernel, _open_readonly, _ioctl, IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS,
)

IOCTL_STORAGE_QUERY_PROPERTY = 0x002D1400

def parse_volume_disk_numbers(data: bytes) -> set[int]:
    """Decode VOLUME_DISK_EXTENTS, with x64 DISK_EXTENT offset = 8, size = 24."""
    if len(data) < 32:
        raise OSError('Unable to identify system volume disk extents')
    count = int.from_bytes(data[:4], 'little')
    if not 1 <= count <= 1024 or len(data) < 8 + 24 * count:
        raise OSError('Malformed volume disk extent response')
    return {int.from_bytes(data[8 + 24*i:12 + 24*i], 'little') for i in range(count)}

def system_disk_numbers() -> set[int]:
    """Ask Windows where its live Windows directory is, then map its volume to disks."""
    if os.name != 'nt':
        raise OSError('Physical disk acquisition is only supported on Windows')
    k = _kernel()
    k.GetWindowsDirectoryW.argtypes = [wintypes.LPWSTR, wintypes.UINT]
    k.GetWindowsDirectoryW.restype = wintypes.UINT
    buf = ctypes.create_unicode_buffer(32768)
    length = k.GetWindowsDirectoryW(buf, len(buf))
    if not (3 <= length < len(buf)):
        raise OSError('Windows directory could not be identified; refusing physical acquisition')
    windows_dir = buf.value
    volume = windows_dir[:2].upper()
    if not re.fullmatch(r'[A-Z]:', volume):
        raise OSError('Non-drive-letter system directory unsupported; refusing physical acquisition')
    h = _open_readonly(k, '\\\\.\\' + volume)
    try:
        ext = _ioctl(k, h, IOCTL_VOLUME_GET_VOLUME_DISK_EXTENTS, 32768)
        return parse_volume_disk_numbers(ext)
    finally:
        k.CloseHandle(h)

def _query_device_descriptor(device) -> bytes:
    """Query standard STORAGE_DEVICE_DESCRIPTOR via existing READ-only disk handle."""
    k = device.k
    k.DeviceIoControl.argtypes = [wintypes.HANDLE, wintypes.DWORD,
                                   ctypes.c_void_p, wintypes.DWORD,
                                   ctypes.c_void_p, wintypes.DWORD,
                                   ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
    request = (ctypes.c_ubyte * 12)()
    out = (ctypes.c_ubyte * 4096)()
    got = wintypes.DWORD(0)
    if not k.DeviceIoControl(device.handle, IOCTL_STORAGE_QUERY_PROPERTY,
                             request, len(request), out, len(out),
                             ctypes.byref(got), None):
        return b''
    return bytes(out[:got.value])

def parse_device_descriptor(raw: bytes) -> dict[str, str] | None:
    """Extract hardware identifiers with strict bounds checks."""
    if len(raw) < 36:
        return None
    advertised = struct.unpack_from('<I', raw, 4)[0]
    if advertised < 36:
        return None
    usable = min(len(raw), advertised)
    def field(offset: int) -> str:
        ptr = struct.unpack_from('<I', raw, offset)[0]
        if ptr == 0 or ptr >= usable:
            return ''
        tail = raw[ptr:usable].split(b'\x00', 1)[0]
        return tail[:256].decode('utf-8', 'replace').strip()
    return {'vendor': field(12), 'product': field(16),
            'revision': field(20), 'serial': field(24),
            'bus_type': str(struct.unpack_from('<I', raw, 28)[0])}

def verify_physical_source(path: str, device) -> dict[str, str | None]:
    """Refuse the OS disk, fingerprint hardware for crash-safe resume."""
    match = DRIVE_RE.fullmatch(path)
    if not match:
        raise ValueError('Expected explicit PhysicalDrive path')
    number = int(match.group(1))
    if number in system_disk_numbers():
        raise ValueError('Live Windows system disk: imaging is blocked for safety. Boot from a separate recovery environment or use a professional imaging tool.')
    description = parse_device_descriptor(_query_device_descriptor(device))
    stable = None
    if description and description['serial']:
        fingerprint_input = '\x00'.join([description['serial'], description['vendor'],
                                          description['product'], description['bus_type'],
                                          str(device.length), str(device.sector_size)])
        stable = hashlib.sha256(fingerprint_input.encode('utf-8')).hexdigest()
    return {'device_fingerprint': stable}
