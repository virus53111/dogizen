"""Offline clean-install engine checks without attempting network downloads."""
import tempfile
import unittest
from pathlib import Path
from engine_setup import ensure_engine_ready

class EngineBootstrapTests(unittest.TestCase):
    def test_existing_engine_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(ensure_engine_ready(lambda:tmp),Path(tmp))
    def test_missing_directory_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(RuntimeError,"nonexistent"):
                ensure_engine_ready(lambda:Path(tmp)/"not-installed")
    def test_download_failure_is_actionable_and_redacts_url(self):
        def loader():
            raise RuntimeError("https://user:secret@private.host/download")
        with self.assertRaises(RuntimeError) as context:
            ensure_engine_ready(loader)
        self.assertNotIn("secret",str(context.exception))
        self.assertIn("internet",str(context.exception))

if __name__=="__main__":
    unittest.main()
