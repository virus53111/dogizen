"""Render the real Murdilimax marketing pages in Chromium mobile viewports.

Does not open checkout, touch account data, or call paid APIs. Screenshots and
DOM assertions catch cropped pricing CTAs, oversized demo tables and navigation.
"""
from __future__ import annotations
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
OUTPUT=ROOT/"mobile-flows-artifacts"
WIDTHS=(320,360,375,390,412,430,590,768,920)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def log_message(self,*args):
        return

def bounds(page,selector):
    return page.locator(selector).first.bounding_box()

def within_viewport(page, selector, width, min_height=0):
    rect=bounds(page,selector)
    if not rect:
        raise AssertionError(f"Missing visible element {selector}")
    assert rect["x"] >= -2 and rect["x"]+rect["width"] <= width+2, (
        f"{selector} spills outside {width}px viewport: {rect}")
    if min_height:
        assert rect["height"] >= min_height, (
            f"{selector} too small: {rect['height']}px")
    return rect

def check_overflow(page, width, label):
    dims=page.evaluate("""() => ({
        viewport:innerWidth,document:document.documentElement.scrollWidth,
        body:document.body.scrollWidth})""")
    assert dims["viewport"] == width,(label,dims)
    # The body scrollWidth may count clipped decorative pseudo-elements;
    # documentElement.scrollWidth is the actual user-scrollable viewport.
    assert dims["document"] <= width+1,(label,dims)
    if dims["body"] > width+1:
        clipping=page.evaluate("getComputedStyle(document.body).overflowX")
        assert clipping in ("clip","hidden"),(label,dims,clipping)

def test_pricing(page,width):
    assert page.locator('[data-page="pricing"]').is_visible()
    assert page.locator('.pricing-card').count()==4
    assert page.locator('[data-page="home"]').is_hidden()
    check_overflow(page,width,"pricing")
    within_viewport(page,'.pricing-grid',width)
    within_viewport(page,'.page-pricing .page-lead h1',width)
    note=page.locator('.beta-purchase-warning')
    assert note.is_visible(), "Missing paid beta disclosure"
    within_viewport(page,'.beta-purchase-warning',width)
    assert "обязательное применение" in note.inner_text()
    page.locator('[data-lang="en"]').click()
    assert "not enabled by default" in note.inner_text()
    page.locator('[data-lang="ru"]').click()
    assert "обязательное применение" in note.inner_text()
    for cta in page.locator('.page-pricing .price-button').all():
        rect=cta.bounding_box()
        assert rect and rect["x"]>=-2 and rect["x"]+rect["width"]<=width+2,("pricing CTA",width,rect)
        assert rect["height"]>=43,("pricing CTA touch target",width,rect)
    assert page.locator('.pay-link[data-plan="start"]').get_attribute('href').startswith('https://')
    # Only presentation state is toggled; never enter checkout.
    page.locator('[data-method="crypto"]').click()
    assert page.locator('.pay-link[data-plan="start"]').get_attribute('href') is None
    page.locator('[data-method="card"]').click()
    assert page.locator('.pay-link[data-plan="start"]').get_attribute('href').startswith('https://')

def test_workspace(page,width):
    assert page.locator('[data-page="workspace"]').is_visible()
    check_overflow(page,width,"workspace")
    within_viewport(page,'.workspace-shell',width)
    within_viewport(page,'.dash-table-card',width)
    within_viewport(page,'#open-create',width,43)
    assert page.locator('#demo-rows tr').count() >= 2
    if width<=630:
        for td in page.locator('#demo-rows tr:first-child td').all():
            label=td.get_attribute('data-label')
            assert label,("missing mobile card label",width)
            rect=td.bounding_box()
            assert rect and rect["x"]>=-2 and rect["x"]+rect["width"]<=width+2,rect
        assert page.locator('.profile-table').evaluate(
            '(e) => getComputedStyle(e).minWidth') in ("0px","auto")
    page.locator('#profile-search').fill('Atlas')
    assert page.locator('#demo-rows tr').count()>=1
    check_overflow(page,width,"workspace searched")
    page.locator('#profile-search').fill('')
    # Click create, validate mobile dialog stays within screen; no real profile created.
    page.locator('#open-create').click()
    assert page.locator('#profile-dialog').is_visible()
    within_viewport(page,'#profile-dialog',width)
    page.locator('#close-dialog').click()
    assert page.locator('#profile-dialog').is_hidden()
    page.locator('[data-lang="en"]').click()
    assert page.locator('#demo-rows td[data-label]').count()>0
    check_overflow(page,width,"workspace EN")

def test_download(page,width):
    assert page.locator('.mx-download-card').count()==3
    check_overflow(page,width,"download")
    within_viewport(page,'.mx-download-grid',width)
    for cta in page.locator('.mx-download-action').all():
        rect=cta.bounding_box()
        assert rect and rect["x"]>=-2 and rect["x"]+rect["width"]<=width+2,rect
        assert rect["height"]>=45,("download button too short",width,rect)
        assert cta.get_attribute("href"),"Missing actual download URL"
    for item in page.locator('.mx-download-nav a').all():
        rect=item.bounding_box()
        assert rect and rect["x"]>=-2 and rect["x"]+rect["width"]<=width+2,rect
    page.locator('[data-lang="en"]').click()
    check_overflow(page,width,"download EN")

def main():
    server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    failures=[]
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
            for width in WIDTHS:
                for route in ("#pricing","#workspace","download.html"):
                    page=browser.new_page(viewport={"width":width,"height":850},
                        is_mobile=True,has_touch=True,device_scale_factor=2)
                    try:
                        url=f"http://127.0.0.1:{server.server_port}/"
                        page.goto(url+route,wait_until="domcontentloaded",timeout=30000)
                        page.wait_for_timeout(150)
                        if route=="#pricing":test_pricing(page,width)
                        elif route=="#workspace":test_workspace(page,width)
                        else:test_download(page,width)
                        if width in (320,390,430):
                            OUTPUT.mkdir(exist_ok=True)
                            name=route.replace("#","").replace(".html","")
                            page.screenshot(path=str(OUTPUT/f"{name}-{width}.png"),
                                full_page=False,animations="disabled")
                        print("PASS",width,route)
                    except Exception as exc:
                        failures.append(f"{width}px {route}: {exc}")
                        print("FAIL",width,route,exc)
                    finally:
                        page.close()
            browser.close()
    finally:
        server.shutdown();server.server_close()
    if failures:
        raise AssertionError("\n".join(failures))
    print("PASS: 27 mobile screen/route combinations, bilingual controls and CTAs")

if __name__=="__main__":
    main()
