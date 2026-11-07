import hashlib
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
import zipfile
import zlib
from murdilimax_validate import assess_file


class ValidationTests(unittest.TestCase):
    def test_png_crc_good_and_bad(self):
        def chunk(tag,data):
            return len(data).to_bytes(4,'big')+tag+data+(zlib.crc32(tag+data)&0xffffffff).to_bytes(4,'big')
        valid=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',b'\x00'*13)+chunk(b'IEND',b'')
        with TemporaryDirectory() as d:
            p=Path(d)/'a.png';p.write_bytes(valid)
            self.assertEqual(assess_file(str(p))['result'],'validated_structure')
            altered=bytearray(valid);altered[23]^=1;p.write_bytes(altered)
            self.assertEqual(assess_file(str(p))['result'],'signature_mismatch')
    def test_pdf_missing_eof(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'a.pdf';p.write_bytes(b'%PDF-1.7\nno EOF\n')
            self.assertEqual(assess_file(str(p))['result'],'possibly_truncated')
    def test_jpeg_plausible(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'a.jpg';p.write_bytes(b'\xff\xd8\xff\xe0data\xff\xd9')
            self.assertEqual(assess_file(str(p))['result'],'plausible')
    def test_zip_directory(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'a.zip'
            with zipfile.ZipFile(p,'w') as z:z.writestr('x.txt','sample')
            self.assertEqual(assess_file(str(p))['result'],'validated_structure')
    def test_unknown_is_not_false_validated(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'key.dat';p.write_bytes(b'private')
            self.assertEqual(assess_file(str(p))['result'],'not_checked')

if __name__=='__main__':unittest.main()
