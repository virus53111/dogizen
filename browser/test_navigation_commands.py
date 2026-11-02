"""Security and lifecycle tests for private per-Camoufox navigation requests."""
from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from action_scenarios import create_scenario, run_scenario
from navigation_commands import (
    COMMAND_DIR, SESSION_FILE, close_navigation_session,
    consume_navigation, create_navigation_session, submit_navigation,
    validated_navigation_url)
from store import Store


class FakePage:
    def __init__(self, *, fail=False):
        self.url = None
        self.closed = False
        self.fail = fail

    def goto(self, url, **kw):
        self.url = url
        if self.fail:
            raise RuntimeError("test navigation failed")

    def close(self):
        self.closed = True


class FakeBrowser:
    def __init__(self, *, fail=False):
        self.pages = []
        self.fail = fail

    def new_page(self):
        p = FakePage(fail=self.fail)
        self.pages.append(p)
        return p


class NavigationTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.store = Store(Path(directory.name) / "data")
        self.profile = self.store.add_profile("One", "about:blank")
        self.folder = self.store.root / "profiles" / self.profile["id"]
        self.pid = os.getpid()
        (self.folder / ".lock").write_text(str(self.pid), encoding="ascii")
        self.token = create_navigation_session(self.folder, self.pid)
        self.verify = Mock(return_value=None)

    def enqueue(self, url="https://example.com/page", profiles=None):
        return submit_navigation(
            self.store, profiles or [self.profile["id"]], url,
            verify=self.verify, alive=lambda pid: pid == self.pid)

    def test_new_tab_commands_consumed_only_by_current_session(self):
        result = self.enqueue("https://example.com/?query=sensitive")
        self.assertEqual(result, {"queued": 1})
        commands = self.folder / COMMAND_DIR
        self.assertEqual(len(list(commands.glob("*.json"))), 1)
        self.assertEqual(list(commands.glob("*.tmp")), [])
        browser = FakeBrowser()
        result = consume_navigation(browser, self.folder, self.token)
        self.assertEqual(result, {"opened": 1, "failed": 0, "ignored": 0})
        self.assertEqual(browser.pages[0].url,
                         "https://example.com/?query=sensitive")
        self.assertEqual(list(commands.glob("*.json")), [])
        self.assertEqual(consume_navigation(browser, self.folder, self.token)["opened"], 0)

    def test_stale_command_not_replayed_to_restarted_browser(self):
        self.enqueue()
        old = self.token
        self.token = create_navigation_session(self.folder, self.pid)
        browser = FakeBrowser()
        self.assertEqual(consume_navigation(browser, self.folder, self.token)["ignored"], 1)
        self.assertEqual(browser.pages, [])
        self.assertFalse(close_navigation_session(self.folder, old))
        self.assertTrue(close_navigation_session(self.folder, self.token))

    def test_invalid_urls_rejected_without_file_creation(self):
        for bad in (
            "javascript:alert(1)", "data:text/html,abc", "file:///etc/passwd",
            "https://login:password@example.com", "http://example.com/has space",
            "https://example.org/\nX-Test:evil", "ftp://example.com",
            "http://[invalid", "http://example.com:0", "https://example.com/" + "a" * 2048,
            42, None):
            with self.subTest(url=bad), self.assertRaises(ValueError):
                self.enqueue(bad)
            self.assertEqual(list((self.folder / COMMAND_DIR).glob("*.json")), [])

    def test_license_preflight_failure_does_not_queue_for_any_target(self):
        other = self.store.add_profile("Two")
        other_folder = self.store.root / "profiles" / other["id"]
        (other_folder / ".lock").write_text(str(self.pid), encoding="ascii")
        other_token = create_navigation_session(other_folder, self.pid)
        def verify(store, pid):
            if pid == other["id"]:
                raise PermissionError("No paid subscription")
        with self.assertRaises(PermissionError):
            submit_navigation(
                self.store, [self.profile["id"], other["id"]],
                "https://example.org", verify=verify,
                alive=lambda p: p == self.pid)
        for folder in (self.folder, other_folder):
            self.assertEqual(list((folder / COMMAND_DIR).glob("*.json")), [])
        self.assertTrue(close_navigation_session(other_folder, other_token))

    def test_invalid_or_missing_running_profile_fails(self):
        (self.folder / ".lock").unlink()
        with self.assertRaises(RuntimeError):
            self.enqueue()
        (self.folder / ".lock").write_text("99999999", encoding="ascii")
        with self.assertRaises(RuntimeError):
            self.enqueue()
        (self.folder / ".lock").write_text(str(self.pid), encoding="ascii")
        (self.folder / SESSION_FILE).unlink()
        with self.assertRaises(RuntimeError):
            self.enqueue()

    def test_existing_browser_exception_only_closes_failed_new_tab(self):
        self.enqueue()
        browser = FakeBrowser(fail=True)
        self.assertEqual(consume_navigation(browser, self.folder, self.token),
                         {"opened": 0, "failed": 1, "ignored": 0})
        self.assertTrue(browser.pages[0].closed)
        self.assertEqual(list((self.folder / COMMAND_DIR).glob("*.json")), [])

    def test_malicious_queue_rejected_without_execution(self):
        queue = self.folder / COMMAND_DIR
        (queue / ("a" * 32 + ".json")).write_text(
            json.dumps({"token": self.token, "url": "javascript:alert(1)"}),
            encoding="utf-8")
        (queue / ("b" * 32 + ".json")).write_text(
            json.dumps({"token": self.token, "url": "https://good.org",
                        "cmd": "eval"}), encoding="utf-8")
        browser = FakeBrowser()
        result = consume_navigation(browser, self.folder, self.token)
        self.assertEqual(result["ignored"], 2)
        self.assertEqual(browser.pages, [])

    def test_bounded_queue_and_type_errors(self):
        for _ in range(20):
            self.enqueue()
        with self.assertRaisesRegex(RuntimeError, "queue is full"):
            self.enqueue()
        for bad in ([], ["bad"], [self.profile["id"]] * 2, [None], "bad"):
            with self.subTest(profile_ids=bad), self.assertRaises(ValueError):
                submit_navigation(self.store, bad, "https://example.org",
                                  verify=self.verify, alive=lambda p: p == self.pid)
        browser = FakeBrowser()
        self.assertEqual(consume_navigation(browser, self.folder, self.token)["opened"], 20)

    def test_atomic_queue_write_failure_leaves_no_partial_commands(self):
        with patch("navigation_commands.os.replace", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                self.enqueue()
        self.assertFalse(list((self.folder / COMMAND_DIR).iterdir()))

    def test_scenario_navigation_requires_running_and_never_persists_url(self):
        scenario = create_scenario(
            self.store, "Open landing page", "navigate", [self.profile["id"]])
        content = (self.store.root / "scenarios.json").read_text(encoding="utf-8")
        self.assertNotIn("https://private.example", content)
        queued = Mock(return_value={"queued": 1})
        result = run_scenario(
            self.store, scenario, navigation_url="https://private.example/?secret=123",
            navigate=queued, running=lambda *_: True, verify=self.verify)
        self.assertEqual(result["accepted"], 1)
        queued.assert_called_once()
        self.assertNotIn("private.example",
                         (self.store.root / "scenarios.json").read_text(encoding="utf-8"))
        with self.assertRaises(RuntimeError):
            run_scenario(self.store, scenario, navigation_url="https://example.net",
                         navigate=queued, running=lambda *_: False, verify=self.verify)
        with self.assertRaises(ValueError):
            run_scenario(self.store, scenario, navigation_url="file:///etc/passwd",
                         navigate=queued, running=lambda *_: True, verify=self.verify)

    def test_scenario_does_not_use_paid_access_without_verify(self):
        scenario = create_scenario(
            self.store, "Open URL", "navigate", [self.profile["id"]])
        with self.assertRaises(PermissionError):
            run_scenario(self.store, scenario, navigation_url="https://example.org",
                         navigate=Mock(), verify=Mock(side_effect=PermissionError),
                         running=lambda *_: True)

    @unittest.skipIf(os.name == "nt", "Windows symlink permissions vary")
    def test_session_symlink_is_rejected(self):
        real = self.folder / SESSION_FILE
        original = real.read_bytes()
        real.unlink()
        target = self.folder / "private-key"
        target.write_bytes(original)
        real.symlink_to(target)
        with self.assertRaises(RuntimeError):
            self.enqueue()


if __name__ == "__main__":
    unittest.main()
