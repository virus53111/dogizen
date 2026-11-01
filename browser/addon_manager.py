"""Manage opt-in local Firefox extension archives for Camoufox profiles.

Camoufox uses addons=[extracted directory paths]. No downloads here.
Extensions contain third-party code and may access website sessions;
installation requires separate user approval in the UI.
"""
from __future__ import annotations
from contextlib import contextmanager
from pathlib import Path, PurePosixPath
import json
import os
import re
import shutil
import stat
import uuid
import zipfile

from engine import safe_profile_id

MAX_ZIP_BYTES = 20 * 1024 * 1024
MAX_EXPANDED_BYTES = 70 * 1024 * 1024
MAX_ENTRIES = 600
MAX_ADDONS = 24
HEX_ID = re.compile(r"^[0-9a-f]{32}$")


def _profile(store, profile_id):
    safe_profile_id(profile_id)
    if store.get_profile(profile_id) is None:
        raise ValueError("Profile not found")
    folder = store.root / "profiles" / profile_id
    if not folder.is_dir() or folder.is_symlink():
        raise ValueError("Unsafe or missing profile folder")
    return folder


def _addons_folder(folder):
    path = folder / "addons"
    if path.is_symlink() or path.exists() and not path.is_dir():
        raise ValueError("Unsafe addons directory")
    return path


def _read(folder):
    path = folder / "addons.json"
    if path.is_symlink():
        raise ValueError("Unsafe addon metadata path")
    if not path.exists():
        return []
    try:
        items = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        raise ValueError("Cannot read addon metadata") from None
    if not isinstance(items, list) or len(items) > MAX_ADDONS:
        raise ValueError("Invalid addon metadata")
    seen = set()
    for row in items:
        if (not isinstance(row, dict) or not HEX_ID.fullmatch(str(row.get("id", "")))
                or row["id"] in seen or type(row.get("enabled")) is not bool
                or not isinstance(row.get("name"), str) or not isinstance(row.get("version"), str)
                or not isinstance(row.get("permissions"), list)):
            raise ValueError("Invalid addon metadata")
        seen.add(row["id"])
    return items


def list_addons(store, profile_id):
    return _read(_profile(store, profile_id))


def _write(folder, rows):
    path = folder / "addons.json"
    if path.is_symlink():
        raise ValueError("Unsafe addon metadata")
    pending = folder / (".addons-" + uuid.uuid4().hex + ".tmp")
    try:
        fd = os.open(pending, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            json.dump(rows, output, indent=2, ensure_ascii=False)
            output.flush()
            os.fsync(output.fileno())
        os.replace(pending, path)
    finally:
        pending.unlink(missing_ok=True)


@contextmanager
def _maintenance(store, profile_id):
    folder = _profile(store, profile_id)
    if (folder / ".lock").exists() or (folder / ".cookie-maintenance").exists():
        raise ValueError("Stop the browser or cookie maintenance first")
    lock = folder / ".addon-maintenance"
    try:
        fd = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
    except FileExistsError:
        raise ValueError("An addon operation is already running") from None
    try:
        if (folder / ".lock").exists() or (folder / ".cookie-maintenance").exists():
            raise ValueError("Stop the browser before changing extensions")
        yield folder
    finally:
        lock.unlink(missing_ok=True)


def _open_archive(source):
    if not source.is_file() or source.is_symlink() or source.suffix.lower() not in (".xpi", ".zip"):
        raise ValueError("Select a local Firefox .xpi or .zip")
    if source.stat().st_size > MAX_ZIP_BYTES:
        raise ValueError("Firefox addon archive exceeds 20 MB")
    try:
        archive = zipfile.ZipFile(source)
    except (OSError, zipfile.BadZipFile, zipfile.LargeZipFile):
        raise ValueError("Invalid Firefox addon archive") from None
    try:
        members = archive.infolist()
        if not members or len(members) > MAX_ENTRIES:
            raise ValueError("Unsupported addon entry count")
        total = 0
        seen = set()
        files = []
        for item in members:
            raw = item.filename
            path = PurePosixPath(raw)
            pieces = path.parts
            if (not raw or len(raw) > 240 or "\x00" in raw or "\\" in raw
                    or raw.startswith("/") or not pieces
                    or any(p in (".", "..") or ":" in p for p in pieces)
                    or any(p.rstrip(". ").upper() in {"CON","PRN","AUX","NUL",
                         "COM1","COM2","COM3","LPT1","LPT2","LPT3"} for p in pieces)):
                raise ValueError("Unsafe addon archive filename")
            lower = str(path).casefold()
            if lower in seen:
                raise ValueError("Duplicate addon archive member")
            seen.add(lower)
            mode = item.external_attr >> 16
            if stat.S_ISLNK(mode) or mode and stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR):
                raise ValueError("Unsafe addon archive entry type")
            if item.is_dir():
                continue
            if item.file_size > MAX_EXPANDED_BYTES or not item.compress_size and item.file_size:
                raise ValueError("Oversized or unsupported addon file")
            if item.file_size > 1048576 and item.file_size > 300 * item.compress_size:
                raise ValueError("Addon compression ratio too large")
            total += item.file_size
            if total > MAX_EXPANDED_BYTES:
                raise ValueError("Unpacked addon exceeds 70 MB")
            files.append(item)
        manifest_entry = next((i for i in files if i.filename == "manifest.json"), None)
        if manifest_entry is None or manifest_entry.file_size > 256000:
            raise ValueError("Missing root manifest.json")
        try:
            manifest = json.loads(archive.read(manifest_entry).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ValueError("Invalid addon manifest") from None
        if not isinstance(manifest, dict) or manifest.get("manifest_version") not in (2, 3):
            raise ValueError("Unsupported Firefox manifest")
        name, version = manifest.get("name"), manifest.get("version")
        if (not isinstance(name, str) or not name.strip() or len(name) > 120
                or not isinstance(version, str) or not version.strip() or len(version) > 60):
            raise ValueError("Invalid extension name/version")
        perms, hosts = manifest.get("permissions", []), manifest.get("host_permissions", [])
        if (not isinstance(perms, list) or not isinstance(hosts, list)
                or any(not isinstance(x, str) for x in perms + hosts)):
            raise ValueError("Invalid extension permissions")
        return archive, manifest, files, list(dict.fromkeys((perms + hosts)[:120]))
    except Exception:
        archive.close()
        raise


def inspect_archive(path):
    archive, manifest, files, permissions = _open_archive(Path(path))
    archive.close()
    return {"name": manifest["name"], "version": manifest["version"],
            "permissions": permissions, "files": len(files)}


def install_addon(store, profile_id, path):
    with _maintenance(store, profile_id) as folder:
        rows = _read(folder)
        if len(rows) >= MAX_ADDONS:
            raise ValueError("Maximum 24 extensions per profile")
        archive, manifest, files, permissions = _open_archive(Path(path))
        addons = _addons_folder(folder)
        addons.mkdir(mode=0o700, exist_ok=True)
        if os.name != "nt":
            addons.chmod(0o700)
        addon_id = uuid.uuid4().hex
        stage = addons / (".stage-" + addon_id)
        final = addons / addon_id
        stage.mkdir(mode=0o700)
        try:
            with archive:
                for item in files:
                    target = stage.joinpath(*PurePosixPath(item.filename).parts)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(item) as input_file:
                        fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                        with os.fdopen(fd, "wb") as output:
                            shutil.copyfileobj(input_file, output, 128 * 1024)
            stage.rename(final)
            entry = {"id": addon_id, "name": manifest["name"],
                     "version": manifest["version"], "enabled": True,
                     "permissions": permissions}
            _write(folder, rows + [entry])
            return entry
        except Exception:
            if stage.exists(): shutil.rmtree(stage)
            if final.exists(): shutil.rmtree(final)
            raise


def set_addon_enabled(store, profile_id, addon_id, enabled):
    if type(enabled) is not bool or not HEX_ID.fullmatch(str(addon_id)):
        raise ValueError("Invalid addon setting")
    with _maintenance(store, profile_id) as folder:
        rows = _read(folder)
        entry = next((r for r in rows if r["id"] == addon_id), None)
        if entry is None:
            raise ValueError("Addon not found")
        entry["enabled"] = enabled
        _write(folder, rows)


def remove_addon(store, profile_id, addon_id):
    if not HEX_ID.fullmatch(str(addon_id)):
        raise ValueError("Invalid addon identifier")
    with _maintenance(store, profile_id) as folder:
        rows = _read(folder)
        if not any(r["id"] == addon_id for r in rows):
            raise ValueError("Addon not found")
        path = _addons_folder(folder) / addon_id
        if path.is_symlink():
            raise ValueError("Unsafe addon folder")
        _write(folder, [r for r in rows if r["id"] != addon_id])
        if path.exists():
            shutil.rmtree(path)


def enabled_addon_paths(store, profile_id):
    folder = _profile(store, profile_id)
    addons = _addons_folder(folder)
    paths = []
    for entry in _read(folder):
        if not entry["enabled"]:
            continue
        path = addons / entry["id"]
        manifest = path / "manifest.json"
        if (path.is_symlink() or manifest.is_symlink()
                or not path.is_dir() or not manifest.is_file()):
            raise ValueError("Enabled addon missing or unsafe; reinstall it")
        paths.append(str(path))
    return paths
