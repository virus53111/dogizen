"""Opt-in loopback control API for the user's own local browser profiles.

No remote bind, no cookies or credentials in JSON, no unauthenticated actions.
The token lives in the OS keyring; the listener must be started explicitly.
"""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import hmac
import json
from pathlib import Path
import re

from auth_client import LicenseError
from engine import (pid_alive, request_stop, safe_profile_id,
                    start_background, verify_commercial_access)
from launch_guard import launch_pending
from store import Store

KEYRING_SERVICE = "Murdilimax Browser Local API"
KEYRING_ACCOUNT = "access-token-v1"
DEFAULT_PORT = 18765
_TOKEN_PATTERN = re.compile(r"[0-9a-f]{64}\Z")
_ACTION_PATTERN = re.compile(r"/v1/profiles/([0-9a-f]{32})/(start|stop)\Z")


def _keyring():
    try:
        import keyring
        return keyring
    except ImportError as exc:
        raise RuntimeError("Install keyring to enable the local API") from exc


def rotate_token(*, keyring_module=None):
    """Explicitly rotate the owner's API token; reveal only once to the caller."""
    import secrets
    token = secrets.token_hex(32)
    storage = keyring_module if keyring_module is not None else _keyring()
    storage.set_password(KEYRING_SERVICE, KEYRING_ACCOUNT, token)
    return token


def load_token(*, keyring_module=None):
    storage = keyring_module if keyring_module is not None else _keyring()
    token = storage.get_password(KEYRING_SERVICE, KEYRING_ACCOUNT)
    if not isinstance(token, str) or _TOKEN_PATTERN.fullmatch(token) is None:
        raise RuntimeError(
            "Local API token is absent. Run --api-rotate-token first.")
    return token


def _profile_state(store, profile_id):
    safe_profile_id(profile_id)
    folder = store.root / "profiles" / profile_id
    lock = folder / ".lock"
    if lock.is_file() and not lock.is_symlink():
        try:
            pid = int(lock.read_text(encoding="utf-8").strip())
        except (ValueError, OSError):
            pid = -1
        if pid_alive(pid):
            return "running"
    if launch_pending(folder):
        return "starting"
    return "stopped"


def _public_profile(store, profile):
    pid = safe_profile_id(profile["id"])
    return {
        "id": pid,
        "name": str(profile.get("name", ""))[:100],
        "group": str(profile.get("group", ""))[:80],
        "tags": str(profile.get("tags", ""))[:200],
        "state": _profile_state(store, pid),
        "proxy_assigned": bool(profile.get("proxy_id")),
    }


def make_server(store, token, *, port=DEFAULT_PORT):
    """Create a server bound ONLY to IPv4 loopback. Port 0 is for tests."""
    if not isinstance(token, str) or not _TOKEN_PATTERN.fullmatch(token):
        raise ValueError("Invalid API token")
    if type(port) is not int or not (port == 0 or 1024 <= port <= 65535):
        raise ValueError("Local API port must be between 1024 and 65535")
    if not isinstance(store, Store):
        raise ValueError("Invalid local profile store")

    class Handler(BaseHTTPRequestHandler):
        server_version = "MurdilimaxLocalAPI/1"
        sys_version = ""

        def log_message(self, *_):
            # Never log URLs, Authorization headers or local profile metadata.
            pass

        def _json(self, status, body):
            encoded = json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'none'")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def _authorize(self):
            # Host validation prevents DNS-rebinding attacks against loopback.
            expected_port = self.server.server_address[1]
            if self.headers.get("Host") not in (
                    "127.0.0.1:" + str(expected_port),
                    "localhost:" + str(expected_port)):
                self._json(403, {"error": "invalid_host"})
                return False
            # Never serve requests from untrusted websites, even when auth fails.
            if self.headers.get("Origin") is not None:
                self._json(403, {"error": "browser_origin_forbidden"})
                return False
            value = self.headers.get("Authorization", "")
            supplied = value[7:] if value.startswith("Bearer ") else ""
            if (len(supplied) != 64 or _TOKEN_PATTERN.fullmatch(supplied) is None
                    or not hmac.compare_digest(supplied, token)):
                self._json(401, {"error": "unauthorized"})
                return False
            if "?" in self.path or "#" in self.path:
                self._json(400, {"error": "invalid_path"})
                return False
            return True

        def do_GET(self):
            if not self._authorize():
                return
            if self.path == "/v1/health":
                self._json(200, {"ok": True, "api_version": 1})
                return
            if self.path != "/v1/profiles":
                self._json(404, {"error": "not_found"})
                return
            try:
                profiles = [_public_profile(store, p) for p in store.profiles()]
            except (ValueError, OSError, KeyError, TypeError):
                self._json(500, {"error": "local_store_unavailable"})
                return
            self._json(200, {"profiles": profiles, "count": len(profiles)})

        def do_POST(self):
            if not self._authorize():
                return
            if (self.headers.get("Transfer-Encoding") or
                    self.headers.get("Content-Length", "0") != "0"):
                self.close_connection = True
                self._json(413, {"error": "request_body_not_supported"})
                return
            match = _ACTION_PATTERN.fullmatch(self.path)
            if match is None:
                self._json(404, {"error": "not_found"})
                return
            profile_id, action = match.groups()
            try:
                if store.get_profile(profile_id) is None:
                    self._json(404, {"error": "not_found"})
                    return
                if action == "start":
                    # The child process repeats this check; the API cannot
                    # circumvent the server's paid-profile entitlement.
                    verify_commercial_access(store, profile_id)
                    pid = start_background(store, profile_id)
                    self._json(202, {"accepted": True, "state": "starting",
                                     "process_id": pid})
                else:
                    was_running = _profile_state(store, profile_id) != "stopped"
                    request_stop(store, profile_id)
                    self._json(202, {"accepted": True,
                                     "state": "stop_requested" if was_running else "stopped"})
            except (PermissionError, LicenseError):
                self._json(403, {"error": "license_required"})
            except ValueError:
                self._json(400, {"error": "invalid_profile"})
            except RuntimeError:
                self._json(409, {"error": "operation_conflict"})
            except (OSError, TypeError, KeyError):
                self._json(500, {"error": "operation_failed"})

        def do_OPTIONS(self):
            self._json(405, {"error": "method_not_allowed"})

    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.daemon_threads = True
    server.request_queue_size = 16
    return server


def serve_api(*, port=DEFAULT_PORT):
    """Explicit, foreground-only entry point; never launches with the GUI."""
    token = load_token()
    with make_server(Store(), token, port=port) as server:
        print("Murdilimax local API listening on 127.0.0.1:" +
              str(server.server_address[1]) + " (no remote access)")
        server.serve_forever(poll_interval=0.2)
