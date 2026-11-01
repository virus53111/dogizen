"""Paid fourth-and-later profiles always require a server entitlement.

This test never contacts production Stripe or any user account.
"""
import os
import tempfile
import unittest
from unittest.mock import patch
from store import Store
from engine import verify_commercial_access


class StubAccount:
    def __init__(self, payload=None, error=None):
        self.payload = payload
        self.error = error
        self.calls = 0

    def verify(self):
        self.calls += 1
        if self.error:
            raise self.error
        return self.payload


class PaidTierLaunchTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store = Store(self.tmp.name)
        self.identifiers = [self.store.add_profile("Profile "+str(i))["id"]
                            for i in range(5)]

    def test_three_free_profiles_open_offline(self):
        stub = StubAccount(error=ConnectionError("offline"))
        with patch.dict(os.environ, {"MURDILIMAX_REQUIRE_LOGIN": "0"}):
            for pid in self.identifiers[:3]:
                self.assertIsNone(verify_commercial_access(
                    self.store, pid, stub))
        self.assertEqual(stub.calls, 0)

    def test_fourth_profile_requires_server_entitlement(self):
        for payload in ({"authorized":False},
                        {"authorized":True,"entitlements":{"profiles":3}}):
            stub = StubAccount(payload)
            with patch.dict(os.environ, {"MURDILIMAX_REQUIRE_LOGIN":"0"}):
                with self.assertRaises(PermissionError):
                    verify_commercial_access(self.store,
                                             self.identifiers[3], stub)
            self.assertEqual(stub.calls,1)

    def test_paid_subscription_unlocks_only_authorized_count(self):
        stub = StubAccount({"authorized":True,
                            "tier":"start",
                            "entitlements":{"profiles":4}})
        with patch.dict(os.environ, {"MURDILIMAX_REQUIRE_LOGIN":"0"}):
            result = verify_commercial_access(
                self.store,self.identifiers[3],stub)
            self.assertEqual(result["tier"],"start")
            with self.assertRaisesRegex(PermissionError, "subscription limit"):
                verify_commercial_access(
                    self.store,self.identifiers[4],stub)

    def test_network_error_fails_closed_for_paid_only(self):
        stub = StubAccount(error=ConnectionError("offline"))
        with patch.dict(os.environ, {"MURDILIMAX_REQUIRE_LOGIN":"0"}):
            self.assertIsNone(verify_commercial_access(
                self.store,self.identifiers[0],stub))
            with self.assertRaises(ConnectionError):
                verify_commercial_access(self.store,self.identifiers[3],stub)

    def test_strict_mode_enforces_all_profiles(self):
        stub = StubAccount({"authorized":False})
        with patch.dict(os.environ, {"MURDILIMAX_REQUIRE_LOGIN":"1"}):
            with self.assertRaises(PermissionError):
                verify_commercial_access(self.store,self.identifiers[0],stub)
            self.assertEqual(stub.calls,1)

    def test_missing_profile_is_rejected_before_server_request(self):
        stub = StubAccount({"authorized":True,"entitlements":{"profiles":20}})
        with patch.dict(os.environ, {"MURDILIMAX_REQUIRE_LOGIN":"0"}):
            with self.assertRaisesRegex(ValueError, "Profile not found"):
                verify_commercial_access(self.store,"a"*32,stub)
        self.assertEqual(stub.calls,0)


if __name__=="__main__":
    unittest.main()
