"""Murdilimax Neon Flow Studio: locally saved, bounded visual step plans.

Only user-approved CSS locator actions. No JavaScript, arbitrary shell, cron,
cloud transport or implicit profile management. Keep plans separate from
legacy v1 manual scenarios and never store credentials in plan definitions.
"""
from __future__ import annotations

import re
import uuid
from navigation_commands import validated_navigation_url
from store import now

MAX_FLOWS = 40
MAX_STEPS = 12
MAX_TARGETS = 10
HEX = re.compile(r"[0-9a-f]{32}\Z")
TYPES = frozenset({"open", "wait", "click", "fill", "scroll"})


def validated_step(raw):
    if not isinstance(raw, dict) or type(raw.get("kind")) is not str:
        raise ValueError("Invalid flow block")
    kind = raw["kind"]
    if kind not in TYPES:
        raise ValueError("Unsupported flow block")
    fields = {
        "open": {"kind", "url"},
        "wait": {"kind", "seconds"},
        "click": {"kind", "selector"},
        "fill": {"kind", "selector", "text"},
        "scroll": {"kind", "pixels"},
    }[kind]
    if set(raw) != fields:
        raise ValueError("Unexpected flow block attributes")
    if kind == "open":
        return {"kind": kind, "url": validated_navigation_url(raw["url"])}
    if kind == "wait":
        v = raw["seconds"]
        if type(v) is not int or not 1 <= v <= 30:
            raise ValueError("Wait must be 1–30 seconds")
        return {"kind": kind, "seconds": v}
    if kind in ("click", "fill"):
        selector = raw["selector"]
        if (not isinstance(selector, str) or not 1 <= len(selector) <= 300 or
                any(ord(c) < 32 or ord(c) == 127 for c in selector)):
            raise ValueError("Use a CSS selector under 300 characters")
        if kind == "click":
            return {"kind": kind, "selector": selector}
        value = raw["text"]
        if (not isinstance(value, str) or len(value) > 400 or
                any(ord(c) < 32 and c not in "\t" for c in value)):
            raise ValueError("Text block must be 0–400 characters")
        # Explicitly prohibit password-targeting selectors; users are still
        # warned not to save secrets in other text inputs.
        if "password" in selector.lower() or "type=pw" in selector.lower():
            raise ValueError("Password fields cannot be automated")
        return {"kind": kind, "selector": selector, "text": value}
    value = raw["pixels"]
    if type(value) is not int or not -1500 <= value <= 1500 or value == 0:
        raise ValueError("Scroll must be between -1500 and +1500 pixels")
    return {"kind": kind, "pixels": value}


def validated_flow(raw):
    if not isinstance(raw, dict) or set(raw) - {
            "id", "name", "profile_ids", "steps", "created_at"}:
        raise ValueError("Invalid visual workflow")
    name = raw.get("name")
    ids = raw.get("profile_ids")
    steps = raw.get("steps")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 80:
        raise ValueError("Workflow name must be 1–80 characters")
    if (not isinstance(ids, list) or not 1 <= len(ids) <= MAX_TARGETS or
            len(set(str(x) for x in ids)) != len(ids) or
            any(not isinstance(x, str) or not HEX.fullmatch(x) for x in ids)):
        raise ValueError("Select 1–10 unique local profiles")
    if not isinstance(steps, list) or not 1 <= len(steps) <= MAX_STEPS:
        raise ValueError("A visual workflow needs 1–12 blocks")
    return {"name": name.strip(), "profile_ids": list(ids),
            "steps": [validated_step(s) for s in steps]}


def list_flows(store):
    items = store._read("visual_flows")
    if len(items) > MAX_FLOWS:
        raise ValueError("Visual workflow limit reached")
    result = []
    seen = set()
    for item in items:
        if (not isinstance(item, dict) or
                not isinstance(item.get("id"), str) or
                not HEX.fullmatch(item["id"]) or item["id"] in seen):
            raise ValueError("Invalid visual flow database")
        seen.add(item["id"])
        result.append({"id": item["id"], **validated_flow(item)})
    return result


def save_flow(store, name, profile_ids, steps, *, replace_id=None):
    validated = validated_flow({
        "name": name, "profile_ids": profile_ids, "steps": steps})
    profiles = {p["id"] for p in store.profiles()}
    if any(x not in profiles for x in validated["profile_ids"]):
        raise ValueError("A selected profile was deleted")
    saved = list_flows(store)
    if replace_id is not None and not any(x["id"] == replace_id for x in saved):
        raise ValueError("Visual workflow no longer exists")
    if len(saved) >= MAX_FLOWS and replace_id is None:
        raise ValueError("Visual workflow limit reached")
    if any(x["name"].casefold() == validated["name"].casefold() and
           x["id"] != replace_id for x in saved):
        raise ValueError("Choose a unique workflow name")
    key = replace_id or uuid.uuid4().hex
    records = store._read("visual_flows")
    original = next((item for item in records if item["id"] == key), None)
    entry = {"id": key, **validated,
             "created_at": original["created_at"] if original else now()}
    if replace_id is None:
        records.append(entry)
    else:
        records = [entry if item["id"] == key else item for item in records]
    store._write("visual_flows", records)
    return entry


def delete_flow(store, ident):
    if not isinstance(ident, str) or not HEX.fullmatch(ident):
        raise ValueError("Invalid workflow ID")
    list_flows(store)
    saved = store._read("visual_flows")
    remaining = [s for s in saved if s["id"] != ident]
    if len(remaining) == len(saved):
        raise ValueError("Workflow not found")
    store._write("visual_flows", remaining)
