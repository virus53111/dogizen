# MURDILIMAX Recovery

Official website: https://murdilimax.com/

Free experimental Windows file-recovery application, version 0.10.3. Website copied from the deployed Recovery landing page at cenaradar.online on 2026-11-07. Russian/English UI and animated crystal artwork are preserved.

## Source and publishing

- `index.html`: self-contained bilingual website.
- `desktop/`: complete Recovery application source and tests, copied byte-for-byte from `price-aggregator-mvp/price-aggregator/desktop`.
- `.github/workflows/pages.yml`: validates and publishes an explicit website-only artifact to GitHub Pages. Desktop source is not copied to the website.
- Windows build workflow is manual and produces tested artifacts; it does not overwrite the existing v0.10.3 release.
- Existing installer remains at https://github.com/virus53111/dogizen/releases/tag/v0.10.3.

## Migration and rollback

The browser site, desktop/browser code and browser build workflows were removed from the active main branch. Previous main is retained at `backup/murdilimax-browser-before-recovery-20261107` (dd0fb0da91b8d72bb5bad2fe92ec9e1b4e295a24). The source branch `price-aggregator-mvp` is unchanged.

Run `node tools/check_site.mjs` before publishing. Do not promise recovery from physically failing disks or real-world RAID without field validation.
