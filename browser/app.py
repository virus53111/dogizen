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
from tkinter import filedialog, messagebox, ttk
from urllib.parse import urlsplit

from auth_client import BrowserAccount
from engine import pid_alive, request_stop, run_profile, start_background
from store import Store

BG = "#0b1117"
PANEL = "#182329"
TEXT = "#eee9dc"
MUTED = "#abb9b7"
ACCENT = "#e3c68e"

class BrowserUI:
    def __init__(self):
        self.store = Store()
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
        self.state = tk.StringVar(value="Локальная рабочая область · браузерные профили")
        style = ttk.Style(self.root)
        style.theme_use("clam")
        style.configure(".", background=BG, foreground=TEXT, font=("Arial", 10))
        style.configure("TFrame", background=BG)
        style.configure("TLabel", background=BG, foreground=TEXT)
        style.configure("TButton", background="#23313b", foreground=TEXT, padding=(14, 11), borderwidth=0, relief="flat")
        style.map("TButton", background=[("active", "#655b44")], foreground=[("active", "#f8ecce")])
        style.configure("Treeview", background=PANEL, foreground=TEXT, fieldbackground=PANEL,
                        rowheight=36, borderwidth=0)
        style.map("Treeview", background=[("selected", "#534e41")])
        style.configure("Treeview.Heading", background="#27323a", foreground=ACCENT, padding=12)
        style.configure("TEntry", fieldbackground=PANEL, foreground=TEXT)
        style.configure("TCombobox", fieldbackground=PANEL, foreground="#111627")
        style.configure("TNotebook", background=BG, borderwidth=0)
        style.configure("TNotebook.Tab", background=PANEL, foreground=TEXT, padding=(22, 13))
        title = tk.Frame(self.root, bg=BG)
        title.pack(fill="x", padx=26, pady=(24, 12))
        tk.Label(title, text="◈ MURDILIMAX", fg=ACCENT, bg=BG,
                 font=("Georgia", 25, "bold")).pack(side="left")
        tk.Label(title, text="BROWSER STUDIO  /  PRIVATE WORKSPACE", fg=MUTED, bg=BG,
                 font=("Arial", 10)).pack(side="left", padx=22)
        ttk.Button(title, text="Открыть папку данных", command=self.open_folder).pack(side="right")
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
        tk.Label(self.root, textvariable=self.state, anchor="w", bg=BG, fg=MUTED, font=("Arial", 10)).pack(fill="x", padx=26, pady=(5, 15))
        self.refresh()
        self.root.after(2500, self.refresh_status)
        self.root.after(1500, self.restore_login)
        self.root.after(300000, self.license_tick)

    def button(self, parent, label, command):
        ttk.Button(parent, text=label, command=lambda: self.call(command)).pack(side="left", padx=(0, 7), pady=5)

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
        cols = ("name", "group", "tags", "proxy", "os", "status")
        self.profile_tree = ttk.Treeview(self.profile_tab, columns=cols, show="headings", selectmode="extended")
        for key, title, width in [("name", "Название", 230), ("group", "Группа", 130),
                                  ("tags", "Теги", 180), ("proxy", "Прокси", 140),
                                  ("os", "ОС отпечатка", 115), ("status", "Статус", 110)]:
            self.profile_tree.heading(key, text=title)
            self.profile_tree.column(key, width=width, stretch=True)
        self.profile_tree.pack(fill="both", expand=True, padx=12, pady=7)
        self.profile_tree.bind("<Double-1>", lambda _: self.call(self.edit_profile))
        tools = ttk.Frame(self.profile_tab)
        tools.pack(fill="x", padx=12, pady=8)
        self.button(tools, "Экспорт настроек", self.export)
        self.button(tools, "Импорт настроек", self.import_profiles)
        self.button(tools, "Открыть журнал", self.open_log)
        ttk.Label(tools, text="Cookies хранятся локально в каталоге каждого профиля.").pack(side="right", padx=10)

    def setup_proxies(self):
        bar = ttk.Frame(self.proxy_tab)
        bar.pack(fill="x", padx=12, pady=10)
        self.button(bar, "＋ Добавить прокси", self.new_proxy)
        self.button(bar, "✎ Изменить прокси", self.edit_proxy)
        self.button(bar, "✕ Удалить прокси", self.remove_proxy)
        self.button(bar, "Проверить TCP-подключение", self.check_proxy)
        self.proxy_tree = ttk.Treeview(self.proxy_tab, columns=("name", "server", "auth"), show="headings")
        for k, label, width in [("name", "Название", 200), ("server", "Адрес HTTP/SOCKS5", 460),
                                ("auth", "Авторизация", 160)]:
            self.proxy_tree.heading(k, text=label)
            self.proxy_tree.column(k, width=width)
        self.proxy_tree.pack(fill="both", expand=True, padx=12, pady=8)
        self.proxy_tree.bind("<Double-1>", lambda _: self.call(self.edit_proxy))
        ttk.Label(self.proxy_tab,
                  text="Проверка TCP подтверждает соединение с сервером, но не проверяет выходной IP. Пароли — только в системном хранилище ключей.",
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
                    lambda: webbrowser.open("https://murdilimax-browser.hatchable.site/account.html"))
        self.button(bar, "↻ Проверить лицензию", self.check_license)
        self.button(bar, "Выйти", self.logout)
        tk.Label(outer, text="Личный кабинет пока проходит настройку публичного доступа и Google OAuth. "
                 "Платные подписки отключены до проверки оплаты Stripe. "
                 "Текущая бесплатная бета ограничена тремя профилями.",
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
                webbrowser.open(data["verification_uri"])
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
        ttk.Button(self.info_tab, text="Документация движка", command=lambda: webbrowser.open("https://camoufox.com/python/")).pack(anchor="w", padx=24)

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

    def refresh_profiles(self):
        old = set(self.profile_tree.selection())
        self.profile_tree.delete(*self.profile_tree.get_children())
        proxies = {p["id"]: p["name"] for p in self.store.proxies()}
        query = self.search.get().strip().lower()
        for p in self.store.profiles():
            if query and query not in " ".join(str(p.get(k, "")) for k in ("name", "group", "tags", "notes")).lower():
                continue
            status = "● Запущен" if self.running(p["id"]) else "○ Остановлен"
            self.profile_tree.insert("", "end", iid=p["id"], values=(p["name"], p["group"], p["tags"],
                                    proxies.get(p["proxy_id"], "Без прокси"), p["os"], status))
        self.profile_tree.selection_set([x for x in old if self.profile_tree.exists(x)])

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
            log = Store().root / "logs" / (args.run_profile + ".log")
            output = log.open("a", encoding="utf-8")
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
