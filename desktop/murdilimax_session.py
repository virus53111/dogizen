"""Offline, view-only scan summaries for MURDILIMAX Crystal.

A session is NOT recovery metadata. It contains no file contents, file
extents, device handles or private keys and can never authorize recovery.
Re-scan the original source before previewing/recovering files.
"""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
import json
import os

SCHEMA = 'murdilimax-view-session'
VERSION = 1
MAX_ENTRIES = 12_000
MAX_JSON_BYTES = 16 * 1024 * 1024
MAX_TEXT = 4096
ALLOWED_MODES = {'metadata', 'carve', 'folder', 'physical', 'physical-carve', 'volume', 'volume-carve'}


def _clean_text(value, label: str, limit=MAX_TEXT) -> str:
    if not isinstance(value, str) or len(value) > limit or '\x00' in value:
        raise ValueError(f'Invalid {label} text')
    return value


def summary_entry(item) -> dict:
    """Whitelist only display attributes; never export extents/resident bytes."""
    from murdilimax_engine import Candidate
    from murdilimax_recovery_alpha import Hit
    if isinstance(item, Candidate):
        name, location = item.name, item.path
        category, fs, state = item.kind, item.fs, item.state
        size = item.size
    elif isinstance(item, Hit):
        name, location = Path(item.label).name, item.label
        category, fs, state = ('Crypto backups' if item.kind == 'Crypto' else item.kind), 'signature/folder', 'candidate'
        size = item.size
    else:
        raise ValueError('Unsupported scan result')
    record = {'name': _clean_text(name, 'filename', 1024),
              'path': _clean_text(location, 'path'),
              'category': _clean_text(category, 'category', 100),
              'fs': _clean_text(fs, 'filesystem', 100),
              'state': _clean_text(state, 'allocation', 100),
              'size': size}
    _validate_entry(record)
    return record


def _validate_entry(entry: object) -> dict:
    if not isinstance(entry, dict) or set(entry) != {'name','path','category','fs','state','size'}:
        raise ValueError('Invalid session record fields')
    for field, limit in [('name',1024),('path',MAX_TEXT),('category',100),('fs',100),('state',100)]:
        _clean_text(entry[field], field, limit)
    if type(entry['size']) is not int or not 0 <= entry['size'] <= (64 * 1024 ** 4):
        raise ValueError('Invalid session file size')
    return entry


def make_session(*, source: str, mode: str, entries, total: int, scan_errors=None) -> dict:
    if mode not in ALLOWED_MODES or not isinstance(source, str) or not source or len(source)>MAX_TEXT:
        raise ValueError('Invalid source or scan mode')
    if type(total) is not int or not 0 <= total <= 2**32:
        raise ValueError('Invalid scan total')
    entries=list(entries)
    if len(entries)>MAX_ENTRIES or total<len(entries):
        raise ValueError('Invalid number of scan entries')
    errors=list(scan_errors or [])
    if len(errors)>100 or not all(isinstance(x,str) and len(x)<=MAX_TEXT for x in errors):
        raise ValueError('Invalid scan errors')
    return {'format':SCHEMA,'schema_version':VERSION,'created_utc':datetime.now(timezone.utc).isoformat(),
            'view_only':True,'source':source,'mode':mode,'total_found':total,
            'truncated':total>len(entries), 'scan_errors':errors,
            'entries':[summary_entry(it) for it in entries]}


def validate_session(session: object) -> dict:
    if not isinstance(session,dict) or set(session)!={'format','schema_version','created_utc',
             'view_only','source','mode','total_found','truncated','scan_errors','entries'}:
        raise ValueError('Unknown session schema')
    if session['format']!=SCHEMA or type(session['schema_version']) is not int or session['schema_version']!=VERSION:
        raise ValueError('Unsupported session format version')
    if session['view_only'] is not True:
        raise ValueError('Recovery-capable session imports are not supported')
    _clean_text(session['created_utc'],'date',100)
    if session['mode'] not in ALLOWED_MODES:
        raise ValueError('Invalid mode')
    if not isinstance(session['source'],str) or not session['source'] or len(session['source'])>MAX_TEXT:
        raise ValueError('Invalid session source')
    total=session['total_found'];rows=session['entries']
    if type(total) is not int or not 0<=total<=2**32 or not isinstance(rows,list) or len(rows)>MAX_ENTRIES or total<len(rows):
        raise ValueError('Invalid session entry count')
    if type(session['truncated']) is not bool or session['truncated']!=(total>len(rows)):
        raise ValueError('Invalid result truncation flag')
    errors=session['scan_errors']
    if not isinstance(errors,list) or len(errors)>100 or not all(isinstance(x,str) and len(x)<=MAX_TEXT for x in errors):
        raise ValueError('Invalid session errors')
    for row in rows:_validate_entry(row)
    return session


def save_session(destination: str, document: dict) -> str:
    """Create exclusively, never overwrite an existing session, no symlink following."""
    validate_session(document)
    data=json.dumps(document,ensure_ascii=False,indent=2).encode('utf-8')
    if len(data)>MAX_JSON_BYTES:
        raise ValueError('Session summary too large')
    dest=Path(destination)
    if not dest.parent.is_dir():raise ValueError('Destination folder is missing')
    flags=os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os,'O_BINARY'):flags|=os.O_BINARY
    fd=os.open(str(dest), flags, 0o600)
    try:
        with os.fdopen(fd,'wb') as out:
            out.write(data)
            out.flush()
            os.fsync(out.fileno())
    except BaseException:
        dest.unlink(missing_ok=True)
        raise
    return str(dest)


def load_session(filename: str) -> dict:
    path=Path(filename)
    if path.is_symlink() or not path.is_file() or path.stat().st_size>MAX_JSON_BYTES:
        raise ValueError('Invalid or oversized session file')
    with path.open('rb') as f:
        content=f.read(MAX_JSON_BYTES+1)
    if len(content)>MAX_JSON_BYTES:
        raise ValueError('Session exceeds size limit')
    try:
        doc=json.loads(content.decode('utf-8'))
    except (UnicodeError,json.JSONDecodeError) as exc:
        raise ValueError('Malformed session JSON') from exc
    return validate_session(doc)
