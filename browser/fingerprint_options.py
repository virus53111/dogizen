"""Bounded fpgen screen constraints and read-only fingerprint inspection.

Never rewrites generated navigator/WebGL/locale fields, never rotates identity.
Screen sizes are upper bounds for a coherent fpgen draw, not exact spoofed
monitor dimensions. Changing the bound after first generation is prohibited.
"""
from __future__ import annotations

import json
from pathlib import Path

BOUNDS = {
    "auto": None,
    "1600x900": (1600, 900),
    "1920x1080": (1920, 1080),
    "2560x1440": (2560, 1440),
}
MAX_USER_AGENT = 260


def validate_screen_limit(choice):
    if not isinstance(choice, str) or choice not in BOUNDS:
        raise ValueError("Choose Auto, 1600x900, 1920x1080, or 2560x1440")
    return choice


def fingerprint_generation_options(choice):
    """Provide Screen only when explicitly bounded; lazy Camoufox import."""
    choice = validate_screen_limit(choice)
    bounds = BOUNDS[choice]
    if bounds is None:
        return {}
    from camoufox.fingerprints import Screen
    return {"screen": Screen(max_width=bounds[0], max_height=bounds[1])}


def safe_identity_preview(directory):
    """Read already generated identity; do not invoke fpgen or reveal raw JSON."""
    from identity import FILENAME, _load
    path = Path(directory) / FILENAME
    if not path.is_file() or path.is_symlink():
        return {"generated": False}
    raw = _load(path)
    fp = raw["fingerprint"]
    navigator = fp.get("navigator") if isinstance(fp.get("navigator"), dict) else {}
    screen = fp.get("screen") if isinstance(fp.get("screen"), dict) else {}
    agent = navigator.get("userAgent", "")
    if not isinstance(agent, str):
        agent = ""
    cpu = navigator.get("hardwareConcurrency")
    if type(cpu) is not int or not 1 <= cpu <= 256:
        cpu = None
    width, height = screen.get("width"), screen.get("height")
    if type(width) is not int or not 1 <= width <= 10000:
        width = None
    if type(height) is not int or not 1 <= height <= 10000:
        height = None
    return {
        "generated": True,
        "os": raw["os"],
        "screen_limit": validate_screen_limit(raw.get("screen_limit", "auto")),
        "user_agent": agent[:MAX_USER_AGENT],
        "cpu": cpu,
        "screen": f"{width} × {height}" if width and height else "unknown",
    }
