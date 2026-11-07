"""Regression coverage for disk discovery and empty-scan behavior.

All disk inputs are synthetic. These tests never open real hardware.
"""
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import murdilimax_devices as devices
from murdilimax_engine import Candidate, MAX_RECORDS, scan_image
from test_engine import ntfs_fixture


class PhysicalEnumerationTests(unittest.TestCase):
    def test_discovery_does_not_require_raw_data_read_permission(self):
        k = MagicMock()
        k.CreateFileW.side_effect = [11, 12, devices.INVALID_HANDLE_VALUE]
        calls = []
        def ioctl(_kernel, handle, code, outsize):
            calls.append((handle, code))
            if code == devices.IOCTL_DISK_GET_LENGTH_INFO:
                return (128 * 1024**3 if handle == 11 else 512 * 1024**3).to_bytes(8, 'little')
            if code == devices.IOCTL_DISK_GET_DRIVE_GEOMETRY:
                geo = bytearray(24)
                geo[20:24] = (512 if handle == 11 else 4096).to_bytes(4, 'little')
                return bytes(geo)
            raise AssertionError('Unexpected ioctl')
        with patch.object(devices, 'os', SimpleNamespace(name='nt')), \
             patch.object(devices, '_kernel', return_value=k), \
             patch.object(devices, '_ioctl', side_effect=ioctl), \
             patch.object(devices, 'WindowsPhysicalDisk', side_effect=AssertionError('No raw-read handles')):
            rows = devices.enumerate_drives(max_index=3)
        self.assertEqual([x['path'] for x in rows],
                         [r'\\.\PhysicalDrive0', r'\\.\PhysicalDrive1'])
        self.assertEqual([x['sector'] for x in rows], [512, 4096])
        self.assertEqual([x['size'] for x in rows], [128 * 1024**3, 512 * 1024**3])
        self.assertEqual(k.CreateFileW.call_count, 3)
        self.assertTrue(all(c.args[1] == 0 for c in k.CreateFileW.call_args_list))
        self.assertEqual([c.args[0] for c in k.CloseHandle.call_args_list], [11, 12])
        self.assertEqual(len(calls), 4)

    def test_geometry_ex_fallback_and_close(self):
        k = MagicMock()
        k.CreateFileW.return_value = 42
        geo = bytearray(32)
        geo[20:24] = (4096).to_bytes(4, 'little')
        geo[24:32] = (256 * 1024**3).to_bytes(8, 'little')
        def ioctl(_kernel, _handle, code, _outsize):
            if code == devices.IOCTL_DISK_GET_DRIVE_GEOMETRY_EX:
                return bytes(geo)
            raise OSError('This metadata ioctl is unavailable')
        with patch.object(devices, 'os', SimpleNamespace(name='nt')), \
             patch.object(devices, '_kernel', return_value=k), \
             patch.object(devices, '_ioctl', side_effect=ioctl):
            rows = devices.enumerate_drives(max_index=1)
        self.assertEqual(rows, [{'path':r'\\.\PhysicalDrive0','size':256*1024**3,'sector':4096}])
        k.CloseHandle.assert_called_once_with(42)

    def test_uninspectable_disk_is_not_misrepresented(self):
        k = MagicMock()
        k.CreateFileW.return_value = 41
        with patch.object(devices, 'os', SimpleNamespace(name='nt')), \
             patch.object(devices, '_kernel', return_value=k), \
             patch.object(devices, '_ioctl', side_effect=OSError('Denied')):
            self.assertEqual(devices.enumerate_drives(max_index=1), [])
        k.CloseHandle.assert_called_once_with(41)


class ScanCoverageTests(unittest.TestCase):
    def test_empty_deleted_file_scan_still_reports_progress(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'active_files_only.img'
            ntfs_fixture(path)
            data = bytearray(path.read_bytes())
            data[4*512 + 16*1024 + 22] = 1  # synthetic target MFT entry is now in use
            path.write_bytes(data)
            events = []
            found, parts, errors = scan_image(path, progress=lambda done,total: events.append((done,total)))
        self.assertFalse(errors)
        self.assertEqual(found, [])
        self.assertEqual(len(parts), 1)
        self.assertTrue(events)
        self.assertEqual(events[-1][0], events[-1][1])

    def test_default_metadata_scan_cap_is_not_100k(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'ntfs.img'
            ntfs_fixture(path)
            with patch('murdilimax_engine.ntfs_scan', return_value=[]) as reader:
                scan_image(path)
            self.assertEqual(reader.call_args.args[3], MAX_RECORDS)
            self.assertGreater(MAX_RECORDS, 100000)

    def test_audio_candidates_are_searchable(self):
        item = Candidate('NTFS', 'track.mp3', 'music/track.mp3', 10, 0)
        self.assertEqual(item.kind, 'Audio')


if __name__ == '__main__':
    unittest.main()
