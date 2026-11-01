"""Mobile viewport regression for the live neon landing page.

Runs a local static server and Chromium/Playwright in real phone-size CSS
viewports. Never uses live accounts, payments or browser user cookies.
"""
from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import threading

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SIZES = (320, 360, 375, 390, 412, 430, 590, 768, 920)
OUT = ROOT / "mobile-layout-artifacts"


class QuietStaticHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def validate(page, width):
    result = page.evaluate(
        """() => {
        const rect = selector => {
          const el = document.querySelector(selector);
          if (!el) throw Error('Missing ' + selector);
          const r = el.getBoundingClientRect();
          return { left:r.left, right:r.right, width:r.width,
                   height:r.height, visible:r.width > 0 && r.height > 0 };
        };
        const nav = Array.from(document.querySelectorAll('.main-nav a'))
          .map(el => {const r=el.getBoundingClientRect();
            return {left:r.left,right:r.right,width:r.width}});
        return {
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
          home: rect('.neon-page'),
          hero: rect('.neo-hero'),
          copy: rect('.neo-hero-copy'),
          primary: rect('.neo-primary-btn'),
          secondary: rect('.neo-secondary-btn'),
          illustration: rect('.neo-hero-art'),
          nav
        };
        }"""
    )
    print(f"width={width} doc={result['document']} body={result['body']} "
          f"home={result['home']['width']:.1f} hero={result['hero']['width']:.1f} "
          f"art={result['illustration']['width']:.1f}")

    assert result["viewport"] == width, f"Wrong viewport: {result}"
    assert result["document"] <= width + 1, f"Horizontal document overflow at {width}: {result}"
    for section in ("home", "hero", "copy", "primary", "secondary", "illustration"):
        bounds = result[section]
        assert bounds["visible"], f"Hidden {section}: {bounds}"
        assert bounds["left"] >= -2, f"{section} offscreen left at {width}: {bounds}"
        assert bounds["right"] <= width + 2, (
            f"{section} offscreen right at {width}: {bounds}"
        )
    for item in result["nav"]:
        assert item["left"] >= -2 and item["right"] <= width + 2, (
            f"Navigation link offscreen at {width}: {item}"
        )
    return result


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), QuietStaticHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            for width in SIZES:
                page = browser.new_page(
                    viewport={"width": width, "height": 850},
                    device_scale_factor=2,
                    is_mobile=True,
                    has_touch=True,
                )
                page.goto(
                    f"http://127.0.0.1:{server.server_port}/#home",
                    wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(300)
                try:
                    result = validate(page, width)
                    if width in (320, 360, 390, 430):
                        OUT.mkdir(exist_ok=True)
                        page.screenshot(path=str(OUT / f"home-{width}.png"),
                                        full_page=False, animations="disabled")
                except Exception as exc:
                    errors.append(f"{width}px: {exc}")
                finally:
                    page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    if errors:
        raise AssertionError("\n".join(errors))
    print("PASS: all phone/tablet widths fit viewport, CTAs and nav stay visible")


if __name__ == "__main__":
    main()
