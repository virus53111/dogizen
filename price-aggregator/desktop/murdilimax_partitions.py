"""Heuristic, read-only partition recovery from surviving boot sectors and backup GPT.

Partition detection does not modify disk contents; candidates are validated before use.
GPT backup support presently assumes 512 or 4096 byte logical sectors.
"""
from __future__ import annotations
import struct
import zlib
from typing import Callable


def _read_at(fp, offset, length, size):
    if offset<0 or offset+length>size: raise ValueError('Disk read outside source bounds')
    fp.seek(offset)
    raw=fp.read(length)
    if len(raw)!=length: raise IOError('Source truncated')
    return raw


def _vbr(fp, at, size, sector=512):
    if at<0 or at+512>size:return None
    # ext4 has no NTFS-style 0x55AA VBR signature. Inspect the superblock
    # at the partition's +1024 offset before applying VBR-specific checks.
    from murdilimax_ext4 import probe_ext4
    length=probe_ext4(fp,at,size)
    if length is not None:return ('ext4',length)
    buf=_read_at(fp,at,512,size)
    if buf[510:512]!=b'\x55\xaa':return None
    fs = 'NTFS' if buf[3:11]==b'NTFS    ' else 'exFAT' if buf[3:11]==b'EXFAT   ' else None
    if not fs:return None
    if fs=='NTFS':
        sector_size=struct.unpack_from('<H',buf,11)[0]
        sectors_per_cluster=buf[13]
        total_sectors=struct.unpack_from('<Q',buf,40)[0]
        mft_lcn=struct.unpack_from('<Q',buf,48)[0]
        valid=(sector_size in (512,1024,2048,4096) and sectors_per_cluster and sectors_per_cluster&(sectors_per_cluster-1)==0
               and total_sectors>16 and 0<mft_lcn<total_sectors//sectors_per_cluster)
        if not valid:return None
        volume_bytes=sector_size*total_sectors
    else:
        sector_shift=buf[108]
        cluster_shift=buf[109]
        volume_bytes=struct.unpack_from('<Q',buf,72)[0]*(1<<sector_shift) if 9<=sector_shift<=12 else 0
        cluster_count=struct.unpack_from('<I',buf,92)[0]
        heap_off=struct.unpack_from('<I',buf,88)[0]
        valid=(9<=sector_shift<=12 and 0<=cluster_shift<=15 and cluster_count>=2
                and heap_off and 1<=volume_bytes and heap_off*(1<<sector_shift)<volume_bytes)
        if not valid:return None
    if volume_bytes<512:return None
    # A truncated disk image can still hold a good surviving volume header.
    return (fs,min(volume_bytes,size-at))


def backup_gpt_partitions(fp,size,sector_sizes=(512,4096)):
    """Return (start,size,origin) for valid backup GPT entry arrays."""
    found=[]
    for sector in sector_sizes:
        if size<sector*40 or size%sector:continue
        lba=size//sector-1
        try:
            head=_read_at(fp,lba*sector,sector,size)
        except Exception:continue
        if head[:8]!=b'EFI PART':continue
        hsize=struct.unpack_from('<I',head,12)[0]
        if not 92<=hsize<=sector:continue
        saved_crc=struct.unpack_from('<I',head,16)[0]
        check=bytearray(head[:hsize]);check[16:20]=b'\0'*4
        if zlib.crc32(check)&0xffffffff!=saved_crc:continue
        if struct.unpack_from('<Q',head,24)[0]!=lba:continue
        location=struct.unpack_from('<Q',head,72)[0]
        count=struct.unpack_from('<I',head,80)[0]
        width=struct.unpack_from('<I',head,84)[0]
        crc=struct.unpack_from('<I',head,88)[0]
        if not (1<=count<=4096 and 128<=width<=1024 and width%8==0):continue
        byte_count=count*width
        if location*sector+byte_count>size or byte_count>4*1024*1024:continue
        entries=_read_at(fp,location*sector,byte_count,size)
        if zlib.crc32(entries)&0xffffffff!=crc:continue
        for index in range(count):
            item=entries[index*width:(index+1)*width]
            if not any(item[:16]):continue
            begin, end=struct.unpack_from('<QQ',item,32)
            if 0<begin<=end and (end+1)*sector<=size:
                found.append((begin*sector,(end-begin+1)*sector,'backup GPT'))
    return found


def find_lost_volumes(fp,size,known_offsets=None,probe_cap=5_000_000,progress:Callable|None=None):
    """Scan standard aligned starts without modifying the source.

    Checks first 16 MiB at 4 KiB, and entire source at 1 MiB. This is
    an informed heuristic, not a search of every sector alignment.
    """
    seen=set(known_offsets or [])
    results=[]
    if probe_cap<=0:return results
    first_offsets=range(0,min(size,16*1024*1024),4096)
    bulk_offsets=range(0,size,1024*1024)
    total=min(probe_cap,len(first_offsets)+len(bulk_offsets))
    done=0
    for offsets in (first_offsets,bulk_offsets):
        for at in offsets:
            if done>=probe_cap:return results
            done+=1
            if at in seen:continue
            seen.add(at)
            try: match=_vbr(fp,at,size)
            except (OSError,ValueError):continue
            if match:
                fs,length=match
                results.append((at,fs,length,'lost partition heuristic'))
            if progress and done%256==0: progress(done,total)
    return results
