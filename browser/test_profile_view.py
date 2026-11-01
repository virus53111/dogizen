"""Offline tests of search, filter, and all-or-nothing group operations."""
from __future__ import annotations

import copy
import tempfile
import unittest
from pathlib import Path

from profile_view import (ALL, RUNNING, STOPPED, bulk_update_groups,
                          distinct_groups, filter_profiles, plan_profile_launches)
from store import Store


class ProfileViewTests(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {"id": "a", "name": "Atlas", "group": "Marketing", "tags": "green", "notes": "Newsletter", "proxy_id": "px1"},
            {"id": "b", "name": "Nova", "group": "Commerce", "tags": "blue", "notes": "Shop", "proxy_id": ""},
            {"id": "c", "name": "Lighthouse", "group": "Marketing", "tags": "red", "notes": "Research", "proxy_id": "px2"},
        ]
        self.live = lambda pid: pid in {"a", "c"}

    def test_search_name_tags_notes_casefold(self):
        for keyword, expected in (("ATLAS", "a"), ("BluE", "b"), ("newsletter", "a"), ("RESEARCH", "c")):
            visible, active = filter_profiles(self.rows, query=keyword, running=self.live)
            self.assertEqual([p["id"] for p, _ in visible], [expected])
            self.assertEqual(active, 2)

    def test_composed_group_status_proxy_filters(self):
        visible, active = filter_profiles(self.rows, group="Marketing", proxy_id="px2",
                                          status=RUNNING, running=self.live)
        self.assertEqual([p["id"] for p, _ in visible], ["c"])
        self.assertEqual(active, 2)
        stopped, _ = filter_profiles(self.rows, status=STOPPED, running=self.live)
        self.assertEqual([p["id"] for p, _ in stopped], ["b"])
        direct, _ = filter_profiles(self.rows, proxy_id="", running=self.live)
        self.assertEqual([p["id"] for p, _ in direct], ["b"])
        all_rows, _ = filter_profiles(self.rows, status=ALL, running=self.live)
        self.assertEqual(len(all_rows), 3)

    def test_available_groups_sorted_unique(self):
        self.assertEqual(distinct_groups(self.rows), ["Commerce", "Marketing"])

    def test_invalid_filter_fails(self):
        with self.assertRaises(ValueError):
            filter_profiles(self.rows, status="maybe", running=self.live)

    def test_source_not_mutated(self):
        before = copy.deepcopy(self.rows)
        filter_profiles(self.rows, query="a", running=self.live)
        self.assertEqual(self.rows, before)

    def test_bulk_groups_are_atomic_and_persistent(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(tmp)
            a = store.add_profile("Atlas", group="Alpha")
            b = store.add_profile("Nova", group="Beta")
            count = bulk_update_groups(store, [a["id"], b["id"], a["id"]],
                                       "New Group", running=lambda pid: False)
            self.assertEqual(count, 2)
            self.assertEqual([p["group"] for p in store.profiles()], ["New Group", "New Group"])
            self.assertTrue(Path(tmp, "profiles", a["id"]).exists())

    def test_bulk_update_rejects_running_or_missing_without_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(tmp)
            a = store.add_profile("Atlas", group="A")
            b = store.add_profile("Nova", group="B")
            before = store.profiles()
            with self.assertRaisesRegex(ValueError, "running"):
                bulk_update_groups(store, [a["id"], b["id"]], "Wrong",
                                   running=lambda pid: pid == b["id"])
            self.assertEqual(store.profiles(), before)
            with self.assertRaisesRegex(ValueError, "no longer exists"):
                bulk_update_groups(store, [a["id"], "does-not-exist"], "Wrong",
                                   running=lambda pid: False)
            self.assertEqual(store.profiles(), before)
            with self.assertRaises(ValueError):
                bulk_update_groups(store, [a["id"]], "x" * 81,
                                   running=lambda pid: False)
            self.assertEqual(store.profiles(), before)

    def test_blank_group_valid_for_ungrouped_profiles(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(tmp)
            p = store.add_profile("Test", group="Former")
            bulk_update_groups(store, [p["id"]], "  ", running=lambda pid: False)
            self.assertEqual(store.get_profile(p["id"])["group"], "")


    def test_launch_planning_skips_running_and_deduplicates(self):
        started = []
        profiles = [{"id": f"p-{i}"} for i in range(1000)]
        selected = ["p-1", "p-2", "p-1", "p-100"]
        ready = plan_profile_launches(
            profiles, selected, 300,
            running=lambda pid: pid == "p-2")
        self.assertEqual(ready, ["p-1", "p-100"])

    def test_launch_plan_rejects_invalid_or_overlimit_without_launch(self):
        profiles = [{"id": f"p-{i}"} for i in range(1000)]
        checks = []
        def running(pid):
            checks.append(pid)
            return False
        with self.assertRaisesRegex(ValueError, "limit"):
            plan_profile_launches(profiles, ["p-1", "p-400"], 20, running)
        self.assertEqual(checks, [])  # no launch or running-status checks
        with self.assertRaisesRegex(ValueError, "no longer exist"):
            plan_profile_launches(profiles, ["p-1", "stale"], 20, running)
        self.assertEqual(checks, [])
        with self.assertRaisesRegex(ValueError, "allowance"):
            plan_profile_launches(profiles, ["p-1"], True, running)



if __name__ == "__main__":
    unittest.main()
