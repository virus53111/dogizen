# MurdiliMax: unified GitHub/Render handoff (2026-11-23)

## Single source of truth
GitHub repository `virus53111/dogizen`, branch `release/murdilimax-unified-20261123`, directory `dating-site/`. Both Work and regular ChatGPT should edit this same branch (not `main`, not the older Hatchable project). The current Render production-of-branch target is **service `srv-dc22e9ivcj2c73a1oajg`**, URL `https://murdilimax-unified.onrender.com`. The service is configured for auto-deploy, but pushes made through the GitHub connector did **not** reliably trigger Render webhooks. Do not assume a GitHub commit was published. After each code push, check Render deploy history; if no deploy started, trigger a deploy via the connected Render app, and confirm its commit SHA plus `/healthz`. The old Render Blueprint `exs-dc22526q1p3s73bi937g` was superseded and has **no resources**; do not approve its obsolete database creation plan.

## What exists
- Public HTML, CSS, JavaScript snapshot of real `https://murdilimax.com` as of 2026-11-23.
- Express runtime `dating-site/render/server.js` and PostgreSQL adapter `dating-site/render/runtime.js` compatible with existing file-based API handlers in `dating-site/api/`.
- Original Firebase project `murdilimax` retained as authentication provider; Google and email/password login with verification and password reset.
- Removed subscription check from `public/social-v4.js`; `api/chat/start.js` and `api/chat/messages.js` require login, honor block/report protections, and rate-limit spam.
- Admin authorization remains server-side in `api/admin/*.js`, verified email allowlist `dshtriters@gmail.com`.
- Photo uploads planned as PostgreSQL BLOBs, not ephemeral local files.

## Staging is LIVE, domain cutover still blocked
- Render web service **murdilimax-unified**, ID `srv-dc22e9ivcj2c73a1oajg`, URL `https://murdilimax-unified.onrender.com`, automatically deploys from the unified branch. Build and `/healthz` check succeeded on 2026-11-23.
- Dedicated Neon project `muddy-base-03643611`, database `murdilimax`, branch `br-holy-pine-bhg88n3u`, connected via Render's `DATABASE_URL` environment variable (never put the connection URL or password in GitHub). The Postgres schema has 13 migrations, including a private legacy-import archive, and admin allowlist. Public listings/messages are still **empty**; one original public profile is archived with ownership marked `awaiting_owner`.
- Existing Render workspace's sole free PostgreSQL belongs to a different project (`iron-shift-test-users`) and was **not touched**. An obsolete failed Blueprint has no resources; do not approve it.
- Static pages and the custom login page load in a headless browser without JS page errors. RU/EN/DE/LV and `/about/` all return 200. Public room history, private chat, and admin API return 401 to anonymous visitors. API checks: `/healthz` 200; `/api/listings` 200; anonymous `/api/chat/list` 401; anonymous `/api/admin/me` 401. **Two real signed-in account messaging, Google OAuth authorized-domain validation, photo upload, and admin sign-in are not yet end-to-end tested.**
- GitHub CI now runs **11 isolated unit tests** for free member messaging, block/rate-limit protection, no access to other users' threads, and verified owner-only admin rights. Latest fully validated deployment: commit `8c4c6bb7788bdcc2769184faf53d20d700cb37d4`, successful on Render 2026-11-23. Additional image validation tests reject mismatched MIME signatures and oversized uploads, and localized pages now restore Firebase auth sessions.
- Firebase Google sign-in fails with `auth/unauthorized-domain` on the Render staging hostname. The owner's existing Firebase project must add `murdilimax-unified.onrender.com` to Authentication → Settings → Authorized domains. Do not replace Firebase or its existing users.
- Live `murdilimax.com` remains on ChatGPT Sites. **Do not change Namecheap DNS** before migrating original private data and testing existing Firebase user IDs; one public listing/photo are backed up separately but NOT inserted into the new database to avoid inventing an owner-ID.

## Verified migration archive
- Legacy profile `600d3baa-1177-4f2c-829f-21bade9d29f5` (Mila) was copied from the live, publicly readable `/api/listing` endpoint to Neon `mm_legacy_imports` with one photo reference. State: `awaiting_owner` and `owner_uid=NULL`.
- It is intentionally **not** in `mm_listings`, since publishing it under an unverified owner would misroute messages and could expose them to another person. No private chats were exported.

## Backup status
The live ChatGPT Sites catalog listed 1 publicly visible profile on 2026-11-23. A public metadata JSON snapshot and its 2,738,300-byte PNG photo were copied into existing owner's Hatchable project `proj_vROkWOWk9ZXw`, durable storage keys:
- `murdilimax/backups/live-20261123/public/listings.json`
- `murdilimax/backups/live-20261123/public/600d3baa-1177-4f2c-829f-21bade9d29f5.png`

Only **public** listing data was backed up. Private messages/users/photos may be in the old ChatGPT Sites database and are **not migrated**. Auth identity is the existing Firebase project; do not create replacement user IDs or break mapping of listing ownership.

## Remaining gates
1. Resolve the confirmed Firebase `auth/unauthorized-domain` failure: authorize `murdilimax-unified.onrender.com` under Firebase Authentication → Settings → Authorized domains. Then verify both Google and email/password on staging.
2. End-to-end test registration, photo uploads, two real member accounts, free DMs, blocking/reporting and admin access. Free Render/Neon plans can sleep and carry resource caps.
3. Export original ChatGPT Sites private users/listings/photos/chats and import with validated ownership mapping. Do not treat an empty new database as a successful migration.
4. Reconcile rows, photos, chats and verify backups. Only then approve the single Namecheap cutover; old publication stays until successful cutover.
