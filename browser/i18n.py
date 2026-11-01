"""RU/EN localization and local preference storage for Murdilimax Browser.

Never translate user-supplied profile names, proxy URLs, or credentials.
This module operates on explicit user-facing UI strings only.
"""
from __future__ import annotations

import json
import os
import re
import tempfile
from pathlib import Path

LANGUAGES = ("ru", "en")

# Conservative literal catalog. Every key is authored UI text; do not pass
# arbitrary profile metadata, user notes, or URLs through this dictionary.
TEXT = {
    "Профили": "Profiles",
    "Прокси": "Proxies",
    "Аккаунт и лицензия": "Account & license",
    "О программе": "About",
    "＋ Профиль": "＋ New profile",
    "✎ Изменить": "✎ Edit",
    "⧉ Дублировать": "⧉ Duplicate",
    "▶ Запустить": "▶ Launch",
    "■ Остановить": "■ Stop",
    "✕ Удалить": "✕ Delete",
    "Экспорт настроек": "Export settings",
    "Импорт настроек": "Import settings",
    "Открыть журнал": "Open log",
    "＋ Добавить прокси": "＋ Add proxy",
    "✎ Изменить прокси": "✎ Edit proxy",
    "✕ Удалить прокси": "✕ Delete proxy",
    "Проверить TCP-порт": "Check TCP port",
    "Проверить выходной IP": "Check exit IP",
    "↗ Подключить аккаунт": "↗ Connect account",
    "◈ Открыть личный кабинет": "◈ Open account",
    "↻ Проверить лицензию": "↻ Check license",
    "Выйти": "Sign out",
    "Поиск (название, группа, теги, заметки)": "Search (name, group, tags, notes)",
    "Cookies хранятся локально в каталоге каждого профиля.": "Cookies stay in each profile's local directory.",
    "TCP-тест проверяет порт. Выходной IP проверяется отдельным HTTPS-запросом через прокси; WebRTC, IPv6 и DNS-утечки этим не подтверждаются. Пароли — в системном хранилище ключей.": "The TCP check only tests the port. A separate HTTPS request tests the proxy exit IP; this does not prove WebRTC, IPv6 or DNS leak protection. Passwords stay in the OS keychain.",
    "YOUR LICENSE / SECURE ACCESS": "YOUR LICENSE / SECURE ACCESS",
    "Один аккаунт. Один компьютер.": "One account. One computer.",
    "Вход через браузер: Google, email-код или passkey. Пароль в настольную программу не вводится.": "Sign in via your browser using an email code or passkey. The desktop app never asks for your password.",
    "Бета-версия: лицензия проверяется через личный кабинет. Stripe используется для оплачиваемых тарифов, если продажи включены сервером. Поддержка Google OAuth и некоторые функции ещё в разработке.": "Beta release: your license is checked through your account. Stripe handles paid plans when server-side sales are enabled. Google OAuth and some features are still being developed.",
    "Локальная бета · не подключён к аккаунту": "Local beta · account not connected",
    "Локальная рабочая область · браузерные профили": "Local workspace · browser profiles",
    "Проверить / установить Camoufox": "Check / install Camoufox",
    "Документация движка": "Engine documentation",
    "Название": "Name",
    "Группа": "Group",
    "Теги": "Tags",
    "ОС отпечатка": "Fingerprint OS",
    "Статус": "Status",
    "Адрес HTTP/SOCKS5": "HTTP/SOCKS5 address",
    "Авторизация": "Authentication",
    "Без прокси": "No proxy",
    "native = ОС компьютера. Отпечаток генерирует Camoufox.": "native = your computer's OS. Camoufox generates the fingerprint.",
    "Сохранить профиль": "Save profile",
    "Сохранить": "Save",
    "Оставь пароль пустым, чтобы сохранить прежний.": "Leave the password blank to keep the current one.",
    "URL: http://host:port или socks5://host:port": "URL: http://host:port or socks5://host:port",
    "Логин (необязательно)": "Username (optional)",
    "Пароль (сохраняется в Keychain)": "Password (saved in OS keychain)",
    "● Запущен": "● Running",
    "○ Остановлен": "○ Stopped",
    "Изменить прокси": "Edit proxy",
    "Новый прокси": "New proxy",
    "КОД:": "CODE:",
    "Не авторизован": "Not authorized",
    "Проверяем серверную лицензию…": "Checking server license…",
    "Запрашиваем одноразовый код…": "Requesting one-time code…",
    "Подтвердите этот код в открывшемся браузере": "Confirm this code in the open browser",
    "Код истёк или подключение отменено": "Code expired or pairing was cancelled",
    "Ошибка загрузки Camoufox: проверьте сеть и доступное место": "Camoufox download failed: check network and disk space",
    "Camoufox установлен и готов к запуску профилей": "Camoufox is installed and ready to launch profiles",
    "Проверка и подготовка Camoufox… Первая загрузка может быть большой.": "Preparing Camoufox… The first download may be large.",
    "Настройки браузерного профиля": "Browser profile settings",
    "Стартовая страница": "Start page",
    "Теги через запятую": "Tags, comma-separated",
    "Заметки": "Notes",
    "Нет": "No",
    "Заголовок": "Title",
    "Удаление": "Delete",
    "Настройки": "Settings",
    "Прокси": "Proxies",
    "Выходной IP": "Exit IP",
    "Копировать": "Copy",
    "Профиль": "Profile",
    "Проверка прокси": "Proxy check",
    "Настройки профиля сохранены": "Profile settings saved",
    "Профили продублированы; cookies и сессии не копировались": "Profiles duplicated; cookies and sessions were not copied",
    "Отправлена команда корректного завершения": "Graceful shutdown command sent",
    "Экспортированы только настройки, без cookies и паролей": "Only settings exported, no cookies or passwords",
    "Проверяем выходной IP через выбранный прокси…": "Checking exit IP via selected proxy…",
    "Ошибка проверки прокси (без раскрытия логина и пароля)": "Proxy check failed (credentials not revealed)",
    "Лог пока пуст": "The log is empty",
    "Профиль": "Profile",
    "Журнал": "Log",
    "Проверка прокси": "Proxy check",
    "Прокси не найден": "Proxy not found",
    "Выбери профили": "Select profiles",
    "Останови профиль перед изменением настроек": "Stop the profile before editing settings",
    "Сначала останови запущенные профили": "Stop running profiles first",
    "Для запуска требуется вход в аккаунт. Откройте вкладку «Аккаунт и лицензия».": "Sign in to launch a profile. Open the Account & license tab.",
    "TCP-порт отвечает. Это НЕ проверка авторизации, DNS, утечек или выходного IP.": "TCP port responds. This does NOT check authentication, DNS, leaks or exit IP.",
    "Не удалось получить выходной IP через прокси. Проверьте адрес, доступность и авторизацию.": "Could not detect proxy exit IP. Check the address, connectivity and authentication.",
    "Не удалось установить браузерный движок. Проверьте интернет, место на диске и повторите попытку.": "Could not install the browser engine. Check your connection and disk space, then retry.",
}
ABOUT_RU = (
    "Murdilimax Browser · независимая настольная бета\n\n"
    "• Изолированные постоянные каталоги сайтов и cookies\n"
    "• Локальные профили, группы, теги, заметки и прокси\n"
    "• Camoufox / Firefox: браузер скачивается при первом запуске\n"
    "• Данные не синхронизируются с облаком и не отправляются разработчику\n"
    "• Экспорт содержит метаданные, но НЕ cookies и пароли\n\n"
    "Важно: это не клон Chromium и не гарантия обхода антифрода.\n"
    "Совместимость Camoufox с macOS Catalina должна пройти реальное тестирование."
)
TEXT[ABOUT_RU] = (
    "Murdilimax Browser · independent desktop beta\n\n"
    "• Separate persistent website directories and cookies\n"
    "• Local profiles, groups, tags, notes and proxies\n"
    "• Camoufox / Firefox: the engine downloads on first launch\n"
    "• Data is not synced to the cloud or uploaded to the developer\n"
    "• Exports contain metadata, NOT cookies or passwords\n\n"
    "Important: this is not Chromium, and bypassing fraud detection is not guaranteed.\n"
    "Compatibility with macOS Catalina still requires real-device testing."
)
# Variable text written by background operations. Patterns match the entire
# program-owned status string; no user-entered data should be localized.
VARIABLE_PATTERNS = (
    (r"^✓ Привязан аккаунт · ([A-Za-z]+) · профилей: (\d+)$", r"✓ Account connected · \1 · profiles: \2"),
    (r"^Профили?:? (.*)$", r"Profiles: \1"),
    (r"^Не удалось проверить вход: (.*)$", r"Could not verify sign-in: \1"),
    (r"^Импортировано профилей: (\d+)$", r"Imported profiles: \1"),
    (r"^Запуск (\d+) браузеров\. Первый запуск загружает Camoufox; смотри журнал\.$",
     r"Launching \1 browsers. First launch downloads Camoufox; see the log."),
    (r"^Внешний IP прокси: ([^·]+) · один HTTPS-запрос$", r"Proxy exit IP: \1 · single HTTPS request"),
    (r"^Ошибка: (.*)$", r"Error: \1"),
    (r"^Выходной IP: ([^\\n]+)\\nПротокол: ([^\\n]+)", r"Exit IP: \1\nProtocol: \2"),
)
REVERSE = {v: k for k, v in TEXT.items() if v != k}


def translate(value: str, language: str) -> str:
    """Translate a known program-authored string, leaving unknown data intact."""
    if language not in LANGUAGES or not isinstance(value, str):
        return value
    if language == "ru":
        return REVERSE.get(value, value)
    known = TEXT.get(value)
    if known is not None:
        return known
    for pattern, replacement in VARIABLE_PATTERNS:
        if re.fullmatch(pattern, value, flags=re.DOTALL):
            return re.sub(pattern, replacement, value, flags=re.DOTALL)
    return value


def load_language(root: Path) -> str:
    """Read only the UI locale, never license/auth or browser metadata."""
    try:
        data = json.loads((Path(root) / "ui-preferences.json").read_text(encoding="utf-8"))
        language = data.get("language")
        return language if language in LANGUAGES else "ru"
    except (OSError, UnicodeError, json.JSONDecodeError, AttributeError):
        return "ru"


def save_language(root: Path, language: str) -> None:
    """Atomic, permission-restricted local preference update."""
    if language not in LANGUAGES:
        raise ValueError("Unsupported UI language")
    directory = Path(root)
    directory.mkdir(parents=True, exist_ok=True)
    temp_name = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8",
                                         dir=str(directory), prefix=".ui-", suffix=".tmp",
                                         delete=False) as temp:
            temp_name = temp.name
            os.chmod(temp_name, 0o600)
            json.dump({"language": language}, temp, ensure_ascii=False)
            temp.flush()
            os.fsync(temp.fileno())
        os.replace(temp_name, directory / "ui-preferences.json")
    finally:
        if temp_name:
            try:
                Path(temp_name).unlink(missing_ok=True)
            except OSError:
                pass
