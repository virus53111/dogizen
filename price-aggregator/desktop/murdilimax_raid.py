"""Read-only, explicitly configured software RAID0/1/5 image reconstruction.

RAID5 layout: Linux MD left-symmetric only; one missing member supported.
The layout and disk order MUST be supplied correctly; no automatic detection.
"""
from __future__ import annotations
import argparse
import hashlib
import os
from pathlib import Path

MIN_CHUNK=4096
MAX_CHUNK=1024*1024


def _xor(a:bytes,b:bytes)->bytes:
    if len(a)!=len(b): raise ValueError('Unequal RAID chunk lengths')
    return bytes(x^y for x,y in zip(a,b))


def _read_chunk(fp,stripe,chunk):
    fp.seek(stripe*chunk)
    data=fp.read(chunk)
    if len(data)!=chunk:raise IOError('RAID member truncated')
    return data


def assemble(members:list[str|None],out_path:str,level:int,chunk:int=65536,verify_parity:bool=False):
    if level not in (0,1,5):raise ValueError('Only RAID0/1/5 are supported')
    if chunk<MIN_CHUNK or chunk>MAX_CHUNK or chunk&(chunk-1):raise ValueError('Chunk size must be power of 2 between 4 KiB and 1 MiB')
    n=len(members)
    if n < (3 if level==5 else 2):raise ValueError('Not enough RAID members')
    missing=[i for i,m in enumerate(members) if m is None or m=='-']
    if len(missing)>1 or (missing and level==0):raise ValueError('Unsupported missing RAID members')
    real=[Path(p).resolve() for p in members if p is not None and p!='-']
    if len(set(real))!=len(real):raise ValueError('Duplicate member image')
    out=Path(out_path).resolve()
    if out in real:raise ValueError('Output must not overwrite member image')
    sizes=[os.path.getsize(p) for p in real]
    if not sizes or min(sizes)<chunk or len(set(sizes))>1 or sizes[0]%chunk:
        raise ValueError('RAID member image sizes must match and be chunk aligned')
    stripes=sizes[0]//chunk
    if stripes>100000000:raise ValueError('Excessive RAID size')
    hash_value=hashlib.sha256()
    with __import__('contextlib').ExitStack() as stack:
        files=[None if p is None or p=='-' else stack.enter_context(open(p,'rb')) for p in members]
        with open(out,'xb') as dst:
            if level==1:
                # An explicitly chosen first available mirror; no silent 'repair' of differences.
                active=next(fp for fp in files if fp is not None)
                for stripe in range(stripes):
                    block=_read_chunk(active,stripe,chunk)
                    dst.write(block);hash_value.update(block)
            else:
                for stripe in range(stripes):
                    present=[_read_chunk(fp,stripe,chunk) if fp is not None else None for fp in files]
                    if level==0:
                        blocks=present
                    else:
                        parity=(n-1-(stripe%n))%n
                        if missing:
                            miss=missing[0]
                            rebuilt=bytes(chunk)
                            for b in present:
                                if b is not None:rebuilt=_xor(rebuilt,b)
                            present[miss]=rebuilt
                        if verify_parity and not missing:
                            check=bytes(chunk)
                            for b in present:
                                check=_xor(check,b)
                            if any(check):raise ValueError(f'RAID5 parity mismatch in stripe {stripe}')
                        # Linux MD left-symmetric: data begins on disk after parity and wraps.
                        blocks=[present[(parity+1+column)%n] for column in range(n-1)]
                    for block in blocks:
                        dst.write(block);hash_value.update(block)
    return {'level':level,'stripe_bytes':chunk,'members':n,'missing':missing,'bytes':out.stat().st_size,'sha256':hash_value.hexdigest(),'output':str(out)}


def main():
    p=argparse.ArgumentParser(description='Reconstruct logical RAID0/1/5 image. Requires exact known drive order and chunk size.')
    p.add_argument('--level',type=int,choices=(0,1,5),required=True)
    p.add_argument('--chunk-kib',type=int,default=64)
    p.add_argument('--output',required=True)
    p.add_argument('--verify-parity',action='store_true')
    p.add_argument('members',nargs='+',help='Ordered image paths; use - for missing RAID5 member')
    a=p.parse_args()
    print(assemble(a.members,a.output,a.level,a.chunk_kib*1024,a.verify_parity))

if __name__=='__main__':main()
