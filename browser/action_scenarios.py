"""Explicit, bounded local action scenarios for a user's own browser profiles.

No JavaScript execution, websites, cron, cloud calls or secrets in scenarios.
License-check every start and preflight all profiles before any side effects.
Commands are *requests*: subprocess launch/stop is not proof of page readiness.
"""
from __future__ import annotations

import re
import threading
import uuid

from engine import (pid_alive, request_stop, safe_profile_id,
                    start_background, verify_commercial_access)
from launch_guard import launch_pending
from navigation_commands import submit_navigation, validated_navigation_url
from store import now

MAX_SCENARIOS = 50
MAX_PROFILES = 20
MAX_WAIT_SECONDS = 300
ID_RE = re.compile(r"[0-9a-f]{32}\Z")
KINDS = frozenset({"start", "stop", "session", "navigate"})


def _validated(value):
    if not isinstance(value, dict) or set(value) - {
            "id", "name", "kind", "profile_ids", "wait_seconds", "created_at"}:
        raise ValueError("Invalid scenario settings")
    name = value.get("name")
    kind = value.get("kind")
    ids = value.get("profile_ids")
    delay = value.get("wait_seconds", 0)
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 80:
        raise ValueError("Scenario name must contain 1–80 characters")
    if kind not in KINDS:
        raise ValueError("Invalid scenario action")
    if not isinstance(ids, list) or not 1 <= len(ids) <= MAX_PROFILES:
        raise ValueError("Select 1–20 profiles")
    if any(not isinstance(x, str) or not ID_RE.fullmatch(x) for x in ids):
        raise ValueError("Invalid scenario profile ID")
    if len(set(ids)) != len(ids):
        raise ValueError("Duplicate scenario profile")
    if type(delay) is not int or not 0 <= delay <= MAX_WAIT_SECONDS:
        raise ValueError("Invalid scenario wait")
    if kind == "session" and not 5 <= delay <= MAX_WAIT_SECONDS:
        raise ValueError("Session duration must be 5–300 seconds")
    if kind != "session" and delay:
        raise ValueError("Only session scenarios support a wait")
    return {"name": name.strip(), "kind": kind,
            "profile_ids": list(ids), "wait_seconds": delay}


def list_scenarios(store):
    items = store._read("scenarios")
    if len(items) > MAX_SCENARIOS:
        raise ValueError("Too many saved scenarios")
    result = []
    seen = set()
    for item in items:
        if (not isinstance(item, dict) or
                not isinstance(item.get("id"), str) or
                not ID_RE.fullmatch(item["id"]) or item["id"] in seen):
            raise ValueError("Invalid scenario database")
        seen.add(item["id"])
        result.append({"id": item["id"], **_validated(item)})
    return result


def create_scenario(store, name, kind, profile_ids, *, wait_seconds=0):
    record = _validated({"name": name, "kind": kind,
                         "profile_ids": profile_ids,
                         "wait_seconds": wait_seconds})
    saved = list_scenarios(store)
    if len(saved) >= MAX_SCENARIOS:
        raise ValueError("Saved scenario limit reached")
    if any(x["name"].casefold() == record["name"].casefold() for x in saved):
        raise ValueError("Choose a unique scenario name")
    available = {p["id"] for p in store.profiles()}
    if any(pid not in available for pid in record["profile_ids"]):
        raise ValueError("Selected profile no longer exists")
    entry = {"id": uuid.uuid4().hex, **record, "created_at": now()}
    store._write("scenarios", store._read("scenarios") + [entry])
    return entry


def delete_scenario(store, scenario_id):
    safe_profile_id(scenario_id)
    saved = list_scenarios(store)
    reduced = [s for s in saved if s["id"] != scenario_id]
    if len(reduced) == len(saved):
        raise ValueError("Scenario not found")
    store._write("scenarios", reduced)


def _is_running(store, profile_id):
    folder = store.root / "profiles" / profile_id
    lock = folder / ".lock"
    if lock.exists() and not lock.is_symlink():
        try:
            if pid_alive(int(lock.read_text(encoding="ascii").strip())):
                return True
        except (ValueError, OSError, UnicodeError):
            pass
    return False


def preflight(store, scenario, *, verify=verify_commercial_access,
              running=_is_running):
    """Validate every target and paid launch entitlement without side effects.

    The actual launch rechecks entitlement immediately before spawning.
    """
    action = _validated(scenario)
    profile_ids = action["profile_ids"]
    stored = {p["id"] for p in store.profiles()}
    if any(x not in stored for x in profile_ids):
        raise ValueError("Scenario references a missing profile")
    for pid in profile_ids:
        directory = store.root / "profiles" / pid
        if launch_pending(directory) or (directory / ".cookie-maintenance").exists() or (
                directory / ".addon-maintenance").exists():
            raise RuntimeError("A profile is launching or under maintenance")
        if action["kind"] in ("start", "session"):
            if running(store, pid):
                raise RuntimeError("Stop selected profiles before starting this scenario")
            verify(store, pid)
        if action["kind"] == "navigate":
            if not running(store, pid):
                raise RuntimeError("Navigation requires an already running profile")
            verify(store, pid)
    return action


def _owns_session_process(store, profile_id, launched_pid):
    """Stop only the original process, never a user-restarted browser."""
    lock = store.root / "profiles" / profile_id / ".lock"
    if type(launched_pid) is not int or launched_pid <= 0 or lock.is_symlink():
        return False
    try:
        return (lock.is_file() and
                int(lock.read_text(encoding="ascii").strip()) == launched_pid and
                pid_alive(launched_pid))
    except (ValueError, OSError, UnicodeError):
        return False


def run_scenario(store, scenario, *, cancel=None, notify=None,
                 verify=verify_commercial_access,
                 start=start_background, stop=request_stop,
                 running=_is_running, ownership=_owns_session_process,
                 navigation_url=None, navigate=submit_navigation):
    """Synchronous worker function. Tk must invoke from a background thread.

    Stops on first failure. Earlier accepted starts are NOT implicitly rolled
    back because killing their sessions could lose user data.
    """
    action = preflight(store, scenario, verify=verify, running=running)
    cancel = cancel if cancel is not None else threading.Event()
    if action["kind"] == "navigate":
        validated_navigation_url(navigation_url)
        if cancel.is_set():
            return {"state": "cancelled", "accepted": 0}
        outcome = navigate(store, action["profile_ids"], navigation_url, verify=verify)
        accepted = outcome["queued"]
        if notify is not None:
            notify("navigation_queued", accepted)
        return {"state": "completed", "accepted": accepted}
    count = 0
    launched = {}
    skipped = 0
    def progress(event, total):
        if notify is not None:
            notify(event, total)
    for pid in action["profile_ids"]:
        if cancel.is_set():
            progress("cancelled", count)
            return {"state": "cancelled", "accepted": count}
        if action["kind"] in ("start", "session"):
            # Paid access may have expired during the previous start.
            verify(store, pid)
            process_id = start(store, pid)
            if action["kind"] == "session":
                if type(process_id) is not int or process_id <= 0:
                    raise RuntimeError("Could not identify started browser process")
                launched[pid] = process_id
        else:
            if launch_pending(store.root / "profiles" / pid):
                raise RuntimeError("Profile is still starting; retry later")
            stop(store, pid)
        count += 1
        progress("requested", count)
    if action["kind"] == "session":
        if cancel.wait(action["wait_seconds"]):
            progress("cancelled", count)
            return {"state": "cancelled", "accepted": count}
        for pid in action["profile_ids"]:
            if cancel.is_set():
                progress("cancelled", count)
                return {"state": "cancelled", "accepted": count}
            if not ownership(store, pid, launched[pid]):
                skipped += 1
                progress("owner_changed", count)
                continue
            if launch_pending(store.root / "profiles" / pid):
                raise RuntimeError("Profile is still starting; retry stop later")
            stop(store, pid)
            count += 1
            progress("stop_requested", count)
    result = {"state": "completed", "accepted": count}
    if skipped:
        result["skipped"] = skipped
    return result
