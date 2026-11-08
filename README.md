# MURDILIMAX — classifieds / sludinājumi / объявления
Public domain: https://murdilimax.com

Modern classifieds marketplace in Russian, Latvian and English. Free hosting on GitHub Pages; Hatchable handles member accounts, PostgreSQL, moderation and refresh jobs.

## Current features
- Curated, **attributed links to real offers from public SS.lv RSS**: Latvian property (Rīga districts, Jūrmala, Liepāja), many car makes, consumer electronics, household goods, bicycles, job vacancies by profession and construction services.
- 43 public RSS feeds, refreshed every six hours by Hatchable; sourced items link to original listing. No fabricated sellers, prices, reviews or imported contact details. The RSS source indication is now BELOW each product photo, never a badge over the picture.
- Filters for location, district, property type, rooms, floor area, car make and year, profession and work schedule, electronics category and condition, home goods, and services.
- Jobs has separate **Vacancies** and **Seeking work** views (job_type=vacancy|seeking) in RU/LV/EN. Public SS.lv jobs are vacancies only; native users can post a vacancy or job-seeker profile, with optional company/experience and salary.
- Job cards lead with the role/title, and omit unspecified pay instead of prominently displaying "salary to be confirmed". Additional attributes on native listings are validated and stored server-side.
- Sourced vacancies without published salary show "salary to be confirmed", **not €0**. External search and native listings remain separate.
- **Account and login**: same-origin, authenticated user account at https://murdilimax.hatchable.site/account.html ; passwordless login lasts as long as the app session, and the login page avoids repeating authentication if already signed in. The public domain points all account buttons to this address to avoid a cross-site cookie mismatch.
- Owner staff dashboard: https://murdilimax.hatchable.site/admin.html . Owner's registered/verified email gates the backend; moderators are granted permissions individually. All mutations verified server-side, with audit log.
- New member listings may include up to 6 photos and optional approximate location on the map; they require moderation before public posting. No payment system.

## SEO
Static, HTML-rendered, unique editorial landing pages in three languages, including separate vacancy and seeking-work landing pages. RU/LV/EN languages, localized title/H1, hreflang, canonical and JSON-LD. Daily sitemap generation includes published first-party ads and 21 language-specific category URLs plus language entry pages. Public RSS items are NOT republished as individual indexed pages to prevent misleading duplications.

## Source restrictions
SS.lv is an external source, not a partnership. Source remains visible beside the original-site link and in the category disclosure. Do not mirror private seller contacts or treat external offers as on-platform user ads. Link to the publisher and respect removal requests. Image files are hotlinked to the source server; some RSS thumbnails are lower resolution. Confirm all listing terms on the original site.

## Backups and operations
Old projects are archived in GitHub branches. Deploy with GitHub Pages workflow. Hatchable backend project `murdilimax` is public. This project has no paid hosting or subscriptions.
