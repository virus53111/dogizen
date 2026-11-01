"""Offline regression tests for stable identity and child CLI path safety."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from identity import FILENAME, get_identity
from engine import launch_command, safe_profile_id

def fake_fp(**kwargs):
    return {
        "navigator": {"userAgent": "Firefox/135 " + kwargs["os"], "hardwareConcurrency": 8},
        "screen": {"width": 1600, "height": 900},
        "headers": {"user-agent": "Firefox/135"},
    }

class IdentityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "profile"

    def test_reuses_same_identity_even_if_random_generator_changes(self):
        first = get_identity(self.path, "windows", generator=fake_fp)
        self.assertEqual(first, get_identity(self.path, "windows",
                                              generator=lambda **_: self.fail("unexpected new fingerprint")))
        saved = json.loads((self.path / FILENAME).read_text(encoding="utf-8"))
        self.assertEqual(saved["os"], "windows")
        self.assertEqual(saved["fingerprint"], first)

    def test_separate_profiles_independent(self):
        x = get_identity(self.path, "macos", generator=fake_fp)
        y = get_identity(self.path.parent / "other", "linux", generator=fake_fp)
        self.assertNotEqual(x, y)

    def test_change_os_refused_without_rotation(self):
        get_identity(self.path, "windows", generator=fake_fp)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            get_identity(self.path, "linux", generator=fake_fp)
        self.assertEqual(json.loads((self.path / FILENAME).read_text())["os"], "windows")

    def test_corrupt_identity_refuses_silent_replacement(self):
        self.path.mkdir()
        (self.path / FILENAME).write_text("{ invalid json", encoding="utf-8")
        with self.assertRaises(json.JSONDecodeError):
            get_identity(self.path, "linux", generator=fake_fp)

    def test_generator_failure_no_partial_identity(self):
        def fail(**kwargs):
            raise RuntimeError("model download unavailable")
        with self.assertRaisesRegex(RuntimeError, "unavailable"):
            get_identity(self.path, "linux", generator=fail)
        self.assertFalse((self.path / FILENAME).exists())

    def test_refuses_unserializable_identity(self):
        def invalid(**kwargs):
            return {"navigator": {"bad": object()}}
        with self.assertRaises(TypeError):
            get_identity(self.path, "linux", generator=invalid)
        self.assertFalse((self.path / FILENAME).exists())

    def test_invalid_child_paths_rejected(self):
        for bad in ("../../settings", "", "deadbeef", "F"*32, "a"*32+"/other"):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                safe_profile_id(bad)
        self.assertEqual(launch_command("a"*32)[-1], "a"*32)

if __name__ == "__main__":
    unittest.main()
