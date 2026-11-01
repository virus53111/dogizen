"""Local metadata store for Murdilimax Browser. No cloud access or telemetry."""
from __future__ import annotations
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from identity import FILENAME, resolved_os
from startup_tabs import normalize_extra_urls
from fingerprint_options import validate_screen_limit

def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def data_root():
    return Path(os.environ.get("MURDILIMAX_DATA_HOME") or Path.home() / ".murdilimax-browser")

def valid_url(url):
    if url in ("", "about:blank"):
        return True
    u = urlsplit(url)
    return u.scheme in ("http", "https") and bool(u.hostname)

def valid_proxy(server):
    try:
        u = urlsplit(server)
        return u.scheme in ("http", "https", "socks5") and bool(u.hostname) and 0 < u.port < 65536 and not u.username and not u.password and not u.path.strip("/")
    except (ValueError, TypeError, AttributeError):
        return False

class Store:
    def __init__(self, root=None):
        self.root = Path(root) if root is not None else data_root()
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        for folder in (self.root, self.root / "profiles", self.root / "trash", self.root / "logs"):
            folder.mkdir(exist_ok=True, mode=0o700)
            if os.name != "nt":
                folder.chmod(0o700)  # No cross-user profile/cache/log access on POSIX.

    def _path(self, name):
        return self.root / (name + ".json")

    def _read(self, name):
        path = self._path(name)
        if not path.exists():
            return []
        obj = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(obj, list):
            raise ValueError("Unexpected settings file format: " + name)
        return obj

    def _write(self, name, items):
        path = self._path(name)
        pending = self.root / (name + "." + uuid.uuid4().hex + ".tmp")
        try:
            fd = os.open(str(pending), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
                f.flush()
                os.fsync(f.fileno())
            os.replace(pending, path)
        finally:
            pending.unlink(missing_ok=True)

    def profiles(self):
        return self._read("profiles")

    def proxies(self):
        return self._read("proxies")

    def get_profile(self, profile_id):
        return next((p for p in self.profiles() if p["id"] == profile_id), None)

    def add_profile(self, name, url="about:blank", group="", tags="", notes="", proxy_id="", os_name="native", startup_urls=None, screen_limit="auto"):
        if not name.strip():
            raise ValueError("Profile name is required")
        if not valid_url(url):
            raise ValueError("Use an http:// or https:// start URL")
        if os_name not in ("native", "windows", "macos", "linux"):
            raise ValueError("Invalid OS choice")
        extra_urls = normalize_extra_urls(startup_urls if startup_urls is not None else [], primary=url or "about:blank")
        screen_limit = validate_screen_limit(screen_limit)
        if proxy_id and not any(p["id"] == proxy_id for p in self.proxies()):
            raise ValueError("Proxy not found")
        profile = {
            "id": uuid.uuid4().hex, "name": name.strip()[:100], "url": url or "about:blank",
            "group": group.strip()[:80], "tags": tags.strip()[:200], "notes": notes.strip()[:2000],
            "proxy_id": proxy_id, "os": os_name, "startup_urls": extra_urls, "screen_limit": screen_limit,
            "created_at": now(), "updated_at": now(),
        }
        items = self.profiles()
        items.append(profile)
        self._write("profiles", items)
        folder = self.root / "profiles" / profile["id"]
        folder.mkdir(exist_ok=True, mode=0o700)
        if os.name != "nt":
            folder.chmod(0o700)
        return profile

    def update_profile(self, profile_id, **changes):
        allowed = {"name", "url", "group", "tags", "notes", "proxy_id", "os", "startup_urls", "screen_limit"}
        if set(changes) - allowed:
            raise ValueError("Unsupported fields")
        items = self.profiles()
        for p in items:
            if p["id"] == profile_id:
                merged = {**p, **changes}
                if not merged["name"].strip() or not valid_url(merged["url"]):
                    raise ValueError("Invalid name or start URL")
                if merged["os"] not in ("native", "windows", "macos", "linux"):
                    raise ValueError("Invalid OS")
                merged["screen_limit"] = validate_screen_limit(merged.get("screen_limit", "auto"))
                merged["startup_urls"] = normalize_extra_urls(
                    merged.get("startup_urls", []), primary=merged["url"] or "about:blank")
                if (self.root / "profiles" / profile_id / FILENAME).exists() and (
                    resolved_os(merged["os"]) != resolved_os(p.get("os", "native"))
                ):
                    raise ValueError(
                        "This profile already has a fixed device identity. "
                        "Duplicate the profile to choose a different OS."
                    )
                if (self.root / "profiles" / profile_id / FILENAME).exists() and (
                    merged["screen_limit"] != validate_screen_limit(p.get("screen_limit", "auto"))
                ):
                    raise ValueError("This fingerprint screen bound is already fixed. Duplicate the profile instead.")
                if merged["proxy_id"] and not any(x["id"] == merged["proxy_id"] for x in self.proxies()):
                    raise ValueError("Proxy not found")
                for field, size in [("name",100),("group",80),("tags",200),("notes",2000)]:
                    merged[field] = str(merged[field]).strip()[:size]
                merged["updated_at"] = now()
                p.update(merged)
                self._write("profiles", items)
                return p
        raise ValueError("Profile not found")

    def duplicate_profile(self, profile_id):
        p = self.get_profile(profile_id)
        if not p:
            raise ValueError("Profile not found")
        return self.add_profile(p["name"] + " (copy)", p["url"], p["group"], p["tags"], p["notes"], p["proxy_id"], p["os"], startup_urls=p.get("startup_urls", []), screen_limit=p.get("screen_limit", "auto"))

    def delete_profile(self, profile_id):
        items = self.profiles()
        new = [p for p in items if p["id"] != profile_id]
        if len(new) == len(items):
            raise ValueError("Profile not found")
        folder = self.root / "profiles" / profile_id
        if folder.exists():
            folder.rename(self.root / "trash" / (profile_id + "-" + uuid.uuid4().hex[:8]))
        self._write("profiles", new)

    def add_proxy(self, name, server, username="", password=""):
        if not name.strip() or not valid_proxy(server):
            raise ValueError("Use a name and proxy URL like socks5://host:1080 or http://host:8080, without credentials")
        obj = {"id": uuid.uuid4().hex, "name": name.strip()[:100], "server": server,
               "username": username.strip(), "created_at": now()}
        if password:
            try:
                import keyring
                keyring.set_password("Murdilimax Browser Proxy", obj["id"], password)
            except Exception as e:
                raise RuntimeError("Cannot securely store proxy password in the OS keychain") from e
        all_proxies = self.proxies()
        all_proxies.append(obj)
        self._write("proxies", all_proxies)
        return obj

    def update_proxy(self, proxy_id, name, server, username="", password=""):
        if not name.strip() or not valid_proxy(server):
            raise ValueError("Invalid proxy name or server URL")
        items = self.proxies()
        obj = next((p for p in items if p["id"] == proxy_id), None)
        if obj is None:
            raise ValueError("Proxy not found")
        if password:
            try:
                import keyring
                keyring.set_password("Murdilimax Browser Proxy", proxy_id, password)
            except Exception as e:
                raise RuntimeError("Cannot update credentials in system keychain") from e
        obj.update(name=name.strip()[:100], server=server, username=username.strip())
        self._write("proxies", items)
        return obj

    def delete_proxy(self, proxy_id):
        if any(p.get("proxy_id") == proxy_id for p in self.profiles()):
            raise ValueError("Proxy is assigned to a profile; unassign it first")
        items = [p for p in self.proxies() if p["id"] != proxy_id]
        self._write("proxies", items)
        try:
            import keyring
            keyring.delete_password("Murdilimax Browser Proxy", proxy_id)
        except Exception:
            pass

    def proxy_config(self, proxy_id):
        p = next((p for p in self.proxies() if p["id"] == proxy_id), None)
        if not p:
            raise ValueError("Proxy not found")
        result = {"server": p["server"]}
        if p.get("username"):
            result["username"] = p["username"]
            try:
                import keyring
                password = keyring.get_password("Murdilimax Browser Proxy", proxy_id)
            except Exception as e:
                raise RuntimeError("OS keychain unavailable for proxy credentials") from e
            if password is None:
                raise ValueError("Proxy credentials unavailable; re-add proxy")
            result["password"] = password
        return result

    def export_metadata(self, path):
        # Excludes browser session data, cookies and keychain passwords.
        safe = {"format": "murdilimax-browser-v1", "profiles": self.profiles(), "proxies": self.proxies()}
        Path(path).write_text(json.dumps(safe, indent=2, ensure_ascii=False), encoding="utf-8")

    def import_metadata(self, path, *, max_profiles=2000):
        """Validate an entire metadata export and apply it once, or not at all.

        This is profile metadata only: never imports cookies, browser folders,
        proxy passwords, or caller-provided internal profile identifiers.
        """
        if (isinstance(max_profiles, bool) or not isinstance(max_profiles, int)
                or not 1 <= max_profiles <= 2000):
            raise ValueError("Invalid profile allowance")
        source = Path(path)
        if source.is_symlink() or not source.is_file():
            raise ValueError("Choose an existing local JSON export")
        if not 0 < source.stat().st_size <= 8_000_000:
            raise ValueError("Metadata export must be 1 to 8 MB")
        try:
            obj = json.loads(source.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeError):
            raise ValueError("Invalid UTF-8 JSON profile export") from None
        if not isinstance(obj, dict) or obj.get("format") != "murdilimax-browser-v1":
            raise ValueError("Unrecognized export format")
        entries = obj.get("profiles")
        if not isinstance(entries, list) or len(entries) > 2000:
            raise ValueError("Export must contain a list of up to 2,000 profiles")
        existing = self.profiles()
        if len(existing) + len(entries) > max_profiles:
            raise ValueError(
                f"Profile allowance exceeded: {len(existing)} + "
                f"{len(entries)} > {max_profiles}")
        prepared = []
        timestamp = now()
        for record in entries:
            if not isinstance(record, dict):
                raise ValueError("Invalid profile record")
            name = record.get("name", "")
            url = record.get("url", "about:blank")
            os_name = record.get("os", "native")
            if (not isinstance(name, str) or not name.strip()
                    or not isinstance(url, str) or not valid_url(url)
                    or os_name not in ("native", "windows", "macos", "linux")):
                raise ValueError("Invalid name, URL or platform in export")
            fields = {}
            for field, size in (("group", 80), ("tags", 200), ("notes", 2000)):
                value = record.get(field, "")
                if not isinstance(value, str):
                    raise ValueError("Invalid profile " + field)
                fields[field] = value.strip()[:size]
            extra_urls = normalize_extra_urls(record.get("startup_urls", []), primary=url or "about:blank")
            screen_limit = validate_screen_limit(record.get("screen_limit", "auto"))
            prepared.append({
                "id": uuid.uuid4().hex, "name": name.strip()[:100],
                "url": url or "about:blank", **fields,
                "proxy_id": "", "os": os_name, "startup_urls": extra_urls, "screen_limit": screen_limit,
                "created_at": timestamp, "updated_at": timestamp,
            })
        if not prepared:
            return 0
        # Make directories before the atomic metadata replacement. If any
        # operation fails, clean up only our newly-created *empty* folders.
        created = []
        try:
            for record in prepared:
                folder = self.root / "profiles" / record["id"]
                folder.mkdir(mode=0o700)
                created.append(folder)
                if os.name != "nt":
                    folder.chmod(0o700)
            self._write("profiles", existing + prepared)
        except Exception:
            for folder in created:
                try:
                    folder.rmdir()
                except OSError:
                    pass
            raise
        return len(prepared)
