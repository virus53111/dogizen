"""Local, read-only, bounded previews of NTFS/exFAT photo candidates."""
from __future__ import annotations
from io import BytesIO
from pathlib import Path
from murdilimax_devices import open_source
from murdilimax_engine import Candidate, stream_read

MAX_PREVIEW_FILE_BYTES = 12 * 1024 * 1024
MAX_PREVIEW_PIXELS = 30_000_000
SUPPORTED = {'.jpg','.jpeg','.png','.webp','.gif','.bmp','.tif','.tiff'}

def preview_bytes(source: str, candidate: Candidate, *, max_bytes: int = MAX_PREVIEW_FILE_BYTES) -> bytes:
    if not isinstance(candidate,Candidate):
        raise TypeError('Preview requires a metadata candidate')
    if candidate.state == 'reallocated' or candidate.compressed or candidate.is_dir:
        raise ValueError('Preview blocked: file clusters reused or unsupported')
    if Path(candidate.name).suffix.lower() not in SUPPORTED:
        raise ValueError('Preview supports image files only')
    if candidate.size < 1 or candidate.size > max_bytes:
        raise ValueError('Preview exceeds the safe file size limit of 12 MiB')
    if candidate.resident is not None:
        if len(candidate.resident) < candidate.size:raise ValueError('Resident data truncated')
        return bytes(candidate.resident[:candidate.size])
    if not candidate.extents or sum(n for _,n in candidate.extents) < candidate.size:
        raise ValueError('Insufficient extents for photo preview')
    with open_source(source) as (fp, total):
        return stream_read(fp,candidate.extents,0,candidate.size,total)

def decode_preview(raw: bytes, *, width:int=720, height:int=480):
    try:
        from PIL import Image, UnidentifiedImageError
    except ImportError as exc:
        raise RuntimeError('Photo preview requires Pillow (bundled with Windows installer)') from exc
    if not raw or len(raw)>MAX_PREVIEW_FILE_BYTES:raise ValueError('Photo preview byte limit exceeded')
    Image.MAX_IMAGE_PIXELS=MAX_PREVIEW_PIXELS
    try:
        with Image.open(BytesIO(raw)) as img:
            w,h=img.size
            if not w or not h or w*h>MAX_PREVIEW_PIXELS:raise ValueError('Unsafe image dimensions')
            img.seek(0);img.load()
            output=img.convert('RGB')
            output.thumbnail((width,height),Image.Resampling.LANCZOS)
            return output.copy()
    except (OSError,ValueError,UnidentifiedImageError,Image.DecompressionBombError) as exc:
        raise ValueError('Image could not be decoded; candidate may be corrupt') from exc
