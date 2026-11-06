"""Stage 6: synthetic byte-for-byte recovery gates; no real disks."""
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from murdilimax_qualitygate import run_quality_gate, build_fixtures

class QualityGateTests(unittest.TestCase):
    def test_synthetic_recovery_truth(self):
        with TemporaryDirectory() as d:
            result=run_quality_gate(Path(d)/'test_report.json',require_pass=False)
            s=result['summary']
            self.assertEqual((s['cases_total'],s['cases_passed']),(12,12), str([(x['name'],x['errors']) for x in result['cases'] if not x['passed']]))
            self.assertEqual((s['files_exact_matched'],s['files_exact_expected']),(14,14))
            self.assertEqual(s['unsafe_recovery_blocks_verified'],2)
            self.assertFalse(result['real_world_validated'])
            self.assertFalse(result['competitor_comparison_performed'])
    def test_report_does_not_overwrite(self):
        with TemporaryDirectory() as d:
            path=Path(d)/'report.json';path.write_text('sentinel')
            with self.assertRaises(FileExistsError):run_quality_gate(path)
            self.assertEqual(path.read_text(),'sentinel')
    def test_only_regular_synthetic_images(self):
        with TemporaryDirectory() as d:
            fixtures=build_fixtures(Path(d))
            self.assertEqual(len(fixtures),12)
            self.assertEqual(len({c['name'] for c in fixtures}),12)
            self.assertTrue(all(c['image'].is_file() for c in fixtures))
    def test_json_has_explicit_synthetic_scope(self):
        with TemporaryDirectory() as d:
            path=Path(d)/'report.json'
            run_quality_gate(path)
            j=json.loads(path.read_text(encoding='utf-8'))
            self.assertIn('SYNTHETIC',j['scope'])
            self.assertTrue(j['summary']['passed'], str([(x['name'],x['errors']) for x in j['cases'] if not x['passed']]))
if __name__=='__main__':unittest.main()
