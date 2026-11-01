"""Strict local cookie-file import for a stopped, isolated Camoufox profile.

Supports Murdilimax JSON, Playwright storage_state and Netscape cookies.txt.
Imports with Firefox's own Playwright context.add_cookies API rather than
direct SQLite writes, and retains a backup of existing cookies.
"""
from __future__ import annotations

from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
import ipaddress
import json
import math
import os
import re
import sqlite3
import uuid

from cookie_manager import _maintenance, _columns, _backup_directory
from identity import get_identity, resolved_os
from engine_setup import ensure_engine_ready

MAX_FILE = 5 * 1024 * 1024
MAX_ROWS = 5000
HOST_LABEL = re.compile(r"^[a-z0-9-]{1,63}$")
COOKIE_NAME = re.compile(r"^[A-Za-z0-9!#$%&'*+.^_|~-]{1,256}$")


@dataclass(frozen=True)
class CookieImportPreview:
    count: int
    domains: int
    format: str


def _safe_path(source):
    path = Path(source)
    if (path.is_symlink() or not path.is_file()
            or path.suffix.lower() not in (".json", ".txt")):
        raise ValueError("Select a local JSON or Netscape TXT cookie file")
    if not 0 < path.stat().st_size <= MAX_FILE:
        raise ValueError("Cookie files must be between 1 byte and 5 MB")
    return path


def _host(host):
    if not isinstance(host, str) or len(host) > 254:
        raise ValueError("Invalid cookie domain")
    original = host.strip().lower()
    include = original.startswith(".")
    naked = original.lstrip(".")
    if not naked or any(c in naked for c in ("/", ":", "@", "*", "\\", " ", "\x00")):
        raise ValueError("Invalid cookie domain")
    try:
        ipaddress.ip_address(naked)
        if include:
            raise ValueError("IP addresses cannot include subdomains")
        return naked
    except ValueError as exc:
        if "cannot include" in str(exc):
            raise
    try:
        ascii_host = naked.encode("idna").decode("ascii")
    except UnicodeError:
        raise ValueError("Invalid international cookie domain") from None
    labels = ascii_host.split(".")
    if (len(ascii_host) > 253 or
            any(not HOST_LABEL.fullmatch(x) or x.startswith("-") or x.endswith("-")
                for x in labels) or
            len(labels) == 1 and ascii_host != "localhost"):
        raise ValueError("Invalid cookie domain")
    return ("." if include else "") + ascii_host


def _site(value):
    if value is None:
        return None
    if type(value) is int:
        return {-1: None, 0: "None", 1: "Lax", 2: "Strict"}.get(value, "invalid")
    if isinstance(value, str):
        return {"none": "None", "lax": "Lax", "strict": "Strict",
                "unspecified": None}.get(value.lower(), "invalid")
    return "invalid"


def _cookie(row):
    if not isinstance(row, dict):
        raise ValueError("Cookie entry must be an object")
    if row.get("originAttributes") not in (None, "") or row.get("partitionKey") is not None:
        raise ValueError("Firefox container and partitioned cookies are not supported")
    name, value = row.get("name"), row.get("value")
    if (not isinstance(name, str) or not COOKIE_NAME.fullmatch(name)
            or not isinstance(value, str) or len(value.encode("utf-8")) > 4096
            or any(c in value for c in ("\x00", "\r", "\n", ";"))):
        raise ValueError("Cookie name/value invalid or oversized")
    host = _host(row.get("domain", row.get("host")))
    path = row.get("path", "/")
    if (not isinstance(path, str) or len(path) > 1024 or
            not path.startswith("/") or any(c in path for c in ("\x00", "\r", "\n"))):
        raise ValueError("Cookie path invalid")
    secure, http = row.get("secure", row.get("isSecure", False)), row.get(
        "httpOnly", row.get("isHttpOnly", False))
    if type(secure) not in (bool, int) or type(http) not in (bool, int):
        raise ValueError("Invalid cookie flags")
    if int(secure) not in (0, 1) or int(http) not in (0, 1):
        raise ValueError("Invalid cookie flags")
    secure, http = bool(secure), bool(http)
    same = _site(row.get("sameSite"))
    if same == "invalid":
        raise ValueError("Invalid SameSite setting")
    if same == "None" and not secure:
        raise ValueError("SameSite None requires Secure")
    if name.startswith("__Secure-") and not secure:
        raise ValueError("__Secure- requires Secure")
    if name.startswith("__Host-") and (not secure or path != "/" or host.startswith(".")):
        raise ValueError("__Host- requires Secure, host-only, Path=/")
    expiry = row.get("expires", row.get("expiry", -1))
    if (type(expiry) not in (int, float) or not math.isfinite(expiry)
            or expiry < -1 or expiry > 253402300799):
        raise ValueError("Invalid expiration timestamp")
    cookie = {"name": name, "value": value, "domain": host,
              "path": path, "secure": secure, "httpOnly": http}
    if expiry > 0:
        cookie["expires"] = float(expiry)
    if same is not None:
        cookie["sameSite"] = same
    return cookie


def _netscape(content):
    result = []
    for index, raw in enumerate(content.splitlines(), 1):
        if not raw.strip() or raw.startswith("#") and not raw.startswith("#HttpOnly_"):
            continue
        http = raw.startswith("#HttpOnly_")
        if http:
            raw = raw[len("#HttpOnly_"):]
        fields = raw.split("\t", 6)
        if len(fields) != 7:
            raise ValueError("Invalid Netscape cookie on line " + str(index))
        host, subdomains, path, secure, expires, name, value = fields
        if subdomains.upper() not in ("TRUE", "FALSE") or secure.upper() not in ("TRUE", "FALSE"):
            raise ValueError("Invalid Netscape cookie flags")
        if not re.fullmatch(r"[0-9]{1,12}", expires):
            raise ValueError("Invalid Netscape expiration")
        host = ("." if subdomains.upper() == "TRUE" else "") + host.lstrip(".")
        result.append({"name": name, "value": value, "domain": host,
                       "path": path, "httpOnly": http,
                       "secure": secure.upper() == "TRUE",
                       "expires": int(expires)})
    return result, "Netscape TXT"


def read_cookie_file(source):
    path = _safe_path(source)
    try:
        contents = path.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeError):
        raise ValueError("Cannot read UTF-8 cookie file") from None
    if path.suffix.lower() == ".txt":
        rows, fmt = _netscape(contents)
    else:
        try:
            doc = json.loads(contents)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON cookies") from None
        if isinstance(doc, list):
            rows, fmt = doc, "Cookie JSON"
        elif isinstance(doc, dict) and isinstance(doc.get("cookies"), list):
            rows = doc["cookies"]
            fmt = "Murdilimax JSON" if doc.get("format") == "murdilimax-cookies-v1" else "Playwright JSON"
        else:
            raise ValueError("Expected JSON cookies array or storage state")
    if not 1 <= len(rows) <= MAX_ROWS:
        raise ValueError("Cookie file must have 1 to 5000 cookies")
    cookies = [_cookie(row) for row in rows]
    keys = [(c["domain"], c["path"], c["name"]) for c in cookies]
    if len(set(keys)) != len(keys):
        raise ValueError("Cookie file has duplicate name/domain/path entries")
    summary = CookieImportPreview(len(cookies), len({c["domain"].lstrip(".") for c in cookies}), fmt)
    return summary, cookies


def inspect_cookie_file(source):
    return read_cookie_file(source)[0]


def import_cookies(store, profile_id, source, *, context_factory=None,
                   check_engine=None):
    """Merge cookies with the real Firefox API; never visit a URL or upload data."""
    preview, cookies = read_cookie_file(source)
    with _maintenance(store, profile_id) as db:
        rollback = None
        if db.exists():
            backup_dir = _backup_directory(store, create=True)
            rollback = backup_dir / (profile_id + "-" + uuid.uuid4().hex[:12] + ".sqlite")
            fd = os.open(rollback, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            os.close(fd)
            try:
                with closing(sqlite3.connect(db, timeout=5)) as source_db:
                    _columns(source_db)
                    with closing(sqlite3.connect(rollback, timeout=5)) as backup_db:
                        source_db.backup(backup_db)
            except (sqlite3.Error, ValueError):
                if rollback.stat().st_size == 0:
                    rollback.unlink(missing_ok=True)
                raise ValueError("Could not back up existing cookies; import cancelled") from None
        folder = db.parent.parent
        profile = store.get_profile(profile_id)
        (check_engine or ensure_engine_ready)()
        fingerprint = get_identity(folder, profile.get("os", "native"))
        if context_factory is None:
            from camoufox.sync_api import Camoufox
            context_factory = Camoufox
        try:
            with context_factory(
                    headless=True, persistent_context=True,
                    user_data_dir=str(folder / "data"),
                    os=resolved_os(profile.get("os", "native")),
                    fingerprint=fingerprint, geoip=False) as context:
                # Initializing one about:blank page warms Firefox's persistent
                # cookie service without visiting ANY external website.
                page = context.new_page()
                page.goto("about:blank")
                context.add_cookies(cookies)
                # Firefox may silently decline invalid cookies. Refuse to
                # report success unless its live cookie jar contains them.
                installed = {(r["domain"], r["path"], r["name"])
                             for r in context.cookies()}
                expected = {(r["domain"], r["path"], r["name"])
                            for r in cookies}
                if not expected.issubset(installed):
                    raise ValueError("Firefox rejected one or more imported cookies")
                page.wait_for_timeout(1000)
        except Exception:
            # Retain private pre-import snapshot for manual recovery. Never
            # overwrite Firefox DB while a crashed context may have WAL files.
            raise ValueError("Cookie import failed. Check the local backup before retrying.") from None
        return preview.count, rollback
