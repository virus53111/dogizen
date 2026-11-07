# MURDILIMAX Recovery

Official website: https://murdilimax.com/

Free experimental Windows file-recovery application, version 0.10.7. Website copied from the deployed Recovery landing page at cenaradar.online on 2026-11-07. Russian/English UI and animated crystal artwork are preserved.

## Source and publishing

- `index.html`: self-contained bilingual website.
- `desktop/`: complete Recovery application source and tests, copied byte-for-byte from `price-aggregator-mvp/price-aggregator/desktop`.
- `.github/workflows/pages.yml`: validates and publishes an explicit website-only artifact to GitHub Pages. Desktop source is not copied to the website.
- Windows builds run on desktop source changes and publish a new, versioned release only after the full Windows regression suite, real-volume read-only access, packaged EXE and installer checks pass. Older releases are preserved.
- Existing installer remains at https://github.com/virus53111/dogizen/releases/tag/v0.10.7.

## Migration and rollback

The browser site, desktop/browser code and browser build workflows were removed from the active main branch. Previous main is retained at `backup/murdilimax-browser-before-recovery-20261107` (dd0fb0da91b8d72bb5bad2fe92ec9e1b4e295a24). The Recovery application source in `price-aggregator-mvp` is preserved; its website build now redirects the former cenaradar.online address to murdilimax.com.

Run `node tools/check_site.mjs` before publishing. Do not promise recovery from physically failing disks or real-world RAID without field validation.


### Advanced recovery engine in 0.10.7

The Windows installer includes a separately attributed **Halim Recovery 0.5.1** application, built from pinned public source [htoklu/halim-recovery](https://github.com/htoklu/halim-recovery) under the MIT license. Use the visible **Advanced recovery (Halim Recovery · MIT)** control in the MURDILIMAX GUI. The advanced tool provides alternative NTFS/FAT32/exFAT quick and deep recovery when the experimental built-in scanner returns few candidates. The original application's branding and license remain intact; consult `desktop/THIRD_PARTY_NOTICES.md`. Recovery on real, used or trimmed SSD media is not guaranteed.
