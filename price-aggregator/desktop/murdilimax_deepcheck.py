"""Extra local bounded file checks; results do not certify perfect recovery."""
from __future__ import annotations
from pathlib import Path
import sqlite3,struct,time
from urllib.parse import quote
from murdilimax_validate import assess_file
MAX_SQLITE=512*1024*1024
MAX_DECODE_BYTES=64*1024*1024
MAX_IMAGE_PIXELS=45_000_000
MAX_MOV_ATOMS=50_000
def _sqlite_check(path,size):
    if size>MAX_SQLITE:
        return {'result':'inconclusive','detail':'SQLite exceeds bounded 512 MiB inspection limit'}
    with path.open('rb') as f:
        if f.read(16)!=b'SQLite format 3\x00':
            return {'result':'signature_mismatch','detail':'SQLite header missing'}
    url='file:'+quote(str(path.resolve()).replace('\\','/'),safe='/:')+'?mode=ro&immutable=1'
    db=None;start=time.monotonic()
    try:
        db=sqlite3.connect(url,uri=True,timeout=1.0)
        db.execute('PRAGMA query_only=ON')
        calls=[0]
        def check_budget():
            calls[0]+=1
            return int(calls[0]>100_000 or time.monotonic()-start>3.0)
        db.set_progress_handler(check_budget,1000)
        result=db.execute('PRAGMA quick_check(1)').fetchone()
        if result and result[0]=='ok':
            return {'result':'validated_structure','detail':'SQLite read-only quick_check passed; logical content not verified'}
        return {'result':'possibly_truncated','detail':'SQLite quick_check reported structural problems'}
    except (sqlite3.Error,OSError,RuntimeError) as exc:
        return {'result':'inconclusive','detail':'SQLite verification incomplete: '+type(exc).__name__}
    finally:
        if db:
            try:db.close()
            except sqlite3.Error:pass
def _image_check(path,size):
    if size>MAX_DECODE_BYTES:
        return {'result':'inconclusive','detail':'Image above 64 MiB decode limit'}
    try:from PIL import Image,UnidentifiedImageError
    except ImportError:return {'result':'inconclusive','detail':'Pillow not installed'}
    try:
        Image.MAX_IMAGE_PIXELS=MAX_IMAGE_PIXELS
        with Image.open(path) as pic:
            if pic.width*pic.height>MAX_IMAGE_PIXELS:
                return {'result':'inconclusive','detail':'Image exceeds pixel limit'}
            pic.load()
        return {'result':'validated_structure','detail':'Image decoded within limits; contents may still be wrong'}
    except (OSError,ValueError,SyntaxError,UnidentifiedImageError,Image.DecompressionBombError,Image.DecompressionBombWarning) as exc:
        return {'result':'possibly_truncated','detail':'Image decode issue: '+type(exc).__name__}
def _mp4_check(path,size):
    if size<16:return {'result':'possibly_truncated','detail':'Media file too short'}
    offset=0;atoms=set();count=0
    try:
        with path.open('rb') as fp:
            while offset<size and count<MAX_MOV_ATOMS:
                fp.seek(offset);head=fp.read(8)
                if len(head)<8:return {'result':'possibly_truncated','detail':'Incomplete MP4 atom header'}
                length,typ=struct.unpack('>I4s',head);header=8
                if length==1:
                    more=fp.read(8)
                    if len(more)!=8:return {'result':'possibly_truncated','detail':'Missing extended atom size'}
                    length=int.from_bytes(more,'big');header=16
                elif length==0:length=size-offset
                if length<header or length>size-offset:
                    return {'result':'possibly_truncated','detail':'MP4 atom crosses file boundary'}
                atoms.add(typ);offset+=length;count+=1
        if count>=MAX_MOV_ATOMS:return {'result':'inconclusive','detail':'MP4 atom inspection limit reached'}
        if b'ftyp' in atoms and b'mdat' in atoms and (b'moov' in atoms or b'moof' in atoms):
            return {'result':'plausible','detail':'MP4 top-level boxes consistent; media data not fully decoded'}
        return {'result':'inconclusive','detail':'Top-level MP4 boxes insufficient to verify media'}
    except (OSError,ValueError,OverflowError) as exc:
        return {'result':'inconclusive','detail':'MP4 inspection aborted: '+type(exc).__name__}
def assess_deep(filename:str)->dict:
    base=assess_file(filename)
    if base['result'] in ('read_error','empty','signature_mismatch','possibly_truncated'):return base
    p=Path(filename)
    try:size=p.stat().st_size
    except OSError:return base
    ext=p.suffix.casefold()
    if ext in ('.sqlite','.sqlite3','.db'):return _sqlite_check(p,size)
    if ext in ('.jpg','.jpeg','.png','.webp','.gif','.bmp','.tiff','.tif'):
        if ext in ('.jpg','.jpeg','.png') and base['result']!='validated_structure':
            return _image_check(p,size)
        if ext in ('.webp','.gif','.bmp','.tiff','.tif'):
            return _image_check(p,size)
    if ext in ('.mp4','.mov','.m4v'):return _mp4_check(p,size)
    return base
