"""Offline acceptance tests for the user-triggered Windows setup verifier."""
from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from installer_integrity import (
    MAX_CHECKSUM, _official_asset, verify_windows_setup,
)
from update_check import RELEASES_URL


NAME = "Murdilimax-Browser-Windows-v0.16.0-Beta-Setup.exe"
TAG = "v0.16.0-browser-windows-beta-20261102"
PREFIX = "https://github.com/virus53111/dogizen/releases/download/" + TAG + "/"


class FakeResponse:
    def __init__(self, body):
        self.raw = BytesIO(body)
    def read(self, length):
        return self.raw.read(length)
    def __enter__(self):
        return self
    def __exit__(self, *_):
        self.raw.close()


class IntegrityTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.folder = Path(tmp.name)
        self.file = self.folder / NAME
        self.payload = b"MZ" + b"trusted offline fixture" * 60000
        self.file.write_bytes(self.payload)
        self.digest = hashlib.sha256(self.payload).hexdigest()
        self.release = {
            "tag_name": TAG, "draft": False, "prerelease": True,
            "assets": [
                {"name": NAME, "size": len(self.payload),
                 "browser_download_url": PREFIX + NAME},
                {"name": "SHA256SUMS.txt", "size": 117,
                 "browser_download_url": PREFIX + "SHA256SUMS.txt"},
            ]
        }
        self.sums = (self.digest + "  " + NAME + "\n").encode("ascii")

    def opener(self, requests, sums=None):
        def fetch(req, *, timeout):
            requests.append((req.full_url, timeout))
            if req.full_url == RELEASES_URL:
                return FakeResponse(json.dumps([self.release]).encode("utf8"))
            if req.full_url == PREFIX + "SHA256SUMS.txt":
                return FakeResponse(self.sums if sums is None else sums)
            raise AssertionError("Unexpected outbound request " + req.full_url)
        return fetch

    def test_valid_official_setup_and_bounded_requests(self):
        requests = []
        found = verify_windows_setup(self.file, opener=self.opener(requests))
        self.assertEqual(found["version"], (0, 16, 0))
        self.assertEqual(found["sha256"], self.digest)
        self.assertEqual(found["release_url"],
                         "https://github.com/virus53111/dogizen/releases/tag/" + TAG)
        self.assertEqual(requests, [
            (RELEASES_URL, 12), (PREFIX + "SHA256SUMS.txt", 12)])

    def test_offline_user_supplied_release_data(self):
        calls = []
        result = verify_windows_setup(
            self.file, releases=[self.release], opener=self.opener(calls))
        self.assertEqual(result["sha256"], self.digest)
        self.assertEqual(calls, [(PREFIX + "SHA256SUMS.txt", 12)])

    def test_mismatch_rejected_before_any_executable_is_launched(self):
        self.file.write_bytes(self.payload[:-1] + b"x")
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            verify_windows_setup(
                self.file, releases=[self.release], opener=self.opener([]))

    def test_rejects_size_and_untrusted_release_url(self):
        bad = json.loads(json.dumps(self.release))
        bad["assets"][0]["size"] -= 1
        with self.assertRaisesRegex(ValueError, "size"):
            verify_windows_setup(self.file, releases=[bad], opener=self.opener([]))
        bad = json.loads(json.dumps(self.release))
        bad["assets"][0]["browser_download_url"] = "https://example.com/setup.exe"
        with self.assertRaisesRegex(ValueError, "Official release"):
            verify_windows_setup(self.file, releases=[bad], opener=self.opener([]))
        bad = json.loads(json.dumps(self.release))
        bad["assets"][1]["browser_download_url"] = "https://example.com/checksum"
        with self.assertRaisesRegex(ValueError, "Official release"):
            verify_windows_setup(self.file, releases=[bad], opener=self.opener([]))
        with self.assertRaises(ValueError):
            _official_asset([{"tag_name": TAG, "draft": False,
                              "prerelease": True, "assets": []}], NAME)

    def test_checksum_parser_rejects_malformed_duplicates_and_oversize(self):
        for bad in (b"", b"not-a-checksum", self.sums + self.sums,
                    self.sums.replace(b"  ", b" *"),
                    self.sums.replace(self.digest.encode(), b"x" * 64),
                    b"x" * (MAX_CHECKSUM + 1)):
            with self.subTest(bad=bad[:20]), self.assertRaises(ValueError):
                verify_windows_setup(
                    self.file, releases=[self.release],
                    opener=self.opener([], sums=bad))

    def test_rejects_unofficial_name_tiny_file_and_symlink(self):
        unauthorized = self.folder / "other.exe"
        unauthorized.write_bytes(self.payload)
        with self.assertRaisesRegex(ValueError, "official"):
            verify_windows_setup(unauthorized, releases=[self.release],
                                 opener=self.opener([]))
        self.file.write_bytes(b"MZ")
        with self.assertRaisesRegex(ValueError, "size"):
            verify_windows_setup(self.file, releases=[self.release],
                                 opener=self.opener([]))
        self.file.write_bytes(self.payload)
        link = self.folder / "another.exe"
        try:
            link.symlink_to(self.file)
        except (OSError, NotImplementedError):
            return  # Windows user lacks symlink permission.
        with self.assertRaisesRegex(ValueError, "link"):
            verify_windows_setup(link, releases=[self.release],
                                 opener=self.opener([]))

    def test_api_list_is_not_trusted_without_exact_release_assets(self):
        bad = json.loads(json.dumps(self.release))
        bad["draft"] = True
        with self.assertRaisesRegex(ValueError, "Official release"):
            verify_windows_setup(self.file, releases=[bad],
                                 opener=self.opener([]))
        bad["draft"] = False
        bad["prerelease"] = False
        with self.assertRaisesRegex(ValueError, "Official release"):
            verify_windows_setup(self.file, releases=[bad],
                                 opener=self.opener([]))


if __name__ == "__main__":
    unittest.main()
