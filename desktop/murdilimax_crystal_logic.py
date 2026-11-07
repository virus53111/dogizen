"""Safe, Qt-independent GUI helpers. No file-content uploads, no telemetry."""
from __future__ import annotations
from pathlib import Path
from dataclasses import dataclass
from typing import Iterable
from murdilimax_devices import is_physical, destination_is_different_disk

CATEGORIES = ('Photos','Video','Documents','Archives','Crypto backups','Audio','Other')

def file_size(n: int) -> str:
    n = max(0, int(n))
    for unit in ('B', 'KiB','MiB','GiB','TiB','PiB'):
        if n < 1024 or unit == 'PiB':
            return (f'{n:.1f} {unit}' if unit != 'B' else f'{n} B')
        n /= 1024
    return f'{n:.1f} PiB'


def normalize_categories(categories: Iterable[str]) -> set[str]:
    return set(categories).intersection(CATEGORIES)


def validate_source(path: str, mode: str) -> None:
    """Fail closed; directories only in folder mode and explicit device paths in device mode."""
    if not path or not path.strip():
        raise ValueError('Выберите источник / Select a source')
    if mode == 'folder':
        if not Path(path).is_dir():
            raise ValueError('Selected folder does not exist')
    elif mode in ('physical','physical-carve'):
        if not is_physical(path):
            raise ValueError('Select an explicit Windows physical disk using the device picker')
    elif mode in ('metadata','carve'):
        if is_physical(path) or not Path(path).is_file():
            raise ValueError('Choose an existing raw disk image')
    else:
        raise ValueError('Unsupported scan mode')


def safe_destination(source: str, destination: str, mode: str) -> None:
    """Do not allow recovery to source or nested source directory; physical must prove different disk."""
    if not destination or not Path(destination).is_dir():
        raise ValueError('Choose an existing destination directory')
    out = Path(destination).resolve()
    if is_physical(source):
        if not destination_is_different_disk(source, str(out)):
            raise ValueError('Cannot prove destination is on a different physical disk. Blocked.')
        return
    src = Path(source).resolve()
    if mode == 'folder':
        if out == src or src in out.parents:
            raise ValueError('Destination cannot be the source folder or any of its subfolders')
    elif src.is_file():
        if out == src.parent:
            raise ValueError('Recover to another folder, preferably on a different disk')


def supported_preview(name: str) -> bool:
    return Path(name).suffix.lower() in {'.jpg','.jpeg','.png','.gif','.webp','.bmp','.tif','.tiff'}


def recommendation_color(state: str) -> str:
    if state in ('free','existing'):
        return '#79F6D5'
    if state in ('reallocated','allocated','overwritten','occupied'):
        return '#FF8C9E'
    return '#F6CE91'


def selected_items(rows: Iterable[tuple[bool, object]]) -> list[object]:
    return [item for checked,item in rows if checked]


def read_visible_photo(path: str, expected_size: int, *, max_bytes: int = 12 * 1024 * 1024) -> bytes:
    """Bounded, local preview of existing regular photo; no symlink or secret access."""
    item = Path(path)
    if item.is_symlink() or not item.is_file() or not supported_preview(item.name):
        raise ValueError('Preview requires a regular existing photo')
    size = item.stat().st_size
    if size != expected_size or not 1 <= size <= max_bytes:
        raise ValueError('Photo size changed or exceeds safe preview limit')
    with item.open('rb') as fp:
        data = fp.read(max_bytes + 1)
    if len(data) != expected_size:
        raise ValueError('Photo changed while reading')
    return data
