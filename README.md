# MURDILIMAX — объявления / sludinājumi / classifieds

Website: https://murdilimax.com/

Modern free classified ads board in Russian, Latvian and English. Responsive design, search and filtering by city/category/price, six photos per listing, custom approximate map pin, OpenStreetMap listing map, email-code registration, user listings and owner deletion, manual admin moderation.

The original PHP/MySQL ShopClass was not deployed: it needs paid PHP and MariaDB hosting. User requested no payment. This is a purpose-built alternative: GitHub Pages static frontend plus hosted Hatchable Postgres backend.

IMPORTANT: the Hatchable project murdilimax currently has visibility Personal. Anonymous visitors cannot access API/search/posting/sign-in until the OWNER opens https://hatchable.com/console/projects/murdilimax and selects Settings -> Visibility -> Public. This security setting cannot be toggled by the connector. Do not claim anonymous posting works before the owner changes it.

Server routes: GET /api/listings, /api/listing/:id, /api/map; POST /api/create, /api/upload, /api/delete for signed-in users; GET /api/mine; GET/POST /api/admin for moderators. Public API GET endpoints allow CORS only from murdilimax.com and www.murdilimax.com.

Photos are in private object storage; browse via expiring signed URLs. Up to 6 files x 4 MB. Coordinates are optional; encourage approximate pins, not exact private home locations. Paid listings and subscription processing remain disabled.

Original archived site: archive/murdilimax-before-classifieds-20261108. First classifieds version: archive/classifieds-v1-before-trilingual-redesign-20261108.

Launch hardening still needed before broad public traffic: captcha/rate limiting, GDPR pages, site contact for report abuse, transactional email verification in live environment, backups and restores, security review. Listing content stays in the language entered by seller.

Map: Leaflet 1.9.4 / OpenStreetMap. https://leafletjs.com/ and https://www.openstreetmap.org/copyright. Only visible interactive tiles are loaded on demand, with attribution.