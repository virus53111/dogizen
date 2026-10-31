"""Explicit browser integration test. Requires Camoufox engine; not run by offline unit suite."""
import contextlib
import http.server
import tempfile
import threading
from pathlib import Path

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
            with Camoufox(persistent_context=True, user_data_dir=root,
                          headless=True, os="linux") as first:
                page = first.pages[0] if first.pages else first.new_page()
                page.goto(url)
                assert page.title() == "Orbit Browser Test"
                page.evaluate("document.cookie = 'orbit_profile_test=survived; Max-Age=3600; SameSite=Lax; Path=/'")
                assert "orbit_profile_test=survived" in page.evaluate("document.cookie")
            with Camoufox(persistent_context=True, user_data_dir=root,
                          headless=True, os="linux") as second:
                page = second.pages[0] if second.pages else second.new_page()
                page.goto(url)
                cookie = page.evaluate("document.cookie")
                assert "orbit_profile_test=survived" in cookie, "Cookie did not persist across browser launches"
        print("PASS: real Camoufox launch, HTTP navigation and cookie persistence")
    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    main()
