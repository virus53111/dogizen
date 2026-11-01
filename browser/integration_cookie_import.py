"""Real Camoufox acceptance: import local synthetic JSON cookies and isolate profiles.

No network requests outside a local HTTP server; synthetic cookies only.
"""
from __future__ import annotations

from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sqlite3
import tempfile
import threading

from cookie_import import import_cookies, inspect_cookie_file
from identity import get_identity, host_os
from store import Store


class LocalPage(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(
            b"<!doctype html><title>Local Cookie Import</title>"
            b"<body>Safe offline test</body>")

    def log_message(self, *_args):
        pass


def check(store, profile_id, url, expected, init=False):
    from camoufox.sync_api import Camoufox
    folder = store.root / "profiles" / profile_id
    os_name = host_os()
    opts = {
        "headless": True, "persistent_context": True,
        "user_data_dir": str(folder / "data"), "os": os_name,
        "fingerprint": get_identity(folder, os_name), "geoip": False,
    }
    with Camoufox(**opts) as browser:
        page = browser.pages[0] if browser.pages else browser.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=25000)
        if init:
            # Set an ordinary site cookie using the real document API, as
            # Firefox itself would, before testing the external file import.
            page.evaluate(
                "document.cookie='before=synthetic-old; Max-Age=3600; "
                "Path=/; SameSite=Lax'")
            page.reload()
        actual = {fragment.split("=", 1)[0].strip() for fragment in
                  page.evaluate("document.cookie").split(";") if fragment.strip()}
        assert expected.issubset(actual), (expected, actual)
        assert not ({"imported", "before"} - expected) & actual, actual


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), LocalPage)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"
    try:
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            store = Store(folder / "app")
            first = store.add_profile("Target")["id"]
            other = store.add_profile("Other")["id"]
            check(store, first, url, {"before"}, init=True)
            check(store, other, url, set())
            source = folder / "playwright-cookies.json"
            source.write_text(json.dumps({"cookies": [{
                "name": "imported", "value": "synthetic-new",
                "domain": "127.0.0.1", "path": "/",
                "expires": 1999999999, "httpOnly": False,
                "secure": False, "sameSite": "Lax"
            }], "origins": []}), encoding="utf-8")
            assert inspect_cookie_file(source).count == 1
            count, backup = import_cookies(store, first, source)
            assert count == 1 and backup is not None and backup.is_file()
            with closing(sqlite3.connect(backup)) as conn:
                values = [r[0] for r in conn.execute(
                    "SELECT name FROM moz_cookies")]
            assert "before" in values and "imported" not in values, values
            check(store, first, url, {"before", "imported"})
            check(store, other, url, set())
        print("PASS: local Firefox JSON cookie import, original-state backup and cross-profile isolation")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
