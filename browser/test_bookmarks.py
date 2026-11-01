"""Offline tests: bookmark safety, group isolation, atomic writes and page XSS."""
from __future__ import annotations

from html import unescape
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bookmarks import (add_bookmark, bookmark_dashboard, bookmarks_for_profile,
                       list_bookmarks, remove_bookmark, update_bookmark,
                       validate_bookmark)
from startup_tabs import navigate_startup_tabs
from store import Store


class BookmarksTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.store = Store(Path(temp.name) / "local")

    def test_global_group_and_unicode_persistence(self):
        all_profiles = add_bookmark(self.store, "Новости", "https://example.org/")
        group_only = add_bookmark(self.store, "Marketing", "http://127.0.0.1:9999/", "Ads")
        self.assertEqual(len(list_bookmarks(self.store)), 2)
        self.assertEqual([p["id"] for p in bookmarks_for_profile(self.store, {"group": "Ads"})],
                         [all_profiles["id"], group_only["id"]])
        self.assertEqual([p["id"] for p in bookmarks_for_profile(self.store, {"group": "Other"})],
                         [all_profiles["id"]])
        edited = update_bookmark(self.store, group_only["id"], "Changed",
                                 "https://example.net/", "Research")
        self.assertEqual(edited["group"], "Research")
        self.assertEqual(len(bookmarks_for_profile(self.store, {"group": "Ads"})), 1)
        remove_bookmark(self.store, all_profiles["id"])
        self.assertEqual(len(list_bookmarks(self.store)), 1)

    def test_rejects_unsafe_urls_and_credentials_without_writes(self):
        before = list_bookmarks(self.store)
        cases = ["javascript:alert(1)", "file:///C:/Windows/System32",
                 "data:text/html,hey", "https://u:password@example.com",
                 "https://example.org/space here",
                 "http://example.com/?a=1\nSet-Cookie: a",
                 "https://[invalid", "http://example.org:0",
                 "ftp://example.org/", "https://example.org/" + "x" * 2048]
        for bad in cases:
            with self.subTest(url=bad), self.assertRaises(ValueError):
                add_bookmark(self.store, "Safe", bad)
            self.assertEqual(list_bookmarks(self.store), before)
        for name in ("", "  ", "X" * 101, 1, None):
            with self.subTest(name=name), self.assertRaises(ValueError):
                add_bookmark(self.store, name, "https://example.org")
        for group in (42, "X" * 81, None):
            with self.subTest(group=group), self.assertRaises(ValueError):
                add_bookmark(self.store, "Name", "https://example.org", group)

    def test_storage_write_fails_without_partial_edit(self):
        p = add_bookmark(self.store, "Original", "https://example.com")
        initial = list_bookmarks(self.store)
        with patch.object(self.store, "_write", side_effect=OSError("No disk")):
            with self.assertRaises(OSError):
                update_bookmark(self.store, p["id"], "Changed", "https://example.org")
            with self.assertRaises(OSError):
                remove_bookmark(self.store, p["id"])
            with self.assertRaises(OSError):
                add_bookmark(self.store, "Test", "https://example.net")
        self.assertEqual(list_bookmarks(self.store), initial)

    def test_html_escapes_all_user_supplied_content_and_blocks_scripts(self):
        # query may be sensitive; do not write it to the app logs
        malicious = add_bookmark(self.store, '<script>alert("test")</script>',
                                 'https://example.org/?search=%3Cscript%3E&x=1')
        text = bookmark_dashboard([malicious])
        self.assertIn("&lt;script&gt;", text)
        self.assertNotIn('<script>', text)
        self.assertIn('default-src &#39;none&#39;', text)
        self.assertIn('href="https://example.org/?search=%3Cscript%3E&amp;x=1"', text)
        self.assertNotIn('<script>alert("test")</script>', text)

    def test_bookmarks_dont_export_with_profile_metadata(self):
        add_bookmark(self.store, "Secret custom name", "https://example.net/?private=abcd")
        self.store.add_profile("Work", "about:blank")
        export = self.store.root / "export.json"
        self.store.export_metadata(export)
        serialized = export.read_text(encoding="utf-8")
        self.assertNotIn("Secret custom name", serialized)
        self.assertNotIn("private=abcd", serialized)

    def test_legacy_blank_start_without_bookmark_uses_blank(self):
        class Page:
            def __init__(self):
                self.url = None
                self.html = None
            def goto(self, url, **_):
                self.url = url
            def set_content(self, html, **_):
                self.html = html
        class Context:
            def __init__(self):
                self.pages = []
            def new_page(self):
                p = Page()
                self.pages.append(p)
                return p
        context = Context()
        profile = {"url": "about:blank", "startup_urls": []}
        self.assertEqual(navigate_startup_tabs(context, profile),
                         {"opened": 1, "failed": 0, "requested": 1})
        self.assertIsNone(context.pages[0].html)
        links = [add_bookmark(self.store, "Docs", "https://example.org")]
        context = Context()
        self.assertEqual(navigate_startup_tabs(context, profile, bookmarks=links),
                         {"opened": 1, "failed": 0, "requested": 1})
        self.assertIn("Murdilimax", context.pages[0].html)
        self.assertIn("https://example.org", context.pages[0].html)


if __name__ == "__main__":
    unittest.main()
