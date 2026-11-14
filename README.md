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

The scheduled [World Topic Radar](.github/workflows/world-topic-radar.yml) runs twice
per day at 07:17 and 19:17 UTC (or manually through GitHub Actions). It checks public
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

Run offline tests: `python -m unittest discover -s tests -p 'test_*.py' -v`.
Run a live research pass: `python scripts/world_topic_radar.py --output reports/world-topic-radar`.
Network/source errors are listed in the report; if every source is unavailable,
the command fails rather than presenting fabricated results.

## Traffic intelligence and syndication (no bulk auto-publishing)

The additional `scripts/topic_opportunity_engine.py` enriches the international
research report with a **transparent editorial priority score** (0–100),
question/answer angle, tentative language targets, fact-check checklists, and
time-sensitive or sensitive-topic warnings. The priority is a heuristic for
human research triage, **not** a predicted click count, conversion rate,
keyword volume, or Google ranking forecast. No article is authored or
published by this workflow, and no user is contacted.

For a more grounded opportunity list, an editor may optionally import a
**site-owned aggregate Google Search Console query CSV** using:
`python scripts/world_topic_radar.py --gsc-csv /path/to/Queries.csv`.
Expected English columns are `Top queries` (or `Query`), `Clicks`,
`Impressions`, `CTR`, and `Position`. Queries with at least 50 impressions
and an observed average position from 3 to 20 appear in a separate
*inspect-first* quick-wins table. This file should be kept off the public
repository; none is bundled or required. The scheduled workflow makes no
Search Console requests unless a CSV is explicitly supplied. The GSC data
is aggregate and never identifies individual searchers.

**Article RSS subscriptions**: the build generates `/feed.xml` (English)
and `/ru/feed.xml` (Russian) from the 30 most recently published, actually
localized guides. Feed links are discoverable in page metadata and the
footer, for RSS readers and permitted aggregators. They are tested against
the generated canonical guide pages. An RSS feed is a distribution channel,
not a guarantee of indexing or higher Google rankings.

The next editorial step remains **research → original draft → source
verification → manual review → PR and CI → publication**, rather than
mass-generating low-value pages based on noisy trends.


## International Editorial Draft Studio (review-only)

The World Topic Radar workflow now runs scripts/editorial_draft_studio.py
after each successful collection. It selects at most two editorial
opportunities, prepares a separate Markdown research brief for each, and
places the files in the existing GitHub Actions artifact named
murdilimax-world-topic-radar. The existing World Topic Radar GitHub issue
gets a short review queue plus a workflow-run link to retrieve the artifacts.

**Optional AI-assisted article draft:** In repository Settings > Secrets and
variables > Actions, create a repository secret OPENAI_API_KEY from your own
separately billed OpenAI API account. Optionally set Actions variable
DRAFT_MODEL (default gpt-4.1-mini). ChatGPT subscriptions do not include API
credits; no credential is needed for radar research briefs. The credential
is never stored in or printed into public report files.

With an API key, the studio can request **at most one AI-assisted draft per
run** and only for a lower-risk evergreen question with at least two
research-source links. Sources are leads, NOT verified citations. AI must not
claim it has read them and is instructed to mark uncertain statements
[VERIFY: ...]. Malformed model outputs are rejected. The request uses the
OpenAI Responses API with JSON output and max 2,600 output tokens. With the
current twice-daily schedule this permits up to two paid calls per day.
Review API billing/usage and set spending limits before enabling.

Generated Markdown files under reports/world-topic-radar/drafts/ are NOT
imported into atlas-data, the sitemap or GitHub Pages and cannot auto-post
to any external forum. No new published article is created, and no PR
containing editorial content is automatically approved. Every draft
requires independent source verification, image-license checks, editorial
review, accurate localized versions and CI verification before publication.

Manual research-only run:
  python scripts/editorial_draft_studio.py

Offline regression tests:
  python -m unittest discover -s tests -p 'test_*.py' -v
