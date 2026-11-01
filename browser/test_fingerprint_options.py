"""Safe fingerprint constraints and frozen identity compatibility tests."""
from __future__ import annotations

import json
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

from fingerprint_options import BOUNDS, fingerprint_generation_options, safe_identity_preview, validate_screen_limit
from identity import FILENAME, get_identity
from store import Store


def fake_identity(**kwargs):
    return {
        "navigator": {"userAgent": "Mozilla/5.0 (Windows NT 10.0; rv:135.0) Gecko/20100101 Firefox/135.0",
                      "hardwareConcurrency": 8},
        "screen": {"width": 1600, "height": 900},
        "headers": {"user-agent": "Firefox/135"},
    }


class FingerprintBoundsTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.store = Store(self.root / "data")

    def test_choices_strict_and_default_legacy_behavior(self):
        self.assertEqual(validate_screen_limit("auto"), "auto")
        self.assertEqual(fingerprint_generation_options("auto"), {})
        for invalid in (None, 1, True, "320x240", "3840x2160", "",
                        "1920x1080\n", ["1920x1080"]):
            with self.subTest(choice=invalid), self.assertRaises(ValueError):
                validate_screen_limit(invalid)
        self.assertEqual(len(BOUNDS), 4)

    def test_generation_uses_screen_constraints_without_patching_fields(self):
        seen = []
        class FakeScreen:
            def __init__(self, *, max_width, max_height):
                self.max_width = max_width
                self.max_height = max_height
        root = types.ModuleType("camoufox")
        fingerprint_module = types.ModuleType("camoufox.fingerprints")
        fingerprint_module.Screen = FakeScreen
        with patch.dict(sys.modules, {"camoufox": root, "camoufox.fingerprints": fingerprint_module}):
            def generator(**kwargs):
                seen.append(kwargs)
                return fake_identity(**kwargs)
            profile_dir = self.root / "profile"
            fp = get_identity(profile_dir, "windows", generator,
                              screen_limit="1920x1080")
        self.assertEqual(fp["navigator"]["hardwareConcurrency"], 8)
        self.assertEqual(len(seen), 1)
        self.assertEqual(seen[0]["os"], "windows")
        self.assertEqual(seen[0]["screen"].max_width, 1920)
        self.assertEqual(seen[0]["screen"].max_height, 1080)
        self.assertEqual(json.loads((profile_dir / FILENAME).read_text(encoding="utf-8"))["screen_limit"],
                         "1920x1080")

    def test_saved_identity_immutable_and_preview_has_only_safe_fields(self):
        directory = self.root / "profile"
        first = get_identity(directory, "windows", fake_identity)
        self.assertEqual(first, get_identity(directory, "windows",
                                             generator=lambda **_: self.fail("rotated")))
        with self.assertRaisesRegex(ValueError, "fixed"):
            get_identity(directory, "windows", fake_identity, screen_limit="1600x900")
        preview = safe_identity_preview(directory)
        self.assertTrue(preview["generated"])
        self.assertEqual(preview["os"], "windows")
        self.assertEqual(preview["screen"], "1600 × 900")
        self.assertEqual(preview["screen_limit"], "auto")
        self.assertEqual(set(preview), {"generated", "os", "screen", "screen_limit",
                                        "user_agent", "cpu"})
        self.assertEqual(safe_identity_preview(self.root / "unknown"), {"generated": False})

    def test_profile_edit_duplication_export_and_atomic_import(self):
        p = self.store.add_profile("Initial", screen_limit="1600x900")
        self.assertEqual(self.store.get_profile(p["id"])["screen_limit"], "1600x900")
        self.store.update_profile(p["id"], screen_limit="1920x1080")
        self.assertEqual(self.store.get_profile(p["id"])["screen_limit"], "1920x1080")
        folder = self.store.root / "profiles" / p["id"]
        # Save generated identity using the bound already chosen.
        class Screen:
            def __init__(self, max_width, max_height): pass
        root = types.ModuleType("camoufox")
        mod = types.ModuleType("camoufox.fingerprints")
        mod.Screen = Screen
        with patch.dict(sys.modules, {"camoufox": root, "camoufox.fingerprints": mod}):
            get_identity(folder, "windows", fake_identity, screen_limit="1920x1080")
        original = self.store.profiles()
        with self.assertRaisesRegex(ValueError, "fixed"):
            self.store.update_profile(p["id"], screen_limit="2560x1440")
        self.assertEqual(self.store.profiles(), original)
        duplicated = self.store.duplicate_profile(p["id"])
        self.assertEqual(duplicated["screen_limit"], "1920x1080")
        self.assertFalse((self.store.root / "profiles" / duplicated["id"] / FILENAME).exists())
        export = self.root / "export.json"
        self.store.export_metadata(export)
        imported = Store(self.root / "imported")
        self.assertEqual(imported.import_metadata(export, max_profiles=3), 2)
        self.assertEqual([x["screen_limit"] for x in imported.profiles()],
                         ["1920x1080", "1920x1080"])
        invalid = json.loads(export.read_text(encoding="utf-8"))
        invalid["profiles"][1]["screen_limit"] = "unsafe"
        bad_file = self.root / "bad.json"
        bad_file.write_text(json.dumps(invalid), encoding="utf-8")
        before = imported.profiles()
        with self.assertRaises(ValueError):
            imported.import_metadata(bad_file, max_profiles=10)
        self.assertEqual(imported.profiles(), before)

    def test_legacy_identity_without_screen_limit_still_loads(self):
        folder = self.root / "legacy"
        folder.mkdir()
        (folder / FILENAME).write_text(json.dumps({
            "version": 1, "os": "linux", "fingerprint": fake_identity()}), encoding="utf-8")
        self.assertEqual(get_identity(folder, "linux"), fake_identity())
        self.assertEqual(safe_identity_preview(folder)["screen_limit"], "auto")
        with self.assertRaises(ValueError):
            get_identity(folder, "linux", screen_limit="2560x1440")


if __name__ == "__main__":
    unittest.main()
