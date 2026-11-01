"""Browser-only secure account pairing. Passwords never enter the desktop app."""
from __future__ import annotations
import json
import secrets
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://murdilimax-browser.hatchable.site/api/device"

class LicenseError(RuntimeError):
    pass

class BrowserAccount:
    def __init__(self):
        self.token = None
        try:
            import keyring
            self.keyring = keyring
        except ImportError:
            self.keyring = None

    def installation_id(self):
        if getattr(self, "_install", None):
            return self._install
        val = self.keyring.get_password("Murdilimax Browser", "installation-v1") if self.keyring else None
        if not val or len(val) != 64 or any(c not in "0123456789abcdef" for c in val):
            val = secrets.token_hex(32)
            if self.keyring is None:
                raise LicenseError("Install the keyring dependency to use the account login")
            self.keyring.set_password("Murdilimax Browser", "installation-v1", val)
        self._install = val
        return val

    def load_token(self):
        if self.token:
            return self.token
        if self.keyring:
            try:
                return self.keyring.get_password("Murdilimax Browser", "device-token-v1")
            except Exception:
                return None
        return None

    def save_token(self, token):
        if len(token) != 64:
            raise LicenseError("Invalid login response")
        if not self.keyring:
            raise LicenseError("OS Keychain is required")
        self.keyring.set_password("Murdilimax Browser", "device-token-v1", token)
        self.token = token

    def forget_token(self):
        self.token = None
        if self.keyring:
            try:
                self.keyring.delete_password("Murdilimax Browser", "device-token-v1")
            except Exception:
                pass

    def post(self, endpoint, payload):
        req = urllib.request.Request(BASE + endpoint,
             data=json.dumps(payload).encode("utf-8"),
             headers={"Content-Type":"application/json","Accept":"application/json"},
             method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                if "application/json" not in response.headers.get("Content-Type",""):
                    raise LicenseError("Account service not public. Ask the administrator to enable access.")
                return json.loads(response.read(65536))
        except urllib.error.HTTPError as e:
            try:
                data = json.loads(e.read(4096))
                cause = data.get("error", "server_error")
            except Exception:
                cause = f"HTTP {e.code}"
            raise LicenseError(str(cause)) from e
        except urllib.error.URLError as e:
            raise LicenseError("Network connection failed") from e

    def begin(self):
        return self.post("/start", {"installation_id": self.installation_id()})

    def poll(self, code, secret):
        return self.post("/poll", {"code": code, "secret": secret})

    def verify(self):
        token = self.load_token()
        if not token:
            raise LicenseError("You are not signed in")
        return self.post("/me", {"token": token, "installation_id": self.installation_id()})

    def revoke(self):
        token = self.load_token()
        if token:
            try:
                self.post("/revoke", {"token": token})
            finally:
                self.forget_token()
