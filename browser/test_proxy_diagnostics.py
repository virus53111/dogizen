"""Offline, deterministic tests: no network calls or Stripe/account changes."""
import socket
import unittest

from proxy_diagnostics import diagnose_proxy, describe_diagnosis


class FakeSocket:
    def __init__(self, mark):
        self.mark = mark

    def close(self):
        self.mark.append("closed")


class ProxyDiagnosticsTests(unittest.TestCase):
    def test_success_report_and_timing(self):
        actions = []
        times = iter([10.0, 10.045, 15.0, 15.177])
        def connect(target, timeout):
            actions.append((target, timeout))
            return FakeSocket(actions)
        def probe(proxy, timeout):
            actions.append((proxy["server"], timeout))
            return {"exit_ip": "1.1.1.1"}

        result = diagnose_proxy(
            {"server": "socks5://proxy.example:1080", "username": "test", "password": "secret"},
            connect=connect, probe=probe, clock=lambda: next(times))
        self.assertEqual((result.status, result.tcp_ms, result.https_ms, result.exit_ip),
                         ("ok", 45, 177, "1.1.1.1"))
        self.assertIn((("proxy.example", 1080), 5.0), actions)
        self.assertEqual(actions[-1], ("socks5://proxy.example:1080", 12.0))
        self.assertIn("closed", actions)
        self.assertFalse(result.dns_checked)
        self.assertFalse(result.webrtc_checked)
        self.assertFalse(result.ipv6_leak_checked)
        self.assertIn("NOT been checked", describe_diagnosis(result, "en"))

    def test_tcp_timeout_skips_external_probe(self):
        def connect(*args, **kwargs):
            raise socket.timeout()
        def probe(*args, **kwargs):
            self.fail("HTTPS probe must not be called after TCP failure")
        result = diagnose_proxy({"server": "http://test.example:8118"},
                                connect=connect, probe=probe, clock=lambda: 0.0)
        self.assertEqual(result.status, "tcp_timeout")
        self.assertIsNone(result.exit_ip)
        self.assertIn("НЕ проверялись", describe_diagnosis(result))

    def test_dns_failure(self):
        def connect(*args, **kwargs):
            raise socket.gaierror(-2, "hostname not found")
        result = diagnose_proxy({"server": "https://bad.example:443"},
                                connect=connect, clock=lambda: 0.0)
        self.assertEqual(result.status, "dns_failure")

    def test_invalid_url_never_connects(self):
        def connect(*args, **kwargs):
            self.fail("Connection must not be attempted")
        for proxy in ({"server": "ftp://example.org:21"},
                      {"server": "http://example.org"},
                      {"server": "http://example.org:99999"},
                      {}):
            result = diagnose_proxy(proxy, connect=connect, clock=lambda: 0.0)
            self.assertEqual(result.status, "invalid_proxy")

    def test_authentication_errors_do_not_expose_passwords(self):
        def probe(proxy, timeout):
            raise RuntimeError("HTTPS error socks5://sensitive-user:sensitive-password@host")
        actions = []
        result = diagnose_proxy({"server": "http://host:8080",
                                 "username": "sensitive-user",
                                 "password": "sensitive-password"},
                                connect=lambda *a, **kw: FakeSocket(actions),
                                probe=probe, clock=lambda: 0.0)
        self.assertEqual(result.status, "exit_failure")
        for language in ("ru", "en"):
            message = describe_diagnosis(result, language)
            self.assertNotIn("sensitive-password", message)
            self.assertNotIn("sensitive-user", message)
            self.assertNotIn("host:8080", message)
        self.assertIn("closed", actions)

    def test_connection_refused(self):
        def connect(*args, **kwargs):
            raise ConnectionRefusedError()
        result = diagnose_proxy({"server": "http://localhost:81"}, connect=connect,
                                clock=lambda: 0.0)
        self.assertEqual(result.status, "tcp_refused")


if __name__ == "__main__":
    unittest.main()
