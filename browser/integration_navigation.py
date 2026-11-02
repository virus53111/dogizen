"""Native Windows acceptance for private navigation in an actual Camoufox context.

Only navigates to an ephemeral loopback HTTP server. Never exercises live sites.
"""
from __future__ import annotations

import http.server
import os
from pathlib import Path
import tempfile
import threading

from identity import get_identity, host_os
from navigation_commands import (COMMAND_DIR, close_navigation_session,
                                 consume_navigation, create_navigation_session,
                                 submit_navigation)
from store import Store


class LocalWeb(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = b"<html><head><title>Navigation accepted</title></head><body>local</body></html>"
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *_):
        pass


def main():
    from camoufox.sync_api import Camoufox
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), LocalWeb)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            store = Store(root / "local")
            profile = store.add_profile("QA browser")
            folder = store.root / "profiles" / profile["id"]
            lock = folder / ".lock"
            fingerprint = get_identity(folder, host_os())
            url = f"http://127.0.0.1:{server.server_port}/navigation"
            with Camoufox(
                    headless=True, persistent_context=True,
                    user_data_dir=str(folder / "data"), os=host_os(),
                    fingerprint=fingerprint) as context:
                lock.write_text(str(os.getpid()), encoding="ascii")
                token = create_navigation_session(folder, os.getpid())
                try:
                    result = submit_navigation(
                        store, [profile["id"]], url,
                        alive=lambda pid: pid == os.getpid(),
                        verify=lambda *_: None)
                    assert result == {"queued": 1}, result
                    event = consume_navigation(context, folder, token)
                    assert event == {"opened": 1, "failed": 0, "ignored": 0}, event
                    page = context.pages[-1]
                    assert page.title() == "Navigation accepted", page.title()
                    page.evaluate("document.cookie='murdilimax_nav=ok; Max-Age=3600; Path=/'")
                    # A request from the previous browser session is never
                    # applied to a replaced child, even if OS PID is reused.
                    submit_navigation(store, [profile["id"]], url,
                                      alive=lambda pid: pid == os.getpid(),
                                      verify=lambda *_: None)
                    old = token
                    token = create_navigation_session(folder, os.getpid())
                    stale = consume_navigation(context, folder, token)
                    assert stale["ignored"] == 1 and stale["opened"] == 0, stale
                    assert not close_navigation_session(folder, old)
                finally:
                    close_navigation_session(folder, token)
                    lock.unlink(missing_ok=True)
            with Camoufox(
                    headless=True, persistent_context=True,
                    user_data_dir=str(folder / "data"), os=host_os(),
                    fingerprint=fingerprint) as browser:
                p = browser.pages[0] if browser.pages else browser.new_page()
                p.goto(url, wait_until="domcontentloaded")
                assert "murdilimax_nav=ok" in p.evaluate("document.cookie")
                assert not list((folder / COMMAND_DIR).glob("*.json"))
        print("PASS: real Windows Camoufox session-bound navigation, stale-request rejection, persisted cookies")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
