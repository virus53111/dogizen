"""Cross-platform offline tests for atomic browser startup reservations.

No Camoufox instance, network, subscription or private profile data needed.
"""
from __future__ import annotations

import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

from addon_manager import list_addons, set_addon_enabled
from cookie_manager import cookie_inventory
from engine import run_profile, start_background
from launch_guard import (
    LAUNCH_MARKER, LAUNCH_TOKEN_ENV, STALE_AFTER_SECONDS,
    launch_pending, release_launch, reserve_launch,
)
from store import Store


class AtomicProfileLaunchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = Store(Path(self.temp.name) / "app")
        self.pid = self.store.add_profile("Launch QA")["id"]
        self.folder = self.store.root / "profiles" / self.pid

    def test_reservation_atomic_and_owned_by_token(self):
        first = reserve_launch(self.folder)
        self.assertTrue(launch_pending(self.folder))
        with self.assertRaisesRegex(RuntimeError, "already starting"):
            reserve_launch(self.folder)
        self.assertFalse(release_launch(self.folder, "not-the-owner"))
        self.assertTrue(release_launch(self.folder, first))
        self.assertFalse(launch_pending(self.folder))
        self.assertFalse(release_launch(self.folder, first))

    def test_stale_reservation_recovers_with_new_token(self):
        old_token = reserve_launch(self.folder)
        path = self.folder / LAUNCH_MARKER
        then = time.time() - STALE_AFTER_SECONDS - 20
        os.utime(path, (then, then))
        replacement = reserve_launch(self.folder)
        self.assertNotEqual(old_token, replacement)
        self.assertFalse(release_launch(self.folder, old_token))
        self.assertTrue(path.exists())
        self.assertTrue(release_launch(self.folder, replacement))

    def test_stale_reservation_never_overrides_active_lock(self):
        token = reserve_launch(self.folder)
        marker = self.folder / LAUNCH_MARKER
        then = time.time() - STALE_AFTER_SECONDS - 20
        os.utime(marker, (then, then))
        (self.folder / ".lock").write_text(str(os.getpid()))
        with self.assertRaisesRegex(RuntimeError, "already active"):
            reserve_launch(self.folder)
        self.assertEqual(marker.read_text(), token)

    def test_subprocess_launch_handoff_prevents_duplicate_spawn(self):
        with patch("engine.subprocess.Popen") as popen:
            popen.return_value.pid = 712345
            first_pid = start_background(self.store, self.pid)
            self.assertEqual(first_pid, 712345)
            self.assertTrue(launch_pending(self.folder))
            with self.assertRaisesRegex(RuntimeError, "already starting"):
                start_background(self.store, self.pid)
            popen.assert_called_once()
            env = popen.call_args.kwargs["env"]
            self.assertTrue(env[LAUNCH_TOKEN_ENV])
            self.assertTrue(release_launch(self.folder, env[LAUNCH_TOKEN_ENV]))

    def test_spawn_failure_cleans_reservation_and_retry_allowed(self):
        with patch("engine.subprocess.Popen", side_effect=OSError("fake spawn error")):
            with self.assertRaises(OSError):
                start_background(self.store, self.pid)
        self.assertFalse(launch_pending(self.folder))
        with patch("engine.subprocess.Popen") as popen:
            popen.return_value.pid = 123456
            self.assertEqual(start_background(self.store, self.pid), 123456)
            token = popen.call_args.kwargs["env"][LAUNCH_TOKEN_ENV]
            self.assertTrue(release_launch(self.folder, token))

    def test_running_child_stop_request_cannot_be_erased_by_duplicate(self):
        lock = self.folder / ".lock"
        stop = self.folder / ".stop"
        lock.write_text(str(os.getpid()))
        stop.touch()
        with patch("engine.Store", return_value=self.store):
            with self.assertRaisesRegex(RuntimeError, "already running"):
                run_profile(self.pid)
        self.assertTrue(stop.exists(), "An unrelated duplicate must not cancel STOP")
        self.assertEqual(lock.read_text(), str(os.getpid()))

    def test_maintenance_rejects_pending_child(self):
        token = reserve_launch(self.folder)
        with self.assertRaisesRegex(ValueError, "Stop"):
            cookie_inventory(self.store, self.pid)
        # Reads of existing addon metadata are safe; changes are forbidden.
        self.assertEqual(list_addons(self.store, self.pid), [])
        with self.assertRaisesRegex(ValueError, "Stop"):
            set_addon_enabled(self.store, self.pid, "0" * 32, False)
        self.assertTrue(release_launch(self.folder, token))

    @unittest.skipIf(os.name == "nt", "Creating symlinks on Windows needs developer mode")
    def test_symlinked_launch_reservation_never_followed(self):
        outside = Path(self.temp.name) / "outside.txt"
        outside.write_text("sensitive")
        (self.folder / LAUNCH_MARKER).symlink_to(outside)
        with self.assertRaisesRegex(RuntimeError, "Unsafe"):
            reserve_launch(self.folder)
        self.assertEqual(outside.read_text(), "sensitive")


if __name__ == "__main__":
    unittest.main()
