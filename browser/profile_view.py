"""Pure, offline view-model for the Murdilimax profile manager.

This module only filters local profile metadata. The running predicate is
injected by the UI; there is no browser launch, network or billing access.
"""
from __future__ import annotations

from collections.abc import Callable, Iterable

ALL = "__all__"
RUNNING = "running"
STOPPED = "stopped"
VALID_STATUSES = (ALL, RUNNING, STOPPED)


def filter_profiles(
    profiles: Iterable[dict], *,
    query: str = "",
    group: str | None = None,
    proxy_id: str | None = None,
    status: str = ALL,
    running: Callable[[str], bool],
) -> tuple[list[tuple[dict, bool]], int]:
    """Return (visible profile/status pairs, active count among all profiles).

    Never mutates source data. Search includes the name, group, tags and
    notes. Filter values are stable internal keys, not translated labels.
    """
    if status not in VALID_STATUSES:
        raise ValueError("Unknown profile status filter")
    profiles = list(profiles)
    needle = query.strip().casefold()
    visible = []
    active = 0
    for p in profiles:
        live = bool(running(p["id"]))
        if live:
            active += 1
        searchable = " ".join(str(p.get(key, "")) for key in
                              ("name", "group", "tags", "notes")).casefold()
        if needle and needle not in searchable:
            continue
        if group is not None and p.get("group", "") != group:
            continue
        if proxy_id is not None and p.get("proxy_id", "") != proxy_id:
            continue
        if status == RUNNING and not live:
            continue
        if status == STOPPED and live:
            continue
        visible.append((p, live))
    return visible, active


def distinct_groups(profiles: Iterable[dict]) -> list[str]:
    return sorted({str(p.get("group", "")) for p in profiles
                   if str(p.get("group", "")).strip()},
                  key=str.casefold)


def validated_group(value: str) -> str:
    """Store uses an 80-character group column; don't silently truncate."""
    if not isinstance(value, str):
        raise ValueError("A group name must be text")
    value = value.strip()
    if len(value) > 80:
        raise ValueError("Group name must be at most 80 characters")
    return value


def bulk_update_groups(store, ids: Iterable[str], group: str, running: Callable[[str], bool]) -> int:
    """Assign one group to selected *stopped* profiles in one metadata write.

    Validate every identifier before modifying anything. A single Store._write
    avoids partial group assignment if a member is invalid, currently running,
    or storage I/O fails. No cookies, profile directory or credentials touched.
    """
    name = validated_group(group)
    ids = list(dict.fromkeys(ids))
    if not ids:
        raise ValueError("No profiles selected")
    if len(ids) > 1000:
        raise ValueError("Too many profiles selected")
    profiles = store.profiles()
    by_id = {p["id"]: p for p in profiles}
    if any(pid not in by_id for pid in ids):
        raise ValueError("Selected profile no longer exists")
    if any(running(pid) for pid in ids):
        raise ValueError("Stop selected running profiles before editing their group")
    # Deferred import keeps the view-model self-contained and testable.
    from store import now
    update_stamp = now()
    selected = set(ids)
    for profile in profiles:
        if profile["id"] in selected:
            profile["group"] = name
            profile["updated_at"] = update_stamp
    store._write("profiles", profiles)
    return len(selected)


def plan_profile_launches(profiles, selected_ids, entitlement_limit, running):
    """Validate all selected profiles before any desktop launch is attempted.

    The entitlement allowance is applied to the stored profile order, just
    as in the existing browser launcher. Duplicate IDs cannot spawn duplicate
    processes. Stale selections and out-of-plan profiles fail atomically.
    """
    if (type(entitlement_limit) is not int or
            not 0 <= entitlement_limit <= 1000):
        raise ValueError("Invalid profile allowance")
    profiles = list(profiles)
    selected = list(dict.fromkeys(selected_ids))
    if not selected:
        raise ValueError("Select browser profiles first")
    existing = {p["id"] for p in profiles}
    if any(pid not in existing for pid in selected):
        raise ValueError("One or more selected profiles no longer exist")
    allowed = {p["id"] for p in profiles[:entitlement_limit]}
    if any(pid not in allowed for pid in selected):
        raise ValueError("One or more selected profiles exceed the plan limit")
    return [pid for pid in selected if not running(pid)]
