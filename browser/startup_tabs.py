"""User-controlled extra startup tabs for each isolated local Camoufox profile.

Strict bounded metadata; never loads remote scripts or handles credentials.
Only http(s) URLs are accepted and no browser state is transferred.
"""
from __future__ import annotations

from urllib.parse import urlsplit

MAX_EXTRA_TABS = 7
MAX_URL_LENGTH = 2048


def normalize_extra_urls(urls, *, primary="about:blank"):
    """Validate a full list before any profile metadata is written.

    The existing primary start URL stays in the normal profile 'url' field.
    Extra tabs are at most seven unique http(s) URLs, with no URL userinfo.
    """
    if not isinstance(urls, (list, tuple)) or isinstance(urls, str):
        raise ValueError("Startup tabs must be a list of URLs")
    if len(urls) > MAX_EXTRA_TABS:
        raise ValueError("Up to 7 additional startup tabs are supported")
    if not isinstance(primary, str):
        raise ValueError("Invalid primary startup page")
    result = []
    seen = {primary}
    for raw in urls:
        if not isinstance(raw, str):
            raise ValueError("Invalid startup tab URL")
        url = raw.strip()
        if (not url or len(url) > MAX_URL_LENGTH or
                any(char.isspace() or ord(char) < 32 or ord(char) == 127
                    for char in url)):
            raise ValueError("Startup tab must be a valid URL without whitespace")
        try:
            parsed = urlsplit(url)
            valid = (parsed.scheme in ("http", "https") and
                     bool(parsed.hostname) and
                     parsed.username is None and parsed.password is None and
                     parsed.port != 0)
        except ValueError:
            valid = False
        if not valid:
            raise ValueError("Startup tabs support only http(s) URLs without credentials")
        if url not in seen:
            result.append(url)
            seen.add(url)
    return result


def navigate_startup_tabs(context, profile, *, bookmarks=()):
    """Open the main URL and validated extras in the same Camoufox context.

    Errors are collected as counts, never with possibly sensitive URLs in
    log messages. A failed secondary tab is closed without stopping the
    remaining tabs. The normal persistent profile remains unchanged.
    """
    primary = profile.get("url", "about:blank") or "about:blank"
    if not isinstance(primary, str):
        raise ValueError("Invalid primary startup URL")
    if primary != "about:blank":
        normalized = normalize_extra_urls([primary], primary="about:blank")
        if len(normalized) != 1:
            raise ValueError("Invalid primary startup URL")
    extras = normalize_extra_urls(profile.get("startup_urls", []), primary=primary)
    dashboard = None
    if primary == "about:blank" and bookmarks:
        from bookmarks import bookmark_dashboard
        dashboard = bookmark_dashboard(bookmarks)
    existing = context.pages
    page = existing[0] if existing else context.new_page()
    loaded, failed = 0, 0
    try:
        page.goto(primary, wait_until="domcontentloaded", timeout=20000)
        if dashboard is not None:
            page.set_content(dashboard, wait_until="domcontentloaded")
        loaded += 1
    except Exception:
        failed += 1
    for url in extras:
        extra_page = None
        try:
            extra_page = context.new_page()
            extra_page.goto(url, wait_until="domcontentloaded", timeout=20000)
            loaded += 1
        except Exception:
            failed += 1
            if extra_page is not None:
                try:
                    extra_page.close()
                except Exception:
                    pass
    return {"opened": loaded, "failed": failed, "requested": 1 + len(extras)}
