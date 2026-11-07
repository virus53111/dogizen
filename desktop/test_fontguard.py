"""Windows CI font-coverage gate for the actual Qt user interface."""
import os, unittest
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
try:
    from PySide6.QtWidgets import QApplication
    from murdilimax_fontguard import CYRILLIC_TEXT, supports_cyrillic, select_cyrillic_font, validate_cyrillic_font
except ImportError:
    QApplication = None

@unittest.skipIf(QApplication is None,"Qt installed by Windows CI")
class FontSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app=QApplication.instance() or QApplication(["font-smoke"])
    def test_full_russian_alphabet_covered(self):
        font=select_cyrillic_font()
        self.assertIn("Ё",CYRILLIC_TEXT)
        self.assertIn("ё",CYRILLIC_TEXT)
        self.assertTrue(supports_cyrillic(font))
        self.app.setFont(font)
        validate_cyrillic_font(self.app.font())
    def test_app_stylesheet_does_not_override_font_family(self):
        from murdilimax_crystal import QSS
        self.assertNotIn("font-family:",QSS)

if __name__=="__main__": unittest.main()
