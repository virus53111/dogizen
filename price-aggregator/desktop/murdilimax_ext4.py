"""Read-only ext4 filesystem explorer for intact extent-backed regular files.

Stage 4: extract *existing* ext4 files from raw images (direct/MBR/GPT volumes).
NO journal replay, fscrypt decryption, legacy pointer maps or ext4 undelete.
All block references are checked against the partition and image boundaries.
"""
from __future__ import annotations

from collections import deque
import math
import struct
from typing import Callable

from murdilimax_engine import Candidate, MAX_FILE, Partition, read_at


def u16(b, off=0): return struct.unpack_from('<H', b, off)[0]
def u32(b, off=0): return struct.unpack_from('<I', b, off)[0]


# Unsupported superblock incompatibilities: encryption may coexist with
# plaintext directories; those directories are allowed only if inode plaintext.
# inline_data, bigalloc, meta_bg, 64k block size cannot be interpreted safely.
INCOMPAT_REJECT = 0x0010 | 0x8000 | 0x0008 | 0x1000
RO_REJECT = 0x0200  # BIGALLOC
MAX_TREE_DEPTH = 2
MAX_DIRECTORY_BYTES = 64 * 1024 * 1024
MAX_FILE_EXTENTS = 100_000


def probe_ext4(fp, offset: int, image_size: int) -> int | None:
    """Return advertised filesystem length if valid, otherwise None.

    This is a conservative magic + geometry test, not an integrity check.
    """
    if offset < 0 or offset + 2048 > image_size:
        return None
    try:
        sb = read_at(fp, offset + 1024, 1024, image_size)
        if u16(sb, 0x38) != 0xEF53: return None
        log_block = u32(sb, 0x18)
        if log_block > 6: return None
        block_size = 1024 << log_block
        blocks = u32(sb, 0x04)
        if u32(sb, 0x60) & 0x80: blocks |= u32(sb, 0x150) << 32
        inodes = u32(sb, 0)
        bpg = u32(sb, 0x20); ipg = u32(sb, 0x28)
        if not (2 <= blocks <= 2**48 and 2 <= inodes <= 2**32 and 1 <= bpg <= 2**32 and 1 <= ipg <= 2**32): return None
        if block_size not in (1024, 2048, 4096): return None
        if not (128 <= u16(sb, 0x58) <= block_size): return None
        volume_len = blocks * block_size
        # Truncated images are supported by limiting the advertised extent.
        if volume_len < 4*block_size or volume_len > 2**63:return None
        return min(volume_len, image_size - offset)
    except (ValueError, EOFError, struct.error): return None


class Ext4Volume:
    def __init__(self, fp, partition: Partition, image_size: int):
        self.fp, self.part, self.size = fp, partition, image_size
        self.bound = min(image_size, partition.offset+partition.size)
        sb = self.read(1024,1024)
        if u16(sb,0x38)!=0xEF53:raise ValueError('Not an ext4 superblock')
        self.block = 1024 << u32(sb,0x18)
        if self.block not in (1024,2048,4096):raise ValueError('Unsupported ext4 block size')
        self.block_count = u32(sb,4)
        self.incompat = u32(sb,0x60)
        if self.incompat & 0x80:self.block_count |= u32(sb,0x150) << 32
        if self.incompat & INCOMPAT_REJECT:raise ValueError('Unsupported ext4 metadata layout/features')
        if u32(sb,0x64) & RO_REJECT:raise ValueError('ext4 bigalloc is not yet supported')
        self.inode_count=u32(sb,0)
        self.blocks_per_group=u32(sb,0x20)
        self.inodes_per_group=u32(sb,0x28)
        self.inode_size=u16(sb,0x58)
        self.first=u32(sb,0x14)
        self.group_count=math.ceil(self.block_count/self.blocks_per_group) if self.blocks_per_group else 0
        self.desc_size=u16(sb,0xfe) if self.incompat & 0x80 else 32
        if not (128<=self.inode_size<=self.block and self.inode_size%4==0 and self.inodes_per_group>0 and 32<=self.desc_size<=self.block and self.desc_size%8==0 and 1<=self.group_count<=2_000_000):
            raise ValueError('Invalid ext4 metadata geometry')
        if self.inode_count > self.group_count * self.inodes_per_group:raise ValueError('Inode count exceeds filesystem geometry')
        self.desc_offset=(self.first+1)*self.block
        self._desc_cache={}

    def read(self, local_offset: int, n: int) -> bytes:
        absolute=self.part.offset+local_offset
        if local_offset<0 or n<0 or absolute+n>self.bound:raise ValueError('ext4 read outside volume/image')
        return read_at(self.fp,absolute,n,self.size)

    def block_read(self,b: int) -> bytes:
        if not 0<=b<self.block_count:raise ValueError('ext4 block number outside filesystem')
        return self.read(b*self.block,self.block)

    def inode(self,num: int) -> bytes:
        if not 1<=num<=self.inode_count:raise ValueError('Invalid ext4 inode')
        group=(num-1)//self.inodes_per_group
        idx=(num-1)%self.inodes_per_group
        if group not in self._desc_cache:
            loc=self.desc_offset+group*self.desc_size
            desc=self.read(loc,self.desc_size)
            table=u32(desc,8)
            if self.incompat & 0x80 and len(desc)>=0x2c:table|=u32(desc,0x28)<<32
            if table<=0 or table>=self.block_count:raise ValueError('Bad ext4 inode table block')
            if len(self._desc_cache)>256:self._desc_cache.clear()
            self._desc_cache[group]=table
        table=self._desc_cache[group]
        return self.read(table*self.block+idx*self.inode_size,self.inode_size)

    def inode_segments(self,inode: bytes, max_size: int=MAX_FILE) -> tuple[list[tuple[int|None,int]], int]:
        # i_size_high holds upper 32 bits of regular file length.
        size=u32(inode,4) | (u32(inode,0x6c)<<32)
        if size>max_size:raise ValueError('Ext4 file too large')
        flags=u32(inode,0x20)
        if flags & (0x10000000 | 0x800):raise ValueError('Encrypted or inline ext4 inode is unsupported')
        if not flags & 0x80000:raise ValueError('Legacy ext4 block-pointer inode is unsupported')
        if flags & 0x4:raise ValueError('Compressed ext4 inode unsupported')
        extents=[];seen=set()
        def visit(node:bytes, expected_depth:int|None=None):
            if len(node)<12 or u16(node,0)!=0xf30a:raise ValueError('Invalid ext4 extent header')
            count,maximum,depth=u16(node,2),u16(node,4),u16(node,6)
            if depth>MAX_TREE_DEPTH or (expected_depth is not None and depth!=expected_depth):raise ValueError('Invalid ext4 tree depth')
            if maximum==0 or count>maximum or 12+count*12>len(node):raise ValueError('Invalid ext4 extent entries')
            for i in range(count):
                off=12+12*i
                logical=u32(node,off)
                if depth:
                    leaf=u32(node,off+4) | (u16(node,off+8)<<32)
                    if leaf in seen:raise ValueError('Cyclic ext4 extent tree')
                    seen.add(leaf)
                    visit(self.block_read(leaf),depth-1)
                else:
                    encoded=u16(node,off+4)
                    length=encoded if encoded<=32768 else encoded-32768
                    if length<=0:raise ValueError('Invalid extent length')
                    start=u32(node,off+8) | (u16(node,off+6)<<32)
                    if not 0<start<self.block_count or start+length>self.block_count:raise ValueError('Data extent exceeds ext4 filesystem')
                    extents.append((logical,start,length,encoded>32768))
                    if len(extents)>MAX_FILE_EXTENTS:raise ValueError('Too many extents')
        visit(inode[0x28:0x64])
        extents.sort()
        result=[];position=0
        for logical,start,length,unwritten in extents:
            byte_at=logical*self.block
            byte_end=byte_at+length*self.block
            if byte_at<position:raise ValueError('Overlapping ext4 extents')
            if byte_at>=size:break
            if byte_at>position:
                hole=min(byte_at,size)-position;result.append((None,hole));position+=hole
            span=min(byte_end,size)-position
            if span>0:
                result.append((None if unwritten else self.part.offset+start*self.block,span))
                position+=span
        if position<size:result.append((None,size-position))
        return result,size

    def list_dir(self,inode:bytes):
        size=u32(inode,4)
        if size>MAX_DIRECTORY_BYTES:raise ValueError('Directory exceeds safe limit')
        extents, size=self.inode_segments(inode,MAX_DIRECTORY_BYTES)
        seen=0
        for off,length in extents:
            # Parse per filesystem block; entries never straddle blocks.
            if off is None:continue
            remaining=length
            while remaining>0:
                actual=min(self.block,remaining)
                data=read_at(self.fp,off,actual,self.size)
                pos=0
                while pos+8<=len(data):
                    ino,rec_len=struct.unpack_from('<IH',data,pos)
                    name_len=data[pos+6]
                    if rec_len<8 or rec_len%4 or pos+rec_len>len(data):break
                    if ino and 0<name_len<=255 and 8+name_len<=rec_len:
                        raw=data[pos+8:pos+8+name_len]
                        name=raw.decode('utf-8','replace')
                        if name not in ('.','..') and name and '/' not in name and '\\' not in name:
                            yield ino,name
                            seen+=1
                            if seen>100_000:raise ValueError('Too many entries in one directory')
                    pos+=rec_len
                off+=actual;remaining-=actual


def ext4_scan(fp,part:Partition,image_size:int,limit:int=100000,progress:Callable|None=None):
    """Return active regular files; deleted ext4 files are NOT discovered here."""
    volume=Ext4Volume(fp,part,image_size)
    root=volume.inode(2)
    if (u16(root,0)&0xf000)!=0x4000:raise ValueError('ext4 root directory missing')
    queue=deque([(2,'',0)]);seen_dirs=set();out=[];count=0
    while queue and len(out)<limit:
        num,prefix,depth=queue.popleft()
        if num in seen_dirs:continue
        seen_dirs.add(num)
        if depth>32:continue
        try:entries=volume.list_dir(volume.inode(num))
        except (ValueError,EOFError):continue
        try:
            for ino,name in entries:
                if len(out)>=limit:break
                if not 1<=ino<=volume.inode_count:continue
                path=prefix+'/'+name if prefix else name
                if len(path)>4096:continue
                try:
                    record=volume.inode(ino)
                    mode=u16(record,0)&0xf000
                    flags=u32(record,0x20)
                    if flags & 0x800:continue  # fscrypt flag: not decoded
                    if mode==0x4000:
                        if len(seen_dirs)<4096 and ino not in seen_dirs:queue.append((ino,path,depth+1))
                    elif mode==0x8000:
                        segments,size=volume.inode_segments(record)
                        # Preserve active filenames. No deletion or integrity claim.
                        out.append(Candidate('ext4',name,path,size,part.offset,segments,None,'unknown',
                            'Existing ext4 file; not deleted-file recovery; filesystem integrity unverified',False,False,ino))
                except (ValueError,EOFError):continue
                count+=1
                if progress and count%128==0:progress(count, max(count+len(queue),1))
        except (ValueError,EOFError):continue
    return out
