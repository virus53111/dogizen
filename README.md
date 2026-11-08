# MURDILIMAX — classifieds / sludinājumi / объявления
Public domain: https://murdilimax.com

Modern classifieds marketplace in Russian, Latvian and English. Free hosting on GitHub Pages; Hatchable handles member accounts, PostgreSQL, moderation and refresh jobs.

## Current features
- **Account-synced favorites (v29):** visitors can still save up to 100 native and SS.lv listings without registration; after email sign-in on the Hatchable account site, saved favorites merge into the user's private PostgreSQL favorites and become available on other devices. The public GitHub Pages domain `murdilimax.com` has an explicit **Sync with account** button that opens the trusted Hatchable account origin and transfers browser favorites via origin-checked `postMessage` (not URL query). The two domains have separate browser storage; use the button to transfer existing public-site favorites. Signed-in favorites are stored server-side, and guest favorites remain local until successful migration. Prices and availability remain the publisher's responsibility.
- **Mobile search and filter chips (v26):** search directly above results; collapse filters on small screens; remove individual active filters or reset all with one tap. Category, city, price and detailed filters stay in URL for shareable results, localized RU/LV/EN.
- Curated, **attributed links to real offers from public SS.lv RSS**: Latvian property (Rīga districts, Jūrmala, Liepāja), many car makes, consumer electronics, household goods, bicycles, job vacancies by profession and construction services.
- 90 selected public RSS feeds (88 responded at the November 8 test), refreshed every six hours by Hatchable; sourced items link to original listing. No fabricated sellers, prices, reviews or imported contact details. The RSS source indication is now BELOW each product photo, never a badge over the picture.
- Filters for location, district, property type, rooms, floor area, car make and year, profession and work schedule, electronics category and condition, home goods, and services.
- More offer types now include additional Latvian cities and Riga neighborhoods; 11 more car makes; laptops, consoles, monitors and phones; furniture, courier/transport and building services. Expanded pagination lets visitors browse up to 200 pages at 24 offers each.
- Jobs has separate **Vacancies** and **Seeking work** views (job_type=vacancy|seeking) in RU/LV/EN. Public SS.lv jobs are vacancies only; native users can post a vacancy or job-seeker profile, with optional company/experience and salary.
- Job cards lead with the role/title, and omit unspecified pay instead of prominently displaying "salary to be confirmed". Additional attributes on native listings are validated and stored server-side.
- When a vacancy omits salary, the job title is prominent and the salary label is omitted rather than showing €0 or "salary to be confirmed".
- Public SS.lv **job-seeker listings** are linked from a dedicated "Seeking work" section. Only an occupational label, general city and original link are shown: no republished names, contact details, personal photos or job-seeker descriptions.
- **Account and login**: same-origin, authenticated user account at https://murdilimax.hatchable.site/account.html ; passwordless login lasts as long as the app session, and the login page avoids repeating authentication if already signed in. The public domain points all account buttons to this address to avoid a cross-site cookie mismatch.
- Owner staff dashboard: https://murdilimax.hatchable.site/admin.html . Owner's registered/verified email gates the backend; moderators are granted permissions individually. All mutations verified server-side, with audit log.
- New member listings may include up to 6 photos and optional approximate location on the map; they require moderation before public posting. No payment system.
- Mobile posting supports up to six photos, multiple selections, image reordering/removal and in-browser WebP compression of large images before upload. Failed submissions can securely clean up unattached uploads without deleting photos already linked to published ads.
- Members can now **edit their own listings** (title, description, city, price, contact name/phone) from the Hatchable account page. Any change resets the listing to pending review; an anonymous or different user is denied by the API. The full create → edit → delete flow was tested with a temporary synthetic listing, which was removed afterwards.
- The public JavaScript initialization error caused by treating a single element as a collection was fixed. Posting a job after signing in preserves the selected category and vacancy/seeking-work mode.
- Hatchable v22 added `/api/edit` and updated `/api/mine`; a source snapshot of changed Hatchable files is saved under `hatchable/` for review. These files are not deployed by GitHub Pages.

## SEO
Static, HTML-rendered, unique editorial landing pages in three languages, including separate vacancy and seeking-work landing pages. RU/LV/EN languages, localized title/H1, hreflang, canonical and JSON-LD. Daily sitemap generation includes published first-party ads and 21 language-specific category URLs plus language entry pages. Public RSS items are NOT republished as individual indexed pages to prevent misleading duplications. Job seeker category pages may link to original SS.lv listings but never index copies of individual profiles.

## Edit listing photos (v25)
Account owners may edit listing fields and their photo gallery (maximum six files). New photos are uploaded through the existing authenticated API; the edit route validates ownership and photo references before saving the new order and cover photo. Removed images are cleaned up after the database update. Any edit returns the listing to moderation. The account UI is translated into RU/LV/EN and supports touch-friendly photo management. Photos above 4 MB are rejected in this editor.

## Report unsafe listings (v24)
Signed-in users can report native listings and SS.lv RSS references from the public interface. The report form is translated into RU/LV/EN and requires an account, checks the target, blocks duplicates for seven days and limits submissions to five per day. Reports stay in a private `listing_reports` moderation queue; moderator review is required before hiding anything. Review actions are audited; users cannot see reporters or internal decisions. External listings are never edited on SS.lv, only suppressed from MURDILIMAX.

## Source restrictions
SS.lv is an external source, not a partnership. Source remains visible beside the original-site link and in the category disclosure. Do not mirror private seller contacts or treat external offers as on-platform user ads. Link to the publisher and respect removal requests. Image files are hotlinked to the source server; some RSS thumbnails are lower resolution. Confirm all listing terms on the original site.

## Pending production security work
Hatchable currently has `[db.tables.classified_ads] read="public", write="public"` and no row rule for `site_user_bans`. The application protects sensitive mutations with authenticated, owner-checked endpoints. Do **not** switch ads to `write="own"` without redesigning the moderation endpoint, because moderators are authenticated as app users and need to edit ads by other users; a naive row policy would block that workflow. Test RLS changes in a separate staging database first.

## Backups and operations
Old projects are archived in GitHub branches. Deploy with GitHub Pages workflow. Hatchable backend project `murdilimax` is public. This project has no paid hosting or subscriptions.
