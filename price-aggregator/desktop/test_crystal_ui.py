"""Real Qt startup smoke checks. Test after installing PySide6-Essentials in Windows CI."""
import os,unittest
os.environ.setdefault("QT_QPA_PLATFORM","offscreen")
try:
 from PySide6.QtWidgets import QApplication
 from murdilimax_crystal import Window,VERSION
except ImportError:
 QApplication=None
@unittest.skipIf(QApplication is None,"Qt not installed in this environment")
class CrystalWindowsSmokeTest(unittest.TestCase):
 @classmethod
 def setUpClass(cls): cls.app=QApplication.instance() or QApplication(["qt-smoke"])
 def test_russian_and_english(self):
  w=Window()
  w.lang="ru";w.translate()
  self.assertEqual(VERSION,"0.10.0")
  self.assertIn("Восстановление",w.head.text())
  self.assertEqual(w.table.rowCount(),0)
  w.change_lang()
  self.assertIn("Data recovery",w.head.text())
  self.assertEqual(w.table.rowCount(),0)
  w.close()
 if __name__ == "__main__":unittest.main()
