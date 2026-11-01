"""User-initiated diagnostic of one configured proxy.

The test covers reachability of the proxy TCP port and one HTTPS request
through that proxy to api.ipify.org. It is NOT an in-browser DNS, WebRTC,
IPv6, fingerprint or full traffic-leak audit. Never log proxy credentials.
"""
from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from urllib.parse import urlsplit
import socket

from network_check import probe_proxy_exit

RESULTS = frozenset({
    "ok", "invalid_proxy", "dns_failure", "tcp_timeout",
    "tcp_refused", "tcp_failure", "exit_failure",
})


@dataclass(frozen=True)
class ProxyDiagnosis:
    status: str
    tcp_ok: bool
    tcp_ms: int | None
    https_ok: bool
    https_ms: int | None
    exit_ip: str | None
    protocol: str
    # The user should never be given a false network-leak safety claim.
    dns_checked: bool = False
    webrtc_checked: bool = False
    ipv6_leak_checked: bool = False


def diagnose_proxy(proxy: dict, *, tcp_timeout: float = 5.0,
                   https_timeout: float = 12.0,
                   connect=socket.create_connection,
                   probe=probe_proxy_exit,
                   clock=perf_counter) -> ProxyDiagnosis:
    """Perform bounded synchronous diagnostics; call from a worker thread."""
    try:
        parsed = urlsplit(proxy["server"])
        host, port = parsed.hostname, parsed.port
        protocol = parsed.scheme.lower()
        if protocol not in ("http", "https", "socks5") or not host or port is None:
            raise ValueError
    except (ValueError, AttributeError, TypeError, KeyError):
        return ProxyDiagnosis("invalid_proxy", False, None, False, None, None, "")

    start = clock()
    try:
        # Probes the proxy's TCP endpoint, NOT a destination via the proxy.
        connection = connect((host, port), timeout=tcp_timeout)
        connection.close()
    except socket.gaierror:
        return ProxyDiagnosis("dns_failure", False, None, False, None, None, protocol)
    except (TimeoutError, socket.timeout):
        return ProxyDiagnosis("tcp_timeout", False, None, False, None, None, protocol)
    except ConnectionRefusedError:
        return ProxyDiagnosis("tcp_refused", False, None, False, None, None, protocol)
    except (OSError, ValueError):
        return ProxyDiagnosis("tcp_failure", False, None, False, None, None, protocol)
    tcp_ms = max(0, round((clock() - start) * 1000))

    start = clock()
    try:
        # Explicit HTTPS through the configured proxy, including OS-keychain
        # credentials provided by Store.proxy_config. Raw errors are not saved.
        data = probe(proxy, timeout=https_timeout)
        ip = data["exit_ip"]
        if not isinstance(ip, str) or len(ip) > 45:
            raise ValueError("Invalid IP response")
        https_ms = max(0, round((clock() - start) * 1000))
    except Exception:
        # requests exceptions often contain proxy username:password in URLs.
        # Deliberately emit only a stable error code, never the exception.
        return ProxyDiagnosis("exit_failure", True, tcp_ms, False, None, None, protocol)
    return ProxyDiagnosis("ok", True, tcp_ms, True, https_ms, ip, protocol)


DIAG_TRANSLATIONS = {
    "ok": ("Успешно", "Passed"),
    "invalid_proxy": ("Некорректный адрес или порт прокси", "Invalid proxy host or port"),
    "dns_failure": ("Не удалось разрешить имя прокси-сервера", "Cannot resolve proxy hostname"),
    "tcp_timeout": ("TCP-соединение не ответило вовремя", "TCP connection timed out"),
    "tcp_refused": ("TCP-порт отклонил соединение", "TCP connection refused"),
    "tcp_failure": ("Не удалось соединиться с TCP-портом", "TCP connection failed"),
    "exit_failure": ("HTTPS-запрос через прокси не прошёл", "HTTPS request via proxy failed"),
}


def describe_diagnosis(result: ProxyDiagnosis, language: str = "ru") -> str:
    """Safe, credential-free plain-text report for one selected proxy."""
    en = language == "en"
    status = DIAG_TRANSLATIONS.get(result.status, DIAG_TRANSLATIONS["tcp_failure"])[int(en)]
    line = "✓" if result.tcp_ok else "✗"
    https_line = "✓" if result.https_ok else "✗"
    if en:
        lines = [
            f"Result: {status}",
            f"{line} Proxy TCP endpoint: " +
            (f"reachable ({result.tcp_ms} ms)" if result.tcp_ok else "unreachable"),
            f"{https_line} HTTPS through proxy: " +
            (f"passed ({result.https_ms} ms)" if result.https_ok else "not confirmed"),
            "Exit IP: " + (result.exit_ip or "not verified"),
            "Protocol: " + (result.protocol.upper() or "unknown"),
            "",
            "Limits: Tests use one external HTTPS endpoint. Browser DNS, "
            "WebRTC, IPv6 leak prevention and fingerprint properties "
            "have NOT been checked.",
        ]
    else:
        lines = [
            f"Результат: {status}",
            f"{line} TCP-порт прокси: " +
            (f"доступен ({result.tcp_ms} мс)" if result.tcp_ok else "недоступен"),
            f"{https_line} HTTPS через прокси: " +
            (f"успешно ({result.https_ms} мс)" if result.https_ok else "не подтверждено"),
            "Выходной IP: " + (result.exit_ip or "не проверен"),
            "Протокол: " + (result.protocol.upper() or "неизвестно"),
            "",
            "Ограничения: использован один внешний HTTPS-сервис. "
            "DNS в браузере, WebRTC, утечки IPv6 и свойства отпечатка "
            "НЕ проверялись.",
        ]
    return "\n".join(lines)
