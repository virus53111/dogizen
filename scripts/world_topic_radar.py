#!/usr/bin/env python3
"""Daily research signals for MURDILIMAX. Does NOT write or publish articles."""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

# Keep both "python scripts/world_topic_radar.py" and package-based unittest imports working.
try:
    from scripts.topic_opportunity_engine import enrich, load_gsc_csv, quick_wins
except ModuleNotFoundError:
    from topic_opportunity_engine import enrich, load_gsc_csv, quick_wins

USER_AGENT = "MURDILIMAX-World-Topic-Radar/1.0 (https://murdilimax.com/about/)"
TRENDS_NAMESPACE = "{https://trends.google.com/trending/rss}"
DEFAULT_GEOS = ("US", "GB", "DE", "FR", "ES", "IN", "BR", "JP", "LV", "CA")
DEFAULT_WIKIS = ("en", "de", "es", "fr", "ru")
MAX_DOWNLOAD = 1_500_000
STOPWORDS = {"the", "and", "for", "what", "why", "how", "with", "your", "from", "about",
             "this", "that", "have", "does", "are", "was", "were", "und", "der", "die",
             "das", "des", "les", "pour", "una", "que", "como", "как", "что", "почему"}
RISK_WORDS = {
    "medical": ("health", "vaccine", "virus", "disease", "hospital", "pregnancy", "medicine", "drug", "cancer", "болез", "вирус"),
    "money": ("stock", "crypto", "bitcoin", "shares", "bank", "interest rate", "tax", "loan", "investment", "акци"),
    "public affairs": ("election", "president", "war", "government", "minister", "conflict", "referendum", "attack", "войн"),
    "emergency": ("earthquake", "tsunami", "wildfire", "flood", "hurricane", "tornado", "death", "shooting"),
}
CATEGORIES = {
    "Science & space": ("nasa", "planet", "moon", "earth", "solar", "astronom", "space", "science", "comet", "meteor", "physics", "science"),
    "Technology & AI": ("ai ", "artificial intelligence", "iphone", "android", "software", "internet", "chip", "computer", "google", "microsoft", "openai", "chatgpt"),
    "Nature & animals": ("animal", "bird", "cat ", "dog ", "whale", "ocean", "climate", "forest", "penguin", "wildlife"),
    "Health & wellbeing": ("health", "hospital", "medical", "disease", "exercise", "nutrition", "sleep", "vaccine"),
    "Money & economy": ("economy", "bank", "price", "inflation", "bitcoin", "crypto", "stock", "rate", "finance"),
    "Sports": ("football", "soccer", "basketball", "tennis", "cricket", "league", "match", "nba", "fifa", "olympic"),
    "Travel & places": ("travel", "tourism", "airport", "flight", "train", "city", "country", "island", "hotel"),
    "Culture & entertainment": ("film", "movie", "actor", "music", "concert", "album", "series", "book", "game"),
}
WIKI_EXCLUDE = ("Main_Page", "Special:", "Wikipedia:", "File:", "Template:", "Portal:",
                "List of ", "Category:", "Cookie ", "Privacy policy")


def clean(value: str, limit: int = 180) -> str:
    value = "".join(ch for ch in str(value) if ch.isprintable())
    return re.sub(r"\s+", " ", value).strip()[:limit]


def norm(value: str) -> str:
    return re.sub(r"[^\w]+", " ", unicodedata.normalize("NFKC", value).casefold()).strip()


def topic_key(value: str) -> str:
    """Conservatively collapse cross-language variants of common country-versus-country matches."""
    folded = "".join(c for c in unicodedata.normalize("NFKD", value.casefold())
                     if not unicodedata.combining(c))
    parts = re.split(r"\s+(?:vs\.?|versus|-)\s+", folded)
    if len(parts) != 2 or not all(2 <= len(part) <= 35 for part in parts):
        return norm(value)
    country_aliases = {"japon": "japan", "japao": "japan", "japan": "japan",
                       "brasil": "brazil", "bresil": "brazil", "brazil": "brazil",
                       "espana": "spain", "espanha": "spain", "spain": "spain",
                       "alemania": "germany", "deutschland": "germany", "germany": "germany",
                       "francia": "france", "franca": "france", "france": "france"}
    pair = [country_aliases.get(norm(part), norm(part)) for part in parts]
    return "match:" + "|".join(sorted(pair))


def safe_url(value: str) -> str:
    parsed = urllib.parse.urlparse(value.strip())
    return value if parsed.scheme == "https" and parsed.netloc and not parsed.username else ""


def parse_trends(xml_text: str, geo: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    output = []
    for entry in root.findall("./channel/item")[:15]:
        title = clean(entry.findtext("title", ""))
        if len(title) < 3:
            continue
        news = []
        for node in entry.findall(TRENDS_NAMESPACE + "news_item")[:3]:
            url = safe_url(node.findtext(TRENDS_NAMESPACE + "news_item_url", ""))
            if url:
                news.append({"title": clean(node.findtext(TRENDS_NAMESPACE + "news_item_title", ""), 160),
                             "url": url})
        output.append({
            "term": title, "signal": "google_trends_search", "region": geo,
            "observed_bucket": clean(entry.findtext(TRENDS_NAMESPACE + "approx_traffic", ""), 35),
            "published": clean(entry.findtext("pubDate", ""), 90),
            "source_url": "https://trends.google.com/trending/rss?geo=" + geo,
            "references": news,
        })
    return output


def parse_wikipedia(payload: dict, lang: str, date: dt.date) -> list[dict]:
    output = []
    items = payload.get("items", [])
    articles = items[0].get("articles", []) if items else []
    for a in articles[:65]:
        title = clean(str(a.get("article", "")).replace("_", " "))
        if len(title) < 4 or any(x.casefold() in title.casefold() for x in WIKI_EXCLUDE):
            continue
        if title.casefold() in ("main page", "search", "death", "wikipedia"):
            continue
        views = a.get("views", 0)
        if not isinstance(views, int) or views < 1:
            continue
        link = "https://" + lang + ".wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))
        output.append({
            "term": title, "signal": "wikipedia_pageviews", "region": lang,
            "views": views, "published": date.isoformat(), "source_url": link, "references": [],
        })
        if len(output) >= 24:
            break
    return output


def classify(term: str) -> str:
    lower = " " + term.casefold() + " "
    if topic_key(term).startswith("match:") or re.search(r"\bvs\.?\b|\bversus\b", lower):
        return "Sports"
    if any(word in lower for word in (" music ", " album ", " actor ", " actress ",
                                      " singer ", " song ", " red-carpet ", " grammy ")):
        return "Culture & entertainment"
    for category, words in CATEGORIES.items():
        if any(word in lower for word in words):
            return category
    return "World & everyday questions"


def risk_flags(term: str) -> list[str]:
    t = term.casefold()
    return [name for name, patterns in RISK_WORDS.items() if any(p in t for p in patterns)]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT, "Accept": "application/json, application/rss+xml, application/xml",
    })
    with urllib.request.urlopen(req, timeout=14) as response:
        data = response.read(MAX_DOWNLOAD + 1)
        if len(data) > MAX_DOWNLOAD:
            raise ValueError("Source response exceeded size limit")
        return data.decode("utf-8", errors="replace")


def read_source(kind: str, code: str, day: dt.date) -> list[dict]:
    if kind == "trends":
        url = "https://trends.google.com/trending/rss?geo=" + urllib.parse.quote(code)
        return parse_trends(fetch(url), code)
    # Wikimedia statistics are delayed; use the previous completed UTC date.
    url = ("https://wikimedia.org/api/rest_v1/metrics/pageviews/top/"
           + code + ".wikipedia.org/all-access/" + day.strftime("%Y/%m/%d"))
    return parse_wikipedia(json.loads(fetch(url)), code, day)


def normalize_topics(rows: list[dict]) -> list[dict]:
    by_key: dict[str, dict] = {}
    for row in rows:
        key = (row["signal"], topic_key(row["term"]))
        if not key[1]:
            continue
        if key not in by_key:
            by_key[key] = {**row, "regions": [], "references": []}
        item = by_key[key]
        if row["region"] not in item["regions"]:
            item["regions"].append(row["region"])
        item["references"].extend(ref for ref in row.get("references", [])
                                  if ref["url"] not in {r["url"] for r in item["references"]})
        if row.get("signal") == "wikipedia_pageviews":
            item["views"] = max(row.get("views", 0), item.get("views", 0))
        if row.get("observed_bucket") and not item.get("observed_bucket"):
            item["observed_bucket"] = row["observed_bucket"]
    result = list(by_key.values())
    for item in result:
        item["category"] = classify(item["term"])
        item["requires_review"] = risk_flags(item["term"])
        item["editorial_angle"] = ("Verify the facts, explain the background and answer reader questions about "
                                   + item["term"] + ".")
        item["is_question"] = bool(re.search(r"\?$|^(why|how|what|when|where|who|почему|как|что)\b",
                                              item["term"].casefold()))
    result.sort(key=lambda x: (x["signal"] != "google_trends_search",
                               -len(x["regions"]),
                               -int(x.get("views", 0)), norm(x["term"])))
    return result


def existing_titles(repo: Path) -> list[str]:
    # Soft duplicate warning, not an automatic editorial verdict.
    titles = []
    pattern = re.compile(r"""(?:title|seoTitle)\s*:\s*(['"])(.{10,145}?)\1""")
    for path in (repo / "lib").rglob("*.js"):
        try:
            source = path.read_text(encoding="utf-8")
        except OSError:
            continue
        titles.extend(norm(match.group(2)) for match in pattern.finditer(source))
    return titles


def possible_duplicate(term: str, known_titles: list[str]) -> bool:
    words = set(norm(term).split()) - STOPWORDS
    if len(words) < 3:
        return False
    return any(len(words & (set(title.split()) - STOPWORDS)) >= 3
               and len(words & (set(title.split()) - STOPWORDS)) / len(words) >= .85
               for title in known_titles)


def shortlist(topics: list[dict], titles: list[str], count: int) -> list[dict]:
    per_category: dict[str, int] = defaultdict(int)
    selected = []
    for item in topics:
        item["possible_existing_article"] = possible_duplicate(item["term"], titles)
    # Choose up to three from each area first, then fill remaining slots with
    # other useful signals; this avoids leaving the daily report half empty.
    for cap in (3, 6):
        for item in topics:
            if item["possible_existing_article"] or item in selected or per_category[item["category"]] >= cap:
                continue
            selected.append(item)
            per_category[item["category"]] += 1
            if len(selected) >= count:
                return selected
    return selected


def escape_md(value: str) -> str:
    return clean(value, 260).replace("|", "\\|").replace("[", "\\[").replace("]", "\\]").replace("<", "&lt;").replace(">", "&gt;")


def render_report(items: list[dict], all_items: list[dict], errors: list[str], timestamp: str,
                  gsc_wins: list[dict] | None = None) -> str:
    lines = ["# 🌍 MURDILIMAX — World Topic Radar", "",
             "Generated: " + timestamp + " UTC", "",
             "**Research leads only. No article was generated or published, and nobody was contacted.**",
             "Google Trends reports trending *search terms*, not identifiable users or confirmed questions. "
             "Wikipedia counts *page views*, not searches. These are different signals and must not be added together.",
             "",
             "## Shortlist — editorial verification required", "",
             "| # | Topic / possible reader interest | Editorial priority* | Signal | Category | Review |",
             "|---|---|---|---|---|---|"]
    for i, item in enumerate(items, 1):
        signal = ("Google Trends: " + ",".join(item["regions"]) + " · " +
                  (item.get("observed_bucket") or "traffic bucket unavailable")
                  if item["signal"] == "google_trends_search"
                  else "Wikipedia " + ",".join(item["regions"]) + " · " +
                  f"{item.get('views', 0):,} views on selected day")
        review = ", ".join(item["requires_review"]) if item["requires_review"] else "Editorial check"
        priority = item.get("opportunity", {}).get("editorial_priority", "—")
        lines.append(f"| {i} | {escape_md(item['term'])} | {priority}/100 | {escape_md(signal)} | "
                     f"{escape_md(item['category'])} | {escape_md(review)} |")
    if not items:
        lines.append("| — | No verified source data available | — | — | — | — |")
    lines.extend(["", "## Briefs and source links", ""])
    for i, item in enumerate(items, 1):
        lines.extend([f"### {i}. {escape_md(item['term'])}",
                      f"- **Suggested research angle (not a verbatim searched question):** {escape_md(item['editorial_angle'])}",
                      f"- **Proposed user question (editorial hypothesis, not a measured search phrase):** {escape_md(item.get('opportunity', {}).get('working_question', item['term']))}",
                      f"- **Article type:** {escape_md(item.get('opportunity', {}).get('type', 'Research explainer'))}",
                      f"- **Candidate languages to research (no translations generated):** {', '.join(item.get('opportunity', {}).get('candidate_languages', ['en']))}",
                      f"- **Editorial priority rationale:** {'; '.join(item.get('opportunity', {}).get('priority_reasons', []))}",
                      f"- **Source signal:** [{escape_md(item['signal'])}]({item['source_url']})",
                      f"- **Regional signals:** {', '.join(item['regions'])}",
                      "- **Research before drafting:** confirm context and date; locate primary sources; "
                      "check existing MURDILIMAX coverage; decide if an enduring useful answer is possible.",
                      "- **Safety gate:** human fact-check and editorial approval for every topic; "
                      "extra specialist review for health, financial, political or emergency issues."])
        for gsc_row in item.get("opportunity", {}).get("gsc_matches", [])[:2]:
            lines.append("- **Own-site GSC query for investigation:** "
                         + f"`{escape_md(gsc_row['query'])}` — {gsc_row['impressions']} impressions, "
                         + f"{gsc_row['clicks']} clicks, average position {gsc_row['position']}. "
                         + "Verify the actual landing page before editing.")
        for ref in item["references"][:2]:
            lines.append("- Related coverage for context (not independently verified): "
                         + f"[{escape_md(ref['title'] or 'Source')}]({ref['url']})")
        lines.append("")
    if gsc_wins:
        lines.extend(["## Optional Search Console quick wins (user-supplied CSV)", "",
                      "Only measured aggregate queries supplied by the site owner. "
                      "These are **not** external keyword search volumes or traffic forecasts.",
                      "",
                      "| Query | Impressions | Clicks | Observed CTR | Avg position |",
                      "|---|---:|---:|---:|---:|"])
        for row in gsc_wins:
            lines.append(f"| {escape_md(row['query'])} | {row['impressions']:,} | "
                         f"{row['clicks']:,} | {row['ctr']:.1%} | {row['position']} |")
        lines.extend(["", "Inspect the actual ranking URL and search intent first; "
                      "do not replace existing content simply because a query appears here.", ""])
    lines.extend(["**Priority score is an explainable editorial triage heuristic, "
                  "not a prediction of clicks, rankings, search volumes or commercial value.**", ""])
    lines.extend(["## Collection notes", "",
                  f"- Candidate signals: {len(all_items)} after source-level de-duplication.",
                  f"- Topics shortlisted: {len(items)}; broad categories and multiple countries are allowed.",
                  "- Existing-article checks are approximate and must be verified by an editor.",
                  "- No copying news text, automatic forum replies, bulk AI articles, or silent publication.",
                  "- Human review is required before turning any lead into a fact-checked article.",
                  ""])
    if errors:
        lines.extend(["### Source errors (partial results may still be useful)", ""])
        lines.extend("- " + escape_md(error) for error in errors)
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--geos", default=",".join(DEFAULT_GEOS))
    parser.add_argument("--wikis", default=",".join(DEFAULT_WIKIS))
    parser.add_argument("--output", default="reports/world-topic-radar")
    parser.add_argument("--count", type=int, default=12)
    parser.add_argument("--repo", default=".")
    parser.add_argument("--gsc-csv", default="", help="Optional site-owner Search Console query export; not committed or required")
    args = parser.parse_args()
    geos = [x for x in args.geos.upper().split(",") if re.fullmatch(r"[A-Z]{2}", x)][:16]
    wikis = [x for x in args.wikis.lower().split(",") if re.fullmatch(r"[a-z]{2,3}", x)][:10]
    if not geos and not wikis:
        parser.error("Configure at least one geography or Wikipedia language.")
    now = dt.datetime.now(dt.timezone.utc)
    day = now.date() - dt.timedelta(days=2)
    jobs = [("trends", geo, day) for geo in geos] + [("wikipedia", lang, day) for lang in wikis]
    rows, errors = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        future_map = {pool.submit(read_source, *job): job for job in jobs}
        for future in concurrent.futures.as_completed(future_map):
            kind, code, _ = future_map[future]
            try:
                rows.extend(future.result())
            except (OSError, ValueError, ET.ParseError, urllib.error.URLError, KeyError, IndexError) as ex:
                errors.append(f"{kind}/{code}: {type(ex).__name__}: {clean(str(ex), 100)}")
    topics = normalize_topics(rows)
    gsc_rows = load_gsc_csv(Path(args.gsc_csv)) if args.gsc_csv else []
    titles = existing_titles(Path(args.repo))
    for item in topics:
        item["possible_existing_article"] = possible_duplicate(item["term"], titles)
    topics = enrich(topics, gsc_rows)
    picks = shortlist(topics, titles, max(1, min(args.count, 30)))
    folder = Path(args.output)
    folder.mkdir(parents=True, exist_ok=True)
    stamp = now.strftime("%Y-%m-%d %H:%M")
    report = render_report(picks, topics, errors, stamp, quick_wins(gsc_rows))
    (folder / "report.md").write_text(report, encoding="utf-8")
    (folder / "topics.json").write_text(json.dumps({
        "generated_at": now.isoformat(), "geographies": geos, "wiki_languages": wikis,
        "sources_ok": len(jobs) - len(errors), "source_errors": errors,
        "candidate_count": len(topics), "gsc_rows_loaded": len(gsc_rows),
        "gsc_quick_wins": quick_wins(gsc_rows), "shortlist": picks,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"World Topic Radar: {len(picks)} leads / {len(topics)} signals / {len(errors)} source errors")
    return 0 if rows else 2


if __name__ == "__main__":
    sys.exit(main())
