"""No-network tests of the desktop login/installation client."""
import json
import unittest
from unittest.mock import patch
from auth_client import BrowserAccount, LicenseError

class Keyring:
    def __init__(self):
        self.data = {}
    def get_password(self, group, key):
        return self.data.get((group, key))
    def set_password(self, group, key, value):
        self.data[(group, key)] = value
    def delete_password(self, group, key):
        self.data.pop((group, key), None)

class JsonResponse:
    headers = {"Content-Type": "application/json"}
    def __init__(self, obj):
        self.data = json.dumps(obj).encode("utf-8")
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def read(self, size):
        return self.data[:size]

class AccountTests(unittest.TestCase):
    def setUp(self):
        self.account = BrowserAccount()
        self.account.keyring = Keyring()

    def test_installation_stable_and_secret_safe(self):
        first = self.account.installation_id()
        self.assertEqual(len(first), 64)
        second = BrowserAccount()
        second.keyring = self.account.keyring
        self.assertEqual(second.installation_id(), first)
        self.account.save_token("a"*64)
        self.assertEqual(self.account.load_token(), "a"*64)
        self.account.forget_token()
        self.assertIsNone(self.account.load_token())

    def test_bad_token_rejected(self):
        with self.assertRaises(LicenseError):
            self.account.save_token("short")

    def test_pairing_contract_and_no_password_transmission(self):
        observed = []
        def request(req, timeout=0):
            observed.append(json.loads(req.data.decode()))
            return JsonResponse({"code":"ABCDEFGH","device_secret":"b"*64,
                                 "verification_uri":"https://example.com/connect?code=ABCDEFGH"})
        with patch("auth_client.urllib.request.urlopen", side_effect=request):
            result = self.account.begin()
        self.assertEqual(result["code"], "ABCDEFGH")
        self.assertIn("installation_id", observed[0])
        self.assertNotIn("password", observed[0])

    def test_html_not_accepted_as_authorization(self):
        class Html(JsonResponse):
            headers = {"Content-Type": "text/html"}
        with patch("auth_client.urllib.request.urlopen", return_value=Html({})):
            with self.assertRaises(LicenseError):
                self.account.begin()

if __name__ == "__main__":
    unittest.main()
