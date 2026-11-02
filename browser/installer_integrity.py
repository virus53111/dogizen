"""Verify a user-selected Windows installer against official Murdilimax releases.

Read-only: never downloads an EXE, executes it, sends profile data or modifies
the installed app. Verifies *both* the official release metadata and the
separately published SHA256SUMS.txt. SHA-256 proves release-file integrity, not
publisher identity: code signing remains a separate launch requirement.
"""
from __future__ import annotations

import hashlib
import hmac
import os
from pathlib import Path
import re
import stat
from urllib.request import Request, urlopen

from update_check import RELEASES_URL, TAG_PATTERN, MAX_RESPONSE

OWNER = "virus53111/dogizen"
SETUP_PATTERN = re.compile(
    r"Murdilimax-Browser-Windows-v(\d+)\.(\d+)\.(\d+)-Beta-Setup\.exe\Z")
MAX_INSTALLER = 1024 * 1024 * 1024
MIN_INSTALLER = 1_000_000
MAX_CHECKSUM = 4096


def _read_bounded(url, maximum, opener):
    with opener(Request(url, headers={
            "Accept": "application/vnd.github+json"
            if url == RELEASES_URL else "text/plain",
            "User-Agent": "Murdilimax-Installer-Integrity/1",
    }), timeout=12) as response:
        raw = response.read(maximum + 1)
    if len(raw) > maximum:
        raise ValueError("Official release metadata exceeds size limit")
    return raw


def _official_asset(releases, filename):
    name = SETUP_PATTERN.fullmatch(filename)
    if not name:
        raise ValueError("Not an official Murdilimax Windows setup filename")
    if not isinstance(releases, list):
        raise ValueError("Invalid official GitHub release response")
    version = tuple(int(x) for x in name.groups())
    expected_prefix = "v" + ".".join(map(str, version)) + "-browser-windows-beta-"
    for release in releases[:100]:
        if not isinstance(release, dict):
            continue
        tag = release.get("tag_name")
        if (release.get("draft") is not False
                or release.get("prerelease") is not True
                or not isinstance(tag, str)
                or not TAG_PATTERN.fullmatch(tag)
                or not tag.startswith(expected_prefix)):
            continue
        entries = release.get("assets")
        if not isinstance(entries, list):
            continue
        prefix = f"https://github.com/{OWNER}/releases/download/{tag}/"
        matched = {}
        for asset in entries:
            if not isinstance(asset, dict):
                continue
            n = asset.get("name")
            if n not in (filename, "SHA256SUMS.txt"):
                continue
            if asset.get("browser_download_url") != prefix + n:
                continue
            if type(asset.get("size")) is not int:
                continue
            matched[n] = asset
        binary = matched.get(filename)
        sums = matched.get("SHA256SUMS.txt")
        if (binary and sums
                and MIN_INSTALLER <= binary["size"] <= MAX_INSTALLER
                and 64 <= sums["size"] <= MAX_CHECKSUM):
            return {
                "tag": tag, "version": version, "size": binary["size"],
                "checksum_url": prefix + "SHA256SUMS.txt",
                "release_url": f"https://github.com/{OWNER}/releases/tag/{tag}",
            }
    raise ValueError("Official release and checksum assets are not available")


def _checksum_for(raw, filename):
    try:
        text = raw.decode("ascii")
    except UnicodeDecodeError as exc:
        raise ValueError("Invalid checksum format") from exc
    # A checksum file can list several assets; accept exactly one checksum
    # for the selected file and reject duplicate or nonconforming entries.
    matches = []
    for line in text.splitlines():
        if not line:
            continue
        found = re.fullmatch(r"([a-f0-9]{64})  ([A-Za-z0-9._-]+)", line)
        if not found:
            raise ValueError("Invalid checksum format")
        if found.group(2) == filename:
            matches.append(found.group(1))
    if len(matches) != 1:
        raise ValueError("Setup checksum is missing or ambiguous")
    return matches[0]


def verify_windows_setup(path, *, opener=None, releases=None):
    """Return verified version + digest, or raise ValueError.

    The caller selects an existing local installer. No silent downloads or
    installation are performed. An injected releases list is for offline QA.
    """
    selected = Path(path)
    try:
        initial = selected.lstat()
        if not stat.S_ISREG(initial.st_mode):
            raise ValueError("Select a regular Windows installer, not a link")
        if not MIN_INSTALLER <= initial.st_size <= MAX_INSTALLER:
            raise ValueError("Unexpected installer size")
        open_url = opener or urlopen
        if releases is None:
            import json
            releases = json.loads(
                _read_bounded(RELEASES_URL, MAX_RESPONSE, open_url)
                .decode("utf-8"))
        official = _official_asset(releases, selected.name)
        if initial.st_size != official["size"]:
            raise ValueError("Installer size does not match official release")
        expected = _checksum_for(
            _read_bounded(official["checksum_url"], MAX_CHECKSUM, open_url),
            selected.name)
        h = hashlib.sha256()
        with selected.open("rb") as handle:
            opened = os.fstat(handle.fileno())
            if not stat.S_ISREG(opened.st_mode):
                raise ValueError("Installer is not a regular file")
            if (opened.st_dev, opened.st_ino, opened.st_size) != (
                    initial.st_dev, initial.st_ino, initial.st_size):
                raise ValueError("Installer changed during verification")
            for part in iter(lambda: handle.read(1024 * 1024), b""):
                h.update(part)
            again = os.fstat(handle.fileno())
        if (again.st_dev, again.st_ino, again.st_size,
                again.st_mtime_ns) != (opened.st_dev, opened.st_ino,
                                       opened.st_size, opened.st_mtime_ns):
            raise ValueError("Installer changed during verification")
        digest = h.hexdigest()
        if not hmac.compare_digest(digest, expected):
            raise ValueError("SHA-256 mismatch: installer may be damaged or altered")
        return {
            "version": official["version"], "sha256": digest,
            "release_url": official["release_url"],
        }
    except (OSError, UnicodeError) as exc:
        raise ValueError("Cannot verify the selected Windows installer") from exc
