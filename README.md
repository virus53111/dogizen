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



## Editorial Draft Studio — free, no API key, no billing

The MURDILIMAX World Topic Radar workflow runs twice a day and generates
two research briefs, free of charge and with no signup. It also tries
**at most one anonymous AI draft per run** with the public, rate-limited
OVHcloud AI Endpoints model Meta-Llama-3_3-70B-Instruct. The URL is
https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions.
OVHcloud documents anonymous access at 2 requests/minute per IP/model.
The script sends **no Authorization header**, contains no API credential,
and cannot switch to a paid model or provider.
One anonymous request is attempted; on a network timeout the job can retry
once after 35 seconds (maximum two requests per scan). It does not retry
provider 403/429 restrictions or ever route to a paid provider. Free anonymous availability
is third-party-dependent and may change; 403/429/outages or bad model
responses fall back to source-checking briefs without interrupting the radar.

The free service never provides researched citations on its own: it receives
unverified trend terms and links, not independently vetted sources. AI
outputs are clearly labelled **unverified**, list claims needing human
fact-checking, and are kept only in the workflow artifact alongside research
briefs. We do **not** automatically publish any AI content, add articles to
the sitemap, post comments on forums or contact individual searchers.

The workflow requires only GitHub Actions and Python's standard library.
No OpenAI API key, separate AI subscription, trial credits or payment
card are required. GitHub Actions itself remains subject to the repository
plan's compute limits, and third-party anonymous access can be restricted;
these are operational limits, not a hidden paid upgrade.

Run a free research-and-draft attempt manually after running the radar:

    python scripts/editorial_draft_studio.py --ai --max-ai 1

To run **strictly offline** without querying a model, omit the --ai flag.
Offline regression tests:

    python -m unittest discover -s tests -p 'test_*.py' -v

Review the results under reports/world-topic-radar/drafts and the
existing World Topic Radar GitHub issue. Human editorial review remains
mandatory before publication.
