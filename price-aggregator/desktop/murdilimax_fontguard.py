"""Verify the real Qt font can display the full Russian alphabet."""
from __future__ import annotations
from PySide6.QtGui import QFont, QFontDatabase, QRawFont, QFontMetrics
from pathlib import Path
import os

CYRILLIC_TEXT = (
    "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
    " Восстановление файлов Диски Сканирование 123 ABC xyz"
)
PREFERRED_FAMILIES = (
    "Segoe UI", "Arial", "Tahoma", "Microsoft Sans Serif",
    "Noto Sans", "DejaVu Sans", "Liberation Sans", "Inter",
)

def supports_cyrillic(font: QFont) -> bool:
    # Resolve an actual physical font for Cyrillic, never trust a font name alone.
    for writing in (QFontDatabase.WritingSystem.Cyrillic, QFontDatabase.WritingSystem.Any):
        raw = QRawFont.fromFont(font, writing)
        if raw.isValid():
            glyphs = raw.glyphIndexesForString(CYRILLIC_TEXT)
            if len(glyphs) == len(CYRILLIC_TEXT) and all(gid != 0 for gid in glyphs):
                return True
    # On some headless Windows Qt builds QRawFont cannot access GDI/DirectWrite;
    # use the actual QFontMetrics text-rendering engine as an additional check.
    metrics = QFontMetrics(font)
    return all(metrics.inFontUcs4(ord(ch)) for ch in CYRILLIC_TEXT)

def select_cyrillic_font() -> QFont:
    # Use only fonts installed on the user's own Windows computer.
    if os.name == 'nt':
        fonts_dir = Path(os.environ.get('WINDIR', r'C:\Windows')) / 'Fonts'
        for filename in ('segoeui.ttf', 'arial.ttf', 'tahoma.ttf', 'calibri.ttf'):
            path = fonts_dir / filename
            if path.is_file():
                QFontDatabase.addApplicationFont(str(path))
    installed = QFontDatabase.families()
    lookup = {family.casefold(): family for family in installed}
    visited = set()
    for candidate in (*PREFERRED_FAMILIES, *installed):
        name = lookup.get(candidate.casefold())
        if not name or name.casefold() in visited:
            continue
        visited.add(name.casefold())
        font = QFont(name, 10)
        if supports_cyrillic(font):
            return font
    raise RuntimeError("No readable Cyrillic Qt font found. Available: "+repr(installed[:20]))

def validate_cyrillic_font(font: QFont) -> None:
    if not supports_cyrillic(font):
        raise RuntimeError("The selected UI font cannot render Cyrillic letters: "+font.family())
