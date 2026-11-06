import tempfile
import unittest
import zipfile
from pathlib import Path
from murdilimax_validate import assess_file

class Stage2ValidationTests(unittest.TestCase):
    def test_zip_member_crc_detects_corruption(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'archive.zip'
            with zipfile.ZipFile(p,'w',compression=zipfile.ZIP_STORED) as z:
                z.writestr('note.txt',b'Z'*1024)
            self.assertEqual(assess_file(str(p))['result'],'validated_structure')
            raw=bytearray(p.read_bytes());ix=raw.index(b'Z'*100);raw[ix+6]^=1;p.write_bytes(raw)
            self.assertEqual(assess_file(str(p))['result'],'possibly_truncated')

    def test_zip_large_member_is_inconclusive(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'large.zip'
            with zipfile.ZipFile(p,'w',compression=zipfile.ZIP_DEFLATED) as z:
                z.writestr('oversize.bin',b'K'*(65*1024*1024))
            self.assertEqual(assess_file(str(p))['result'],'inconclusive')
