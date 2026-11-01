"""Offline route/credential diagnostic tests; no live external IP lookup."""
import unittest
from network_check import proxy_probe_url, probe_proxy_exit

class FakeResponse:
    def __init__(self, address="1.1.1.1"):
        self.address=address
    def raise_for_status(self):
        return None
    def json(self):
        return {"ip": self.address}

class FakeSession:
    def __init__(self, address="1.1.1.1"):
        self.address=address
        self.trust_env = True
        self.kwargs=None
    def get(self, url, **kwargs):
        self.kwargs = {"url":url, **kwargs}
        return FakeResponse(self.address)

class NetworkTests(unittest.TestCase):
    def test_socks5_remote_dns_and_percent_encoded_credentials(self):
        url = proxy_probe_url({"server":"socks5://proxy.example.org:1080",
                               "username":"a@b","password":"p:#"})
        self.assertEqual(url,"socks5h://a%40b:p%3A%23@proxy.example.org:1080")

    def test_https_routes_are_explicit_and_ignore_system_proxy(self):
        fake=FakeSession()
        result = probe_proxy_exit({"server":"http://proxy.example.com:3128"},session=fake)
        self.assertEqual(result["exit_ip"],"1.1.1.1")
        self.assertFalse(fake.trust_env)
        self.assertEqual(fake.kwargs["proxies"]["https"],"http://proxy.example.com:3128")
        self.assertEqual(fake.kwargs["timeout"],12)

    def test_reject_private_exit_ip(self):
        with self.assertRaises(ValueError):
            probe_proxy_exit({"server":"http://proxy.example.com:8080"},
                             session=FakeSession("127.0.0.1"))

    def test_missing_password_fails_before_network_request(self):
        with self.assertRaises(ValueError):
            proxy_probe_url({"server":"socks5://server.example:1080","username":"test"})

    def test_url_parser_refuses_unsupported_protocols(self):
        with self.assertRaises(ValueError):
            proxy_probe_url({"server":"file:///etc/passwd"})

if __name__ == "__main__":
    unittest.main()
