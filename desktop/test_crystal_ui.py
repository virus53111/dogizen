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
        self.assertEqual(VERSION,'0.10.7')
        self.assertEqual(self.window.table.rowCount(),0)
        self.assertFalse(self.window.stop_btn.isEnabled())
        self.assertEqual(len(self.window.checkboxes),7)
        self.assertFalse(self.window.deep.isChecked(), 'Slow partition recovery must require opt-in')
        self.assertFalse(self.window.mft.isChecked(), 'MFT salvage must require opt-in')
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
    def test_small_window_has_no_horizontal_page_scroll(self):
        from PySide6.QtWidgets import QScrollArea
        self.window.show()
        for language in ('ru','en'):
            self.window.lang=language;self.window.retranslate()
            for width in (900,1180):
                self.window.resize(width,700);self.app.processEvents()
                scroll=self.window.findChild(QScrollArea)
                from PySide6.QtWidgets import QWidget
                sizing=sorted([(c.minimumSizeHint().width(),c.objectName(),getattr(c,'text',lambda:'' )()[:80]) for c in scroll.widget().findChildren(QWidget)],reverse=True)[:15]
                self.assertEqual(scroll.horizontalScrollBar().maximum(),0,(language,width,sizing))
                self.assertFalse(self.window.btn_volume.geometry().intersects(self.window.btn_image.geometry()))
        self.assertTrue(self.window.advanced.isHidden())
        self.window.advanced_btn.click();self.app.processEvents()
        self.assertFalse(self.window.advanced.isHidden())
        self.assertEqual(scroll.horizontalScrollBar().maximum(),0)
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

    def test_scan_navigation_and_zero_result_diagnostics(self):
        self.assertEqual(len(self.window.current_categories()), 7)
        self.window.resize(900, 560)
        self.window.show()
        self.app.processEvents()
        scroll = self.window.page_scroll.verticalScrollBar()
        scroll.setValue(scroll.maximum())
        self.window.nav[0][0].click()
        self.assertEqual(scroll.value(), 0)
        self.window.lang = 'ru'
        self.window.retranslate()
        self.window.handle_job('scan_done',
                               {'found': 0, 'volumes': 1, 'errors': [], 'cancelled': False})
        self.assertIn('По сигнатурам', self.window.status_detail.text())

    def test_worker_cancel_signal(self):
        w=Job('preview',{'source':'not_exist','item':None})
        self.assertFalse(w.stop.is_set())
        w.stop.set();self.assertTrue(w.stop.is_set())

    def test_whole_drive_selection_never_opens_a_folder(self):
        drive={'letter':'C:','label':'Windows','size':256*1024**3,'fs':'NTFS','path':r'\\.\C:'}
        with patch('murdilimax_crystal.enumerate_volumes',return_value=[drive]), \
             patch('murdilimax_crystal.QInputDialog.getItem',side_effect=lambda *args: (args[3][0],True)), \
             patch('murdilimax_crystal.QFileDialog.getExistingDirectory') as folders:
            self.window.pick_volume()
        folders.assert_not_called()
        self.assertEqual(self.window.source,r'\\.\C:')
        self.assertEqual(self.window.mode,'volume')
        self.assertIn('C:',self.window.source_text.text())
        self.assertFalse(self.window.image_btn.isEnabled())
        with patch.object(self.window,'launch') as launch, \
             patch('murdilimax_crystal.QMessageBox.warning',return_value=__import__('PySide6.QtWidgets',fromlist=['QMessageBox']).QMessageBox.StandardButton.Yes):
            self.window.scan()
        self.assertEqual(launch.call_args.args[1]['source'],r'\\.\C:')
        self.assertEqual(launch.call_args.args[1]['mode'],'volume')

    def test_unknown_drive_letter_is_selectable(self):
        drives=[
            {'letter':'C:','label':'System','size':230*1024**3,'fs':'NTFS','path':r'\\.\C:'},
            {'letter':'D:','label':'','size':928*1024**3,'fs':'UNKNOWN','path':r'\\.\D:'},
        ]
        with patch('murdilimax_crystal.enumerate_volumes',return_value=drives), \
             patch('murdilimax_crystal.QInputDialog.getItem',
                   side_effect=lambda *args: (args[3][1],True)):
            self.window.pick_volume()
        self.assertEqual(self.window.source,r'\\.\D:')
        self.assertEqual(self.window.mode,'volume')
        self.assertIn('D:',self.window.source_text.text())
        self.assertFalse(self.window.halim_btn.text()=='')
        self.assertFalse(self.window.scan_mode.isHidden())

    def test_unsupported_filesystem_switches_to_signature_mode(self):
        drives=[{'letter':'F:','label':'Flash','size':100,'fs':'FAT32','path':r'\\.\F:'}]
        with patch('murdilimax_crystal.enumerate_volumes',return_value=drives), \
             patch('murdilimax_crystal.QInputDialog.getItem',
                   side_effect=lambda *args: (args[3][0],True)):
            self.window.pick_volume()
        self.assertEqual(self.window.source,r'\\.\F:')
        self.assertEqual(self.window.mode,'volume-carve')
        self.assertEqual(self.window.scan_mode.currentIndex(),1)

    def test_drive_cancel_keeps_previous_source(self):
        self.window.source='old.img';self.window.mode='metadata'
        with patch('murdilimax_crystal.enumerate_volumes',return_value=[{'letter':'D:','label':'Data','size':10,'fs':'NTFS','path':r'\\.\D:'}]), \
             patch('murdilimax_crystal.QInputDialog.getItem',return_value=('',False)):
            self.window.pick_volume()
        self.assertEqual(self.window.source,'old.img')

    def test_drive_mode_switch_and_busy_state(self):
        self.window.source=r'\\.\D:';self.window.mode='volume'
        self.window.scan_mode.setCurrentIndex(1)
        self.assertEqual(self.window.mode,'volume-carve')
        self.window.set_busy(True)
        self.assertFalse(self.window.btn_volume.isEnabled())
        self.window.set_busy(False)
        self.assertTrue(self.window.btn_volume.isEnabled())

if __name__=='__main__':unittest.main()
