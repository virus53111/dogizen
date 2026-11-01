"""No-network tests for explicit local cookie import and private backup protection."""
from __future__ import annotations
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from cookie_import import inspect_cookie_file, read_cookie_file, import_cookies
from store import Store


class FakeBrowserContext:
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.cookies = None

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def add_cookies(self, cookies):
        self.cookies = list(cookies)


def sample(host=".example.org", name="login"):
    return {"name": name, "value": "sensitive-example-token",
            "host": host, "path": "/", "isSecure": True,
            "isHttpOnly": True, "sameSite": 1, "expiry": 1999999999}


def db_with_cookie(store, profile_id):
    directory = store.root / "profiles" / profile_id / "data"
    directory.mkdir()
    path = directory / "cookies.sqlite"
    with closing(sqlite3.connect(path)) as db:
        db.execute(
            "CREATE TABLE moz_cookies(id INTEGER PRIMARY KEY, name TEXT,"
            "value TEXT,host TEXT,path TEXT)")
        db.execute(
            "INSERT INTO moz_cookies(name,value,host,path) VALUES(?,?,?,?)",
            ("keep", "original-secret", "original.example", "/"))
        db.commit()
    return path


class CookieImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.store = Store(self.root / "app")
        self.profile = self.store.add_profile("My profile")["id"]
        self.other = self.store.add_profile("Other user profile")["id"]

    def make_json(self, name="source.json", data=None):
        path = self.root / name
        if data is None:
            data = {"format": "murdilimax-cookies-v1", "cookies": [sample()]}
        path.write_text(json.dumps(data), encoding="utf-8")
        return path

    def test_murdilimax_export_round_trip_summary_without_values(self):
        path = self.make_json()
        preview, cookies = read_cookie_file(path)
        self.assertEqual(preview.count, 1)
        self.assertEqual(preview.domains, 1)
        self.assertEqual(preview.format, "Murdilimax JSON")
        self.assertEqual(cookies[0]["domain"], ".example.org")
        self.assertEqual(cookies[0]["sameSite"], "Lax")
        self.assertTrue(cookies[0]["httpOnly"])
        self.assertNotIn("sensitive-example-token", repr(preview))

    def test_playwright_cookie_json_and_netscape_http_only(self):
        json_path = self.make_json(data={"cookies": [{
            "name": "__Host-test", "value": "safe-token",
            "domain": "example.org", "path": "/", "secure": True,
            "httpOnly": True, "expires": 1999999999, "sameSite": "Strict"
        }], "origins": [{"origin": "https://example.org", "localStorage": []}]})
        summary, cookies = read_cookie_file(json_path)
        self.assertEqual(summary.format, "Playwright JSON")
        self.assertEqual(cookies[0]["sameSite"], "Strict")
        self.assertNotIn("origins", cookies[0])
        source = self.root / "cookies.txt"
        source.write_text(
            "# Netscape HTTP Cookie File\n"
            "#HttpOnly_.example.org\tTRUE\t/\tTRUE\t1999999999\tuser\tpass\n"
            "other.net\tFALSE\t/\tFALSE\t0\tvisitor\tguest\n",
            encoding="utf-8")
        summary, cookies = read_cookie_file(source)
        self.assertEqual(summary.count, 2)
        self.assertTrue(cookies[0]["httpOnly"])
        self.assertEqual(cookies[0]["domain"], ".example.org")
        self.assertNotIn("expires", cookies[1])

    def test_reject_duplicate_and_malformed_session_cookies(self):
        cases = [
            [sample(), sample()],
            [sample(host=".com")],
            [sample(host="bad/host.com")],
            [{**sample(), "originAttributes": "^userContextId=3"}],
            [{**sample(), "partitionKey": "https://another.org"}],
            [{**sample(), "name": "__Host-test", "host": ".example.org"}],
            [{**sample(), "isSecure": False, "sameSite": 0}],
            [{**sample(), "expiry": 99999999999999}],
            [{**sample(), "name": "line\nbreak"}],
            [{**sample(), "value": "bad\ncookie"}],
        ]
        for idx, rows in enumerate(cases):
            with self.subTest(case=idx):
                path = self.make_json(data={"cookies": rows})
                with self.assertRaises(ValueError):
                    inspect_cookie_file(path)

    def test_symlink_input_refused(self):
        actual = self.make_json()
        if os.name == "nt":
            self.skipTest("Creating symlinks on Windows requires developer mode")
        symlink = self.root / "linked.json"
        symlink.symlink_to(actual)
        with self.assertRaisesRegex(ValueError, "Select"):
            inspect_cookie_file(symlink)

    def test_backup_and_merging_use_only_selected_profile(self):
        one = db_with_cookie(self.store, self.profile)
        other = db_with_cookie(self.store, self.other)
        ctx = FakeBrowserContext()
        path = self.make_json()
        with (patch("cookie_import.get_identity", return_value={"navigator": {"userAgent": "mock"}}),
              patch("cookie_import.resolved_os", return_value="linux")):
            count, backup = import_cookies(
                self.store, self.profile, path, context_factory=lambda **k: ctx,
                check_engine=lambda: None)
        self.assertEqual(count, 1)
        self.assertTrue(backup.is_file())
        self.assertEqual(ctx.cookies[0]["name"], "login")
        self.assertEqual(ctx.kwargs["user_data_dir"],
                         str(self.store.root / "profiles" / self.profile / "data"))
        self.assertFalse(ctx.kwargs["geoip"])
        with closing(sqlite3.connect(backup)) as con:
            self.assertEqual(con.execute("SELECT value FROM moz_cookies").fetchone()[0],
                             "original-secret")
        with closing(sqlite3.connect(other)) as con:
            self.assertEqual(con.execute("SELECT value FROM moz_cookies").fetchone()[0],
                             "original-secret")
        self.assertFalse((one.parent.parent / ".cookie-maintenance").exists())
        if os.name != "nt":
            self.assertEqual(backup.stat().st_mode & 0o777, 0o600)

    def test_failed_context_keeps_rollback_snapshot(self):
        db_with_cookie(self.store, self.profile)
        path = self.make_json()

        class Broken(FakeBrowserContext):
            def add_cookies(self, cookies):
                raise RuntimeError("test browser failure")
        with (patch("cookie_import.get_identity", return_value={"navigator": {"userAgent": "mock"}}),
              patch("cookie_import.resolved_os", return_value="linux")):
            with self.assertRaisesRegex(ValueError, "import failed"):
                import_cookies(self.store, self.profile, path,
                               context_factory=Broken, check_engine=lambda: None)
        self.assertEqual(len(list((self.store.root / "cookie-backups").glob("*.sqlite"))), 1)

    def test_running_profile_refused_without_opening_camoufox(self):
        db_with_cookie(self.store, self.profile)
        lock = self.store.root / "profiles" / self.profile / ".lock"
        lock.write_text("pending")
        with self.assertRaisesRegex(ValueError, "Stop"):
            import_cookies(self.store, self.profile, self.make_json(),
                           context_factory=FakeBrowserContext, check_engine=lambda: None)
        self.assertFalse((self.store.root / "cookie-backups").exists())

    def test_empty_db_profile_can_be_imported_with_context(self):
        ctx = FakeBrowserContext()
        with (patch("cookie_import.get_identity", return_value={"navigator": {"userAgent": "mock"}}),
              patch("cookie_import.resolved_os", return_value="linux")):
            count, backup = import_cookies(self.store, self.profile, self.make_json(),
                context_factory=lambda **k: ctx, check_engine=lambda: None)
        self.assertEqual(count, 1)
        self.assertIsNone(backup)
        self.assertIsNotNone(ctx.cookies)


if __name__ == "__main__":
    unittest.main()
