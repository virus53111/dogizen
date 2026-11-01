"""Offline i18n checks; no browser engine, payment service or Tk display."""
import json
import tempfile
import unittest
from pathlib import Path
from i18n import translate, load_language, save_language, TEXT


class DesktopTranslationTests(unittest.TestCase):
    def test_core_ui_labels(self):
        self.assertEqual(translate("Профили", "en"), "Profiles")
        self.assertEqual(translate("▶ Запустить", "en"), "▶ Launch")
        self.assertEqual(translate("● Запущен", "en"), "● Running")
        self.assertEqual(translate("Account & license", "ru"), "Аккаунт и лицензия")

    def test_critical_long_language_copy(self):
        for original in (
            "Один аккаунт. Один компьютер.",
            "Поиск (название, группа, теги, заметки)",
            "Настройки браузерного профиля",
            "Теги через запятую",
        ):
            self.assertNotEqual(translate(original, "en"), original)

    def test_user_data_unmodified(self):
        for value in (
            "Socks5://private:password@127.0.0.1:8080",
            "Project Alpha / notes / tags",
            "my_proxy_02",
            "https://example.org/hello",
        ):
            self.assertEqual(translate(value, "en"), value)
            self.assertEqual(translate(value, "ru"), value)

    def test_language_roundtrip(self):
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp)
            self.assertEqual(load_language(home), "ru")
            save_language(home, "en")
            self.assertEqual(load_language(home), "en")
            self.assertEqual(json.loads((home / "ui-preferences.json").read_text())["language"], "en")
            save_language(home, "ru")
            self.assertEqual(load_language(home), "ru")

    def test_invalid_or_broken_prefs(self):
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp)
            self.assertRaises(ValueError, save_language, home, "other")
            (home / "ui-preferences.json").write_text("{broken")
            self.assertEqual(load_language(home), "ru")
            (home / "ui-preferences.json").write_text('{"language":"fr"}')
            self.assertEqual(load_language(home), "ru")

    def test_catalog_is_not_ambiguous(self):
        assert len(TEXT) >= 70
        assert all(k and v for k, v in TEXT.items())
        reverse = {v: k for k, v in TEXT.items() if v != k}
        self.assertEqual(len(reverse), len([v for k, v in TEXT.items() if v != k]))


if __name__ == "__main__":
    unittest.main()
