"""Local confidentiality: no unnecessary POSIX group/other access."""
import os
import stat
import tempfile
import unittest
from pathlib import Path
from store import Store

@unittest.skipIf(os.name == "nt", "Windows permissions use ACLs, not POSIX mode bits")
class PermissionsTests(unittest.TestCase):
    def test_directories_and_profile_metadata_owner_only(self):
        with tempfile.TemporaryDirectory() as root:
            store = Store(Path(root)/"workspace")
            profile = store.add_profile("Private Profile", "about:blank")
            for target in (
                store.root, store.root/"profiles", store.root/"trash",
                store.root/"logs", store.root/"profiles"/profile["id"],
            ):
                self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o700, str(target))
            self.assertEqual(stat.S_IMODE((store.root/"profiles.json").stat().st_mode), 0o600)

if __name__=="__main__":
    unittest.main()
