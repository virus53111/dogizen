"""Real Windows Camoufox: execute an original Murdilimax visual block flow.

Runs entirely against a localhost test website. No live account, payment,
third-party websites, screenshots, or external credentials are accessed.
"""
from __future__ import annotations

import http.server
import json
import os
from pathlib import Path
import tempfile
import threading

from identity import get_identity, host_os
from navigation_commands import create_navigation_session, close_navigation_session
from visual_workflows import save_flow
from visual_executor import run_visual_flow
from visual_ipc import submit_visual_step, consume_visual_commands
from store import Store


class LocalPage(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        html = (b"<html><head><title>Flow QA</title></head><body>"
                b"<input id='search' /><button id='submit' "
                b"onclick=\"document.body.dataset.sent=document.querySelector('#search').value;"
                b"document.querySelector('#status').textContent='Flow confirmed'\">"
                b"Send</button><div id='status'></div></body></html>")
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html)
    def log_message(self, *_):
        pass


def main():
    from camoufox.sync_api import Camoufox
    web = http.server.ThreadingHTTPServer(("127.0.0.1", 0), LocalPage)
    threading.Thread(target=web.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory() as temp:
            store = Store(Path(temp) / "data")
            profile = store.add_profile("Test Flow")
            folder = store.root / "profiles" / profile["id"]
            fingerprint = get_identity(folder, host_os())
            url = f"http://127.0.0.1:{web.server_port}/"
            blocks = [
                {"kind": "open", "url": url},
                {"kind": "wait_visible", "selector": "#search", "seconds": 8},
                {"kind": "fill", "selector": "#search", "text": "Murdilimax Flow"},
                {"kind": "click", "selector": "#submit"},
                {"kind": "assert_text", "selector": "#status",
                 "text": "Flow confirmed", "seconds": 8},
                {"kind": "scroll", "pixels": 420},
                {"kind": "wait", "seconds": 1},
            ]
            plan = save_flow(store, "Native Windows QA", [profile["id"]], blocks)
            with Camoufox(headless=True, persistent_context=True,
                          user_data_dir=str(folder / "browser"),
                          os=host_os(), fingerprint=fingerprint) as browser:
                (folder / ".lock").write_text(str(os.getpid()), encoding="ascii")
                token = create_navigation_session(folder, os.getpid())
                try:
                    def dispatch(store, profile_id, step, **kwargs):
                        return submit_visual_step(
                            store, profile_id, step,
                            sleeper=lambda _: consume_visual_commands(browser, folder, token),
                            **kwargs)
                    done = run_visual_flow(store, plan, verify=lambda *_: None,
                                           dispatch=dispatch)
                    assert done == {"state": "completed", "actions": 6}, done
                    page = browser.pages[-1]
                    assert page.title() == "Flow QA"
                    assert page.evaluate("document.body.dataset.sent") == "Murdilimax Flow"
                    page.evaluate("document.cookie='flow_qa=persisted; Max-Age=3600; Path=/'")
                finally:
                    close_navigation_session(folder, token)
                    (folder / ".lock").unlink(missing_ok=True)
            with Camoufox(headless=True, persistent_context=True,
                          user_data_dir=str(folder / "browser"),
                          os=host_os(), fingerprint=fingerprint) as browser:
                page = browser.pages[0] if browser.pages else browser.new_page()
                page.goto(url, wait_until="domcontentloaded")
                assert "flow_qa=persisted" in page.evaluate("document.cookie")
            saved = store._read("visual_flows")
            assert saved[0]["steps"] == blocks
        print("PASS: actual Camoufox visual open/wait-visible/fill/click/assert-text/scroll/wait, acks and persistent cookies")
    finally:
        web.shutdown()
        web.server_close()


if __name__ == "__main__":
    main()
