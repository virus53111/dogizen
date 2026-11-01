"""Opt-in loopback control API for the user's own local browser profiles.

No remote bind, no cookies or credentials in JSON, no unauthenticated actions.
The token lives in the OS keyring; the listener must be started explicitly.
"""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import hmac
import json
import os
import re
import threading
from urllib.parse import urlsplit

from auth_client import LicenseError
from engine import (pid_alive, request_stop, safe_profile_id,
                    start_background, verify_commercial_access)
from launch_guard import launch_pending
from profile_actions import create_quick_profiles
from store import Store

KEYRING_SERVICE = "Murdilimax Browser Local API"
KEYRING_ACCOUNT = "access-token-v1"
DEFAULT_PORT = 18765
_TOKEN_PATTERN = re.compile(r"[0-9a-f]{64}\Z")
_ACTION_PATTERN = re.compile(r"/v1/profiles/([0-9a-f]{32})/(start|stop|duplicate)\Z")
_PROFILE_PATTERN = re.compile(r"/v1/profiles/([0-9a-f]{32})\Z")
MAX_JSON_BODY = 4096


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


def _creation_allowance(store, count, *, verify=None):
    """Never use a client-supplied quota: verify the server above free tier."""
    if type(count) is not int or not 1 <= count <= 10:
        raise ValueError("Create between 1 and 10 profiles")
    if len(store.profiles()) + count <= 3 and os.environ.get(
            "MURDILIMAX_REQUIRE_LOGIN") != "1":
        return 3
    if verify is None:
        from auth_client import BrowserAccount
        verify = BrowserAccount().verify
    info = verify()
    if not isinstance(info, dict) or info.get("authorized") is not True:
        raise PermissionError("An authenticated subscription is required")
    entitlements = info.get("entitlements")
    limit = entitlements.get("profiles") if isinstance(entitlements, dict) else None
    if type(limit) is not int or not 0 <= limit <= 1000:
        raise PermissionError("Invalid server profile allowance")
    if len(store.profiles()) + count > limit:
        raise PermissionError("Current plan profile limit exceeded")
    return limit


def _checked_profile_changes(body):
    """Keep the write API free of secrets, arbitrary paths and fingerprint edits."""
    if not isinstance(body, dict) or not body or len(body) > 6:
        raise ValueError("Expected a nonempty profile metadata object")
    allowed = {"name", "group", "tags", "url", "startup_urls", "proxy_id"}
    if set(body) - allowed:
        raise ValueError("Unsupported profile fields")
    limits = {"name": 100, "group": 80, "tags": 200}
    for field, limit in limits.items():
        if field in body and (not isinstance(body[field], str)
                              or (field == "name" and not body[field].strip())
                              or len(body[field]) > limit):
            raise ValueError("Invalid " + field)
    if "proxy_id" in body and (not isinstance(body["proxy_id"], str)
                               or (body["proxy_id"] and
                                   not re.fullmatch(r"[0-9a-f]{32}", body["proxy_id"]))):
        raise ValueError("Invalid proxy reference")
    if "url" in body:
        url = body["url"]
        if not isinstance(url, str) or len(url) > 2048:
            raise ValueError("Invalid start page")
        if url not in ("", "about:blank"):
            try:
                parsed = urlsplit(url)
                if (parsed.scheme not in ("http", "https") or
                        not parsed.hostname or
                        parsed.username is not None or parsed.password is not None or
                        parsed.port == 0 or
                        any(x.isspace() or ord(x) < 32 or ord(x) == 127
                            for x in url)):
                    raise ValueError("Invalid start page")
            except ValueError:
                raise ValueError("Invalid start page") from None
    if "startup_urls" in body:
        from startup_tabs import normalize_extra_urls
        normalize_extra_urls(body["startup_urls"])
    return body


def make_server(store, token, *, port=DEFAULT_PORT):
    """Create a server bound ONLY to IPv4 loopback. Port 0 is for tests."""
    if not isinstance(token, str) or not _TOKEN_PATTERN.fullmatch(token):
        raise ValueError("Invalid API token")
    if type(port) is not int or not (port == 0 or 1024 <= port <= 65535):
        raise ValueError("Local API port must be between 1024 and 65535")
    if not isinstance(store, Store):
        raise ValueError("Invalid local profile store")

    metadata_lock = threading.RLock()

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

        def _read_json(self):
            """Strict bounded JSON body; reject chunked requests and ambiguities."""
            if self.headers.get("Transfer-Encoding") is not None:
                self.close_connection = True
                self._json(413, {"error": "request_body_not_supported"})
                return None
            lengths = self.headers.get_all("Content-Length", [])
            if len(lengths) != 1 or not lengths[0].isdigit():
                self.close_connection = True
                self._json(400, {"error": "content_length_required"})
                return None
            n = int(lengths[0])
            if not 0 < n <= MAX_JSON_BODY:
                self.close_connection = True
                self._json(413, {"error": "request_body_too_large"})
                return None
            if self.headers.get("Content-Type", "").lower() != "application/json":
                self.close_connection = True
                self._json(415, {"error": "json_required"})
                return None
            try:
                body = json.loads(self.rfile.read(n).decode("utf-8"))
            except (ValueError, UnicodeError):
                self._json(400, {"error": "invalid_json"})
                return None
            if not isinstance(body, dict):
                self._json(400, {"error": "invalid_json_object"})
                return None
            return body

        def _no_body(self):
            if (self.headers.get("Transfer-Encoding") is not None
                    or self.headers.get("Content-Length", "0") != "0"):
                self.close_connection = True
                self._json(413, {"error": "request_body_not_supported"})
                return False
            return True

        def _error(self, exc):
            if isinstance(exc, (PermissionError, LicenseError)):
                self._json(403, {"error": "license_required"})
            elif isinstance(exc, ValueError):
                self._json(400, {"error": "invalid_request"})
            elif isinstance(exc, RuntimeError):
                self._json(409, {"error": "operation_conflict"})
            elif isinstance(exc, (OSError, TypeError, KeyError)):
                self._json(500, {"error": "operation_failed"})
            else:
                self._json(500, {"error": "operation_failed"})

        def do_GET(self):
            if not self._authorize():
                return
            if self.path == "/v1/health":
                self._json(200, {"ok": True, "api_version": 2})
                return
            if self.path == "/v1/proxies":
                try:
                    proxies = [{"id": safe_profile_id(p["id"]),
                                "name": str(p.get("name", ""))[:100]}
                               for p in store.proxies()]
                except (ValueError, OSError, KeyError, TypeError):
                    self._json(500, {"error": "local_store_unavailable"})
                    return
                self._json(200, {"proxies": proxies, "count": len(proxies)})
                return
            if self.path == "/v1/profiles":
                try:
                    profiles = [_public_profile(store, p) for p in store.profiles()]
                except (ValueError, OSError, KeyError, TypeError):
                    self._json(500, {"error": "local_store_unavailable"})
                    return
                self._json(200, {"profiles": profiles, "count": len(profiles)})
                return
            detail = _PROFILE_PATTERN.fullmatch(self.path)
            if detail:
                try:
                    p = store.get_profile(detail.group(1))
                    if p is None:
                        self._json(404, {"error": "not_found"})
                    else:
                        self._json(200, {"profile": _public_profile(store, p)})
                except (ValueError, OSError, KeyError, TypeError):
                    self._json(500, {"error": "local_store_unavailable"})
                return
            self._json(404, {"error": "not_found"})

        def do_POST(self):
            if not self._authorize():
                return
            if self.path == "/v1/profiles/quick":
                body = self._read_json()
                if body is None:
                    return
                if set(body) - {"count", "name_prefix"}:
                    self._json(400, {"error": "invalid_request"})
                    return
                count = body.get("count", 1)
                prefix = body.get("name_prefix", "Quick profile")
                try:
                    with metadata_lock:
                        limit = _creation_allowance(store, count)
                        made = create_quick_profiles(
                            store, allowance=limit, count=count, name_prefix=prefix)
                        public = [_public_profile(store, p) for p in made]
                    self._json(201, {"created": public, "count": len(public)})
                except Exception as exc:
                    self._error(exc)
                return
            if not self._no_body():
                return
            match = _ACTION_PATTERN.fullmatch(self.path)
            if match is None:
                self._json(404, {"error": "not_found"})
                return
            profile_id, action = match.groups()
            try:
                if action == "duplicate":
                    with metadata_lock:
                        p = store.get_profile(profile_id)
                        if p is None:
                            self._json(404, {"error": "not_found"})
                            return
                        _creation_allowance(store, 1)
                        copied = store.duplicate_profile(profile_id)
                    self._json(201, {"profile": _public_profile(store, copied)})
                    return
                if store.get_profile(profile_id) is None:
                    self._json(404, {"error": "not_found"})
                    return
                if action == "start":
                    verify_commercial_access(store, profile_id)
                    pid = start_background(store, profile_id)
                    self._json(202, {"accepted": True, "state": "starting",
                                     "process_id": pid})
                else:
                    was_running = _profile_state(store, profile_id) != "stopped"
                    request_stop(store, profile_id)
                    self._json(202, {"accepted": True,
                                     "state": "stop_requested" if was_running else "stopped"})
            except Exception as exc:
                self._error(exc)

        def do_PATCH(self):
            if not self._authorize():
                return
            match = _PROFILE_PATTERN.fullmatch(self.path)
            if match is None:
                self._json(404, {"error": "not_found"})
                return
            body = self._read_json()
            if body is None:
                return
            try:
                checked = _checked_profile_changes(body)
                profile_id = match.group(1)
                with metadata_lock:
                    if store.get_profile(profile_id) is None:
                        self._json(404, {"error": "not_found"})
                        return
                    if _profile_state(store, profile_id) != "stopped":
                        self._json(409, {"error": "stop_profile_first"})
                        return
                    updated = store.update_profile(profile_id, **checked)
                    public = _public_profile(store, updated)
                self._json(200, {"profile": public})
            except Exception as exc:
                self._error(exc)

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
