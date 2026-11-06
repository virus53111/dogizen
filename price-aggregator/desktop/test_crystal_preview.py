"""Folder photo preview must reject secret files, symlinks and changed sizes."""
import tempfile
from pathlib import Path
import unittest
from murdilimax_crystal_logic import read_visible_photo

class FolderPreviewTest(unittest.TestCase):
    def test_valid_photo(self):
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/'photo.jpg';f.write_bytes(b'\xff\xd8\xff1234')
            self.assertEqual(read_visible_photo(str(f),7),f.read_bytes())
    def test_secret_file(self):
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/'wallet.dat';f.write_bytes(b'secret')
            with self.assertRaises(ValueError):read_visible_photo(str(f),6)
    def test_changed_length(self):
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/'photo.png';f.write_bytes(b'1234')
            with self.assertRaises(ValueError):read_visible_photo(str(f),3)
    def test_limit(self):
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/'photo.png';f.write_bytes(b'1234')
            with self.assertRaises(ValueError):read_visible_photo(str(f),4,max_bytes=3)
    def test_symlink(self):
        with tempfile.TemporaryDirectory() as td:
            f=Path(td)/'real.jpg';f.write_bytes(b'a')
            alias=Path(td)/'alias.jpg'
            try:alias.symlink_to(f)
            except (OSError,NotImplementedError):self.skipTest('No symlink privileges')
            with self.assertRaises(ValueError):read_visible_photo(str(alias),1)
if __name__=='__main__':unittest.main()
