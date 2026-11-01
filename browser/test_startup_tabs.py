"""Regression tests: multiple startup tabs remain safe, bounded and persistent."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest

from startup_tabs import normalize_extra_urls, navigate_startup_tabs
from store import Store


class StartupTabsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = Store(self.root / "app")

    def test_add_update_copy_export_and_atomic_import(self):
        primary = "https://example.org/"
        extra = ["https://example.com/a", "http://127.0.0.1:8080/start"]
        first = self.store.add_profile("One", primary, startup_urls=extra)
        self.assertEqual(self.store.get_profile(first["id"])["startup_urls"], extra)
        self.store.update_profile(first["id"], startup_urls=[extra[1]])
        self.assertEqual(self.store.get_profile(first["id"])["startup_urls"], [extra[1]])
        clone = self.store.duplicate_profile(first["id"])
        self.assertNotEqual(first["id"], clone["id"])
        self.assertEqual(clone["startup_urls"], [extra[1]])
        destination = self.root / "backup.json"
        self.store.export_metadata(destination)
        imported_store = Store(self.root / "fresh")
        self.assertEqual(imported_store.import_metadata(destination, max_profiles=3), 2)
        self.assertEqual(imported_store.profiles()[0]["startup_urls"], [extra[1]])
        self.assertEqual(imported_store.profiles()[1]["startup_urls"], [extra[1]])

    def test_invalid_batch_never_changes_metadata(self):
        good = self.store.add_profile("Original", "https://example.net")
        for invalid in (["file:///secrets"], ["javascript:alert(1)"],
                        ["https://user:pass@example.org/"],
                        ["https://example.com/has space"],
                        ["https://example.org/"] * 8,
                        "https://example.org", [123], [None]):
            with self.subTest(invalid=invalid):
                with self.assertRaises(ValueError):
                    self.store.update_profile(good["id"], startup_urls=invalid)
                self.assertEqual(self.store.get_profile(good["id"])["startup_urls"], [])
        original_ids = [x["id"] for x in self.store.profiles()]
        for invalid in (["https://ok.example/", "file:///bad"], ["https://example.org/"] * 8):
            payload = {"format": "murdilimax-browser-v1", "profiles": [
                {"name": "Valid", "url": "https://example.com"},
                {"name": "Invalid", "url": "https://example.net", "startup_urls": invalid}]}
            file = self.root / "bad-import.json"
            file.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaises(ValueError):
                self.store.import_metadata(file, max_profiles=10)
            self.assertEqual([x["id"] for x in self.store.profiles()], original_ids)

    def test_legacy_profiles_and_primary_de_duplication(self):
        self.assertEqual(normalize_extra_urls([], primary="about:blank"), [])
        primary = "https://example.org"
        extras = normalize_extra_urls([primary, "https://example.net",
                                       "https://example.net"], primary=primary)
        self.assertEqual(extras, ["https://example.net"])
        legacy = self.store.add_profile("Legacy")
        stored = self.store.profiles()
        stored[0].pop("startup_urls")
        self.store._write("profiles", stored)
        self.store.update_profile(legacy["id"], notes="Still compatible")
        self.assertEqual(self.store.get_profile(legacy["id"])["startup_urls"], [])

    def test_rejects_credential_and_malformed_url(self):
        cases = ["https://user@example.com", "https://:secret@site.example/",
                 "ftp://example.org", "http://", "http://[broken",
                 "https://test.example:0", "http://test.example/?key=hello\rbye"]
        for item in cases:
            with self.subTest(url=item), self.assertRaises(ValueError):
                normalize_extra_urls([item])

    def test_navigation_uses_separate_pages_and_isolates_failures(self):
        class Page:
            def __init__(self):
                self.url = None
                self.closed = False
            def goto(self, url, **options):
                self.url = url
                if "bad.example" in url:
                    raise RuntimeError("synthetic navigation error with possible credentials")
                self.options = options
            def close(self):
                self.closed = True
        class Context:
            def __init__(self):
                self.pages = []
            def new_page(self):
                page = Page()
                self.pages.append(page)
                return page
        context = Context()
        result = navigate_startup_tabs(context, {
            "url": "https://home.example",
            "startup_urls": ["https://bad.example", "https://later.example"]})
        self.assertEqual(result, {"opened": 2, "failed": 1, "requested": 3})
        self.assertEqual([x.url for x in context.pages],
                         ["https://home.example", "https://bad.example",
                          "https://later.example"])
        self.assertTrue(context.pages[1].closed)
        self.assertFalse(context.pages[2].closed)

    def test_navigation_rejects_modified_file_data_before_new_tab(self):
        class Context:
            pages = []
            def new_page(self):
                raise AssertionError("Must not open a browser page for corrupt metadata")
        with self.assertRaises(ValueError):
            navigate_startup_tabs(Context(), {
                "url": "https://example.com",
                "startup_urls": ["https://example.org", "file:///etc/passwd"]})


if __name__ == "__main__":
    unittest.main()
