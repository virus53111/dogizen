"""Deterministic physical disk safety tests; no actual devices accessed."""
import io
import struct
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from contextlib import contextmanager
import murdilimax_safety as s
from murdilimax_imager import image_source

class FakePhysical(io.BytesIO):
    sector_size = 512
    def __init__(self, data):
        super().__init__(data)
        self.length = len(data)

class SafetyTests(unittest.TestCase):
    def test_system_drive_extents(self):
        raw=struct.pack('<I', 2)+b'\x00'*4
        raw+=struct.pack('<I4xQQ', 0, 0, 512)
        raw+=struct.pack('<I4xQQ', 3, 512, 1024)
        self.assertEqual(s.parse_volume_disk_numbers(raw),{0,3})

    def test_malformed_extents_rejected(self):
        with self.assertRaises(OSError):
            s.parse_volume_disk_numbers(b'\x02'+b'\x00'*15)

    def test_parse_hardware_description(self):
        buf=bytearray(120);struct.pack_into('<II',buf,0,36,120)
        buf[60:65]=b'ACME\x00';buf[70:75]=b'DISK\x00';buf[80:86]=b'SN123\x00'
        for pos,off in ((12,60),(16,70),(24,80)):struct.pack_into('<I',buf,pos,off)
        struct.pack_into('<I',buf,28,7)
        d=s.parse_device_descriptor(bytes(buf))
        self.assertEqual((d['vendor'],d['product'],d['serial'],d['bus_type']),('ACME','DISK','SN123','7'))

    def test_missing_serial_rejected_for_resume(self):
        disk=FakePhysical(b'Z'*8192)
        with patch.object(s,'system_disk_numbers',return_value={0}),patch.object(s,'_query_device_descriptor',return_value=b''):
            self.assertEqual(s.verify_physical_source('\\\\.\\PhysicalDrive1',disk)['device_fingerprint'],None)

    def test_running_system_disk_is_blocked(self):
        disk=FakePhysical(b'Z'*8192)
        with patch.object(s,'system_disk_numbers',return_value={1}),patch.object(s,'_query_device_descriptor',return_value=b''):
            with self.assertRaisesRegex(ValueError,'system disk'):
                s.verify_physical_source('\\\\.\\PhysicalDrive1',disk)

    def test_stable_identity_changes_if_serial_changes(self):
        disk=FakePhysical(b'Z'*8192)
        def blob(serial):
            b=bytearray(100);struct.pack_into('<II',b,0,36,100)
            b[50:50+len(serial)]=serial.encode();b[50+len(serial)]=0
            struct.pack_into('<I',b,24,50)
            return bytes(b)
        with patch.object(s,'system_disk_numbers',return_value=set()),patch.object(s,'_query_device_descriptor',side_effect=[blob('one'),blob('two')]):
            a=s.verify_physical_source('\\\\.\\PhysicalDrive2',disk)['device_fingerprint']
            b=s.verify_physical_source('\\\\.\\PhysicalDrive2',disk)['device_fingerprint']
        self.assertNotEqual(a,b)

    def test_physical_resume_rejects_swapped_device(self):
        from threading import Event
        from murdilimax_imager import ImagingCancelled
        import murdilimax_imager as m
        with TemporaryDirectory() as tmp:
            out=Path(tmp)/'saved.img'
            @contextmanager
            def source(_):yield FakePhysical(b'C'*8192),8192
            cancel=Event()
            with patch.object(m,'open_source',side_effect=source),patch.object(m,'destination_is_different_disk',return_value=True),patch.object(m,'verify_physical_source',side_effect=[{'device_fingerprint':'a'*64},{'device_fingerprint':'b'*64}]):
                with self.assertRaises(ImagingCancelled):
                    image_source('\\\\.\\PhysicalDrive2',str(out),chunk_size=4096,cancel=cancel,progress=lambda *_:cancel.set())
                with self.assertRaisesRegex(ValueError,'does not match'):
                    image_source('\\\\.\\PhysicalDrive2',str(out),chunk_size=4096,allow_resume_physical=True)
            self.assertFalse(out.exists())

    def test_physical_resume_with_missing_serial_fails_closed(self):
        from threading import Event
        from murdilimax_imager import ImagingCancelled
        import murdilimax_imager as m
        with TemporaryDirectory() as tmp:
            out=Path(tmp)/'saved.img'
            @contextmanager
            def source(_):yield FakePhysical(b'C'*8192),8192
            cancel=Event()
            with patch.object(m,'open_source',side_effect=source),patch.object(m,'destination_is_different_disk',return_value=True),patch.object(m,'verify_physical_source',return_value={'device_fingerprint':None}):
                with self.assertRaises(ImagingCancelled):
                    image_source('\\\\.\\PhysicalDrive2',str(out),chunk_size=4096,cancel=cancel,progress=lambda *_:cancel.set())
                with self.assertRaisesRegex(ValueError,'No stable hardware serial'):
                    image_source('\\\\.\\PhysicalDrive2',str(out),chunk_size=4096,allow_resume_physical=True)

if __name__ == '__main__':unittest.main()
