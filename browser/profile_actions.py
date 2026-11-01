"""Atomic local profile-manager actions (no network, cloud state or payments).

UI and future localhost API may share these operations. Validate the full
request before touching profile metadata; commit at most once.
"""
from __future__ import annotations

import os
from pathlib import Path
import uuid

from engine import safe_profile_id
from launch_guard import launch_pending
from store import Store, now

MAX_QUICK_BATCH = 10


def _allowance(value):
    if type(value) is not int or not 0 <= value <= 1000:
        raise ValueError("Invalid server-issued profile allowance")
    return value


def create_quick_profiles(store: Store, *, allowance: int, count: int = 1,
                          name_prefix: str = "Быстрый профиль"):
    """Create a bounded batch of empty, isolated profiles in one commit.

    This is convenience UI, not a way around licensing. Profile launches
    still enforce paid plans on the server. Pre-created empty folders are
    rolled back if metadata persistence fails.
    """
    _allowance(allowance)
    if type(count) is not int or not 1 <= count <= MAX_QUICK_BATCH:
        raise ValueError("Create between 1 and 10 profiles at a time")
    if not isinstance(name_prefix, str) or not name_prefix.strip():
        raise ValueError("Invalid quick profile name")
    if len(name_prefix.strip()) > 75:
        raise ValueError("Quick profile name prefix is too long")
    profiles = store.profiles()
    if len(profiles) + count > allowance:
        raise ValueError("Not enough profile slots in the current plan")
    existing_names = {str(p.get("name", "")).casefold() for p in profiles}
    timestamp = now()
    prepared = []
    index = 1
    for _ in range(count):
        while f"{name_prefix.strip()} {index}".casefold() in existing_names:
            index += 1
        name = f"{name_prefix.strip()} {index}"
        existing_names.add(name.casefold())
        prepared.append({
            "id": uuid.uuid4().hex, "name": name,
            "url": "about:blank", "group": "", "tags": "", "notes": "",
            "proxy_id": "", "os": "native", "startup_urls": [],
            "created_at": timestamp, "updated_at": timestamp,
        })
        index += 1
    made = []
    try:
        for p in prepared:
            folder = store.root / "profiles" / p["id"]
            folder.mkdir(mode=0o700)
            made.append(folder)
            if os.name != "nt":
                folder.chmod(0o700)
        store._write("profiles", profiles + prepared)
    except Exception:
        for folder in reversed(made):
            try:
                folder.rmdir()
            except OSError:
                pass
        raise
    return prepared


def bulk_assign_proxy(store: Store, ids, proxy_id: str, running):
    """Assign/clear a proxy for all selected STOPPED profiles atomically."""
    if not isinstance(proxy_id, str):
        raise ValueError("Invalid proxy selection")
    if proxy_id:
        safe_profile_id(proxy_id)
        if proxy_id not in {p["id"] for p in store.proxies()}:
            raise ValueError("Selected proxy no longer exists")
    if not isinstance(ids, (tuple, list, set)):
        raise ValueError("Select profiles first")
    unique = list(dict.fromkeys(ids))
    if not 1 <= len(unique) <= 1000:
        raise ValueError("Select between 1 and 1,000 profiles")
    for profile_id in unique:
        safe_profile_id(profile_id)
    profiles = store.profiles()
    found = {p["id"] for p in profiles}
    if any(pid not in found for pid in unique):
        raise ValueError("A selected profile no longer exists")
    for pid in unique:
        directory = store.root / "profiles" / pid
        if running(pid) or launch_pending(directory):
            raise ValueError("Stop selected profiles before changing proxies")
    stamp = now()
    chosen = set(unique)
    for p in profiles:
        if p["id"] in chosen:
            p["proxy_id"] = proxy_id
            p["updated_at"] = stamp
    store._write("profiles", profiles)
    return len(unique)
