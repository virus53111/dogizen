# Hatchable source snapshot — MURDILIMAX

Project: `proj_E4sXfkYysFlf` (`murdilimax.hatchable.site`).

This directory stores the changed Hatchable files for code review. The actual deployed source and PostgreSQL database live in Hatchable, not on GitHub Pages. Do not treat these files as automatically deployed.

## Changes in v30
- `migrations/0014_source_liveness.sql`: add source checking state and verification index.
- `api/jobs/verify-external.js`: scheduler-only check of a bounded 32 original SS.lv listing URLs per two-hour run; 404/410 hides them; a second confirmation marks gone. 200 restores availability; 403/429/5xx and network failure do not remove offers.
- `hatchable.toml`: new two-hour URL-check cron; existing six-hour RSS cron unchanged.
- `api/jobs/sync-external.js`: seven-day publication limit and source-health guard before physical cleanup.
- `api/external.js`: hide source-missing rows; expose actual last RSS sighting and list valid latest offers.
- `api/listings.js`: return updated_at for truthful sitemap lastmod on first-party ads.
- `public/app.js`, `public/i18n.js`, `public/style.css`: show latest RSS sighting, source freshness and cleanup policy to RU/LV/EN users.
- `scripts/generate-seo.mjs` (GitHub root): generate accurate sitemap lastmod, actual RSS counts, and clearly qualified price medians from a bounded recent sample, without indexing mirrored external listings.

## Changes in v29 (server update from v28)
- `migrations/0013_user_favorites.sql`: private per-user favorites with a composite unique key and a limit of 100 enforced by API.
- `api/favorites.js`: signed-in GET, add, remove and merge endpoints. Validates user input and SS.lv link hosts, scopes SQL to the authenticated account, rejects anonymous calls.
- `hatchable.toml`: owner-only row access for `user_favorites`.
- `public/app.js`: automatically merges guest favorites after login to Hatchable and saves further changes to the account. Browser storage is retained if import fails.
- `public/index.html` / `public/style.css` / `public/i18n.js`: responsive sync panel and RU/LV/EN messaging.
- GitHub Pages `murdilimax.com` remains a separate origin: users tap Sync with account to open Hatchable, transferring existing favorites via origin-checked `postMessage`. Signed-in data lives on Hatchable, not in a GitHub Pages database. Browser-to-browser live sync on the public origin is not implied.

## Changes in v27
- `public/index.html`: favorites navigation and header count, favorites view navigation and browser-local notice.
- `public/app.js`: safe favorites snapshots for native listings and SS.lv sources; add/remove heart buttons, cross-tab synchronization, limit of 100, return to saved view from native ad details.
- `public/i18n.js` / `public/style.css`: RU/LV/EN labels, keyboard-accessible card button, responsive heart controls.
- Browser-only storage, no API or database changes; saved entries are not synchronized between origins, devices, or accounts.

## Changes in v26
- `public/index.html`: results-level search, mobile filter button and active-filter summary.
- `public/app.js`: query synchronization, remove-one/reset-all filter chips and accessible mobile toggle.
- `public/i18n.js`, `public/style.css`: RU/LV/EN labels and responsive touch-friendly search controls.
- Public site source is synchronized to GitHub Pages using the root-level files; backend remains on Hatchable.

## Changes in v25
- `api/edit.js`: owner-only photo changes (up to six), strict owned-key validation, collision prevention, atomic SQL update and automatic moderation.
- `api/mine.js`: returns ordered photo URLs and owner-specific keys for safe editing.
- `public/account.html`: preview, add, remove, and reorder photos; upload new files on save; remove unattached uploads on failure; RU/LV/EN.

## Changes in v24
- `migrations/0012_listing_reports.sql`: moderated report queue with duplicate prevention and review metadata.
- `api/report.js`: user-authenticated reports for native and SS.lv listings, verified targets, limits and ban checks.
- `api/staff.js`: review queue, summary count and owner/moderator-only review actions including hiding an offending listing.
- `public/staff-ui.js` / `public/admin.html`: closed staff report queue with review, reject and hide controls.
- `public/app.js`, `public/i18n.js`, `public/style.css`: report links, report form and RU/LV/EN mobile styling.

## Changes in v23
- `api/upload-cancel.js`: authenticated, owner-scoped cleanup of unlinked photos after a failed submission. Keys already referenced by `classified_images` are never deleted.
- `public/app.js`: thumbnail manager, photo reorder/remove, incremental selections, large-photo optimization with Canvas/WebP, and error recovery.
- `public/i18n.js`: accessible labels in RU/LV/EN for photo controls.
- `public/style.css`: touch-friendly two-column photo grid on narrow screens.

## Changes in v22
- `api/edit.js`: authenticated owner-only edits; any edit resets status to `pending`.
- `api/mine.js`: returns data needed by the owner's edit form.
- `api/listing/[id].js`: returns category attributes on public approved listings.
- `public/account.html`: editing UI in RU/LV/EN for signed-in owners.

## Access control and moderation
All owner operations must enforce `req.user.id` on the server. Public catalog endpoints only return approved first-party listings. Do not publish edits before moderator approval.

The `classified_ads` row policy cannot safely be changed from `write="public"` to `write="own"` without redesigning staff moderation: staff uses `access="user"` and needs to change listings by other owners. Likewise, evaluate `site_user_bans` policy and the moderator endpoint together in staging rather than applying a rule that breaks ban checks or moderator updates. The API-layer ownership guards were checked on the live deployment with a temporary test listing, which was deleted afterward.

No credentials, tokens or secrets belong in this directory.
