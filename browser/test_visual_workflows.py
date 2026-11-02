"""Murdilimax Neon Flow Studio definition and execution acceptance tests."""
from __future__ import annotations

import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from store import Store
from visual_workflows import (save_flow, list_flows, delete_flow,
                              duplicate_flow, validated_step, validated_flow,
                              MAX_STEPS, MAX_FLOWS)
from visual_executor import run_visual_flow


class StudioTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.store = Store(Path(tmp.name) / "local")
        self.one = self.store.add_profile("One", notes="Private cookie data")
        self.two = self.store.add_profile("Two")

    def blocks(self):
        return [
            {"kind": "open", "url": "https://example.org/search"},
            {"kind": "wait_visible", "selector": "#search", "seconds": 8},
            {"kind": "assert_text", "selector": "#status",
             "text": "Ready", "seconds": 6},
            {"kind": "fill", "selector": "#search", "text": "public words"},
            {"kind": "click", "selector": "button.search"},
            {"kind": "wait", "seconds": 1},
            {"kind": "scroll", "pixels": 400},
        ]

    def test_save_reload_reorder_and_metadata_isolation(self):
        x = save_flow(self.store, "Campaign", [self.one["id"]], self.blocks())
        self.assertEqual(len(list_flows(self.store)), 1)
        raw = (self.store.root / "visual_flows.json").read_text(encoding="utf-8")
        self.assertNotIn("Private cookie data", raw)
        reversed_blocks = list(reversed(self.blocks()))
        saved = save_flow(self.store, "Campaign edited", [self.one["id"],
                         self.two["id"]], reversed_blocks, replace_id=x["id"])
        self.assertEqual(saved["id"], x["id"])
        self.assertEqual(list_flows(self.store)[0]["steps"], reversed_blocks)
        self.assertEqual(len(list_flows(Store(self.store.root))), 1)
        delete_flow(self.store, x["id"])
        self.assertEqual(list_flows(self.store), [])
        self.assertEqual(len(self.store.profiles()), 2)

    def test_duplicate_flow_preserves_original_and_browser_data(self):
        src = save_flow(self.store, "Campaign", [self.one["id"]],
                        self.blocks())
        original = self.store._read("visual_flows")[0].copy()
        before_profiles = self.store.profiles()
        copy1 = duplicate_flow(self.store, src["id"])
        copy2 = duplicate_flow(self.store, src["id"])
        self.assertEqual(copy1["name"], "Campaign — копия")
        self.assertEqual(copy2["name"], "Campaign — копия 2")
        self.assertNotEqual(src["id"], copy1["id"])
        self.assertNotEqual(copy1["id"], copy2["id"])
        self.assertEqual(copy1["steps"], original["steps"])
        self.assertEqual(copy1["profile_ids"], original["profile_ids"])
        self.assertEqual(self.store._read("visual_flows")[0], original)
        self.assertEqual(self.store.profiles(), before_profiles)
        self.assertFalse((self.store.root / "cookie-backups").exists())
        self.assertEqual(len(list_flows(self.store)), 3)

    def test_duplicate_long_name_and_reject_deleted_targets(self):
        long_name = "W" * 80
        flow = save_flow(self.store, long_name, [self.one["id"]],
                         self.blocks())
        copied = duplicate_flow(self.store, flow["id"])
        self.assertLessEqual(len(copied["name"]), 80)
        self.assertTrue(copied["name"].endswith(" — копия"))
        before = self.store._read("visual_flows")
        with patch.object(self.store, "profiles", return_value=[]):
            with self.assertRaisesRegex(ValueError, "deleted"):
                duplicate_flow(self.store, flow["id"])
        self.assertEqual(self.store._read("visual_flows"), before)

    def test_duplicate_rejects_invalid_id_and_capacity(self):
        with self.assertRaises(ValueError):
            duplicate_flow(self.store, "../../cookie.sqlite")
        with self.assertRaises(ValueError):
            duplicate_flow(self.store, "f" * 32)
        src = save_flow(self.store, "Flow 0", [self.one["id"]],
                        self.blocks())
        for number in range(1, MAX_FLOWS):
            save_flow(self.store, f"Flow {number}", [self.one["id"]],
                      [{"kind": "wait", "seconds": 1}])
        before = self.store._read("visual_flows")
        with self.assertRaisesRegex(ValueError, "limit"):
            duplicate_flow(self.store, src["id"])
        self.assertEqual(self.store._read("visual_flows"), before)

    def test_parallel_mode_compatibility_and_persistence(self):
        original = {"name": "Old Flow", "profile_ids": [self.one["id"]],
                    "steps": [{"kind": "wait", "seconds": 1}]}
        self.assertEqual(validated_flow(original)["execution_mode"], "serial")
        for bad in (None, True, 0, "auto", "PARALLEL", []):
            with self.subTest(mode=bad), self.assertRaises(ValueError):
                validated_flow({**original, "execution_mode": bad})
        flow = save_flow(
            self.store, "Parallel", [self.one["id"], self.two["id"]],
            [{"kind": "click", "selector": "button"}],
            execution_mode="parallel")
        self.assertEqual(flow["execution_mode"], "parallel")
        self.assertEqual(list_flows(Store(self.store.root))[0]["execution_mode"],
                         "parallel")
        cloned = duplicate_flow(self.store, flow["id"])
        self.assertEqual(cloned["execution_mode"], "parallel")
        self.assertNotEqual(cloned["id"], flow["id"])

    def test_parallel_flow_dispatches_same_step_concurrently_and_in_order(self):
        flow = save_flow(
            self.store, "Concurrent", [self.one["id"], self.two["id"]],
            [{"kind": "open", "url": "https://example.org"},
             {"kind": "click", "selector": "button"}],
            execution_mode="parallel")
        barriers = {kind: threading.Barrier(2, timeout=3)
                    for kind in ("open", "click")}
        events, lock = [], threading.Lock()
        def dispatch(_store, profile, step, **_):
            barriers[step["kind"]].wait()
            with lock:
                events.append((profile, step["kind"]))
        with patch("navigation_commands._active_session", return_value=(
                self.store.root / "profiles" / self.one["id"],
                {"pid": 3, "token": "a" * 48})):
            done = run_visual_flow(self.store, flow, verify=lambda *_: None,
                                   alive=lambda *_: True, dispatch=dispatch)
        self.assertEqual(done, {"state": "completed", "actions": 4})
        self.assertEqual([name for _, name in events].count("open"), 2)
        self.assertEqual([name for _, name in events].count("click"), 2)
        self.assertEqual([name for _, name in events][:2], ["open", "open"])
        self.assertEqual([name for _, name in events][2:], ["click", "click"])

    def test_parallel_failure_stops_following_step_and_cancels_pending(self):
        flow = save_flow(
            self.store, "Failure", [self.one["id"], self.two["id"]],
            [{"kind": "click", "selector": "button"},
             {"kind": "scroll", "pixels": 400}], execution_mode="parallel")
        barrier = threading.Barrier(2, timeout=3)
        calls, cancel = [], threading.Event()
        def dispatch(_store, profile, step, **_):
            calls.append(step["kind"])
            if step["kind"] == "click":
                barrier.wait()
                if profile == self.one["id"]:
                    raise RuntimeError("synthetic per-profile action failure")
        with patch("navigation_commands._active_session", return_value=(
                self.store.root / "profiles" / self.one["id"],
                {"pid": 3, "token": "a" * 48})):
            with self.assertRaisesRegex(RuntimeError, "action failure"):
                run_visual_flow(self.store, flow, cancel=cancel,
                                verify=lambda *_: None, alive=lambda *_: True,
                                dispatch=dispatch)
        self.assertEqual(calls.count("click"), 2)
        self.assertNotIn("scroll", calls)
        self.assertTrue(cancel.is_set())

    def test_schema_rejects_unsafe_web_and_script_actions(self):
        bad = [
            {"kind": "open", "url": "file:///etc/passwd"},
            {"kind": "open", "url": "javascript:alert(1)"},
            {"kind": "open", "url": "https://user:secret@host.local"},
            {"kind": "click", "selector": ""},
            {"kind": "click", "selector": "x\nscript"},
            {"kind": "fill", "selector": "input[type=password]", "text": "abc"},
            {"kind": "fill", "selector": "#field", "text": "x" * 401},
            {"kind": "scroll", "pixels": 0},
            {"kind": "scroll", "pixels": 2000},
            {"kind": "wait", "seconds": 0},
            {"kind": "wait", "seconds": True},
            {"kind": "wait", "seconds": 31},
            {"kind": "wait_visible", "selector": "#search", "seconds": 0},
            {"kind": "wait_visible", "selector": "#search", "seconds": 16},
            {"kind": "wait_visible", "selector": "#search", "seconds": True},
            {"kind": "wait_visible", "selector": "", "seconds": 8},
            {"kind": "wait_visible", "selector": "#search"},
            {"kind": "wait_visible", "selector": "#search", "seconds": 8, "js": "x"},
            {"kind": "assert_text", "selector": "#status", "text": "", "seconds": 8},
            {"kind": "assert_text", "selector": "#status", "text": "x"*121, "seconds": 8},
            {"kind": "assert_text", "selector": "#status", "text": "line\nbreak", "seconds": 8},
            {"kind": "assert_text", "selector": "#status", "text": "Ready", "seconds": 0},
            {"kind": "assert_text", "selector": "#status", "text": "Ready", "seconds": True},
            {"kind": "assert_text", "selector": "#status", "text": "Ready", "seconds": 16},
            {"kind": "assert_text", "selector": "input[type=password]", "text": "x", "seconds": 8},
            {"kind": "assert_text", "selector": "#status", "text": "Ready"},
            {"kind": "assert_text", "selector": "#status", "text": "Ready", "seconds": 8, "script": "x"},
            {"kind": "execute", "script": "os.system('bad')"},
            {"kind": "click", "selector": "button", "python": "bad"},
        ]
        for s in bad:
            with self.subTest(step=s), self.assertRaises(ValueError):
                validated_step(s)

    def test_atomic_invalid_save_and_capacity(self):
        saved = save_flow(self.store, "Flow", [self.one["id"]], self.blocks())
        before = self.store._read("visual_flows")
        for bad in (
                [], [{"kind": "wait", "seconds": 1}] * (MAX_STEPS + 1),
                [{"kind": "open", "url": "file:///etc/passwd"}]):
            with self.subTest(blocks=bad), self.assertRaises(ValueError):
                save_flow(self.store, "Bad", [self.one["id"]], bad)
        with self.assertRaises(ValueError):
            save_flow(self.store, "Flow", [self.one["id"]], self.blocks())
        with self.assertRaises(ValueError):
            save_flow(self.store, "Gone", ["f" * 32], self.blocks())
        self.assertEqual(self.store._read("visual_flows"), before)
        with patch.object(self.store, "_write", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                save_flow(self.store, "Another", [self.one["id"]], self.blocks())
        self.assertEqual(self.store._read("visual_flows"), before)

    def test_preflight_checks_all_licenses_before_browser_action(self):
        flow = save_flow(self.store, "Batch", [self.one["id"], self.two["id"]],
                         [{"kind": "click", "selector": "button"}])
        command = Mock(return_value=True)
        with patch("navigation_commands._active_session", return_value=(
                self.store.root / "profiles" / self.one["id"],
                {"pid": 3, "token": "a" * 48})):
            def verify(store, pid):
                if pid == self.two["id"]:
                    raise PermissionError("Paid profile not permitted")
            with self.assertRaises(PermissionError):
                run_visual_flow(self.store, flow, verify=verify,
                                alive=lambda *_: True, dispatch=command)
        command.assert_not_called()

    def test_flow_executes_blocks_in_order_across_profiles(self):
        flow = save_flow(
            self.store, "Run", [self.one["id"], self.two["id"]],
            [{"kind": "open", "url": "https://example.org"},
             {"kind": "click", "selector": "button"},
             {"kind": "wait", "seconds": 1},
             {"kind": "scroll", "pixels": 350}])
        received = []
        class NotWaiting:
            def is_set(self): return False
            def wait(self, secs):
                self_secs.append(secs)
                return False
        self_secs = []
        with patch("navigation_commands._active_session", return_value=(
                self.store.root / "profiles" / self.one["id"],
                {"pid": 3, "token": "a" * 48})):
            result = run_visual_flow(
                self.store, flow, cancel=NotWaiting(),
                verify=lambda *_: None, alive=lambda *_: True,
                dispatch=lambda _store, pid, step, **kw:
                received.append((pid, step["kind"])))
        self.assertEqual(result, {"state": "completed", "actions": 6})
        self.assertEqual([k for _, k in received],
                         ["open", "open", "click", "click", "scroll", "scroll"])
        self.assertEqual(self_secs, [1])

    def test_cancelled_before_first_action_never_executes_browser_command(self):
        flow = save_flow(self.store, "Cancelled", [self.one["id"]],
                         [{"kind": "open", "url": "https://example.org"}])
        stop = threading.Event()
        stop.set()
        run = Mock(return_value=True)
        with patch("navigation_commands._active_session", return_value=(
                self.store.root / "profiles" / self.one["id"],
                {"pid": 3, "token": "a" * 48})):
            result = run_visual_flow(self.store, flow, cancel=stop,
                                     verify=lambda *_: None, alive=lambda *_: True,
                                     dispatch=run)
        self.assertEqual(result, {"state": "cancelled", "actions": 0})
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
