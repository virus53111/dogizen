"""Windows CI offscreen UI smoke tests: verify the actual Qt window and its wiring."""
import os
import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch
os.environ.setdefault('QT_QPA_PLATFORM','offscreen')
try:
    from PySide6.QtWidgets import QApplication
    from murdilimax_crystal import CrystalWindow, Job, VERSION
    from murdilimax_engine import Candidate
    from murdilimax_session import make_session, save_session
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
        self.assertEqual(VERSION,'0.10.3')
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
    def test_loaded_session_is_view_only_and_source_switch_invalidates(self):
        with tempfile.TemporaryDirectory() as temp:
            base=Path(temp)
            source=base/'drive.img';source.write_bytes(b'not real data, just UI state testing')
            found=Candidate(fs='NTFS',name='photo.jpg',path='lost/photo.jpg',size=10,source_offset=0,
                            extents=[(512,10)],state='free')
            filename=base/'scan.mrd-session.json'
            save_session(str(filename),make_session(source=str(source),mode='metadata',entries=[found],total=1))
            with patch('murdilimax_crystal.QFileDialog.getOpenFileName',return_value=(str(filename),'')), \
                 patch('murdilimax_crystal.QMessageBox.information'):
                self.window.open_scan_session()
            self.assertIsNotNone(self.window.session_snapshot)
            self.assertEqual(self.window.table.rowCount(),1)
            self.assertFalse(self.window.restore_btn.isEnabled())
            self.assertFalse(self.window.preview_btn.isEnabled())
            self.assertTrue(self.window.btn_image.isEnabled())
            self.assertEqual(self.window.source,'')
            with patch('murdilimax_crystal.QFileDialog.getOpenFileName',return_value=(str(source),'')):
                self.window.pick_image()
            self.assertIsNone(self.window.session_snapshot)
            self.assertEqual(self.window.table.rowCount(),0)
            self.assertEqual(self.window.source,str(source))

    def test_completed_scan_summary_export(self):
        with tempfile.TemporaryDirectory() as temp:
            base=Path(temp);target=base/'scan.mrd-session.json'
            self.window.source=str(base/'disk.img');self.window.mode='metadata'
            item=Candidate(fs='NTFS',name='photo.jpg',path='lost/photo.jpg',size=13,
                           source_offset=12345,extents=[(33,13)],resident=b'UNSAFE SECRET',state='free')
            self.window.entries=[item];self.window.scan_complete=True;self.window.scan_total=1
            self.window.set_busy(False)
            self.assertTrue(self.window.session_save_btn.isEnabled())
            with patch('murdilimax_crystal.QFileDialog.getSaveFileName',return_value=(str(target),'')), \
                 patch('murdilimax_crystal.QMessageBox.information'):
                self.window.save_scan_session()
            text=target.read_text(encoding='utf-8')
            self.assertNotIn('UNSAFE SECRET',text)
            self.assertNotIn('extents',text)
            self.assertIn('lost/photo.jpg',text)

    def test_worker_cancel_signal(self):
        w=Job('preview',{'source':'not_exist','item':None})
        self.assertFalse(w.stop.is_set())
        w.stop.set();self.assertTrue(w.stop.is_set())

if __name__=='__main__':unittest.main()
