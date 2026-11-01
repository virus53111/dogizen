"""Quick profile and bulk proxy regression suite. Offline and cross-platform."""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from profile_actions import bulk_assign_proxy, create_quick_profiles
from store import Store


class LocalActionsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = Store(Path(self.temp.name) / "app")

    def test_quick_creates_isolated_profiles_with_no_secrets(self):
        items = create_quick_profiles(self.store, count=3, allowance=3)
        self.assertEqual(len(items), 3)
        self.assertEqual(len({x["id"] for x in items}), 3)
        self.assertEqual([p["name"] for p in self.store.profiles()],
                         ["Быстрый профиль 1", "Быстрый профиль 2",
                          "Быстрый профиль 3"])
        for item in items:
            self.assertTrue((self.store.root / "profiles" / item["id"]).is_dir())
            self.assertEqual(item["url"], "about:blank")
            self.assertEqual(item["startup_urls"], [])
            self.assertEqual(item["proxy_id"], "")
        with self.assertRaises(ValueError):
            create_quick_profiles(self.store, allowance=3)
        self.assertEqual(len(self.store.profiles()), 3)
        self.assertEqual(len(list((self.store.root / "profiles").iterdir())), 3)

    def test_free_tier_and_count_validation_do_not_partially_write(self):
        self.store.add_profile("Existing")
        original = (self.store.root / "profiles.json").read_bytes()
        for count, allowance in ((3, 3), (11, 100), (0, 100),
                                 (-1, 100), (True, 100), (1, True),
                                 (1, -1), (1, 1001), (1, 1)):
            with self.subTest(count=count, allowance=allowance):
                with self.assertRaises(ValueError):
                    create_quick_profiles(self.store, count=count,
                                          allowance=allowance)
                self.assertEqual((self.store.root / "profiles.json").read_bytes(), original)

    def test_quick_folder_rollback_if_metadata_write_fails(self):
        previous = self.store.profiles()
        with patch.object(self.store, "_write", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                create_quick_profiles(self.store, allowance=3, count=2)
        self.assertEqual(self.store.profiles(), previous)
        self.assertEqual(list((self.store.root / "profiles").iterdir()), [])

    def test_quick_no_name_collisions_and_metadata_export(self):
        self.store.add_profile("Быстрый профиль 1")
        made = create_quick_profiles(self.store, allowance=3, count=2)
        self.assertEqual([x["name"] for x in made],
                         ["Быстрый профиль 2", "Быстрый профиль 3"])
        self.store.export_metadata(self.store.root / "export.json")
        exported = json.loads((self.store.root / "export.json").read_text(encoding="utf-8"))
        self.assertEqual(len(exported["profiles"]), 3)
        self.assertTrue(all("password" not in p and "cookie" not in p
                            for p in exported["profiles"]))

    def test_bulk_proxy_assignment_is_one_write_and_preserves_rest(self):
        one = self.store.add_profile("One")
        two = self.store.add_profile("Two")
        other = self.store.add_profile("Unselected")
        proxy = self.store.add_proxy("Approved", "http://127.0.0.1:8080")
        with patch.object(self.store, "_write", wraps=self.store._write) as write:
            count = bulk_assign_proxy(self.store, [one["id"], two["id"],
                                                    one["id"]], proxy["id"],
                                      lambda _: False)
            self.assertEqual(count, 2)
            write.assert_called_once()
        stored = {p["id"]: p for p in self.store.profiles()}
        self.assertEqual(stored[one["id"]]["proxy_id"], proxy["id"])
        self.assertEqual(stored[two["id"]]["proxy_id"], proxy["id"])
        self.assertEqual(stored[other["id"]]["proxy_id"], "")
        self.assertEqual(bulk_assign_proxy(
            self.store, [one["id"], two["id"]], "", lambda _: False), 2)
        self.assertEqual(self.store.get_profile(one["id"])["proxy_id"], "")

    def test_bulk_rejects_unknown_proxy_running_and_stale_selection(self):
        one = self.store.add_profile("One")
        two = self.store.add_profile("Two")
        proxy = self.store.add_proxy("Approved", "socks5://127.0.0.1:1080")
        original = (self.store.root / "profiles.json").read_bytes()
        invalid = [
            ([one["id"]], "f" * 32, lambda _: False),
            ([one["id"], "a" * 32], proxy["id"], lambda _: False),
            ([one["id"], two["id"]], proxy["id"],
             lambda pid: pid == two["id"]),
            ([], proxy["id"], lambda _: False),
            ([one["id"]], None, lambda _: False),
            (["../unsafe"], proxy["id"], lambda _: False),
        ]
        for ids, chosen, running in invalid:
            with self.subTest(ids=ids, proxy=chosen):
                with self.assertRaises(ValueError):
                    bulk_assign_proxy(self.store, ids, chosen, running)
                self.assertEqual(
                    (self.store.root / "profiles.json").read_bytes(), original)

    def test_bulk_rejects_profile_pending_start(self):
        from launch_guard import reserve_launch, release_launch
        profile = self.store.add_profile("Busy")
        proxy = self.store.add_proxy("Proxy", "http://127.0.0.1:5555")
        folder = self.store.root / "profiles" / profile["id"]
        token = reserve_launch(folder)
        try:
            with self.assertRaisesRegex(ValueError, "Stop"):
                bulk_assign_proxy(self.store, [profile["id"]], proxy["id"],
                                  lambda _: False)
            self.assertEqual(self.store.get_profile(profile["id"])["proxy_id"], "")
        finally:
            release_launch(folder, token)

    def test_bulk_failure_does_not_change_existing_proxy(self):
        item = self.store.add_profile("One")
        p = self.store.add_proxy("Active", "http://127.0.0.1:8080")
        self.store.update_profile(item["id"], proxy_id=p["id"])
        original = self.store.profiles()
        with patch.object(self.store, "_write", side_effect=OSError("simulated IO")):
            with self.assertRaises(OSError):
                bulk_assign_proxy(self.store, [item["id"]], "",
                                  lambda _: False)
        self.assertEqual(original, self.store.profiles())


if __name__ == "__main__":
    unittest.main()
