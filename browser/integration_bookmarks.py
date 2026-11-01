"""Real Windows Camoufox acceptance: local bookmark dashboard, click and session persistence."""
from __future__ import annotations

import http.server
from pathlib import Path
import tempfile
import threading

from bookmarks import add_bookmark, bookmarks_for_profile
from identity import get_identity, host_os
from startup_tabs import navigate_startup_tabs
from store import Store


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        payload = b"<html><head><title>Bookmark destination</title></head><body>Local test</body></html>"
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
    def log_message(self, *_):
        pass


def main():
    from camoufox.sync_api import Camoufox
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Site)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with tempfile.TemporaryDirectory() as temp:
            store = Store(Path(temp) / "work")
            target = f"http://127.0.0.1:{server.server_port}/index"
            add_bookmark(store, "Local Docs", target)
            add_bookmark(store, "Only Ads", target, "Ads")
            profile = store.add_profile("Personal", "about:blank", group="Research")
            bookmarks = bookmarks_for_profile(store, profile)
            assert len(bookmarks) == 1
            fingerprint = get_identity(Path(temp) / "identity", host_os())
            opts = dict(persistent_context=True,
                        user_data_dir=str(Path(temp) / "browser-data"),
                        headless=True, fingerprint=fingerprint, os=host_os())
            for index in range(2):
                with Camoufox(**opts) as browser:
                    result = navigate_startup_tabs(
                        browser, profile, bookmarks=bookmarks_for_profile(store, profile))
                    assert result == {"opened": 1, "failed": 0, "requested": 1}, result
                    page = browser.pages[0]
                    assert "Закладки" in page.title()
                    assert page.locator("a.link").count() == 1
                    page.locator("a.link").click()
                    assert page.title() == "Bookmark destination"
                    if index == 0:
                        page.evaluate("document.cookie = 'murdilimax_bookmark_test=ok; Max-Age=3600; Path=/'")
                    else:
                        assert "murdilimax_bookmark_test=ok" in page.evaluate("document.cookie")
        print("PASS: actual Camoufox local bookmark link, group selection and persisted session after restart")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
