"""Native Windows acceptance: bounded fpgen identity, stable browser values and cookies.

Uses one local HTTP server. Never visits outside domains or rotates a profile.
"""
from __future__ import annotations

import http.server
from pathlib import Path
import tempfile
import threading

from identity import get_identity, host_os


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        data = b"<html><head><title>Fingerprint QA</title></head><body>Local</body></html>"
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_args):
        pass


def main():
    from camoufox.sync_api import Camoufox
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Site)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        url = f"http://127.0.0.1:{server.server_port}/"
        with tempfile.TemporaryDirectory() as t:
            root = Path(t)
            fp_dir = root / "identity"
            fingerprint = get_identity(fp_dir, host_os(), screen_limit="1920x1080")
            screen = fingerprint.get("screen") or {}
            assert isinstance(screen.get("width"), int), "fpgen did not expose screen width"
            assert isinstance(screen.get("height"), int), "fpgen did not expose screen height"
            assert 0 < screen["width"] <= 1920, "fpgen screen width not within bound"
            assert 0 < screen["height"] <= 1080, "fpgen screen height not within bound"
            opts = {"headless": True, "persistent_context": True,
                    "user_data_dir": str(root / "browser"),
                    "os": host_os(), "fingerprint": fingerprint}
            before = None
            for attempt in range(2):
                assert get_identity(fp_dir, host_os(), generator=lambda **_: 1,
                                    screen_limit="1920x1080") == fingerprint
                with Camoufox(**opts) as browser:
                    page = browser.pages[0] if browser.pages else browser.new_page()
                    page.goto(url, wait_until="domcontentloaded")
                    observed = page.evaluate(
                        "({ua:navigator.userAgent,cpu:navigator.hardwareConcurrency,"
                        "w:screen.width,h:screen.height})")
                    assert 0 < observed["w"] <= 1920 and 0 < observed["h"] <= 1080
                    if attempt == 0:
                        page.evaluate("document.cookie='fp_test=saved; Max-Age=3600; Path=/'")
                        before = observed
                    else:
                        assert observed == before, "Browser identity drift between launches"
                        assert "fp_test=saved" in page.evaluate("document.cookie")
        print("PASS: coherent fpgen-bound Camoufox identity and cookie across two Windows launches")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
