"""Synthetic tests: no personal data and no physical disk accessed."""
from pathlib import Path
import tempfile
import unittest
import os
import struct
import zlib
from murdilimax_engine import scan_image, recover
from murdilimax_partitions import backup_gpt_partitions, find_lost_volumes
from murdilimax_raid import assemble
from murdilimax_devices import is_physical, open_source, destination_is_different_disk
from test_engine import ntfs_fixture, exfat_fixture


def _write_member(folder, name, chunks):
    p=folder/name;p.write_bytes(b''.join(chunks));return str(p)


class AdvancedTests(unittest.TestCase):
    def setUp(self):
        self.ctx=tempfile.TemporaryDirectory()
        self.addCleanup(self.ctx.cleanup)
        self.p=Path(self.ctx.name)

    def test_raid0_order(self):
        a=_write_member(self.p,'a.img',[b'A'*4096,b'C'*4096])
        b=_write_member(self.p,'b.img',[b'B'*4096,b'D'*4096])
        output=self.p/'combined.img'
        result=assemble([a,b],str(output),level=0,chunk=4096)
        self.assertEqual(output.read_bytes(),b'A'*4096+b'B'*4096+b'C'*4096+b'D'*4096)
        self.assertEqual(result['bytes'],16384)

    def test_raid1_copy_first_available(self):
        a=_write_member(self.p,'mirror.img',[b'X'*4096,b'Y'*4096])
        out=self.p/'result.img'
        assemble([None,a],str(out),1,4096)
        self.assertEqual(out.read_bytes(),Path(a).read_bytes())

    def test_raid5_missing_data_left_symmetric(self):
        n=3;stripes=3;chunk=4096
        members=[[] for _ in range(n)]
        expected=[]
        for stripe in range(stripes):
            p=(n-1-(stripe%n))%n
            data=[bytes([65+stripe*2+i])*chunk for i in range(n-1)]
            parity=bytes(x^y for x,y in zip(*data))
            for idx,b in enumerate(data):members[(p+1+idx)%n].append(b)
            members[p].append(parity)
            expected.extend(data)
        names=[_write_member(self.p,f'd{i}.img',blocks) for i,blocks in enumerate(members)]
        out=self.p/'recovered.img'
        assemble([names[0],None,names[2]],str(out),5,4096)
        self.assertEqual(out.read_bytes(),b''.join(expected))
        self.assertEqual(out.stat().st_size,stripes*(n-1)*chunk)

    def test_raid5_parity_validation(self):
        a=_write_member(self.p,'a.img',[b'A'*4096])
        b=_write_member(self.p,'b.img',[b'B'*4096])
        c=_write_member(self.p,'c.img',[b'C'*4096])
        with self.assertRaisesRegex(ValueError,'parity mismatch'):
            assemble([a,b,c],str(self.p/'bad.img'),5,4096,verify_parity=True)

    def test_lost_partition_discovery(self):
        file=self.p/'lost.img'
        ntfs_fixture(file,partition=True)
        raw=bytearray(file.read_bytes())
        raw[:512]=bytes(512)  # destroy MBR
        # Move the existing NTFS volume from 1 MiB to 3 MiB, away from the
        # small set of traditional locations probed without deep recovery.
        volume=raw[1024*1024:]
        raw=bytearray(3*1024*1024)+volume
        raw[3*1024*1024+510:3*1024*1024+512]=b'\x55\xaa'
        struct.pack_into('<Q',raw,3*1024*1024+40,4096)
        file.write_bytes(raw)
        hits,parts,warnings=scan_image(str(file),deep_partitions=True)
        self.assertEqual(parts[0].offset,3*1024*1024)
        self.assertEqual(parts[0].origin,'lost partition heuristic')
        self.assertEqual(hits[0].name,'lost.jpg')

    def test_salvage_deleted_record_when_mft0_corrupted(self):
        file=self.p/'mft_corrupt.img'
        ntfs_fixture(file)
        raw=bytearray(file.read_bytes())
        # Corrupt $MFT record zero but keep the deleted MFT record intact.
        raw[4*512:4*512+4]=b'BAD!'
        file.write_bytes(raw)
        with self.assertRaises(ValueError):scan_image(str(file))
        hits,parts,warnings=scan_image(str(file),salvage_mft=True)
        self.assertTrue(any(h.name=='lost.jpg' for h in hits))
        target=next(h for h in hits if h.name=='lost.jpg')
        self.assertEqual(target.state,'unknown')
        with self.assertRaises(ValueError):recover(file,target,self.p/'output')
        restored=recover(file,target,self.p/'output',allow_unknown=True)
        self.assertEqual(Path(restored['path']).stat().st_size,700)

    def test_backup_gpt_partition(self):
        file=self.p/'backup.img'
        ntfs_fixture(file,partition=True)
        raw=bytearray(file.read_bytes())
        sector=512;last=len(raw)//sector-1
        # destroy MBR while maintaining valid NTFS VBR at 1 MiB
        raw[:512]=bytes(512)
        entry=bytearray(128)
        entry[:16]=b'\x01'*16
        struct.pack_into('<QQ',entry,32,2048,4095)
        table=bytes(entry)+bytes(127*128)
        position=(last-32)*sector
        raw[position:position+len(table)]=table
        h=bytearray(512)
        h[:8]=b'EFI PART'
        struct.pack_into('<I',h,8,0x00010000)
        struct.pack_into('<I',h,12,92)
        struct.pack_into('<QQ',h,24,last,1)
        struct.pack_into('<QQ',h,40,34,last-33)
        struct.pack_into('<Q',h,72,last-32)
        struct.pack_into('<III',h,80,128,128,zlib.crc32(table)&0xffffffff)
        struct.pack_into('<I',h,16,zlib.crc32(h[:92])&0xffffffff)
        raw[last*sector:(last+1)*sector]=h
        file.write_bytes(raw)
        with open(file,'rb') as fp:
            found=backup_gpt_partitions(fp,len(raw))
        self.assertEqual(found[0][:2],(1024*1024,2048*512))
        hits,parts,warnings=scan_image(str(file))
        self.assertEqual(parts[0].origin,'backup GPT')
        self.assertEqual(hits[0].name,'lost.jpg')

    def test_ntfs_backup_boot_with_damaged_primary(self):
        image=self.p/'ntfs_backup.img'
        ntfs_fixture(image,partition=True)
        raw=bytearray(image.read_bytes())
        base=1024*1024
        boot=bytearray(raw[base:base+512])
        boot[510:512]=b'\x55\xaa'
        struct.pack_into('<Q',boot,40,4096)
        raw[base+4096*512-512:base+4096*512]=boot
        raw[base:base+512]=bytes(512)
        image.write_bytes(raw)
        hits,parts,warnings=scan_image(str(image))
        self.assertEqual(parts[0].origin,'MBR')
        self.assertEqual(parts[0].boot_offset,base+4096*512-512)
        self.assertEqual(hits[0].name,'lost.jpg')

    def test_exfat_backup_boot_with_corrupted_primary(self):
        image=self.p/'exfat_backup.img'
        exfat_fixture(image)
        raw=bytearray(image.read_bytes())
        boot=bytearray(raw[:512]);boot[510:512]=b'\x55\xaa'
        raw[12*512:13*512]=boot
        raw[:512]=bytes(512)
        image.write_bytes(raw)
        hits,parts,warnings=scan_image(str(image))
        self.assertEqual(parts[0].fs,'exFAT')
        self.assertEqual(parts[0].boot_offset,12*512)
        self.assertEqual(hits[0].name,'old.jpg')

    def test_physical_path_guard(self):
        self.assertTrue(is_physical(r'\\.\PhysicalDrive4'))
        self.assertFalse(is_physical('/tmp/image.dd'))
        self.assertFalse(is_physical(r'\\.\PhysicalDrive4\malicious'))
        self.assertTrue(destination_is_different_disk('/tmp/x.dd','/tmp/out'))

    def test_raid_disallows_overwrite(self):
        path=_write_member(self.p,'one.img',[b'1'*4096])
        other=_write_member(self.p,'two.img',[b'2'*4096])
        with self.assertRaises(ValueError):assemble([path,other],path,0,4096)

if __name__=='__main__':unittest.main(verbosity=2)
