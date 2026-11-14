# MURDILIMAX — The Answer Atlas

The multilingual independent knowledge project at [murdilimax.com](https://murdilimax.com), deployed by GitHub Actions to GitHub Pages.

## Publishing model
- 12 interface languages with **explicit** article-translation coverage. A guide is published only when it has a real localized version.
- 60 unique guide topics, visual species reference pages and three interactive tools.
- Static HTML, per-language canonical URLs, reciprocal hreflang, robots.txt and a generated sitemap.xml.
- The previous classifieds product is no longer part of the live project. Historical code remains only in a separate backup branch.
- Editorial, about and privacy pages are available in English and Russian; other languages link to the English policies until translations are written.
- Google Analytics 4 is integrated behind an opt-in consent flow; there is currently no advertising integration. External images and fonts may load from third-party providers.

## Build and verification
Node 22: `npm run build`. The workflow runs article-coverage, species media, SEO and editorial checks, and auto-publishes only when the `main` build succeeds.

## Editing principles
Expand one content cluster at a time, cite primary sources where possible, publish only complete translations, and do not fabricate author expertise or modification dates. If a page has a factual mistake, open a public issue without posting sensitive data.
