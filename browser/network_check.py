"""Small, explicit proxy exit-IP check.

Only verifies that one HTTPS request reached the public test endpoint through
the configured proxy. It does not prove that Camoufox's WebRTC, DNS, IPv6 or
subresources all follow the same route.
"""
from __future__ import annotations

import ipaddress
from urllib.parse import quote, urlsplit, urlunsplit

ENDPOINT = "https://api.ipify.org?format=json"

def proxy_probe_url(proxy):
    server = proxy["server"]
    parsed = urlsplit(server)
    if parsed.scheme not in ("http", "https", "socks5") or not parsed.hostname:
        raise ValueError("Unsupported proxy protocol")
    scheme = "socks5h" if parsed.scheme == "socks5" else parsed.scheme
    host = parsed.hostname
    if ":" in host:
        host = "[" + host + "]"
    username = proxy.get("username", "")
    password = proxy.get("password", "")
    if (username and not password) or (password and not username):
        raise ValueError("Proxy credentials are incomplete")
    authority = ""
    if username:
        authority = quote(username, safe="") + ":" + quote(password, safe="") + "@"
    authority += host + ":" + str(parsed.port)
    return urlunsplit((scheme, authority, "", "", ""))

def probe_proxy_exit(proxy, timeout=12, session=None):
    import requests
    route = proxy_probe_url(proxy)
    request_session = session or requests.Session()
    request_session.trust_env = False  # never silently route around the chosen proxy
    try:
        response = request_session.get(
            ENDPOINT, timeout=timeout, proxies={"http": route, "https": route},
            headers={"Accept": "application/json"}
        )
        response.raise_for_status()
        address = ipaddress.ip_address(response.json()["ip"])
        if address.is_private or address.is_loopback or address.is_link_local or address.is_multicast:
            raise ValueError("The exit-IP endpoint did not return a public address")
        return {"exit_ip": str(address), "route_type": urlsplit(route).scheme}
    finally:
        if session is None:
            request_session.close()
