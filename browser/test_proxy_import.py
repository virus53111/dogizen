"""Offline bulk proxy validation; does not contact the network or OS keyring."""
import unittest
from proxy_import import parse_proxy_list, import_proxy_list


class FakeStore:
    def __init__(self, existing=None):
        self.items = [{"name": "Existing", "id": "old", "server": p} for p in (existing or [])]
    def proxies(self):
        return list(self.items)
    def add_proxy(self, name, server):
        self.items.append({"name": name, "server": server})


class BulkProxyImportTests(unittest.TestCase):
    def test_parses_three_supported_protocols(self):
        text = "# My proxies\nhttp://proxy.example:8000\nhttps://edge.example:443\nsocks5://127.0.0.1:1080\n"
        entries = parse_proxy_list(text)
        self.assertEqual([e.server for e in entries], [
            "http://proxy.example:8000", "https://edge.example:443",
            "socks5://127.0.0.1:1080"])

    def test_normalizes_and_deduplicates(self):
        entries = parse_proxy_list("HTTP://EXAMPLE.COM:80/\nhttp://example.com:80\nsocks5://[::1]:1080")
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0].server, "http://example.com:80")
        self.assertEqual(entries[1].server, "socks5://[::1]:1080")

    def test_import_skips_existing(self):
        store = FakeStore(["http://example.com:80"])
        added, skipped = import_proxy_list(store, "http://EXAMPLE.com:80\nsocks5://other.test:1080")
        self.assertEqual((added, skipped), (1, 1))
        self.assertEqual(len(store.items), 2)

    def test_rejects_credentials_without_revealing_secrets(self):
        for line in ("http://alice:mysecret@host:8080", "socks5://alice:topsecret@host:1080"):
            with self.assertRaises(ValueError) as ctx:
                parse_proxy_list(line)
            self.assertNotIn("secret", str(ctx.exception))
            self.assertNotIn("alice", str(ctx.exception))
            self.assertIn("Line 1", str(ctx.exception))

    def test_invalid_input_does_not_import_partial_entries(self):
        store = FakeStore()
        with self.assertRaises(ValueError):
            import_proxy_list(store, "http://good.test:80\ninvalid-line")
        self.assertEqual(store.proxies(), [])

    def test_rejects_query_fragment_paths_and_bad_ports(self):
        for url in ("http://host:9/?token=secret", "http://host:80/path",
                    "socks5://host:99999", "ftp://host:20",
                    "http://host:80#fragment", "http://host", "http://host:0"):
            with self.assertRaises(ValueError):
                parse_proxy_list(url)

    def test_rejects_oversized_files(self):
        with self.assertRaises(ValueError):
            parse_proxy_list("http://host:80\n" * 501)
        with self.assertRaises(ValueError):
            parse_proxy_list("x" * 1_000_001)


if __name__ == "__main__":
    unittest.main()
