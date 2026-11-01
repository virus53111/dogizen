"""Local-only real Camoufox proxy routing acceptance test.

The HTTP proxy serves a fake .invalid hostname, which cannot resolve
normally. A correct browser proxy configuration is therefore the only way
to reach it. No external proxy, website, login or payment is used.
"""
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading

from identity import get_identity, host_os
from store import Store

HOSTNAME = "murdilimax-proxy-acceptance.invalid"
MARKER = "murdilimax-local-proxy-ok"


class LocalProxy(BaseHTTPRequestHandler):
    calls = []

    def do_GET(self):
        self.calls.append(self.path)
        if not self.path.startswith(f"http://{HOSTNAME}/"):
            self.send_response(400)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(
            ("<!doctype html><html><head><title>Proxy via Camoufox</title></head>"
             f"<body>{MARKER}</body></html>").encode("utf-8"))

    def log_message(self, *_args):
        return


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), LocalProxy)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://{HOSTNAME}/proxy-route-check"
    try:
        with tempfile.TemporaryDirectory() as temp:
            store = Store(Path(temp) / "data")
            proxy_record = store.add_proxy(
                "Local synthetic HTTP proxy",
                f"http://127.0.0.1:{server.server_port}")
            profile = store.add_profile(
                "Proxy route QA", url=url, proxy_id=proxy_record["id"])
            profile_folder = store.root / "profiles" / profile["id"]
            opts = dict(
                headless=True, persistent_context=True,
                user_data_dir=str(profile_folder / "data"),
                os=host_os(),
                fingerprint=get_identity(profile_folder, host_os()),
                proxy=store.proxy_config(profile["proxy_id"]),
                geoip=False,
            )
            from camoufox.sync_api import Camoufox
            with Camoufox(**opts) as browser:
                page = browser.pages[0] if browser.pages else browser.new_page()
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
                assert page.title() == "Proxy via Camoufox", (
                    "The target page did not load through the selected proxy")
                assert MARKER in page.locator("body").inner_text()
            assert any(
                request.startswith(f"http://{HOSTNAME}/proxy-route-check")
                for request in LocalProxy.calls), (
                "Proxy never received the actual Firefox page request")
        print("PASS: Real Camoufox uses configured local HTTP proxy on this OS")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
