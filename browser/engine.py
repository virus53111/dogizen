"""Camoufox-based browser launcher. Each profile runs in its own process and storage."""
from __future__ import annotations
import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import urlsplit

from store import Store

def launch_command(profile_id):
    if getattr(sys, "frozen", False):
        return [sys.executable, "--run-profile", profile_id]
    return [sys.executable, str(Path(__file__).with_name("app.py")), "--run-profile", profile_id]

def run_profile(profile_id):
    store = Store()
    profile = store.get_profile(profile_id)
    if not profile:
        raise ValueError("Unknown profile")
    folder = store.root / "profiles" / profile_id
    folder.mkdir(parents=True, exist_ok=True)
    stop_file = folder / ".stop"
    stop_file.unlink(missing_ok=True)
    lock = folder / ".lock"
    try:
        fd = os.open(str(lock), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        try:
            pid = int(lock.read_text().strip())
            os.kill(pid, 0)
        except (ProcessLookupError, ValueError, OSError):
            lock.unlink(missing_ok=True)
            return run_profile(profile_id)
        raise RuntimeError("The profile is already running")
    with os.fdopen(fd, "w") as writer:
        writer.write(str(os.getpid()))
    try:
        # Import only in a child process. A missing engine is a visible launch error.
        from camoufox.sync_api import Camoufox
        os_name = profile.get("os", "native")
        opts = {
            "headless": False,
            "persistent_context": True,
            "user_data_dir": str(folder / "data"),
            "enable_cache": True,
        }
        if os_name != "native":
            opts["os"] = os_name
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
        lock.unlink(missing_ok=True)
        stop_file.unlink(missing_ok=True)

def request_stop(store, profile_id):
    profile = store.get_profile(profile_id)
    if not profile:
        return
    folder = store.root / "profiles" / profile_id
    if (folder / ".lock").exists():
        (folder / ".stop").touch()

def start_background(store, profile_id):
    profile = store.get_profile(profile_id)
    if not profile:
        raise ValueError("Profile not found")
    lock = store.root / "profiles" / profile_id / ".lock"
    if lock.exists():
        try:
            pid = int(lock.read_text().strip())
            os.kill(pid, 0)
            raise RuntimeError("Profile is already open")
        except ProcessLookupError:
            lock.unlink(missing_ok=True)
    log_path = store.root / "logs" / (profile_id + ".log")
    with log_path.open("a", encoding="utf-8") as log:
        process = subprocess.Popen(launch_command(profile_id), stdin=subprocess.DEVNULL,
                                   stdout=log, stderr=subprocess.STDOUT,
                                   creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    return process.pid
