"""Session-bound visual IPC tests (no external websites or credentials)."""
from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from navigation_commands import create_navigation_session
from store import Store
from visual_ipc import (REQUESTS, RESPONSES, consume_visual_commands,
                        submit_visual_step)


class Locator:
    def __init__(self, page, selector, text=None):
        self.page = page
        self.selector = selector
        self.text = text
    def filter(self, **kw):
        return Locator(self.page, self.selector, kw.get("has_text"))
    @property
    def first(self):
        return self
    def click(self, **kw):
        self.page.events.append(("click", self.selector))
        if self.page.fail:
            raise RuntimeError("synthetic click failure")
    def fill(self, text, **kw):
        self.page.events.append(("fill", self.selector, text))
    def wait_for(self, **kw):
        if self.text is not None:
            self.page.events.append(("assert_text", self.selector, self.text,
                                     kw.get("state"), kw.get("timeout")))
            if self.text != "Flow confirmed":
                raise RuntimeError("Synthetic expected text missing")
        else:
            self.page.events.append(("wait_visible", self.selector, kw.get("state"), kw.get("timeout")))
            if self.selector == "#missing":
                raise RuntimeError("Synthetic locator timeout")


class Mouse:
    def __init__(self, page): self.page = page
    def wheel(self, x, y): self.page.events.append(("scroll", y))


class FakePage:
    def __init__(self, fail=False):
        self.events = []
        self.fail = fail
        self.mouse = Mouse(self)
        self.closed = False
    def goto(self, url, **kw): self.events.append(("open", url))
    def locator(self, selector): return Locator(self, selector)
    def close(self): self.closed = True


class FakeBrowser:
    def __init__(self, fail=False):
        self.pages = [FakePage(fail=fail)]
    def new_page(self):
        page = FakePage()
        self.pages.append(page)
        return page


class VisualIPCTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.store = Store(Path(tmp.name) / "local")
        self.profile = self.store.add_profile("QA")
        self.folder = self.store.root / "profiles" / self.profile["id"]
        self.pid = os.getpid()
        (self.folder / ".lock").write_text(str(self.pid), encoding="ascii")
        self.token = create_navigation_session(self.folder, self.pid)
        self.browser = FakeBrowser()
        self.verify = Mock(return_value=None)

    def execute(self, step, *, browser=None):
        context = browser or self.browser
        return submit_visual_step(
            self.store, self.profile["id"], step, verify=self.verify,
            alive=lambda x: x == self.pid,
            sleeper=lambda _: consume_visual_commands(context, self.folder, self.token))

    def test_open_click_fill_scroll_and_ack_cleanup(self):
        self.assertTrue(self.execute({"kind": "open", "url": "https://example.org"}))
        self.assertTrue(self.execute({"kind": "wait_visible", "selector": "#search", "seconds": 8}))
        self.assertTrue(self.execute({"kind": "assert_text", "selector": "#status",
                                      "text": "Flow confirmed", "seconds": 8}))
        self.assertTrue(self.execute({"kind": "click", "selector": "#login"}))
        self.assertTrue(self.execute({"kind": "fill", "selector": "#search", "text": "public text"}))
        self.assertTrue(self.execute({"kind": "scroll", "pixels": 650}))
        self.assertEqual(self.browser.pages[-1].events, [
            ("open", "https://example.org"),
            ("wait_visible", "#search", "visible", 8000),
            ("assert_text", "#status", "Flow confirmed", "visible", 8000),
            ("click", "#login"), ("fill", "#search", "public text"),
            ("scroll", 650)])
        self.assertEqual(list((self.folder / REQUESTS).glob("*.json")), [])
        self.assertEqual(list((self.folder / RESPONSES).glob("*.json")), [])

    def test_wait_visible_timeout_is_failure_not_success(self):
        with self.assertRaisesRegex(RuntimeError, "did not complete"):
            self.execute({"kind": "wait_visible", "selector": "#missing", "seconds": 2})
        self.assertEqual(list((self.folder / RESPONSES).glob("*.json")), [])
        self.assertEqual(self.browser.pages[-1].events,
                         [("wait_visible", "#missing", "visible", 2000)])

    def test_text_mismatch_stops_action_without_leaking_page_content(self):
        with self.assertRaisesRegex(RuntimeError, "did not complete"):
            self.execute({"kind": "assert_text", "selector": "#status",
                          "text": "Not shown", "seconds": 2})
        self.assertEqual(self.browser.pages[-1].events,
                         [("assert_text", "#status", "Not shown", "visible", 2000)])
        self.assertEqual(list((self.folder / REQUESTS).glob("*.json")), [])
        self.assertEqual(list((self.folder / RESPONSES).glob("*.json")), [])

    def test_stale_session_rejected_before_any_browser_action(self):
        # Submit a command file with an old token and rotate the browser key.
        requests = self.folder / REQUESTS
        requests.mkdir()
        (requests / ("a" * 32 + ".json")).write_text(
            json.dumps({"token": self.token, "step": {
                "kind": "click", "selector": "#bad"}}), encoding="utf-8")
        current = create_navigation_session(self.folder, self.pid)
        result = consume_visual_commands(self.browser, self.folder, current)
        self.assertEqual(result["ignored"], 1)
        self.assertEqual(self.browser.pages[0].events, [])

    def test_failed_click_returns_clean_status_without_leaking_page_info(self):
        failing = FakeBrowser(fail=True)
        with self.assertRaisesRegex(RuntimeError, "did not complete"):
            self.execute({"kind": "click", "selector": "button.private"}, browser=failing)
        self.assertEqual(list((self.folder / RESPONSES).glob("*.json")), [])

    def test_invalid_selectors_and_oversized_text_before_write(self):
        for bad in ({"kind": "fill", "selector": "input[type=password]", "text": "bad"},
                    {"kind": "open", "url": "file:///etc/passwd"},
                    {"kind": "scroll", "pixels": 99999},
                    {"kind": "wait_visible", "selector": "#ok", "seconds": 17},
                    {"kind": "assert_text", "selector": "#ok",
                     "text": "ok", "seconds": 17}):
            with self.assertRaises(ValueError):
                self.execute(bad)
        self.assertFalse((self.folder / REQUESTS).exists())

    def test_server_entitlement_failure_never_writes_command(self):
        self.verify.side_effect = PermissionError("Not licensed")
        with self.assertRaises(PermissionError):
            self.execute({"kind": "click", "selector": "#ok"})
        self.assertFalse((self.folder / REQUESTS).exists())

    def test_malformed_command_ignored_without_execution(self):
        folder = self.folder / REQUESTS
        folder.mkdir()
        (folder / ("b" * 32 + ".json")).write_text(
            json.dumps({"token": self.token, "step": {
                "kind": "eval", "code": "alert(1)"}}), encoding="utf-8")
        result = consume_visual_commands(self.browser, self.folder, self.token)
        self.assertEqual(result["ignored"], 1)
        self.assertEqual(self.browser.pages[0].events, [])

    def test_atomic_write_failure_removes_temporary_request(self):
        with patch("visual_ipc.os.replace", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                self.execute({"kind": "open", "url": "https://example.org"})
        self.assertFalse(list((self.folder / REQUESTS).iterdir()))


if __name__ == "__main__":
    unittest.main()
