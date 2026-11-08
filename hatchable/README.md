# Hatchable source snapshot — MURDILIMAX

Project: `proj_E4sXfkYysFlf` (`murdilimax.hatchable.site`).

This directory stores the changed Hatchable files for code review. The actual deployed source and PostgreSQL database live in Hatchable, not on GitHub Pages. Do not treat these files as automatically deployed.

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
