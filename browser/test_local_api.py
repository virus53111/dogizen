"""Offline regression tests for the opt-in, loopback-only local profile API."""
from __future__ import annotations

import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from local_api import (KEYRING_ACCOUNT, KEYRING_SERVICE, load_token,
                       make_server, rotate_token)
from store import Store

TEST_TOKEN = "a" * 64


class FakeKeyring:
    def __init__(self):
        self.items = {}

    def get_password(self, service, username):
        return self.items.get((service, username))

    def set_password(self, service, username, password):
        self.items[(service, username)] = password


class ProfileAPITests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = Store(Path(self.temp.name) / "app")
        self.profiles = [self.store.add_profile(
            f"Profile {i}", "https://private.example/?secret=never-expose",
            "Business", "test", "private notes") for i in range(4)]
        self.server = make_server(self.store, TEST_TOKEN, port=0)
        self.addCleanup(self.server.server_close)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self._stop_server)

    def _stop_server(self):
        self.server.shutdown()
        self.thread.join(timeout=5)

    def call(self, method, path, *, token=TEST_TOKEN, headers=None, body=None):
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.server.server_address[1], timeout=5)
        all_headers = dict(headers or {})
        if token is not None:
            all_headers["Authorization"] = "Bearer " + token
        connection.request(method, path, body=body, headers=all_headers)
        response = connection.getresponse()
        raw = response.read()
        status, response_headers = response.status, dict(response.getheaders())
        connection.close()
        return status, json.loads(raw), response_headers

    def test_authenticated_health_and_private_profile_list(self):
        code, obj, head = self.call("GET", "/v1/health")
        self.assertEqual(code, 200)
        self.assertEqual(obj["api_version"], 1)
        self.assertEqual(head["Cache-Control"], "no-store")
        code, data, _ = self.call("GET", "/v1/profiles")
        self.assertEqual(code, 200)
        self.assertEqual(data["count"], 4)
        first = data["profiles"][0]
        self.assertEqual(first["id"], self.profiles[0]["id"])
        self.assertEqual(first["name"], "Profile 0")
        self.assertEqual(first["state"], "stopped")
        self.assertEqual(set(first), {"id", "name", "group", "tags", "state",
                                      "proxy_assigned"})
        exposed = json.dumps(data)
        for secret in ("private.example", "secret=never-expose",
                       "private notes", "password", "cookies"):
            self.assertNotIn(secret, exposed)

    def test_no_anonymous_or_cross_origin_access(self):
        for token in (None, "x" * 64, "a" * 63, "é" * 64):
            with self.subTest(token=token):
                self.assertEqual(self.call("GET", "/v1/profiles", token=token)[0], 401)
        self.assertEqual(self.call(
            "GET", "/v1/profiles", headers={"Origin": "https://evil.example"})[0], 403)
        self.assertEqual(self.call(
            "GET", "/v1/profiles", headers={"Host": "rebinding.example"})[0], 403)
        code, _, hdr = self.call("OPTIONS", "/v1/profiles")
        self.assertEqual(code, 405)
        self.assertNotIn("Access-Control-Allow-Origin", hdr)

    def test_start_uses_paid_entitlement_and_requests_only_one_launch(self):
        pid = self.profiles[0]["id"]
        with (patch("local_api.verify_commercial_access") as check,
              patch("local_api.start_background", return_value=41234) as launch):
            code, data, _ = self.call("POST", f"/v1/profiles/{pid}/start")
            self.assertEqual(code, 202)
            self.assertEqual(data, {"accepted": True, "state": "starting",
                                    "process_id": 41234})
            check.assert_called_once_with(self.store, pid)
            launch.assert_called_once_with(self.store, pid)

    def test_paid_profile_denied_before_spawn(self):
        pid = self.profiles[3]["id"]
        with (patch("local_api.verify_commercial_access",
                    side_effect=PermissionError("test authorization failure")),
              patch("local_api.start_background") as launch):
            code, data, _ = self.call("POST", f"/v1/profiles/{pid}/start")
            self.assertEqual(code, 403)
            self.assertEqual(data, {"error": "license_required"})
            launch.assert_not_called()

    def test_stop_goes_through_engine(self):
        pid = self.profiles[0]["id"]
        with patch("local_api.request_stop") as stop:
            code, data, _ = self.call("POST", f"/v1/profiles/{pid}/stop")
            self.assertEqual(code, 202)
            self.assertEqual(data["state"], "stopped")
            stop.assert_called_once_with(self.store, pid)

    def test_unknown_actions_and_body_rejected(self):
        self.assertEqual(
            self.call("POST", "/v1/profiles/" + "f" * 32 + "/start")[0], 404)
        self.assertEqual(
            self.call("POST", "/v1/profiles/" + self.profiles[0]["id"] + "/delete")[0], 404)
        self.assertEqual(
            self.call("POST", "/v1/profiles/" + self.profiles[0]["id"] + "/start",
                      body="not supported")[0], 413)
        self.assertEqual(
            self.call("GET", "/v1/profiles?token=bad")[0], 400)

    def test_configuration_rejects_external_binding_and_invalid_tokens(self):
        self.assertEqual(self.server.server_address[0], "127.0.0.1")
        for token in ("", "x" * 64, "ab" * 31, None):
            with self.subTest(token=token), self.assertRaises(ValueError):
                make_server(self.store, token, port=0)
        for port in (-1, 1, 80, 65536, True, "18765"):
            with self.subTest(port=port), self.assertRaises(ValueError):
                make_server(self.store, TEST_TOKEN, port=port)


class KeyringTests(unittest.TestCase):
    def test_token_rotation_is_private_and_usable(self):
        keyring = FakeKeyring()
        with self.assertRaisesRegex(RuntimeError, "absent"):
            load_token(keyring_module=keyring)
        initial = rotate_token(keyring_module=keyring)
        self.assertEqual(len(initial), 64)
        self.assertEqual(load_token(keyring_module=keyring), initial)
        self.assertEqual(keyring.get_password(KEYRING_SERVICE, KEYRING_ACCOUNT),
                         initial)
        changed = rotate_token(keyring_module=keyring)
        self.assertNotEqual(initial, changed)
        self.assertEqual(load_token(keyring_module=keyring), changed)


if __name__ == "__main__":
    unittest.main()
