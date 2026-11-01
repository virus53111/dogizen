"""Real Camoufox test for separately opened local startup tabs."""
from __future__ import annotations

import http.server
from pathlib import Path
import tempfile
import threading

from startup_tabs import navigate_startup_tabs
from identity import get_identity, host_os


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        name = self.path.strip("/") or "first"
        content = f"<html><title>{name}</title><body>startup tab: {name}</body></html>"
        data = content.encode("utf-8")
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
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    try:
        origin = f"http://127.0.0.1:{server.server_port}"
        profile = {"url": origin + "/first", "startup_urls": [
            origin + "/second", origin + "/third"]}
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            fingerprint = get_identity(root / "identity", host_os())
            cfg = dict(persistent_context=True, user_data_dir=str(root / "data"),
                       headless=True, os=host_os(), fingerprint=fingerprint)
            with Camoufox(**cfg) as first:
                outcome = navigate_startup_tabs(first, profile)
                assert outcome == {"opened": 3, "failed": 0, "requested": 3}, outcome
                titles = [p.title() for p in first.pages]
                for expected in ("first", "second", "third"):
                    assert expected in titles, (expected, titles)
            with Camoufox(**cfg) as second:
                outcome = navigate_startup_tabs(second, profile)
                assert outcome == {"opened": 3, "failed": 0, "requested": 3}, outcome
                titles = [p.title() for p in second.pages]
                for expected in ("first", "second", "third"):
                    assert expected in titles, (expected, titles)
        print("PASS: three distinct Camoufox startup tabs on initial and repeat launch")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
