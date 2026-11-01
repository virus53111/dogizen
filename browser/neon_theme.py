"""Neon design system for the Murdilimax Tkinter beta.

Presentation only. No profile, proxy, fingerprint, account or licensing logic.
The visual design is intentionally distinct from browser-engine internals.
"""
from __future__ import annotations

import tkinter as tk
from tkinter import ttk

BG = "#090d22"
PANEL = "#141d39"
TEXT = "#f5f4ff"
MUTED = "#aab7d7"
ACCENT = "#c38cff"
CYAN = "#66e8ff"
GREEN = "#5be6b4"
PINK = "#f365dd"
BORDER = "#534375"


def apply_neon_theme(root: tk.Tk) -> None:
    """Give all existing ttk controls a coherent neon/dark appearance."""
    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure(".", background=BG, foreground=TEXT,
                    font=("Arial", 10))
    style.configure("TFrame", background=BG)
    style.configure("TLabel", background=BG, foreground=TEXT)
    style.configure("TButton", background="#273158", foreground=TEXT,
                    padding=(14, 11), borderwidth=1, relief="flat",
                    bordercolor="#544b86", focuscolor="#6044a3")
    style.map("TButton",
              background=[("disabled", "#242943"), ("pressed", "#4e4094"),
                          ("active", "#3b3d79")],
              foreground=[("disabled", "#8488a6"), ("active", "#ffffff")],
              bordercolor=[("active", "#8d6de7")])
    style.configure("Neon.TButton", background="#8750ee", foreground="#ffffff",
                    padding=(17, 11), borderwidth=1, bordercolor="#b591ff",
                    font=("Arial", 10, "bold"))
    style.map("Neon.TButton",
              background=[("active", "#b55aee"), ("pressed", "#6941d0")],
              foreground=[("active", "#ffffff")])
    style.configure("Treeview", background=PANEL, foreground=TEXT,
                    fieldbackground=PANEL, rowheight=43,
                    borderwidth=0, relief="flat",
                    font=("Arial", 10))
    style.map("Treeview",
              background=[("selected", "#6940b6")],
              foreground=[("selected", "#ffffff")])
    style.configure("Treeview.Heading",
                    background="#27234f", foreground="#e3c0ff",
                    font=("Arial", 10, "bold"),
                    padding=(13, 15), borderwidth=0,
                    relief="flat")
    style.map("Treeview.Heading",
              background=[("active", "#493875")])
    style.configure("TEntry", fieldbackground="#1b2341",
                    foreground="#ffffff", insertcolor="#ffffff",
                    borderwidth=1, bordercolor="#6652a5",
                    padding=(10, 8))
    style.map("TEntry", bordercolor=[("focus", CYAN)])
    style.configure("TCombobox", fieldbackground="#1b2341",
                    foreground=TEXT, background="#322953",
                    arrowcolor=CYAN, bordercolor="#6652a5",
                    padding=(8, 8))
    style.map("TCombobox", fieldbackground=[("readonly", "#252b52")],
              foreground=[("readonly", TEXT)],
              bordercolor=[("focus", CYAN)])
    style.configure("TNotebook", background=BG, borderwidth=0,
                    tabmargins=(5, 8, 5, 2))
    style.configure("TNotebook.Tab", background="#1c2345",
                    foreground="#aeb8dd", padding=(25, 15),
                    borderwidth=0, font=("Arial", 11, "bold"))
    style.map("TNotebook.Tab",
              background=[("selected", "#673abd"), ("active", "#363064")],
              foreground=[("selected", "#ffffff"), ("active", "#e8ddff")])
    root.configure(bg=BG)


def _mix(one: str, two: str, fraction: float) -> str:
    a = tuple(int(one[i:i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(two[i:i + 2], 16) for i in (1, 3, 5))
    return "#{:02x}{:02x}{:02x}".format(
        *(round(x + (y - x) * fraction) for x, y in zip(a, b))
    )


class NeonHeader(tk.Canvas):
    """A lightweight scalable decorative hero in plain Tkinter Canvas.

    No external images, transparency or GPU dependency. Gradient is drawn in
    broad strips to keep redraws inexpensive on ordinary Windows/Mac devices.
    """

    def __init__(self, master: tk.Tk, on_open_folder):
        super().__init__(master, height=126, bg="#14132d", highlightthickness=0,
                         bd=0, relief="flat")
        self.pack(fill="x", padx=21, pady=(19, 7))
        self._folder = ttk.Button(self, text="↗ Папка данных",
                                  command=on_open_folder)
        self._folder.place(relx=1.0, x=-22, y=58, anchor="e")
        self.bind("<Configure>", self._draw)

    def _draw(self, event=None):
        self.delete("art")
        width = max(300, self.winfo_width())
        height = max(90, self.winfo_height())
        # Dark glass strip plus a thin pink-to-cyan luminous lower border.
        for x in range(0, width + 14, 14):
            ratio = x / max(1, width)
            stop = "#21163f" if ratio < .55 else "#0e3150"
            frac = ratio / .55 if ratio < .55 else (ratio - .55) / .45
            start = "#1a123a" if ratio < .55 else "#21163f"
            color = _mix(start, stop, max(0.0, min(1.0, frac)))
            self.create_rectangle(x, 0, min(width, x + 15), height,
                                  fill=color, outline="", tags="art")
        self.create_rectangle(0, 0, width, height,
                              outline="#7861b8", width=2, tags="art")
        # Neon ribbon curves / lens glow motifs in the right art zone.
        cx = int(width * .78)
        self.create_oval(cx - 65, -78, cx + 138, 125,
                         outline="#4a50ba", width=12, tags="art")
        self.create_oval(cx - 55, -66, cx + 125, 114,
                         outline="#a259ee", width=3, tags="art")
        self.create_oval(cx + 54, -18, cx + 153, 83,
                         outline="#53eaff", width=4, tags="art")
        self.create_arc(cx - 120, 48, cx + 185, 245,
                        start=43, extent=115, style="arc",
                        outline="#e658e8", width=5, tags="art")
        self.create_arc(cx - 90, 56, cx + 210, 237,
                        start=34, extent=103, style="arc",
                        outline="#43ddff", width=2, tags="art")
        self.create_oval(cx - 28, 34, cx + 12, 74,
                         fill="#582cb6", outline="#ad85ff",
                         width=2, tags="art")
        self.create_text(cx - 8, 54, text="✦", fill=CYAN,
                         font=("Arial", 19, "bold"), tags="art")
        # Brand / heading: readable text, no raster screenshot.
        self.create_text(26, 29, anchor="w", text="◆",
                         fill=PINK, font=("Arial", 27, "bold"),
                         tags="art")
        self.create_text(65, 31, anchor="w",
                         text="MURDILIMAX",
                         fill=TEXT,
                         font=("Arial", 24 if width > 780 else 19, "bold"),
                         tags="art")
        self.create_text(67, 65, anchor="w",
                         text="BROWSER   /   NEON WORKSPACE",
                         fill="#acacff",
                         font=("Arial", 10, "bold"),
                         tags="art")
        self.create_text(28, 104, anchor="w",
                         text="●  LOCAL BETA    ·    PROFILES    ·    PROXIES",
                         fill=GREEN,
                         font=("Arial", 9, "bold"),
                         tags="art")
        # Avoid covering the interactive button when width is small.
        self.tag_lower("art")
