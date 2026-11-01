# Murdilimax Browser — browser-only desktop beta

**Architecture:** Tkinter desktop workspace + one independent Camoufox (Firefox) process and persistent storage directory per profile. Android functionality is intentionally excluded.

## Local development (Windows 10/11 or modern macOS)
```sh
cd browser
python -m venv .venv
# Activate your Python virtual environment
python -m pip install -r requirements.txt
python -m camoufox fetch
python app.py --selftest
python -m unittest discover -v
python app.py
```

First launch may require a substantial Camoufox engine download. The modern engine is **not certified for Catalina** until physical-machine testing.

## Working features

- Create, edit, copy, delete (recoverable data directory), search and bulk start/stop browser profiles
- Isolated persistent browser contexts (cookies, localStorage, cache) by profile ID
- Notes, groups, tags, selectable platform, start URL
- Named HTTP/HTTPS/SOCKS5 proxies with optional credentials in OS Keychain (when available)
- TCP reachability test clearly labeled; it does not certify proxy routing
- Export/import **profile metadata only**; cookies and credentials are intentionally excluded
- Per-profile logs in ~/.murdilimax-browser/logs

**Known beta limitations:** Camoufox device identity is stored per profile, but uniform remote anti-fraud fingerprints, GPU, WebRTC and DNS consistency are not guaranteed. A local Firefox extensions manager and cookie backup restoration are implemented in source beta and tested against real Camoufox, but have not passed physical Windows/Mac installer acceptance. Cloud sync, live multi-user team workspaces, a local automation API, automatic updates and fully trusted/notarized installers are not implemented. A standalone account/Stripe service exists; successful real payments have not been validated in this source workflow. Desktop installers still need real-device QA. Catalina Mac support is a separate compatibility track.

## Security notes
Never treat GUI-enforced profile limits as server-side licensing. Only use user-authorized proxies and browser automation. The metadata export is not a browser-session backup. Profile deletion moves profile data to `trash/`; users can remove it themselves when no longer needed.

## Packaging
GitHub Actions workflow `browser-build.yml` packages Windows and modern macOS preview installers without publishing a public release. Review CI results and verify on a physical host before tagging a release.

## Engine and identity hardening — 1 November 2026

- Each profile now pins the generated Firefox fpgen device identity in its own `fingerprint-v1.json`. The same baseline fpgen fields (User-Agent, navigator, screen) are fed back to Camoufox for every later launch. The file is created atomically, and changes of the identity OS cause an explicit error rather than stealthy rotation; use a newly duplicated profile to change device identity.
- Real Linux Camoufox integration test now launches twice, validates the persisted cookie and compares `navigator.userAgent`, `navigator.hardwareConcurrency`, `screen.width`, `navigator.language`. **Not** a claim that GPU-level canvas/WebGL/audio noise, remote site fingerprint hashes, or browser upgrades are always identical. These require their own integration and physical-device matrix.
- The packaged Windows/macOS builds now hydrate a sha256-pinned Camoufox fpgen model **before** PyInstaller packaging, include fpgen resources and assert model integrity in the packaged `--selftest`. Browser engine binaries themselves are still downloaded on first use and are **not** included in current small installers.
- New proxy exit-IP button issues a single HTTPS request via HTTP/HTTPS/SOCKS5; SOCKS5 DNS is resolved remotely (`socks5h`). The button deliberately does not certify WebRTC/DNS/IPv6 routing and never displays a credential-bearing exception.
- Local folders and profile metadata/logs use owner-only POSIX permissions. Windows uses its file-system ACL; no separate Windows permission audit has been performed.
- Command-line profile IDs are checked before constructing paths to logs and browser data.

**Release blocker:** Offline automated tests and packaging checks do not substitute for a clean Windows/macOS install with real browser launch and network diagnostics. Commercial subscriptions and OS Catalina support are not activated.


## Local cookie manager — source beta (November 2026)

For a selected **stopped** profile, the desktop Profile tab now has:
- **Cookies**: local Firefox cookie count and top domain summary; cookie *values* are not displayed.
- **Export cookies**: manually selected JSON export of cookie records and values. These values can be account/session secrets. The user must approve a prominent security warning. Files are created without overwriting existing paths and use owner-only 0600 permissions on POSIX; Windows follows its ACL. Do not share or sync these exports.
- **Clear cookies**: backs up the entire Firefox cookie database as a separate SQLite file under the owner's local Murdilimax directory before deleting cookie rows. Clearing can log you out of websites; the backup remains sensitive and is not automatically deleted. A new source-beta **Restore cookies** dialog can select a locally generated backup belonging to the same stopped profile. It checks the Firefox SQLite schema and integrity before restoring, and first saves a second private backup of the current database. It does **not** import arbitrary third-party cookie files.

The cookie manager only supports Firefox/Camoufox profiles with the standard 'moz_cookies' SQLite schema. It cannot inspect a currently running profile and does not import cookies. It never changes localStorage, cache, history or the profile identity file. No cookies are transferred to the Murdilimax server. A maintenance guard prevents browser startup while a cookie operation is in progress. If the app crashes during maintenance, verify that the profile is closed before removing its stale '.cookie-maintenance' marker.

The standard **Export settings** action remains metadata-only and never includes cookies or proxy passwords. The new cookie export is a separate, explicitly sensitive operation. The feature is *source-beta only* until CI, release packaging and physical Windows/Mac acceptance are complete.

Developer checks: 'python -m unittest discover -s browser -p test_cookie_manager.py -v' from the repository root, or all browser tests via 'python -m unittest discover -s browser -p test_*.py -v'. No real browser engine, account or payment processing is needed for these synthetic SQLite tests.


## Firefox add-on manager — development beta (November 2026)

A new **Extensions / Расширения** tab lets you select a browser profile, manually import a local Firefox XPI/ZIP, inspect the add-on's manifest name/version/declared permissions, enable/disable and remove it. Enabled add-ons are passed as extracted local directories to Camoufox using its documented 'addons' launch parameter when a *stopped* profile next launches. Add-on changes require a restart. This manager lists user-installed addons; Camoufox may also include its own built-in default addons.

**Security and compatibility limitations:**
- Browser extensions execute third-party scripts with the permissions their authors request. They may observe pages, cookies, sessions, account information and proxies. Import is opt-in and requires a confirmation warning. Only install add-ons from trusted publishers.
- The importer only uses **local files**. There is no automatic add-on marketplace, no remote URL fetching, no Chrome CRX support and **no malware, digital signature, extension compatibility or permission-runtime verification**. A valid manifest does not mean the extension is safe.
- A local XPI is a ZIP containing Firefox WebExtension files and a root manifest.json. Archives must pass entry/path/symlink validation, max 20 MB compressed and 70 MB extracted, and max 600 entries. Nested path traversal and zip bomb patterns are refused.
- Files are stored under the selected profile's local 'addons/' directory with a dedicated metadata file. No extension file, manifest or browser session data is uploaded to the Murdilimax server.
- Installing, toggling and removing add-ons are blocked for running profiles and during cookie maintenance. The browser launch is blocked while an add-on operation is in progress.
- Some extensions may not function in Camoufox, interfere with automation, change browser fingerprint characteristics or have permission conflicts. This feature is **source-beta only** until real-device installation and compatibility tests pass. Do not promise undetectability.

Offline QA: 'python -m unittest discover -s browser -p test_addon_manager.py -v'. Smoke tests and packaging still do not verify a real add-on inside a launched Windows/Mac Firefox process.


### Restore only your own cookies (source beta)

Select a stopped profile in **Profiles**, click **↶ Restore cookies**, choose a backup by UTC creation time and size, and confirm. The browser stays offline during the operation. Only matching profile-scoped SQLite backups in `cookie-backups/` are offered; file paths, external JSON and other profiles' backups are not accepted. The current cookie database is backed up before it changes; the returned path is a recovery snapshot. Backups contain session secrets and should be secured and deleted only when no longer needed. Restoring cookies can change website sign-in state and does not restore localStorage, cache, extension state or profile settings.

Technical: SQLite `quick_check` and the `moz_cookies` schema are validated before restoring. SQLite's backup API is used to handle databases with WAL safely. Running profiles, symlinked files and concurrent cookie maintenance are refused. This UI has **no third-party cookie import** and does not transfer cookies to the cloud. Real Windows/macOS launch and rollback QA is still a release requirement.

Developer QA: `python -m unittest discover -s browser -p 'test_cookie_restore.py' -v` using synthetic Firefox SQLite databases.


## Reliable browser startup — source beta

The desktop manager now uses an owner-token .launching reservation before spawning a browser process. The actual Camoufox child releases only its own token once it has acquired the per-profile .lock, preventing duplicate subprocess launches on rapid repeated clicks. While the handoff is pending, the UI shows Starting / Запускается; profile grouping, cookie maintenance and add-on changes are blocked. A Stop request made before the child has acquired its lock is rejected instead of reporting a misleading success.

Orphan reservations older than three minutes are recoverable on the next launch attempt, provided no browser lock or maintenance operation is present. Untrusted/symlinked launch markers are never followed. A failed Popen releases the reservation immediately; existing live stop requests are not cleared by duplicate launches. Only a child that owns the exclusive profile lock may reset a stale stop file.

This is defensive local-process coordination, not a security boundary against malicious programs sharing the user's OS account. The app does not kill arbitrary PIDs to solve stale locks. The feature is source-beta only pending physical Windows/macOS testing and release promotion.

Regression QA: python -m unittest discover -s browser -p 'test_launch_guard.py' -v. Tests cover simulated browser-child handoff, rapid double-clicks, marker recovery, stop-signal protection, cookie/addon interlocks and spawn failure.


## Controlled local cookie import — development branch (not in v0.2.0)

The Profiles toolbar adds **Import cookies / Импорт cookies** for the selected
**stopped** profile. Users must choose their own local UTF-8 file and explicitly
approve sensitive-token import. Supported formats are Murdilimax cookie export
JSON, Playwright cookie storage-state JSON and Netscape cookies.txt. Files are
limited to 5 MB and 5,000 cookies and undergo full validation before anything
in the profile is changed.

BrowserContext.add_cookies applies the cookies using the actual persistent
Camoufox/Firefox engine, avoiding unsupported raw writes into Firefox's
version-dependent SQLite schema. No web pages are visited and no cookie data
is sent to the server by the importer. This is a merge, not a blanket
replacement. A private, profile-specific SQLite backup of the current state
is saved **before** importing if a previous cookie database exists. Other
profiles remain untouched. The import rejects invalid domains, malformed
session values, duplicate keys, unsafe prefixes, unsupported container /
partitioned cookies, symlinked paths and active profile locks. Do not import
cookies from unknown publishers or other people's accounts.

Limitations: the Camoufox engine must already be installed or installed using
the Engine page first. Import may take time while headless Firefox starts.
Restoring from a backup is a separate feature; the import does not restore
localStorage, sessionStorage, service worker state or extensions. Cookies may
be rejected by Firefox for site-specific or security reasons. Imported
cookies may expire, sign a site in or change existing logins.

**Release:** This feature is in a development branch only. It is NOT part of
the already-published v0.2.0 installers. Native Windows/Mac/Linux testing and
an updated release are required before advertising it as downloadable.

Offline security tests: python -m unittest discover -s browser -p 'test_cookie_import.py' -v.
