"""Murdilimax Browser desktop workspace (Tkinter; Windows/macOS)."""
from __future__ import annotations
import argparse
import os
import socket
import subprocess
import sys
import tempfile
import threading
import time
import tkinter as tk
import webbrowser
from pathlib import Path
from tkinter import filedialog, messagebox, simpledialog, ttk
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

from auth_client import BrowserAccount
from engine import pid_alive, request_stop, run_profile, start_background, safe_profile_id
from network_check import probe_proxy_exit
from proxy_diagnostics import diagnose_proxy, describe_diagnosis
from profile_view import ALL, RUNNING, STOPPED, filter_profiles, distinct_groups, bulk_update_groups
from cookie_manager import cookie_inventory, export_cookies, clear_cookies
from proxy_import import import_proxy_list
from engine_setup import ensure_engine_ready
from store import Store
from neon_theme import BG, PANEL, TEXT, MUTED, ACCENT, CYAN, apply_neon_theme, NeonHeader
from i18n import load_language, save_language, translate

class BrowserUI:
    def __init__(self):
        self.store = Store()
        self.language = load_language(self.store.root)
        self._status_original = {}
        self._localizing = False
        self.account = BrowserAccount()
        self.authorized = False
        self.plan = 'free'
        self.entitlement_limit = 3
        self.pairing = None
        self.root = tk.Tk()
        try:
            icon_root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[1]))
            image = icon_root / "assets" / "generated" / "app-icon-512.png"
            if image.exists():
                self._window_icon = tk.PhotoImage(file=str(image))
                self.root.iconphoto(True, self._window_icon)
        except (tk.TclError, OSError):
            pass  # Window-manager icon is cosmetic; never block startup.
        self.root.title("Murdilimax Browser — Studio")
        self.root.geometry("1220x750")
        self.root.minsize(920, 620)
        self.root.configure(bg=BG)
        self.search = tk.StringVar()
        self.group_filter_key = None
        self.status_filter_key = ALL
        self.proxy_filter_key = None
        self._filter_signature = None
        self.state = tk.StringVar(value="Локальная рабочая область · браузерные профили")
        apply_neon_theme(self.root)
        self.header = NeonHeader(self.root, self.open_folder)
        language_bar = ttk.Frame(self.root)
        language_bar.pack(fill="x", padx=28, pady=(0, 2))
        ttk.Label(language_bar, text="LANGUAGE / ЯЗЫК", foreground=ACCENT).pack(side="left", padx=(1, 13))
        self.language_buttons = {}
        for lang in ("ru", "en"):
            button = ttk.Button(language_bar, text=lang.upper(),
                                command=lambda choice=lang: self.set_language(choice))
            button.pack(side="left", padx=3, pady=3)
            self.language_buttons[lang] = button
        self.tabs = ttk.Notebook(self.root)
        self.tabs.pack(fill="both", expand=True, padx=22, pady=8)
        self.profile_tab = ttk.Frame(self.tabs)
        self.proxy_tab = ttk.Frame(self.tabs)
        self.info_tab = ttk.Frame(self.tabs)
        self.account_tab = ttk.Frame(self.tabs)
        self.tabs.add(self.profile_tab, text="Профили")
        self.tabs.add(self.proxy_tab, text="Прокси")
        self.tabs.add(self.account_tab, text="Аккаунт и лицензия")
        self.tabs.add(self.info_tab, text="О программе")
        self.setup_profiles()
        self.setup_proxies()
        self.setup_account()
        self.setup_info()
        status_frame = tk.Frame(self.root, bg="#192140", highlightbackground="#544b8e",
                                highlightthickness=1)
        status_frame.pack(fill="x", padx=24, pady=(5, 16))
        tk.Label(status_frame, text="●", bg="#192140", fg="#5be6b4",
                 font=("Arial", 13, "bold")).pack(side="left", padx=(14, 8))
        tk.Label(status_frame, textvariable=self.state, anchor="w", bg="#192140",
                 fg=MUTED, font=("Arial", 10)).pack(side="left", fill="x", expand=True,
                                                   pady=11)
        tk.Label(status_frame, text="NEON  /  BETA", bg="#192140",
                 fg=ACCENT, font=("Arial", 9, "bold")).pack(side="right", padx=15)
        for variable in (self.state, self.account_message, self.account_code):
            self._status_original[id(variable)] = variable.get()
            variable.trace_add("write", lambda *_args, var=variable: self._status_changed(var))
        self.apply_language(self.root)
        self.refresh()
        self.root.after(2500, self.refresh_status)
        self.root.after(1500, self.restore_login)
        self.root.after(300000, self.license_tick)

    def _status_changed(self, variable):
        if self._localizing:
            return
        source = variable.get()
        self._status_original[id(variable)] = source
        result = translate(source, self.language)
        if result != source:
            self._localizing = True
            try:
                variable.set(result)
            finally:
                self._localizing = False

    def set_language(self, language):
        if language not in ("ru", "en") or language == self.language:
            return
        try:
            save_language(self.store.root, language)
        except OSError as exc:
            messagebox.showerror("Murdilimax", str(exc), parent=self.root)
            return
        self.language = language
        self.apply_language(self.root)
        self._localizing = True
        try:
            for variable in (self.state, self.account_message, self.account_code):
                source = self._status_original.get(id(variable), variable.get())
                variable.set(translate(source, language))
        finally:
            self._localizing = False
        self.update_filter_labels()

    def apply_language(self, widget):
        # Translate only authored UI strings, not profile names, notes,
        # proxy credentials, URLs, or other user data.
        for item in [widget] + list(self._descendants(widget)):
            if isinstance(item, (ttk.Label, ttk.Button, tk.Label, tk.Button)):
                try:
                    value = item.cget("text")
                    localized = translate(value, self.language)
                    if localized != value:
                        item.configure(text=localized)
                except tk.TclError:
                    pass
            if isinstance(item, ttk.Notebook):
                for tab in item.tabs():
                    value = item.tab(tab, "text")
                    localized = translate(value, self.language)
                    if localized != value:
                        item.tab(tab, text=localized)
            if isinstance(item, ttk.Treeview):
                for column in item["columns"]:
                    value = item.heading(column, "text")
                    localized = translate(value, self.language)
                    if localized != value:
                        item.heading(column, text=localized)
        if widget is not self.root and isinstance(widget, tk.Toplevel):
            widget.title(translate(widget.title(), self.language))
        for lang, button in self.language_buttons.items():
            button.configure(style="Neon.TButton" if lang == self.language else "TButton")

    def _descendants(self, widget):
        for child in widget.winfo_children():
            yield child
            yield from self._descendants(child)

    def account_url(self, url):
        """Carry UI language into secure account pages without changing auth."""
        parsed = urlsplit(url)
        if parsed.scheme != "https" or parsed.hostname != "murdilimax-browser.hatchable.site":
            return url
        params = [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True)
                  if key != "lang"]
        params.append(("lang", self.language))
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path,
                           urlencode(params), parsed.fragment))

    def button(self, parent, label, command):
        style = "Neon.TButton" if label.startswith(("＋", "▶", "↗")) else "TButton"
        ttk.Button(parent, text=label, style=style, command=lambda: self.call(command)).pack(side="left", padx=(0, 7), pady=5)

    def call(self, action):
        try:
            action()
        except Exception as exc:
            messagebox.showerror("Murdilimax Browser", str(exc), parent=self.root)
            self.state.set("Ошибка: " + str(exc)[:150])

    def setup_profiles(self):
        bar = ttk.Frame(self.profile_tab)
        bar.pack(fill="x", pady=10, padx=12)
        self.button(bar, "＋ Профиль", self.new_profile)
        self.button(bar, "✎ Изменить", self.edit_profile)
        self.button(bar, "⧉ Дублировать", self.duplicate)
        self.button(bar, "▶ Запустить", self.start)
        self.button(bar, "■ Остановить", self.stop)
        self.button(bar, "✕ Удалить", self.delete)
        search = ttk.Frame(self.profile_tab)
        search.pack(fill="x", padx=12, pady=6)
        ttk.Label(search, text="Поиск (название, группа, теги, заметки)").pack(side="left", padx=(0, 14))
        e = ttk.Entry(search, textvariable=self.search, width=48)
        e.pack(side="left", fill="x", expand=True)
        self.search.trace_add("write", lambda *_: self.refresh_profiles())
        filters = ttk.Frame(self.profile_tab)
        filters.pack(fill="x", padx=12, pady=(1, 7))
        self.group_filter_label = ttk.Label(filters, text="Группа:")
        self.group_filter_label.pack(side="left", padx=(0, 6))
        self.group_filter_var = tk.StringVar()
        self.group_filter_combo = ttk.Combobox(filters, textvariable=self.group_filter_var,
                                               state="readonly", width=20)
        self.group_filter_combo.pack(side="left", padx=(0, 13))
        self.group_filter_combo.bind("<<ComboboxSelected>>", self.on_group_filter)
        self.status_filter_label = ttk.Label(filters, text="Статус:")
        self.status_filter_label.pack(side="left", padx=(0, 6))
        self.status_filter_var = tk.StringVar()
        self.status_filter_combo = ttk.Combobox(filters, textvariable=self.status_filter_var,
                                                state="readonly", width=14)
        self.status_filter_combo.pack(side="left", padx=(0, 13))
        self.status_filter_combo.bind("<<ComboboxSelected>>", self.on_status_filter)
        self.proxy_filter_label = ttk.Label(filters, text="Прокси:")
        self.proxy_filter_label.pack(side="left", padx=(0, 6))
        self.proxy_filter_var = tk.StringVar()
        self.proxy_filter_combo = ttk.Combobox(filters, textvariable=self.proxy_filter_var,
                                               state="readonly", width=23)
        self.proxy_filter_combo.pack(side="left", padx=(0, 9))
        self.proxy_filter_combo.bind("<<ComboboxSelected>>", self.on_proxy_filter)
        ttk.Button(filters, text="Сбросить фильтры",
                   command=self.reset_profile_filters).pack(side="left")
        cols = ("name", "group", "tags", "proxy", "os", "status")
        self.profile_tree = ttk.Treeview(self.profile_tab, columns=cols, show="headings", selectmode="extended")
        for key, title, width in [("name", "Название", 230), ("group", "Группа", 130),
                                  ("tags", "Теги", 180), ("proxy", "Прокси", 140),
                                  ("os", "ОС отпечатка", 115), ("status", "Статус", 110)]:
            self.profile_tree.heading(key, text=title)
            self.profile_tree.column(key, width=width, stretch=True)
        self.profile_tree.pack(fill="both", expand=True, padx=12, pady=7)
        self.profile_tree.bind("<Double-1>", lambda _: self.call(self.edit_profile))
        bulk = ttk.Frame(self.profile_tab)
        bulk.pack(fill="x", padx=12, pady=(3, 3))
        self.button(bulk, "Выбрать видимые", self.select_visible_profiles)
        self.button(bulk, "Изменить группу", self.change_selected_groups)
        self.profile_stats = tk.StringVar(value="")
        ttk.Label(bulk, textvariable=self.profile_stats,
                  foreground=CYAN).pack(side="right", padx=(8, 4))
        tools = ttk.Frame(self.profile_tab)
        tools.pack(fill="x", padx=12, pady=8)
        self.button(tools, "Экспорт настроек", self.export)
        self.button(tools, "Импорт настроек", self.import_profiles)
        self.button(tools, "Открыть журнал", self.open_log)
        cookie_bar = ttk.Frame(self.profile_tab)
        cookie_bar.pack(fill="x", padx=12, pady=(0, 6))
        ttk.Label(cookie_bar, text="COOKIES / LOCAL", foreground=CYAN).pack(
            side="left", padx=(0, 12))
        self.button(cookie_bar, "◉ Cookies", self.show_cookie_inventory)
        self.button(cookie_bar, "⇩ Экспорт cookies", self.export_profile_cookies)
        self.button(cookie_bar, "✕ Очистить cookies", self.clear_profile_cookies)
        ttk.Label(cookie_bar, text="Только остановленный профиль",
                  foreground=MUTED).pack(side="right", padx=8)

    def setup_proxies(self):
        bar = ttk.Frame(self.proxy_tab)
        bar.pack(fill="x", padx=12, pady=10)
        self.button(bar, "＋ Добавить прокси", self.new_proxy)
        self.button(bar, "⇩ Импорт .txt", self.import_proxies_txt)
        self.button(bar, "✎ Изменить прокси", self.edit_proxy)
        self.button(bar, "✕ Удалить прокси", self.remove_proxy)
        self.button(bar, "Проверить TCP-порт", self.check_proxy)
        self.button(bar, "Проверить выходной IP", self.check_proxy_exit)
        self.button(bar, "◈ Диагностика", self.diagnose_selected_proxy)
        self.proxy_tree = ttk.Treeview(self.proxy_tab, columns=("name", "server", "auth"), show="headings")
        for k, label, width in [("name", "Название", 200), ("server", "Адрес HTTP/SOCKS5", 460),
                                ("auth", "Авторизация", 160)]:
            self.proxy_tree.heading(k, text=label)
            self.proxy_tree.column(k, width=width)
        self.proxy_tree.pack(fill="both", expand=True, padx=12, pady=8)
        self.proxy_tree.bind("<Double-1>", lambda _: self.call(self.edit_proxy))
        ttk.Label(self.proxy_tab,
                  text="TCP-тест проверяет порт. Выходной IP проверяется отдельным HTTPS-запросом через прокси; WebRTC, IPv6 и DNS-утечки этим не подтверждаются. Пароли — в системном хранилище ключей.",
                  foreground=MUTED, wraplength=1000).pack(anchor="w", padx=14, pady=10)

    def setup_account(self):
        outer = ttk.Frame(self.account_tab)
        outer.pack(fill="both", expand=True, padx=32, pady=26)
        tk.Label(outer, text="YOUR LICENSE / SECURE ACCESS", bg=BG, fg=ACCENT,
                 font=("Arial", 11, "bold")).pack(anchor="w", pady=(2, 10))
        tk.Label(outer, text="Один аккаунт. Один компьютер.", bg=BG, fg=TEXT,
                 font=("Georgia", 26)).pack(anchor="w", pady=(0, 13))
        tk.Label(outer, text="Вход через браузер: Google, email-код или passkey. Пароль в настольную программу не вводится.",
                 bg=BG, fg=MUTED, font=("Arial", 11), wraplength=780, justify="left").pack(anchor="w")
        self.account_message = tk.StringVar(value="Локальная бета · не подключён к аккаунту")
        self.account_code = tk.StringVar(value="")
        tk.Label(outer, textvariable=self.account_message, bg=BG, fg=ACCENT,
                 font=("Arial", 12), wraplength=780, justify="left").pack(anchor="w", pady=(26, 12))
        tk.Label(outer, textvariable=self.account_code, bg=BG, fg=TEXT,
                 font=("Georgia", 21, "bold")).pack(anchor="w", pady=(0, 15))
        bar = ttk.Frame(outer)
        bar.pack(anchor="w", pady=(7, 15))
        self.button(bar, "↗ Подключить аккаунт", self.begin_login)
        self.button(bar, "◈ Открыть личный кабинет",
                    lambda: webbrowser.open(self.account_url("https://murdilimax-browser.hatchable.site/account.html")))
        self.button(bar, "↻ Проверить лицензию", self.check_license)
        self.button(bar, "Выйти", self.logout)
        tk.Label(outer, text="Бета-версия: лицензия проверяется через личный кабинет. "
                 "Stripe используется для оплачиваемых тарифов, если продажи включены сервером. "
                 "Поддержка Google OAuth и некоторые функции ещё в разработке.",
                 bg=BG, fg=MUTED, font=("Arial", 10), wraplength=800, justify="left").pack(anchor="w", pady=(12, 0))

    def license_tick(self):
        """Never keep a paid UI entitlement indefinitely without a fresh server check."""
        try:
            if self.authorized:
                self.check_license()
        finally:
            if self.root.winfo_exists():
                self.root.after(300000, self.license_tick)

    def restore_login(self):
        if not self.account.load_token():
            return
        self.check_license()

    def update_license(self, data):
        self.authorized = bool(data.get("authorized"))
        self.plan = data.get("tier", "free") if self.authorized else "free"
        self.entitlement_limit = min(1000, max(0, int((data.get("entitlements") or {}).get("profiles", 3)))) if self.authorized else 3
        self.account_message.set("✓ Привязан аккаунт · " + self.plan.upper()
                                 + " · профилей: " + str(self.entitlement_limit) if self.authorized else "Не авторизован")
        self.account_code.set("")

    def check_license(self):
        self.account_message.set("Проверяем серверную лицензию…")
        def work():
            try:
                data = self.account.verify()
                if not data.get("authorized"):
                    raise RuntimeError(str(data.get("error", "Лицензия недействительна")))
                self.root.after(0, lambda: self.update_license(data))
            except Exception as exc:
                self.root.after(0, lambda msg=str(exc): self.license_error(msg))
        threading.Thread(target=work, daemon=True).start()

    def license_error(self, message):
        self.authorized = False
        self.plan = "free"
        self.entitlement_limit = 3
        self.account_message.set("Не удалось проверить вход: " + message[:130])

    def begin_login(self):
        if self.pairing is not None:
            raise ValueError("Подключение уже выполняется")
        self.account_message.set("Запрашиваем одноразовый код…")
        def worker():
            try:
                data = self.account.begin()
                code,secret = data["code"],data["device_secret"]
                self.pairing = (code,secret)
                self.root.after(0, lambda: self.account_code.set("КОД: " + code))
                self.root.after(0, lambda: self.account_message.set("Подтвердите этот код в открывшемся браузере"))
                webbrowser.open(self.account_url(data["verification_uri"]))
                expires = time.monotonic() + min(600,int(data.get("expires_in",600)))
                while time.monotonic() < expires and self.pairing == (code,secret):
                    time.sleep(max(3,int(data.get("interval",3))))
                    result = self.account.poll(code,secret)
                    if result.get("status") == "authorized":
                        self.account.save_token(result["token"])
                        license_data = self.account.verify()
                        if not license_data.get("authorized"):
                            raise RuntimeError("Сервер не подтвердил лицензию")
                        self.root.after(0, lambda d=license_data: self.update_license(d))
                        return
                    if result.get("status") in ("expired","consumed"):
                        break
                self.root.after(0, lambda: self.account_message.set("Код истёк или подключение отменено"))
            except Exception as exc:
                self.root.after(0, lambda msg=str(exc): self.license_error(msg))
            finally:
                self.pairing = None
        threading.Thread(target=worker, daemon=True).start()

    def logout(self):
        self.pairing = None
        def worker():
            try:
                self.account.revoke()
            except Exception:
                self.account.forget_token()
            self.root.after(0, lambda: self.update_license({}))
        threading.Thread(target=worker, daemon=True).start()

    def setup_info(self):
        intro = ("Murdilimax Browser · независимая настольная бета\n\n"
                 "• Изолированные постоянные каталоги сайтов и cookies\n"
                 "• Локальные профили, группы, теги, заметки и прокси\n"
                 "• Camoufox / Firefox: браузер скачивается при первом запуске\n"
                 "• Данные не синхронизируются с облаком и не отправляются разработчику\n"
                 "• Экспорт содержит метаданные, но НЕ cookies и пароли\n\n"
                 "Важно: это не клон Chromium и не гарантия обхода антифрода.\n"
                 "Совместимость Camoufox с macOS Catalina должна пройти реальное тестирование.")
        tk.Label(self.info_tab, text=intro, justify="left", fg=TEXT, bg=BG, wraplength=950,
                 font=("Arial", 12), padx=26, pady=28).pack(anchor="w")
        ttk.Button(self.info_tab, text="Проверить / установить Camoufox", command=self.install_engine).pack(anchor="w", padx=24, pady=(0, 12))
        ttk.Button(self.info_tab, text="Документация движка", command=lambda: webbrowser.open("https://camoufox.com/python/")).pack(anchor="w", padx=24)

    def install_engine(self):
        """Start cache installation without blocking Tkinter on a network download."""
        self.state.set("Проверка и подготовка Camoufox… Первая загрузка может быть большой.")
        def work():
            try:
                ensure_engine_ready()
                self.root.after(0, lambda: self.state.set("Camoufox установлен и готов к запуску профилей"))
            except Exception:
                self.root.after(0, lambda: self.state.set("Ошибка загрузки Camoufox: проверьте сеть и доступное место"))
                self.root.after(0, lambda: messagebox.showerror(
                    "Camoufox", "Не удалось установить браузерный движок. Проверьте интернет, место на диске и повторите попытку.",
                    parent=self.root))
        threading.Thread(target=work, daemon=True).start()

    def selected(self, tree):
        return list(tree.selection())

    def one(self, tree, what):
        selected = self.selected(tree)
        if len(selected) != 1:
            raise ValueError("Выбери один " + what)
        return selected[0]

    def running(self, profile_id):
        path = self.store.root / "profiles" / profile_id / ".lock"
        if not path.exists():
            return False
        try:
            return pid_alive(int(path.read_text().strip()))
        except (OSError, ValueError):
            return False

    def update_filter_labels(self):
        """Regenerate translated combo labels while preserving filter keys."""
        self._filter_signature = None
        self.refresh_profiles()

    def _refresh_profile_filter_options(self, profiles, proxies):
        signature = (self.language,
                     tuple(distinct_groups(profiles)),
                     tuple((p["id"], p["name"]) for p in proxies))
        if signature == self._filter_signature:
            return
        self._filter_signature = signature
        en = self.language == "en"
        all_groups = "All groups" if en else "Все группы"
        all_status = "All statuses" if en else "Все статусы"
        active_status = "Running" if en else "Запущены"
        stopped_status = "Stopped" if en else "Остановлены"
        all_proxies = "All proxies" if en else "Все прокси"
        no_proxy = "No proxy" if en else "Без прокси"
        self.group_filter_map = {all_groups: None}
        for group in distinct_groups(profiles):
            self.group_filter_map["• " + group] = group
        self.status_filter_map = {
            all_status: ALL, active_status: RUNNING, stopped_status: STOPPED,
        }
        self.proxy_filter_map = {all_proxies: None, no_proxy: ""}
        for proxy in proxies:
            self.proxy_filter_map[
                proxy["name"] + " [" + proxy["id"][:8] + "]"] = proxy["id"]
        if self.group_filter_key not in self.group_filter_map.values():
            self.group_filter_key = None
        if self.proxy_filter_key not in self.proxy_filter_map.values():
            self.proxy_filter_key = None
        for combo, variable, mapping, current in (
            (self.group_filter_combo, self.group_filter_var,
             self.group_filter_map, self.group_filter_key),
            (self.status_filter_combo, self.status_filter_var,
             self.status_filter_map, self.status_filter_key),
            (self.proxy_filter_combo, self.proxy_filter_var,
             self.proxy_filter_map, self.proxy_filter_key),
        ):
            combo.configure(values=list(mapping))
            variable.set(next(label for label, key in mapping.items()
                              if key == current))

    def on_group_filter(self, _event=None):
        self.group_filter_key = self.group_filter_map.get(
            self.group_filter_var.get())
        self.refresh_profiles()

    def on_status_filter(self, _event=None):
        self.status_filter_key = self.status_filter_map.get(
            self.status_filter_var.get(), ALL)
        self.refresh_profiles()

    def on_proxy_filter(self, _event=None):
        self.proxy_filter_key = self.proxy_filter_map.get(
            self.proxy_filter_var.get())
        self.refresh_profiles()

    def reset_profile_filters(self):
        self.search.set("")
        self.group_filter_key = None
        self.status_filter_key = ALL
        self.proxy_filter_key = None
        self.update_filter_labels()

    def select_visible_profiles(self):
        ids = self.profile_tree.get_children()
        if ids:
            self.profile_tree.selection_set(ids)
            self.profile_tree.focus(ids[0])
        self.state.set(
            ("Выбрано видимых профилей: " if self.language == "ru" else
             "Selected visible profiles: ") + str(len(ids)))

    def change_selected_groups(self):
        ids = list(self.profile_tree.selection())
        if not ids:
            raise ValueError(
                "Сначала выбери профили" if self.language == "ru" else
                "Select profiles first")
        title = "Массовая смена группы" if self.language == "ru" else "Bulk group update"
        prompt = (
            "Новое название группы (пустое = без группы)." if self.language == "ru" else
            "New group name (blank = no group).")
        name = simpledialog.askstring(title, prompt, parent=self.root)
        if name is None:
            return
        count = bulk_update_groups(self.store, ids, name, self.running)
        self.group_filter_key = None
        self._filter_signature = None
        self.refresh_profiles()
        self.state.set(
            (f"Обновлена группа у {count} профилей" if self.language == "ru" else
             f"Updated groups for {count} profiles"))

    def refresh_profiles(self):
        old = set(self.profile_tree.selection())
        profiles = self.store.profiles()
        proxy_list = self.store.proxies()
        self._refresh_profile_filter_options(profiles, proxy_list)
        proxies = {p["id"]: p["name"] for p in proxy_list}
        visible, active = filter_profiles(
            profiles, query=self.search.get(), group=self.group_filter_key,
            status=self.status_filter_key, proxy_id=self.proxy_filter_key,
            running=self.running,
        )
        self.profile_tree.delete(*self.profile_tree.get_children())
        for p, live in visible:
            status = translate("● Запущен" if live else "○ Остановлен", self.language)
            self.profile_tree.insert(
                "", "end", iid=p["id"],
                values=(p["name"], p.get("group", ""), p.get("tags", ""),
                        proxies.get(p.get("proxy_id", ""),
                                    translate("Без прокси", self.language)),
                        p.get("os", "native"), status))
        self.profile_tree.selection_set(
            [pid for pid in old if self.profile_tree.exists(pid)])
        if self.language == "en":
            label = f"Profiles: {len(profiles)}  ·  Running: {active}  ·  Visible: {len(visible)}"
        else:
            label = f"Профилей: {len(profiles)}  ·  Запущено: {active}  ·  Показано: {len(visible)}"
        self.profile_stats.set(label)

    def refresh_proxies(self):
        self.proxy_tree.delete(*self.proxy_tree.get_children())
        for p in self.store.proxies():
            self.proxy_tree.insert("", "end", iid=p["id"],
                                   values=(p["name"], p["server"], "Keychain" if p["username"] else "Нет"))

    def refresh(self):
        self.refresh_proxies()
        self.refresh_profiles()

    def refresh_status(self):
        try:
            self.refresh_profiles()
        finally:
            if self.root.winfo_exists():
                self.root.after(2500, self.refresh_status)

    def profile_form(self, profile=None):
        window = tk.Toplevel(self.root)
        window.title("Настройки браузерного профиля")
        window.configure(bg=BG)
        window.geometry("620x545")
        window.transient(self.root)
        window.grab_set()
        fields = {}
        configs = [
            ("name", "Название", profile.get("name", "") if profile else ""),
            ("url", "Стартовая страница", profile.get("url", "https://example.com") if profile else "https://example.com"),
            ("group", "Группа", profile.get("group", "") if profile else ""),
            ("tags", "Теги через запятую", profile.get("tags", "") if profile else ""),
            ("notes", "Заметки", profile.get("notes", "") if profile else ""),
        ]
        for i, (key, title, value) in enumerate(configs):
            ttk.Label(window, text=title).grid(row=i, column=0, sticky="w", padx=24, pady=11)
            v = tk.StringVar(value=value)
            ttk.Entry(window, textvariable=v, width=48).grid(row=i, column=1, sticky="ew", padx=22, pady=8)
            fields[key] = v
        proxies = self.store.proxies()
        options = ["Без прокси"] + [p["name"] + " (" + p["id"][:8] + ")" for p in proxies]
        selected_proxy = 0
        if profile:
            for i, p in enumerate(proxies, 1):
                if p["id"] == profile.get("proxy_id"):
                    selected_proxy = i
        proxy_var = tk.StringVar(value=options[selected_proxy])
        ttk.Label(window, text="Прокси").grid(row=5, column=0, sticky="w", padx=24, pady=11)
        ttk.Combobox(window, textvariable=proxy_var, values=options, state="readonly", width=45).grid(row=5, column=1, padx=22, pady=8)
        os_options = ("native", "windows", "macos", "linux")
        os_var = tk.StringVar(value=profile.get("os", "native") if profile else "native")
        ttk.Label(window, text="ОС отпечатка").grid(row=6, column=0, sticky="w", padx=24, pady=11)
        ttk.Combobox(window, textvariable=os_var, values=os_options, state="readonly", width=45).grid(row=6, column=1, padx=22, pady=8)
        ttk.Label(window, text="native = ОС компьютера. Отпечаток генерирует Camoufox.", foreground=MUTED).grid(row=7, column=0, columnspan=2, padx=24, pady=12)
        def save():
            try:
                index = options.index(proxy_var.get())
                proxy_id = "" if index == 0 else proxies[index - 1]["id"]
                values = {k: v.get() for k, v in fields.items()}
                values.update(proxy_id=proxy_id, os_name=os_var.get())
                if profile:
                    values["os"] = values.pop("os_name")
                    self.store.update_profile(profile["id"], **values)
                else:
                    self.store.add_profile(**values)
                self.refresh()
                window.destroy()
                self.state.set("Настройки профиля сохранены")
            except Exception as exc:
                messagebox.showerror("Профиль", str(exc), parent=window)
        ttk.Button(window, text="Сохранить профиль", command=save).grid(row=8, column=1, sticky="e", padx=23, pady=18)
        window.columnconfigure(1, weight=1)
        self.apply_language(window)

    def new_profile(self):
        if len(self.store.profiles()) >= self.entitlement_limit:
            raise ValueError("Достигнут лимит профилей текущего тарифа (" + str(self.entitlement_limit) + ").")
        self.profile_form()

    def edit_profile(self):
        item = self.store.get_profile(self.one(self.profile_tree, "профиль"))
        if item and self.running(item["id"]):
            raise ValueError("Останови профиль перед изменением настроек")
        self.profile_form(item)

    def duplicate(self):
        selected = self.selected(self.profile_tree)
        if len(self.store.profiles()) + len(selected) > self.entitlement_limit:
            raise ValueError("Недостаточно мест в текущем тарифе: " + str(self.entitlement_limit))
        for pid in selected:
            self.store.duplicate_profile(pid)
        self.refresh()
        self.state.set("Профили продублированы; cookies и сессии не копировались")

    def delete(self):
        selected = self.selected(self.profile_tree)
        if not selected:
            raise ValueError("Выбери профили")
        if any(self.running(pid) for pid in selected):
            raise ValueError("Сначала останови запущенные профили")
        if not messagebox.askyesno("Удаление", "Удалить " + str(len(selected)) + " профилей? Данные будут перемещены в локальный trash."):
            return
        for pid in selected:
            self.store.delete_profile(pid)
        self.refresh()

    def start(self):
        if os.environ.get("MURDILIMAX_REQUIRE_LOGIN") == "1" and not self.authorized:
            raise ValueError("Для запуска требуется вход в аккаунт. Откройте вкладку «Аккаунт и лицензия».")
        selected = self.selected(self.profile_tree)
        if not selected:
            raise ValueError("Выбери профили")
        count = 0
        for pid in selected:
            if not self.running(pid):
                profile = self.store.get_profile(pid)
                allowed = self.store.profiles()[:self.entitlement_limit]
                if profile not in allowed:
                    raise ValueError("Профиль выходит за пределы вашего лимита")
                start_background(self.store, pid)
                count += 1
        self.state.set("Запуск " + str(count) + " браузеров. Первый запуск загружает Camoufox; смотри журнал.")

    def stop(self):
        for pid in self.selected(self.profile_tree):
            request_stop(self.store, pid)
        self.state.set("Отправлена команда корректного завершения")

    def export(self):
        path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON", "*.json")])
        if path:
            self.store.export_metadata(path)
            self.state.set("Экспортированы только настройки, без cookies и паролей")

    def import_profiles(self):
        path = filedialog.askopenfilename(filetypes=[("JSON", "*.json")])
        if path:
            if Path(path).stat().st_size > 8_000_000:
                raise ValueError("Export file is too large")
            count = self.store.import_metadata(path)
            self.refresh()
            self.state.set("Импортировано профилей: " + str(count))

    def import_proxies_txt(self):
        """Import proxy endpoints without copying passwords in plaintext."""
        path = filedialog.askopenfilename(
            title="Import proxies / Импорт прокси",
            filetypes=[("Text proxy lists", "*.txt"), ("All files", "*.*")])
        if not path:
            return
        if Path(path).stat().st_size > 1_000_000:
            raise ValueError("Proxy file is too large (maximum 1 MB)")
        try:
            content = Path(path).read_text(encoding="utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ValueError("Use a UTF-8 text file with one URL per line") from exc
        # Validate before adding; never echo any potentially credential-bearing
        # user-supplied URL in dialogs, notifications or log messages.
        added, skipped = import_proxy_list(self.store, content)
        self.refresh_proxies()
        self.state.set(f"Импортировано прокси: {added} · дубликатов: {skipped}")
        messagebox.showinfo(
            "Murdilimax Browser",
            f"Добавлено прокси: {added}\nПропущено дубликатов: {skipped}\n"
            "Пароли из текстовых файлов не импортируются. Добавьте пароль "
            "в редакторе прокси для защищённого хранения в OS Keychain.",
            parent=self.root)

    def new_proxy(self):
        self.proxy_form()

    def edit_proxy(self):
        pid = self.one(self.proxy_tree, "прокси")
        proxy = next((p for p in self.store.proxies() if p["id"] == pid), None)
        if proxy is None:
            raise ValueError("Прокси не найден")
        if any(self.running(p["id"]) and p.get("proxy_id") == pid for p in self.store.profiles()):
            raise ValueError("Останови использующие этот прокси профили")
        self.proxy_form(proxy)

    def proxy_form(self, existing=None):
        window = tk.Toplevel(self.root)
        window.title("Изменить прокси" if existing else "Новый прокси")
        window.configure(bg=BG)
        window.geometry("650x340")
        window.transient(self.root)
        window.grab_set()
        fields = {}
        for i, (field, label) in enumerate([
            ("name", "Название"), ("server", "URL: http://host:port или socks5://host:port"),
            ("username", "Логин (необязательно)"), ("password", "Пароль (сохраняется в Keychain)")]):
            ttk.Label(window, text=label).grid(row=i, column=0, padx=12, pady=14, sticky="w")
            v = tk.StringVar(value=existing.get(field, "") if existing and field != "password" else "")
            ttk.Entry(window, textvariable=v, show="*" if field == "password" else "", width=35).grid(row=i, column=1, padx=15)
            fields[field] = v
        def save():
            try:
                values = {k: v.get() for k, v in fields.items()}
                if existing:
                    self.store.update_proxy(existing["id"], **values)
                else:
                    self.store.add_proxy(**values)
                window.destroy()
                self.refresh()
            except Exception as exc:
                messagebox.showerror("Прокси", str(exc), parent=window)
        if existing:
            ttk.Label(window, text="Оставь пароль пустым, чтобы сохранить прежний.", foreground=MUTED).grid(row=5, column=0, columnspan=2, padx=15)
        ttk.Button(window, text="Сохранить", command=save).grid(row=4, column=1, sticky="e", pady=16)
        window.columnconfigure(1, weight=1)
        self.apply_language(window)

    def remove_proxy(self):
        pid = self.one(self.proxy_tree, "прокси")
        if messagebox.askyesno("Прокси", "Удалить прокси из списка?"):
            self.store.delete_proxy(pid)
            self.refresh()

    def check_proxy(self):
        pid = self.one(self.proxy_tree, "прокси")
        proxy = next(p for p in self.store.proxies() if p["id"] == pid)
        u = urlsplit(proxy["server"])
        with socket.create_connection((u.hostname, u.port), timeout=5):
            pass
        messagebox.showinfo("Прокси", "TCP-порт отвечает. Это НЕ проверка авторизации, DNS, утечек или выходного IP.")

    def diagnose_selected_proxy(self):
        """Nonblocking selected proxy diagnosis; display only safe status codes."""
        proxy_id = self.one(self.proxy_tree, "прокси")
        language = self.language
        self.state.set(
            "Диагностика прокси: проверяем TCP и HTTPS…" if language == "ru" else
            "Proxy diagnostics: checking TCP and HTTPS…")

        def work():
            try:
                # Proxy passwords are retrieved only from the local OS keychain.
                # Never include proxy_config or exception strings in UI/logs.
                proxy = self.store.proxy_config(proxy_id)
                result = diagnose_proxy(proxy)
                report = describe_diagnosis(result, language)
                status = (
                    "Диагностика: TCP и HTTPS проверены" if language == "ru" else
                    "Diagnostics: TCP and HTTPS checked")
                self.root.after(0, lambda r=report, t=status: (
                    self.state.set(t),
                    messagebox.showinfo("Murdilimax · Proxy diagnostics", r,
                                        parent=self.root)
                ))
            except Exception:
                message = (
                    "Не удалось получить параметры прокси из Keychain или начать проверку."
                    if language == "ru" else
                    "Could not retrieve proxy settings from Keychain or run the check.")
                self.root.after(0, lambda m=message: (
                    self.state.set(m),
                    messagebox.showerror("Murdilimax · Proxy diagnostics", m,
                                         parent=self.root)
                ))

        threading.Thread(target=work, daemon=True).start()

    def check_proxy_exit(self):
        """Nonblocking HTTPS request through the saved proxy; don't display credentials."""
        pid = self.one(self.proxy_tree, "прокси")
        self.state.set("Проверяем выходной IP через выбранный прокси…")
        def work():
            try:
                config = self.store.proxy_config(pid)
                result = probe_proxy_exit(config)
                self.root.after(0, lambda r=result: messagebox.showinfo(
                    "Проверка прокси",
                    "Выходной IP: " + r["exit_ip"] + "\nПротокол: " + r["route_type"] +
                    "\n\nЭто один HTTPS-запрос. Проверки DNS, WebRTC и IPv6 проводятся отдельно.",
                    parent=self.root
                ))
                self.root.after(0, lambda r=result: self.state.set(
                    "Внешний IP прокси: " + r["exit_ip"] + " · один HTTPS-запрос"
                ))
            except Exception:
                # Requests exceptions can include credential-bearing proxy URLs.
                self.root.after(0, lambda: messagebox.showerror(
                    "Проверка прокси", "Не удалось получить выходной IP через прокси. Проверьте адрес, доступность и авторизацию.",
                    parent=self.root))
                self.root.after(0, lambda: self.state.set("Ошибка проверки прокси (без раскрытия логина и пароля)"))
        threading.Thread(target=work, daemon=True).start()

    def open_folder(self):
        p = self.store.root
        if sys.platform == "win32":
            os.startfile(str(p))
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(p)])
        else:
            subprocess.Popen(["xdg-open", str(p)])

    def open_log(self):
        pid = self.one(self.profile_tree, "профиль")
        path = self.store.root / "logs" / (pid + ".log")
        if path.exists():
            webbrowser.open(path.as_uri())
        else:
            messagebox.showinfo("Журнал", "Лог пока пуст")

    def run(self):
        self.root.mainloop()

def selftest():
    if getattr(sys, "frozen", False):
        # A clean machine cannot write a model into the read-only app bundle.
        # Verify it was bundled at build time instead of silently downloading.
        from camoufox.fpgen_model import is_pinned
        if not is_pinned():
            raise RuntimeError("Pinned Camoufox fingerprint model missing from installer")
    with tempfile.TemporaryDirectory() as dirname:
        store = Store(dirname)
        p = store.add_profile("Smoke test", "https://example.com")
        assert store.get_profile(p["id"])["name"] == "Smoke test"
        store.delete_profile(p["id"])
        assert not store.profiles()
    if not getattr(sys, "frozen", False):
        print("Murdilimax Browser smoke test OK")

def main():
    if getattr(sys, "frozen", False) and sys.platform == "win32":
        # PyInstaller windowed programs may have no valid stdout/stderr handles.
        if sys.stdout is None:
            sys.stdout = open(os.devnull, "w")
        if sys.stderr is None:
            sys.stderr = open(os.devnull, "w")
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-profile", default="")
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        selftest()
    elif args.run_profile:
        if getattr(sys, "frozen", False):
            safe_profile_id(args.run_profile)
            log = Store().root / "logs" / (args.run_profile + ".log")
            fd = os.open(str(log), os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
            output = os.fdopen(fd, "a", encoding="utf-8")
            sys.stdout = output
            sys.stderr = output
        try:
            run_profile(args.run_profile)
        except Exception as exc:
            print(type(exc).__name__ + ": " + str(exc), file=sys.stderr)
            sys.exit(2)
    else:
        BrowserUI().run()

if __name__ == "__main__":
    main()
