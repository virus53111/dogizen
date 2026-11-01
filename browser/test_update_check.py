"""Read-only update-check tests; no live HTTP requests."""
from __future__ import annotations

import json
import unittest
from io import BytesIO

from update_check import check_windows_updates, select_windows_update, TAG_PATTERN


def item(version, *, url=None, draft=False, prerelease=True, size=5_000_000):
    tag = f"v{version}-browser-windows-beta-20261101"
    name = f"Murdilimax-Browser-Windows-v{version}-Beta-Setup.exe"
    canonical = f"https://github.com/virus53111/dogizen/releases/download/{tag}/{name}"
    return {"tag_name": tag, "draft": draft, "prerelease": prerelease,
            "assets": [{"name": name, "browser_download_url": url or canonical,
                        "size": size}]}


class UpdateTests(unittest.TestCase):
    def test_latest_version_must_have_exact_trusted_asset(self):
        releases = [item("0.7.0"), item("0.6.2"), item("0.5.0")]
        found = select_windows_update(releases, (0, 6, 0))
        self.assertEqual(found["version"], (0, 7, 0))
        self.assertEqual(found["url"],
                         "https://github.com/virus53111/dogizen/releases/tag/"
                         "v0.7.0-browser-windows-beta-20261101")
        self.assertIsNone(select_windows_update(releases, (0, 7, 0)))
        self.assertIsNone(select_windows_update([item("0.5.0")]))

    def test_rejects_untrusted_or_incomplete_releases(self):
        bad = [item("9.0.0", url="https://evil.example/setup.exe"),
               item("8.0.0", size=12),
               item("7.0.0", draft=True),
               item("6.0.0", prerelease=False),
               {"tag_name": "v999.0.0-browser-windows-beta-20261101",
                "draft": False, "prerelease": True,
                "assets": [{"name": "bad.exe", "size": 5000000,
                            "browser_download_url": "https://evil.example"}]}]
        self.assertIsNone(select_windows_update(bad))
        self.assertIsNone(select_windows_update([{"tag_name": "other",
                                                  "assets": [], "draft": False,
                                                  "prerelease": True}]))

    def test_no_installation_no_unbounded_download(self):
        class FakeResponse:
            def __init__(self, payload):
                self.file = BytesIO(payload)
            def read(self, count):
                return self.file.read(count)
            def __enter__(self):
                return self
            def __exit__(self, *_):
                pass
        requested = []
        def opener(req, *, timeout):
            requested.append((req.full_url, timeout))
            return FakeResponse(json.dumps([item("0.6.1")]).encode("utf-8"))
        latest = check_windows_updates(installed=(0, 6, 0), opener=opener)
        self.assertEqual(latest["version"], (0, 6, 1))
        self.assertEqual(requested,
                         [("https://api.github.com/repos/virus53111/dogizen/releases?per_page=15", 10)])
        def oversized(*_, **__):
            return FakeResponse(b"X" * 150_001)
        with self.assertRaisesRegex(ValueError, "safety limit"):
            check_windows_updates(opener=oversized)

    def test_invalid_installed_version(self):
        for bad in (True, None, "0.6.0", [0, True, 0], (-1, 1, 0)):
            with self.subTest(value=bad), self.assertRaises(ValueError):
                select_windows_update([], bad)


if __name__ == "__main__":
    unittest.main()
