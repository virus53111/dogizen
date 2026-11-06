"""Synthetic ext4 images with real on-disk metadata layouts, no external mkfs."""
import os
import struct
import tempfile
import unittest
from pathlib import Path

from murdilimax_engine import scan_image, recover
from murdilimax_ext4 import Ext4Volume, probe_ext4
from murdilimax_crypto import detect_encryption_header, find_locked_volumes, locked_guidance

BS=4096

def pack_into(b,fmt,offset,*args):struct.pack_into(fmt,b,offset,*args)

def tree(extents,depth=0,pointer=0):
    b=bytearray(60)
    pack_into(b,'<HHHHI',0,0xF30A,1,len(b)//12-1,depth,0)
    if depth==0:
        logical,physical,length=extents[0]
        pack_into(b,'<IHHI',12,logical,length,(physical>>32)&0xffff,physical&0xffffffff)
    else:
        pack_into(b,'<IIHH',12,0,pointer&0xffffffff,pointer>>32,0)
    return b

def directory(entries):
    b=bytearray(BS)
    offset=0
    for i,(number,name,typ) in enumerate(entries):
        raw=name.encode('utf-8')
        reclen=(8+len(raw)+3)&~3
        if i==len(entries)-1:reclen=BS-offset
        pack_into(b,'<IHBB',offset,number,reclen,len(raw),typ)
        b[offset+8:offset+8+len(raw)]=raw
        offset+=reclen
    return b

def ext4_fixture(prefix=0):
    count=128
    image=bytearray(prefix+count*BS)
    vol=memoryview(image)[prefix:]
    sb=bytearray(1024)
    pack_into(sb,'<I',0,32) # inode count
    pack_into(sb,'<I',4,count) # blocks count
    pack_into(sb,'<I',0x14,0) # first data block
    pack_into(sb,'<I',0x18,2) # block size 4096
    pack_into(sb,'<I',0x20,128)
    pack_into(sb,'<I',0x28,32)
    pack_into(sb,'<H',0x38,0xef53)
    pack_into(sb,'<H',0x58,256)
    pack_into(sb,'<I',0x60,0x42) # extents + filetype
    vol[1024:2048]=sb
    desc=bytearray(32);pack_into(desc,'<I',8,5)
    vol[BS:BS+32]=desc
    def inode(number,kind,size,block,flags=0x80000,depth=0,external=0):
        record=bytearray(256)
        pack_into(record,'<H',0,kind)
        pack_into(record,'<I',4,size)
        pack_into(record,'<I',0x20,flags)
        record[0x28:0x64]=tree([(0,block,1)],depth,external)
        dest=5*BS+(number-1)*256
        vol[dest:dest+256]=record
    inode(2,0x41ED,BS,12)
    inode(12,0x81A4,10,30,depth=1,external=20)
    inode(13,0x41ED,BS,13)
    inode(14,0x81A4,12,31)
    inode(15,0x81A4,3*BS,32)
    inode(16,0x81A4,12,33,flags=0x80000|0x800)
    # inode 12 tree interior points at block 20, leaf at block 20
    t=bytearray(BS);t[:60]=tree([(0,30,1)])
    vol[20*BS:21*BS]=t
    vol[12*BS:13*BS]=directory([(2,'.',2),(2,'..',2),(12,'photo.jpg',1),(13,'folder',2),(15,'sparse.bin',1),(16,'locked.bin',1)])
    vol[13*BS:14*BS]=directory([(13,'.',2),(2,'..',2),(14,'readme.txt',1)])
    vol[30*BS:30*BS+10]=b'PHOTO-YES!'
    vol[31*BS:31*BS+12]=b'Hello World!'
    vol[32*BS:32*BS+BS]=b'Z'*BS
    # sparse.bin: hole after one cluster, extend extents to logical block 2
    iblock=5*BS+(15-1)*256+0x28
    head=bytearray(60);pack_into(head,'<HHHHI',0,0xf30a,2,4,0,0)
    pack_into(head,'<IHHI',12,0,1,0,32)
    pack_into(head,'<IHHI',24,2,1,0,34)
    vol[iblock:iblock+60]=head
    vol[34*BS:35*BS]=b'Y'*BS
    if prefix:
        # MBR Linux partition at sector 2048; EFI isn't required.
        pack_into(image,'<B',446+4,0x83)
        pack_into(image,'<II',446+8,prefix//512,count*BS//512)
        image[510:512]=b'\x55\xaa'
    return bytes(image)

class Ext4Stage4Tests(unittest.TestCase):
    def test_identify_direct_ext4(self):
        with tempfile.TemporaryFile() as f:
            img=ext4_fixture();f.write(img)
            self.assertEqual(probe_ext4(f,0,len(img)),128*BS)

    def test_identify_partitioned_ext4(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'disk.img';path.write_bytes(ext4_fixture(1024*1024))
            hits,parts,errors=scan_image(path)
            self.assertFalse(errors)
            self.assertEqual(parts[0].fs,'ext4')
            self.assertEqual(parts[0].offset,1024*1024)
            self.assertEqual({h.path for h in hits},{'photo.jpg','folder/readme.txt','sparse.bin'})
            self.assertTrue(all(not h.deleted for h in hits))

    def test_extract_existing_files_and_sparse(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'source.img';path.write_bytes(ext4_fixture())
            hits,parts,warnings=scan_image(path)
            self.assertEqual({h.name for h in hits},{'photo.jpg','readme.txt','sparse.bin'})
            dst=Path(d)/'out'
            for hit in hits:
                outcome=recover(path,hit,dst,allow_unknown=True)
                self.assertEqual(outcome['bytes'],hit.size)
            self.assertEqual((dst/'photo.jpg').read_bytes(),b'PHOTO-YES!')
            self.assertEqual((dst/'folder'/'readme.txt').read_bytes(),b'Hello World!')
            self.assertEqual((dst/'sparse.bin').read_bytes(),b'Z'*BS+bytes(BS)+b'Y'*BS)

    def test_missing_file_is_not_invented(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'source.img';path.write_bytes(ext4_fixture())
            candidates,*_=scan_image(path)
            self.assertFalse(any(c.deleted for c in candidates))
            self.assertFalse(any('locked' in c.path for c in candidates))

    def test_corrupt_ext4_header_fails(self):
        img=bytearray(ext4_fixture());img[1024+0x38:1024+0x3a]=b'\x00\x00'
        with tempfile.TemporaryFile() as f:
            f.write(img);self.assertIsNone(probe_ext4(f,0,len(img)))

    def test_corrupted_extent_does_not_escape(self):
        img=bytearray(ext4_fixture())
        # point a file extent beyond the filesystem (64-bit overflow not needed)
        pack_into(img,'<I',20*BS+12+8,10_000)
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'broken.img';p.write_bytes(img)
            candidates,*_=scan_image(p)
            self.assertNotIn('photo.jpg',{c.path for c in candidates})

    def test_encrypted_header_detection(self):
        self.assertEqual(detect_encryption_header(b'LUKS\xba\xbe\x00\x02'+bytes(512)),'LUKS2')
        self.assertEqual(detect_encryption_header(b'\xeb\x52\x90-FVE-FS-'+bytes(512)),'BitLocker')
        self.assertIsNone(detect_encryption_header(bytes(512)))

    def test_locked_volume_guide(self):
        img=b'LUKS\xba\xbe\x00\x02'+bytes(65536)
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'locked.img';p.write_bytes(img)
            with self.assertRaisesRegex(ValueError,'LUKS2'):
                scan_image(p,deep_partitions=False)
            with p.open('rb') as f:self.assertEqual(find_locked_volumes(f,len(img)),[(0,'LUKS2')])
        self.assertIn('does NOT decrypt',locked_guidance([(0,'LUKS2')]))

    def test_ext4_feature_rejects_bigalloc(self):
        img=bytearray(ext4_fixture())
        pack_into(img,'<I',1024+0x64,0x200)
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'bigalloc.img';p.write_bytes(img)
            with self.assertRaisesRegex(ValueError,'bigalloc'):
                from murdilimax_ext4 import Ext4Volume
                with p.open('rb') as fp:Ext4Volume(fp,__import__('murdilimax_engine').Partition(0,'ext4',len(img)),len(img))

if __name__=='__main__':unittest.main()
