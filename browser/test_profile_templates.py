"""Local template CRUD, isolated batch creation and plan-limited atomic behavior."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from profile_templates import (create_profiles_from_template, delete_template,
                               list_templates, save_template)
from store import Store


class TemplateTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.store = Store(Path(tmp.name) / "app")

    def _source(self):
        p = self.store.add_proxy("QA proxy", "socks5://127.0.0.1:1080",
                                 username="qa-user")
        source = self.store.add_profile(
            "Master", "https://example.org/start", group="Marketing",
            tags="Daily, Test", notes="DO NOT COPY PERSONAL NOTE",
            proxy_id=p["id"], os_name="windows",
            startup_urls=["https://example.net/second"], screen_limit="1920x1080")
        return source, p

    def test_template_only_metadata_and_isolated_batch(self):
        source, proxy = self._source()
        original_dir = self.store.root / "profiles" / source["id"]
        original_dir.joinpath("cookies.sqlite").write_bytes(b"PRIVATE COOKIES")
        template = save_template(self.store, source["id"], "Campaign")
        self.assertEqual(len(list_templates(self.store)), 1)
        raw = (self.store.root / "templates.json").read_text(encoding="utf-8")
        for secret in ("DO NOT COPY PERSONAL NOTE", "PRIVATE COOKIES", "qa-user"):
            self.assertNotIn(secret, raw)
        with patch("auth_client.BrowserAccount.verify",
                   return_value={"authorized": True, "entitlements": {"profiles": 5}}) as verify:
            made = create_profiles_from_template(self.store, template["id"],
                                                 count=2)
            verify.assert_called_once()
        self.assertEqual([x["name"] for x in made], ["Campaign 1", "Campaign 2"])
        self.assertEqual({x["group"] for x in made}, {"Marketing"})
        self.assertEqual({x["proxy_id"] for x in made}, {proxy["id"]})
        self.assertEqual({x["screen_limit"] for x in made}, {"1920x1080"})
        self.assertEqual({tuple(x["startup_urls"]) for x in made},
                         {("https://example.net/second",)})
        for item in made:
            path = self.store.root / "profiles" / item["id"]
            self.assertTrue(path.is_dir())
            self.assertEqual(list(path.iterdir()), [])
            self.assertEqual(item["notes"], "")
            self.assertFalse((path / "fingerprint-v1.json").exists())
        self.assertTrue((original_dir / "cookies.sqlite").exists())

    def test_free_three_slots_no_false_paid_bypass(self):
        src = self.store.add_profile("A")
        template = save_template(self.store, src["id"], "B")
        made = create_profiles_from_template(self.store, template["id"], count=2)
        self.assertEqual(len(made), 2)
        with patch("auth_client.BrowserAccount.verify",
                   return_value={"authorized": False}) as verify:
            with self.assertRaises(PermissionError):
                create_profiles_from_template(self.store, template["id"], count=1)
            verify.assert_called_once()
        self.assertEqual(len(self.store.profiles()), 3)

    def test_invalid_and_stale_plan_does_not_write_anything(self):
        source = self.store.add_profile("Master")
        template = save_template(self.store, source["id"], "Template")
        orig = (self.store.root / "profiles.json").read_bytes()
        folders = list((self.store.root / "profiles").iterdir())
        for bad in (0, -1, True, 11, "2", None):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                create_profiles_from_template(self.store, template["id"], count=bad)
        with patch("auth_client.BrowserAccount.verify",
                   return_value={"authorized": True, "entitlements": {"profiles": 2}}):
            with self.assertRaises(PermissionError):
                create_profiles_from_template(self.store, template["id"], count=3)
        self.assertEqual(orig, (self.store.root / "profiles.json").read_bytes())
        self.assertEqual(folders, list((self.store.root / "profiles").iterdir()))

    def test_atomic_metadata_failure_removes_only_new_folders(self):
        source = self.store.add_profile("Original")
        t = save_template(self.store, source["id"], "Template")
        before = self.store.profiles()
        with patch.object(self.store, "_write", side_effect=OSError("disk full")):
            with self.assertRaises(OSError):
                create_profiles_from_template(self.store, t["id"], count=2)
        self.assertEqual(self.store.profiles(), before)
        self.assertEqual(len(list((self.store.root / "profiles").iterdir())), 1)

    def test_bad_url_and_stale_proxy_refuse_creation(self):
        source, proxy = self._source()
        t = save_template(self.store, source["id"], "Safe")
        self.store._write("proxies", [])
        self.assertEqual(len(list_templates(self.store)), 1)
        with self.assertRaisesRegex(ValueError, "proxy"):
            create_profiles_from_template(self.store, t["id"])
        self.assertEqual(len(self.store.profiles()), 1)
        delete_template(self.store, t["id"])
        self.assertEqual(list_templates(self.store), [])
        for bad in ("file:///etc/passwd", "javascript:alert(1)",
                    "https://user:pwd@example.org", "https://hello.org/space here",
                    "http://example.org:0", "http://[broken"):
            self.store.update_profile(source["id"], url="about:blank")
            profile = self.store.get_profile(source["id"])
            profile["url"] = bad
            self.store._write("profiles", [profile])
            with self.subTest(url=bad), self.assertRaises(ValueError):
                save_template(self.store, source["id"], "Unsafe")
            self.assertEqual(list_templates(self.store), [])

    def test_template_duplicate_name_and_bounded_limits(self):
        source = self.store.add_profile("Source")
        template = save_template(self.store, source["id"], "Foo")
        for bad in ("FOO", "foo"):
            with self.assertRaises(ValueError):
                save_template(self.store, source["id"], bad)
        created = create_profiles_from_template(self.store, template["id"])
        self.assertEqual(created[0]["name"], "Foo 1")
        another = create_profiles_from_template(self.store, template["id"])
        self.assertEqual(another[0]["name"], "Foo 2")
        with self.assertRaises(ValueError):
            create_profiles_from_template(self.store, "bad")
        with self.assertRaises(ValueError):
            delete_template(self.store, "bad")
        delete_template(self.store, template["id"])
        self.assertEqual(self.store.profiles()[0]["name"], "Source")
        self.assertEqual(len(self.store.profiles()), 3)

    def test_reject_malformed_template_database_without_overwriting(self):
        source = self.store.add_profile("Source")
        save_template(self.store, source["id"], "Healthy")
        records = self.store._read("templates")
        records.append({**records[0], "id": records[0]["id"]})
        self.store._write("templates", records)
        before = (self.store.root / "templates.json").read_bytes()
        with self.assertRaisesRegex(ValueError, "Invalid template database"):
            list_templates(self.store)
        with self.assertRaises(ValueError):
            save_template(self.store, source["id"], "Other")
        self.assertEqual((self.store.root / "templates.json").read_bytes(), before)

    def test_legacy_profile_screen_limit_defaults_auto(self):
        source = self.store.add_profile("Legacy")
        items = self.store.profiles()
        items[0].pop("screen_limit")
        self.store._write("profiles", items)
        t = save_template(self.store, source["id"], "Legacy template")
        self.assertEqual(t["screen_limit"], "auto")


if __name__ == "__main__":
    unittest.main()
