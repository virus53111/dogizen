"""Session tests run with no Qt and no physical devices."""
import json
from pathlib import Path
import tempfile
import unittest
from murdilimax_session import (make_session,summary_entry,save_session,load_session,
                                validate_session,MAX_JSON_BYTES)
from murdilimax_engine import Candidate
from murdilimax_recovery_alpha import Hit

class SessionTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        self.item=Candidate(fs='NTFS', name='test.jpg',path='lost/test.jpg',size=3,
            source_offset=512,extents=[(4096,3)],resident=b'abc',state='free')
    def doc(self):
        return make_session(source='C:/sample.img',mode='metadata',entries=[self.item],total=1)
    def test_whitelist_drops_offsets_and_contents(self):
        record=summary_entry(self.item)
        self.assertNotIn('extents', record)
        self.assertNotIn('resident', record)
        self.assertNotIn('source_offset', record)
        self.assertEqual(record['path'],'lost/test.jpg')
        self.assertNotIn('YWJj',json.dumps(record))
    def test_roundtrip(self):
        path=self.root/'saved.mrd-session.json'
        save_session(str(path), self.doc())
        loaded=load_session(str(path))
        self.assertTrue(loaded['view_only']);self.assertEqual(len(loaded['entries']),1)
    def test_no_overwrite(self):
        path=self.root/'saved.mrd-session.json';path.write_text('keep')
        with self.assertRaises(FileExistsError):save_session(str(path),self.doc())
        self.assertEqual(path.read_text(),'keep')
    def test_no_symlink_load(self):
        path=self.root/'session.json';save_session(str(path),self.doc())
        link=self.root/'link.json'
        try:link.symlink_to(path)
        except OSError:self.skipTest('Symlink creation not supported')
        with self.assertRaises(ValueError):load_session(str(link))
    def test_reject_fake_recovery_fields(self):
        doc=self.doc();doc['entries'][0]['extents']=[[1,4096]]
        with self.assertRaises(ValueError):validate_session(doc)
    def test_reject_mutable_authorization(self):
        doc=self.doc();doc['view_only']=False
        with self.assertRaises(ValueError):validate_session(doc)
    def test_reject_invalid_mode(self):
        doc=self.doc();doc['mode']='physical-write'
        with self.assertRaises(ValueError):validate_session(doc)
    def test_reject_invalid_sizes(self):
        doc=self.doc();doc['entries'][0]['size']=-1
        with self.assertRaises(ValueError):validate_session(doc)
        doc=self.doc();doc['entries'][0]['size']=True
        with self.assertRaises(ValueError):validate_session(doc)
    def test_reject_oversized(self):
        path=self.root/'giant.json'
        with path.open('wb') as f:f.truncate(MAX_JSON_BYTES+1)
        with self.assertRaises(ValueError):load_session(str(path))
    def test_reject_malformed(self):
        path=self.root/'broken.json';path.write_text('{oops')
        with self.assertRaises(ValueError):load_session(str(path))
    def test_hit_carries_only_display(self):
        hit=Hit('Photos','picture.jpg','/a/picture.jpg',1000,5000,True)
        data=summary_entry(hit)
        self.assertEqual(data['size'],5000)
        self.assertNotIn('offset',data)
    def test_truncated_session(self):
        doc=make_session(source='C:/sample.img',mode='metadata',entries=[self.item],total=50000)
        self.assertTrue(doc['truncated']);self.assertEqual(doc['total_found'],50000)
if __name__=='__main__':unittest.main()
