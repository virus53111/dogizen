from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from dataclasses import dataclass
import hashlib,json
import unittest
from murdilimax_benchmark import evaluate

@dataclass
class Stub:
    eligible:bool=True
    state:str='free'

class BenchmarkTests(unittest.TestCase):
    def test_exact_hash_score(self):
        with TemporaryDirectory() as tmp:
            directory=Path(tmp);inputfile=directory/'image.img';inputfile.write_bytes(b'123')
            digest=hashlib.sha256(b'abc').hexdigest()
            manifest=directory/'truth.json';manifest.write_text(json.dumps({'cases':[{'name':'dummy','image':'image.img','expected_sha256':[digest]}]}))
            def fake_recover(src,candidate,dest,allow_unknown=False):return {'sha256':digest}
            with patch('murdilimax_benchmark.scan_image',return_value=([Stub()],[],[])),patch('murdilimax_benchmark.recover',side_effect=fake_recover):
                result=evaluate(str(manifest),str(directory/'report.json'))
            self.assertEqual(result['cases'][0]['recall'],1.0)
            self.assertEqual(result['cases'][0]['precision_vs_manifest'],1.0)
    def test_reject_no_ground_truth(self):
        with TemporaryDirectory() as tmp:
            d=Path(tmp);(d/'image.img').write_bytes(b'abc')
            p=d/'manifest.json';p.write_text(json.dumps({'cases':[{'image':'image.img','expected_sha256':[]}]}))
            with self.assertRaisesRegex(ValueError,'expected_sha256'):
                evaluate(str(p),str(d/'output.json'))

if __name__=='__main__':unittest.main()
