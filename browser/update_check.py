"""Opt-in, read-only Windows release update check against official GitHub API.

Never executes or downloads an installer and never sends profile data.
"""
from __future__ import annotations

import json
import re
from urllib.request import Request, urlopen

RELEASES_URL = "https://api.github.com/repos/virus53111/dogizen/releases?per_page=15"
TAG_PATTERN = re.compile(r"v(\d+)\.(\d+)\.(\d+)-browser-windows-beta-(\d{8})\Z")
MAX_RESPONSE = 150_000
APP_VERSION = (0, 7, 0)


def select_windows_update(releases, installed=APP_VERSION):
    if (not isinstance(installed, (tuple, list)) or len(installed) != 3 or
            any(type(x) is not int or not 0 <= x < 10000 for x in installed)):
        raise ValueError("Invalid installed application version")
    if not isinstance(releases, list):
        raise ValueError("Invalid GitHub releases response")
    best = None
    for rel in releases[:100]:
        if (not isinstance(rel, dict) or rel.get("draft") is not False
                or rel.get("prerelease") is not True):
            continue
        tag = rel.get("tag_name", "")
        if not isinstance(tag, str):
            continue
        match = TAG_PATTERN.fullmatch(tag)
        if not match:
            continue
        version = tuple(map(int, match.groups()[:3]))
        if version <= tuple(installed):
            continue
        expected = f"Murdilimax-Browser-Windows-v{version[0]}.{version[1]}.{version[2]}-Beta-Setup.exe"
        exact = ("https://github.com/virus53111/dogizen/releases/download/"
                 + tag + "/" + expected)
        release_page = "https://github.com/virus53111/dogizen/releases/tag/" + tag
        assets = rel.get("assets")
        if not isinstance(assets, list):
            continue
        present = any(isinstance(x, dict) and x.get("name") == expected
                      and x.get("browser_download_url") == exact
                      and isinstance(x.get("size"), int)
                      and x["size"] > 1_000_000 for x in assets)
        if not present:
            continue
        if best is None or version > best["version"]:
            best = {"version": version, "tag": tag, "url": release_page}
    return best


def check_windows_updates(*, installed=APP_VERSION, opener=None):
    """Explicit network request; only official GitHub releases, bounded JSON."""
    req = Request(RELEASES_URL, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "Murdilimax-Browser-UpdateCheck/1",
    })
    fetch = opener if opener is not None else urlopen
    with fetch(req, timeout=10) as response:
        data = response.read(MAX_RESPONSE + 1)
    if len(data) > MAX_RESPONSE:
        raise ValueError("Release response exceeds safety limit")
    return select_windows_update(json.loads(data.decode("utf-8")), installed)
