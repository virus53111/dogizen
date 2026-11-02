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
from launch_guard import launch_pending
from network_check import probe_proxy_exit
from proxy_diagnostics import diagnose_proxy, describe_diagnosis
from profile_view import (ALL, RUNNING, STOPPED, filter_profiles,
                          distinct_groups, bulk_update_groups, plan_profile_launches,
                          sort_visible_profiles)
from profile_table import reconcile_profile_tree
from profile_actions import create_quick_profiles, bulk_assign_proxy
from profile_templates import (list_templates, save_template, delete_template,
                               create_profiles_from_template)
from bookmarks import (list_bookmarks, add_bookmark, update_bookmark,
                       remove_bookmark)
from fingerprint_options import BOUNDS, safe_identity_preview
from cookie_manager import (cookie_inventory, export_cookies, clear_cookies,
                            list_cookie_backups, restore_cookie_backup)
from cookie_import import inspect_cookie_file, import_cookies
from addon_manager import list_addons, inspect_archive, install_addon, set_addon_enabled, remove_addon
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
        self._api_server = None
        self._api_thread = None
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
        self._search_after_id = None
        self.group_filter_key = None
        self.status_filter_key = ALL
        self.proxy_filter_key = None
        self._filter_signature = None
        self.sort_column = None
        self.sort_descending = False
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
        self.addon_tab = ttk.Frame(self.tabs)
        self.bookmark_tab = ttk.Frame(self.tabs)
        self.template_tab = ttk.Frame(self.tabs)
        self.info_tab = ttk.Frame(self.tabs)
        self.account_tab = ttk.Frame(self.tabs)
        self.tabs.add(self.profile_tab, text="Профили")
        self.tabs.add(self.proxy_tab, text="Прокси")
        self.tabs.add(self.addon_tab, text="Расширения")
        self.tabs.add(self.bookmark_tab, text="Закладки")
        self.tabs.add(self.template_tab, text="Шаблоны")
        self.tabs.add(self.account_tab, text="Аккаунт и лицензия")
        self.tabs.add(self.info_tab, text="О программе")
        self.setup_profiles()
        self.setup_proxies()
        self.setup_addons()
        self.setup_bookmarks()
        self.setup_templates()
        self.setup_account()
        self.setup_info()
        self.tabs.bind("<<NotebookTabChanged>>", self.on_main_tab_changed)
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
        self.root.protocol("WM_DELETE_WINDOW", self.close_application)

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
        self.refresh_profile_headings()
        self.refresh_addons()

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
        self.search.trace_add("write", self.schedule_profile_search)
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
            self.profile_tree.heading(key, text=title,
                                      command=lambda selected=key: self.set_profile_sort(selected))
            self.profile_tree.column(key, width=width, stretch=True)
        self.profile_tree.pack(fill="both", expand=True, padx=12, pady=7)
        self.profile_tree.bind("<Double-1>", lambda _: self.call(self.edit_profile))
        bulk = ttk.Frame(self.profile_tab)
        bulk.pack(fill="x", padx=12, pady=(3, 3))
        self.button(bulk, "Выбрать видимые", self.select_visible_profiles)
        self.button(bulk, "Изменить группу", self.change_selected_groups)
        self.button(bulk, "⇄ Назначить прокси", self.assign_proxy_to_selected)
        self.profile_stats = tk.StringVar(value="")
        ttk.Label(bulk, textvariable=self.profile_stats,
                  foreground=CYAN).pack(side="right", padx=(8, 4))
        tools = ttk.Frame(self.profile_tab)
        tools.pack(fill="x", padx=12, pady=8)
        self.button(tools, "⚡ Быстрый профиль", self.quick_profile)
        self.button(tools, "✚ Сохранить шаблон", self.save_selected_as_template)
        self.button(tools, "Экспорт настроек", self.export)
        self.button(tools, "Импорт настроек", self.import_profiles)
        self.button(tools, "Стартовые вкладки", self.edit_startup_tabs)
        self.button(tools, "◈ Отпечаток", self.inspect_fingerprint)
        self.button(tools, "Открыть журнал", self.open_log)
        cookie_bar = ttk.Frame(self.profile_tab)
        cookie_bar.pack(fill="x", padx=12, pady=(0, 6))
        ttk.Label(cookie_bar, text="COOKIES / LOCAL", foreground=CYAN).pack(
            side="left", padx=(0, 12))
        self.button(cookie_bar, "◉ Cookies", self.show_cookie_inventory)
        self.button(cookie_bar, "⇩ Экспорт cookies", self.export_profile_cookies)
        self.button(cookie_bar, "⇧ Импорт cookies", self.import_profile_cookies)
        self.button(cookie_bar, "✕ Очистить cookies", self.clear_profile_cookies)
        self.button(cookie_bar, "↶ Восстановить cookies", self.show_cookie_restore)
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

    def on_main_tab_changed(self, _event=None):
        if self.tabs.select() != str(self.addon_tab):
            return
        selection = list(self.profile_tree.selection())
        if len(selection) == 1:
            self.addon_profile_id = selection[0]
        try:
            self.refresh_addons()
        except ValueError as exc:
            messagebox.showerror("Murdilimax Extensions", str(exc), parent=self.root)

    def setup_addons(self):
        outer = self.addon_tab
        hero = ttk.Frame(outer)
        hero.pack(fill="x", padx=16, pady=(17, 9))
        ttk.Label(hero, text="EXTENSIONS / FIREFOX",
                  foreground=CYAN, font=("Arial", 13, "bold")).pack(anchor="w")
        ttk.Label(hero, text="Установленные дополнения одного профиля. "
                  "Расширения активируются после перезапуска браузера.",
                  foreground=MUTED, wraplength=1000).pack(anchor="w", pady=(7, 3))
        picker = ttk.Frame(outer)
        picker.pack(fill="x", padx=16, pady=9)
        ttk.Label(picker, text="Профиль:").pack(side="left", padx=(0, 10))
        self.addon_profile_var = tk.StringVar()
        self.addon_profile_id = None
        self.addon_profile_map = {}
        self.addon_profile_combo = ttk.Combobox(
            picker, textvariable=self.addon_profile_var,
            width=52, state="readonly")
        self.addon_profile_combo.pack(side="left", fill="x", expand=True, padx=(0, 10))
        self.addon_profile_combo.bind("<<ComboboxSelected>>", self.on_addon_profile)
        ttk.Button(picker, text="↻ Обновить",
                   command=self.refresh_addons).pack(side="left")
        buttons = ttk.Frame(outer)
        buttons.pack(fill="x", padx=16, pady=8)
        self.button(buttons, "＋ Установить XPI", self.install_selected_addon)
        self.button(buttons, "◈ Вкл / выкл", self.toggle_selected_addon)
        self.button(buttons, "✕ Удалить расширение", self.delete_selected_addon)
        self.addon_tree = ttk.Treeview(
            outer, columns=("name", "version", "status"), show="headings",
            selectmode="browse", height=9)
        for col, name, width in (
            ("name", "Название", 420), ("version", "Версия", 110),
            ("status", "Статус", 150)):
            self.addon_tree.heading(col, text=name)
            self.addon_tree.column(col, width=width, stretch=True)
        self.addon_tree.pack(fill="both", expand=True, padx=16, pady=(8, 9))
        self.addon_tree.bind("<<TreeviewSelect>>", self.on_addon_selected)
        self.addon_details = tk.StringVar(value="")
        ttk.Label(outer, textvariable=self.addon_details, foreground=CYAN,
                  wraplength=1040, justify="left").pack(
                      anchor="w", fill="x", padx=19, pady=(0, 8))
        ttk.Label(outer,
                  text="Важно: сторонние расширения могут читать страницы, cookies и "
                  "данные аккаунтов. Устанавливайте только дополнения, которым доверяете. "
                  "XPI не проверяется на вредоносный код. Пока поддерживаются локальные "
                  "архивы Firefox, а не Chrome CRX.",
                  foreground=MUTED, wraplength=1040,
                  justify="left").pack(anchor="w", padx=19, pady=(5, 18))

    def refresh_addons(self):
        current = self.addon_profile_id
        profiles = self.store.profiles()
        self.addon_profile_map = {
            p["name"] + " [" + p["id"][:8] + "]": p["id"] for p in profiles}
        self.addon_profile_combo.configure(values=list(self.addon_profile_map))
        if current not in self.addon_profile_map.values():
            current = profiles[0]["id"] if profiles else None
        self.addon_profile_id = current
        label = next((k for k, v in self.addon_profile_map.items() if v == current), "")
        self.addon_profile_var.set(label)
        self.addon_tree.delete(*self.addon_tree.get_children())
        self.addon_details.set("")
        if current is None:
            return
        for row in list_addons(self.store, current):
            state = ("Enabled" if row["enabled"] else "Disabled") if self.language == "en" else (
                "Включено" if row["enabled"] else "Выключено")
            self.addon_tree.insert("", "end", iid=row["id"],
                                   values=(row["name"], row["version"], state))

    def on_addon_profile(self, _event=None):
        self.addon_profile_id = self.addon_profile_map.get(
            self.addon_profile_var.get())
        self.refresh_addons()

    def on_addon_selected(self, _event=None):
        ids = list(self.addon_tree.selection())
        if not ids or not self.addon_profile_id:
            self.addon_details.set("")
            return
        addon = next((row for row in list_addons(self.store, self.addon_profile_id)
                      if row["id"] == ids[0]), None)
        if addon is None:
            return
        permissions = ", ".join(addon["permissions"][:20]) or (
            "No declared permissions" if self.language == "en" else
            "Разрешения не объявлены")
        label = "Requested permissions" if self.language == "en" else "Запрошенные разрешения"
        self.addon_details.set(f"{label}: {permissions[:550]}")

    def _addon_profile(self):
        if not self.addon_profile_id:
            raise ValueError("Выберите профиль" if self.language == "ru" else
                             "Select a browser profile")
        return self.addon_profile_id

    def _addon_async(self, action, on_success):
        """Keep large local XPI extraction off the main Tk loop."""
        def work():
            try:
                result = action()
            except ValueError as exc:
                message = str(exc)
                self.root.after(0, lambda m=message: messagebox.showerror(
                    "Murdilimax Extensions", m, parent=self.root))
            except Exception:
                self.root.after(0, lambda: messagebox.showerror(
                    "Murdilimax Extensions",
                    "Addon operation failed. Check the archive and disk access.",
                    parent=self.root))
            else:
                self.root.after(0, lambda r=result: on_success(r))
        threading.Thread(target=work, daemon=True).start()

    def install_selected_addon(self):
        pid = self._addon_profile()
        path = filedialog.askopenfilename(
            title="Firefox XPI / ZIP",
            filetypes=[("Firefox extensions", "*.xpi *.zip"), ("All files", "*.*")])
        if not path:
            return
        # Manifest-only inspection; never install before explicit approval.
        info = inspect_archive(path)
        en = self.language == "en"
        permissions = ", ".join(info["permissions"][:20]) or (
            "none declared" if en else "не объявлены")
        warning = (
            f"Install {info['name']} v{info['version']}?\n\n"
            f"Requested permissions: {permissions[:700]}\n\n"
            "WARNING: Browser extensions run third-party code and may access "
            "sites and sessions. The package is NOT malware-scanned or signed "
            "by Murdilimax. Install only from sources you trust. "
            "The browser profile must be stopped. Continue?"
            if en else
            f"Установить {info['name']} v{info['version']}?\n\n"
            f"Запрошенные разрешения: {permissions[:700]}\n\n"
            "ВНИМАНИЕ: расширения выполняют сторонний код и могут получать "
            "доступ к сайтам и сессиям. Murdilimax НЕ проверяет файл на вирусы "
            "и не подтверждает его подпись. Устанавливайте только проверенные "
            "дополнения. Профиль должен быть остановлен. Продолжить?"
        )
        if not messagebox.askyesno("Murdilimax Extensions", warning, parent=self.root):
            return
        def success(entry):
            self.refresh_addons()
            messagebox.showinfo(
                "Murdilimax Extensions",
                ("Installed. Restart the browser profile to enable the extension."
                 if en else
                 "Установлено. Запустите профиль заново, чтобы включить расширение."),
                parent=self.root)
        self._addon_async(lambda: install_addon(self.store, pid, path), success)

    def toggle_selected_addon(self):
        pid = self._addon_profile()
        addon_id = self.one(self.addon_tree, "расширение")
        item = next((r for r in list_addons(self.store, pid) if r["id"] == addon_id), None)
        if item is None:
            raise ValueError("Extension not found")
        set_addon_enabled(self.store, pid, addon_id, not item["enabled"])
        self.refresh_addons()
        self.state.set(
            "Extension setting saved. Restart profile to apply." if self.language == "en" else
            "Настройка расширения сохранена. Перезапустите профиль для применения.")

    def delete_selected_addon(self):
        pid = self._addon_profile()
        addon_id = self.one(self.addon_tree, "расширение")
        en = self.language == "en"
        question = ("Remove the extension from this stopped profile? "
                    "Changes take effect after restart." if en else
                    "Удалить расширение из остановленного профиля? "
                    "Изменения применяются после перезапуска.")
        if not messagebox.askyesno("Murdilimax Extensions", question, parent=self.root):
            return
        remove_addon(self.store, pid, addon_id)
        self.refresh_addons()
        self.state.set("Extension removed" if en else "Расширение удалено")

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

    def setup_templates(self):
        """Metadata-only templates, using existing Tk theme and profile selection."""
        bar = ttk.Frame(self.template_tab)
        bar.pack(fill="x", padx=14, pady=(15, 9))
        self.button(bar, "✚ Из выбранного профиля", self.save_selected_as_template)
        self.button(bar, "⚡ Создать профили по шаблону", self.create_using_template)
        self.button(bar, "✕ Удалить шаблон", self.delete_selected_template)
        self.button(bar, "↻ Обновить", self.refresh_templates)
        self.template_tree = ttk.Treeview(
            self.template_tab,
            columns=("name", "group", "url", "proxy", "screen"),
            show="headings", selectmode="browse")
        for key, label, width in [
            ("name", "Шаблон", 190), ("group", "Группа", 140),
            ("url", "Стартовая страница", 360),
            ("proxy", "Прокси", 120), ("screen", "Предел экрана", 155)]:
            self.template_tree.heading(key, text=label)
            self.template_tree.column(key, width=width, stretch=True)
        self.template_tree.pack(fill="both", expand=True, padx=14, pady=8)
        ttk.Label(
            self.template_tab, foreground=MUTED, wraplength=1060,
            text="Шаблоны содержат только настройки. Cookies, сессии, отпечатки, "
                 "расширения и пароли не копируются. До 10 профилей за один раз; "
                 "лимит тарифа перепроверяется перед созданием.").pack(
                     anchor="w", padx=17, pady=(2, 14))
        self.refresh_templates()

    def refresh_templates(self):
        if not hasattr(self, "template_tree"):
            return
        previous = self.template_tree.selection()
        children = self.template_tree.get_children()
        if children:
            self.template_tree.delete(*children)
        for t in list_templates(self.store):
            self.template_tree.insert(
                "", "end", iid=t["id"],
                values=(t["name"], t["group"] or "—",
                        t["url"], "Да" if t["proxy_id"] else "Нет",
                        t["screen_limit"]))
        for ident in previous:
            if self.template_tree.exists(ident):
                self.template_tree.selection_set(ident)

    def save_selected_as_template(self):
        pid = self.one(self.profile_tree, "профиль")
        profile = self.store.get_profile(pid)
        if not profile:
            raise ValueError("Профиль не найден")
        label = simpledialog.askstring(
            "Murdilimax · Шаблоны",
            "Название нового шаблона (без cookies, паролей, отпечатка):",
            initialvalue=profile["name"], parent=self.root)
        if label is None:
            return
        saved = save_template(self.store, pid, label)
        self.refresh_templates()
        if self.template_tree.exists(saved["id"]):
            self.template_tree.selection_set(saved["id"])
            self.template_tree.see(saved["id"])
        self.state.set("Шаблон сохранён: " + saved["name"])

    def create_using_template(self):
        template_id = self.one(self.template_tree, "шаблон")
        template = next((x for x in list_templates(self.store)
                         if x["id"] == template_id), None)
        if not template:
            raise ValueError("Шаблон не найден")
        count = simpledialog.askinteger(
            "Murdilimax · Шаблоны",
            "Сколько отдельных профилей создать? (1–10)",
            minvalue=1, maxvalue=10, initialvalue=1, parent=self.root)
        if count is None:
            return
        created = create_profiles_from_template(self.store, template_id, count=count)
        self.refresh()
        if created and self.profile_tree.exists(created[0]["id"]):
            self.profile_tree.selection_set(created[0]["id"])
            self.profile_tree.see(created[0]["id"])
        self.state.set("Создано профилей по шаблону: " + str(len(created)))

    def delete_selected_template(self):
        ident = self.one(self.template_tree, "шаблон")
        if not messagebox.askyesno(
                "Murdilimax · Шаблоны", "Удалить выбранный шаблон? "
                "Существующие профили останутся без изменений.",
                parent=self.root):
            return
        delete_template(self.store, ident)
        self.refresh_templates()
        self.state.set("Шаблон удалён; существующие профили сохранены")

    def setup_bookmarks(self):
        """Local bookmark catalog for all profiles or a profile group."""
        bar = ttk.Frame(self.bookmark_tab)
        bar.pack(fill="x", padx=14, pady=(15, 8))
        self.button(bar, "＋ Закладка", self.add_bookmark_ui)
        self.button(bar, "✎ Изменить закладку", self.edit_bookmark_ui)
        self.button(bar, "✕ Удалить закладку", self.delete_bookmark_ui)
        self.button(bar, "↻ Обновить", self.refresh_bookmarks)
        self.bookmark_tree = ttk.Treeview(
            self.bookmark_tab, columns=("name", "url", "group"),
            show="headings", selectmode="browse")
        for key, title, width in (
                ("name", "Название", 240), ("url", "Ссылка", 480),
                ("group", "Группа", 190)):
            self.bookmark_tree.heading(key, text=title)
            self.bookmark_tree.column(key, width=width, stretch=True)
        self.bookmark_tree.pack(fill="both", expand=True, padx=14, pady=7)
        self.bookmark_tree.bind(
            "<Double-1>", lambda _event: self.call(self.edit_bookmark_ui))
        self.bookmark_note = ttk.Label(
            self.bookmark_tab,
            text="Локальные закладки открываются на пустой стартовой странице "
                 "профиля (about:blank). Группа пустая — закладка для всех профилей.",
            foreground=MUTED, wraplength=1030)
        self.bookmark_note.pack(anchor="w", padx=17, pady=(3, 12))
        self.refresh_bookmarks()

    def refresh_bookmarks(self):
        if not hasattr(self, "bookmark_tree"):
            return
        rows = list_bookmarks(self.store)
        selected = set(self.bookmark_tree.selection())
        present = self.bookmark_tree.get_children()
        if present:
            self.bookmark_tree.delete(*present)
        for row in rows:
            self.bookmark_tree.insert("", "end", iid=row["id"],
                                      values=(row["name"], row["url"],
                                              row["group"] or "Все профили"))
        for selected_id in selected:
            if self.bookmark_tree.exists(selected_id):
                self.bookmark_tree.selection_add(selected_id)

    def bookmark_form(self, existing=None):
        en = self.language == "en"
        win = tk.Toplevel(self.root)
        win.title("Bookmark" if en else "Закладка")
        win.configure(bg=BG)
        win.geometry("680x290")
        win.transient(self.root)
        win.grab_set()
        vals = {}
        for index, (key, title, default) in enumerate((
                ("name", "Name" if en else "Название",
                 existing.get("name", "") if existing else ""),
                ("url", "HTTPS / HTTP URL",
                 existing.get("url", "") if existing else ""),
                ("group", "Profile group (blank = all)" if en else
                 "Группа профилей (пусто = все)",
                 existing.get("group", "") if existing else ""))):
            ttk.Label(win, text=title).grid(
                row=index, column=0, sticky="w", padx=20, pady=15)
            var = tk.StringVar(value=default)
            field = ttk.Entry(win, textvariable=var, width=53)
            field.grid(row=index, column=1, sticky="ew", padx=17, pady=10)
            vals[key] = var
            if index == 0:
                field.focus_set()

        def save():
            name = vals["name"].get()
            url = vals["url"].get()
            group = vals["group"].get()
            try:
                if existing:
                    update_bookmark(self.store, existing["id"], name, url, group)
                else:
                    add_bookmark(self.store, name, url, group)
                self.refresh_bookmarks()
                self.state.set("Bookmark saved" if en else "Закладка сохранена")
                win.destroy()
            except (ValueError, OSError) as exc:
                messagebox.showerror("Bookmark" if en else "Закладка",
                                     str(exc), parent=win)
        ttk.Button(win, text="Save" if en else "Сохранить",
                   command=save).grid(row=3, column=1, sticky="e",
                                      padx=18, pady=20)
        win.columnconfigure(1, weight=1)

    def add_bookmark_ui(self):
        self.bookmark_form()

    def edit_bookmark_ui(self):
        bookmark_id = self.one(self.bookmark_tree, "закладку")
        existing = next((b for b in list_bookmarks(self.store)
                         if b["id"] == bookmark_id), None)
        if not existing:
            raise ValueError("Закладка не найдена")
        self.bookmark_form(existing)

    def delete_bookmark_ui(self):
        bookmark_id = self.one(self.bookmark_tree, "закладку")
        en = self.language == "en"
        if not messagebox.askyesno(
                "Bookmarks" if en else "Закладки",
                "Delete selected bookmark?" if en else
                "Удалить выбранную закладку?", parent=self.root):
            return
        remove_bookmark(self.store, bookmark_id)
        self.refresh_bookmarks()
        self.state.set("Bookmark removed" if en else "Закладка удалена")

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
        ttk.Button(self.info_tab, text="Проверить обновления Windows",
                   command=self.check_updates).pack(anchor="w", padx=24, pady=(12, 0))
        ttk.Button(self.info_tab, text="▶ Локальный API",
                   command=lambda: self.call(self.start_local_api)).pack(anchor="w", padx=24, pady=(12, 0))
        ttk.Button(self.info_tab, text="■ Остановить API",
                   command=lambda: self.call(self.stop_local_api)).pack(anchor="w", padx=24, pady=(6, 0))
        ttk.Button(self.info_tab, text="↻ Новый ключ API",
                   command=lambda: self.call(self.rotate_local_api_token)).pack(anchor="w", padx=24, pady=(6, 0))

    def _show_local_token(self, token):
        """One-time secret dialog; never writes the token to files or logs."""
        window = tk.Toplevel(self.root)
        window.title("Murdilimax · Local API token")
        window.configure(bg=BG)
        window.geometry("710x225")
        window.transient(self.root)
        window.grab_set()
        tk.Label(window, text="Секретный ключ API — сохраните в надёжном месте",
                 bg=BG, fg=TEXT, font=("Arial", 12, "bold")).pack(pady=(18, 9))
        tk.Label(window, text="Не передавайте ключ другим. Очистите буфер после копирования.",
                 bg=BG, fg=MUTED).pack(pady=(0, 10))
        entry = ttk.Entry(window, width=69, font=("Consolas", 10), show="•")
        entry.insert(0, token)
        entry.configure(state="readonly")
        entry.pack(padx=16)
        visible = tk.BooleanVar(value=False)
        def show():
            entry.configure(show="" if visible.get() else "•")
        ttk.Checkbutton(window, text="Показать ключ", variable=visible,
                        command=show).pack(pady=(6, 2))
        def copy():
            window.clipboard_clear()
            window.clipboard_append(token)
            window.update()
        ttk.Button(window, text="Копировать", command=copy).pack(
            side="left", padx=(135, 15), pady=9)
        ttk.Button(window, text="Закрыть", command=window.destroy).pack(
            side="left", pady=9)

    def start_local_api(self):
        """Explicit local-only API, not started automatically with the app."""
        if self._api_server is not None:
            self.state.set("Локальный API уже запущен (127.0.0.1:18765)")
            return
        from local_api import load_token, make_server, rotate_token
        try:
            token = load_token()
            reveal = False
        except RuntimeError as exc:
            if "absent" not in str(exc):
                raise
            token = rotate_token()
            reveal = True
        server = make_server(self.store, token)
        self._api_server = server
        self._api_thread = threading.Thread(
            target=server.serve_forever, kwargs={"poll_interval": 0.2},
            daemon=True, name="murdilimax-local-api")
        self._api_thread.start()
        self.state.set("Локальный API: http://127.0.0.1:18765 (только этот ПК)")
        if reveal:
            self._show_local_token(token)

    def stop_local_api(self):
        server = self._api_server
        if server is None:
            self.state.set("Локальный API уже остановлен")
            return
        self._api_server = None
        thread = self._api_thread
        self._api_thread = None
        server.shutdown()
        server.server_close()
        if thread is not None:
            thread.join(timeout=2)
        self.state.set("Локальный API остановлен")

    def rotate_local_api_token(self):
        from local_api import rotate_token
        if self._api_server is not None:
            if not messagebox.askyesno(
                    "Murdilimax · API",
                    "Остановить API и заменить ключ? Старый ключ перестанет работать.",
                    parent=self.root):
                return
            self.stop_local_api()
        token = rotate_token()
        self._show_local_token(token)
        self.state.set("Новый ключ API сохранён в системном хранилище")

    def close_application(self):
        if self._api_server is not None:
            self.stop_local_api()
        self.root.destroy()

    def check_updates(self):
        """Read GitHub release metadata on request; no automatic installation."""
        if sys.platform != "win32":
            messagebox.showinfo("Murdilimax",
                                "Проверка установщиков доступна в Windows-версии.",
                                parent=self.root)
            return
        self.state.set("Проверяем официальный GitHub Release…")
        def worker():
            try:
                from update_check import check_windows_updates
                release = check_windows_updates()
            except Exception:
                self.root.after(0, lambda: messagebox.showwarning(
                    "Murdilimax", "Не удалось проверить обновления. Проверьте интернет "
                    "или откройте murdilimax.com/download.html вручную.",
                    parent=self.root))
                self.root.after(0, lambda: self.state.set(
                    "Проверка обновления недоступна"))
                return
            def show():
                if release is None:
                    self.state.set("Обновлений Windows пока нет")
                    messagebox.showinfo("Murdilimax",
                                        "Установлена актуальная Windows-версия.",
                                        parent=self.root)
                    return
                version = ".".join(map(str, release["version"]))
                self.state.set("Доступна Windows v" + version)
                if messagebox.askyesno(
                        "Murdilimax",
                        "Доступна версия v" + version +
                        ". Открыть официальный релиз на GitHub? "
                        "Программа ничего не скачивает и не устанавливает автоматически.",
                        parent=self.root):
                    webbrowser.open(release["url"])
            self.root.after(0, show)
        threading.Thread(target=worker, daemon=True).start()

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
        # A launch being handed to its child is busy, even before the PID
        # lock exists. Repeated clicks and bulk edits must not race startup.
        if launch_pending(path.parent):
            return True
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

    def set_profile_sort(self, column):
        """Click a heading to sort A→Z; click it again to reverse."""
        if self.sort_column == column:
            self.sort_descending = not self.sort_descending
        else:
            self.sort_column = column
            self.sort_descending = False
        self.refresh_profile_headings()
        self.refresh_profiles()

    def refresh_profile_headings(self):
        columns = (
            ("name", "Название"), ("group", "Группа"), ("tags", "Теги"),
            ("proxy", "Прокси"), ("os", "ОС отпечатка"), ("status", "Статус"),
        )
        for key, original in columns:
            label = translate(original, self.language)
            if key == self.sort_column:
                label += " ↓" if self.sort_descending else " ↑"
            self.profile_tree.heading(key, text=label)

    def schedule_profile_search(self, *_):
        """Debounce keystrokes: avoid scanning large tables on every character."""
        if self._search_after_id is not None:
            self.root.after_cancel(self._search_after_id)
        self._search_after_id = self.root.after(180, self._apply_scheduled_search)

    def _apply_scheduled_search(self):
        self._search_after_id = None
        self.refresh_profiles()

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
        profiles = self.store.profiles()
        proxy_list = self.store.proxies()
        self._refresh_profile_filter_options(profiles, proxy_list)
        proxies = {p["id"]: p["name"] for p in proxy_list}
        visible, active = filter_profiles(
            profiles, query=self.search.get(), group=self.group_filter_key,
            status=self.status_filter_key, proxy_id=self.proxy_filter_key,
            running=self.running,
        )
        visible = sort_visible_profiles(
            visible, column=self.sort_column,
            descending=self.sort_descending, proxy_names=proxies)
        # Incremental rendering: a periodic refresh with unchanged profiles
        # now performs zero Tk row writes, preserving multi-selection,
        # focus and scroll position even with hundreds of local profiles.
        rows = []
        for p, live in visible:
            if launch_pending(self.store.root / "profiles" / p["id"]):
                status = translate("◌ Запускается", self.language)
            else:
                status = translate("● Запущен" if live else "○ Остановлен", self.language)
            rows.append((
                p["id"],
                (p["name"], p.get("group", ""), p.get("tags", ""),
                 proxies.get(p.get("proxy_id", ""),
                             translate("Без прокси", self.language)),
                 p.get("os", "native"), status)))
        reconcile_profile_tree(self.profile_tree, rows)
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
        self.refresh_addons()
        self.refresh_templates()

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
        window.geometry("650x625")
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
        ttk.Label(window, text="native = ОС компьютера. Отпечаток генерирует Camoufox.", foreground=MUTED).grid(row=7, column=0, columnspan=2, padx=24, pady=8)
        screen_var = tk.StringVar(value=profile.get("screen_limit", "auto") if profile else "auto")
        ttk.Label(window, text="Предел экрана (fpgen)").grid(row=8, column=0, sticky="w", padx=24, pady=11)
        screen_box = ttk.Combobox(window, textvariable=screen_var,
                                  values=tuple(BOUNDS), state="readonly", width=45)
        screen_box.grid(row=8, column=1, padx=22, pady=8)
        if profile and (self.store.root / "profiles" / profile["id"] / "fingerprint-v1.json").exists():
            screen_box.configure(state="disabled")
        ttk.Label(window, text="Максимум для нового отпечатка, не точный размер. После первого запуска зафиксирован.",
                  foreground=MUTED, wraplength=610).grid(row=9, column=0, columnspan=2, padx=24, pady=7)
        def save():
            try:
                index = options.index(proxy_var.get())
                proxy_id = "" if index == 0 else proxies[index - 1]["id"]
                values = {k: v.get() for k, v in fields.items()}
                values.update(proxy_id=proxy_id, os_name=os_var.get(), screen_limit=screen_var.get())
                if profile:
                    values["os"] = values.pop("os_name")
                    self.store.update_profile(profile["id"], **values)
                else:
                    if len(self.store.profiles()) >= self.entitlement_limit:
                        raise ValueError("Достигнут лимит профилей текущего тарифа")
                    self.store.add_profile(**values)
                self.refresh()
                window.destroy()
                self.state.set("Настройки профиля сохранены")
            except Exception as exc:
                messagebox.showerror("Профиль", str(exc), parent=window)
        ttk.Button(window, text="Сохранить профиль", command=save).grid(row=10, column=1, sticky="e", padx=23, pady=18)
        window.columnconfigure(1, weight=1)
        self.apply_language(window)

    def quick_profile(self):
        """Create one isolated default profile without the configuration form."""
        created = create_quick_profiles(self.store, allowance=self.entitlement_limit)
        self.refresh()
        if created and self.profile_tree.exists(created[0]["id"]):
            self.profile_tree.selection_set(created[0]["id"])
            self.profile_tree.see(created[0]["id"])
        self.state.set("Created quick profile" if self.language == "en" else
                       "Создан быстрый профиль")

    def assign_proxy_to_selected(self):
        """Bulk-assign a named proxy or no proxy to stopped profiles."""
        ids = list(self.profile_tree.selection())
        if not ids:
            raise ValueError("Сначала выбери профили" if self.language == "ru"
                             else "Select profiles first")
        proxies = self.store.proxies()
        en = self.language == "en"
        dialog = tk.Toplevel(self.root)
        dialog.title("Bulk proxy assignment" if en else "Назначить прокси")
        dialog.configure(bg=BG)
        dialog.geometry("530x210")
        dialog.transient(self.root)
        dialog.grab_set()
        ttk.Label(dialog, text=("Apply one proxy to all selected STOPPED profiles"
                                if en else
                                "Один прокси для всех выбранных ОСТАНОВЛЕННЫХ профилей")).pack(
                                    anchor="w", padx=18, pady=(20, 12))
        labels = ["No proxy" if en else "Без прокси"] + [
            p["name"] + " (" + p["id"][:8] + ")" for p in proxies]
        choice = tk.StringVar(value=labels[0])
        combo = ttk.Combobox(dialog, state="readonly", width=58,
                             values=labels, textvariable=choice)
        combo.pack(fill="x", padx=18, pady=8)
        def save():
            try:
                index = labels.index(choice.get())
                pid = "" if index == 0 else proxies[index - 1]["id"]
                count = bulk_assign_proxy(
                    self.store, ids, pid,
                    lambda item: self.running(item))
                dialog.destroy()
                self.refresh()
                self.state.set(
                    f"Updated proxy for {count} profiles" if en else
                    f"Прокси обновлён у {count} профилей")
            except Exception as exc:
                messagebox.showerror("Murdilimax · Proxy", str(exc),
                                     parent=dialog)
        ttk.Button(dialog, text="Save" if en else "Сохранить", command=save).pack(
            side="right", padx=18, pady=17)

    def new_profile(self):
        if len(self.store.profiles()) >= self.entitlement_limit:
            raise ValueError("Достигнут лимит профилей текущего тарифа (" + str(self.entitlement_limit) + ").")
        self.profile_form()

    def edit_profile(self):
        item = self.store.get_profile(self.one(self.profile_tree, "профиль"))
        if item and self.running(item["id"]):
            raise ValueError("Останови профиль перед изменением настроек")
        self.profile_form(item)

    def inspect_fingerprint(self):
        """Show a bounded preview of an existing fpgen identity; no regeneration."""
        pid = self.one(self.profile_tree, "профиль")
        item = self.store.get_profile(pid)
        if item is None:
            raise ValueError("Профиль не найден")
        preview = safe_identity_preview(self.store.root / "profiles" / pid)
        if not preview["generated"]:
            messagebox.showinfo(
                "Murdilimax · Отпечаток",
                "Отпечаток ещё не создан. Camoufox зафиксирует его при первом запуске. "
                "Текущий предел экрана: " + item.get("screen_limit", "auto") + ".",
                parent=self.root)
            return
        fields = ("ОС: " + preview["os"] + "\n" +
                  "Предел экрана: " + preview["screen_limit"] + "\n" +
                  "Реальный выбранный размер: " + preview["screen"] + "\n" +
                  "Потоки CPU: " + str(preview["cpu"] or "неизвестно") + "\n" +
                  "User-Agent: " + preview["user_agent"] + "\n\n" +
                  "Это локальный просмотр. Подмена UA/WebGL отдельно не производится. "
                  "Для нового отпечатка дублируйте профиль.")
        messagebox.showinfo("Murdilimax · Отпечаток", fields,
                            parent=self.root)

    def edit_startup_tabs(self):
        """Edit additional pages for one STOPPED profile without changing the theme."""
        pid = self.one(self.profile_tree, "профиль")
        profile = self.store.get_profile(pid)
        if not profile:
            raise ValueError("Профиль не найден")
        if self.running(pid) or launch_pending(self.store.root / "profiles" / pid):
            raise ValueError("Сначала останови профиль")
        en = self.language == "en"
        dialog = tk.Toplevel(self.root)
        dialog.title("Startup tabs" if en else "Стартовые вкладки")
        dialog.configure(bg=BG)
        dialog.geometry("710x405")
        dialog.transient(self.root)
        dialog.grab_set()
        tk.Label(dialog, text="Additional tabs (one URL per line)" if en else
                 "Дополнительные вкладки (один адрес в строке)",
                 bg=BG, fg=TEXT, font=("Arial", 12, "bold")).pack(
                     anchor="w", padx=22, pady=(20, 8))
        main_url = str(profile.get("url", "about:blank"))
        tk.Label(dialog, text=("Main page: " if en else "Главная страница: ") +
                 main_url[:100], bg=BG, fg=CYAN, wraplength=655,
                 justify="left").pack(anchor="w", padx=22, pady=(0, 8))
        tk.Label(dialog, text="Up to seven HTTP/HTTPS tabs. Data stays local." if en else
                 "До семи дополнительных страниц HTTP/HTTPS. Данные локальные.",
                 bg=BG, fg=MUTED).pack(anchor="w", padx=22, pady=(0, 8))
        editor = tk.Text(dialog, height=9, width=74, wrap="none",
                         bg=PANEL, fg=TEXT, insertbackground=TEXT)
        editor.insert("1.0", "\n".join(profile.get("startup_urls", [])))
        editor.pack(fill="both", expand=True, padx=22, pady=(0, 12))
        footer = ttk.Frame(dialog)
        footer.pack(fill="x", padx=22, pady=(0, 18))
        def save():
            try:
                lines = [line.strip() for line in
                         editor.get("1.0", "end-1c").splitlines() if line.strip()]
                self.store.update_profile(pid, startup_urls=lines)
                dialog.destroy()
                self.state.set("Startup tabs saved" if en else
                               "Дополнительные вкладки сохранены")
            except ValueError as exc:
                messagebox.showerror("Startup tabs" if en else "Стартовые вкладки",
                                     str(exc), parent=dialog)
        ttk.Button(footer, text="Save" if en else "Сохранить",
                   command=save).pack(side="right", padx=5)
        ttk.Button(footer, text="Cancel" if en else "Отмена",
                   command=dialog.destroy).pack(side="right", padx=5)

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
        # Validate all IDs and the entire subscription selection BEFORE any
        # background subprocess is launched; one store read, no N² lookups.
        planned = plan_profile_launches(
            self.store.profiles(), selected, self.entitlement_limit, self.running)
        count = 0
        for pid in planned:
            start_background(self.store, pid)
            count += 1
        if self.language == "en":
            self.state.set(f"Starting {count} browsers. First launch may download Camoufox; check logs.")
        else:
            self.state.set(f"Запуск {count} браузеров. Первый запуск может загрузить Camoufox; смотри журнал.")

    def stop(self):
        selected = self.selected(self.profile_tree)
        # Avoid a partial bulk stop and misleading "sent" status while one
        # selected profile is still waiting for its browser PID lock.
        if any(launch_pending(self.store.root / "profiles" / pid)
               and not (self.store.root / "profiles" / pid / ".lock").exists()
               for pid in selected):
            raise ValueError(
                "Один из профилей ещё запускается. Повторите остановку позже."
                if self.language == "ru" else
                "A selected profile is still starting. Retry Stop after launch.")
        for pid in selected:
            request_stop(self.store, pid)
        self.state.set("Stop requested" if self.language == "en" else
                       "Отправлена команда корректного завершения")

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
            count = self.store.import_metadata(path, max_profiles=self.entitlement_limit)
            self.refresh()
            self.state.set("Импортировано профилей: " + str(count))

    def _cookie_action(self, action, on_success):
        """Run cookie storage operations off the Tk UI thread."""
        def worker():
            try:
                result = action()
            except ValueError as exc:
                safe = str(exc)
                self.root.after(0, lambda msg=safe: messagebox.showerror(
                    "Murdilimax Cookies", msg, parent=self.root))
            except Exception:
                self.root.after(0, lambda: messagebox.showerror(
                    "Murdilimax Cookies",
                    "Local cookie operation failed; no cookie values were logged."
                    if self.language == "en" else
                    "Ошибка локальной операции. Значения cookies не записаны в журнал.",
                    parent=self.root))
            else:
                self.root.after(0, lambda answer=result: on_success(answer))
        threading.Thread(target=worker, daemon=True).start()

    def show_cookie_inventory(self):
        pid = self.one(self.profile_tree, "профиль")
        lang = self.language
        def display(info):
            summary = (f"Cookies: {info.count}\n" +
                       (f"Domains: {info.domains}" if lang == "en" else
                        f"Доменов: {info.domains}"))
            if info.top_domains:
                summary += ("\n\nTop domains:\n" if lang == "en" else
                            "\n\nЧастые домены:\n")
                summary += "\n".join(
                    f"{host}: {count}" for host, count in info.top_domains)
            if not info.present:
                summary += ("\nCookie database not created yet." if lang == "en" else
                            "\nБаза cookies ещё не создана.")
            messagebox.showinfo("Murdilimax Cookies", summary, parent=self.root)
        self._cookie_action(lambda: cookie_inventory(self.store, pid), display)

    def export_profile_cookies(self):
        pid = self.one(self.profile_tree, "профиль")
        en = self.language == "en"
        warning = (
            "Cookies may contain login tokens. Export creates an UNENCRYPTED JSON "
            "file containing session secrets. Do not share it. Continue?"
            if en else
            "Cookies могут содержать токены входа. Экспорт создаёт НЕЗАШИФРОВАННЫЙ "
            "JSON-файл с секретами сеансов. Не передавайте его другим. Продолжить?"
        )
        if not messagebox.askyesno("Murdilimax Cookies", warning, parent=self.root):
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".json",
            initialfile="murdilimax-cookies-" + pid[:8] + ".json",
            filetypes=[("JSON", "*.json")])
        if not path:
            return
        def success(count):
            messagebox.showinfo(
                "Murdilimax Cookies",
                (f"Exported {count} cookies to a sensitive private file:\n{path}"
                 if en else
                 f"Экспортировано cookies: {count}. Секретный файл:\n{path}"),
                parent=self.root)
        self._cookie_action(lambda: export_cookies(self.store, pid, path), success)

    def import_profile_cookies(self):
        """Import only an explicitly approved local cookie file into a stopped profile."""
        pid = self.one(self.profile_tree, "профиль")
        en = self.language == "en"
        path = filedialog.askopenfilename(
            title="Select your own local cookies" if en else "Выберите свои локальные cookies",
            filetypes=[("Cookies JSON / Netscape TXT", "*.json *.txt"),
                       ("All files", "*.*")])
        if not path:
            return
        info = inspect_cookie_file(path)
        details = (
            f"Import {info.count} cookies from {info.domains} domains "
            f"({info.format}) into this STOPPED profile?\n\n"
            "Cookies can give access to logged-in accounts. Import only "
            "files that belong to you. Existing cookie data will be backed up "
            "before merging. Other profiles will not be changed."
            if en else
            f"Импортировать {info.count} cookies для {info.domains} доменов "
            f"({info.format}) в этот ОСТАНОВЛЕННЫЙ профиль?\n\n"
            "Cookies могут давать доступ к аккаунтам сайтов. Загружайте только "
            "собственные файлы. Перед объединением текущие cookies будут "
            "сохранены в локальную резервную копию. Другие профили не затрагиваются."
        )
        if not messagebox.askyesno("Murdilimax Cookies", details, parent=self.root):
            return

        def completed(result):
            count, backup = result
            text = (
                f"Imported {count} cookies. Restart the profile to use them.\n"
                f"Previous-state backup: {backup or 'none (new database)'}"
                if en else
                f"Импортировано cookies: {count}. Запустите профиль заново.\n"
                f"Копия прежних данных: {backup or 'нет (новая база)'}"
            )
            messagebox.showinfo("Murdilimax Cookies", text, parent=self.root)

        self._cookie_action(lambda: import_cookies(self.store, pid, path), completed)

    def clear_profile_cookies(self):
        pid = self.one(self.profile_tree, "профиль")
        en = self.language == "en"
        warning = (
            "Clear cookies for this stopped profile? You may be signed out of "
            "websites. A private local SQLite backup is made first."
            if en else
            "Очистить cookies остановленного профиля? Возможен выход из "
            "аккаунтов на сайтах. Сначала сохранится локальная резервная копия SQLite."
        )
        if not messagebox.askyesno("Murdilimax Cookies", warning, parent=self.root):
            return
        def success(result):
            count, backup = result
            messagebox.showinfo(
                "Murdilimax Cookies",
                (f"Cleared {count} cookies.\nLocal private backup: {backup or 'none'}"
                 if en else
                 f"Очищено cookies: {count}\nЛокальная резервная копия: {backup or 'нет'}"),
                parent=self.root)
        self._cookie_action(lambda: clear_cookies(self.store, pid), success)

    def show_cookie_restore(self):
        """Choose a Murdilimax backup from the selected stopped profile."""
        profile_id = self.one(self.profile_tree, "профиль")
        english = self.language == "en"

        def show(backups):
            if not backups:
                messagebox.showinfo(
                    "Murdilimax Cookies",
                    "No local backups for this profile." if english else
                    "Для этого профиля пока нет локальных резервных копий.",
                    parent=self.root)
                return
            dialog = tk.Toplevel(self.root)
            dialog.title("Restore cookies" if english else "Восстановление cookies")
            dialog.configure(bg=BG)
            dialog.geometry("720x375")
            dialog.transient(self.root)
            dialog.grab_set()
            ttk.Label(
                dialog, foreground=ACCENT, wraplength=650,
                text=("Only local backups of this STOPPED profile are shown. "
                      "Backups contain session secrets." if english else
                      "Показаны только локальные копии ОСТАНОВЛЕННОГО профиля. "
                      "Они содержат секреты сеансов.")
            ).pack(fill="x", padx=20, pady=(20, 12))
            table = ttk.Treeview(dialog, columns=("created", "size"),
                                 show="headings", selectmode="browse")
            table.heading("created", text="UTC / " + ("Created" if english else "Создана"))
            table.heading("size", text="KB / " + ("Size" if english else "Размер"))
            table.column("created", width=330)
            table.column("size", width=130)
            for row in backups:
                table.insert("", "end", iid=row.filename,
                             values=(row.modified_at, f"{row.size_bytes / 1024:.1f} KB"))
            table.pack(fill="both", expand=True, padx=20, pady=8)
            table.selection_set(backups[0].filename)
            controls = ttk.Frame(dialog)
            controls.pack(fill="x", padx=20, pady=(5, 18))

            def confirm():
                selected = list(table.selection())
                if not selected:
                    return
                warning = (
                    "Restore this backup? Current cookies will be backed up "
                    "first; website sign-ins may change. Only the selected "
                    "STOPPED profile is affected." if english else
                    "Восстановить эту копию? Текущие cookies сначала будут "
                    "сохранены; вход на сайты может измениться. Изменится только "
                    "выбранный ОСТАНОВЛЕННЫЙ профиль.")
                if not messagebox.askyesno(
                        "Murdilimax Cookies", warning, parent=dialog):
                    return
                filename = selected[0]
                dialog.destroy()

                def completed(result):
                    count, previous = result
                    text = (
                        f"Restored cookies: {count}\n"
                        f"Previous-state backup: {previous or 'none'}"
                        if english else
                        f"Восстановлено cookies: {count}\n"
                        f"Копия прежнего состояния: {previous or 'нет'}")
                    messagebox.showinfo("Murdilimax Cookies", text,
                                        parent=self.root)
                self._cookie_action(
                    lambda: restore_cookie_backup(
                        self.store, profile_id, filename), completed)

            ttk.Button(
                controls,
                text="Restore selected backup" if english else
                     "Восстановить выбранную копию",
                command=confirm).pack(side="left", padx=(0, 10))
            ttk.Button(
                controls, text="Cancel" if english else "Отмена",
                command=dialog.destroy).pack(side="left")

        self._cookie_action(
            lambda: list_cookie_backups(self.store, profile_id), show)

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

def display_api_token(token):
    """Show an explicitly requested API token in a local, one-time dialog.

    Windows PyInstaller --windowed executables have no readable console:
    printing the token would silently discard it. Never write it to logs.
    """
    window = tk.Tk()
    window.title("Murdilimax · Local API token")
    window.resizable(False, False)
    window.configure(bg=BG)
    tk.Label(window, text="Локальный ключ API — сохраните в надёжном месте",
             bg=BG, fg=TEXT, font=("Arial", 12, "bold")).pack(padx=22, pady=(20, 10))
    tk.Label(window, text="Ключ показывается один раз. Не передавайте его другим.",
             bg=BG, fg=MUTED).pack(padx=22, pady=(0, 12))
    field = tk.Entry(window, width=72, show="•", font=("Consolas", 11))
    field.insert(0, token)
    field.configure(state="readonly")
    field.pack(padx=22, pady=(0, 12))
    show = tk.BooleanVar(value=False)
    def toggle():
        field.configure(show="" if show.get() else "•")
    tk.Checkbutton(window, text="Показать", variable=show, command=toggle,
                   bg=BG, fg=TEXT, selectcolor=PANEL).pack(pady=(0, 8))
    def copy_token():
        window.clipboard_clear()
        window.clipboard_append(token)
        window.update()
        messagebox.showinfo("Murdilimax", "Ключ скопирован. Очистите буфер обмена после сохранения.",
                            parent=window)
    ttk.Button(window, text="Скопировать ключ", command=copy_token).pack(pady=(0, 12))
    ttk.Button(window, text="Закрыть", command=window.destroy).pack(pady=(0, 20))
    window.mainloop()


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
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--run-profile", default="")
    mode.add_argument("--selftest", action="store_true")
    mode.add_argument("--api-server", action="store_true",
                      help="Start opt-in authenticated loopback profile API")
    mode.add_argument("--api-rotate-token", action="store_true",
                      help="Create a new API token in the OS keyring and show it once")
    parser.add_argument("--api-port", type=int, default=18765)
    args = parser.parse_args()
    if args.selftest:
        selftest()
    elif args.api_rotate_token:
        from local_api import rotate_token
        token = rotate_token()
        if getattr(sys, "frozen", False) and sys.platform == "win32":
            display_api_token(token)
        else:
            print("Local API token (keep private; shown once): " + token)
    elif args.api_server:
        from local_api import serve_api
        serve_api(port=args.api_port)
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
