# Murdilimax — P0 commercial security gate (2 November 2026)

**Status: NOT APPROVED FOR STABLE 1.0.** This is an acceptance plan, not an assertion of a confirmed account-data leak or billing outage. Live account, device, Stripe and existing Windows v0.16.0 releases must remain running while verification is performed on isolated fixtures or a genuinely isolated test environment.

## Evidence from read-only production inspection

- Hatchable accounts backend: `murdilimax-browser`, deployed version 40. LIVE sales flag was `true`; periodic billing reconciliation route returned HTTP 200. HTTP 200 alone does **not** prove that a renewal or refund updates entitlement correctly.
- `/api/billing/live-status`: anonymous request rejected with HTTP 401; a platform synthetic signed-in app user received HTTP 200, no live subscription, `live_sales_enabled=true`. Do not infer cross-user isolation from those two checks.
- Past Checkout HTTP 503s were earlier than the recorded LIVE-enable timestamp; verify redacted error codes again if new errors occur. Never disable production sales for a test.
- Hatchable dry-run: **six user-scoped tables without explicit row policies**:
  `browser_account_restrictions`,
  `browser_live_checkout_limiter`,
  `browser_live_checkout_sessions`,
  `browser_live_stripe_subscriptions`,
  `browser_stripe_checkout_attempts`,
  `browser_stripe_subscriptions`.
- Other warnings refer to deliberately public device-pairing endpoints and an undeployed Google sign-in provider. Public routes must still be reviewed individually; anonymous discovery is not equivalent to a vulnerability.

## Blocker discovered in isolated staging

An attempted Hatchable fork of the account backend did not finish. It copied no production data, but replaying migration `0006_secure_device_token_functions.sql` failed while compiling `browser_consume_pairing`: the SECURITY DEFINER functions set a **hard-coded production database schema** in their `search_path`, which is not portable to the fork namespace.

Before repeating the fork, produce a staging-only migration variant with the *actual staging schema*, or redesign the security-definer functions to resolve only trusted, explicitly scoped objects. Review function ownership, search_path safety, grants and schema permissions. **Do not edit or rerun the production migration in place** to make a fork work.

## Required staging tests (separate users A and B)

1. Create isolated non-production Hatchable project, two test accounts (A and B), no live Stripe keys, no production cookies or tokens. Verify the staging DB schema is created correctly and `browser_consume_pairing` / `browser_verify_desktop_token` resolve only staging relations.
2. For each user-scoped table above, try: unauthenticated read/write; user A read A; user A read B; user A update/delete B; forged `user_id=B` insert by A; legitimate owner/admin and scheduler queries. All cross-user operations must fail without exposing rows.
3. Identify the *true writer* of each row. Subscription status, account suspension and billing rate-limit counters must **not** become freely editable by the paying user. Do not blindly apply `read="own", write="own"` to Stripe-controlled subscription tables. Prefer owner-only writes or carefully scoped, tested server-side procedures while preserving signed webhook/scheduler compatibility.
4. Exercise the exact `/api/device/start`, `poll`, `me`, `revoke` authorization and token/PID flows, rate limits, replay, revocation, expiry, and two concurrent device claims. Never print raw device tokens, pairing secrets or cookies in CI logs.
5. Feed Stripe **TEST-mode** signed fixtures through checkout/webhook/reconcile/entitlement flows: first invoice paid, trialing, unpaid, out-of-order events, duplicates, cancellation, failed payment, refund/dispute handling, subscription expiry, and billing-portal use. Verify that only a current paid LIVE invoice grants the production paid tier; test events must never do so.
6. Verify synchronization between the server's entitlement response and actual Windows desktop launch limits with two test accounts, offline startup, revoked devices and concurrent requests.
7. Run the full regression suite after proposed staging row policies. Compare staging worker, signed webhook and cron DB access to baseline. Confirm no subscription downgrade or skipped webhook.
8. Prepare a point-in-time backup, a rollback migration and explicit maintenance approval. Do not promote a row-policy change to production until the two-user isolation matrix and both billing modes are green.

## Windows stable-v1.0 release gates

- Verify official installer SHA-256 using the in-app user-selected-file checker introduced in PR #80; **checksum verification is not publisher identity**.
- Obtain Windows Authenticode signing for both launcher and installer; scan the distributable and verify signer/chain on a clean Windows 10 and Windows 11 machine.
- Confirm clean install, account pairing, status/renewal/expiry, proxies including authentication, preserved Firefox/Camoufox sessions and cookies, add-ons, bookmarks, Flow Studio, update/rollback and errors without secret leakage.
- Reproduce with normal and non-admin Windows accounts, blocked network, bad proxy, expired license, app crash, and restored backup. Never overwrite existing user profiles during update.
- Show immutable release tag, CI commit SHA, Setup.exe, `SHA256SUMS.txt`, expected file size and rollback link; do not replace already published binaries.
- Stable 1.0 only when **all** P0 criteria above are evidenced; further Dolphin-like features can be staged separately without blocking critical fixes.

## Owner-held prerequisites

The owner must provide/perform (in service consoles, not in GitHub or chat): Windows code-signing certificate, production-independent Stripe TEST keys and webhook signing secret, two synthetic authorized test accounts for staging, and final go/no-go approval for a reversible server permission migration. No secret is required to run the read-only/offline repository unit tests.

**Not changed by this audit:** LIVE Stripe switch, card prices, server DB permissions, customer subscriptions, app branding, Mac packages, hosting, or the published v0.16.0 installer.
