# Murdilimax Browser — commercial release gates (31 Oct 2026)

## Architecture

- **Marketing:** https://murdilimax.com (GitHub Pages, independent from backend)
- **Desktop:** `browser/` in GitHub branch `feature/orbit-browser-only-2026-10-31`, Camoufox + Python/Tkinter, separate persistent local storage per profile
- **Accounts:** Hatchable `proj_Heh4ipgHhTB1` / `murdilimax-browser` (browser-only, isolated from old Orbit Android)
- **Payments:** Stripe account available in test mode; **no payment integration or live subscriptions** as of this document
- **Old Android:** preserved in `backup/orbit-android-before-browser-only-2026-10-31`; **Android mobile app is not ready**

## Current sign-in mechanism

1. User enters verified email via browser and gets one-time code, or uses passkey. Google provider is declared but disabled until operator verifies a custom account domain and configures OAuth.
2. Desktop generates random per-install ID in OS Keychain (not a hardware attestation).
3. Desktop requests a one-time pairing code and opens the account portal in the browser.
4. After successful signed-in confirmation, backend stores hash of installation and trusted IP, and issues 30-day random bearer token (hash only stored at rest).
5. Desktop stores token in Keychain/Credential Manager, calls `/api/device/me`, and periodically refreshes entitlement view.
6. A new device/IP requires verified reset, with 30-day self-service cooldown. Independent accounts on shared Wi-Fi are allowed.

**Important:** A user can copy an unlocked client or replay exported keychain material. A hardware-backed non-exportable device key, challenge-response, token rotation, revocation telemetry, clock-skew handling and security assessment are needed for robust commercial controls. No IP-only policy is fraudproof.

## Price proposals, not active charges

| Tier | Monthly USD proposal | Profile limit | Audience |
| --- | ---: | ---: | --- |
| Free | 0 | 3 | evaluation |
| Start | 7 | 20 | solo |
| Pro | 19 | 100 | serious solo |
| Business | 49 | 300 | small teams (team features not implemented) |

Do not create a live checkout until actual product features, terms and support are ready. Never derive paid access from client input or a checkout success URL: require cryptographically verified payment provider events and server-owned subscription records.

## P0: blocking public sale

- [ ] Owner switches Hatchable project Settings → Visibility → Public (all visitor routes currently behind owner wall).
- [ ] Verify `accounts.murdilimax.com` custom domain, create Google OAuth client on operator account and publish consent screen. Email code + passkey are implemented first.
- [ ] Test end-to-end pairing with a **trusted** IP supplied by real platform edge; API refuses activation if IP is unavailable.
- [ ] Ensure all local data are securely written and each profile has stable fingerprint for repeat sessions.
- [ ] Test proxy exit IP, DNS, WebRTC, Canvas, UA/WebGL consistency and profile storage separation on actual Windows and Mac computers.
- [ ] Test client auth, errors/recovery, sign-out/revoke, subscription expiry and downgrade including loss of network.
- [ ] Integrate Stripe **test mode** Checkout/Billing Portal + signed event webhooks, map prices to entitlements and check all payment states.
- [ ] Verify Windows and Apple Silicon/Intel DMGs on physical machines; sign and notarize app binaries. Bundle or automatically verify-download compatible Camoufox engines, no command line for buyers.
- [ ] Build full account deletion, GDPR legal basis, data retention, processing agreements, refund policy, terms, security disclosures, support contact and EU VAT tax handling.
- [ ] Security review, input validation, rate limits, session integrity, key management, API abuse tests; backup/restore and incident response.
- [ ] Pass accessibility/keyboard navigation, mobile-responsive marketing, 4K desktop scaling, multilingual localizations and browser compatibility.

## P1: paid feature parity

- Stable per-profile fingerprint settings and controlled upgrade migration
- Bulk proxy testing, robust edits, proxy provider integration
- Cookies import/export after explicit consent; bookmarks/extension management
- Workspace templates, secure local API, workflow runner, action synchronizer
- Cloud backup with encryption, audited team access and permissions
- In-app updates with signed metadata, release notes, rollback and crash reporting (opt-in)

## Catalina & Android

Camoufox availability on **macOS Catalina 10.15** requires actual engine and binary compatibility testing. A legacy WebKit wrapper is not equivalent to Camoufox fingerprint control. Android means a **separate mobile companion application** to manage accounts/profiles later; it is not supported as a native Camoufox Android antidetect app. Avoid advertising platforms before tested.

## Scope safety

Marketing site already published as luxury visual refresh (GitHub Pages), while desktop app and payments remain gated in the feature branch. Do not merge or sell based only on CI packaging success.
