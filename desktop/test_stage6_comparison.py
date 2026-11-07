import unittest,json
from hashlib import sha256
from pathlib import Path
from tempfile import TemporaryDirectory
from murdilimax_compare import evaluate_comparison

class IndependentComparisonTests(unittest.TestCase):
    def test_two_tools_same_truth(self):
        with TemporaryDirectory() as d:
            p=Path(d);(p/'A').mkdir();(p/'B').mkdir()
            first=b'known photo';second=b'known document'
            (p/'A'/'one.jpg').write_bytes(first);(p/'A'/'two.pdf').write_bytes(second)
            (p/'B'/'one.jpg').write_bytes(first);(p/'B'/'other.bin').write_bytes(b'unknown')
            j={'cases':[{'id':'same-input','expected_sha256':[sha256(first).hexdigest(),sha256(second).hexdigest()],
                'runs':[{'tool':'A','output_dir':'A'},{'tool':'B','output_dir':'B'}]}]}
            manifest=p/'ground.json';manifest.write_text(json.dumps(j))
            rows=evaluate_comparison(manifest,p/'report.json')['cases'][0]['runs']
            self.assertEqual(rows[0]['exact_recall'],1.0)
            self.assertEqual(rows[1]['exact_recall'],0.5)
            self.assertEqual(rows[1]['unmatched_output_files'],1)
    def test_no_overwrite(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'report.json';p.write_text('existing')
            with self.assertRaises(FileExistsError):
                evaluate_comparison(Path(d)/'none.json',p)
    def test_invalid_ground_truth(self):
        with TemporaryDirectory() as d:
            p=Path(d);(p/'out').mkdir()
            j={'cases':[{'id':'x','expected_sha256':[],'runs':[{'tool':'A','output_dir':'out'}]}]}
            manifest=p/'manifest.json';manifest.write_text(json.dumps(j))
            with self.assertRaises(ValueError):
                evaluate_comparison(manifest,p/'report.json')
    def test_duplicate_tool_disallowed(self):
        with TemporaryDirectory() as d:
            p=Path(d);(p/'out').mkdir()
            h=sha256(b'a').hexdigest()
            j={'cases':[{'id':'x','expected_sha256':[h],'runs':[{'tool':'A','output_dir':'out'},{'tool':'A','output_dir':'out'}]}]}
            manifest=p/'manifest.json';manifest.write_text(json.dumps(j))
            with self.assertRaisesRegex(ValueError,'Duplicate tool'):
                evaluate_comparison(manifest,p/'report.json')
if __name__=='__main__':unittest.main()
