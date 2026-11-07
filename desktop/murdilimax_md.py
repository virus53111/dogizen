"""Read-only Linux md RAID v1.2 member metadata inspection and safe data extraction.

Only superblocks at byte 4096 of a member image are recognized. Does not scan
whole disks for nested partitions, infer vendor NAS mappings, or mount anything.
Images already stripped of metadata are used by murdilimax_raid. Never modify
an original member image. User must verify role, layout, offset and order.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import struct

MAGIC = 0xA92B4EFC
MAX_COPY = 1024 * 1024 * 1024 * 1024 * 128  # cautious bound for malformed headers


def probe_md12(path: str) -> dict | None:
    file = Path(path)
    if not file.is_file() or file.stat().st_size < 8192:
        return None
    with open(file, 'rb') as fp:
        fp.seek(4096)
        header = fp.read(4096)
    if len(header) < 260 or struct.unpack_from('<II',header) != (MAGIC,1):
        return None
    level = struct.unpack_from('<i',header,72)[0]
    layout = struct.unpack_from('<I',header,76)[0]
    chunk_sectors, raid_disks = struct.unpack_from('<II',header,88)
    data_offset, data_size, super_offset = struct.unpack_from('<QQQ',header,128)
    dev_number = struct.unpack_from('<I',header,160)[0]
    max_dev = struct.unpack_from('<I',header,252)[0]
    if level not in (0,1,4,5,6,10) or not 2 <= raid_disks <= 32 or not 1 <= chunk_sectors <= 2048:
        raise ValueError('Linux MD metadata detected but fields are inconsistent')
    if data_offset < 16 or data_size == 0 or data_size > MAX_COPY//512 or data_offset > MAX_COPY//512:
        raise ValueError('Linux MD metadata has unsafe data offset or size')
    if max_dev > 384 or max_dev < 1:
        raise ValueError('Linux MD metadata has invalid member role count')
    offset_bytes = data_offset * 512
    size_bytes = data_size * 512
    if offset_bytes + size_bytes > file.stat().st_size:
        raise ValueError('Linux MD member data extends past end of image; do not trust truncated images')
    role = None
    if dev_number < max_dev and 256 + 2 * dev_number + 2 <= len(header):
        role = struct.unpack_from('<H',header,256+2*dev_number)[0]
    return {
        'version': '1.2', 'metadata_offset': 4096,
        'set_uuid': header[16:32].hex(),
        'set_name': header[32:64].split(b'\0',1)[0].decode('utf-8','replace'),
        'level': level, 'layout_code': layout, 'chunk_bytes': chunk_sectors*512,
        'raid_disks': raid_disks, 'device_number': dev_number, 'role': role,
        'data_offset_bytes': offset_bytes, 'data_size_bytes': size_bytes,
        'super_offset_sectors': super_offset,
        'warning': 'Header recognized only; role/layout must be independently validated before reconstruction',
    }


def inspect_md_set(paths: list[str]) -> dict:
    if not paths:
        raise ValueError('At least one input image required')
    details = []
    for path in paths:
        md = probe_md12(path)
        if md is None:
            raise ValueError('No supported Linux md v1.2 metadata at byte 4096: '+path)
        details.append({'path':path,**md})
    expected = details[0]
    for md in details[1:]:
        for k in ('set_uuid','level','layout_code','chunk_bytes','raid_disks'):
            if md[k]!=expected[k]:
                raise ValueError('RAID member metadata disagree: '+k)
    roles = [p['role'] for p in details if p['role'] not in (None,65534,65535)]
    if len(roles)!=len(set(roles)):
        raise ValueError('Duplicate member roles: possible stale/different devices')
    return {'array_uuid':expected['set_uuid'],'level':expected['level'],
            'layout_code':expected['layout_code'],'chunk_bytes':expected['chunk_bytes'],
            'expected_members':expected['raid_disks'],'available_members':len(paths),
            'members':details,'safe_to_auto_assemble':False,
            'warning':'Inspect only. Extraction produces data-only images; array assembly is NOT automatic.'}


def extract_md_member(source: str, destination: str) -> dict:
    md=probe_md12(source)
    if md is None:
        raise ValueError('Not a supported Linux MD 1.2 member image')
    src=Path(source).resolve();out=Path(destination).resolve()
    if out==src:
        raise ValueError('Destination must differ from source')
    if out.exists():
        raise FileExistsError('Destination already exists')
    temp=out.with_name(out.name+'.mrd-part')
    if temp.exists():
        raise FileExistsError('Temporary destination already exists')
    out.parent.mkdir(parents=True,exist_ok=True)
    sha=hashlib.sha256()
    remaining=md['data_size_bytes']
    try:
        with open(src,'rb') as read, open(temp,'xb') as write:
            read.seek(md['data_offset_bytes'])
            while remaining:
                data=read.read(min(4*1024*1024,remaining))
                if not data:
                    raise IOError('Source became truncated during extraction')
                write.write(data)
                sha.update(data)
                remaining-=len(data)
            write.flush();os.fsync(write.fileno())
        os.replace(temp,out)
    except BaseException:
        temp.unlink(missing_ok=True)
        raise
    return {'source':str(src),'output':str(out),'bytes':md['data_size_bytes'],
            'sha256':sha.hexdigest(),'role':md['role'],'set_uuid':md['set_uuid'],
            'warning':'Exported raw MD data only; no array layout or member order was inferred'}


def main():
    cli=argparse.ArgumentParser(description='Inspect Linux md v1.2 metadata read-only or extract DATA portion to a new image')
    cli.add_argument('members',nargs='+')
    cli.add_argument('--extract-to',help='Destination; valid only for exactly one member')
    a=cli.parse_args()
    if a.extract_to:
        if len(a.members)!=1:
            cli.error('Extraction requires one member')
        result=extract_md_member(a.members[0],a.extract_to)
    else:
        result=inspect_md_set(a.members)
    print(json.dumps(result,indent=2))

if __name__=='__main__':
    main()
