"""Verify the real Qt font can display the full Russian alphabet."""
from __future__ import annotations
from PySide6.QtGui import QFont, QFontDatabase, QRawFont

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
    raw = QRawFont.fromFont(font, QFontDatabase.WritingSystem.Cyrillic)
    if not raw.isValid():
        return False
    glyphs = raw.glyphIndexesForString(CYRILLIC_TEXT)
    return len(glyphs) == len(CYRILLIC_TEXT) and all(gid != 0 for gid in glyphs)

def select_cyrillic_font() -> QFont:
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
    raise RuntimeError("No readable Cyrillic font found; install standard Windows Segoe UI/Arial fonts.")

def validate_cyrillic_font(font: QFont) -> None:
    if not supports_cyrillic(font):
        raise RuntimeError("The selected UI font cannot render Cyrillic letters: "+font.family())
