"""Camoufox engine readiness probe for clean desktop installations.

The Python library and pinned fpgen model are packaged in the installer.
The actual browser engine is downloaded to the user cache on demand and is
NOT distributed with the small preview installers.
"""
from __future__ import annotations

from pathlib import Path

def ensure_engine_ready(loader=None):
    if loader is None:
        from camoufox.pkgman import camoufox_path
        loader = camoufox_path
    try:
        directory = Path(loader())
    except Exception as exc:
        # Do not render URLs or credentials embedded in network exceptions.
        raise RuntimeError(
            "Camoufox browser engine is unavailable. Check your internet connection "
            "and free disk space, then retry installing the browser engine."
        ) from exc
    if not directory.is_dir():
        raise RuntimeError("Camoufox reported a nonexistent browser installation")
    return directory
