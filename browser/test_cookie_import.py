"""Offline validation: safe Firefox 17 SQLite import, backups, quotas, isolation."""
from __future__ import annotations

from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest

from cookie_import import inspect_cookie_file, read_cookie_file, import_cookies
from store import Store


def sample(host=".example.org", name="login"):
    return {"name": name, "value": "synthetic-secret",
            "host": host, "path": "/", "isSecure": True,
            "isHttpOnly": True, "sameSite": 1, "expiry": 1999999999}


def database(store, profile_id, schema=17):
    folder = store.root / "profiles" / profile_id / "data"
    folder.mkdir()
    db = folder / "cookies.sqlite"
    with closing(sqlite3.connect(db)) as con:
        con.execute(f"PRAGMA user_version={schema}")
        con.execute("""CREATE TABLE moz_cookies(
            id INTEGER PRIMARY KEY,
            originAttributes TEXT NOT NULL DEFAULT '',
            name TEXT, value TEXT, host TEXT, path TEXT,
            expiry INTEGER,lastAccessed INTEGER,creationTime INTEGER,
            isSecure INTEGER,isHttpOnly INTEGER, sameSite INTEGER DEFAULT 0,
            CONSTRAINT moz_uniqueid UNIQUE(name,host,path,originAttributes))""")
        con.execute("INSERT INTO moz_cookies(name,value,host,path,expiry) VALUES(?,?,?,?,?)",
                    ("keep","original-secret","original.example","/",1999999999000))
        con.commit()
    return db


class CookieImportTests(unittest.TestCase):
    def setUp(self):
        self.t = tempfile.TemporaryDirectory()
        self.addCleanup(self.t.cleanup)
        self.root = Path(self.t.name)
        self.store = Store(self.root / "app")
        self.first = self.store.add_profile("First")["id"]
        self.other = self.store.add_profile("Other")["id"]

    def make_json(self, rows=None, *, fmt="murdilimax-cookies-v1"):
        source = self.root / "cookies.json"
        source.write_text(json.dumps({"format":fmt, "cookies":rows if rows is not None else [sample()]}),
                          encoding="utf-8")
        return source

    def test_synthetic_murdilimax_export_parses(self):
        preview,cookies=read_cookie_file(self.make_json())
        self.assertEqual((preview.count,preview.domains,preview.format),
                         (1,1,"Murdilimax JSON"))
        self.assertEqual(cookies[0]["sameSite"],"Lax")
        self.assertNotIn("synthetic-secret",str(preview))

    def test_millisecond_firefox_expiry_export_converts_to_seconds(self):
        source = self.make_json([{**sample(), "expiry":1999999999000}])
        _preview,cookies=read_cookie_file(source)
        self.assertEqual(cookies[0]["expires"],1999999999)

    def test_playwright_and_netscape_formats(self):
        source=self.root/"plain.txt"
        source.write_text(
            "# Netscape HTTP Cookie File\n"
            "#HttpOnly_.example.org\tTRUE\t/\tTRUE\t1999999999\tn\tv\n",
            encoding="utf-8")
        info,cookies=read_cookie_file(source)
        self.assertEqual(info.format,"Netscape TXT")
        self.assertTrue(cookies[0]["httpOnly"])
        info,cookies=read_cookie_file(self.make_json([
            {"name":"__Host-test","value":"yes","domain":"example.com",
             "path":"/","secure":True,"sameSite":"Strict","expires":1999999999}
        ],fmt="playwright"))
        self.assertEqual(info.format,"Playwright JSON")
        self.assertEqual(cookies[0]["sameSite"],"Strict")

    def test_reject_duplicate_and_unsafe_cookies(self):
        cases=[[sample(),sample()],[sample(host=".com")],
               [sample(host="bad/host.net")],
               [{**sample(),"originAttributes":"^privateBrowsingId=1"}],
               [{**sample(),"partitionKey":"https://other.test"}],
               [{**sample(),"name":"__Host-n","host":".example.org"}],
               [{**sample(),"isSecure":False,"sameSite":0}],
               [{**sample(),"expiry":999999999999999}],
               [{**sample(),"name":"bad\nname"}],
               [{**sample(),"value":"bad\nvalue"}]]
        for rows in cases:
            with self.subTest(rows=str(rows)[:60]):
                with self.assertRaises(ValueError):
                    inspect_cookie_file(self.make_json(rows))

    def test_backup_atomic_merge_and_other_profile_isolation(self):
        one=database(self.store,self.first)
        other=database(self.store,self.other)
        count,backup=import_cookies(self.store,self.first,self.make_json())
        self.assertEqual(count,1)
        self.assertTrue(backup.is_file())
        with closing(sqlite3.connect(backup)) as con:
            self.assertEqual(con.execute("SELECT COUNT(*) FROM moz_cookies").fetchone()[0],1)
            self.assertEqual(con.execute("SELECT value FROM moz_cookies").fetchone()[0],"original-secret")
        with closing(sqlite3.connect(one)) as con:
            self.assertEqual(con.execute("SELECT COUNT(*) FROM moz_cookies").fetchone()[0],2)
            self.assertEqual(con.execute(
                "SELECT value,expiry,sameSite FROM moz_cookies WHERE name='login'"
            ).fetchone(),("synthetic-secret",1999999999000,1))
        with closing(sqlite3.connect(other)) as con:
            self.assertEqual(con.execute("SELECT COUNT(*) FROM moz_cookies").fetchone()[0],1)
        self.assertFalse((one.parent.parent/".cookie-maintenance").exists())
        if os.name!="nt":
            self.assertEqual(backup.stat().st_mode&0o777,0o600)

    def test_unsupported_schema_fails_before_backup(self):
        database(self.store,self.first,schema=19)
        with self.assertRaisesRegex(ValueError,"Unsupported Firefox"):
            import_cookies(self.store,self.first,self.make_json())
        self.assertFalse((self.store.root/"cookie-backups").exists())

    def test_running_profile_refused_without_mutation(self):
        database(self.store,self.first)
        (self.store.root/"profiles"/self.first/".lock").write_text("busy")
        with self.assertRaisesRegex(ValueError,"Stop"):
            import_cookies(self.store,self.first,self.make_json())
        self.assertFalse((self.store.root/"cookie-backups").exists())

    def test_new_profile_must_be_initialized(self):
        with self.assertRaisesRegex(ValueError,"Launch and close"):
            import_cookies(self.store,self.first,self.make_json())

    def test_reject_session_and_expired_cookies_before_backup(self):
        database(self.store,self.first)
        for cookie in ({**sample(),"expiry":-1},{**sample(),"expiry":1}):
            with self.assertRaises(ValueError):
                import_cookies(self.store,self.first,self.make_json([cookie]))
        self.assertFalse((self.store.root/"cookie-backups").exists())

    def test_symlink_is_rejected(self):
        if os.name=="nt":
            self.skipTest("Windows symlink requires developer mode")
        path=self.make_json()
        link=self.root/"linked.json"
        link.symlink_to(path)
        with self.assertRaises(ValueError):
            inspect_cookie_file(link)


if __name__=="__main__":
    unittest.main()
