"""Regression coverage for disk discovery and empty-scan behavior.

All disk inputs are synthetic. These tests never open real hardware.
"""
import io
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import murdilimax_devices as devices
from murdilimax_engine import Candidate, MAX_RECORDS, scan_image
from test_engine import ntfs_fixture
from murdilimax_recovery_alpha import find_end


class VolumeEnumerationTests(unittest.TestCase):
    def test_explorer_visible_d_drive_survives_failed_metadata_query(self):
        # Regression: Windows Explorer showed C: and D:, but the picker omitted D:
        # because GetVolumeInformationW could not be queried at that moment.
        k = MagicMock()
        k.GetLogicalDrives.return_value = (1 << 2) | (1 << 3)
        k.GetDriveTypeW.return_value = 3
        def get_metadata(root, label, _n, _serial, _max, _flags, fs, _fssize):
            if root.startswith('C:'):
                label.value = 'Windows'
                fs.value = 'NTFS'
                return True
            return False
        def get_capacity(root, _free, total, _unused):
            total._obj.value = (232 if root.startswith('C:') else 928) * 1024**3
            return True
        k.GetVolumeInformationW.side_effect = get_metadata
        k.GetDiskFreeSpaceExW.side_effect = get_capacity
        with patch.object(devices, 'os', SimpleNamespace(name='nt')), \
             patch.object(devices, '_kernel', return_value=k):
            disks = devices.enumerate_volumes()
        self.assertEqual([d['letter'] for d in disks], ['C:','D:'])
        self.assertEqual(disks[0]['fs'],'NTFS')
        self.assertEqual(disks[1]['fs'],'UNKNOWN')
        self.assertEqual(disks[1]['size'],928*1024**3)
        self.assertEqual(disks[1]['path'],r'\\.\D:')

    def test_metadata_and_capacity_failures_do_not_hide_a_drive_letter(self):
        k = MagicMock()
        k.GetLogicalDrives.return_value = 1 << 4
        k.GetDriveTypeW.return_value = 2
        k.GetVolumeInformationW.return_value = False
        k.GetDiskFreeSpaceExW.return_value = False
        with patch.object(devices, 'os', SimpleNamespace(name='nt')), \
             patch.object(devices, '_kernel', return_value=k):
            rows = devices.enumerate_volumes()
        self.assertEqual([d['letter'] for d in rows], ['E:'])
        self.assertEqual(rows[0]['fs'],'UNKNOWN')
        self.assertEqual(rows[0]['size'],0)


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

    def test_progress_never_goes_backwards_during_deep_scan(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'ntfs.img'
            ntfs_fixture(path)
            events = []
            found, parts, errors = scan_image(
                path, deep_partitions=True, probe_cap=512,
                progress=lambda done,total: events.append(int(done*100/max(1,total))))
        self.assertFalse(errors)
        self.assertEqual(len(parts), 1)
        self.assertEqual(len(found), 1)
        self.assertTrue(events)
        self.assertTrue(all(a <= b for a,b in zip(events,events[1:])), events)
        self.assertEqual(events[-1], 100)

    def test_carving_signature_validation_can_be_cancelled(self):
        raw = io.BytesIO(b'%PDF-' + b'A' * (4 * 1024 * 1024))
        calls = [0]
        def cancelled():
            calls[0] += 1
            return calls[0] >= 3
        self.assertIsNone(find_end(raw, 0, 'PDF',
                                   len(raw.getbuffer()), cancelled))
        self.assertGreaterEqual(calls[0], 3)
        self.assertLess(raw.tell(), 3 * 1024 * 1024)

    def test_audio_candidates_are_searchable(self):
        item = Candidate('NTFS', 'track.mp3', 'music/track.mp3', 10, 0)
        self.assertEqual(item.kind, 'Audio')


if __name__ == '__main__':
    unittest.main()
