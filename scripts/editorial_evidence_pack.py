#!/usr/bin/env python3
"""Free editor-only HTML article previews with provenance and licensed-image checks.

Reads the World Topic Radar shortlist. No content from this script enters dist/,
GitHub Pages, the sitemap or any external discussion. Wikipedia is one
secondary research lead, NOT automatic corroboration of factual claims.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
from html.parser import HTMLParser
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    from scripts.editorial_draft_studio import select_topics, topic_slug, safe_text, source_links
except ModuleNotFoundError:
    from editorial_draft_studio import select_topics, topic_slug, safe_text, source_links

API_WIKI = "https://en.wikipedia.org/w/api.php"
API_COMMONS = "https://commons.wikimedia.org/w/api.php"
MAX_JSON = 600_000
ALLOWED_LICENSE = re.compile(r"^(?:CC BY(?:-SA)? (?:[234]\.0)|CC0(?: 1\.0)?|Public domain|PD-.+)$", re.I)
MAX_SOURCE_EXCERPT = 580


class _PlainText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, text):
        self.parts.append(text)


def plain(value: object, cap: int = 250) -> str:
    parser = _PlainText()
    parser.feed(str(value or ""))
    return re.sub(r"\s+", " ", html.unescape("".join(parser.parts))).strip()[:cap]


def url_allowed(url: str, host: str | None = None) -> bool:
    try:
        parsed = urllib.parse.urlsplit(str(url or ""))
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            return False
        if parsed.port not in (None, 443):
            return False
        if host and parsed.hostname.lower() != host:
            return False
        return len(url) <= 1400
    except (ValueError, AttributeError):
        return False


def api_get(base: str, params: dict, timeout: int = 12) -> dict:
    """Fixed Wikimedia hosts only; urllib redirects still stay Wikimedia."""
    if base not in (API_WIKI, API_COMMONS):
        raise ValueError("Only the two fixed Wikimedia API endpoints are allowed")
    url = base + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={
        "User-Agent": "MURDILIMAX-Editorial-Research/1.0 (https://murdilimax.com/)",
        "Accept": "application/json"
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        # The caller does not use, render or trust arbitrary HTML responses.
        resolved = response.geturl()
        if not url_allowed(resolved) or urllib.parse.urlsplit(resolved).hostname not in (
                "en.wikipedia.org", "commons.wikimedia.org"):
            raise ValueError("Unexpected Wikimedia API redirect")
        data = response.read(MAX_JSON + 1)
        if len(data) > MAX_JSON:
            raise ValueError("Source response exceeds size bound")
        return json.loads(data.decode("utf-8"))


def relevant_title(term: str, title: str) -> bool:
    def words(text):
        return {x for x in re.findall(r"[a-zA-Z0-9]{3,}", text.casefold())
                if x not in {"what", "when", "where", "which", "does", "will", "about",
                             "come", "from", "with", "the", "and", "for", "why", "how",
                             "have", "this", "that", "they", "who", "you"}}
    target, match = words(term), words(title)
    if not target or not match:
        return False
    common = target & match
    return len(common) >= (1 if len(target) == 1 else 2) and len(common) >= len(target) * .5


def wikipedia_lead(term: str) -> dict | None:
    """Fetch source text and date for a *potential* article match, not verified truth."""
    data = api_get(API_WIKI, {
        "action": "query", "generator": "search",
        "gsrsearch": safe_text(term, 90), "gsrlimit": "3", "gsrnamespace": "0",
        "prop": "extracts|info", "exintro": "1", "explaintext": "1",
        "exchars": "850", "inprop": "url", "format": "json",
        "formatversion": "2", "redirects": "1",
    })
    pages = (data.get("query") or {}).get("pages") or []
    for page in sorted(pages, key=lambda p: p.get("index", 99)):
        title = plain(page.get("title"), 170)
        excerpt = plain(page.get("extract"), MAX_SOURCE_EXCERPT)
        url = str(page.get("fullurl") or "")
        if relevant_title(term, title) and len(excerpt) > 60 and url_allowed(url, "en.wikipedia.org"):
            return {
                "title": title, "url": url, "excerpt_for_research_only": excerpt,
                "source_type": "Wikipedia community-edited secondary reference",
                "retrieved": dt.datetime.now(dt.timezone.utc).isoformat(),
                "claims_independently_verified": False,
                "text_license": "CC BY-SA, attribution and share-alike requirements apply if reused",
            }
    return None


def commons_candidate(term: str) -> dict | None:
    """Only allow directly checked Commons files with explicit permissive licenses."""
    result = api_get(API_COMMONS, {
        "action": "query", "generator": "search", "gsrsearch": safe_text(term, 80),
        "gsrnamespace": "6", "gsrlimit": "5", "prop": "imageinfo",
        "iiprop": "url|extmetadata", "iiurlwidth": "1100",
        "format": "json", "formatversion": "2",
    })
    pages = (result.get("query") or {}).get("pages") or []
    for page in sorted(pages, key=lambda p: p.get("index", 99)):
        title = str(page.get("title") or "")
        if not title.startswith("File:") or not relevant_title(term, title):
            continue
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        def m(key):
            return meta.get(key, {}).get("value", "")
        license_name = plain(m("LicenseShortName"), 70)
        if not ALLOWED_LICENSE.fullmatch(license_name):
            continue
        license_url = str(m("LicenseUrl") or "")
        if not url_allowed(license_url):
            if license_name.casefold().startswith("cc by"):
                # Cannot give auditable license terms -> omit image.
                continue
            license_url = "https://creativecommons.org/publicdomain/mark/1.0/"
        author = plain(m("Artist"), 180) or plain(m("Credit"), 180)
        if not author:
            continue
        img = info.get("thumburl") or info.get("url") or ""
        original = info.get("descriptionurl") or ""
        if (not url_allowed(img, "upload.wikimedia.org")
                or not url_allowed(original, "commons.wikimedia.org")):
            continue
        return {
            "title": plain(title.removeprefix("File:"), 160),
            "thumbnail_url": img, "file_page": original,
            "author": author, "license": license_name, "license_url": license_url,
            "source": "Wikimedia Commons (license metadata retrieved automatically)",
            "license_metadata_checked": True, "subject_match_requires_editor": True,
        }
    return None


def gather_evidence(topic: dict, online: bool = True) -> dict:
    result = {
        "term": safe_text(topic.get("term")),
        "collected_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "external_research_leads": source_links(topic),
        "wikipedia": None, "licensed_image": None,
        "source_access_errors": [], "all_article_claims_verified": False,
        "editorial_approval": "required", "ready_to_publish": False
    }
    if online:
        for field, fn in (("wikipedia", wikipedia_lead), ("licensed_image", commons_candidate)):
            try:
                result[field] = fn(result["term"])
            except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError,
                    TypeError, json.JSONDecodeError) as ex:
                result["source_access_errors"].append(field + ": " + type(ex).__name__)
    else:
        result["source_access_errors"].append("offline mode: external sources not checked")
    return result


def original_svg(category: str) -> str:
    """Deterministic original vector diagram, not purported documentary evidence."""
    category = (category or "").lower()
    if "nature" in category or "animal" in category:
        motif = '<path d="M330 70 Q175 110 195 255 Q320 270 330 70Z" fill="#95c8a0" stroke="#224e46" stroke-width="8"/><path d="M220 233 Q296 203 330 70" stroke="#224e46" stroke-width="8" fill="none"/>'
    elif "science" in category:
        motif = '<circle cx="258" cy="155" r="75" fill="#92c5cd" stroke="#224e46" stroke-width="9"/><ellipse cx="258" cy="155" rx="165" ry="47" fill="none" stroke="#224e46" stroke-width="8" transform="rotate(-25 258 155)"/><circle cx="116" cy="194" r="17" fill="#edc16a"/>'
    elif "technology" in category:
        motif = '<rect x="118" y="88" width="276" height="155" rx="14" fill="#d8e7da" stroke="#224e46" stroke-width="10"/><path d="M102 262h310l-26 23H130Z" fill="#7db09c" stroke="#224e46" stroke-width="7"/><path d="M160 126h176M160 153h127M160 180h152" stroke="#6c9c8f" stroke-width="12" stroke-linecap="round"/>'
    else:
        motif = '<circle cx="255" cy="155" r="108" fill="#c1ddca" stroke="#224e46" stroke-width="9"/><path d="M149 155h215M255 48c-80 75-80 140 0 216M255 48c80 75 80 140 0 216" fill="none" stroke="#6b9c8b" stroke-width="6"/>'
    return ('<svg viewBox="0 0 510 305" role="img" aria-label="Original conceptual illustration; not factual evidence"'
            ' xmlns="http://www.w3.org/2000/svg">'
            '<rect width="510" height="305" rx="24" fill="#edf3e8"/>'
            '<circle cx="400" cy="55" r="110" fill="#f7dba7" opacity=".65"/>'
            + motif + '<circle cx="423" cy="238" r="17" fill="#edc16a"/></svg>')


def _p(text: object) -> str:
    return html.escape(safe_text(text, 2200), quote=True)


def markdown_body(raw: str) -> str:
    """Intentionally tiny text-only Markdown subset; never inject untrusted HTML."""
    parts = []
    for line in raw[:20_000].splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("# "):
            parts.append("<h2>" + _p(line[2:]) + "</h2>")
        elif line.startswith("## "):
            parts.append("<h3>" + _p(line[3:]) + "</h3>")
        elif line.startswith("- "):
            parts.append("<p class='item'>• " + _p(line[2:]) + "</p>")
        else:
            parts.append("<p>" + _p(line) + "</p>")
    return "\n".join(parts)


def build_preview(topic: dict, evidence: dict, draft: str | None) -> str:
    term = safe_text(topic.get("term"), 130)
    question = safe_text(topic.get("opportunity", {}).get("working_question") or term, 210)
    image = evidence.get("licensed_image")
    if image:
        illustration = ('<figure><img src="' + html.escape(image["thumbnail_url"], quote=True)
                        + '" alt="' + _p(image["title"])
                        + '" loading="lazy"><figcaption>Wikimedia Commons: <a href="'
                        + html.escape(image["file_page"], quote=True) + '">' + _p(image["title"])
                        + '</a> · ' + _p(image["author"]) + ' · <a href="'
                        + html.escape(image["license_url"], quote=True) + '">' + _p(image["license"])
                        + '</a>. Subject suitability must be checked by an editor.</figcaption></figure>')
    else:
        illustration = ('<figure>' + original_svg(topic.get("category", "")) +
                        '<figcaption>Original conceptual SVG illustration — not documentary evidence.</figcaption></figure>')
    wiki = evidence.get("wikipedia")
    evidence_html = ('<div class="source-card"><strong>Community-edited contextual source (not independent verification)</strong>'
                     '<p>' + _p(wiki["excerpt_for_research_only"]) + '</p>'
                     '<a href="' + html.escape(wiki["url"], quote=True) + '">Read full Wikipedia page</a>'
                     '<small>Excerpt for research only; do not republish verbatim.</small></div>') if wiki else (
                     '<p>Wikipedia matching excerpt not retrieved; research sources remain unverified.</p>')
    sources = []
    for source in evidence.get("external_research_leads", [])[:6]:
        if not isinstance(source, dict):
            continue
        url = source.get("url", "")
        if url_allowed(url):
            sources.append('<li><a rel="noopener noreferrer" target="_blank" href="'
                           + html.escape(url, quote=True) + '">' + _p(source.get("title") or "Source lead")
                           + '</a> <em>— not independently checked</em></li>')
    if wiki:
        sources.append('<li><a href="' + html.escape(wiki["url"], quote=True)
                       + '">Wikipedia context source</a> <em>— retrieved, not independently corroborated</em></li>')
    content = (markdown_body(draft) if draft else
               '<h2>Research outline — not an AI-generated article</h2>'
               '<p>What is the exact reader question, and what can reliable independent sources confirm?</p>'
               '<h3>Important background</h3><p>EDITOR: add accurate, original explanations supported by the sources.</p>'
               '<h3>What readers should do next</h3><p>EDITOR: add a useful example, safe steps, or an illustration.</p>'
               '<h3>Uncertainties and limitations</h3><p>EDITOR: verify every assertion and check the publication date.</p>')
    heading = ("Unverified AI-assisted article draft" if draft else "Source research preview — no article drafted")
    css = """body{margin:0;background:#e8eee7;color:#203f37;font:16px/1.75 system-ui,Arial,sans-serif}
    .shell{width:min(980px,calc(100% - 36px));margin:auto}.hero{background:#224f42;color:#f5efe0;padding:42px 0 36px}
    .kicker{text-transform:uppercase;font-weight:800;letter-spacing:.13em;font-size:.73rem;color:#b8dabc}
    h1{font-size:clamp(2.2rem,6vw,4rem);line-height:1.1;letter-spacing:-.045em;margin:13px 0 18px}
    .hero p{max-width:770px;color:#dbe9dd}.label{background:#fff3bd;color:#624606;padding:10px 15px;border-radius:10px;font-weight:800}
    main{padding:30px 0 90px}.layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(240px,.65fr);gap:24px}
    article,aside{background:#fffdfa;border:1px solid #d1dfd2;border-radius:20px;padding:clamp(18px,3vw,30px)}
    article h2{font-size:1.65rem;line-height:1.24;margin-top:26px}article h3{font-size:1.22rem}
    p{overflow-wrap:anywhere}a{color:#236e51;overflow-wrap:anywhere}figure{margin:0 0 24px}
    img,svg{display:block;width:100%;height:auto;max-height:330px;object-fit:cover;border-radius:13px}
    figcaption,small{display:block;font-size:.78rem;line-height:1.5;color:#5a7367;margin-top:10px}
    .source-card{padding:14px;border:1px solid #d6e5d9;background:#f4f8f3;border-radius:13px;margin:15px 0}
    li{margin:9px 0}em{color:#7f6050}aside h2{margin-top:5px}@media(max-width:800px){.layout{grid-template-columns:1fr}}
    """
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>' + _p(term) + ' — Editorial Preview (NOT PUBLISHED)</title><style>' + css + '</style></head><body>'
            '<header class="hero"><div class="shell"><div class="kicker">MURDILIMAX · GLOBAL EDITORIAL STUDIO</div>'
            '<h1>' + _p(question) + '</h1><p>' + _p(heading)
            + '</p><span class="label">UNVERIFIED · REVIEW REQUIRED · NOT ON THE WEBSITE</span></div></header>'
            '<main class="shell"><div class="layout"><article>' + illustration + content
            + '</article><aside><h2>Source audit</h2><p>Automatically verified: source API response and optional media licensing '
            'metadata. Article claims have NOT been fact checked or independently corroborated.</p>'
            + evidence_html + '<h3>Research leads</h3><ul>' + "".join(sources) + '</ul>'
            '<h3>Publication checklist</h3><ul><li>Verify claims with primary sources.</li>'
            '<li>Rewrite and independently fact-check the article.</li>'
            '<li>Confirm image subject, licence and attribution.</li>'
            '<li>Check for duplicates, translations and internal links.</li>'
            '<li>Approve manually in GitHub and pass CI.</li></ul></aside></div></main></body></html>')


def gallery_page(previews: list[dict]) -> str:
    """One offline index page for navigating the GitHub Actions artifact."""
    cards = []
    for p in previews:
        title = html.escape(safe_text(p["topic"], 160))
        href = html.escape(p["preview"], quote=True)
        status = "Unverified AI draft" if p["ai_draft_exists"] else "Source research outline"
        image_text = "Commons license verified" if p["licensed_commons_image"] else "Original SVG"
        cards.append('<a class="card" href="' + href + '"><div class="kind">OPEN EDITORIAL PREVIEW ↗</div>'
                     '<h2>' + title + '</h2><p>' + status + '</p><div class="meta">'
                     + image_text + ' · Approval required</div></a>')
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="robots" content="noindex,nofollow"><meta name="viewport" '
            'content="width=device-width,initial-scale=1"><title>MURDILIMAX Draft Studio — Research Previews</title>'
            '<style>body{margin:0;background:#ecf2ed;color:#183d34;font:17px/1.6 system-ui,Arial}'
            'header{background:#19483a;color:white;padding:50px max(22px,5vw)}'
            'h1{font-size:clamp(2rem,6vw,4.6rem);line-height:1.05;max-width:920px;margin:12px 0}'
            'header p{max-width:840px;color:#deebe2}main{max-width:1120px;margin:28px auto;padding:0 20px}'
            '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:17px}'
            '.card{display:block;padding:25px;border-radius:17px;border:1px solid #d1e0d3;background:#fffdf8;'
            'color:#19483a;text-decoration:none;box-shadow:0 3px 18px #193f3514}'
            '.card:hover{transform:translateY(-3px)}.card:focus-visible{outline:3px solid #337e5a}'
            '.kind{font-size:.7rem;letter-spacing:.12em;font-weight:800;color:#628a75}'
            'h2{line-height:1.15;margin:18px 0}.meta{font-size:.8rem;color:#68776b}</style></head><body>'
            '<header><div style="font-weight:800;letter-spacing:.14em">MURDILIMAX / GLOBAL EDITORIAL STUDIO</div>'
            '<h1>Preview the next useful answers</h1><p>These are unpublished research previews. Source URLs, images and '
            'claims must be checked by an editor before any article is placed on the public website. '
            'No paid API, automatic publishing or public forum messages are involved.</p></header>'
            '<main><div class="grid">' + "".join(cards) + '</div></main></body></html>')


def produce_previews(data: dict, output: Path, drafts_dir: Path, online: bool = True) -> dict:
    selected = select_topics(data.get("shortlist", []), 2)
    output.mkdir(parents=True, exist_ok=True)
    previews = []
    for item in selected:
        slug = topic_slug(safe_text(item.get("term")))
        evidence = gather_evidence(item, online=online)
        (output / (slug + "-sources.json")).write_text(
            json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        draft_file = drafts_dir / (slug + "-ai-draft.md")
        draft = draft_file.read_text(encoding="utf-8") if draft_file.is_file() else None
        (output / (slug + "-editor-preview.html")).write_text(
            build_preview(item, evidence, draft), encoding="utf-8")
        previews.append({
            "topic": safe_text(item["term"]), "preview": slug + "-editor-preview.html",
            "ai_draft_exists": bool(draft), "wiki_retrieved": bool(evidence["wikipedia"]),
            "licensed_commons_image": bool(evidence["licensed_image"]),
            "sources_confirmed_independently": False, "needs_human_approval": True,
        })
    summary = {"previews": previews, "pages_published": 0, "paid_calls": 0}
    (output / "index.html").write_text(gallery_page(previews), encoding="utf-8")
    (output / "preview-summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Editorial preview: " + str(len(previews)) + " HTML pages (not deployed)")
    return summary


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", default="reports/world-topic-radar/topics.json")
    p.add_argument("--output", default="reports/world-topic-radar/previews")
    p.add_argument("--drafts-dir", default="reports/world-topic-radar/drafts")
    p.add_argument("--offline", action="store_true", help="Generate previews without Wikimedia requests")
    p.add_argument("--report", default="reports/world-topic-radar/report.md")
    args = p.parse_args()
    raw = Path(args.input).read_bytes()
    if len(raw) > 3_000_000:
        raise ValueError("Research input exceeds size cap")
    outcome = produce_previews(json.loads(raw), Path(args.output), Path(args.drafts_dir),
                               online=not args.offline)
    report = Path(args.report)
    if report.exists():
        lines = ["", "## Visual editorial previews (NOT published)", "",
                 f"- HTML preview cards generated: {len(outcome['previews'])}",
                 f"- Actual website pages published: {outcome['pages_published']}",
                 "- Preview source audit checks Wikimedia availability and Commons image licenses, "
                 "but **does not independently verify article claims**.",
                 "- Open the GitHub Actions artifact and start with previews/index.html.",
                 ""]
        for preview in outcome["previews"]:
            lines.append("- " + safe_text(preview["topic"]) + " — "
                         + ("AI draft preview" if preview["ai_draft_exists"]
                            else "research outline, no article drafted")
                         + "; Commons image: "
                         + ("verified license" if preview["licensed_commons_image"]
                            else "original SVG"))
        with report.open("a", encoding="utf-8") as stream:
            stream.write("\n".join(lines) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
