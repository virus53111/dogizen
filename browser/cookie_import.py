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
import time
import uuid

from cookie_manager import _maintenance, _columns, _backup_directory

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
    # Firefox 142+ writes SQLite cookie expirations in milliseconds.
    # Murdilimax exports the raw field; Playwright/Netscape use seconds.
    if fmt == "Murdilimax JSON":
        adjusted = []
        for original in rows:
            if isinstance(original, dict) and "expiry" in original and "expires" not in original:
                raw_expiry = original["expiry"]
                if type(raw_expiry) in (int, float) and raw_expiry > 100_000_000_000:
                    original = {**original, "expiry": raw_expiry / 1000}
            adjusted.append(original)
        rows = adjusted
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
    """Import persistent cookies into an inactive Firefox profile atomically.

    Camoufox/Playwright 0.5.x silently drops imported cookies added to a
    non-navigated headless persistent context on some builds. Use Firefox's
    existing versioned moz_cookies database instead. Explicitly handle the
    Firefox 142+ seconds -> milliseconds expiry migration (schema >=16).
    Never touch a live profile or a database with unknown schema.
    """
    preview, cookies = read_cookie_file(source)
    if any("expires" not in cookie for cookie in cookies):
        raise ValueError("Session-only cookies cannot be imported persistently")
    if any(cookie["expires"] <= time.time() for cookie in cookies):
        raise ValueError("Expired cookies cannot be imported")
    with _maintenance(store, profile_id) as db:
        if not db.exists():
            raise ValueError(
                "Launch and close this browser profile once before importing cookies")
        rollback = None
        try:
            with closing(sqlite3.connect(db, timeout=5)) as current:
                columns = _columns(current)
                schema = current.execute("PRAGMA user_version").fetchone()[0]
                if schema not in (15, 16, 17):
                    raise ValueError("Unsupported Firefox cookie database version")
                required = {"name", "value", "host", "path", "expiry",
                            "lastAccessed", "creationTime", "isSecure",
                            "isHttpOnly", "originAttributes"}
                if not required.issubset(columns):
                    raise ValueError("Firefox cookie schema is incomplete")
                # A new, unknown NOT NULL field without a default would make
                # inserts inconsistent. Fail closed instead of guessing.
                provided = required | {"sameSite", "rawSameSite"}
                for column in current.execute("PRAGMA table_info(moz_cookies)"):
                    _i, name, _type, notnull, default, is_pk = column
                    if notnull and default is None and not is_pk and name not in provided:
                        raise ValueError("Unsupported required Firefox cookie field")
                if current.execute("PRAGMA quick_check").fetchone() != ("ok",):
                    raise ValueError("Firefox cookie database failed integrity check")
                directory = _backup_directory(store, create=True)
                rollback = directory / (profile_id + "-" + uuid.uuid4().hex[:12] + ".sqlite")
                fd = os.open(rollback, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                os.close(fd)
                try:
                    with closing(sqlite3.connect(rollback, timeout=5)) as snapshot:
                        current.backup(snapshot)
                except sqlite3.Error:
                    if rollback.stat().st_size == 0:
                        rollback.unlink(missing_ok=True)
                    raise ValueError("Cannot back up cookies; import cancelled") from None

                fields = ["originAttributes", "name", "value", "host", "path",
                          "expiry", "lastAccessed", "creationTime", "isSecure",
                          "isHttpOnly"]
                if "sameSite" in columns:
                    fields.append("sameSite")
                if "rawSameSite" in columns:
                    fields.append("rawSameSite")
                names = ",".join('"' + field + '"' for field in fields)
                placeholders = ",".join("?" for _ in fields)
                sql = "INSERT OR REPLACE INTO moz_cookies (" + names + ") VALUES (" + placeholders + ")"
                micros = int(time.time() * 1_000_000)
                same_sites = {None: -1, "None": 0, "Lax": 1, "Strict": 2}
                current.execute("BEGIN IMMEDIATE")
                try:
                    for cookie in cookies:
                        same = same_sites[cookie.get("sameSite")]
                        exp = int(cookie["expires"] * (1000 if schema >= 16 else 1))
                        row = {
                            "originAttributes": "", "name": cookie["name"],
                            "value": cookie["value"], "host": cookie["domain"],
                            "path": cookie["path"], "expiry": exp,
                            "lastAccessed": micros, "creationTime": micros,
                            "isSecure": int(cookie["secure"]),
                            "isHttpOnly": int(cookie["httpOnly"]),
                            "sameSite": same, "rawSameSite": same,
                        }
                        current.execute(sql, tuple(row[field] for field in fields))
                    for cookie in cookies:
                        found = current.execute(
                            "SELECT 1 FROM moz_cookies WHERE originAttributes='' AND "
                            "name=? AND host=? AND path=?",
                            (cookie["name"], cookie["domain"], cookie["path"])
                        ).fetchone()
                        if not found:
                            raise ValueError("Cookie could not be saved in Firefox database")
                    current.commit()
                except Exception:
                    current.rollback()
                    raise
        except sqlite3.Error:
            raise ValueError("Firefox cookie import failed; backup retained") from None
        return preview.count, rollback
