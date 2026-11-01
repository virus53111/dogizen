"""Explicit browser integration test. Requires Camoufox engine; not run by offline unit suite."""
import contextlib
import http.server
import tempfile
import threading
from pathlib import Path

from identity import get_identity, host_os

class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"<html><title>Orbit Browser Test</title><body>Local profile test</body></html>")
    def log_message(self, *_args):
        return

def main():
    from camoufox.sync_api import Camoufox
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Site)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = "http://127.0.0.1:" + str(server.server_port) + "/"
    try:
        with tempfile.TemporaryDirectory() as temp:
            root = str(Path(temp) / "persistent")
            identity_dir = Path(temp) / "identity"
            fingerprint = get_identity(identity_dir, host_os())
            opts = dict(persistent_context=True, user_data_dir=root,
                        headless=True, os=host_os(), fingerprint=fingerprint)
            with Camoufox(**opts) as first:
                page = first.pages[0] if first.pages else first.new_page()
                page.goto(url)
                assert page.title() == "Orbit Browser Test"
                page.evaluate("document.cookie = 'orbit_profile_test=survived; Max-Age=3600; SameSite=Lax; Path=/'")
                assert "orbit_profile_test=survived" in page.evaluate("document.cookie")
                before = page.evaluate("({ua:navigator.userAgent,cpu:navigator.hardwareConcurrency,screen:screen.width,language:navigator.language})")
            assert get_identity(identity_dir, host_os(), generator=lambda **_: 1) == fingerprint
            with Camoufox(**opts) as second:
                page = second.pages[0] if second.pages else second.new_page()
                page.goto(url)
                cookie = page.evaluate("document.cookie")
                assert "orbit_profile_test=survived" in cookie, "Cookie did not persist across browser launches"
                after = page.evaluate("({ua:navigator.userAgent,cpu:navigator.hardwareConcurrency,screen:screen.width,language:navigator.language})")
                assert before == after, f"Identity drift between relaunches: {before} != {after}"
            # A separate profile must not inherit the first profile's site cookies.
            other_root = str(Path(temp) / "separate-browser-data")
            other_identity = get_identity(Path(temp) / "separate-identity", host_os())
            other_opts = dict(persistent_context=True, user_data_dir=other_root,
                              headless=True, os=host_os(), fingerprint=other_identity)
            with Camoufox(**other_opts) as isolated:
                isolated_page = isolated.pages[0] if isolated.pages else isolated.new_page()
                isolated_page.goto(url)
                assert "orbit_profile_test" not in isolated_page.evaluate("document.cookie"), (
                    "Different profiles unexpectedly shared cookies"
                )
        print("PASS: real Camoufox HTTP navigation, persistence, baseline identity and cross-profile cookie isolation")
    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    main()
