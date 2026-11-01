"""Local bookmark catalog and offline start page for Murdilimax-owned profiles.

Bookmarks are local metadata, not Firefox-native bookmarks or cloud sync.
No remote navigation occurs until a user clicks a bookmark.
"""
from __future__ import annotations

from html import escape
import re
import uuid
from urllib.parse import urlsplit

from store import now

MAX_BOOKMARKS = 500
MAX_GROUP_LENGTH = 80
MAX_NAME_LENGTH = 100
MAX_URL_LENGTH = 2048
ID_PATTERN = re.compile(r"[0-9a-f]{32}\Z")


def validate_bookmark(name, url, group=""):
    if not isinstance(name, str) or not 0 < len(name.strip()) <= MAX_NAME_LENGTH:
        raise ValueError("Bookmark name must be 1–100 characters")
    if not isinstance(group, str) or len(group.strip()) > MAX_GROUP_LENGTH:
        raise ValueError("Bookmark group is too long")
    if not isinstance(url, str) or not 0 < len(url) <= MAX_URL_LENGTH:
        raise ValueError("Bookmark URL length must be 1–2048")
    if any(char.isspace() or ord(char) < 32 or ord(char) == 127 for char in url):
        raise ValueError("Bookmark URL cannot contain whitespace or control characters")
    try:
        parsed = urlsplit(url)
        valid = (parsed.scheme in ("http", "https") and bool(parsed.hostname)
                 and parsed.username is None and parsed.password is None
                 and parsed.port != 0)
    except ValueError:
        valid = False
    if not valid:
        raise ValueError("Bookmark URL must be a valid http(s) link without credentials")
    return {"name": name.strip(), "url": url, "group": group.strip()}


def _read_validated(store):
    rows = store._read("bookmarks")
    if len(rows) > MAX_BOOKMARKS:
        raise ValueError("Too many stored bookmarks")
    checked = []
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not ID_PATTERN.fullmatch(row["id"]):
            raise ValueError("Malformed bookmark metadata")
        fields = validate_bookmark(row.get("name"), row.get("url"), row.get("group", ""))
        checked.append({"id": row["id"], **fields})
    if len({row["id"] for row in checked}) != len(checked):
        raise ValueError("Duplicate bookmark identifiers")
    return checked


def list_bookmarks(store):
    return _read_validated(store)


def add_bookmark(store, name, url, group=""):
    record = validate_bookmark(name, url, group)
    items = _read_validated(store)
    if len(items) >= MAX_BOOKMARKS:
        raise ValueError("Bookmark limit reached (500)")
    new = {"id": uuid.uuid4().hex, **record, "created_at": now()}
    store._write("bookmarks", store._read("bookmarks") + [new])
    return new


def update_bookmark(store, bookmark_id, name, url, group=""):
    if not isinstance(bookmark_id, str) or not ID_PATTERN.fullmatch(bookmark_id):
        raise ValueError("Invalid bookmark id")
    record = validate_bookmark(name, url, group)
    items = store._read("bookmarks")
    _read_validated(store)
    selected = next((row for row in items if row["id"] == bookmark_id), None)
    if selected is None:
        raise ValueError("Bookmark not found")
    selected.update(record)
    selected["updated_at"] = now()
    store._write("bookmarks", items)
    return selected


def remove_bookmark(store, bookmark_id):
    if not isinstance(bookmark_id, str) or not ID_PATTERN.fullmatch(bookmark_id):
        raise ValueError("Invalid bookmark id")
    items = store._read("bookmarks")
    _read_validated(store)
    filtered = [row for row in items if row["id"] != bookmark_id]
    if len(filtered) == len(items):
        raise ValueError("Bookmark not found")
    store._write("bookmarks", filtered)


def bookmarks_for_profile(store, profile):
    if not isinstance(profile, dict):
        raise ValueError("Invalid profile")
    group = profile.get("group", "")
    if not isinstance(group, str):
        raise ValueError("Invalid profile group")
    return [b for b in _read_validated(store)
            if not b["group"] or b["group"] == group]


def bookmark_dashboard(bookmarks):
    """Generate a fixed-script-free HTML document with escaped user content."""
    if not isinstance(bookmarks, (list, tuple)) or len(bookmarks) > MAX_BOOKMARKS:
        raise ValueError("Invalid bookmark dashboard")
    entries = []
    for item in bookmarks:
        if not isinstance(item, dict):
            raise ValueError("Invalid bookmark")
        checked = validate_bookmark(item.get("name"), item.get("url"),
                                    item.get("group", ""))
        entries.append('<a class="link" href="' + escape(checked["url"], quote=True) +
                       '" rel="noreferrer">' + escape(checked["name"]) + '</a>')
    cards = "\n".join(entries) or '<p class="empty">Добавьте закладки в Murdilimax Browser / Add bookmarks in the app.</p>'
    return ('<!doctype html><html lang="ru"><head><meta charset="utf-8">'
            '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; '
            'style-src &#39;unsafe-inline&#39;; form-action &#39;none&#39;; base-uri &#39;none&#39;">'
            '<title>Murdilimax · Закладки</title>'
            '<style>html{color-scheme:dark;background:#101729;color:#e7e8ff;font:16px system-ui}'
            'main{margin:7vh auto;max-width:820px;padding:24px}'
            'h1{font-size:32px;letter-spacing:.04em}.note{color:#a5a8ca}'
            '.links{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}'
            '.link{display:block;padding:16px;background:#192140;color:#a1f4ef;'
            'border:1px solid #51497f;border-radius:10px;text-decoration:none;overflow-wrap:anywhere}'
            '.link:focus,.link:hover{border-color:#79e7de}.empty{color:#a5a8ca}'
            '</style></head><body><main><p class="note">MURDILIMAX / LOCAL</p>'
            '<h1>Закладки / Bookmarks</h1><p class="note">Локальные ссылки для этого профиля'
            ' · Local links for this profile</p><div class="links">' + cards +
            '</div></main></body></html>')
