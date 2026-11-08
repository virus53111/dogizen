# MURDILIMAX — Classifieds
The previous MURDIWORLD / MURDILIMAX Recovery website was replaced with a new classified-ads and real-estate website for the existing custom domain `murdilimax.com`. All prior files are preserved only in Git branch `archive/murdilimax-before-classifieds-20261108`.

This public frontend is hosted on GitHub Pages (free) and talks to the managed Hatchable application (Postgres, email-code auth, photo uploads and moderator approval).

## Critical launch gate (no payment)
The Hatchable project `murdilimax` is currently PERSONAL/PRIVATE. In https://hatchable.com/console/projects/murdilimax navigate Settings -> Visibility -> Public. Only the owner can do this, and until they do, API endpoints serve a platform sign-in wall to strangers. The frontend on GitHub Pages can load, but listing search and ad submission won't work for public visitors. **Do not claim that the backend is publicly operational until visibility is changed and verified.**

This is a purpose-built classified ads app, **not** the PHP/MySQL ShopClass engine. ShopClass required paid PHP/MySQL infrastructure which the user declined. Source of backend is held in connected Hatchable project.

End-user listings require moderation. Payment and monetisation are disabled. No advertising content is pre-seeded, no fake listings. Do not give user personal admin credentials or embed API tokens in static files. The site stays on the existing GitHub Pages domain configuration and does not alter domain DNS.
