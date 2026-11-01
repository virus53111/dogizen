# Murdilimax Browser — Windows & macOS desktop beta

This repository also contains **archived Murdilimax Forms, cinema and Murdilimax Orbit Android** materials. The product being developed in the `feature/orbit-browser-only-2026-10-31` branch is browser-only.

## Components

- `browser/` — new independent Tkinter + Camoufox desktop code: profiles, proxies, local data, QA tests.
- `browser-site.css`, `index.html`, `download.html` — browser-only product website and transparent installer status.
- `.github/workflows/browser-ci.yml` — offline regression tests on Windows, macOS, Linux.
- `.github/workflows/browser-build.yml` — unsigned preview EXE / DMG artifacts, **not public release**.
- `docs/BROWSER_PRODUCT_ROADMAP_RU.md` — priorities, gaps and compatibility tracking.
- `desktop/` and `Murdilimax-Orbit-Windows-macOS-Beta.zip` — **legacy Android / Orbit only**, retained for preservation.
- GitHub Pages is deployed from `main` (root) with `CNAME` = `murdilimax.com`.

## Development
```
cd browser
python -m pip install -r requirements.txt
python -m camoufox fetch
python -m unittest discover -v
python app.py
```

**Release gate:** Published downloads only after OS-specific browser launch, proxy, fingerprint, session persistence and security QA. A green packaging job alone is insufficient.

**Catalina:** modern Camoufox compatibility has not been established; an old native WebKit app does not provide full antidetect protection.

## Safe rollback
Pre-migration main snapshot: `backup/orbit-android-before-browser-only-2026-10-31`. Other archived project branches are unchanged.
