import io
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from murdilimax_engine import Candidate
from murdilimax_preview import preview_bytes, decode_preview

class PreviewTests(unittest.TestCase):
    def setUp(self):
        self.ctx=tempfile.TemporaryDirectory();self.addCleanup(self.ctx.cleanup)
        self.src=Path(self.ctx.name)/'disk.img'
        photo=Image.new('RGB',(60,30),color=(60,70,200))
        stream=io.BytesIO();photo.save(stream,format='PNG')
        self.png=stream.getvalue()
        self.src.write_bytes(b'A'*512+self.png)
        self.c=Candidate('NTFS','picture.png','picture.png',len(self.png),0,[(512,len(self.png))],None,'free')

    def test_in_memory_preview_and_scale(self):
        data=preview_bytes(str(self.src),self.c)
        self.assertEqual(data,self.png)
        output=decode_preview(data,width=25,height=25)
        self.assertLessEqual(max(output.size),25)

    def test_reallocated_blocked(self):
        self.c.state='reallocated'
        with self.assertRaises(ValueError):preview_bytes(str(self.src),self.c)

    def test_preview_limit_prevents_disk_read(self):
        self.c.size=13*1024*1024
        with self.assertRaises(ValueError):preview_bytes(str(self.src),self.c)

    def test_nonimage_rejected(self):
        self.c.name='document.pdf'
        with self.assertRaises(ValueError):preview_bytes(str(self.src),self.c)

    def test_bad_image_returns_error(self):
        with self.assertRaises(ValueError):decode_preview(b'not a photo')

    def test_truncated_extents_blocked(self):
        self.c.extents=[(512,4)]
        with self.assertRaises(ValueError):preview_bytes(str(self.src),self.c)

    def test_unknown_allocation_preview_readonly(self):
        self.c.state='unknown'
        self.assertEqual(preview_bytes(str(self.src),self.c),self.png)
