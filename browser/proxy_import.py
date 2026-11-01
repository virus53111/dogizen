"""Safe bulk import of unauthenticated proxy endpoints.

Accepts one URI per line (HTTP, HTTPS, SOCKS5).
Credentials are deliberately not accepted in plaintext files. Users may
add them using the existing OS-keychain-backed proxy editor afterward.
Never include raw imported lines in errors or logs.
"""
from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit


MAX_BYTES = 1_000_000
MAX_LINES = 500
SCHEMES = frozenset(("http", "https", "socks5"))


@dataclass(frozen=True)
class ProxyEntry:
    name: str
    server: str
    key: tuple[str, str, int]


def _parse_proxy(value: str, lineno: int) -> ProxyEntry:
    # Never interpolate value in errors; URLs can contain credentials.
    try:
        parsed = urlsplit(value)
        scheme = parsed.scheme.lower()
        host = parsed.hostname
        port = parsed.port
        if (scheme not in SCHEMES or not host or not port or
                parsed.username is not None or parsed.password is not None or
                parsed.query or parsed.fragment or parsed.path not in ("", "/") or
                parsed.netloc.endswith("@") or any(c.isspace() for c in value)):
            raise ValueError
    except (ValueError, TypeError, AttributeError) as exc:
        raise ValueError(
            f"Line {lineno}: expected http://host:port, https://host:port, "
            "or socks5://host:port without credentials"
        ) from None

    # Normalized URLs keep the OS Store's current accepted schemes and syntax.
    # IPv6 literal hosts require brackets in a URL.
    host_url = f"[{host}]" if ":" in host else host.lower()
    normalized = f"{scheme}://{host_url}:{port}"
    display_host = host if len(host) <= 60 else host[:57] + "..."
    name = f"{scheme.upper()} {display_host}:{port}"[:100]
    return ProxyEntry(name=name, server=normalized, key=(scheme, host.lower(), port))


def parse_proxy_list(text: str) -> list[ProxyEntry]:
    """Validate the entire import before writing anything."""
    if not isinstance(text, str) or len(text.encode("utf-8")) > MAX_BYTES:
        raise ValueError("Proxy list must be a UTF-8 text file of at most 1 MB")
    lines = text.splitlines()
    if len(lines) > MAX_LINES:
        raise ValueError("Proxy list is limited to 500 lines")
    entries = []
    seen = set()
    for lineno, raw in enumerate(lines, 1):
        value = raw.strip()
        if not value or value.startswith("#"):
            continue
        entry = _parse_proxy(value, lineno)
        if entry.key not in seen:
            seen.add(entry.key)
            entries.append(entry)
    return entries


def import_proxy_list(store, text: str) -> tuple[int, int]:
    """Import new endpoints and report (added, skipped duplicate entries)."""
    items = parse_proxy_list(text)
    existing = set()
    for entry in store.proxies():
        try:
            u = urlsplit(entry.get("server", ""))
            if u.hostname and u.port and u.scheme.lower() in SCHEMES:
                existing.add((u.scheme.lower(), u.hostname.lower(), u.port))
        except (ValueError, AttributeError, TypeError):
            continue
    added = 0
    duplicates = 0
    for entry in items:
        if entry.key in existing:
            duplicates += 1
            continue
        store.add_proxy(name=entry.name, server=entry.server)
        existing.add(entry.key)
        added += 1
    return added, duplicates
