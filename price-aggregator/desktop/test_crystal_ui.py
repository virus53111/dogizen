"""Windows CI offscreen UI smoke tests: verify the actual Qt window and its wiring."""
import os
import unittest
os.environ.setdefault('QT_QPA_PLATFORM','offscreen')
try:
    from PySide6.QtWidgets import QApplication
    from murdilimax_crystal import CrystalWindow, Job, VERSION
except ImportError:
    QApplication=None

@unittest.skipIf(QApplication is None,'Qt not installed in this environment; Windows CI installs PySide6')
class CrystalGuiSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app=QApplication.instance() or QApplication(['murdilimax-qt-smoke'])
    def setUp(self):
        self.window=CrystalWindow()
    def tearDown(self):
        self.window.close();self.window.deleteLater()
    def test_version_and_window(self):
        self.assertEqual(VERSION,'0.10.1')
        self.assertEqual(self.window.table.rowCount(),0)
        self.assertFalse(self.window.stop_btn.isEnabled())
        self.assertEqual(len(self.window.checkboxes),7)
    def test_russian_english_switch(self):
        self.window.lang='ru';self.window.retranslate()
        self.assertIn('Восстановление',self.window.hero_title.text())
        self.window.switch_language()
        self.assertIn('Data recovery',self.window.hero_title.text())
        self.window.switch_language()
        self.assertIn('Восстановление',self.window.hero_title.text())
    def test_no_fake_scan_results(self):
        self.assertEqual(self.window.entries,[])
        self.assertEqual(self.window.count_label.text(),'0')
    def test_worker_cancel_signal(self):
        w=Job('preview',{'source':'not_exist','item':None})
        self.assertFalse(w.stop.is_set())
        w.stop.set();self.assertTrue(w.stop.is_set())

if __name__=='__main__':unittest.main()
