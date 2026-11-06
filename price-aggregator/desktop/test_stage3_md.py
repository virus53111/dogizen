"""Linux MD read-only metadata tests on generated images, not real disks."""
import os
from pathlib import Path
import struct
import tempfile
import unittest
from murdilimax_md import probe_md12,inspect_md_set,extract_md_member,MAGIC
from murdilimax_raid import assemble

class MdTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)

    def member(self,name,role,uuid=b'0123456789abcdef',data=b'a'*8192):
        h=bytearray(4096)
        struct.pack_into('<II',h,0,MAGIC,1)
        h[16:32]=uuid
        h[32:40]=b'test-set'
        struct.pack_into('<iI',h,72,5,2)
        struct.pack_into('<II',h,88,8,3) # 4096-byte chunks / 3 disks
        struct.pack_into('<QQQ',h,128,2048,len(data)//512,8)
        struct.pack_into('<I',h,160,role)
        struct.pack_into('<I',h,252,3)
        struct.pack_into('<H',h,256+2*role,role)
        file=self.root/name
        with open(file,'wb') as f:
            f.write(bytes(4096));f.write(h);f.write(bytes(2048*512-8192));f.write(data)
        return str(file)

    def test_identify_and_extract_data_slice(self):
        img=self.member('md1.img',1,data=b'B'*8192)
        info=probe_md12(img)
        self.assertEqual(info['level'],5)
        self.assertEqual(info['role'],1)
        self.assertEqual(info['data_offset_bytes'],2048*512)
        result=extract_md_member(img,str(self.root/'slice.bin'))
        self.assertEqual(Path(result['output']).read_bytes(),b'B'*8192)
        self.assertFalse((self.root/'slice.bin.mrd-part').exists())

    def test_consistent_set_and_refuse_direct_raid(self):
        m=[self.member('m'+str(i)+'.img',i) for i in range(3)]
        result=inspect_md_set(m)
        self.assertEqual(result['available_members'],3)
        self.assertFalse(result['safe_to_auto_assemble'])
        with self.assertRaisesRegex(ValueError,'extract DATA'):
            assemble(m,str(self.root/'assembled.img'),5,4096)

    def test_conflicting_uuids_rejected(self):
        m=[self.member('m0.img',0),self.member('m1.img',1,uuid=b'FEDCBA9876543210')]
        with self.assertRaisesRegex(ValueError,'disagree'):
            inspect_md_set(m)

    def test_invalid_offset_rejected(self):
        p=Path(self.member('md1.img',0))
        with open(p,'r+b') as f:
            f.seek(4096+128);f.write((0xFFFFFFFF).to_bytes(8,'little'))
        with self.assertRaisesRegex(ValueError,'extends past end|unsafe'):
            probe_md12(str(p))

    def test_not_overwriting_input(self):
        img=self.member('md.img',0)
        with self.assertRaisesRegex(ValueError,'differ'):
            extract_md_member(img,img)

if __name__=='__main__':unittest.main()
