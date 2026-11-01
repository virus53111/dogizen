"""Real Camoufox addon integration. Run only in the dedicated engine QA job.

Creates an entirely local Firefox WebExtension and HTTP test site.
No external addon downloads, user accounts, proxies or payments.
"""
from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import tempfile
import threading
import zipfile

from addon_manager import enabled_addon_paths, install_addon, set_addon_enabled
from store import Store
from identity import get_identity, host_os


class LocalPage(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"<!doctype html><html><head><title>Murdilimax Addon CI</title></head>"
                         b"<body>Isolated addon test</body></html>")

    def log_message(self, *_args):
        return


def visit(opts, url, expect_addon):
    from camoufox.sync_api import Camoufox
    with Camoufox(**opts) as context:
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=25000)
        assert page.title() == "Murdilimax Addon CI"
        if expect_addon:
            page.wait_for_function(
                "document.documentElement.dataset.murdilimaxAddon === 'enabled'",
                timeout=18000)
        else:
            page.wait_for_timeout(1300)
            assert page.evaluate("document.documentElement.dataset.murdilimaxAddon") != "enabled", (
                "Addon unexpectedly enabled in another/disabled profile")


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), LocalPage)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}/"
    try:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            store = Store(root / "app-data")
            primary = store.add_profile("Addon profile")["id"]
            isolated = store.add_profile("Without addon")["id"]
            xpi = root / "local-test.xpi"
            manifest = {
                "manifest_version": 2,
                "name": "Murdilimax Offline CI Extension",
                "version": "1.0",
                "browser_specific_settings": {
                    "gecko": {"id": "addon-smoke@murdilimax.example"}
                },
                "content_scripts": [{
                    "matches": ["http://127.0.0.1/*"],
                    "js": ["content.js"],
                    "run_at": "document_end",
                }],
            }
            with zipfile.ZipFile(xpi, "w", zipfile.ZIP_DEFLATED) as archive:
                archive.writestr("manifest.json", json.dumps(manifest))
                archive.writestr(
                    "content.js",
                    "document.documentElement.dataset.murdilimaxAddon = 'enabled';")
            addon = install_addon(store, primary, xpi)
            assert len(enabled_addon_paths(store, primary)) == 1
            assert enabled_addon_paths(store, isolated) == []
            profile_folder = store.root / "profiles" / primary
            opts = {
                "headless": True,
                "persistent_context": True,
                "user_data_dir": str(profile_folder / "data"),
                "os": host_os(),
                "fingerprint": get_identity(profile_folder, host_os()),
                "addons": enabled_addon_paths(store, primary),
            }
            visit(opts, url, True)
            other_folder = store.root / "profiles" / isolated
            other = {
                "headless": True, "persistent_context": True,
                "user_data_dir": str(other_folder / "data"),
                "os": host_os(),
                "fingerprint": get_identity(other_folder, host_os()),
                "addons": enabled_addon_paths(store, isolated),
            }
            visit(other, url, False)
            set_addon_enabled(store, primary, addon["id"], False)
            opts["addons"] = enabled_addon_paths(store, primary)
            visit(opts, url, False)
        print("PASS: real Camoufox add-on injection, profile separation and disabled reload")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
