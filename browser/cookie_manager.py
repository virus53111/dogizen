"""Offline Firefox/Camoufox cookie inventory, private export, recoverable clear.

Cookies contain session secrets. Never log values, send them to servers,
or include them in a normal settings export.
"""
from __future__ import annotations
from contextlib import contextmanager, closing
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import sqlite3
import uuid

from engine import safe_profile_id

MAX_COOKIES_EXPORT = 20000
MAX_DATABASE_BYTES = 250 * 1024 * 1024
COOKIE_FIELDS = ("name", "value", "host", "path", "expiry",
                 "isSecure", "isHttpOnly", "sameSite", "originAttributes")


@dataclass(frozen=True)
class CookieInventory:
    count: int
    domains: int
    present: bool
    top_domains: tuple[tuple[str, int], ...] = ()


def _database(store, profile_id):
    safe_profile_id(profile_id)
    if store.get_profile(profile_id) is None:
        raise ValueError("Profile does not exist")
    folder = store.root / "profiles" / profile_id
    data = folder / "data"
    db = data / "cookies.sqlite"
    if folder.is_symlink() or data.is_symlink() or db.is_symlink():
        raise ValueError("Unsafe profile cookie path")
    for suffix in ("-wal", "-shm", "-journal"):
        if Path(str(db) + suffix).is_symlink():
            raise ValueError("Unsafe cookie database auxiliary path")
    if not folder.is_dir():
        raise ValueError("Profile directory missing")
    if (folder / ".lock").exists() or (folder / ".launching").exists():
        raise ValueError("Stop the profile before managing cookies")
    if db.exists() and (not db.is_file() or db.stat().st_size > MAX_DATABASE_BYTES):
        raise ValueError("Cookie database unsupported or too large")
    return folder, db


@contextmanager
def _maintenance(store, profile_id):
    folder, db = _database(store, profile_id)
    marker = folder / ".cookie-maintenance"
    try:
        fd = os.open(marker, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
    except FileExistsError:
        raise ValueError("Cookie maintenance is already in progress") from None
    try:
        if (folder / ".lock").exists() or (folder / ".launching").exists():
            raise ValueError("Stop the profile before managing cookies")
        yield db
    finally:
        marker.unlink(missing_ok=True)


def _columns(conn):
    if conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='moz_cookies'"
    ).fetchone() is None:
        raise ValueError("Firefox cookie table not found")
    columns = {r[1] for r in conn.execute("PRAGMA table_info(moz_cookies)")}
    if not {"name", "value", "host", "path"}.issubset(columns):
        raise ValueError("Firefox cookie schema unsupported")
    return columns


def _read_only(db):
    return sqlite3.connect(db.resolve().as_uri() + "?mode=ro", uri=True, timeout=5)


def cookie_inventory(store, profile_id):
    """Count cookie rows and domains, never expose secret values."""
    with _maintenance(store, profile_id) as db:
        if not db.exists():
            return CookieInventory(0, 0, False)
        try:
            with closing(_read_only(db)) as conn:
                _columns(conn)
                count = conn.execute("SELECT COUNT(*) FROM moz_cookies").fetchone()[0]
                domains = conn.execute(
                    "SELECT COUNT(DISTINCT host) FROM moz_cookies").fetchone()[0]
                top = tuple((str(host), int(n)) for host, n in conn.execute(
                    "SELECT host, COUNT(*) FROM moz_cookies "
                    "GROUP BY host ORDER BY COUNT(*) DESC, host LIMIT 8").fetchall())
                return CookieInventory(int(count), int(domains), True, top)
        except sqlite3.Error:
            raise ValueError("Could not read local cookie database") from None


def export_cookies(store, profile_id, destination):
    """Explicit JSON export of cookie secrets; create-only with mode 0600."""
    target = Path(destination)
    with _maintenance(store, profile_id) as db:
        if not db.exists():
            raise ValueError("No cookie database in selected profile")
        if target.exists() or target.is_symlink():
            raise ValueError("Export target exists; choose a new filename")
        if target.resolve().is_relative_to(store.root.resolve()):
            raise ValueError("Export outside Murdilimax app storage")
        try:
            with closing(_read_only(db)) as conn:
                fields = [name for name in COOKIE_FIELDS if name in _columns(conn)]
                count = conn.execute("SELECT COUNT(*) FROM moz_cookies").fetchone()[0]
                if count > MAX_COOKIES_EXPORT:
                    raise ValueError("Cookie export exceeds 20,000 cookies")
                query = "SELECT " + ", ".join('"' + field + '"' for field in fields) + " FROM moz_cookies"
                cookies = [dict(zip(fields, row)) for row in conn.execute(query)]
        except sqlite3.Error:
            raise ValueError("Could not read local cookie database") from None
        payload = {
            "format": "murdilimax-cookies-v1",
            "notice": "SENSITIVE: cookies may provide access to online accounts",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "cookies": cookies,
        }
        fd = None
        try:
            fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as out:
                fd = None
                json.dump(payload, out, ensure_ascii=False, indent=2)
                out.flush()
                os.fsync(out.fileno())
        except Exception:
            if fd is not None:
                os.close(fd)
            target.unlink(missing_ok=True)
            raise
        return int(count)


def clear_cookies(store, profile_id):
    """Create private local SQLite backup, then clear only moz_cookies rows."""
    with _maintenance(store, profile_id) as db:
        if not db.exists():
            return 0, None
        directory = store.root / "cookie-backups"
        if directory.is_symlink():
            raise ValueError("Unsafe backup directory")
        directory.mkdir(mode=0o700, exist_ok=True)
        if os.name != "nt":
            directory.chmod(0o700)
        backup = directory / (profile_id + "-" + uuid.uuid4().hex[:12] + ".sqlite")
        fd = os.open(backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        try:
            with closing(sqlite3.connect(db, timeout=5)) as source:
                _columns(source)
                with closing(sqlite3.connect(backup)) as dest:
                    source.backup(dest)
            with closing(sqlite3.connect(db, timeout=5)) as source:
                _columns(source)
                source.execute("PRAGMA secure_delete=ON")
                source.execute("BEGIN IMMEDIATE")
                count = source.execute("SELECT COUNT(*) FROM moz_cookies").fetchone()[0]
                source.execute("DELETE FROM moz_cookies")
                source.commit()
            return int(count), backup
        except sqlite3.Error:
            # Retain any useful backup for recovery.
            if backup.exists() and backup.stat().st_size == 0:
                backup.unlink(missing_ok=True)
            raise ValueError("Cookie deletion failed; inspect the local backup") from None


@dataclass(frozen=True)
class CookieBackup:
    """Only non-secret information suitable for the backup picker."""
    filename: str
    modified_at: str
    size_bytes: int


def _backup_directory(store, create=False):
    directory = store.root / "cookie-backups"
    if directory.is_symlink() or (directory.exists() and not directory.is_dir()):
        raise ValueError("Unsafe cookie backup directory")
    if create:
        directory.mkdir(mode=0o700, exist_ok=True)
        if os.name != "nt":
            directory.chmod(0o700)
    return directory


def _backup_path(store, profile_id, filename):
    """Never accept arbitrary paths, another profile's archive or a symlink."""
    safe_profile_id(profile_id)
    if (not isinstance(filename, str) or
            not re.fullmatch(re.escape(profile_id) + r"-[0-9a-f]{12}\.sqlite", filename)):
        raise ValueError("Select a backup belonging to this profile")
    path = _backup_directory(store) / filename
    if path.is_symlink() or not path.is_file():
        raise ValueError("Local cookie backup is missing or unsafe")
    size = path.stat().st_size
    if not 0 < size <= MAX_DATABASE_BYTES:
        raise ValueError("Cookie backup is empty or too large")
    return path


def list_cookie_backups(store, profile_id, limit=30):
    """List local backups for one existing profile without loading token values."""
    _profile_folder, _db = _database(store, profile_id)
    directory = _backup_directory(store)
    if not directory.exists():
        return []
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 100:
        raise ValueError("Invalid backup listing limit")
    matches = []
    for candidate in directory.iterdir():
        # Never surface other profiles, arbitrary SQLite files or symlinks.
        if not re.fullmatch(re.escape(profile_id) + r"-[0-9a-f]{12}\.sqlite", candidate.name):
            continue
        if candidate.is_symlink() or not candidate.is_file():
            continue
        stat_result = candidate.stat()
        if not 0 < stat_result.st_size <= MAX_DATABASE_BYTES:
            continue
        timestamp = datetime.fromtimestamp(
            stat_result.st_mtime, tz=timezone.utc).isoformat(timespec="seconds")
        matches.append(CookieBackup(candidate.name, timestamp, stat_result.st_size))
    return sorted(matches, key=lambda item: (item.modified_at, item.filename),
                  reverse=True)[:limit]


def restore_cookie_backup(store, profile_id, filename):
    """Restore *this profile's* local SQLite backup, preserving current data first.

    No arbitrary import: only app-local, profile-prefixed backup names. Must
    be stopped, pass a SQLite integrity check and have moz_cookies schema.
    A second private snapshot of the current database is created before
    any modification. Keep it for manual recovery if anything fails.
    """
    with _maintenance(store, profile_id) as db:
        backup = _backup_path(store, profile_id, filename)
        if db.exists() and (not db.is_file() or db.is_symlink()):
            raise ValueError("Unsafe current cookie database")
        try:
            with closing(_read_only(backup)) as source:
                _columns(source)
                if source.execute("PRAGMA quick_check").fetchone() != ("ok",):
                    raise ValueError("Cookie backup failed SQLite integrity check")
                count = int(source.execute("SELECT COUNT(*) FROM moz_cookies").fetchone()[0])
        except sqlite3.Error:
            raise ValueError("Cookie backup is damaged or not a Firefox database") from None

        # The backup is a sensitive, local snapshot of the CURRENT database.
        # It is kept even if the restore is unsuccessful, for recovery.
        rollback_path = None
        if db.exists():
            directory = _backup_directory(store, create=True)
            rollback_path = directory / (profile_id + "-" + uuid.uuid4().hex[:12] + ".sqlite")
            fd = os.open(rollback_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            os.close(fd)
            try:
                with closing(sqlite3.connect(db, timeout=5)) as current:
                    _columns(current)
                    with closing(sqlite3.connect(rollback_path, timeout=5)) as snapshot:
                        current.backup(snapshot)
            except (sqlite3.Error, ValueError):
                if rollback_path.exists() and rollback_path.stat().st_size == 0:
                    rollback_path.unlink(missing_ok=True)
                raise ValueError("Cannot safely snapshot current cookies; restore cancelled") from None
        else:
            data = db.parent
            if data.is_symlink():
                raise ValueError("Unsafe browser data directory")
            data.mkdir(mode=0o700, parents=True, exist_ok=True)

        try:
            # Online backup API manages SQLite transactions and WAL correctly,
            # avoiding raw overwrite of a possibly WAL-mode Firefox database.
            with closing(_read_only(backup)) as source:
                with closing(sqlite3.connect(db, timeout=5)) as current:
                    source.backup(current)
                    current.commit()
                    _columns(current)
        except (sqlite3.Error, ValueError):
            raise ValueError("Cookie restoration failed; current-state backup retained") from None
        return count, rollback_path
