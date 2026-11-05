"""Lightweight, local post-recovery format checks, never uploads content.

A plausible signature does NOT prove that every recovered byte is correct.
This module provides a conservative assessment, not an integrity certificate.
"""
from __future__ import annotations
from pathlib import Path
import os
import zipfile
import zlib


def assess_file(filename: str) -> dict:
    """Return a conservative local assessment of a recovered candidate."""
    path = Path(filename)
    ext = path.suffix.lower()
    try:
        size = path.stat().st_size
        with path.open('rb') as source:
            head = source.read(32)
            source.seek(max(0, size - 2048))
            tail = source.read()
    except OSError as exc:
        return {'result':'read_error','detail':str(exc)}
    if not size:
        return {'result':'empty','detail':'Empty file, no content to validate'}

    if ext in ('.jpeg', '.jpg'):
        if not head.startswith(b'\xff\xd8\xff'):
            return {'result':'signature_mismatch','detail':'JPEG header missing'}
        return ({'result':'plausible','detail':'JPEG SOI and EOI markers present, full image not decoded'}
                if b'\xff\xd9' in tail else
                {'result':'possibly_truncated','detail':'JPEG end marker not detected near end of file'})

    if ext=='.png':
        if head[:8]!=b'\x89PNG\r\n\x1a\n':
            return {'result':'signature_mismatch','detail':'PNG signature missing'}
        try:
            with path.open('rb') as src:
                src.seek(8)
                chunks=0
                while chunks<1_000_000:
                    marker=src.read(8)
                    if len(marker)!=8:
                        return {'result':'possibly_truncated','detail':'PNG chunk length missing'}
                    length=int.from_bytes(marker[:4],'big'); typ=marker[4:]
                    if length>256*1024**2:
                        return {'result':'inconclusive','detail':'PNG chunk too large for conservative validation'}
                    crc=zlib.crc32(typ)
                    left=length
                    while left:
                        block=src.read(min(left,1024*1024))
                        if not block:return {'result':'possibly_truncated','detail':'PNG chunk data truncated'}
                        crc=zlib.crc32(block,crc);left-=len(block)
                    value=src.read(4)
                    if len(value)!=4 or int.from_bytes(value,'big')!=(crc&0xffffffff):
                        return {'result':'signature_mismatch','detail':'PNG chunk CRC mismatch'}
                    chunks+=1
                    if typ==b'IEND' and length==0:
                        return {'result':'validated_structure','detail':f'PNG chunks and CRC verified ({chunks} chunks)'}
                return {'result':'inconclusive','detail':'PNG chunk count limit exceeded'}
        except (OSError,OverflowError,ValueError) as exc:
            return {'result':'inconclusive','detail':str(exc)}

    if ext=='.pdf':
        if not head.startswith(b'%PDF-'):
            return {'result':'signature_mismatch','detail':'PDF header missing'}
        return ({'result':'plausible','detail':'PDF header and %%EOF marker found, document not fully parsed'}
                if b'%%EOF' in tail else
                {'result':'possibly_truncated','detail':'PDF %%EOF not found near end'})

    if ext in ('.zip','.docx','.xlsx','.pptx','.odt','.ods','.epub'):
        if head[:4]!=b'PK\x03\x04':
            return {'result':'signature_mismatch','detail':'ZIP container header missing'}
        try:
            with zipfile.ZipFile(path) as archive:
                count=len(archive.infolist())
            return {'result':'plausible','detail':f'ZIP directory parsed ({count} entries), member contents not decompressed'}
        except (zipfile.BadZipFile,OSError,ValueError) as exc:
            return {'result':'possibly_truncated','detail':f'ZIP central directory invalid: {exc}'}

    if ext in ('.sqlite','.sqlite3','.db'):
        return ({'result':'plausible','detail':'SQLite header present; DB integrity not verified'}
                if head.startswith(b'SQLite format 3\x00') else
                {'result':'inconclusive','detail':'Unknown database format'})
    if ext in ('.mp4','.m4v','.mov'):
        return ({'result':'plausible','detail':'ISO BMFF ftyp box present; video not decoded'}
                if head[4:8]==b'ftyp' else
                {'result':'inconclusive','detail':'No ftyp box near start; may be fragmented or nonstandard media'})
    return {'result':'not_checked','detail':'No conservative format validator for this file type'}
