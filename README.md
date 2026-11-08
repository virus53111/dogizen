# MURDILIMAX — объявления / sludinājumi / classifieds

https://murdilimax.com/ — trilingual RU/LV/EN classifieds and real estate portal hosted on GitHub Pages with Hatchable PostgreSQL backend.

## Real external offers
Clearly marked **external offers from public SS.lv RSS**; each external card opens the original ad. Data includes title, factual parameters, price, date, city and thumbnail URL provided by the feed. We never copy full original text, contact names or phone numbers, and we do not host or upload others' photos. External sellers are NOT registered users of MURDILIMAX; original availability and price must be checked on SS.lv. Source: https://www.ss.lv/lv/real-estate/flats/riga/centre/rss/ .

Hatchable backend project `murdilimax` has a separate `external_listings` table and scheduler-only route `/api/jobs/sync-external`, running every 6 hours. It ingests 9 public RSS feeds covering Riga real estate, cars, electronics and furniture. Public `/api/external` provides 24-per-page filtered results without hitting upstream on each visitor request. Old links expire automatically. Initial sync (2026-11-08) found 162 ads (69 apartments, 58 cars, 19 electronics, 16 furniture).

## User-generated listings
Actual MURDILIMAX members use email-code login to post their own listings with 6 photos, an optional map pin, and can delete their own ads. Admin moderation is required before publication. They are completely separate from external RSS links. This is a free purpose-built engine; paid PHP ShopClass was NOT deployed.

## Map and rights
Map only places listings with seller-supplied coordinates; external ads have no verified coordinates and must not be shown at invented exact addresses. Leaflet / OpenStreetMap. Images and descriptions remain under their respective creators' rights. Show attribution and remove external records upon valid objection.

Old versions archived in `archive/murdilimax-before-classifieds-20261108`, `archive/classifieds-v1-before-trilingual-redesign-20261108` and `archive/classifieds-before-external-rss-20261108`.
