"""Camoufox-based browser launcher. Each profile runs in its own process and storage."""
from __future__ import annotations
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlsplit

from store import Store
from identity import get_identity, resolved_os
from engine_setup import ensure_engine_ready
from launch_guard import (LAUNCH_TOKEN_ENV, launch_pending,
                          reserve_launch, release_launch)

def pid_alive(pid):
    """Non-destructive cross-platform process status probe."""
    if not isinstance(pid, int) or pid <= 0:
        return False
    if sys.platform == "win32":
        import ctypes
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.OpenProcess(0x00100000, False, pid)  # SYNCHRONIZE
        if not handle:
            return False
        try:
            return kernel32.WaitForSingleObject(handle, 0) == 0x102  # WAIT_TIMEOUT
        finally:
            kernel32.CloseHandle(handle)
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ValueError):
        return False

def safe_profile_id(profile_id):
    if not isinstance(profile_id, str) or re.fullmatch(r'[0-9a-f]{32}', profile_id) is None:
        raise ValueError('Invalid profile identifier')
    return profile_id

def launch_command(profile_id):
    safe_profile_id(profile_id)
    if getattr(sys, "frozen", False):
        return [sys.executable, "--run-profile", profile_id]
    return [sys.executable, str(Path(__file__).with_name("app.py")), "--run-profile", profile_id]

def verify_commercial_access(store, profile_id, account=None, required=None):
    """Server-owned entitlement check for opt-in commercial QA mode.

    This is a *client-side gate*, not tamper-proof DRM: a modified offline
    client can skip local code. Paid cloud entitlements require enforcement
    on the API server, signed binaries, and a threat-model review.
    """
    safe_profile_id(profile_id)
    mandatory = (os.environ.get("MURDILIMAX_REQUIRE_LOGIN") == "1"
                 if required is None else required)
    if not mandatory:
        return None
    if account is None:
        from auth_client import BrowserAccount
        account = BrowserAccount()
    data = account.verify()  # Server validates device/network binding and token.
    if not isinstance(data, dict) or not data.get("authorized"):
        raise PermissionError("Account license is missing, expired, or could not be verified")
    limit = (data.get("entitlements") or {}).get("profiles")
    if isinstance(limit, bool) or not isinstance(limit, int) or not (0 <= limit <= 1000):
        raise PermissionError("The license server returned an invalid profile allowance")
    permitted = [p.get("id") for p in store.profiles()[:limit]]
    if profile_id not in permitted:
        raise PermissionError("Profile exceeds the server-authorized subscription limit")
    return data

def run_profile(profile_id):
    safe_profile_id(profile_id)
    store = Store()
    folder = store.root / "profiles" / profile_id
    launch_token = os.environ.get(LAUNCH_TOKEN_ENV)
    profile = store.get_profile(profile_id)
    if not profile:
        release_launch(folder, launch_token)
        raise ValueError("Unknown profile")
    try:
        verify_commercial_access(store, profile_id)
        folder.mkdir(parents=True, exist_ok=True)
        if (folder / ".cookie-maintenance").exists() or (folder / ".addon-maintenance").exists():
            raise RuntimeError("Profile maintenance is in progress; retry later")
    except Exception:
        release_launch(folder, launch_token)
        raise

    stop_file = folder / ".stop"
    lock = folder / ".lock"
    # One child can own the profile. Stale lock recovery is bounded; no
    # recursive launches or clearing another active browser's stop request.
    fd = None
    for _ in range(3):
        try:
            fd = os.open(str(lock), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            break
        except FileExistsError:
            try:
                previous = lock.lstat()
                if lock.is_symlink() or not lock.is_file():
                    raise RuntimeError("Unsafe profile lock")
                pid = int(lock.read_text().strip())
            except FileNotFoundError:
                continue
            except (ValueError, OSError):
                pid = -1
            if pid_alive(pid):
                release_launch(folder, launch_token)
                raise RuntimeError("The profile is already running")
            # Remove only the exact stale file we inspected; do not delete
            # another process's newly acquired live lock during a race.
            try:
                current = lock.lstat()
                if (previous.st_ino, previous.st_mtime_ns) == (
                        current.st_ino, current.st_mtime_ns):
                    lock.unlink()
            except FileNotFoundError:
                pass
    if fd is None:
        release_launch(folder, launch_token)
        raise RuntimeError("Cannot safely acquire profile lock; retry")

    with os.fdopen(fd, "w") as writer:
        writer.write(str(os.getpid()))
    try:
        # Stop requests are reset only AFTER this child obtains the lock.
        # A duplicate invocation must never cancel the owner's stop signal.
        stop_file.unlink(missing_ok=True)
        release_launch(folder, launch_token)
        if (folder / ".cookie-maintenance").exists() or (folder / ".addon-maintenance").exists():
            raise RuntimeError("Cookie maintenance is in progress; stop and retry")
        # Import only in a child process. A missing engine is a visible launch error.
        from camoufox.sync_api import Camoufox
        ensure_engine_ready()  # Downloads the actual browser to the user cache on first use.
        os_name = profile.get("os", "native")
        fingerprint = get_identity(folder, os_name)
        opts = {
            "headless": False,
            "persistent_context": True,
            "user_data_dir": str(folder / "data"),
            "enable_cache": True,
            "fingerprint": fingerprint,
            "os": resolved_os(os_name),
        }
        # Each profile owns its own extracted Firefox addons. Load only the
        # explicitly enabled directories when Camoufox starts; no hot reload.
        from addon_manager import enabled_addon_paths
        opts["addons"] = enabled_addon_paths(store, profile_id)
        if profile.get("proxy_id"):
            opts["proxy"] = store.proxy_config(profile["proxy_id"])
            opts["geoip"] = True
        with Camoufox(**opts) as context:
            pages = context.pages
            page = pages[0] if pages else context.new_page()
            start_url = profile.get("url", "about:blank")
            if not (start_url == "about:blank" or (urlsplit(start_url).scheme in ("http", "https") and urlsplit(start_url).hostname)):
                raise ValueError("Invalid home page URL")
            try:
                page.goto(start_url, wait_until="domcontentloaded", timeout=20000)
            except Exception as exc:
                print("Navigation issue:", str(exc)[:300], file=sys.stderr)
            while not stop_file.exists():
                try:
                    pages = context.pages
                    if not pages:
                        break
                    pages[0].wait_for_timeout(600)
                except Exception:
                    break
    finally:
        release_launch(folder, launch_token)
        lock.unlink(missing_ok=True)
        stop_file.unlink(missing_ok=True)

def request_stop(store, profile_id):
    safe_profile_id(profile_id)
    profile = store.get_profile(profile_id)
    if not profile:
        return
    folder = store.root / "profiles" / profile_id
    if (folder / ".lock").exists():
        (folder / ".stop").touch()
    elif launch_pending(folder):
        raise RuntimeError("Profile is still starting; retry Stop after launch finishes")

def start_background(store, profile_id):
    safe_profile_id(profile_id)
    profile = store.get_profile(profile_id)
    if not profile:
        raise ValueError("Profile not found")
    lock = store.root / "profiles" / profile_id / ".lock"
    folder = lock.parent
    if any((folder / suffix).exists() for suffix in (
            ".cookie-maintenance", ".addon-maintenance")):
        raise RuntimeError("Profile maintenance is in progress")
    if lock.exists():
        try:
            pid = int(lock.read_text().strip())
        except (OSError, ValueError):
            pid = -1
        if pid_alive(pid):
            raise RuntimeError("Profile is already open")
        # Leave any stale browser lock for the child to re-check and remove,
        # preventing this UI thread from deleting a newly acquired live lock.

    token = reserve_launch(folder)
    try:
        if any((folder / suffix).exists() for suffix in (
                ".cookie-maintenance", ".addon-maintenance")):
            raise RuntimeError("Profile maintenance is in progress")
        if lock.exists():
            try:
                pid = int(lock.read_text().strip())
            except (OSError, ValueError):
                pid = -1
            if pid_alive(pid):
                raise RuntimeError("Profile is already open")
        log_path = store.root / "logs" / (profile_id + ".log")
        fd = os.open(str(log_path), os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
        with os.fdopen(fd, "a", encoding="utf-8") as log:
            child_env = dict(os.environ)
            child_env[LAUNCH_TOKEN_ENV] = token
            process = subprocess.Popen(
                launch_command(profile_id), stdin=subprocess.DEVNULL,
                stdout=log, stderr=subprocess.STDOUT, env=child_env,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        # The child removes its own reservation only after getting .lock.
        return process.pid
    except Exception:
        release_launch(folder, token)
        raise
