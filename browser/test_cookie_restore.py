"""Offline, synthetic Firefox DB tests for restoring only own cookie backups.

No real accounts, credential uploads, networks or Camoufox binaries involved.
"""
import os
from contextlib import closing
from pathlib import Path
import sqlite3
import tempfile
import unittest

from cookie_manager import (
    list_cookie_backups, restore_cookie_backup, clear_cookies,
)
from store import Store


def populate(store, profile_id, values):
    directory = store.root / "profiles" / profile_id / "data"
    directory.mkdir(exist_ok=True)
    db = directory / "cookies.sqlite"
    with closing(sqlite3.connect(db)) as connection:
        connection.execute(
            "CREATE TABLE moz_cookies(id INTEGER PRIMARY KEY,"
            " name TEXT, value TEXT, host TEXT, path TEXT)"
        )
        for i, value in enumerate(values):
            connection.execute(
                "INSERT INTO moz_cookies(name,value,host,path) VALUES (?,?,?,?)",
                ("session", value, "local.example", "/"))
        connection.commit()
    return db


def values(db):
    with closing(sqlite3.connect(db)) as connection:
        return [row[0] for row in connection.execute(
            "SELECT value FROM moz_cookies ORDER BY id")]


class RestoreOwnCookieBackupsTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store = Store(Path(self.tmp.name) / "app")
        self.id = self.store.add_profile("Owner profile")["id"]
        self.other_id = self.store.add_profile("Other profile")["id"]

    def test_clear_then_restore_keeps_other_profile_and_safety_snapshot(self):
        current = populate(self.store, self.id, ["owner-login", "token-2"])
        other = populate(self.store, self.other_id, ["other-private"])
        count, backup = clear_cookies(self.store, self.id)
        self.assertEqual(count, 2)
        self.assertEqual(values(current), [])
        available = list_cookie_backups(self.store, self.id)
        self.assertEqual(len(available), 1)
        self.assertEqual(available[0].filename, backup.name)
        self.assertGreater(available[0].size_bytes, 0)
        self.assertNotIn("owner-login", repr(available))
        restored, old_state = restore_cookie_backup(
            self.store, self.id, available[0].filename)
        self.assertEqual(restored, 2)
        self.assertEqual(values(current), ["owner-login", "token-2"])
        self.assertEqual(values(old_state), [])
        self.assertEqual(values(other), ["other-private"])
        self.assertEqual(len(list_cookie_backups(self.store, self.id)), 2)
        self.assertTrue(backup.exists())
        self.assertFalse((current.parent.parent / ".cookie-maintenance").exists())
        if os.name != "nt":
            self.assertEqual(old_state.stat().st_mode & 0o777, 0o600)

    def test_reject_other_profile_backup_even_if_valid(self):
        owner = populate(self.store, self.id, ["owner"])
        populate(self.store, self.other_id, ["other"])
        _, other_backup = clear_cookies(self.store, self.other_id)
        with self.assertRaisesRegex(ValueError, "belonging"):
            restore_cookie_backup(self.store, self.id, other_backup.name)
        self.assertEqual(values(owner), ["owner"])
        self.assertEqual(list_cookie_backups(self.store, self.id), [])

    def test_reject_arbitrary_paths_and_missing_files(self):
        populate(self.store, self.id, ["safe"])
        for invalid in ("../../elsewhere.sqlite", "../bad.sqlite",
                        "bad.sqlite", self.id + "-" + "a"*12 + ".db",
                        self.id + "-" + "a"*12 + ".sqlite"):
            with self.subTest(filename=invalid), self.assertRaises(ValueError):
                restore_cookie_backup(self.store, self.id, invalid)
        self.assertEqual(values(self.store.root / "profiles" / self.id
                                / "data" / "cookies.sqlite"), ["safe"])

    def test_corrupt_backup_refused_before_any_mutation(self):
        current = populate(self.store, self.id, ["keep-current"])
        backup_dir = self.store.root / "cookie-backups"
        backup_dir.mkdir()
        damaged = backup_dir / (self.id + "-" + "b"*12 + ".sqlite")
        damaged.write_bytes(b"fake-sqlite-content")
        with self.assertRaises(ValueError):
            restore_cookie_backup(self.store, self.id, damaged.name)
        self.assertEqual(values(current), ["keep-current"])
        self.assertEqual(len(list_cookie_backups(self.store, self.id)), 1)

    def test_invalid_backup_schema_refused(self):
        current = populate(self.store, self.id, ["keep-me"])
        backup_dir = self.store.root / "cookie-backups"
        backup_dir.mkdir()
        bad = backup_dir / (self.id + "-" + "c"*12 + ".sqlite")
        with closing(sqlite3.connect(bad)) as db:
            db.execute("CREATE TABLE unrelated(payload TEXT)")
        with self.assertRaisesRegex(ValueError, "cookie table|schema|Firefox"):
            restore_cookie_backup(self.store, self.id, bad.name)
        self.assertEqual(values(current), ["keep-me"])

    def test_restore_after_local_database_missing(self):
        original = populate(self.store, self.id, ["saved"])
        _, backup = clear_cookies(self.store, self.id)
        original.unlink()
        restored, previous = restore_cookie_backup(self.store, self.id, backup.name)
        self.assertEqual(restored, 1)
        self.assertIsNone(previous)
        self.assertEqual(values(original), ["saved"])

    def test_running_profile_refused(self):
        current = populate(self.store, self.id, ["secret"])
        _, backup = clear_cookies(self.store, self.id)
        lock = self.store.root / "profiles" / self.id / ".lock"
        lock.write_text("99999")
        with self.assertRaisesRegex(ValueError, "Stop"):
            list_cookie_backups(self.store, self.id)
        with self.assertRaisesRegex(ValueError, "Stop"):
            restore_cookie_backup(self.store, self.id, backup.name)
        self.assertEqual(values(current), [])
        lock.unlink()

    def test_concurrent_maintenance_refused(self):
        populate(self.store, self.id, ["secret"])
        _, backup = clear_cookies(self.store, self.id)
        flag = self.store.root / "profiles" / self.id / ".cookie-maintenance"
        flag.write_text("busy")
        with self.assertRaisesRegex(ValueError, "in progress"):
            restore_cookie_backup(self.store, self.id, backup.name)
        self.assertTrue(flag.exists())

    @unittest.skipIf(os.name == "nt", "Symlinks require developer mode on Windows")
    def test_symlinked_backup_is_not_imported(self):
        current = populate(self.store, self.id, ["keep"])
        backup_dir = self.store.root / "cookie-backups"
        backup_dir.mkdir()
        external = Path(self.tmp.name) / "external.sqlite"
        with closing(sqlite3.connect(external)) as con:
            con.execute("CREATE TABLE moz_cookies(name TEXT,value TEXT,host TEXT,path TEXT)")
        linked = backup_dir / (self.id + "-" + "d"*12 + ".sqlite")
        linked.symlink_to(external)
        self.assertEqual(list_cookie_backups(self.store, self.id), [])
        with self.assertRaisesRegex(ValueError, "unsafe"):
            restore_cookie_backup(self.store, self.id, linked.name)
        self.assertEqual(values(current), ["keep"])

    def test_no_logging_or_cookie_tokens_in_backup_listing(self):
        populate(self.store, self.id, ["private-session-token-1122"])
        clear_cookies(self.store, self.id)
        data = list_cookie_backups(self.store, self.id)
        self.assertEqual(len(data), 1)
        self.assertNotIn("private-session", str(data))
        with self.assertRaises(ValueError) as ctx:
            restore_cookie_backup(self.store, self.id, "missing.sqlite")
        self.assertNotIn("private-session", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
