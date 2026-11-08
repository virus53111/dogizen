# MURDILIMAX classifieds

Production: https://murdilimax.com — RU/LV/EN marketplace.

## SEO architecture
- HTML-rendered, **indexable** language hubs `/lv/`, `/en/` and 15 unique editorial category pages across RU/LV/EN. Root `/` is the Russian default.
- Canonicals and reciprocal `hreflang` (ru, lv, en, x-default); semantic H1/title/descriptions; Organization, WebSite, CollectionPage, BreadcrumbList structured data.
- Every page contains original editorial buying/selling tips and links to actual sourced offers where available (clearly attributed SS.lv). No fabricated user reviews, no copied seller profiles.
- Native **approved** user listings are converted into individual indexable `/ads/:id/` HTML pages automatically; external RSS listings are only outbound links to the publisher and never impersonate native listings.
- `scripts/generate-seo.mjs` builds pages, `seo.css`, `sitemap.xml` and `robots.txt` at GitHub Pages publish time.
- GitHub Actions scheduled daily at 03:15 UTC regenerates site pages and the sitemap from the live Hatchable API. Build degrades gracefully if feeds temporarily fail.
- `/admin.html` is NOT published on GitHub Pages. The passwordless protected staff console lives at https://murdilimax.hatchable.site/admin.html and `/api/staff` is server-gated to a verified owner email or email-added moderators.
- Submit sitemap URL `https://murdilimax.com/sitemap.xml` manually in **free Google Search Console** after verifying ownership (GSC Wizard plugin currently requires subscription; no paid actions used). Indexing and traffic are never guaranteed.

## Real sourced offers and moderation
- Backend Hatchable `murdilimax` maintains separate external RSS and first-party `classified_ads` tables. Source SS.lv RSS offers are attributed, outbound-linked, periodically refreshed; no seller contact information copied.
- Admin owner email is verified by passwordless app session. Owner alone sees registered users, ban controls and moderator invitation management. Moderators may review/edit/delete first-party listings and hide external cards, but cannot assign other moderators or view account emails of all users.
- Admin operations are logged to `site_audit_log`; users who are blocked cannot create new listings or upload photos. Their already public ads are rejected on block. Unblocking does not republish those ads.

No paid hosting. Historical project archives remain in GitHub archive branches. Review photo rights, GDPR privacy/abuse reporting and spam defense before expanding traffic.
