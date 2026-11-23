# MurdiliMax: unified GitHub/Render handoff (2026-11-23)

## Single source of truth
GitHub repository `virus53111/dogizen`, branch `release/murdilimax-unified-20261123`, directory `dating-site/`. Both Work and regular ChatGPT should edit this same branch (not `main`, not the older Hatchable project). Render Blueprint ID: `exs-dc22526q1p3s73bi937g`; config `render-murdilimax.yaml`.

## What exists
- Public HTML, CSS, JavaScript snapshot of real `https://murdilimax.com` as of 2026-11-23.
- Express runtime `dating-site/render/server.js` and PostgreSQL adapter `dating-site/render/runtime.js` compatible with existing file-based API handlers in `dating-site/api/`.
- Original Firebase project `murdilimax` retained as authentication provider; Google and email/password login with verification and password reset.
- Removed subscription check from `public/social-v4.js`; `api/chat/start.js` and `api/chat/messages.js` require login, honor block/report protections, and rate-limit spam.
- Admin authorization remains server-side in `api/admin/*.js`, verified email allowlist `dshtriters@gmail.com`.
- Photo uploads planned as PostgreSQL BLOBs, not ephemeral local files.

## Publication is NOT finished
The initial Render Blueprint **failed before any resources were created** because this workspace already has the sole allowed free PostgreSQL database, `iron-shift-test-users`, used by a different project. Render allows only one free database per workspace. **Do not delete, repurpose or overwrite this unrelated database.** A durable new database or separately authorized paid database is required before publishing the unified app.

The live `murdilimax.com` is still served by ChatGPT Sites. DNS must **NOT** be changed before production data is migrated and the new app passes end-to-end tests. The new branch contains no private messages or private user export.

## Backup status
The live ChatGPT Sites catalog listed 1 publicly visible profile on 2026-11-23. A public metadata JSON snapshot and its 2,738,300-byte PNG photo were copied into existing owner's Hatchable project `proj_vROkWOWk9ZXw`, durable storage keys:
- `murdilimax/backups/live-20261123/public/listings.json`
- `murdilimax/backups/live-20261123/public/600d3baa-1177-4f2c-829f-21bade9d29f5.png`

Only **public** listing data was backed up. Private messages/users/photos may be in the old ChatGPT Sites database and are **not migrated**. Auth identity is the existing Firebase project; do not create replacement user IDs or break mapping of listing ownership.

## Next engineering gates
1. Choose safe persistent database that doesn't interfere with Iron Shift. Connect database URL via Render managed secret, never commit credentials.
2. Provision unified Render service from this same GitHub branch and confirm live deployment.
3. Test Firebase auth on staging (Google provider may require allowing staging domain), publishing/moderation, photos, and two-account messaging.
4. Export private production data, import with validated owner-ID mappings, reconcile counts and media checksums.
5. Only then ask the owner to change Namecheap DNS to the new validated service and verify `murdilimax.com`.
