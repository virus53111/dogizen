"""Offline tests: no network, browser engine or OS account required."""
import json
import tempfile
import unittest
from pathlib import Path
from store import Store, valid_proxy, valid_url

class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = Store(self.temp.name)

    def test_profile_lifecycle(self):
        p = self.store.add_profile("Shop EU", "https://example.com", tags="qa,local")
        self.assertTrue((Path(self.temp.name) / "profiles" / p["id"]).exists())
        self.assertEqual(self.store.get_profile(p["id"])["name"], "Shop EU")
        self.store.update_profile(p["id"], name="Shop EU 2", group="Marketing")
        self.assertEqual(self.store.get_profile(p["id"])["group"], "Marketing")
        q = self.store.duplicate_profile(p["id"])
        self.assertNotEqual(p["id"], q["id"])
        self.assertEqual(q["tags"], "qa,local")
        self.store.delete_profile(p["id"])
        self.assertIsNone(self.store.get_profile(p["id"]))
        self.assertTrue(list((Path(self.temp.name) / "trash").glob(p["id"] + "-*")))

    def test_export_excludes_credentials_and_cookies(self):
        p = self.store.add_proxy("Local", "http://127.0.0.1:8888")
        self.store.add_profile("Site", "https://example.com", proxy_id=p["id"])
        destination = Path(self.temp.name) / "export.json"
        self.store.export_metadata(destination)
        data = json.loads(destination.read_text())
        self.assertEqual(data["format"], "murdilimax-browser-v1")
        self.assertNotIn("password", destination.read_text())
        dest = Store(Path(self.temp.name) / "imported")
        self.assertEqual(dest.import_metadata(destination), 1)
        self.assertEqual(dest.profiles()[0]["proxy_id"], "")

    def test_rejects_invalid_inputs(self):
        for url in ["file:///tmp/secrets", "javascript:alert(1)", "ftp://example.com"]:
            self.assertFalse(valid_url(url))
        for server in ["http://user:password@localhost:80", "file:///foo", "socks5://example.com", "http://example.com:70000"]:
            self.assertFalse(valid_proxy(server))
        with self.assertRaises(ValueError):
            self.store.add_profile("test", "file:///tmp/data")
        with self.assertRaises(ValueError):
            self.store.add_proxy("unsafe", "http://user:secret@example.com:8080")

    def test_proxy_edit_persists(self):
        p = self.store.add_proxy("Old", "http://localhost:9090")
        self.store.update_proxy(p["id"], "New", "socks5://localhost:1080")
        saved = self.store.proxies()[0]
        self.assertEqual(saved["name"], "New")
        self.assertEqual(saved["server"], "socks5://localhost:1080")

    def test_proxy_cannot_be_deleted_while_in_use(self):
        p = self.store.add_proxy("Dev", "socks5://127.0.0.1:1080")
        self.store.add_profile("Test", proxy_id=p["id"])
        with self.assertRaises(ValueError):
            self.store.delete_proxy(p["id"])

if __name__ == "__main__":
    unittest.main()
