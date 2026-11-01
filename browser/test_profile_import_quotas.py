"""Profile metadata import is transactional, bounded and independent of secrets."""
from __future__ import annotations
import json
from pathlib import Path
import tempfile
import unittest

from store import Store


class MetadataImportQuotas(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = Store(self.root / "browser")
        self.original = self.store.add_profile("Existing")
        self.source = self.root / "import.json"

    def export(self, profiles, **extra):
        data = {"format": "murdilimax-browser-v1",
                "profiles": profiles, "proxies": [{"password": "must-not-import"}], **extra}
        self.source.write_text(json.dumps(data), encoding="utf-8")
        return self.source

    def profile(self, name="Imported", **changes):
        return {"name": name, "url": "https://example.org",
                "group": "Team", "tags": "Tag", "notes": "Note",
                "os": "native", "proxy_id": "untrusted", **changes}

    def test_quota_overflow_is_all_or_nothing(self):
        source = self.export([self.profile("A"), self.profile("B"), self.profile("C")])
        with self.assertRaisesRegex(ValueError, "allowance exceeded"):
            self.store.import_metadata(source, max_profiles=3)
        self.assertEqual([x["id"] for x in self.store.profiles()],
                         [self.original["id"]])
        self.assertEqual(len(list((self.store.root / "profiles").iterdir())), 1)

    def test_import_uses_entitlement_allowance_and_new_ids(self):
        source = self.export([self.profile("A"), self.profile("B")])
        self.assertEqual(self.store.import_metadata(source, max_profiles=3), 2)
        profiles = self.store.profiles()
        self.assertEqual(len(profiles), 3)
        self.assertEqual(len({p["id"] for p in profiles}), 3)
        self.assertTrue(all(not p.get("proxy_id") for p in profiles[1:]))
        self.assertTrue(all((self.store.root / "profiles" / p["id"]).is_dir()
                            for p in profiles))
        with self.assertRaisesRegex(ValueError, "allowance exceeded"):
            self.store.import_metadata(source, max_profiles=3)
        self.assertEqual(len(self.store.profiles()), 3)

    def test_bad_item_does_not_partially_import(self):
        source = self.export([self.profile("Good"), self.profile("Bad", url="file:///etc/passwd")])
        with self.assertRaisesRegex(ValueError, "Invalid name"):
            self.store.import_metadata(source, max_profiles=20)
        self.assertEqual(len(self.store.profiles()), 1)
        self.assertEqual(len(list((self.store.root / "profiles").iterdir())), 1)

    def test_malformed_payload_and_too_many_profiles_rejected(self):
        for rows in ([self.profile(), "bad-record"], "not-a-list",
                     [self.profile() for _ in range(2001)]):
            with self.subTest(kind=type(rows).__name__):
                source = self.export(rows)
                with self.assertRaises(ValueError):
                    self.store.import_metadata(source, max_profiles=2000)
                self.assertEqual(len(self.store.profiles()), 1)

    def test_empty_export_is_no_op(self):
        self.assertEqual(self.store.import_metadata(self.export([]), max_profiles=3), 0)
        self.assertEqual(len(self.store.profiles()), 1)

    def test_file_and_allowance_validation(self):
        source = self.export([self.profile()])
        for bad in (0, -1, 2001, True, "3", None):
            with self.subTest(limit=bad):
                with self.assertRaises(ValueError):
                    self.store.import_metadata(source, max_profiles=bad)
        self.assertEqual(len(self.store.profiles()), 1)

    def test_missing_and_oversized_files(self):
        with self.assertRaises(ValueError):
            self.store.import_metadata(self.root / "missing.json")
        self.source.write_text(" " * (8_000_000 + 1), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "8 MB"):
            self.store.import_metadata(self.source)
        self.assertEqual(len(self.store.profiles()), 1)

    def test_no_secrets_or_browser_state_in_metadata(self):
        source = self.export([self.profile(cookie="ignore",
                                            fingerprint="untrusted",
                                            token="do-not-import")])
        self.store.import_metadata(source, max_profiles=3)
        added = self.store.profiles()[-1]
        for field in ("cookie", "fingerprint", "token", "password"):
            self.assertNotIn(field, added)
        self.assertNotIn("must-not-import",
                         (self.store.root / "profiles.json").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
