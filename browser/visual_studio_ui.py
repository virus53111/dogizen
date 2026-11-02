"""Original Murdilimax Neon Flow Studio — editable block-card workflow designer.

This is an actual Tk visual builder for the desktop app, not a clone of any
third-party UI. It reuses Murdilimax's own existing neon colors and typography.
"""
from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

from neon_theme import BG, PANEL, TEXT, MUTED, ACCENT, CYAN
from visual_workflows import MAX_STEPS, MAX_TARGETS, save_flow, validated_step


TITLES = {
    "open": ("◉", "ОТКРЫТЬ СТРАНИЦУ"),
    "wait": ("◷", "ПАУЗА"),
    "wait_visible": ("◉", "ОЖИДАТЬ ЭЛЕМЕНТ"),
    "click": ("✧", "НАЖАТЬ ЭЛЕМЕНТ"),
    "fill": ("▣", "ВВЕСТИ ТЕКСТ"),
    "scroll": ("↕", "ПРОКРУТИТЬ"),
}


class FlowEditor:
    """A bounded card canvas with explicit add/edit/move/remove controls."""

    def __init__(self, parent, store, profile_ids, *, flow=None, on_saved=None):
        self.parent = parent
        self.store = store
        self.original = flow
        self.profile_ids = list(profile_ids)
        self.on_saved = on_saved
        self.steps = [dict(s) for s in (flow or {}).get("steps", [])]
        self._initial_steps = [dict(s) for s in self.steps]
        self._initial_name = (flow or {}).get("name", "Мой Flow")
        self._initial_profile_ids = list(self.profile_ids)
        self.window = tk.Toplevel(parent)
        self.window.title("Murdilimax · NEON FLOW STUDIO")
        self.window.geometry("910x720")
        self.window.minsize(690, 520)
        self.window.configure(bg=BG)
        self.window.transient(parent)
        self.window.grab_set()
        self.window.protocol("WM_DELETE_WINDOW", self.request_close)
        # Bind to this modal's toplevel, not globally across the app.
        for key in ("<MouseWheel>", "<Button-4>", "<Button-5>"):
            self.window.bind(key, self._scroll_flow)

        header = tk.Frame(self.window, bg=BG)
        header.pack(fill="x", padx=25, pady=(20, 5))
        tk.Label(header, text="M / FLOW STUDIO", bg=BG, fg=ACCENT,
                 font=("Arial", 19, "bold")).pack(side="left")
        tk.Label(header, text="VISUAL AUTOMATION • MURDILIMAX",
                 bg=BG, fg=CYAN, font=("Arial", 9, "bold")).pack(
                     side="right", pady=10)

        caption = tk.Frame(self.window, bg=BG)
        caption.pack(fill="x", padx=25, pady=(4, 10))
        tk.Label(caption, text="Название:", bg=BG, fg=TEXT,
                 font=("Arial", 11, "bold")).pack(side="left", padx=(0, 10))
        self.name = ttk.Entry(caption, width=42)
        self.name.pack(side="left", fill="x", expand=True)
        self.name.insert(0, self._initial_name)
        tk.Button(
            caption, text="✦ ИЗМЕНИТЬ ПРОФИЛИ", command=self.choose_profiles,
            bg="#283157", fg=CYAN, activebackground="#32416e",
            activeforeground="#ffffff", relief="flat", bd=0,
            padx=10, pady=7, font=("Arial", 9, "bold")
        ).pack(side="right", padx=(8, 0))
        self.profile_count = tk.Label(
            caption, text=f"ПРОФИЛЕЙ: {len(self.profile_ids)}",
            bg=BG, fg=CYAN, font=("Arial", 9, "bold"))
        self.profile_count.pack(side="right", padx=(8, 0))

        palette = tk.Frame(self.window, bg=BG)
        palette.pack(fill="x", padx=25, pady=(2, 10))
        for kind, label in (
                ("open", "+ URL"), ("wait", "+ ПАУЗА"),
                ("wait_visible", "+ ЭЛЕМЕНТ"), ("click", "+ КЛИК"), ("fill", "+ ТЕКСТ"),
                ("scroll", "+ СКРОЛЛ")):
            tk.Button(
                palette, text=label, command=lambda k=kind: self.add(k),
                bg="#222b50", fg=ACCENT, activebackground="#32416e",
                activeforeground="#ffffff", relief="flat", bd=0,
                padx=12, pady=9, cursor="hand2",
                font=("Arial", 10, "bold")).pack(side="left", padx=(0, 8))

        surface = tk.Frame(self.window, bg=BG, highlightbackground="#534577",
                           highlightthickness=1)
        surface.pack(fill="both", expand=True, padx=25, pady=(1, 8))
        self.canvas = tk.Canvas(surface, bg="#10182d", highlightthickness=0)
        scrollbar = ttk.Scrollbar(surface, orient="vertical",
                                  command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)
        self.stack = tk.Frame(self.canvas, bg="#10182d")
        self.canvas_item = self.canvas.create_window(
            (0, 0), window=self.stack, anchor="nw")
        self.stack.bind("<Configure>", self._resize_canvas)
        self.canvas.bind("<Configure>", self._resize_cards)

        footer = tk.Frame(self.window, bg=BG)
        footer.pack(fill="x", padx=25, pady=(5, 18))
        tk.Label(
            footer, bg=BG, fg=MUTED, wraplength=580, justify="left",
            text="До 12 блоков • действия выполняются последовательно • "
                 "текст сохраняется локально — не вводите пароли, токены или "
                 "платёжные сведения. Редактирование не запускает браузер."
        ).pack(side="left", fill="x", expand=True)
        tk.Button(
            footer, text="СОХРАНИТЬ FLOW", command=self.save,
            bg=ACCENT, fg=BG, activebackground=CYAN, relief="flat",
            bd=0, padx=17, pady=12, font=("Arial", 10, "bold"),
            cursor="hand2").pack(side="right", padx=(14, 0))
        self.redraw()

    def set_target_profiles(self, ids):
        """Change only Flow targets, never browser/session data."""
        valid = {p["id"] for p in self.store.profiles()}
        if (not isinstance(ids, list) or not 1 <= len(ids) <= MAX_TARGETS
                or any(not isinstance(i, str) or i not in valid for i in ids)
                or len(ids) != len(set(ids))):
            raise ValueError("Выберите 1–10 существующих профилей.")
        self.profile_ids = list(ids)
        self.profile_count.configure(
            text=f"ПРОФИЛЕЙ: {len(self.profile_ids)}")

    def choose_profiles(self):
        """Modal multi-select: changes are applied only after confirmation."""
        available = [(p["id"], p["name"]) for p in self.store.profiles()]
        if not available:
            messagebox.showerror("Murdilimax", "Профили отсутствуют.",
                                 parent=self.window)
            return
        popup = tk.Toplevel(self.window)
        popup.title("Murdilimax · Профили Flow")
        popup.geometry("510x510")
        popup.minsize(380, 340)
        popup.transient(self.window)
        popup.configure(bg=BG)
        tk.Label(popup, text="ВЫБЕРИ ПРОФИЛИ ДЛЯ FLOW",
                 bg=BG, fg=ACCENT, font=("Arial", 12, "bold")).pack(
                     anchor="w", padx=18, pady=(18, 6))
        tk.Label(popup, text="От 1 до 10 локальных профилей. "
                 "Данные браузеров не копируются.",
                 bg=BG, fg=MUTED, font=("Arial", 9),
                 wraplength=450).pack(anchor="w", padx=18, pady=(0, 10))
        box = tk.Frame(popup, bg=PANEL)
        box.pack(fill="both", expand=True, padx=18)
        sb = ttk.Scrollbar(box, orient="vertical")
        chooser = tk.Listbox(
            box, selectmode=tk.MULTIPLE, exportselection=False,
            bg="#10182d", fg=TEXT, selectbackground="#534577",
            selectforeground="#ffffff", highlightthickness=0,
            font=("Arial", 11), borderwidth=0,
            yscrollcommand=sb.set)
        sb.configure(command=chooser.yview)
        sb.pack(side="right", fill="y")
        chooser.pack(side="left", fill="both", expand=True)
        chosen = set(self.profile_ids)
        for index, (ident, name) in enumerate(available):
            chooser.insert(tk.END, f"{name[:75]}  ·  {ident[:8]}")
            if ident in chosen:
                chooser.selection_set(index)

        def apply():
            ids = [available[int(index)][0]
                   for index in chooser.curselection()]
            try:
                self.set_target_profiles(ids)
            except ValueError as exc:
                messagebox.showerror("Murdilimax", str(exc), parent=popup)
                return
            popup.destroy()

        buttons = tk.Frame(popup, bg=BG)
        buttons.pack(fill="x", padx=18, pady=16)
        tk.Button(
            buttons, text="ОТМЕНА", command=popup.destroy,
            bg="#283157", fg=TEXT, relief="flat", bd=0,
            padx=12, pady=9).pack(side="left")
        tk.Button(
            buttons, text="ПРИМЕНИТЬ", command=apply,
            bg=ACCENT, fg=BG, relief="flat", bd=0,
            padx=14, pady=9, font=("Arial", 9, "bold")
        ).pack(side="right")
        popup.grab_set()

    def _scroll_flow(self, event):
        if getattr(event, "num", None) == 4:
            steps = -1
        elif getattr(event, "num", None) == 5:
            steps = 1
        else:
            delta = getattr(event, "delta", 0)
            if not delta:
                return
            steps = -int(delta / 120) or (-1 if delta > 0 else 1)
        self.canvas.yview_scroll(steps, "units")
        return "break"

    def request_close(self):
        changed = (self.name.get() != self._initial_name or
                   self.steps != self._initial_steps or
                   self.profile_ids != self._initial_profile_ids)
        if changed and not messagebox.askyesno(
                "Murdilimax",
                "Есть несохранённые изменения Flow. Закрыть без сохранения?",
                parent=self.window):
            return
        self.window.destroy()

    def _resize_canvas(self, _event):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _resize_cards(self, event):
        self.canvas.itemconfigure(self.canvas_item, width=event.width)

    @staticmethod
    def _summary(step):
        kind = step["kind"]
        if kind == "open":
            return step["url"][:110]
        if kind == "wait":
            return str(step["seconds"]) + " секунд"
        if kind == "wait_visible":
            return "CSS: " + step["selector"][:95] + "  •  до " + str(step["seconds"]) + " сек."
        if kind in ("click", "fill"):
            return "CSS: " + step["selector"][:95] + (
                "  •  текст введён" if kind == "fill" else "")
        return ("Вниз " if step["pixels"] > 0 else "Вверх ") + (
            str(abs(step["pixels"])) + " px")

    def redraw(self):
        for child in self.stack.winfo_children():
            child.destroy()
        if not self.steps:
            tk.Label(
                self.stack, text="✦  ДОБАВЬТЕ ПЕРВЫЙ БЛОК ИЗ ПАЛИТРЫ",
                fg=CYAN, bg="#10182d", font=("Arial", 12, "bold")
            ).pack(padx=14, pady=55)
        for index, step in enumerate(self.steps):
            card = tk.Frame(self.stack, bg=PANEL,
                            highlightbackground="#574c89", highlightthickness=1)
            card.pack(fill="x", padx=18, pady=(14, 2))
            line = tk.Frame(card, bg=PANEL)
            line.pack(fill="x", padx=13, pady=(11, 4))
            icon, title = TITLES[step["kind"]]
            tk.Label(line, text=f"{index + 1:02d}   {icon}  {title}",
                     bg=PANEL, fg=ACCENT,
                     font=("Arial", 11, "bold")).pack(side="left")
            for sign, callback in (
                    ("✕", lambda i=index: self.remove(i)),
                    ("✎", lambda i=index: self.edit(i)),
                    ("↓", lambda i=index: self.move(i, 1)),
                    ("↑", lambda i=index: self.move(i, -1))):
                tk.Button(line, text=sign, command=callback,
                          bg="#283157", fg=CYAN, relief="flat", bd=0,
                          padx=9, pady=3, cursor="hand2").pack(
                              side="right", padx=(6, 0))
            tk.Label(card, text=self._summary(step), bg=PANEL, fg=TEXT,
                     wraplength=650, justify="left",
                     font=("Arial", 10)).pack(
                         anchor="w", padx=18, pady=(0, 12))
            if index < len(self.steps) - 1:
                tk.Label(self.stack, text="│\n▼", bg="#10182d", fg=CYAN,
                         font=("Arial", 11)).pack(pady=(4, 0))
        self.canvas.update_idletasks()
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def _ask_step(self, kind, old=None):
        old = old or {}
        title = "Murdilimax · Flow Block"
        if kind == "open":
            url = simpledialog.askstring(
                title, "HTTP(S)-страница для новой вкладки:",
                initialvalue=old.get("url", "https://example.org"),
                parent=self.window)
            if url is None:
                return None
            raw = {"kind": "open", "url": url}
        elif kind == "wait":
            sec = simpledialog.askinteger(
                title, "Пауза от 1 до 30 секунд:",
                minvalue=1, maxvalue=30,
                initialvalue=old.get("seconds", 2), parent=self.window)
            if sec is None:
                return None
            raw = {"kind": "wait", "seconds": sec}
        elif kind == "wait_visible":
            selector = simpledialog.askstring(
                title, "CSS-селектор элемента, который должен появиться:",
                initialvalue=old.get("selector", "#content"),
                parent=self.window)
            if selector is None:
                return None
            seconds = simpledialog.askinteger(
                title, "Ждать появления элемента от 1 до 15 секунд:",
                minvalue=1, maxvalue=15,
                initialvalue=old.get("seconds", 8), parent=self.window)
            if seconds is None:
                return None
            raw = {"kind": "wait_visible", "selector": selector,
                   "seconds": seconds}
        elif kind == "click":
            selector = simpledialog.askstring(
                title, "CSS-селектор кнопки или элемента:",
                initialvalue=old.get("selector", "button"),
                parent=self.window)
            if selector is None:
                return None
            raw = {"kind": "click", "selector": selector}
        elif kind == "fill":
            selector = simpledialog.askstring(
                title, "CSS-селектор обычного текстового поля (не пароль):",
                initialvalue=old.get("selector", "input[name='search']"),
                parent=self.window)
            if selector is None:
                return None
            value = simpledialog.askstring(
                title, "Обычный текст — НЕ пароль и НЕ токен:",
                initialvalue=old.get("text", ""),
                parent=self.window)
            if value is None:
                return None
            raw = {"kind": "fill", "selector": selector, "text": value}
        else:
            pixels = simpledialog.askinteger(
                title, "Прокрутить страницу: положительно вниз, отрицательно вверх:",
                minvalue=-1500, maxvalue=1500,
                initialvalue=old.get("pixels", 550),
                parent=self.window)
            if pixels is None:
                return None
            raw = {"kind": "scroll", "pixels": pixels}
        return validated_step(raw)

    def add(self, kind):
        if len(self.steps) >= MAX_STEPS:
            messagebox.showerror("Murdilimax", "Максимум 12 блоков.",
                                 parent=self.window)
            return
        try:
            item = self._ask_step(kind)
            if item is not None:
                self.steps.append(item)
                self.redraw()
                self.canvas.yview_moveto(1.0)
        except (ValueError, TypeError) as exc:
            messagebox.showerror("Murdilimax", str(exc), parent=self.window)

    def edit(self, index):
        try:
            step = self._ask_step(self.steps[index]["kind"], self.steps[index])
            if step is not None:
                self.steps[index] = step
                self.redraw()
        except (ValueError, TypeError) as exc:
            messagebox.showerror("Murdilimax", str(exc), parent=self.window)

    def move(self, index, delta):
        next_index = index + delta
        if not 0 <= next_index < len(self.steps):
            return
        self.steps[index], self.steps[next_index] = (
            self.steps[next_index], self.steps[index])
        self.redraw()

    def remove(self, index):
        del self.steps[index]
        self.redraw()

    def save(self):
        try:
            saved = save_flow(
                self.store, self.name.get(), self.profile_ids, self.steps,
                replace_id=self.original["id"] if self.original else None)
        except (OSError, ValueError) as exc:
            messagebox.showerror("Murdilimax", str(exc), parent=self.window)
            return
        if self.on_saved is not None:
            self.on_saved(saved)
        self.window.destroy()
