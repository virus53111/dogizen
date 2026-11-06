"""Memory-limited, local photo preview of supported NTFS/exFAT/ext4 candidates.

Never creates an output file, never sends data to a remote service. Preview of
incompletely allocated records is inherently untrustworthy and is labeled as such.
"""
from __future__ import annotations
from io import BytesIO
from pathlib import Path
from murdilimax_devices import open_source
from murdilimax_engine import Candidate, stream_read

MAX_PREVIEW_FILE_BYTES = 12 * 1024 * 1024
MAX_PREVIEW_PIXELS = 30_000_000
SUPPORTED = {'.jpg','.jpeg','.png','.webp','.gif','.bmp','.tif','.tiff'}


def preview_bytes(source: str, candidate: Candidate, *, max_bytes: int = MAX_PREVIEW_FILE_BYTES) -> bytes:
    """Bounded byte acquisition. Read-only even for physical Windows sources."""
    if not isinstance(candidate, Candidate):
        raise TypeError('Preview requires a filesystem metadata candidate')
    if candidate.state == 'reallocated' or candidate.compressed or candidate.is_dir:
        raise ValueError('Preview blocked: candidate clusters are reused or unsupported')
    if Path(candidate.name).suffix.lower() not in SUPPORTED:
        raise ValueError('Preview supports image files only')
    if candidate.size < 1 or candidate.size > max_bytes:
        raise ValueError('Preview exceeds the safe file-size limit (12 MiB); recover a copy instead')
    if candidate.resident is not None:
        if len(candidate.resident) < candidate.size:
            raise ValueError('Resident data is truncated')
        return bytes(candidate.resident[:candidate.size])
    if not candidate.extents:
        raise ValueError('No reliable extents for preview')
    if sum(n for _,n in candidate.extents) < candidate.size:
        raise ValueError('Insufficient extents for preview')
    with open_source(source) as (fp,total):
        return stream_read(fp,candidate.extents,0,candidate.size,total)


def decode_preview(raw: bytes, *, width: int = 720, height: int = 480):
    """Return an independent PIL Image; GUI must create ImageTk in main thread."""
    try:
        from PIL import Image, UnidentifiedImageError
    except ImportError as exc:
        raise RuntimeError('Photo preview requires Pillow, included in the Windows installer') from exc
    if not raw or len(raw)>MAX_PREVIEW_FILE_BYTES:
        raise ValueError('Photo data exceeds preview limit')
    Image.MAX_IMAGE_PIXELS = MAX_PREVIEW_PIXELS
    try:
        with Image.open(BytesIO(raw)) as img:
            w,h=img.size
            if not w or not h or w*h > MAX_PREVIEW_PIXELS:
                raise ValueError('Unsafe image pixel dimensions')
            img.seek(0)
            img.load()
            im = img.convert('RGB')
            im.thumbnail((width,height),Image.Resampling.LANCZOS)
            return im.copy()
    except (OSError,ValueError,UnidentifiedImageError,Image.DecompressionBombError) as exc:
        raise ValueError('Preview could not decode this candidate (file may be damaged)') from exc
