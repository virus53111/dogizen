# MURDILIMAX — The Answer Atlas

The multilingual independent knowledge project at [murdilimax.com](https://murdilimax.com), deployed by GitHub Actions to GitHub Pages.

## Publishing model
- 12 interface languages with **explicit** article-translation coverage. A guide is published only when it has a real localized version.
- Original, curated guide topics, visual species reference pages and a growing set of practical calculators and tools.
- Static HTML, per-language canonical URLs, reciprocal hreflang, robots.txt and a generated sitemap.xml.
- The previous classifieds product is no longer part of the live project. Historical code remains only in a separate backup branch.
- Editorial, about and privacy pages are available in English and Russian; other languages link to the English policies until translations are written.
- Google Analytics 4 is integrated behind an opt-in consent flow; there is currently no advertising integration. External images and fonts may load from third-party providers.

## Build and verification
Node 22: `npm run build`. The workflow runs article-coverage, species media, SEO and editorial checks, and auto-publishes only when the `main` build succeeds.

## Editing principles
Expand one content cluster at a time, cite primary sources where possible, publish only complete translations, and do not fabricate author expertise or modification dates. If a page has a factual mistake, open a public issue without posting sensitive data.

## World Topic Radar (research-only automation)

The scheduled [World Topic Radar](.github/workflows/world-topic-radar.yml) runs once
per day at 07:17 UTC (or manually through GitHub Actions). It checks public
Google Trends RSS feeds for ten countries and Wikimedia's public top-pageview
signals for five Wikipedia languages. The signals cover **all subjects**:
science, technology, nature, health, culture, travel, sport, finance, world
affairs and everyday life. Categories are approximate, not restrictions.

The Python script `scripts/world_topic_radar.py` uses only the standard library;
no API keys are needed for public feeds. It deduplicates topic leads, scans
existing editorial titles for possible overlap, flags sensitive subjects and
writes both a Markdown research brief and structured JSON. The workflow uploads
these reports as a 30-day GitHub Actions artifact. It also attempts to create or
update **one** open GitHub issue, titled `MURDILIMAX World Topic Radar`, with the
latest shortlist. If the issues feature is disabled, the artifact remains.

This is **not** an automatic publishing or social-media messaging bot: it
does not create articles, publish to the website, scrape individual users, or
post on third-party forums. Trending search terms are not actual user questions;
Wikipedia page views are a separate signal. Each lead needs source research,
original analysis, factual checks, license validation and editorial approval
before publication. Higher-risk health, finance, politics and emergency topics
require additional care. The system does not claim search-volume forecasts.

Run offline tests: `python -m unittest discover -s tests -p 'test_world_topic_radar.py' -v`.
Run a live research pass: `python scripts/world_topic_radar.py --output reports/world-topic-radar`.
Network/source errors are listed in the report; if every source is unavailable,
the command fails rather than presenting fabricated results.
