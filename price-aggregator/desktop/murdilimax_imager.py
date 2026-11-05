#!/usr/bin/env python3
"""MURDILIMAX 0.4: audited, resumable, read-only acquisition of disk images.

Does not repair failing hardware. Source opened only for reading. No network.
Checksums describe the acquired image (unreadable sectors are zero-filled).
"""
from __future__ import annotations

import argparse
from contextlib import nullcontext
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
from threading import Event
from typing import Callable

from murdilimax_devices import is_physical, open_source, destination_is_different_disk
from murdilimax_safety import verify_physical_source

VERSION = "0.5"
DEFAULT_CHUNK = 2 * 1024 * 1024
MAX_BAD_BLOCKS = 512  # stop if too much medium damage; refer to specialist


class ImagingCancelled(Exception):
    """Acquisition was paused safely at a committed chunk boundary."""


class SourceReadLimitExceeded(IOError):
    """Too many failed reads; do not repeatedly stress damaged media."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def save_json_atomic(file: Path, info: dict) -> None:
    with tempfile.NamedTemporaryFile('w', encoding='utf-8', dir=file.parent,
                                     prefix=file.name + '.', suffix='.tmp',
                                     delete=False) as out:
        temp = Path(out.name)
        try:
            json.dump(info, out, indent=2, ensure_ascii=False)
            out.write('\n')
            out.flush()
            os.fsync(out.fileno())
        except Exception:
            temp.unlink(missing_ok=True)
            raise
    os.replace(temp, file)


def bad_range_add(ranges: list[list[int]], offset: int, length: int) -> None:
    if ranges and ranges[-1][0] + ranges[-1][1] == offset:
        ranges[-1][1] += length
    else:
        ranges.append([offset, length])


def try_read(fp, offset: int, count: int) -> bytes:
    fp.seek(offset)
    result = fp.read(count)
    if len(result) != count:
        raise IOError(f'Short read at offset {offset}: {len(result)} / {count}')
    return result


def read_adaptively(fp, offset: int, length: int, sector: int,
                    errors: list[list[int]], metrics: dict,
                    cancel: Event | None = None) -> bytes:
    """Bisect faulty reads until one logical sector; fill bad sectors with 0.

    Does not retry a *bad sector* repeatedly. Bounded read failure count stops
    scanning if media is extensively damaged.
    """
    if cancel is not None and cancel.is_set():
        raise ImagingCancelled('Acquisition paused at user request')
    try:
        return try_read(fp, offset, length)
    except (OSError, IOError):
        metrics['failed_reads'] += 1
        if metrics['failed_reads'] > MAX_BAD_BLOCKS:
            raise SourceReadLimitExceeded('Too many read failures; stop and contact a recovery lab')
        if length <= sector:
            bad_range_add(errors, offset, length)
            metrics['bad_bytes'] += length
            return bytes(length)
        half = (length // (2 * sector)) * sector
        if half <= 0:
            half = sector
        if half >= length:
            half = length // 2
        return (read_adaptively(fp, offset, half, sector, errors, metrics, cancel)
                + read_adaptively(fp, offset + half, length - half, sector, errors, metrics, cancel))


def hash_first_bytes(path: Path, size: int) -> hashlib._hashlib.HASH:
    digest = hashlib.sha256()
    with path.open('rb') as file:
        left = size
        while left:
            block = file.read(min(4 * 1024 * 1024, left))
            if not block:
                raise IOError('Incomplete partial image: cannot verify resume checkpoint')
            digest.update(block)
            left -= len(block)
    return digest


def image_source(source: str, destination: str, *, chunk_size: int = DEFAULT_CHUNK,
                 cancel: Event | None = None,
                 progress: Callable[[int, int, int], None] | None = None,
                 verify_output: bool = True,
                 allow_resume_physical: bool = False) -> dict:
    """Make an image with checkpoint journal and an auditable bad-sector map.

    The destination is a NEW file. If interrupted, a .part and a state file
    are retained. Resume only a matching source/destination. Windows raw disk
    resume additionally requires manual re-verification of disk identity.

    NOTE: read access alone is not a hardware write blocker for other apps/OS.
    """
    src = str(source)
    physical = is_physical(src)
    out = Path(destination).expanduser().resolve()
    if not out.parent.is_dir():
        raise NotADirectoryError(f'Output directory does not exist: {out.parent}')
    if out.exists():
        raise FileExistsError(f'Output already exists, will not overwrite: {out}')
    if physical:
        if not destination_is_different_disk(src, str(out.parent)):
            raise ValueError('Destination disk cannot be proved different from physical source')
    else:
        inputfile = Path(src).expanduser().resolve(strict=True)
        if not inputfile.is_file():
            raise ValueError('Source must be a regular file or explicit Windows physical device')
        src = str(inputfile)
        if out == inputfile:
            raise ValueError('Source and destination cannot be the same file')
    partial = Path(str(out) + '.part')
    statepath = Path(str(out) + '.mrd-state.json')
    reportpath = Path(str(out) + '.mrd-report.json')
    if reportpath.exists():
        raise FileExistsError('A finished acquisition report already exists at target path')
    if chunk_size < 4096 or chunk_size > 16 * 1024 * 1024:
        raise ValueError('Chunk size must be between 4KiB and 16MiB')
    with open_source(src) as (device, length):
        sector = getattr(device, 'sector_size', 512)
        if sector not in (512, 1024, 2048, 4096):
            raise ValueError('Unsupported source sector size')
        if chunk_size % sector:
            raise ValueError('Chunk must be a multiple of device sector size')
        if length == 0:
            raise ValueError('Source has zero length')
        physical_check = verify_physical_source(src, device) if physical else {}
        mtime_ns = None if physical else os.stat(src).st_mtime_ns
        expected = {
            'format': 'murdilimax-image-state-v1', 'source': src,
            'physical_source': physical, 'source_size': length,
            'source_mtime_ns': mtime_ns, 'target': str(out),
            'sector_size': sector, 'chunk_size': chunk_size,
            **physical_check,
        }
        resumable = statepath.exists() or partial.exists()
        if resumable:
            if not statepath.is_file() or not partial.is_file():
                raise ValueError('Incomplete acquisition journal: do not overwrite, inspect .part and state file')
            if physical and not allow_resume_physical:
                raise ValueError('Physical device may have been swapped: resume requires explicit confirmation')
            if physical and not physical_check.get('device_fingerprint'):
                raise ValueError('No stable hardware serial; physical device resume is blocked. Preserve partial data and use a recovery specialist.')
            state = json.loads(statepath.read_text(encoding='utf-8'))
            if not all(state.get(k) == v for k, v in expected.items()):
                raise ValueError('Acquisition checkpoint does not match this source and destination')
            done = state.get('bytes_completed')
            if not isinstance(done, int) or done < 0 or done > length:
                raise ValueError('Invalid acquisition checkpoint offset')
            if partial.stat().st_size < done:
                raise ValueError('Partial file shorter than committed checkpoint')
            digest = hash_first_bytes(partial, done)
            if digest.hexdigest() != state.get('sha256_prefix'):
                raise ValueError('Partial image does not match checkpoint hash. Resume blocked.')
            bad_ranges = state.get('unreadable_ranges')
            if not isinstance(bad_ranges, list):
                raise ValueError('Missing unreadable sector map')
            metrics = {'failed_reads': int(state.get('failed_reads', 0)),
                       'bad_bytes': int(state.get('unreadable_bytes', 0))}
            if metrics['failed_reads'] > MAX_BAD_BLOCKS:
                raise SourceReadLimitExceeded('Previous scan hit media damage limit')
        else:
            done = 0
            digest = hashlib.sha256()
            bad_ranges = []
            metrics = {'failed_reads': 0, 'bad_bytes': 0}
            state = {**expected, 'started_utc': utc_now(),
                     'bytes_completed': 0, 'sha256_prefix': digest.hexdigest(),
                     'unreadable_ranges': bad_ranges, 'failed_reads': 0,
                     'unreadable_bytes': 0}
            # Protect against accidental overwrite; a .part is never a finished image.
            with partial.open('xb'):
                pass
            save_json_atomic(statepath, state)
        if shutil.disk_usage(out.parent).free < length - done + 8 * 1024 * 1024:
            raise OSError('Not enough free disk space for image plus safety margin')
        # For reliability: flush/fync data BEFORE committing its checkpoint.
        with partial.open('r+b') as dst:
            dst.truncate(done)
            dst.seek(done)
            while done < length:
                if cancel is not None and cancel.is_set():
                    raise ImagingCancelled(f'Paused after {done} bytes. Resume with same source and destination.')
                amount = min(chunk_size, length - done)
                data = read_adaptively(device, done, amount, sector, bad_ranges, metrics, cancel)
                dst.write(data)
                digest.update(data)
                done += amount
                dst.flush()
                os.fsync(dst.fileno())
                state.update({'bytes_completed': done, 'sha256_prefix': digest.hexdigest(),
                              'unreadable_ranges': bad_ranges, 'unreadable_bytes': metrics['bad_bytes'],
                              'failed_reads': metrics['failed_reads'], 'updated_utc': utc_now()})
                save_json_atomic(statepath, state)
                if progress is not None:
                    progress(done, length, metrics['bad_bytes'])
    # A regular source file is not a snapshot. If it changed during acquisition,
    # never mark this image complete (the output may mix multiple source states).
    if not physical:
        current = os.stat(src)
        if current.st_size != length or current.st_mtime_ns != mtime_ns:
            raise IOError('Source changed during acquisition; partial image kept for manual review')
    if verify_output:
        verified_digest = hash_first_bytes(partial, length).hexdigest()
        if verified_digest != digest.hexdigest():
            raise IOError('Output verification failed; partial image and checkpoint kept')
    # On Windows os.rename will fail if a new target appeared in the meantime.
    if out.exists():
        raise FileExistsError('Another process created the destination during imaging')
    os.rename(partial, out)
    report = {**expected,
              'completed_utc': utc_now(), 'bytes_completed': done,
              'sha256_image': digest.hexdigest(), 'verified_output': bool(verify_output),
              'unreadable_bytes': metrics['bad_bytes'], 'unreadable_ranges': bad_ranges,
              'failed_reads': metrics['failed_reads'],
              'warning': 'Unreadable regions were zero-filled. SHA-256 identifies the acquired image, not the original missing bytes. Acquired data is not guaranteed correct or complete.'}
    save_json_atomic(reportpath, report)
    statepath.unlink(missing_ok=True)
    return {'path': str(out), 'report': str(reportpath), **report}


def main():
    parser=argparse.ArgumentParser(description='MURDILIMAX 0.5 read-only, resumable image acquisition')
    parser.add_argument('source', help='Raw image file, or Windows \\.\\PhysicalDriveN')
    parser.add_argument('destination', help='NEW raw image path on a separate drive')
    parser.add_argument('--chunk-mib', type=int, default=2, choices=[1,2,4,8,16])
    parser.add_argument('--skip-output-verification', action='store_true', help='Not recommended')
    parser.add_argument('--confirm-physical-resume', action='store_true', help='Rechecked physical disk identity since last session')
    args=parser.parse_args()
    def progress(done, total, lost):
        print(f'\rRead {done*100/total:6.2f}% | unreadable bytes {lost:,}',end='',flush=True)
    try:
        result=image_source(args.source,args.destination,chunk_size=args.chunk_mib*1024**2,
                            verify_output=not args.skip_output_verification,
                            allow_resume_physical=args.confirm_physical_resume,progress=progress)
        print(f'\nImage: {result["path"]}\nReport: {result["report"]}\nSHA256: {result["sha256_image"]}')
    except (ImagingCancelled,SourceReadLimitExceeded,ValueError,OSError) as exc:
        print(f'\nACQUISITION INCOMPLETE: {exc}',file=sys.stderr)
        raise SystemExit(2) from exc

if __name__=='__main__':main()
