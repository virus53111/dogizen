"""Non-GUI regression checks for Crystal shell safety logic."""
from pathlib import Path
import tempfile
import unittest
from murdilimax_crystal_logic import (file_size, normalize_categories, validate_source,
    safe_destination, supported_preview, recommendation_color, selected_items)

class CrystalLogicTest(unittest.TestCase):
    def test_sizes(self):
        self.assertEqual(file_size(0),'0 B')
        self.assertEqual(file_size(2048),'2.0 KiB')
        self.assertEqual(file_size(-1),'0 B')
    def test_categories(self):
        self.assertEqual(normalize_categories(['Photos','Crypto backups','fake']),{'Photos','Crypto backups'})
    def test_preview_types(self):
        self.assertTrue(supported_preview('a.JPG'))
        self.assertFalse(supported_preview('wallet.dat'))
    def test_allocations(self):
        self.assertEqual(recommendation_color('free'),'#79F6D5')
        self.assertEqual(recommendation_color('reallocated'),'#FF8C9E')
    def test_selection(self):
        self.assertEqual(selected_items([(True,'a'),(False,'b')]),['a'])
    def test_source_and_output(self):
        with tempfile.TemporaryDirectory() as td:
            src=Path(td)/'source';src.mkdir(); (src/'nested').mkdir()
            other=Path(td)/'recovered';other.mkdir()
            raw=Path(td)/'raw.img';raw.write_bytes(b'abc')
            validate_source(str(src),'folder');validate_source(str(raw),'metadata')
            for p,mode in [(str(src),'metadata'),(str(raw),'folder'),(str(src),'physical')]:
                with self.assertRaises(ValueError):validate_source(p,mode)
            for out in [src,src/'nested']:
                with self.assertRaises(ValueError):safe_destination(str(src),str(out),'folder')
            with self.assertRaises(ValueError):safe_destination(str(raw),str(Path(td)),'metadata')
            safe_destination(str(src),str(other),'folder')
            safe_destination(str(raw),str(other),'metadata')

if __name__=='__main__':unittest.main()
