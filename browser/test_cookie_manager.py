"""Offline cookie tests with synthetic Firefox SQLite databases, no credentials or network."""
import json
from contextlib import closing
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest

from cookie_manager import cookie_inventory, export_cookies, clear_cookies
from store import Store


def prepare_cookie_db(store, profile_id, records=2):
    directory = store.root / "profiles" / profile_id / "data"
    directory.mkdir(mode=0o700)
    db = directory / "cookies.sqlite"
    with closing(sqlite3.connect(db)) as conn:
        conn.execute(
            "CREATE TABLE moz_cookies (id INTEGER PRIMARY KEY, name TEXT, "
            "value TEXT, host TEXT, path TEXT, expiry INTEGER, "
            "isSecure INTEGER, isHttpOnly INTEGER, sameSite INTEGER, "
            "originAttributes TEXT)"
        )
        for index in range(records):
            conn.execute(
                "INSERT INTO moz_cookies (name,value,host,path,expiry,isSecure,"
                "isHttpOnly,sameSite,originAttributes) VALUES (?,?,?,?,?,?,?,?,?)",
                ("login" + str(index), "secret-token-" + str(index),
                 "example.net" if index % 2 == 0 else "other.org", "/",
                 1999999999, 1, 1, 0, "")
            )
        conn.commit()
    return db


def cookie_values(path):
    with closing(sqlite3.connect(path)) as conn:
        return [r[0] for r in conn.execute("SELECT value FROM moz_cookies")]


class CookieManagerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store = Store(Path(self.tmp.name) / "storage")
        self.profile = self.store.add_profile("Test browser")
        self.id = self.profile["id"]
        self.other = self.store.add_profile("Other browser")

    def test_empty_profile_inventory_and_clear(self):
        item = cookie_inventory(self.store, self.id)
        self.assertFalse(item.present)
        self.assertEqual((item.count, item.domains), (0, 0))
        self.assertEqual(clear_cookies(self.store, self.id), (0, None))
        self.assertFalse((self.store.root / "profiles" / self.id / ".cookie-maintenance").exists())

    def test_inventory_never_includes_tokens(self):
        prepare_cookie_db(self.store, self.id, 3)
        result = cookie_inventory(self.store, self.id)
        self.assertEqual(result.count, 3)
        self.assertEqual(result.domains, 2)
        self.assertEqual(result.top_domains[0], ("example.net", 2))
        self.assertNotIn("secret-token", str(result))

    def test_sensitive_export_is_private_and_does_not_change_db(self):
        db = prepare_cookie_db(self.store, self.id)
        target = Path(self.tmp.name) / "private-export.json"
        count = export_cookies(self.store, self.id, target)
        self.assertEqual(count, 2)
        document = json.loads(target.read_text(encoding="utf-8"))
        self.assertEqual(document["format"], "murdilimax-cookies-v1")
        self.assertEqual(document["cookies"][0]["value"], "secret-token-0")
        self.assertEqual(len(cookie_values(db)), 2)
        if os.name != "nt":
            self.assertEqual(target.stat().st_mode & 0o777, 0o600)
        with self.assertRaises(ValueError):
            export_cookies(self.store, self.id, target)  # never overwrite
        self.assertEqual(target.stat().st_size > 0, True)

    def test_refuse_export_inside_profile_storage(self):
        prepare_cookie_db(self.store, self.id)
        target = self.store.root / "danger.json"
        with self.assertRaisesRegex(ValueError, "outside|Export"):
            export_cookies(self.store, self.id, target)
        self.assertFalse(target.exists())

    def test_clear_saves_local_full_backup_and_preserves_other_profile(self):
        db = prepare_cookie_db(self.store, self.id, 3)
        other_db = prepare_cookie_db(self.store, self.other["id"])
        before = cookie_values(db)
        count, backup = clear_cookies(self.store, self.id)
        self.assertEqual(count, 3)
        self.assertEqual(cookie_values(db), [])
        self.assertEqual(cookie_values(backup), before)
        self.assertEqual(cookie_values(other_db), ["secret-token-0", "secret-token-1"])
        self.assertEqual(self.store.get_profile(self.id)["name"], "Test browser")
        if os.name != "nt":
            self.assertEqual(backup.stat().st_mode & 0o777, 0o600)
            self.assertEqual(backup.parent.stat().st_mode & 0o777, 0o700)

    def test_block_running_profile_for_every_operation(self):
        db = prepare_cookie_db(self.store, self.id)
        lock = self.store.root / "profiles" / self.id / ".lock"
        lock.write_text("12345")
        for action in (
            lambda: cookie_inventory(self.store, self.id),
            lambda: export_cookies(self.store, self.id, Path(self.tmp.name) / "secret.json"),
            lambda: clear_cookies(self.store, self.id),
        ):
            with self.assertRaisesRegex(ValueError, "Stop"):
                action()
        self.assertEqual(len(cookie_values(db)), 2)

    def test_prevent_parallel_maintenance(self):
        prepare_cookie_db(self.store, self.id)
        marker = self.store.root / "profiles" / self.id / ".cookie-maintenance"
        marker.write_text("busy")
        with self.assertRaisesRegex(ValueError, "already in progress"):
            cookie_inventory(self.store, self.id)
        self.assertTrue(marker.exists())

    def test_reject_invalid_profile_ids(self):
        for bad in ("../../etc/passwd", "not-a-uuid", "../secrets", ""):
            with self.assertRaises(ValueError):
                cookie_inventory(self.store, bad)

    def test_unsupported_schema_preserves_db(self):
        directory = self.store.root / "profiles" / self.id / "data"
        directory.mkdir()
        db = directory / "cookies.sqlite"
        with closing(sqlite3.connect(db)) as conn:
            conn.execute("CREATE TABLE not_cookies (value TEXT)")
        with self.assertRaises(ValueError):
            clear_cookies(self.store, self.id)
        with closing(sqlite3.connect(db)) as conn:
            self.assertEqual(conn.execute("SELECT name FROM sqlite_master WHERE name='not_cookies'").fetchone()[0], "not_cookies")

    @unittest.skipIf(os.name == "nt", "Symlinks require developer mode on Windows")
    def test_reject_symlinked_database(self):
        outside = Path(self.tmp.name) / "outside.sqlite"
        with closing(sqlite3.connect(outside)) as conn:
            conn.execute("CREATE TABLE private(value TEXT)")
        folder = self.store.root / "profiles" / self.id / "data"
        folder.mkdir()
        (folder / "cookies.sqlite").symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            cookie_inventory(self.store, self.id)
        with self.assertRaisesRegex(ValueError, "Unsafe"):
            clear_cookies(self.store, self.id)


if __name__ == "__main__":
    unittest.main()
