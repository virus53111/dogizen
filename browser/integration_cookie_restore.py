"""Real Camoufox cookie backup / clear / restore integration test.

Only synthetic local cookies against a loopback HTTP test server; no real
accounts, proxy credentials, payments or third-party websites.
"""
from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading

from cookie_manager import (
    cookie_inventory, clear_cookies, list_cookie_backups,
    restore_cookie_backup,
)
from identity import get_identity
from store import Store


class LocalPage(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(
            b"<!doctype html><html><head><title>Local Cookie Restore QA</title></head>"
            b"<body>Controlled localhost test</body></html>")

    def log_message(self, *_args):
        return


def visit(options, url, expected, set_cookie=False):
    from camoufox.sync_api import Camoufox
    with Camoufox(**options) as browser:
        page = browser.pages[0] if browser.pages else browser.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=25000)
        assert page.title() == "Local Cookie Restore QA"
        if set_cookie:
            page.evaluate(
                "document.cookie = 'murdilimax_restore_qa=synthetic-test-only; "
                "Max-Age=3600; SameSite=Lax; Path=/'")
        text = page.evaluate("document.cookie")
        present = "murdilimax_restore_qa=synthetic-test-only" in text
        assert present is expected, "Local test cookie visibility did not match expected state"


def options_for(store, profile_id):
    folder = store.root / "profiles" / profile_id
    return dict(
        headless=True, persistent_context=True,
        user_data_dir=str(folder / "data"),
        os="linux", fingerprint=get_identity(folder, "linux"),
    )


def main():
    webserver = ThreadingHTTPServer(("127.0.0.1", 0), LocalPage)
    threading.Thread(target=webserver.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{webserver.server_port}/"
    try:
        with tempfile.TemporaryDirectory() as temp:
            store = Store(Path(temp) / "murdilimax-data")
            main_id = store.add_profile("Cookie restore QA")["id"]
            other_id = store.add_profile("Isolated QA")["id"]
            main_options = options_for(store, main_id)
            other_options = options_for(store, other_id)

            visit(main_options, url, expected=True, set_cookie=True)
            assert cookie_inventory(store, main_id).count >= 1
            visit(other_options, url, expected=False)
            visit(main_options, url, expected=True)

            removed, backup = clear_cookies(store, main_id)
            assert removed >= 1 and backup and backup.is_file()
            visit(main_options, url, expected=False)
            assert len(list_cookie_backups(store, main_id)) >= 1
            restored, previous = restore_cookie_backup(store, main_id, backup.name)
            assert restored >= 1 and previous and previous.is_file()
            visit(main_options, url, expected=True)
            visit(other_options, url, expected=False)
        print("PASS: real Camoufox cookie clear, same-profile backup restoration and isolation")
    finally:
        webserver.shutdown()
        webserver.server_close()


if __name__ == "__main__":
    main()
