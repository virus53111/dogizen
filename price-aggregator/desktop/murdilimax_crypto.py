"""Read-only identification of common *locked* volume headers.

No password handling, key extraction, brute forcing, mounting, or decryption.
Use authorized OS tooling to unlock volumes, then supply a decrypted *copy*.
"""
from __future__ import annotations
import struct


def detect_encryption_header(block: bytes) -> str | None:
    if len(block)>=8 and block[:6]==b'LUKS\xba\xbe':
        ver=int.from_bytes(block[6:8],'big')
        if ver in (1,2):return f'LUKS{ver}'
    if len(block)>=11 and block[3:11]==b'-FVE-FS-':return 'BitLocker'
    return None


def find_locked_volumes(fp, image_size: int) -> list[tuple[int,str]]:
    offsets={0,1*1024*1024,2*1024*1024}
    # Standard MBR and GPT entries; bounded so no untrusted massive arrays.
    for sector in (512,4096):
        if image_size<sector*2:continue
        try:
            fp.seek(0);mbr=fp.read(512)
            if mbr[510:512]==b'\x55\xaa':
                for i in range(4):
                    entry=mbr[446+i*16:462+i*16]
                    lba=struct.unpack_from('<I',entry,8)[0]
                    if lba:offsets.add(lba*sector)
            fp.seek(sector);gpt=fp.read(512)
            if gpt[:8]==b'EFI PART':
                loc=struct.unpack_from('<Q',gpt,72)[0]
                count=min(128,struct.unpack_from('<I',gpt,80)[0])
                width=struct.unpack_from('<I',gpt,84)[0]
                if 128<=width<=1024 and loc*sector+count*width<=image_size:
                    for i in range(count):
                        fp.seek(loc*sector+i*width);entry=fp.read(56)
                        if len(entry)==56 and any(entry[:16]):offsets.add(struct.unpack_from('<Q',entry,32)[0]*sector)
        except (ValueError, OSError, struct.error):continue
    found=[]
    for offset in sorted(offsets):
        if offset<0 or offset+16>image_size:continue
        fp.seek(offset);signature=detect_encryption_header(fp.read(512))
        if signature:found.append((offset,signature))
    return found


def locked_guidance(locked: list[tuple[int,str]]) -> str:
    kinds=', '.join(f'{kind} at offset {offset}' for offset,kind in locked)
    return ('Encrypted volume detected ('+kinds+'). MURDILIMAX does NOT decrypt volumes or bypass passwords. '
            'With owner authorization, unlock using the official OS tool (Windows BitLocker or Linux cryptsetup), '
            'then scan an independently created unlocked/decrypted image or an authorized accessible folder. '
            'Never enter recovery keys on this website or in a third-party form.')
