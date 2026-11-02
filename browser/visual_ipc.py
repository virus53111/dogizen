"""Private request/ack protocol for visual blocks executed inside Camoufox.

No listening socket. Each command is tied to the browser child PID + random
session token, and acknowledged with status only (no URLs, page data or text).
"""
from __future__ import annotations

import json
import os
import re
import time
import uuid
from pathlib import Path

from navigation_commands import (_active_session, _read_session,
                                 validated_navigation_url)
from visual_workflows import validated_step

REQUESTS = ".visual-requests"
RESPONSES = ".visual-results"
IDENT = re.compile(r"[0-9a-f]{32}\Z")
MAX_PENDING = 8
MAX_BODY = 5000


def _folder(root, name):
    folder = Path(root) / name
    if folder.is_symlink():
        raise RuntimeError("Unsafe workflow queue directory")
    folder.mkdir(mode=0o700, exist_ok=True)
    if folder.is_symlink() or not folder.is_dir():
        raise RuntimeError("Unsafe workflow queue directory")
    if os.name != "nt":
        folder.chmod(0o700)
    return folder


def submit_visual_step(store, profile_id, step, *, verify=None, alive=None,
                       cancel=None, timeout=25.0, sleeper=None):
    """Run one confirmed local block and await the Camoufox process's ack."""
    from engine import pid_alive, verify_commercial_access
    from launch_guard import launch_pending
    step = validated_step(step)
    if step["kind"] == "wait":
        raise ValueError("Wait is performed locally by the workflow executor")
    verify = verify if verify is not None else verify_commercial_access
    alive = alive if alive is not None else pid_alive
    if type(timeout) not in (int, float) or not 1 <= timeout <= 40:
        raise ValueError("Invalid workflow command timeout")
    folder, session = _active_session(store, profile_id, alive=alive)
    if launch_pending(folder):
        raise RuntimeError("Profile is still starting")
    if (folder / ".cookie-maintenance").exists() or (
            folder / ".addon-maintenance").exists():
        raise RuntimeError("Profile maintenance is in progress")
    verify(store, profile_id)
    requests = _folder(folder, REQUESTS)
    results = _folder(folder, RESPONSES)
    if sum(1 for p in requests.iterdir() if p.is_file() and
           IDENT.fullmatch(p.stem) and p.suffix == ".json") >= MAX_PENDING:
        raise RuntimeError("Visual workflow queue is full")
    # Only the original process may execute the queued command.
    if _active_session(store, profile_id, alive=alive)[1] != session:
        raise RuntimeError("Browser restarted during workflow")
    ident = uuid.uuid4().hex
    file = requests / (ident + ".json")
    pending = requests / (ident + ".tmp")
    response = results / (ident + ".json")
    body = json.dumps({"token": session["token"], "step": step},
                      ensure_ascii=False).encode("utf-8")
    if len(body) > MAX_BODY:
        raise ValueError("Workflow command too large")
    try:
        fd = os.open(pending, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "wb") as writer:
            writer.write(body)
            writer.flush()
            os.fsync(writer.fileno())
        os.replace(pending, file)
    finally:
        pending.unlink(missing_ok=True)
    sleep = sleeper if sleeper is not None else time.sleep
    end = time.monotonic() + timeout
    try:
        while time.monotonic() < end:
            if cancel is not None and cancel.is_set():
                raise RuntimeError("Workflow cancelled during command")
            if _active_session(store, profile_id, alive=alive)[1] != session:
                raise RuntimeError("Browser restarted during command")
            if response.is_file() and not response.is_symlink():
                if response.stat().st_size > 200:
                    raise RuntimeError("Invalid workflow acknowledgement")
                reply = json.loads(response.read_text(encoding="ascii"))
                if not isinstance(reply, dict) or set(reply) != {"ok"} or type(reply["ok"]) is not bool:
                    raise RuntimeError("Invalid workflow acknowledgement")
                if not reply["ok"]:
                    raise RuntimeError("Browser action did not complete")
                return True
            sleep(0.25)
        raise TimeoutError("Browser did not acknowledge workflow action")
    finally:
        # A cancelled request is not replayed later. Already-running action
        # cannot be interrupted by deleting a consumed request.
        file.unlink(missing_ok=True)
        response.unlink(missing_ok=True)


def consume_visual_commands(context, folder, token):
    """Execute bounded CSS locator actions inside the owning browser process."""
    if not isinstance(token, str) or not re.fullmatch(r"[0-9a-f]{48}", token):
        raise ValueError("Invalid browser workflow session")
    requests = _folder(folder, REQUESTS)
    results = _folder(folder, RESPONSES)
    stats = {"ok": 0, "failed": 0, "ignored": 0}
    for path in sorted(requests.iterdir(), key=lambda p: p.name)[:MAX_PENDING]:
        if path.suffix != ".json" or not IDENT.fullmatch(path.stem):
            continue
        ident = path.stem
        try:
            if path.is_symlink() or not path.is_file() or not 0 < path.stat().st_size <= MAX_BODY:
                stats["ignored"] += 1
                continue
            command = json.loads(path.read_text(encoding="utf-8"))
            path.unlink()
            if (not isinstance(command, dict) or set(command) != {"token", "step"}
                    or command["token"] != token):
                stats["ignored"] += 1
                continue
            # The token belongs to this exact child, never an older process.
            if _read_session(folder)["token"] != token:
                stats["ignored"] += 1
                continue
            step = validated_step(command["step"])
            if step["kind"] == "wait":
                stats["ignored"] += 1
                continue
        except (OSError, ValueError, UnicodeError, TypeError, KeyError, RuntimeError):
            stats["ignored"] += 1
            continue
        success = False
        try:
            kind = step["kind"]
            if kind == "open":
                page = context.new_page()
                try:
                    page.goto(step["url"], wait_until="domcontentloaded", timeout=15000)
                except Exception:
                    page.close()
                    raise
            else:
                pages = context.pages
                if not pages:
                    raise RuntimeError("No browser pages")
                page = pages[-1]
                if kind == "click":
                    page.locator(step["selector"]).click(timeout=12000)
                elif kind == "wait_visible":
                    page.locator(step["selector"]).wait_for(
                        state="visible", timeout=step["seconds"] * 1000)
                elif kind == "assert_text":
                    # Only an acknowledgement leaves this profile, never page text.
                    # Playwright's locator waits for asynchronously rendered text.
                    page.locator(step["selector"]).filter(
                        has_text=step["text"]).first.wait_for(
                        state="visible", timeout=step["seconds"] * 1000)
                elif kind == "fill":
                    page.locator(step["selector"]).fill(step["text"], timeout=12000)
                elif kind == "scroll":
                    page.mouse.wheel(0, step["pixels"])
            success = True
        except Exception:
            pass  # Never print URL, selectors, text or page contents.
        reply = results / (ident + ".json")
        tmp = results / (ident + ".tmp")
        try:
            fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w", encoding="ascii") as writer:
                json.dump({"ok": success}, writer)
            os.replace(tmp, reply)
        finally:
            tmp.unlink(missing_ok=True)
        stats["ok" if success else "failed"] += 1
    return stats
