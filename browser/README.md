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

**Known beta limitations:** Camoufox device identity is stored per profile, but uniform remote anti-fraud fingerprints, GPU, WebRTC and DNS consistency are not guaranteed. Browser extensions manager, cloud sync, team accounts, a local automation API, automatic updates and signed installers are not implemented. A standalone account/Stripe service exists; successful real payments have not been validated in this source workflow. Desktop installers still need real-device QA. Catalina Mac support is a separate compatibility track.

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
- **Clear cookies**: backs up the entire Firefox cookie database as a separate SQLite file under the owner's local Murdilimax directory before deleting cookie rows. Clearing can log you out of websites; the backup remains sensitive and is not automatically deleted. Restoration is manual, and the current GUI has no restore button.

The cookie manager only supports Firefox/Camoufox profiles with the standard 'moz_cookies' SQLite schema. It cannot inspect a currently running profile and does not import cookies. It never changes localStorage, cache, history or the profile identity file. No cookies are transferred to the Murdilimax server. A maintenance guard prevents browser startup while a cookie operation is in progress. If the app crashes during maintenance, verify that the profile is closed before removing its stale '.cookie-maintenance' marker.

The standard **Export settings** action remains metadata-only and never includes cookies or proxy passwords. The new cookie export is a separate, explicitly sensitive operation. The feature is *source-beta only* until CI, release packaging and physical Windows/Mac acceptance are complete.

Developer checks: 'python -m unittest discover -s browser -p test_cookie_manager.py -v' from the repository root, or all browser tests via 'python -m unittest discover -s browser -p test_*.py -v'. No real browser engine, account or payment processing is needed for these synthetic SQLite tests.
