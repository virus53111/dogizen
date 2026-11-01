"""End-to-end *synthetic* account pairing and license contract regression.

This intentionally uses no real users, email, payments, hosted API writes or
live pairing codes. The simulated HTTP service mirrors the deployed contract:
start -> pending -> claim performed in browser -> authorized -> /me -> revoke.
"""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest
from urllib.parse import urlsplit
from unittest.mock import patch

from auth_client import BASE, BrowserAccount, LicenseError
from engine import verify_commercial_access
from store import Store

CODE = "ABCD2345"
SECRET = "b" * 64
TOKEN = "c" * 64
INSTALL = "a" * 64


class FakeKeyring:
    def __init__(self):
        self.passwords = {}

    def get_password(self, namespace, key):
        return self.passwords.get((namespace, key))

    def set_password(self, namespace, key, value):
        self.passwords[(namespace, key)] = value

    def delete_password(self, namespace, key):
        self.passwords.pop((namespace, key), None)


class Response:
    headers = {"Content-Type": "application/json; charset=utf-8"}

    def __init__(self, data):
        self.value = json.dumps(data).encode("utf-8")

    def read(self, n):
        return self.value[:n]

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class FakeService:
    def __init__(self):
        self.confirmed = False
        self.revoked = False
        self.calls = []

    def urlopen(self, request, timeout=15):
        parsed = urlsplit(request.full_url)
        assert parsed.scheme == "https"
        assert parsed.netloc == urlsplit(BASE).netloc
        assert timeout == 15
        assert request.get_method() == "POST"
        data = json.loads(request.data)
        endpoint = parsed.path.removeprefix("/api/device")
        self.calls.append((endpoint, data))
        if endpoint == "/start":
            assert data == {"installation_id": INSTALL}
            return Response({
                "code": CODE, "device_secret": SECRET, "expires_in": 600,
                "interval": 3,
                "verification_uri":
                "https://murdilimax-browser.hatchable.site/connect.html?code=" + CODE,
            })
        if endpoint == "/poll":
            assert data == {"code": CODE, "secret": SECRET}
            if self.revoked:
                return Response({"status": "consumed"})
            if self.confirmed:
                return Response({"status": "authorized", "token": TOKEN,
                                 "email": "synthetic@example.invalid"})
            return Response({"status": "pending"})
        if endpoint == "/me":
            assert data == {"token": TOKEN, "installation_id": INSTALL}
            if self.revoked:
                return Response({"authorized": False, "error": "expired_or_revoked"})
            return Response({
                "authorized": True, "tier": "free",
                "entitlements": {"profiles": 3, "team": 0},
                "paid_billing_active": False,
                "device_binding_enabled": True,
            })
        if endpoint == "/revoke":
            assert data == {"token": TOKEN}
            self.revoked = True
            return Response({"ok": True})
        raise AssertionError("Unexpected API endpoint: " + endpoint)


class OnboardingContractTests(unittest.TestCase):
    def setUp(self):
        self.keyring = FakeKeyring()
        self.keyring.set_password("Murdilimax Browser", "installation-v1", INSTALL)
        self.account = BrowserAccount()
        self.account.keyring = self.keyring
        self.service = FakeService()

    def test_complete_pair_confirm_verify_revoke(self):
        with patch("auth_client.urllib.request.urlopen",
                   side_effect=self.service.urlopen):
            start = self.account.begin()
            self.assertEqual(start["code"], CODE)
            self.assertEqual(start["device_secret"], SECRET)
            self.assertEqual(start["expires_in"], 600)
            self.assertEqual(
                urlsplit(start["verification_uri"]).hostname,
                "murdilimax-browser.hatchable.site")
            self.assertEqual(self.account.poll(CODE, SECRET)["status"], "pending")
            # The actual user must approve the pairing in the authenticated
            # website. This is a synthetic simulation of that explicit step.
            self.service.confirmed = True
            answer = self.account.poll(CODE, SECRET)
            self.assertEqual(answer["status"], "authorized")
            self.assertEqual(answer["token"], TOKEN)
            self.account.save_token(answer["token"])
            license_state = self.account.verify()
            self.assertTrue(license_state["authorized"])
            self.assertEqual(license_state["tier"], "free")
            self.assertEqual(license_state["entitlements"]["profiles"], 3)
            self.assertFalse(license_state["paid_billing_active"])
            new_process = BrowserAccount()
            new_process.keyring = self.keyring
            self.assertEqual(new_process.verify()["entitlements"]["profiles"], 3)
            new_process.revoke()
            self.assertIsNone(new_process.load_token())
            with self.assertRaises(LicenseError):
                new_process.verify()

        self.assertEqual(
            [path for path, _ in self.service.calls],
            ["/start", "/poll", "/poll", "/me", "/me", "/revoke"])
        self.assertTrue(
            all("password" not in body and "email_code" not in body
                for _path, body in self.service.calls))
        self.assertEqual(
            self.keyring.get_password("Murdilimax Browser", "installation-v1"),
            INSTALL)

    def test_paid_and_free_profile_limits_enforced_in_strict_mode(self):
        # Strict child-process gate is opt-in for the current public beta.
        # This test does not silently change the production rollout switch.
        with tempfile.TemporaryDirectory() as temp:
            store = Store(Path(temp) / "appdata")
            profiles = [store.add_profile("Test " + str(i))["id"] for i in range(5)]
            self.account.save_token(TOKEN)
            with patch("auth_client.urllib.request.urlopen",
                       side_effect=self.service.urlopen):
                for i in range(3):
                    result = verify_commercial_access(
                        store, profiles[i], account=self.account, required=True)
                    self.assertEqual(result["tier"], "free")
                with self.assertRaisesRegex(PermissionError, "subscription limit"):
                    verify_commercial_access(
                        store, profiles[3], account=self.account, required=True)

    def test_no_token_denies_access_before_any_network_request(self):
        with patch("auth_client.urllib.request.urlopen") as call:
            with self.assertRaisesRegex(LicenseError, "not signed in"):
                self.account.verify()
            call.assert_not_called()

    def test_invalid_persisted_token_cannot_claim_login(self):
        for bad in ("", "not-a-token", "x" * 63):
            with self.subTest(token=bad):
                with self.assertRaises(LicenseError):
                    self.account.save_token(bad)


if __name__ == "__main__":
    unittest.main()
