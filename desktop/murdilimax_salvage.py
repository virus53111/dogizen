"""Experimental recovery of surviving deleted MFT records when primary $MFT is unreadable.

Requires intact NTFS volume boot parameters. Only allocation-UNKNOWN candidates.
No alternate/extension MFT attributes and no encrypted/compressed stream support.
"""
from __future__ import annotations
import struct


def salvage_mft(fp,part,image_size,limit=10000,max_bytes=2*1024**3,progress=None):
    # Deferred import to avoid circular imports.
    from murdilimax_engine import Candidate,read_at,fixup,attributes,stream_segments,u16,u32,u64
    boot=read_at(fp,part.boot_offset if part.boot_offset is not None else part.offset,512,image_size)
    if boot[3:11]!=b'NTFS    ':raise ValueError('NTFS boot header missing: MFT salvage requires known volume geometry')
    sec=u16(boot,11);spc=boot[13]
    if sec not in (512,1024,2048,4096) or spc==0 or spc&(spc-1):raise ValueError('Unsupported NTFS boot geometry')
    cluster=sec*spc
    encoded=struct.unpack_from('<b',boot,64)[0]
    record=(1<<-encoded) if encoded<0 else encoded*cluster
    if record<512 or record>4096 or record%sec:raise ValueError('Invalid NTFS record size')
    scan_size=min(image_size-part.offset,part.size,max_bytes)
    if scan_size<record:return []
    out=[]
    seen=set()
    block=4*1024*1024
    pos=0
    while pos<scan_size and len(out)<limit:
        size=min(block,scan_size-pos)
        data=read_at(fp,part.offset+pos,size,image_size)
        start=0
        while len(out)<limit:
            match=data.find(b'FILE',start)
            if match<0:break
            start=match+4
            absolute=part.offset+pos+match
            if absolute in seen or (pos+match)%record or match+record>len(data):continue
            seen.add(absolute)
            try:
                entry=fixup(data[match:match+record],sec)
                if u16(entry,22)&1 or u16(entry,22)&2:continue
                best=None; nsweight=-1;stream=None
                for typ,content,nr,raw in attributes(entry):
                    if typ==0x30 and not nr and len(content)>=66:
                        namelen=content[64];ns=content[65]
                        if 66+namelen*2<=len(content) and ns in (0,1,2,3):
                            weight=2 if ns in (1,3) else 1
                            if weight>nsweight:
                                best=content[66:66+namelen*2].decode('utf-16le','replace');nsweight=weight
                    if typ==0x80 and raw[9]==0:stream=(content,nr,raw)
                if not best or stream is None or any(c in best for c in '/\\\x00') or best.startswith('$'):continue
                content,nr,raw=stream
                if nr:
                    extents,size=stream_segments(raw,cluster,part.offset,image_size)
                    resident=None
                else:
                    extents=[];resident=content;size=len(content)
                unsupported=bool(u16(raw,12)&0x4001)
                state='unsupported' if unsupported else 'unknown'
                desc=('Compressed/encrypted attribute unsupported' if unsupported else
                      'MFT salvage: allocation unverified; may be overwritten')
                out.append(Candidate('NTFS',best,best,size,part.offset,extents,resident,state,desc,True,False,0,0,unsupported))
            except (ValueError,EOFError,struct.error):continue
        pos += size
        if progress:progress(pos,scan_size)
    return out
