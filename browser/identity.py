"""Immutable per-profile fpgen identity: persist baseline device parameters.

Camoufox's persistent browser directory preserves cookies, but not all of its
generated fingerprint values. Store fpgen's full JSON once and pass it back to
Camoufox on every restart. This does NOT freeze GPU-rendered canvas/audio noise
or validate a proxy network route; those require separate engine tests.
"""
from __future__ import annotations

import json
import os
import sys
import uuid
from pathlib import Path

FILENAME = "fingerprint-v1.json"
VERSION = 1
OSES = frozenset(("windows", "macos", "linux"))

def host_os():
    return {"win32": "windows", "darwin": "macos"}.get(sys.platform, "linux")

def resolved_os(configured):
    result = host_os() if configured == "native" else configured
    if result not in OSES:
        raise ValueError("Unsupported fingerprint OS")
    return result

def _load(path):
    obj = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(obj, dict) or obj.get("version") != VERSION:
        raise ValueError("Unsupported fingerprint file format; restore your backup instead of rotating identity")
    if obj.get("os") not in OSES or not isinstance(obj.get("fingerprint"), dict):
        raise ValueError("Malformed fingerprint identity; browser refused to rotate silently")
    if not obj["fingerprint"].get("navigator"):
        raise ValueError("Incomplete fingerprint identity")
    return obj

def get_identity(profile_dir, configured_os, generator=None):
    """Load one immutable identity or atomically generate it for a new profile.

    No directory traversal and no identity in exported profile metadata. On OS
    changes, fail rather than silently rotating navigator and GPU properties.
    """
    directory = Path(profile_dir)
    os_name = resolved_os(configured_os)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / FILENAME
    if path.exists():
        saved = _load(path)
        if saved["os"] != os_name:
            raise ValueError(
                "Existing browser identity uses " + saved["os"] +
                "; duplicate the profile to use a new OS instead of silently changing identity"
            )
        return saved["fingerprint"]

    if generator is None:
        from camoufox.fingerprints import generate_fingerprint
        generator = generate_fingerprint
    fingerprint = generator(os=os_name)
    if not isinstance(fingerprint, dict) or not fingerprint.get("navigator"):
        raise RuntimeError("Camoufox did not produce a complete Firefox fingerprint")
    data = {"version": VERSION, "os": os_name, "fingerprint": fingerprint}
    encoded = json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    if len(encoded) > 2_000_000:
        raise ValueError("Fingerprint payload exceeds safe limit")
    pending = directory / ("." + uuid.uuid4().hex + ".identity-tmp")
    try:
        fd = os.open(str(pending), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as out:
            out.write(encoded)
            out.flush()
            os.fsync(out.fileno())
        os.replace(pending, path)
    finally:
        pending.unlink(missing_ok=True)
    return fingerprint
