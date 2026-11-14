"""Editorial opportunity intelligence for worldwide MURDILIMAX research signals.

Scores are transparent *editorial heuristics*, never predicted traffic, search
volumes, rankings, or independently verified factual claims.
"""
from __future__ import annotations

import csv
import math
import re
import unicodedata
from pathlib import Path

LANGUAGE_REGIONS = {
    "US": "en", "GB": "en", "CA": "en", "IN": "en", "JP": "en",
    "DE": "de", "FR": "fr", "ES": "es", "BR": "pt", "LV": "lv",
    "en": "en", "de": "de", "es": "es", "fr": "fr", "ru": "ru"
}
EXTRA_LANGUAGES = ("en", "ru", "de", "es", "fr", "lv", "pt", "it", "pl", "lt", "et", "nl")
STOPWORDS = {
    "what", "why", "when", "where", "which", "how", "who", "the", "a", "an",
    "for", "and", "with", "your", "you", "are", "were", "was", "does", "do",
    "is", "in", "of", "to", "on", "can", "should", "about", "new", "vs",
    "guide", "today", "latest", "this", "that", "news", "what's", "its",
    "como", "que", "una", "los", "las", "por", "para", "was", "wie", "und",
    "das", "der", "die", "des", "les", "pour", "une", "est", "как", "что",
    "почему", "зачем", "это", "или", "для", "чем", "после",
}
EVENT_HINTS = (" vs ", " - ", " tournament", " match", " finals",
               " election", " resign", " quits", " wins", " scores",
               " today", " live", " lineup", " result", " yesterday")
QUESTION_STARTS = ("why ", "how ", "what ", "when ", "where ", "who ",
                   "can ", "does ", "do ", "is ", "как ", "что ",
                   "почему ", "зачем ", "можно ли ")
EXPLAINER_TEMPLATES = {
    "Science & space": "What is {topic}, how does it work, and what do scientists actually know?",
    "Technology & AI": "What is {topic}, what changed, and what should users check first?",
    "Nature & animals": "What explains {topic}, and what do reliable scientific sources say?",
    "Health & wellbeing": "What is known about {topic}, and which claims need medical verification?",
    "Money & economy": "How does {topic} work, and what numbers or rules need verification?",
    "Sports": "What is the verified context and official schedule or result for {topic}?",
    "Travel & places": "What should travelers know about {topic}, and what information changes?",
    "Culture & entertainment": "What is the background of {topic}, and why is it receiving attention?",
    "World & everyday questions": "What does {topic} mean, and what practical question can be answered?",
}
EDITORIAL_CHECKS = [
    "Check that the proposed angle answers a real question and is not already covered.",
    "Verify dates, names, measurements and factual claims from first-party or authoritative sources.",
    "Explain clearly, add a useful example or original calculation, and avoid padding or copying coverage.",
    "Use genuinely licensed imagery with attribution; generate an original diagram only when useful.",
    "Create only accurate language editions, add internal related links, canonical metadata and social sharing.",
    "Review usefulness, accessibility and mobile rendering; obtain editorial approval before publishing.",
]


def normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKC", str(value)).casefold()
    return re.sub(r"[^\w]+", " ", decomposed).strip()


def tokens(value: str) -> set[str]:
    return {w for w in normalize(value).split() if len(w) >= 3 and w not in STOPWORDS}


def recommended_languages(regions: list[str]) -> list[str]:
    found = []
    for region in regions:
        lang = LANGUAGE_REGIONS.get(region)
        if lang and lang in EXTRA_LANGUAGES and lang not in found:
            found.append(lang)
    return found or ["en"]


def editorial_type(item: dict) -> str:
    t = str(item["term"]).lower()
    if any(hint in t for hint in EVENT_HINTS) or item.get("category") == "Sports":
        return "time-sensitive context"
    if item.get("is_question") or t.startswith(QUESTION_STARTS):
        return "question-led evergreen explainer"
    if item.get("signal") == "wikipedia_pageviews":
        return "background explainer; validate current relevance"
    return "trend-led explainer; investigate evergreen value"


def estimated_priority(item: dict, matched_gsc: list[dict] | None = None) -> tuple[int, list[str]]:
    """An explainable queue priority, *not* expected organic clicks or SEO difficulty."""
    reasons = []
    score = 32
    regions = len(item.get("regions", []))
    if regions > 1:
        score += min(18, 4 * (regions - 1))
        reasons.append(f"interest signal appears in {regions} regions")
    if item.get("signal") == "google_trends_search":
        score += 12
        reasons.append("fresh Google Trends signal")
    else:
        score += 4
        reasons.append("Wikipedia attention signal; not a search query")
    if item.get("is_question") or str(item.get("term", "")).lower().startswith(QUESTION_STARTS):
        score += 15
        reasons.append("explicit question intent")
    if item.get("category") in ("Science & space", "Technology & AI", "Nature & animals"):
        score += 8
        reasons.append("potentially useful explanatory subject")
    if item.get("category") == "World & everyday questions":
        score += 5
        reasons.append("broad everyday interest")
    if editorial_type(item) == "time-sensitive context":
        score -= 15
        reasons.append("time-sensitive topic needs same-day evidence and maintenance")
    if item.get("requires_review"):
        score -= 16
        reasons.append("sensitive subject needs expert verification")
    if matched_gsc:
        # 1st-party actual performance is meaningful, but broad vocabulary alone
        # does not prove a topic matches a specific query.
        bonus = min(18, 6 + int(math.log10(max(1, matched_gsc[0]["impressions"]))) * 3)
        score += bonus
        reasons.append("matching manually provided Search Console query; check search intent")
    if item.get("possible_existing_article"):
        score -= 30
        reasons.append("possible duplicate of current guide; refresh instead")
    return max(0, min(score, 100)), reasons


def find_gsc_matches(term: str, gsc: list[dict]) -> list[dict]:
    words = tokens(term)
    if not words:
        return []
    result = []
    for row in gsc:
        query_words = tokens(row["query"])
        shared = words & query_words
        if (len(shared) >= 2 and len(shared) >= min(2, len(words))
                or normalize(term) == normalize(row["query"])):
            result.append(row)
    return sorted(result, key=lambda x: (-x["impressions"], x["query"]))[:3]


def enrich(topics: list[dict], gsc: list[dict] | None = None) -> list[dict]:
    """Build actionable research briefs without inventing a query, citations or a result."""
    for item in topics:
        matches = find_gsc_matches(item["term"], gsc or [])
        priority, reasons = estimated_priority(item, matches)
        category = item.get("category", "World & everyday questions")
        template = EXPLAINER_TEMPLATES.get(category, EXPLAINER_TEMPLATES["World & everyday questions"])
        question = str(item["term"]).strip() if item.get("is_question") else template.format(topic=item["term"])
        item["opportunity"] = {
            "editorial_priority": priority,
            "priority_meaning": "Editorial triage heuristic from signals, not an estimate of traffic or rankings",
            "priority_reasons": reasons,
            "type": editorial_type(item),
            "working_question": question,
            "candidate_languages": recommended_languages(item.get("regions", [])),
            "gsc_matches": matches,
            "fact_check_plan": EDITORIAL_CHECKS + (
                ["Specialist review and prominent uncertainty disclosures before any publication."]
                if item.get("requires_review") else []),
            "publish_automatically": False,
        }
    topics.sort(key=lambda x: (-x["opportunity"]["editorial_priority"],
                               -len(x.get("regions", [])),
                               x["term"].casefold()))
    return topics


def _number(value: str) -> float | None:
    raw = str(value or "").strip().replace("\u00a0", "")
    raw = raw.replace(" ", "").replace(",", "")
    try:
        result = float(raw)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError):
        return None


def load_gsc_csv(path: Path) -> list[dict]:
    """Optional *user-owned* GSC search queries CSV, never needed for the daily job.

    Supports English GSC exports. Output contains only aggregate query counts.
    No personal accounts, identifiers or searcher information are collected.
    """
    results = []
    if not path.exists():
        raise FileNotFoundError(f"Optional Search Console CSV not found: {path}")
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not reader.fieldnames:
            raise ValueError("Search Console CSV has no header")
        for raw in reader:
            cols = {normalize(k).replace(" ", ""): str(v).strip()
                    for k, v in raw.items() if k is not None and v is not None}
            query = cols.get("topqueries") or cols.get("query") or cols.get("queries") or ""
            imp = _number(cols.get("impressions", ""))
            clicks = _number(cols.get("clicks", ""))
            pos = _number(cols.get("position", ""))
            if not query or imp is None or clicks is None or pos is None:
                continue
            if 50 <= imp <= 10**12 and 0 <= clicks <= imp and 3 <= pos <= 20:
                results.append({
                    "query": query[:180], "impressions": int(imp), "clicks": int(clicks),
                    "position": round(pos, 2),
                    "ctr": round(clicks / imp, 4) if imp else 0,
                    "next_step": "Review the existing ranking page and search intent before changing title or content",
                })
    return sorted(results, key=lambda x: (-x["impressions"], x["position"]))[:200]


def quick_wins(gsc: list[dict], limit: int = 10) -> list[dict]:
    """Measured impressions, never a forecast; 3–20 average position is an inspection range."""
    return sorted(gsc, key=lambda x: (-x["impressions"] * (1-x["ctr"]),
                                       x["position"]))[:limit]
