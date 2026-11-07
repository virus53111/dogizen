"""Whole-volume regression tests. Never scan or write a real user drive."""
import ctypes
import io
import os
import struct
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import murdilimax_devices as devices
from test_engine import ntfs_fixture
from murdilimax_crystal_logic import validate_source, safe_destination
from murdilimax_engine import scan_image, recover, Candidate
from murdilimax_recovery_alpha import restore, Hit


def extents(*numbers):
    return struct.pack('<I4x',len(numbers))+b''.join(struct.pack('<I4xQQ',n,0,8192) for n in numbers)


class VolumeSelectionTests(unittest.TestCase):
    def test_whole_volume_metadata_scan_and_recovery(self):
        with tempfile.TemporaryDirectory() as tmp:
            image=Path(tmp)/'synthetic.img';ntfs_fixture(image)
            raw=image.read_bytes()
            def volume(_):
                fp=io.BytesIO(raw);fp.length=len(raw);return fp
            with patch.object(devices,'WindowsVolume',side_effect=volume), \
                 patch('murdilimax_engine.destination_is_different_disk',return_value=True):
                found,parts,errors=scan_image(r'\\.\C:')
                self.assertFalse(errors)
                self.assertEqual(found[0].name,'lost.jpg')
                result=recover(r'\\.\C:',found[0],Path(tmp)/'different-disk')
            self.assertEqual(Path(result['path']).read_bytes(),b'\xff\xd8\xff'+b'A'*509+b'B'*188)

    def test_exact_drive_letter_namespace(self):
        self.assertEqual(devices.volume_device('c:'),r'\\.\C:')
        self.assertTrue(devices.is_volume(r'\\.\C:'))
        self.assertTrue(devices.is_device(r'\\.\D:'))
        self.assertFalse(devices.is_physical(r'\\.\C:'))
        for invalid in ['C:\\',r'C:\Users',r'\\.\C:\folder',r'\\server\share',r'\\.\GLOBALROOT','CC:']:
            self.assertFalse(devices.is_volume(invalid))
            with self.assertRaises(ValueError):devices.volume_device(invalid)
        validate_source(r'\\.\C:','volume')
        validate_source(r'\\.\D:','volume-carve')
        for mode in ['folder','metadata','physical']:
            with self.assertRaises(ValueError):validate_source(r'\\.\C:',mode)

    def test_enumeration_uses_drive_metadata_not_directory_browsing(self):
        k=MagicMock();k.GetLogicalDrives.return_value=(1<<2)|(1<<3)|(1<<4)
        k.GetDriveTypeW.side_effect=lambda root: 4 if root=='E:\\' else 3
        def info(root,label,*args):
            label.value='Windows' if root=='C:\\' else 'Data'
            args[4].value='NTFS'
            return True
        def size(root,free,total,unused):
            total._obj.value=256*1024**3;return True
        k.GetVolumeInformationW.side_effect=info;k.GetDiskFreeSpaceExW.side_effect=size
        with patch.object(devices,'os',SimpleNamespace(name='nt')),patch.object(devices,'_kernel',return_value=k), \
             patch('builtins.open',side_effect=AssertionError('No browsing')):
            rows=devices.enumerate_volumes()
        self.assertEqual([r['letter'] for r in rows],['C:','D:'])
        self.assertEqual(rows[0]['path'],r'\\.\C:')
        self.assertEqual(rows[0]['size'],256*1024**3)
        k.CreateFileW.assert_not_called()

    def test_raw_volume_routed_to_read_only_handle(self):
        disk=io.BytesIO(b'X'*8192);disk.length=8192
        with patch.object(devices,'WindowsVolume') as volume,patch('builtins.open') as ordinary:
            volume.return_value.__enter__.return_value=disk
            with devices.open_source(r'\\.\C:') as (fp,length):
                self.assertEqual((fp,length),(disk,8192))
            ordinary.assert_not_called()

    def test_same_physical_disk_is_blocked_even_with_different_letters(self):
        k=MagicMock()
        with tempfile.TemporaryDirectory() as tmp,patch.object(devices,'os',SimpleNamespace(name='nt')), \
             patch.object(devices,'_kernel',return_value=k),patch.object(devices,'_open_readonly',side_effect=[1,2]), \
             patch.object(devices,'_ioctl',side_effect=[extents(0),extents(0)]):
            self.assertFalse(devices.destination_is_different_disk(r'\\.\C:',tmp))
        with tempfile.TemporaryDirectory() as tmp,patch.object(devices,'os',SimpleNamespace(name='nt')), \
             patch.object(devices,'_kernel',return_value=k),patch.object(devices,'_open_readonly',side_effect=[1,2]), \
             patch.object(devices,'_ioctl',side_effect=[extents(1),extents(0)]):
            self.assertTrue(devices.destination_is_different_disk(r'\\.\C:',tmp))

    def test_restore_guards_apply_to_volume_metadata_and_carving(self):
        item=Candidate('NTFS','a.txt','a.txt',1,0,[(0,1)],state='free')
        with tempfile.TemporaryDirectory() as tmp:
            for module,call in [
                ('murdilimax_crystal_logic',lambda:safe_destination(r'\\.\C:',tmp,'volume')),
                ('murdilimax_engine',lambda:recover(r'\\.\C:',item,tmp)),
                ('murdilimax_recovery_alpha',lambda:restore(Hit('Photos','a.jpg',r'\\.\C:',0,1,True),tmp))]:
                with patch(module+'.destination_is_different_disk',return_value=False):
                    with self.assertRaises(ValueError):call()
            self.assertEqual(list(Path(tmp).iterdir()),[])

    def test_read_buffer_is_allocated_and_freed_on_device_error(self):
        k=MagicMock();buffer=ctypes.create_string_buffer(4096)
        k.VirtualAlloc.return_value=ctypes.addressof(buffer)
        k.SetFilePointerEx.return_value=True;k.ReadFile.return_value=False
        geo=bytearray(24);geo[20:24]=(512).to_bytes(4,'little')
        with patch.object(devices,'_kernel',return_value=k),patch.object(devices,'_open_readonly',return_value=7), \
             patch.object(devices,'_ioctl',side_effect=[(8192).to_bytes(8,'little'),bytes(geo)]):
            with devices.WindowsVolume(r'\\.\C:') as disk:
                with self.assertRaises(OSError):disk.read(512)
        k.VirtualAlloc.assert_called_once_with(None,512,0x3000,0x04)
        k.VirtualFree.assert_called_once_with(ctypes.addressof(buffer),0,0x8000)


@unittest.skipUnless(os.name=='nt' and os.environ.get('MRD_VOLUME_SMOKE')=='1',
                     'Explicit Windows CI read-only volume smoke test')
class WindowsVolumeIntegration(unittest.TestCase):
    def test_real_windows_volume_read_only(self):
        letter=os.environ.get('SystemDrive','C:')
        rows=devices.enumerate_volumes()
        self.assertIn(letter.upper(),[r['letter'] for r in rows])
        with devices.open_source(devices.volume_device(letter)) as (disk,size):
            self.assertGreater(size,512)
            self.assertEqual(len(disk.read(512)),512)


if __name__=='__main__':unittest.main()
