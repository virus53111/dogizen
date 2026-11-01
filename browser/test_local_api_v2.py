"""HTTP integration tests for the opt-in Murdilimax local automation API v2.

No real payment or network beyond loopback. Mock paid allowance explicitly.
"""
from __future__ import annotations

import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from local_api import (_checked_profile_changes, _creation_allowance,
                       make_server)
from store import Store

TOKEN = "b" * 64


class LocalAPIV2Tests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = Store(Path(self.temp.name) / "profile-data")
        self.server = make_server(self.store, TOKEN, port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self._stop)
        self.addCleanup(self.server.server_close)

    def _stop(self):
        self.server.shutdown()
        self.thread.join(timeout=5)

    def request(self, method, path, data=None, *, auth=True, headers=None):
        req_headers = dict(headers or {})
        if auth:
            req_headers["Authorization"] = "Bearer " + TOKEN
        if data is not None and isinstance(data, dict):
            data = json.dumps(data, ensure_ascii=False)
        if data is not None and "Content-Type" not in req_headers:
            req_headers["Content-Type"] = "application/json"
        connection = http.client.HTTPConnection(
            "127.0.0.1", self.server.server_address[1], timeout=5)
        connection.request(method, path, body=data, headers=req_headers)
        response = connection.getresponse()
        raw = response.read()
        status = response.status
        connection.close()
        return status, json.loads(raw)

    def test_backward_compatible_list_and_new_sanitized_get(self):
        a = self.store.add_profile("One", url="https://private.example/?token=never-log",
                                   notes="Hidden secret", group="Sales")
        proxy = self.store.add_proxy("Private proxy",
                                     "http://127.0.0.1:8080", username="login")
        status, obj = self.request("GET", "/v1/profiles")
        self.assertEqual(status, 200)
        self.assertEqual(obj["count"], 1)
        status, detail = self.request("GET", "/v1/profiles/" + a["id"])
        self.assertEqual(status, 200)
        self.assertEqual(detail["profile"]["name"], "One")
        self.assertEqual(set(detail["profile"]), {
            "id", "name", "group", "tags", "state", "proxy_assigned"})
        status, listed = self.request("GET", "/v1/proxies")
        self.assertEqual(status, 200)
        self.assertEqual(listed["proxies"], [{"id": proxy["id"],
                                              "name": "Private proxy"}])
        response = json.dumps([obj, detail, listed])
        for secret in ("private.example", "never-log", "Hidden secret",
                       "127.0.0.1:8080", "login"):
            self.assertNotIn(secret, response)

    def test_quick_create_respects_free_allowance_atomically(self):
        status, first = self.request("POST", "/v1/profiles/quick",
                                     {"count": 2, "name_prefix": "Team"})
        self.assertEqual(status, 201)
        self.assertEqual(first["count"], 2)
        self.assertEqual([x["name"] for x in first["created"]], ["Team 1", "Team 2"])
        status, second = self.request("POST", "/v1/profiles/quick", {"count": 1})
        self.assertEqual(status, 201)
        self.assertEqual(len(self.store.profiles()), 3)
        with patch("auth_client.BrowserAccount.verify",
                   return_value={"authorized": False}) as verify:
            status, denied = self.request("POST", "/v1/profiles/quick", {"count": 1})
            self.assertEqual(status, 403)
            verify.assert_called_once()
            self.assertEqual(denied["error"], "license_required")
        self.assertEqual(len(self.store.profiles()), 3)

    def test_paid_allowance_verified_server_side_and_not_from_request(self):
        for i in range(3):
            self.store.add_profile(f"Free {i}")
        with patch("auth_client.BrowserAccount.verify",
                   return_value={"authorized": True,
                                 "entitlements": {"profiles": 4}}):
            status, obj = self.request("POST", "/v1/profiles/quick", {"count": 1})
            self.assertEqual(status, 201)
            status, _ = self.request("POST", "/v1/profiles/quick", {"count": 1})
            self.assertEqual(status, 403)
            status, _ = self.request("POST", "/v1/profiles/quick",
                                     {"count": 1, "allowance": 1000})
            self.assertEqual(status, 400)
        self.assertEqual(len(self.store.profiles()), 4)

    def test_duplicate_respects_quota_and_is_metadata_only(self):
        first = self.store.add_profile("First", "https://example.net", group="Ads")
        status, obj = self.request("POST", f"/v1/profiles/{first['id']}/duplicate")
        self.assertEqual(status, 201)
        copy = obj["profile"]
        self.assertNotEqual(copy["id"], first["id"])
        self.assertEqual(copy["group"], "Ads")
        self.assertNotEqual(copy["name"], first["name"])
        self.assertFalse((self.store.root / "profiles" / copy["id"] /
                          "cookies.sqlite").exists())
        self.store.add_profile("Third")
        with patch("auth_client.BrowserAccount.verify",
                   return_value={"authorized": False}):
            status, _ = self.request("POST", f"/v1/profiles/{first['id']}/duplicate")
        self.assertEqual(status, 403)
        self.assertEqual(len(self.store.profiles()), 3)

    def test_patch_stopped_profile_only_and_proxy_assignment(self):
        one = self.store.add_profile("Before")
        proxy = self.store.add_proxy("Assigned", "http://127.0.0.1:8080")
        status, result = self.request("PATCH", f"/v1/profiles/{one['id']}",
                                      {"name": "After", "group": "New",
                                       "tags": "Green", "proxy_id": proxy["id"],
                                       "startup_urls": ["https://example.org"]})
        self.assertEqual(status, 200)
        self.assertTrue(result["profile"]["proxy_assigned"])
        stored = self.store.get_profile(one["id"])
        self.assertEqual(stored["name"], "After")
        self.assertEqual(stored["startup_urls"], ["https://example.org"])
        self.assertEqual(stored["proxy_id"], proxy["id"])
        with patch("local_api._profile_state", return_value="running"):
            status, msg = self.request("PATCH", f"/v1/profiles/{one['id']}",
                                       {"name": "Never applied"})
        self.assertEqual(status, 409)
        self.assertEqual(msg["error"], "stop_profile_first")
        self.assertEqual(self.store.get_profile(one["id"])["name"], "After")

    def test_reject_unsafe_fields_and_all_or_nothing_patches(self):
        one = self.store.add_profile("Original", "about:blank")
        before = self.store.profiles()
        invalids = [
            {"url": "file:///etc/passwd"}, {"url": "javascript:alert(1)"},
            {"url": "https://user:secret@example.com/"}, {"url": "https://foo/bar baz"},
            {"url": "https://example.com:invalid"},
            {"startup_urls": ["https://ok.example", "file:///etc/passwd"]},
            {"startup_urls": "https://example.com"},
            {"proxy_id": "f" * 32}, {"password": "secret"}, {"os": "windows"},
            {"cookies": []}, {"notes": "not included in API"}, {},
            {"name": ""}, {"name": "X" * 101},
        ]
        for bad in invalids:
            with self.subTest(data=bad):
                status, resp = self.request("PATCH", f"/v1/profiles/{one['id']}", bad)
                self.assertEqual(status, 400, resp)
                self.assertEqual(self.store.profiles(), before)

    def test_untrusted_requests_denied(self):
        status, _ = self.request("POST", "/v1/profiles/quick", {"count": 1},
                                  auth=False)
        self.assertEqual(status, 401)
        status, _ = self.request("PATCH", "/v1/profiles/" + "a" * 32,
                                  {"name": "Denied"}, headers={
                                      "Origin": "https://evil.example"})
        self.assertEqual(status, 403)
        status, _ = self.request("GET", "/v1/proxies", headers={
            "Host": "attacker.example"})
        self.assertEqual(status, 403)
        self.assertEqual(len(self.store.profiles()), 0)

    def test_bounded_request_body_and_content_type(self):
        status, obj = self.request("POST", "/v1/profiles/quick",
                                   "[]" ,headers={"Content-Type": "application/json"})
        self.assertEqual(status, 400)
        status, obj = self.request("POST", "/v1/profiles/quick", {"count": 1},
                                   headers={"Content-Type": "text/plain"})
        self.assertEqual(status, 415)
        status, obj = self.request("POST", "/v1/profiles/quick",
                                   {"name_prefix": "x" * 4500})
        self.assertEqual(status, 413)
        self.assertFalse(self.store.profiles())


class AllowanceTests(unittest.TestCase):
    def test_server_checked_when_over_free_limit(self):
        with tempfile.TemporaryDirectory() as directory:
            store = Store(Path(directory))
            self.assertEqual(_creation_allowance(store, 3), 3)
            with self.assertRaises(PermissionError):
                _creation_allowance(store, 4, verify=lambda: {
                    "authorized": True, "entitlements": {"profiles": 3}})
            self.assertEqual(_creation_allowance(store, 4, verify=lambda: {
                "authorized": True, "entitlements": {"profiles": 8}}), 8)
            for bad in (-1, 0, True, 11, "1"):
                with self.subTest(count=bad), self.assertRaises(ValueError):
                    _creation_allowance(store, bad)


if __name__ == "__main__":
    unittest.main()
