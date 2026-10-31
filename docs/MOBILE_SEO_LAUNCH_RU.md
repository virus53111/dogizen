# Murdilimax SEO + mobile launch plan (31 Oct 2026)

## What was deployed to murdilimax.com
- Premium 1024px scalable browser/app emblem at `/assets/murdilimax-icon.svg`.
- `/favicon.svg`, plus CI-generated `/favicon.png`, `/apple-touch-icon.png`, `/og-image.png` and `/mobile/icon-180.png`, `icon-192.png`, `icon-512.png`.
- Mobile companion PWA: `/mobile/`, install instructions: `/mobile-app.html`, installable on Android Chrome and iPhone Safari via Add to Home Screen. This is **not** an Android/iOS Camoufox anti-detect browser. Local profile metadata only, no cloud sync, cookies or proxy routing.
- Separate Android WebView APK build on GitHub Actions: `Android mobile companion beta APK`. Artifacts are **debug signed**, for testing, not a commercial or Play Store ready release.
- Canonical metadata, Open Graph and Twitter image preview, supported Schema.org graph for WebSite/Organization/beta SoftwareApplication with **no made-up ratings or prices**.
- `/sitemap.xml` and `/robots.txt`, dedicated guides and internal links. No private account URLs in sitemap; the account and mobile app have `noindex`.
- IndexNow ownership file + best-effort notification after successful GitHub Pages deploy. HTTP 202 indicates *accepted for processing*, **not indexed**. Repeated spammy submissions do not improve ranking.
- Build validation for sitemap paths and canonical metadata via `python tools/check_site.py`.

## Owner actions — Google

1. Open [Google Search Console](https://search.google.com/search-console) and add the **Domain property** `murdilimax.com`.
2. Verify domain via the DNS TXT record that Google displays. Never guess or publish verification values.
3. In **Indexing → Sitemaps**, submit `https://murdilimax.com/sitemap.xml`.
4. Inspect `https://murdilimax.com/`, `/download.html`, `/mobile-app.html`, `/guides/`. Use **Request indexing** for genuinely new or updated pages. Google decides when/if to index.
5. Check Page indexing, Core Web Vitals, Mobile Usability, HTTPS and duplicate canonicals. Fix actual problems; do not mass-resubmit unchanged URLs.
6. Connect first-party analytics only with clear privacy disclosures/appropriate consent handling under GDPR when applicable.

The GSC Wizard integration was checked but its subscription/trial is inactive; no Search Console property could be listed or modified through that connector.

## Owner actions — Yandex

1. Open [Yandex Webmaster](https://webmaster.yandex.com/) and add `https://murdilimax.com/`. Verify site ownership using its provided DNS or HTML token.
2. Submit the canonical XML sitemap. Inspect the Crawl and Indexing status after some days.
3. Use the Reindex pages tool for truly updated pages. Our deploy workflow already sends IndexNow notifications for public URLs to participating engines.
4. If the main mirror differs from `https://murdilimax.com/`, align it to avoid www/HTTPS duplicates.

## Bing and other engines
- Verify the domain in [Bing Webmaster Tools](https://www.bing.com/webmasters/); submit sitemap. IndexNow notifies participating engines.
- SEO does not mean buying fake links, duplicating pages, using fake testimonials/reviews, or making unsupported product/compatibility claims.

## Editorial SEO roadmap
- Official product docs: install on Windows/macOS, profile creation, proxy configuration, data backups, account recovery.
- Useful troubleshooting: browser engine download errors, Windows SmartScreen, Mac Gatekeeper/notarization, OS support table, safe storage. Publish only after verified.
- Original screenshots and video from real tested application; avoid using stylized concept dashboard as proof that a feature exists.
- English localization only after high-quality human-edited translation and fully self-consistent language routes + hreflang.
- Track queries, impressions, clickthrough and conversions using authorized first-party GSC/Yandex data. Avoid unsubstantiated claims of rapid indexing.

## Commercial release gates
1. Google OAuth domain setup + identity provider and server-verified license session.
2. Verified paid entitlements and test-mode Stripe signed webhooks before public billing.
3. Stable fingerprint per desktop profile, proxy/IP leak testing, engine download on clean machines.
4. Windows/macOS physical-machine installer testing, code signing & notarization.
5. Android standalone anti-detect engine needs its *own* development; current mobile APK and PWA are companions only.
6. Privacy/GDPR, terms, refunds, VAT, account deletion, customer support and security audit.
