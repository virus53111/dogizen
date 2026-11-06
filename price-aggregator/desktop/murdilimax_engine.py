#!/usr/bin/env python3
"""MURDILIMAX Recovery 0.3 — read-only NTFS/exFAT evidence-based recovery.

Supports images; optional Windows physical disks require administrator access. Unsupported cases are explicitly rejected.
Avoid use as a forensic reference without independent validation.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
import os, struct, math, json, hashlib, re
from typing import Callable
from murdilimax_devices import open_source, is_physical, destination_is_different_disk
from murdilimax_partitions import backup_gpt_partitions, find_lost_volumes

MAX_FILE = 64 * 1024**3
MAX_RECORDS = 1_000_000
MAX_CLUSTER = 1024 * 1024

class ScanCancelled(Exception):
    pass


def u16(b, p=0): return struct.unpack_from('<H', b, p)[0]
def u32(b, p=0): return struct.unpack_from('<I', b, p)[0]
def u64(b, p=0): return struct.unpack_from('<Q', b, p)[0]


@dataclass
class Partition:
    offset: int
    fs: str
    size: int
    origin: str = 'volume'
    boot_offset: int | None = None


@dataclass
class Candidate:
    fs: str
    name: str
    path: str
    size: int
    source_offset: int
    extents: list[tuple[int | None, int]] = field(default_factory=list)
    resident: bytes | None = None
    state: str = 'unknown'
    reason: str = ''
    deleted: bool = True
    is_dir: bool = False
    record_id: int = 0
    parent_id: int = 0
    compressed: bool = False

    @property
    def eligible(self):
        return not self.is_dir and self.state in ('free', 'unknown') and not self.compressed and self.size <= MAX_FILE and (self.resident is not None or bool(self.extents))

    @property
    def kind(self):
        lower = self.name.lower()
        if any(token in lower for token in ('wallet.dat','keystore','electrum','wallet-backup','wallet_backup','wallet.','wallet-','default_wallet','bitcoin-core','exodus','atomicwallet')):
            return 'Crypto backups'
        suffix = Path(lower).suffix
        if suffix in {'.jpg','.jpeg','.png','.gif','.bmp','.tif','.tiff','.heic','.webp'}: return 'Photos'
        if suffix in {'.mp4','.mov','.mkv','.avi','.webm'}: return 'Video'
        if suffix in {'.pdf','.doc','.docx','.xls','.xlsx','.txt','.ppt','.pptx','.odt'}: return 'Documents'
        if suffix in {'.zip','.7z','.rar','.gz','.tar'}: return 'Archives'
        return 'Other'

    def summary(self):
        return {'fs':self.fs,'name':self.name,'path':self.path,'bytes':self.size,'state':self.state,
                'recoverable':self.eligible,'reason':self.reason,'deleted':self.deleted,'kind':self.kind}


def read_at(fp, at, size, bound):
    if at < 0 or size < 0 or at+size > bound: raise ValueError('Read would exceed disk image')
    fp.seek(at)
    data=fp.read(size)
    if len(data) != size: raise EOFError('Truncated disk image')
    return data


def partition_list(fp, filesize):
    """Read standard partition tables, with limited backup-boot-sector recovery.

    Direct volumes and images with an intact primary VBR remain supported.
    Backups are only accepted at a partition boundary inferred from MBR/GPT.
    """
    candidates=[]
    sector_size=getattr(fp,'sector_size',512)
    if sector_size not in (512,4096): sector_size=512
    def detect(off):
        if off < 0 or off+512>filesize:return ''
        b=read_at(fp,off,512,filesize)
        return 'NTFS' if b[3:11]==b'NTFS    ' else 'exFAT' if b[3:11]==b'EXFAT   ' else ''
    def probe(off,length,how,allow_backup=True):
        if off < 0 or off+512>filesize:return
        if any(p.offset==off for p in candidates):return
        fs=detect(off)
        alt=None
        if not fs and allow_backup and length>24*512 and off+length<=filesize:
            for sector in (sector_size,512,4096):
                backup=off+length-sector
                if backup>off and detect(backup)=='NTFS':
                    fs='NTFS';alt=backup;break
            if not fs:
                for sector in (sector_size,512,4096):
                    backup=off+12*sector
                    if backup<off+length and detect(backup)=='exFAT':
                        fs='exFAT';alt=backup;break
        if fs:candidates.append(Partition(off,fs,min(length if length>0 else filesize-off,filesize-off),how,alt))
    probe(0,filesize,'direct volume',False)
    if filesize>=512:
        sector0=read_at(fp,0,512,filesize)
        if sector0[510:512]==b'\x55\xaa':
            for i in range(4):
                e=sector0[446+i*16:462+i*16]
                start=u32(e,8);n=u32(e,12)
                if start and n and start*sector_size<filesize:
                    probe(start*sector_size,n*sector_size,'MBR')
            if filesize>=sector_size*2:
                h=read_at(fp,sector_size,512,filesize)
                if h[:8]==b'EFI PART':
                    entries_lba=u64(h,72);count=min(u32(h,80),256);entrysize=u32(h,84)
                    if 128<=entrysize<=1024 and entries_lba*sector_size+count*entrysize<=filesize:
                        for i in range(count):
                            e=read_at(fp,entries_lba*sector_size+i*entrysize,56,filesize)
                            if not any(e[:16]):continue
                            start=u64(e,32);end=u64(e,40)
                            if end>=start:probe(start*sector_size,(end-start+1)*sector_size,'GPT')
    if not candidates and filesize>=512 and read_at(fp,0,512,filesize)==bytes(512):
        probe(0,filesize,'direct backup boot')
    if not candidates:
        for off in (512,4096,1024*1024,2*1024*1024,4*1024*1024,8*1024*1024):
            probe(off,filesize-off,'heuristic boot sector')
    return candidates


def fixup(record, sector):
    b=bytearray(record)
    if b[:4]!=b'FILE': raise ValueError('Invalid MFT record signature')
    usa=u16(b,4); count=u16(b,6)
    if usa+count*2>len(b) or count!=len(b)//sector+1: raise ValueError('Invalid update sequence')
    marker=b[usa:usa+2]
    for i in range(1,count):
        pos=i*sector-2
        if b[pos:pos+2]!=marker: raise ValueError('MFT fixup mismatch')
        b[pos:pos+2]=b[usa+i*2:usa+i*2+2]
    return bytes(b)


def attributes(record):
    start=u16(record,20); used=min(u32(record,24),len(record))
    if start<24 or start>=used: return
    pos=start
    while pos+16<=used:
        typ=u32(record,pos)
        if typ==0xffffffff: break
        length=u32(record,pos+4)
        if length<24 or pos+length>used: break
        raw=record[pos:pos+length]; nonresident=raw[8]
        if not nonresident:
            size=u32(raw,16); begin=u16(raw,20)
            if begin+size <= len(raw): yield typ,raw[begin:begin+size],False,raw
        else: yield typ,None,True,raw
        pos+=length


def parse_runs(attr, cluster_size, vol_offset, image_size):
    off=u16(attr,32)
    if off<64 or off>=len(attr): raise ValueError('Invalid NTFS data run offset')
    out=[]; lcn=0
    for _ in range(2_000_000):
        if off>=len(attr): raise ValueError('Unterminated data runs')
        token=attr[off];off+=1
        if token==0: return out
        lenbytes=token&0xf; offbytes=token>>4
        if lenbytes<1 or lenbytes>8 or offbytes>8 or off+lenbytes+offbytes>len(attr): raise ValueError('Malformed NTFS data runs')
        count=int.from_bytes(attr[off:off+lenbytes],'little');off+=lenbytes
        delta=int.from_bytes(attr[off:off+offbytes],'little',signed=True) if offbytes else 0
        off+=offbytes
        if count==0 or count*cluster_size>MAX_FILE: raise ValueError('Oversized NTFS data run')
        if offbytes:
            lcn+=delta
            if lcn<0: raise ValueError('Negative LCN')
            physical=vol_offset+lcn*cluster_size
            if physical+count*cluster_size>image_size: raise ValueError('Data run beyond image')
        else:physical=None
        out.append((physical,count*cluster_size))
    raise ValueError('Excessive NTFS data runs')


def stream_read(fp, extents, pos, size, image_size):
    if pos<0 or size<0: raise ValueError('Invalid stream offset')
    result=bytearray();skip=pos
    for off, length in extents:
        if skip>=length: skip-=length;continue
        amount=min(size-len(result),length-skip)
        if off is None:result.extend(b'\0'*amount)
        else:result.extend(read_at(fp,off+skip,amount,image_size))
        skip=0
        if len(result)==size:break
    if len(result)!=size:raise ValueError('Stream truncated')
    return bytes(result)


def stream_segments(attr, cluster_size, vol_offset, imagesize):
    runs=parse_runs(attr,cluster_size,vol_offset,imagesize)
    size=u64(attr,48)
    if size>MAX_FILE:raise ValueError('Data stream exceeds supported max file size')
    return runs,size


def read_attr(fp, attr, cluster, part, image_size, maxbytes=16*1024*1024):
    runs,length=stream_segments(attr,cluster,part,image_size)
    if length>maxbytes:raise ValueError('Attribute exceeds safe metadata limit')
    return stream_read(fp,runs,0,length,image_size)


def ntfs_scan(fp, part:Partition, image_size:int, limit:int=MAX_RECORDS, progress:Callable|None=None):
    boot=read_at(fp,part.boot_offset if part.boot_offset is not None else part.offset,512,image_size)
    sec=u16(boot,11);spc=boot[13]
    if sec not in (512,1024,2048,4096) or spc==0 or (spc & (spc-1)):raise ValueError('Unsupported NTFS sector or cluster size')
    cluster=sec*spc
    if cluster>MAX_CLUSTER:raise ValueError('Unsupported NTFS cluster size')
    signed=struct.unpack_from('<b',boot,64)[0]
    recordsize=(1<<(-signed)) if signed<0 else signed*cluster
    if recordsize<512 or recordsize>4096 or recordsize%sec: raise ValueError('Invalid NTFS MFT record size')
    mft=part.offset+u64(boot,48)*cluster
    rec0=fixup(read_at(fp,mft,recordsize,image_size),sec)
    mftdata=None
    for typ,val,nr,raw in attributes(rec0):
        if typ==0x80 and not raw[9] and nr: mftdata=raw;break
    if mftdata is None:raise ValueError('MFT data stream missing')
    mft_extents, mft_bytes=stream_segments(mftdata,cluster,part.offset,image_size)
    count=min(limit,mft_bytes//recordsize)
    records={};candidates=[];bitmap_attr=None
    for i in range(count):
        try:
            rec=fixup(stream_read(fp,mft_extents,i*recordsize,recordsize,image_size),sec)
        except (ValueError,EOFError):continue
        in_use=bool(u16(rec,22)&1);dirflag=bool(u16(rec,22)&2)
        best=None; best_ns=-1; data=None
        for typ,value,nr,raw in attributes(rec):
            if typ==0x30 and not nr and len(value)>=66:
                namelen=value[64];ns=value[65]
                if 66+namelen*2<=len(value) and ns in (0,1,2,3) and (3 if ns in (1,3) else 1)>best_ns:
                    name=value[66:66+namelen*2].decode('utf-16le','replace')
                    best=(name,u64(value,0));best_ns=3 if ns in (1,3) else 1
            if typ==0x80 and raw[9]==0:
                data=(value,nr,raw)
        if i==6 and data and data[1]:bitmap_attr=data[2]
        if best:records[i]=(best[0],best[1],u16(rec,16))
        if in_use or data is None or not best or best[0].startswith('$') or dirflag:continue
        val,nr,raw=data
        try:
            if nr:
                extents,size=stream_segments(raw,cluster,part.offset,image_size)
                resident=None
            else:
                extents=[];resident=val;size=len(val)
            unsupported=bool(u16(raw,12)&0x4001) # encrypted/compressed
            reason='Compressed or encrypted NTFS stream not supported' if unsupported else ''
            candidates.append(Candidate('NTFS',best[0],best[0],size,part.offset,extents,resident,'unknown',reason,True,False,i,best[1],unsupported))
        except (ValueError,EOFError):continue
        if progress and i%1024==0:progress(i,max(1,count))
    def make_path(parent_reference,name):
        # NTFS parent references include a 16-bit sequence number. When the
        # MFT slot has been reused, do not attach an old file to a new parent.
        chain=[name];seen=set();reference=parent_reference
        while len(chain)<64:
            parent=reference & 0xffffffffffff
            expected_sequence=reference >> 48
            if parent==5 or parent in seen or parent not in records:break
            seen.add(parent)
            parname,next_ref,actual_sequence=records[parent]
            if expected_sequence and expected_sequence!=actual_sequence:break
            if parname and parname!='.':chain.append(parname)
            reference=next_ref
        return '/'.join(reversed(chain))
    for c in candidates:c.path=make_path(c.parent_id,c.name)
    # Check each candidate's cluster allocation from $Bitmap: reallocated data is not recovered.
    if bitmap_attr is not None:
        try:
            bitmap_runs, bitmap_length=stream_segments(bitmap_attr,cluster,part.offset,image_size)
            cache={}
            def is_allocated(lcn):
                byte=lcn//8
                if byte>=bitmap_length:return None
                page=byte//4096
                if page not in cache:
                    if len(cache)>64:cache.clear()
                    cache[page]=stream_read(fp,bitmap_runs,page*4096,min(4096,bitmap_length-page*4096),image_size)
                return bool(cache[page][byte%4096] & (1 << (lcn%8)))
            for c in candidates:
                if c.resident is not None:c.state='free';continue
                examined=0;reuse=False;unknown=False
                for off,length in c.extents:
                    if off is None:unknown=True;continue
                    lcn=(off-part.offset)//cluster
                    for idx in range(min(math.ceil(length/cluster),8193)):
                        if examined>=8192:unknown=True;break
                        allocated=is_allocated(lcn+idx)
                        if allocated is None:unknown=True
                        elif allocated:reuse=True;break
                        examined+=1
                    if reuse:break
                c.state='reallocated' if reuse else 'unknown' if unknown else 'free'
                if reuse:c.reason='Some clusters now allocated to other files — automated recovery blocked'
                elif unknown and not c.reason:c.reason='Allocation check incomplete; verify content'
        except (ValueError,EOFError):
            for c in candidates:c.reason=c.reason or 'NTFS allocation map could not be parsed'
    return candidates


def exfat_scan(fp,part:Partition,image_size:int,limit:int=100000,progress:Callable|None=None):
    boot=read_at(fp,part.boot_offset if part.boot_offset is not None else part.offset,512,image_size)
    if boot[3:11]!=b'EXFAT   ':raise ValueError('Invalid exFAT header')
    shift=boot[108];clushift=boot[109]
    if shift not in (9,10,11,12) or clushift>17: raise ValueError('Invalid exFAT sector/cluster size')
    sector=1<<shift;cluster=sector*(1<<clushift)
    if cluster>32*1024*1024:raise ValueError('Unsupported exFAT cluster size')
    fat_off=u32(boot,80)*sector;heap_off=u32(boot,88)*sector;count=u32(boot,92);root=u32(boot,96)
    if count==0 or count>2**31 or not(2<=root<count+2):raise ValueError('Invalid exFAT cluster metadata')
    def cluster_off(c):
        if not 2<=c<count+2:raise ValueError('exFAT cluster out of bounds')
        off=part.offset+heap_off+(c-2)*cluster
        if off+cluster>image_size:raise ValueError('exFAT cluster exceeds image')
        return off
    def fat_next(c):
        off=part.offset+fat_off+c*4
        return u32(read_at(fp,off,4,image_size))
    def chain(first,max_clusters=4096):
        seen=set();p=first
        while 2<=p<count+2 and p not in seen and len(seen)<max_clusters:
            seen.add(p);yield p
            nxt=fat_next(p)
            if nxt>=0xfffffff8 or nxt==0:break
            p=nxt
    def directory(first):
        # Limit directory size to avoid enormous memory allocations.
        for c in chain(first,max_clusters=min(1024, max(1,64*1024*1024//cluster))):
            data=read_at(fp,cluster_off(c),cluster,image_size)
            for index in range(0,len(data),32):yield data[index:index+32]
    # Allocate bitmap metadata from active root directory.
    root_records=list(directory(root))
    bitmap_extent=None
    for e in root_records:
        if e and e[0] in (0x81,):
            first=u32(e,20);length=u64(e,24)
            if 2<=first<count+2 and length>0:bitmap_extent=(first,length)
            break
    # The exFAT bitmap may span noncontiguous FAT-linked clusters.
    bitmap_clusters=[]
    if bitmap_extent is not None:
        first,byte_length=bitmap_extent
        need=(byte_length+cluster-1)//cluster
        if 0<need<=min(2_000_000,count):
            bitmap_clusters=list(chain(first,max_clusters=need))
            if len(bitmap_clusters)!=need:bitmap_clusters=[]
    bitmap_cache={}
    def used_cluster(c):
        if not 2<=c<count+2 or not bitmap_clusters:return None
        byte=(c-2)//8
        if byte>=bitmap_extent[1]:return None
        chain_index=byte//cluster
        if chain_index>=len(bitmap_clusters):return None
        off=cluster_off(bitmap_clusters[chain_index])+(byte%cluster)
        if off not in bitmap_cache:
            if len(bitmap_cache)>512:bitmap_cache.clear()
            bitmap_cache[off]=read_at(fp,off,1,image_size)[0]
        return bool(bitmap_cache[off] & (1<<((c-2)%8)))
    from collections import deque
    out=[];dirs=deque([(root,'',False)]);seen_dirs=set()
    while dirs and len(out)<limit:
        first,prefix,parent_deleted=dirs.popleft()
        if first in seen_dirs:continue
        seen_dirs.add(first)
        entries=root_records if first==root else list(directory(first))
        idx=0
        while idx<len(entries) and len(out)<limit:
            e=entries[idx];idx+=1
            if not e:continue
            typ=e[0]
            if typ not in (0x85,0x05):continue
            n=e[1]
            if n<2 or n>18 or idx+n>len(entries):continue
            sec=entries[idx:idx+n];idx+=n
            stream=next((x for x in sec if x[0] in (0xC0,0x40)),None)
            if stream is None:continue
            count_name=stream[3]
            rawname=b''.join(x[2:32] for x in sec if x[0] in (0xC1,0x41))[:count_name*2]
            if len(rawname)!=count_name*2:continue
            name=rawname.decode('utf-16le','replace')
            if not name or '/' in name or '\\' in name:continue
            attr=u16(e,4);dirflag=bool(attr&0x10); deleted=(typ==0x05)
            length=u64(stream,24);firstcl=u32(stream,20);contiguous=bool(stream[1]&2)
            path=prefix+'/'+name if prefix else name
            if dirflag and 2<=firstcl<count+2 and len(seen_dirs)<4096:
                # Avoid reused deleted directories; inspect their surviving
                # first cluster only if the bitmap confirms it is free.
                if not deleted:dirs.append((firstcl,path,parent_deleted))
                elif used_cluster(firstcl) is False:dirs.append((firstcl,path,True))
            if (not deleted and not parent_deleted) or dirflag or length>MAX_FILE:continue
            if not length:
                extents=[];state='free';why='Empty file'
            else:
                required=math.ceil(length/cluster)
                if required>100000:
                    out.append(Candidate('exFAT',name,path,length,part.offset,[],None,'unsupported','Too many clusters for alpha'));continue
                if firstcl<2 or (firstcl+required>count+2 and contiguous):continue
                clusters=[]
                if contiguous:clusters=list(range(firstcl,firstcl+required))
                else:
                    clusters=list(chain(firstcl,max_clusters=min(required,100000)))
                    if len(clusters)<required:
                        out.append(Candidate('exFAT',name,path,length,part.offset,[],None,'unsupported','FAT chain missing or overwritten',True,False));continue
                    clusters=clusters[:required]
                extents=[(cluster_off(c),cluster) for c in clusters]
                checked=clusters[:8192]
                st=[used_cluster(c) for c in checked]
                state='reallocated' if True in st else 'unknown' if None in st or len(clusters)>8192 else 'free'
                why='Cluster bitmap indicates reuse' if state=='reallocated' else 'Allocation status incomplete' if state=='unknown' else ''
            if not deleted and parent_deleted:
                why=(why+'; ' if why else '')+'Record from deleted directory; metadata unverified'
                if state=='free':state='unknown'
            out.append(Candidate('exFAT',name,path,length,part.offset,extents,None,state,why,True,False))
        if progress:progress(len(seen_dirs),len(seen_dirs)+len(dirs))
    return out


def scan_image(image_path, limit=100000, progress=None, deep_partitions=False, probe_cap=5_000_000, salvage_mft=False):
    path=str(image_path)
    if not is_physical(path) and not Path(path).is_file():
        raise FileNotFoundError(path)
    found=[];errors=[]
    with open_source(path) as (fp,filesize):
        if filesize<512:raise ValueError('Source too small')
        parts=partition_list(fp,filesize)
        # Recover partition metadata from a validated backup GPT if present.
        known={p.offset for p in parts}
        for start,length,origin in backup_gpt_partitions(fp,filesize):
            if start in known:
                for existing in parts:
                    if existing.offset==start and existing.origin=='heuristic boot sector':
                        existing.origin='backup GPT'
                continue
            raw=read_at(fp,start,512,filesize)
            fs='NTFS' if raw[3:11]==b'NTFS    ' else 'exFAT' if raw[3:11]==b'EXFAT   ' else ''
            if fs:
                parts.append(Partition(start,fs,length,origin));known.add(start)
        if deep_partitions or not parts:
            for start,fs,length,origin in find_lost_volumes(fp,filesize,known,probe_cap,progress):
                if start not in known:
                    parts.append(Partition(start,fs,length,origin));known.add(start)
        if not parts:
            raise ValueError('No supported NTFS/exFAT volume found. Try file carving on an image.')
        for part in parts:
            try:
                entries=(ntfs_scan if part.fs=='NTFS' else exfat_scan)(fp,part,filesize,limit,progress)
                found.extend(entries)
            except (ValueError,EOFError,OSError) as exc:
                if part.fs=='NTFS' and salvage_mft:
                    try:
                        from murdilimax_salvage import salvage_mft as _salvage
                        recovered=_salvage(fp,part,filesize,progress=progress)
                        found.extend(recovered)
                        errors.append(f'Primary MFT unavailable at {part.offset}; salvage scanned surviving records: {len(recovered)} candidates; allocation unverified')
                        continue
                    except (ValueError,EOFError,OSError) as rescue_error:
                        errors.append(f'NTFS salvage failed @ {part.offset}: {rescue_error}')
                errors.append(f'{part.fs} @ {part.offset}: {exc}')
    if not found and errors:raise ValueError('; '.join(errors))
    return found,parts,errors


def recover(fp_path, candidate:Candidate, destination, allow_unknown=False, cancel=None, progress=None):
    """Copy recovered content to a *new* file. Block known reallocated data."""
    if not candidate.eligible: raise ValueError(f'Candidate not safely recoverable: {candidate.reason or candidate.state}')
    if candidate.state=='unknown' and not allow_unknown:
        raise ValueError('Allocation status unknown. Explicitly confirm recovery with --allow-unknown.')
    physical=is_physical(str(fp_path))
    src=str(fp_path) if physical else Path(fp_path).resolve()
    dst=Path(destination).resolve()
    if not physical and (dst==src or dst==src.parent):raise ValueError('Output must not overwrite source image')
    if physical and not destination_is_different_disk(str(fp_path),str(dst)):
        raise ValueError('Destination physical disk could not be verified as different from source. Recovery blocked.')
    dst.mkdir(parents=True,exist_ok=True)
    parts=[re.sub(r'[^\w.()\- ]','_',p).strip(' .')[:130] for p in candidate.path.replace('\\','/').split('/') if p not in ('','.','..')]
    parts=[p for p in parts if p]
    if not parts:parts=['recovered.bin']
    base=dst.joinpath(*parts[:-1])
    base.mkdir(parents=True,exist_ok=True)
    if base.resolve()!=dst and dst not in base.resolve().parents:
        raise ValueError('Output path escapes destination')
    name=parts[-1]
    target=base/name
    num=1
    while target.exists():
        target=base/f'{Path(name).stem}-{num}{Path(name).suffix}';num+=1
    copied=0; digest=hashlib.sha256()
    with open_source(str(src)) as (fp,image_size), target.open('xb') as out:
        try:
            remaining=candidate.size
            if cancel is not None and cancel():raise ScanCancelled('Recovery cancelled')
            if candidate.resident is not None:
                b=candidate.resident[:remaining];out.write(b);digest.update(b);remaining-=len(b)
                if progress is not None:progress(candidate.size-remaining,candidate.size)
            else:
                for off,length in candidate.extents:
                    if remaining<=0:break
                    n=min(length,remaining)
                    while n:
                        if cancel is not None and cancel():raise ScanCancelled('Recovery cancelled')
                        size=min(n,1024*1024)
                        if off is None:b=b'\0'*size
                        else:b=read_at(fp,off,size,image_size);off+=size
                        out.write(b);digest.update(b);n-=size;remaining-=size
                        if progress is not None:progress(candidate.size-remaining,candidate.size)
            if remaining:raise IOError(f'Missing {remaining} bytes from data runs')
        except Exception:
            out.close();target.unlink(missing_ok=True);raise
    return {'path':str(target),'bytes':candidate.size,'sha256':digest.hexdigest(),'state':candidate.state}


def main():
    import argparse
    cli=argparse.ArgumentParser(description='MURDILIMAX Recovery 0.3 · NTFS/exFAT image/physical source reader. Source stays read-only.')
    cli.add_argument('image',help='Raw disk image (.img/.dd) or explicit \\\\.\\PhysicalDriveN path on Windows')
    cli.add_argument('--deep-partitions',action='store_true',help='Search aligned locations for lost NTFS/exFAT volume boot sectors')
    cli.add_argument('--salvage-mft',action='store_true',help='When primary MFT cannot be parsed, search for surviving deleted MFT records (allocation status unknown)')
    cli.add_argument('--report',help='Write JSON scan report to this path')
    cli.add_argument('--max-records',type=int,default=100000)
    cli.add_argument('--recover',nargs='*',type=int,help='Zero-based candidate indices to recover')
    cli.add_argument('--destination',help='Folder on another physical drive')
    cli.add_argument('--allow-unknown',action='store_true',help='Allow files whose cluster allocation could not be checked')
    args=cli.parse_args()
    candidates,volumes,errors=scan_image(args.image,max(1,min(MAX_RECORDS,args.max_records)),deep_partitions=args.deep_partitions,salvage_mft=args.salvage_mft)
    print(f'Volumes: {len(volumes)}; Deleted file candidates: {len(candidates)}')
    for idx,c in enumerate(candidates):
        print(f'{idx:5} {c.fs:5} {c.state:12} {c.size:>12,} {c.path}')
    if errors:
        for err in errors:print('WARN:',err)
    if args.report:
        Path(args.report).write_text(json.dumps({'volumes':[v.__dict__ for v in volumes],'candidates':[c.summary() for c in candidates],'warnings':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    if args.recover is not None:
        if not args.destination:cli.error('--destination is required when recovering')
        for i in args.recover:
            if i<0 or i>=len(candidates):print('INVALID ID:',i);continue
            try:print('RESTORED:',recover(args.image,candidates[i],args.destination,args.allow_unknown))
            except Exception as exc:print('SKIPPED:',i,exc)

if __name__=='__main__':main()
