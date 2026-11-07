"""Stage 2 synthetic tests: NTFS parent identity and deleted exFAT directories."""
import tempfile
import unittest
from pathlib import Path
from murdilimax_engine import scan_image, recover
from test_engine import ntfs_fixture, exfat_fixture, w16, w32, w64

class Stage2MetadataTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.base=Path(self.temp.name)

    def test_ntfs_reused_parent_slot_does_not_mislabel_path(self):
        p=self.base/'disk.img';ntfs_fixture(p,nested=True)
        raw=bytearray(p.read_bytes())
        w64(raw,4*512+16*1024+0x38+24,14|(5<<48))
        w16(raw,4*512+14*1024+16,6)
        p.write_bytes(raw)
        found,_,_=scan_image(p)
        self.assertEqual(found[0].path,'lost.jpg')

    def test_ntfs_matching_parent_sequence_keeps_path(self):
        p=self.base/'disk.img';ntfs_fixture(p,nested=True)
        raw=bytearray(p.read_bytes())
        w64(raw,4*512+16*1024+0x38+24,14|(5<<48))
        w16(raw,4*512+14*1024+16,5)
        p.write_bytes(raw)
        found,_,_=scan_image(p)
        self.assertEqual(found[0].path,'LostFolder/lost.jpg')

    @staticmethod
    def add_deleted_folder(raw,reused=False):
        root=40*512;p=root+128
        raw[p]=0x05;raw[p+1]=2;w16(raw,p+4,0x10)
        p+=32;raw[p]=0x40;raw[p+1]=2;raw[p+3]=4
        w32(raw,p+20,6);w64(raw,p+24,512)
        p+=32;raw[p]=0x41;raw[p+2:p+10]='Gone'.encode('utf-16le')
        inside=(40+6-2)*512
        raw[inside]=0x05;raw[inside+1]=2;w16(raw,inside+4,0x20)
        p=inside+32;raw[p]=0x40;raw[p+1]=2;raw[p+3]=8
        w32(raw,p+20,7);w64(raw,p+24,75)
        p+=32;raw[p]=0x41;raw[p+2:p+18]='baby.jpg'.encode('utf-16le')
        payload=b'JPG-deleted-content'+b'B'*(75-len(b'JPG-deleted-content'))
        raw[(40+7-2)*512:(40+7-2)*512+75]=payload
        if reused:raw[41*512]|=1<<(6-2)
        return payload

    def test_deleted_exfat_directory_nested_recovery(self):
        p=self.base/'exfat.img';exfat_fixture(p)
        raw=bytearray(p.read_bytes());payload=self.add_deleted_folder(raw);p.write_bytes(raw)
        found,_,_=scan_image(p)
        c=next(x for x in found if x.name=='baby.jpg')
        self.assertEqual(c.path,'Gone/baby.jpg')
        self.assertEqual(c.state,'free')
        res=recover(p,c,self.base/'out')
        self.assertEqual(Path(res['path']).read_bytes(),payload)

    def test_deleted_directory_reused_cluster_is_skipped(self):
        p=self.base/'exfat.img';exfat_fixture(p)
        raw=bytearray(p.read_bytes());self.add_deleted_folder(raw,reused=True);p.write_bytes(raw)
        found,_,_=scan_image(p)
        self.assertFalse(any(x.name=='baby.jpg' for x in found))

    def test_fragmented_exfat_bitmap_checks_second_cluster(self):
        p=self.base/'exfat-large.img';exfat_fixture(p)
        raw=bytearray(p.read_bytes());raw.extend(bytes(6000*512-len(raw)))
        w32(raw,92,5500);w64(raw,40*512+24,688)
        w32(raw,24*512+3*4,8);w32(raw,24*512+8*4,0xffffffff)
        w32(raw,40*512+32+32+20,4500)
        raw[41*512]&=~(1<<2)
        raw[(40+8-2)*512+50]|=1<<2
        p.write_bytes(raw)
        found,_,_=scan_image(p)
        self.assertEqual(found[0].state,'reallocated')
