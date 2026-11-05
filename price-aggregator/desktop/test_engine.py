"""Reproducible synthetic sector images to validate metadata parsing and recovery."""
import os, tempfile, unittest, struct
from pathlib import Path
from murdilimax_engine import scan_image,recover,partition_list

def w16(b,o,v):struct.pack_into('<H',b,o,v)
def w32(b,o,v):struct.pack_into('<I',b,o,v)
def w64(b,o,v):struct.pack_into('<Q',b,o,v)

def resident_attr(t,data):
    n=((24+len(data)+7)//8)*8
    a=bytearray(n);w32(a,0,t);w32(a,4,n);w32(a,16,len(data));w16(a,20,24);a[24:24+len(data)]=data
    return a

def nonresident_attr(t,clusters,real,runs):
    n=((64+len(runs)+7)//8)*8
    a=bytearray(n);w32(a,0,t);w32(a,4,n);a[8]=1
    w64(a,24,clusters-1);w16(a,32,64)
    w64(a,40,clusters*512);w64(a,48,real);w64(a,56,real)
    a[64:64+len(runs)]=runs
    return a

def filename_attr(name,parent=5):
    val=bytearray(66+len(name.encode('utf-16le')))
    w64(val,0,parent);val[64]=len(name);val[65]=1;val[66:]=name.encode('utf-16le')
    return resident_attr(0x30,val)

def ntfs_record(attrs,inuse=True,folder=False):
    b=bytearray(1024);b[:4]=b'FILE';w16(b,4,0x30);w16(b,6,3);w16(b,20,0x38)
    w16(b,22,(1 if inuse else 0)|(2 if folder else 0))
    p=0x38
    for a in attrs:b[p:p+len(a)]=a;p+=len(a)
    w32(b,p,0xffffffff);p+=4;w32(b,24,p)
    w16(b,0x30,0xaaaa);w16(b,0x32,0);w16(b,0x34,0)
    b[510:512]=b'\xaa\xaa';b[1022:1024]=b'\xaa\xaa'
    return b

def ntfs_fixture(path,used=False,partition=False,nested=False):
    base=1024*1024 if partition else 0
    b=bytearray(base+2*1024*1024)
    if partition:
        b[510:512]=b'\x55\xaa'
        e=446;b[e+4]=0x07;w32(b,e+8,2048);w32(b,e+12,4096)
    boot=base
    b[boot+3:boot+11]=b'NTFS    ';w16(b,boot+11,512);b[boot+13]=1
    w64(b,boot+48,4);b[boot+64]=(-10)&255
    mft0=ntfs_record([filename_attr('$MFT'),nonresident_attr(0x80,40,40*512,b'\x11\x28\x04\x00')])
    mft5=ntfs_record([filename_attr('.',parent=5)],folder=True)
    bitmap=ntfs_record([filename_attr('$Bitmap'),nonresident_attr(0x80,1,512,b'\x11\x01\x3c\x00')])
    target=ntfs_record([filename_attr('lost.jpg',parent=14 if nested else 5),nonresident_attr(0x80,2,700,b'\x11\x01\x64\x11\x01\x02\x00')],inuse=False)
    subfolder=ntfs_record([filename_attr('LostFolder')],inuse=False,folder=True)
    for n,rec in ((0,mft0),(5,mft5),(6,bitmap),(14,subfolder),(16,target)):
        off=base+4*512+n*1024;b[off:off+1024]=rec
    alloc=bytearray(512)
    for cl in list(range(4,44))+[60]+([102] if used else []):alloc[cl//8]|=1<<(cl%8)
    b[base+60*512:base+61*512]=alloc
    b[base+100*512:base+101*512]=b'\xff\xd8\xff'+b'A'*509
    b[base+102*512:base+103*512]=b'B'*188+b'\xff\xd9'+b'Z'*322
    Path(path).write_bytes(b)


def exfat_fixture(path,used=False):
    b=bytearray(256*512)
    b[3:11]=b'EXFAT   ';b[108]=9;b[109]=0
    w32(b,80,24);w32(b,88,40);w32(b,92,100);w32(b,96,2)
    w64(b,72,256)
    # FAT root cluster = 2 (EOC)
    w32(b,24*512+2*4,0xffffffff)
    root=40*512
    b[root]=0x81;w32(b,root+20,3);w64(b,root+24,13)
    p=root+32;b[p]=0x05;b[p+1]=2;w16(b,p+4,0x20)
    p+=32;b[p]=0x40;b[p+1]=2;b[p+3]=7;w32(b,p+20,4);w64(b,p+24,100)
    p+=32;b[p]=0x41;b[p+2:p+2+14]='old.jpg'.encode('utf-16le')
    bitmap=41*512
    b[bitmap]=0b00000011|(0b00000100 if used else 0)
    payload=b'HELLOEXFAT'+b'B'*90
    b[42*512:42*512+100]=payload
    Path(path).write_bytes(b)
    return payload

class EngineTests(unittest.TestCase):
    def setUp(self):self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup);self.p=Path(self.t.name)
    def test_deleted_ntfs_fragmented_and_recover(self):
        img=self.p/'ntfs.img';ntfs_fixture(img)
        hits,parts,errors=scan_image(img)
        self.assertEqual(len(parts),1);self.assertFalse(errors)
        self.assertEqual(len(hits),1)
        c=hits[0];self.assertEqual((c.name,c.size,c.state),('lost.jpg',700,'free'))
        r=recover(img,c,self.p/'output')
        recovered=Path(r['path']).read_bytes()
        self.assertEqual(recovered,b'\xff\xd8\xff'+b'A'*509+b'B'*188)
    def test_reallocated_ntfs_refused(self):
        img=self.p/'ntfs.img';ntfs_fixture(img,used=True)
        h,_,_=scan_image(img)
        self.assertEqual(h[0].state,'reallocated')
        with self.assertRaises(ValueError):recover(img,h[0],self.p/'output')
    def test_restore_preserves_deleted_directory_hierarchy(self):
        img=self.p/'ntfs.img';ntfs_fixture(img,nested=True)
        h,_,_=scan_image(img)
        self.assertEqual(h[0].path,'LostFolder/lost.jpg')
        result=recover(img,h[0],self.p/'restore')
        self.assertTrue(Path(result['path']).is_file())
        self.assertTrue((self.p/'restore'/'LostFolder'/'lost.jpg').is_file())
    def test_partition_mbr(self):
        img=self.p/'mbr.img';ntfs_fixture(img,partition=True)
        h,p,_=scan_image(img)
        self.assertEqual(p[0].offset,1024*1024)
        self.assertEqual(h[0].name,'lost.jpg')
    def test_exfat_deleted_and_recover(self):
        img=self.p/'exfat.img';payload=exfat_fixture(img)
        h,parts,err=scan_image(img)
        self.assertFalse(err);self.assertEqual(parts[0].fs,'exFAT')
        self.assertEqual((h[0].name,h[0].state),('old.jpg','free'))
        r=recover(img,h[0],self.p/'out')
        self.assertEqual(Path(r['path']).read_bytes(),payload)
    def test_exfat_reallocated_blocked(self):
        img=self.p/'exfat.img';exfat_fixture(img,used=True)
        h,_,_=scan_image(img)
        self.assertEqual(h[0].state,'reallocated')
        with self.assertRaises(ValueError):recover(img,h[0],self.p/'out')
    def test_garbage_rejected(self):
        img=self.p/'junk.img';img.write_bytes(os.urandom(4096))
        with self.assertRaises(ValueError):scan_image(img)

if __name__=='__main__':unittest.main(verbosity=2)
