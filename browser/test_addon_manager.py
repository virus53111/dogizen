"""Offline Firefox addon manager tests: synthetic XPI archives, no network."""
from __future__ import annotations
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
import zipfile

from addon_manager import (
    enabled_addon_paths, inspect_archive, install_addon, list_addons,
    remove_addon, set_addon_enabled,
)
from store import Store


def make_xpi(path, *, entries=None, manifest=None):
    data = manifest if manifest is not None else {
        "manifest_version": 2, "name": "Sample Addon",
        "version": "1.2.3",
        "permissions": ["storage", "https://example.org/*"]
    }
    files = entries if entries is not None else {
        "manifest.json": json.dumps(data),
        "background.js": "console.log('offline example');",
        "icons/icon.png": "example",
    }
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as out:
        for name, content in files.items():
            out.writestr(name, content)
    return path


class AddonManagerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = Store(self.root / "storage")
        self.first = self.store.add_profile("First")["id"]
        self.second = self.store.add_profile("Second")["id"]
        self.source = make_xpi(self.root / "sample.xpi")

    def test_inspect_and_install_only_selected_profile(self):
        info = inspect_archive(self.source)
        self.assertEqual(info["name"], "Sample Addon")
        self.assertIn("storage", info["permissions"])
        installed = install_addon(self.store, self.first, self.source)
        self.assertEqual(installed["version"], "1.2.3")
        self.assertEqual(len(list_addons(self.store, self.first)), 1)
        self.assertEqual(list_addons(self.store, self.second), [])
        self.assertEqual(len(enabled_addon_paths(self.store, self.first)), 1)
        self.assertEqual(enabled_addon_paths(self.store, self.second), [])
        extracted = Path(enabled_addon_paths(self.store, self.first)[0])
        self.assertTrue((extracted / "manifest.json").exists())
        self.assertTrue((extracted / "icons" / "icon.png").exists())
        if os.name != "nt":
            self.assertEqual((extracted / "manifest.json").stat().st_mode & 0o777, 0o600)

    def test_toggle_persists_and_removal_isolation(self):
        one = install_addon(self.store, self.first, self.source)
        two = install_addon(self.store, self.second, self.source)
        set_addon_enabled(self.store, self.first, one["id"], False)
        self.assertEqual(enabled_addon_paths(self.store, self.first), [])
        self.assertEqual(len(enabled_addon_paths(self.store, self.second)), 1)
        set_addon_enabled(self.store, self.first, one["id"], True)
        self.assertEqual(len(enabled_addon_paths(self.store, self.first)), 1)
        remove_addon(self.store, self.first, one["id"])
        self.assertEqual(list_addons(self.store, self.first), [])
        self.assertEqual(len(list_addons(self.store, self.second)), 1)
        self.assertEqual(len(enabled_addon_paths(self.store, self.second)), 1)
        self.assertEqual(two["name"], "Sample Addon")

    def test_running_lock_rejects_changes_without_mutation(self):
        marker = self.store.root / "profiles" / self.first / ".lock"
        marker.write_text("123")
        with self.assertRaisesRegex(ValueError, "Stop"):
            install_addon(self.store, self.first, self.source)
        marker.unlink()
        addon = install_addon(self.store, self.first, self.source)
        marker.write_text("123")
        with self.assertRaises(ValueError):
            set_addon_enabled(self.store, self.first, addon["id"], False)
        with self.assertRaises(ValueError):
            remove_addon(self.store, self.first, addon["id"])
        self.assertEqual(len(enabled_addon_paths(self.store, self.first)), 1)

    def test_maintenance_blocks_mutation(self):
        marker = self.store.root / "profiles" / self.first / ".addon-maintenance"
        marker.touch()
        with self.assertRaisesRegex(ValueError, "already running"):
            install_addon(self.store, self.first, self.source)
        marker.unlink()
        marker = self.store.root / "profiles" / self.first / ".cookie-maintenance"
        marker.touch()
        with self.assertRaisesRegex(ValueError, "Stop"):
            install_addon(self.store, self.first, self.source)

    def test_reject_archive_traversal_and_absolute_names(self):
        # Python zipfile normalizes backslashes when WRITING on Windows.
        # Raw backslash names remain rejected by _open_archive when reading.
        names = ["../escape.js", "/absolute.js", "C:/drive.js",
                 "nested/../../path.js", "CON"]
        if os.name != "nt":
            names.append("bad\\windows.js")
        for n in names:
            malicious = make_xpi(self.root / "bad.xpi",
                                 entries={"manifest.json": json.dumps({
                                     "manifest_version": 2, "name": "Mal",
                                     "version": "1.0"}), n: "attack"})
            with self.subTest(name=n), self.assertRaisesRegex(ValueError, "Unsafe"):
                install_addon(self.store, self.first, malicious)
            self.assertEqual(list_addons(self.store, self.first), [])
            self.assertFalse((self.root / "escape.js").exists())

    def test_reject_symlink_inside_archive(self):
        path = self.root / "symlink.xpi"
        with zipfile.ZipFile(path, "w") as z:
            z.writestr("manifest.json", json.dumps({
                "manifest_version": 2, "name": "Test", "version": "1.0"}))
            link = zipfile.ZipInfo("link.js")
            link.create_system = 3
            link.external_attr = (stat.S_IFLNK | 0o777) << 16
            z.writestr(link, "../outside")
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            install_addon(self.store, self.first, path)

    def test_reject_bad_manifest_and_no_metadata_write(self):
        for manifest in ({}, {"manifest_version": 8, "name": "X", "version": "1"},
                         {"manifest_version": 2, "name": "", "version": "1"},
                         {"manifest_version": 2, "name": "X", "version": "1",
                          "permissions": [123]}):
            archive = make_xpi(self.root / "bad-manifest.xpi", manifest=manifest)
            with self.assertRaises(ValueError):
                install_addon(self.store, self.first, archive)
        self.assertEqual(list_addons(self.store, self.first), [])

    def test_reject_invalid_ids_and_missing_extension(self):
        addon = install_addon(self.store, self.first, self.source)
        for invalid in ("../../etc", "wrong", "", addon["id"] + "x"):
            with self.assertRaises(ValueError):
                set_addon_enabled(self.store, self.first, invalid, True)
            with self.assertRaises(ValueError):
                remove_addon(self.store, self.first, invalid)
        with self.assertRaises(ValueError):
            set_addon_enabled(self.store, self.first, addon["id"], "yes")

    def test_enabled_paths_detect_missing_extracted_manifest(self):
        addon = install_addon(self.store, self.first, self.source)
        target = Path(enabled_addon_paths(self.store, self.first)[0])
        (target / "manifest.json").unlink()
        with self.assertRaisesRegex(ValueError, "missing"):
            enabled_addon_paths(self.store, self.first)
        set_addon_enabled(self.store, self.first, addon["id"], False)
        self.assertEqual(enabled_addon_paths(self.store, self.first), [])

    def test_duplicate_casefolded_member_names(self):
        path = self.root / "duplicate.xpi"
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("manifest.json", json.dumps({
                "manifest_version": 2, "name": "Test", "version": "1"}))
            archive.writestr("LOG.js", "one")
            archive.writestr("log.js", "two")
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            inspect_archive(path)


if __name__ == "__main__":
    unittest.main()
