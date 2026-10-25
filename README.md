# Murdilimax Forms

Official website: https://murdilimax.com

This repository serves the public, static landing page for **Murdilimax Forms**, an independent online form builder.

- **Marketing website:** GitHub Pages from `main` (root folder) with domain `murdilimax.com` in `CNAME`
- **Application:** https://murdilimax-forms.hatchable.site
- **Application dashboard:** https://hatchable.com/console/projects/murdilimax-forms

## Application features (early access)

Passwordless accounts, editable forms with nine field types, publishable form links, answer collection, owner-scoped responses and CSV export.

## Important: public access

The application is hosted separately from the landing page. It must be set to **Public** in the Hatchable project Settings for visitors to access login and published forms. The marketing site being publicly accessible does not automatically make the application public.

## Rollback

The original cinema site was preserved before replacement on the branch `backup/cinema-before-forms-2026-10-25` at commit `a1d8ba83421d981310fe96f13c6492b4646308dc`.

To restore the cinema, revert commit `b3581edb62ee09366014de4384ca132f5fbb0ae8` or restore the previous `index.html` from that backup branch. Do not remove `CNAME` when restoring the website.

The old site is intentionally retained in backup history and has not been permanently deleted.
