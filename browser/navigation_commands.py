"""Session-bound local Camoufox navigation commands.

The GUI sends only user-approved HTTP(S) URLs to already-running, local profiles.
Commands are scoped to the current browser process using a random session token.
No web-exposed service, scripts, cookies, credentials, or arbitrary file paths.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import uuid
from pathlib import Path
from urllib.parse import urlsplit

SESSION_FILE = ".navigation-session"
COMMAND_DIR = ".navigation-requests"
TOKEN_RE = re.compile(r"[0-9a-f]{48}\Z")
COMMAND_RE = re.compile(r"[0-9a-f]{32}\.json\Z")
MAX_URL = 2048
MAX_COMMAND = 4096
MAX_PENDING = 20
MAX_TARGETS = 20


def validated_navigation_url(value):
    if not isinstance(value, str) or not 1 <= len(value) <= MAX_URL:
        raise ValueError("URL must contain at most 2048 characters")
    if any(c.isspace() or ord(c) < 32 or ord(c) == 127 for c in value):
        raise ValueError("URL cannot contain whitespace or control characters")
    try:
        parts = urlsplit(value)
        if (parts.scheme not in ("http", "https") or not parts.hostname
                or parts.username is not None or parts.password is not None
                or parts.port == 0):
            raise ValueError("Only HTTP(S) URLs without embedded passwords are supported")
    except ValueError:
        raise ValueError("Only valid HTTP(S) URLs without credentials are supported") from None
    return value


def _command_folder(profile_folder):
    folder = Path(profile_folder) / COMMAND_DIR
    if folder.is_symlink():
        raise RuntimeError("Unsafe navigation command directory")
    folder.mkdir(mode=0o700, exist_ok=True)
    if not folder.is_dir() or folder.is_symlink():
        raise RuntimeError("Unsafe navigation command directory")
    if os.name != "nt":
        folder.chmod(0o700)
    return folder


def _read_session(folder):
    file = Path(folder) / SESSION_FILE
    if file.is_symlink() or not file.is_file():
        raise RuntimeError("Browser has no active navigation session")
    stat = file.stat()
    if stat.st_size <= 0 or stat.st_size > 256:
        raise RuntimeError("Invalid browser navigation session")
    try:
        data = json.loads(file.read_text(encoding="ascii"))
    except (ValueError, OSError, UnicodeError):
        raise RuntimeError("Invalid browser navigation session") from None
    if (not isinstance(data, dict) or type(data.get("pid")) is not int
            or data["pid"] <= 0 or not isinstance(data.get("token"), str)
            or not TOKEN_RE.fullmatch(data["token"])):
        raise RuntimeError("Invalid browser navigation session")
    return data


def create_navigation_session(folder, pid):
    """Called by the Camoufox child after it has acquired the browser lock."""
    if type(pid) is not int or pid <= 0:
        raise ValueError("Invalid browser process")
    folder = Path(folder)
    _command_folder(folder)
    token = secrets.token_hex(24)
    path = folder / SESSION_FILE
    tmp = folder / (SESSION_FILE + "." + uuid.uuid4().hex + ".tmp")
    try:
        fd = os.open(tmp, os.O_WRONLY | os.O_EXCL | os.O_CREAT, 0o600)
        with os.fdopen(fd, "w", encoding="ascii") as output:
            json.dump({"pid": pid, "token": token}, output)
            output.flush()
            os.fsync(output.fileno())
        if path.is_symlink():
            raise RuntimeError("Unsafe navigation session")
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)
    return token


def close_navigation_session(folder, token):
    if not isinstance(token, str) or not TOKEN_RE.fullmatch(token):
        return False
    path = Path(folder) / SESSION_FILE
    try:
        if _read_session(folder)["token"] != token:
            return False
        path.unlink()
        return True
    except (OSError, RuntimeError):
        return False


def _active_session(store, pid, *, alive):
    from engine import safe_profile_id
    profile_id = safe_profile_id(pid)
    if store.get_profile(profile_id) is None:
        raise ValueError("Selected profile no longer exists")
    folder = store.root / "profiles" / profile_id
    lock = folder / ".lock"
    if lock.is_symlink() or not lock.is_file():
        raise RuntimeError("Profile is not running")
    try:
        owner = int(lock.read_text(encoding="ascii").strip())
    except (OSError, ValueError, UnicodeError):
        raise RuntimeError("Invalid browser process lock") from None
    if owner <= 0 or not alive(owner):
        raise RuntimeError("Profile is not running")
    session = _read_session(folder)
    if session["pid"] != owner:
        raise RuntimeError("Browser has changed since navigation was requested")
    return folder, session


def submit_navigation(store, profile_ids, url, *, verify=None, alive=None):
    """Preflight all selected profiles and live paid licences before any write.

    Returns count of *queued* requests, not successful website navigations.
    """
    from engine import pid_alive, verify_commercial_access
    from launch_guard import launch_pending
    url = validated_navigation_url(url)
    if not isinstance(profile_ids, (list, tuple)) or not 1 <= len(profile_ids) <= MAX_TARGETS:
        raise ValueError("Select 1–20 running profiles")
    if len(set(profile_ids)) != len(profile_ids):
        raise ValueError("Duplicate profile selected")
    verify = verify if verify is not None else verify_commercial_access
    alive = alive if alive is not None else pid_alive
    ready = []
    for profile_id in profile_ids:
        folder, session = _active_session(store, profile_id, alive=alive)
        if launch_pending(folder):
            raise RuntimeError("Profile is still starting")
        if (folder / ".cookie-maintenance").exists() or (
                folder / ".addon-maintenance").exists():
            raise RuntimeError("Profile maintenance is in progress")
        verify(store, profile_id)
        commands = _command_folder(folder)
        count = sum(1 for p in commands.iterdir() if p.is_file() and
                    COMMAND_RE.fullmatch(p.name))
        if count >= MAX_PENDING:
            raise RuntimeError("Profile navigation queue is full")
        ready.append((profile_id, folder, session, commands))
    accepted = 0
    for profile_id, folder, original, commands in ready:
        # A browser restart between preflight and commit must not receive
        # a command for the previous session.
        current = _active_session(store, profile_id, alive=alive)[1]
        if current != original:
            raise RuntimeError("Browser restarted during navigation request")
        item = commands / (uuid.uuid4().hex + ".json")
        payload = json.dumps({"token": original["token"], "url": url},
                             ensure_ascii=False).encode("utf-8")
        if len(payload) > MAX_COMMAND:
            raise ValueError("URL is too large for a navigation request")
        fd = os.open(item, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            with os.fdopen(fd, "wb") as writer:
                writer.write(payload)
                writer.flush()
                os.fsync(writer.fileno())
        except Exception:
            item.unlink(missing_ok=True)
            raise
        accepted += 1
    return {"queued": accepted}


def consume_navigation(context, folder, token):
    """Called only by owning Camoufox child on its browser event loop.

    Deletes each request before navigation. Never logs URL/query strings.
    Invalid and stale requests are discarded; no code or JS is interpreted.
    """
    if not isinstance(token, str) or not TOKEN_RE.fullmatch(token):
        raise ValueError("Invalid browser session")
    commands = _command_folder(folder)
    stats = {"opened": 0, "failed": 0, "ignored": 0}
    selected = sorted(commands.iterdir(), key=lambda p: p.name)[:MAX_PENDING]
    for path in selected:
        if not COMMAND_RE.fullmatch(path.name):
            continue
        try:
            if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_COMMAND:
                stats["ignored"] += 1
                continue
            body = json.loads(path.read_text(encoding="utf-8"))
            # Destructive consumption before browser operations also ensures
            # a crash/restart cannot replay a navigation request.
            path.unlink()
            if (not isinstance(body, dict) or set(body) != {"token", "url"}
                    or body["token"] != token):
                stats["ignored"] += 1
                continue
            url = validated_navigation_url(body["url"])
        except (ValueError, OSError, UnicodeError, KeyError, TypeError):
            stats["ignored"] += 1
            continue
        page = None
        try:
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=20000)
            stats["opened"] += 1
        except Exception:
            stats["failed"] += 1
            if page is not None:
                try:
                    page.close()
                except Exception:
                    pass
    return stats
