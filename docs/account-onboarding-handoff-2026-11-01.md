# Murdilimax account onboarding acceptance — 2026-11-01

## Completed (non-destructive)

Hatchable account service (murdilimax-browser.hatchable.site) deployed version 37.

- Login remains passwordless via email code; OTP email is fixed during verification and can be changed explicitly.
- Desktop pairing redirect preserves the eight-character code and RU/EN locale, including after sign-in/session recovery.
- Account page explains four steps to pair the browser, limits duplicate confirmation requests, and shows the server-derived plan and next self-service device transfer date.
- Main website's account and pricing links were inspected. Existing Stripe LIVE checkout and subscription code was not modified.
- Real API read-only checks: anonymous account status 401; synthetic signed-in user account status 200 with Free/3 profiles; anonymous device claim 401; invalid claim code 400; invalid desktop token 401; anonymous live billing status 401.
- No valid production pairing, OTP delivery, real payment or customer data mutation was used.

Desktop regression: browser/test_onboarding_contract.py emulates start, poll pending, code approved, poll authorized, OS keyring token persistence, server license Free/3, restart, token revocation and strict-mode Free allowance. CI passed on Windows, macOS and Linux.

## Separate checks required for final production acceptance

1. Real email code delivery and registration in a disposable mailbox; passkey on an actual compatible device.
2. Actual installed Windows and Mac browser pairing: physical-device testing is step 2, not claimed here.
3. Google OAuth requires verified domain and credentials in Hatchable Setup; it is not enabled by this work.
4. Hatchable deployment validator warns about missing declarative row-access rules for user-scoped tables. Review in a dedicated security migration, especially LIVE Stripe tables. Do not change such policies silently.
5. Strict desktop commercial entitlement enforcement remains opt-in under MURDILIMAX_REQUIRE_LOGIN=1. Before selling or promoting enforcement as guaranteed, plan rollout and test production licensed binaries. Test mode demonstrates contract only, not tamper-proof DRM.
6. Paid entitlement activation via real Stripe webhook requires separate permission-based acceptance without creating surprise charges.

The public installers and all live Stripe/payment settings remain untouched.
