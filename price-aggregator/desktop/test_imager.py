"""Deterministic tests for v0.4 acquisition; no actual hardware touched."""
from __future__ import annotations
import hashlib
import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import threading
import unittest
from unittest.mock import patch
from contextlib import contextmanager
from murdilimax_imager import image_source, read_adaptively, ImagingCancelled, SourceReadLimitExceeded


class FailingSource(io.BytesIO):
    sector_size = 512
    def __init__(self, data: bytes, bad_from: int, bad_to: int):
        super().__init__(data)
        self.bad_from, self.bad_to = bad_from, bad_to
    def read(self, size=-1):
        off=self.tell()
        if off < self.bad_to and off+size > self.bad_from:
            raise OSError('Simulated unreadable sector')
        return super().read(size)


class ImageTests(unittest.TestCase):
    def test_image_and_independent_hash_verification(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'source.bin'; dst=Path(d)/'clone.img'; data=bytes(range(256))*100
            src.write_bytes(data)
            report=image_source(str(src),str(dst),chunk_size=4096)
            self.assertEqual(dst.read_bytes(),data)
            self.assertEqual(report['sha256_image'],hashlib.sha256(data).hexdigest())
            self.assertTrue(report['verified_output'])
            self.assertEqual(report['unreadable_ranges'],[])
            self.assertFalse(Path(str(dst)+'.mrd-state.json').exists())
            self.assertEqual(json.loads(Path(report['report']).read_text())['sha256_image'], report['sha256_image'])

    def test_damaged_sector_zero_filled_and_reported(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'fake.bin';dst=Path(d)/'image.img'
            data=bytes([0xA5])*8192;src.write_bytes(data)
            @contextmanager
            def source_override(_):yield FailingSource(data,1024,1536),len(data)
            with patch('murdilimax_imager.open_source',side_effect=source_override):
                report=image_source(str(src),str(dst),chunk_size=4096)
            self.assertEqual(dst.read_bytes(),data[:1024]+bytes(512)+data[1536:])
            self.assertEqual(report['unreadable_ranges'],[[1024,512]])
            self.assertEqual(report['unreadable_bytes'],512)
            self.assertGreater(report['failed_reads'],0)

    def test_resume_paused_on_checkpoint(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'src.bin';dst=Path(d)/'out.img'
            data=bytes(range(256))*48;src.write_bytes(data)
            cancel=threading.Event();progress_called=[]
            def onprogress(done,total,lost):
                progress_called.append(done)
                cancel.set()
            with self.assertRaises(ImagingCancelled):
                image_source(str(src),str(dst),chunk_size=4096,cancel=cancel,progress=onprogress)
            self.assertEqual(progress_called,[4096])
            journal=Path(str(dst)+'.mrd-state.json')
            self.assertEqual(json.loads(journal.read_text())['bytes_completed'],4096)
            recovered=image_source(str(src),str(dst),chunk_size=4096)
            self.assertEqual(dst.read_bytes(),data)
            self.assertEqual(recovered['sha256_image'],hashlib.sha256(data).hexdigest())
            self.assertFalse(journal.exists())

    def test_corrupted_partial_rejects_resume(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'src.bin';dst=Path(d)/'out.img';src.write_bytes(b'a'*8192)
            cancel=threading.Event()
            with self.assertRaises(ImagingCancelled):
                image_source(str(src),str(dst),chunk_size=4096,cancel=cancel,progress=lambda *_:cancel.set())
            partial=Path(str(dst)+'.part')
            partial.write_bytes(b'!'*4096)
            with self.assertRaisesRegex(ValueError,'checkpoint hash'):
                image_source(str(src),str(dst),chunk_size=4096)
            self.assertFalse(dst.exists())

    def test_source_mutation_rejects_resume(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'src.bin';dst=Path(d)/'out.img';src.write_bytes(b'a'*8192)
            cancel=threading.Event()
            with self.assertRaises(ImagingCancelled):
                image_source(str(src),str(dst),chunk_size=4096,cancel=cancel,progress=lambda *_:cancel.set())
            src.write_bytes(b'a'*8192+b'b')
            with self.assertRaisesRegex(ValueError,'does not match'):
                image_source(str(src),str(dst),chunk_size=4096)

    def test_never_overwrites_finished_image(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'src.bin';dst=Path(d)/'out.img';src.write_bytes(b'abcd'*1024);dst.write_bytes(b'IMPORTANT')
            with self.assertRaises(FileExistsError):
                image_source(str(src),str(dst),chunk_size=4096)
            self.assertEqual(dst.read_bytes(),b'IMPORTANT')

    def test_partial_without_journal_refused(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'src.bin';dst=Path(d)/'out.img';src.write_bytes(b'abcd'*1024)
            Path(str(dst)+'.part').write_bytes(b'important')
            with self.assertRaisesRegex(ValueError,'journal'):
                image_source(str(src),str(dst),chunk_size=4096)

    def test_bad_media_cutoff(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'src.bin';dst=Path(d)/'out.img'
            data=b'X'*524288;src.write_bytes(data)
            @contextmanager
            def source_override(_):yield FailingSource(data,0,len(data)),len(data)
            with patch('murdilimax_imager.open_source',side_effect=source_override):
                with self.assertRaises(SourceReadLimitExceeded):
                    image_source(str(src),str(dst),chunk_size=4096)
            self.assertFalse(dst.exists())
            self.assertTrue(Path(str(dst)+'.part').exists())

    def test_read_adaptively_preserves_good_sectors(self):
        data=bytes(range(256))*64
        src=FailingSource(data,4096,4608)
        bad=[];metric={'failed_reads':0,'bad_bytes':0}
        out=read_adaptively(src,0,len(data),512,bad,metric)
        self.assertEqual(out[:4096],data[:4096]);self.assertEqual(out[4608:],data[4608:])
        self.assertEqual(out[4096:4608],bytes(512));self.assertEqual(bad,[[4096,512]])

    def test_different_source_same_filename_refused(self):
        with TemporaryDirectory() as d:
            src=Path(d)/'src.bin';dst=Path(d)/'out.img';src.write_bytes(b'a'*8192)
            cancel=threading.Event()
            with self.assertRaises(ImagingCancelled):
                image_source(str(src),str(dst),chunk_size=4096,cancel=cancel,progress=lambda *_:cancel.set())
            other=Path(d)/'other.bin';other.write_bytes(b'a'*8192)
            with self.assertRaisesRegex(ValueError,'does not match'):
                image_source(str(other),str(dst),chunk_size=4096)


# Extra scenarios extend the class without changing the self-contained corpus.
def _source_changes_mid_acquisition(self):
    with TemporaryDirectory() as d:
        src=Path(d)/'src.bin';dst=Path(d)/'out.img';src.write_bytes(b'R'*8192)
        def change_source(done,total,bad):
            if done==4096:src.write_bytes(b'Z'*8192)
        with self.assertRaisesRegex(IOError,'Source changed'):
            image_source(str(src),str(dst),chunk_size=4096,progress=change_source)
        self.assertFalse(dst.exists())
        self.assertTrue(Path(str(dst)+'.part').is_file())
ImageTests.test_source_changes_mid_acquisition=_source_changes_mid_acquisition

if __name__ == '__main__': unittest.main()
