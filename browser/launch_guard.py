"""Atomic profile-launch reservations shared by the UI and browser child.

A .launching marker covers the short gap between subprocess.Popen and the
child obtaining the normal .lock. It prevents rapid repeated clicks from
spawning duplicate Camoufox processes. Tokens ensure the wrong child cannot
release another launcher's reservation. No account or browsing data stored.
"""
from __future__ import annotations

import os
from pathlib import Path
import time
import uuid

LAUNCH_MARKER = ".launching"
LAUNCH_TOKEN_ENV = "MURDILIMAX_LAUNCH_TOKEN"
STALE_AFTER_SECONDS = 180


def launch_pending(folder: str | Path) -> bool:
    return (Path(folder) / LAUNCH_MARKER).exists()


def reserve_launch(folder: str | Path, *, clock=time.time) -> str:
    """Reserve launch with O_EXCL, recover a genuinely old orphan reservation."""
    folder = Path(folder)
    token = uuid.uuid4().hex
    marker = folder / LAUNCH_MARKER
    for _ in range(3):
        try:
            fd = os.open(marker, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        except FileExistsError:
            # Refuse symlinked markers and never follow their targets.
            try:
                info = marker.lstat()
            except FileNotFoundError:
                continue
            if marker.is_symlink() or not marker.is_file():
                raise RuntimeError("Unsafe profile launch marker") from None
            if clock() - info.st_mtime <= STALE_AFTER_SECONDS:
                raise RuntimeError("Profile is already starting; please retry later")
            # Do not remove a pending marker if browser is already open or
            # profile maintenance is active, even if its timestamp is old.
            if any((folder / name).exists() for name in (
                    ".lock", ".cookie-maintenance", ".addon-maintenance")):
                raise RuntimeError("Profile launch or maintenance is already active")
            try:
                current = marker.lstat()
                if (current.st_ino, current.st_mtime_ns) == (
                        info.st_ino, info.st_mtime_ns):
                    marker.unlink()
            except FileNotFoundError:
                pass
            continue
        try:
            with os.fdopen(fd, "w", encoding="ascii") as output:
                output.write(token)
                output.flush()
                os.fsync(output.fileno())
        except Exception:
            release_launch(folder, token)
            raise
        return token
    raise RuntimeError("Profile launch state changed; please retry")


def release_launch(folder: str | Path, token: str | None) -> bool:
    """Only the launcher owning the reservation may remove it."""
    if not token:
        return False
    marker = Path(folder) / LAUNCH_MARKER
    try:
        if marker.is_symlink() or not marker.is_file():
            return False
        if marker.read_text(encoding="ascii").strip() != token:
            return False
        marker.unlink()
        return True
    except (FileNotFoundError, OSError, UnicodeError):
        return False
