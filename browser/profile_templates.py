"""Local, reusable profile templates with atomic, license-checked batch creation.

Templates contain metadata only. Never copy Firefox storage, session files,
cookies, keyring secrets, personal notes, fingerprint identities or addons.
"""
from __future__ import annotations

import os
import re
import uuid
from urllib.parse import urlsplit

from fingerprint_options import validate_screen_limit
from startup_tabs import normalize_extra_urls
from store import now

MAX_TEMPLATES = 50
MAX_TEMPLATE_BATCH = 10
_TEMPLATE_ID = re.compile(r"[0-9a-f]{32}\Z")
FIELDS = ("url", "group", "tags", "proxy_id", "os", "screen_limit", "startup_urls")


def _url(value):
    if value == "about:blank":
        return value
    if not isinstance(value, str) or not 1 <= len(value) <= 2048:
        raise ValueError("Invalid template startup URL")
    if any(ord(c) < 33 or ord(c) == 127 for c in value):
        raise ValueError("Unsafe template URL")
    try:
        p = urlsplit(value)
        if (p.scheme not in ("http", "https") or not p.hostname or
                p.username is not None or p.password is not None or p.port == 0):
            raise ValueError("Invalid template startup URL")
    except ValueError:
        raise ValueError("Invalid template startup URL") from None
    return value


def _validated_metadata(source, proxy_ids, *, require_existing_proxy=True):
    if not isinstance(source, dict):
        raise ValueError("Invalid template settings")
    name = source.get("name")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 75:
        raise ValueError("Template name must be 1–75 characters")
    group = source.get("group", "")
    tags = source.get("tags", "")
    if (not isinstance(group, str) or len(group) > 80 or
            not isinstance(tags, str) or len(tags) > 200):
        raise ValueError("Invalid template group or tags")
    os_choice = source.get("os", "native")
    if os_choice not in ("native", "windows", "macos", "linux"):
        raise ValueError("Invalid template platform")
    proxy = source.get("proxy_id", "")
    if not isinstance(proxy, str) or (proxy and (not _TEMPLATE_ID.fullmatch(proxy) or
                                          (require_existing_proxy and proxy not in proxy_ids))):
        raise ValueError("Referenced proxy is missing")
    url = _url(source.get("url", "about:blank"))
    extra = normalize_extra_urls(source.get("startup_urls", []), primary=url)
    return {
        "name": name.strip(), "url": url, "group": group.strip(),
        "tags": tags.strip(), "proxy_id": proxy, "os": os_choice,
        "screen_limit": validate_screen_limit(source.get("screen_limit", "auto")),
        "startup_urls": extra,
    }


def list_templates(store):
    raw = store._read("templates")
    if len(raw) > MAX_TEMPLATES:
        raise ValueError("Too many templates")
    proxies = {p["id"] for p in store.proxies()}
    result = []
    seen = set()
    for record in raw:
        if (not isinstance(record, dict) or
                not isinstance(record.get("id"), str) or
                not _TEMPLATE_ID.fullmatch(record["id"]) or
                record["id"] in seen):
            raise ValueError("Invalid template database")
        seen.add(record["id"])
        # Missing proxies must not cause silent reassignment to a different proxy.
        validated = _validated_metadata(record, proxies,
                                       require_existing_proxy=False)
        result.append({"id": record["id"], **validated})
    return result


def save_template(store, profile_id, name):
    """Snapshot a profile's safe metadata, not its identity or storage."""
    if not isinstance(profile_id, str) or not _TEMPLATE_ID.fullmatch(profile_id):
        raise ValueError("Invalid source profile")
    source = store.get_profile(profile_id)
    if source is None:
        raise ValueError("Source profile not found")
    if not isinstance(name, str):
        raise ValueError("Invalid template name")
    metadata = _validated_metadata({**source, "name": name}, {p["id"] for p in store.proxies()})
    existing = list_templates(store)
    if len(existing) >= MAX_TEMPLATES:
        raise ValueError("Template limit reached")
    if any(x["name"].casefold() == metadata["name"].casefold() for x in existing):
        raise ValueError("Choose a unique template name")
    template = {"id": uuid.uuid4().hex, **metadata, "created_at": now()}
    store._write("templates", store._read("templates") + [template])
    return template


def delete_template(store, template_id):
    if not isinstance(template_id, str) or not _TEMPLATE_ID.fullmatch(template_id):
        raise ValueError("Invalid template ID")
    templates = store._read("templates")
    list_templates(store)
    reduced = [t for t in templates if t["id"] != template_id]
    if len(reduced) == len(templates):
        raise ValueError("Template not found")
    store._write("templates", reduced)


def create_profiles_from_template(store, template_id, *, count=1,
                                  name_prefix=None, verify=None):
    """All-or-nothing multi-profile clone of settings under live entitlement.

    Beyond the free allowance, the license server validates entitlement.
    Client-provided allowances cannot expand the permitted plan.
    """
    if not isinstance(template_id, str) or not _TEMPLATE_ID.fullmatch(template_id):
        raise ValueError("Invalid template ID")
    if type(count) is not int or not 1 <= count <= MAX_TEMPLATE_BATCH:
        raise ValueError("Create between 1 and 10 profiles at a time")
    templates = list_templates(store)
    template = next((item for item in templates if item["id"] == template_id), None)
    if template is None:
        raise ValueError("Template not found")
    prefix = template["name"] if name_prefix is None else name_prefix
    if not isinstance(prefix, str) or not 1 <= len(prefix.strip()) <= 75:
        raise ValueError("Invalid profile name prefix")

    # License checks precede ALL mutations, including folder creation.
    from local_api import _creation_allowance
    allowance = _creation_allowance(store, count, verify=verify)
    current = store.profiles()
    if len(current) + count > allowance:
        raise PermissionError("Profile plan allowance exceeded")
    # Validate again against the live proxy list before entering the write phase.
    metadata = _validated_metadata(template, {p["id"] for p in store.proxies()})
    existing_names = {str(p.get("name", "")).casefold() for p in current}
    added = []
    number = 1
    stamp = now()
    for _ in range(count):
        while (prefix.strip() + " " + str(number)).casefold() in existing_names:
            number += 1
        name = prefix.strip() + " " + str(number)
        if len(name) > 100:
            raise ValueError("Generated profile name is too long")
        existing_names.add(name.casefold())
        added.append({
            "id": uuid.uuid4().hex,
            "name": name,
            **{k: metadata[k] for k in FIELDS},
            "notes": "",
            "created_at": stamp,
            "updated_at": stamp,
        })
        number += 1
    folders = []
    try:
        for record in added:
            directory = store.root / "profiles" / record["id"]
            directory.mkdir(mode=0o700)
            folders.append(directory)
            if os.name != "nt":
                directory.chmod(0o700)
        store._write("profiles", current + added)
    except Exception:
        for directory in reversed(folders):
            try:
                directory.rmdir()
            except OSError:
                pass
        raise
    return added
