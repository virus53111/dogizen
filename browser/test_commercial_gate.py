"""Commercial gate: do not trust the GUI or the CLI without server entitlement."""
import tempfile
import unittest
from unittest.mock import patch
from engine import verify_commercial_access
from store import Store

class FakeAccount:
    def __init__(self, response):
        self.response=response
        self.calls=0
    def verify(self):
        self.calls+=1
        return self.response

class CommercialGateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store=Store(self.temp.name)
        self.first=self.store.add_profile("One")["id"]
        self.second=self.store.add_profile("Two")["id"]

    def test_free_local_beta_does_not_reach_network(self):
        fake=FakeAccount({"authorized":False})
        with patch.dict("os.environ",{"MURDILIMAX_REQUIRE_LOGIN":"0"}):
            self.assertIsNone(verify_commercial_access(self.store,self.first,fake))
        self.assertEqual(fake.calls,0)

    def test_child_login_required_and_server_authorization_applied(self):
        denied=FakeAccount({"authorized":False})
        with self.assertRaises(PermissionError):
            verify_commercial_access(self.store,self.first,denied,required=True)
        self.assertEqual(denied.calls,1)
        allowed=FakeAccount({"authorized":True,"entitlements":{"profiles":1}})
        verify_commercial_access(self.store,self.first,allowed,required=True)
        with self.assertRaisesRegex(PermissionError,"subscription limit"):
            verify_commercial_access(self.store,self.second,allowed,required=True)

    def test_malformed_entitlements_fail_closed(self):
        for n in (None, "100", True, 1001, -1):
            with self.subTest(n=n), self.assertRaises(PermissionError):
                verify_commercial_access(self.store,self.first,
                    FakeAccount({"authorized":True,"entitlements":{"profiles":n}}),required=True)

if __name__=="__main__":
    unittest.main()
