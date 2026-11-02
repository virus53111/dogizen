"""Offline scenario security tests: validation, licences, cancellation and no secrets."""
from __future__ import annotations

import json
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from action_scenarios import (create_scenario, delete_scenario, list_scenarios,
                              preflight, run_scenario)
from store import Store


class ScenarioTests(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.store = Store(Path(t.name) / "local")
        self.one = self.store.add_profile("Work", "https://private.example/?token=SECRET",
                                           notes="PRIVATE NOTES")
        self.two = self.store.add_profile("Social", "about:blank")
        self.verify = Mock(return_value=None)
        self.start = Mock(return_value=12345)
        self.stop = Mock()
        self.running = Mock(return_value=False)

    def scenario(self, kind="start", ids=None, delay=0):
        return create_scenario(self.store, "Morning", kind,
                               ids if ids is not None else [self.one["id"]],
                               wait_seconds=delay)

    def test_save_list_reload_and_redaction(self):
        item = self.scenario()
        self.assertEqual(list_scenarios(self.store)[0]["name"], "Morning")
        raw = (self.store.root / "scenarios.json").read_text(encoding="utf-8")
        for secret in ("private.example", "token=SECRET", "PRIVATE NOTES", "password"):
            self.assertNotIn(secret, raw)
        self.assertEqual(item["profile_ids"], [self.one["id"]])
        self.assertEqual(len(list_scenarios(Store(self.store.root))), 1)
        delete_scenario(self.store, item["id"])
        self.assertEqual(list_scenarios(self.store), [])

    def test_invalid_schema_and_missing_profile_do_not_write(self):
        original = self.store._read("scenarios")
        invalid = [
            ("", "start", [self.one["id"]], 0),
            ("x" * 81, "start", [self.one["id"]], 0),
            ("Good", "exec", [self.one["id"]], 0),
            ("Good", "start", [self.one["id"], self.one["id"]], 0),
            ("Good", "start", ["../bad"], 0),
            ("Good", "stop", [], 0),
            ("Good", "session", [self.one["id"]], 1),
            ("Good", "session", [self.one["id"]], 301),
            ("Good", "start", [self.one["id"]], 10),
            ("Good", "stop", [self.one["id"]], True),
            ("Good", "start", ["f" * 32], 0),
        ]
        for name, kind, ids, wait in invalid:
            with self.subTest(name=name, kind=kind, ids=ids, wait=wait):
                with self.assertRaises(ValueError):
                    create_scenario(self.store, name, kind, ids,
                                    wait_seconds=wait)
                self.assertEqual(original, self.store._read("scenarios"))

    def test_duplicate_name_and_bad_storage_rejected(self):
        self.scenario()
        with self.assertRaisesRegex(ValueError, "unique"):
            create_scenario(self.store, "MORNING", "stop", [self.two["id"]])
        items = self.store._read("scenarios")
        self.store._write("scenarios", items * 2)
        with self.assertRaisesRegex(ValueError, "database"):
            list_scenarios(self.store)

    def test_start_preflights_entire_selection_and_rechecks_each_launch(self):
        s = self.scenario(ids=[self.one["id"], self.two["id"]])
        result = run_scenario(self.store, s, verify=self.verify,
                              start=self.start, stop=self.stop,
                              running=self.running)
        self.assertEqual(result, {"state": "completed", "accepted": 2})
        self.assertEqual(self.start.call_count, 2)
        self.assertEqual(self.verify.call_count, 4)  # 2 preflight + 2 each start
        self.stop.assert_not_called()

    def test_failed_second_license_blocks_all_side_effects(self):
        s = self.scenario(ids=[self.one["id"], self.two["id"]])
        self.verify.side_effect = [None, PermissionError("license expired")]
        with self.assertRaises(PermissionError):
            run_scenario(self.store, s, verify=self.verify,
                         start=self.start, stop=self.stop, running=self.running)
        self.start.assert_not_called()
        self.stop.assert_not_called()

    def test_running_busy_or_missing_profile_block_all_starts(self):
        s = self.scenario(ids=[self.one["id"], self.two["id"]])
        self.running.side_effect = lambda store, pid: pid == self.two["id"]
        with self.assertRaisesRegex(RuntimeError, "Stop selected"):
            run_scenario(self.store, s, verify=self.verify, start=self.start,
                         running=self.running)
        self.start.assert_not_called()
        self.store._write("profiles", [self.one])
        self.running.return_value = False
        self.running.side_effect = None
        with self.assertRaisesRegex(ValueError, "missing profile"):
            run_scenario(self.store, s, verify=self.verify, start=self.start,
                         running=self.running)
        self.start.assert_not_called()

    def test_session_wait_then_stop_all(self):
        s = self.scenario("session", [self.one["id"], self.two["id"]], 5)
        class InstantEvent:
            def is_set(self): return False
            def wait(self, seconds):
                assert seconds == 5
                return False
        events = []
        result = run_scenario(
            self.store, s, cancel=InstantEvent(), notify=lambda event, n: events.append((event, n)),
            verify=self.verify, running=self.running,
            start=self.start, stop=self.stop)
        self.assertEqual(result, {"state": "completed", "accepted": 4})
        self.assertEqual(self.start.call_count, 2)
        self.assertEqual(self.stop.call_count, 2)
        self.assertEqual(events[-1], ("stop_requested", 4))

    def test_cancellation_during_pause_preserves_running_browser(self):
        s = self.scenario("session", [self.one["id"]], 5)
        class CancelDuringWait:
            def is_set(self): return False
            def wait(self, seconds): return True
        result = run_scenario(self.store, s, cancel=CancelDuringWait(),
                              verify=self.verify, running=self.running,
                              start=self.start, stop=self.stop)
        self.assertEqual(result, {"state": "cancelled", "accepted": 1})
        self.start.assert_called_once()
        self.stop.assert_not_called()  # No surprise browser shutdown on cancel

    def test_cancel_before_start_is_no_op(self):
        s = self.scenario()
        cancelled = threading.Event()
        cancelled.set()
        result = run_scenario(self.store, s, cancel=cancelled,
                              verify=self.verify, running=self.running,
                              start=self.start)
        self.assertEqual(result, {"state": "cancelled", "accepted": 0})
        self.start.assert_not_called()

    def test_stop_scenario_never_skips_user_selected_profile(self):
        s = self.scenario("stop", [self.one["id"], self.two["id"]])
        result = run_scenario(self.store, s, verify=self.verify, running=self.running,
                              start=self.start, stop=self.stop)
        self.assertEqual(result["accepted"], 2)
        self.verify.assert_not_called()
        self.start.assert_not_called()
        self.assertEqual(self.stop.call_count, 2)

    def test_busy_launch_preflight_prevents_side_effects(self):
        s = self.scenario()
        from launch_guard import reserve_launch, release_launch
        folder = self.store.root / "profiles" / self.one["id"]
        token = reserve_launch(folder)
        try:
            with self.assertRaisesRegex(RuntimeError, "launching"):
                preflight(self.store, s, verify=self.verify, running=self.running)
            self.start.assert_not_called()
        finally:
            release_launch(folder, token)

    def test_failed_disk_write_preserves_other_scenarios(self):
        old = self.scenario()
        before = self.store._read("scenarios")
        with patch.object(self.store, "_write", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                create_scenario(self.store, "Later", "stop", [self.two["id"]])
            with self.assertRaises(OSError):
                delete_scenario(self.store, old["id"])
        self.assertEqual(before, self.store._read("scenarios"))


if __name__ == "__main__":
    unittest.main()
