#!/usr/bin/env python3
"""Convert a saved World Topic Radar AI draft into a GitHub-review article candidate.

Output is always PENDING and cannot enter published site output. An editor
must fact-check, rewrite, supply real sources and image licensing, change the
approval fields, and merge the resulting PR before the static site builds it.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import re
import urllib.parse
from pathlib import Path

try:
    from scripts.editorial_draft_studio import topic_slug, safe_text
except ModuleNotFoundError:
    from editorial_draft_studio import topic_slug, safe_text

REVIEW_SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CATEGORIES = {
    "Science & space":"astronomy",
    "Technology & AI":"tech",
    "Nature & animals":"nature",
    "Health & wellbeing":"nature",
    "Money & economy":"tools",
    "Sports":"tools",
    "Travel & places":"travel",
    "Culture & entertainment":"digital",
    "World & everyday questions":"digital",
}


def parse_draft(markdown: str) -> tuple[str,str,list[list[str]]]:
    """Only the editorial article segment; discard fact-check tasks and source leads."""
    if len(markdown)>28_000:
        raise ValueError("Unreasonably long model draft")
    lines=markdown.splitlines()
    title=next((line[2:].strip() for line in lines if line.startswith("# ")), "")
    if not title or len(title)>130:
        raise ValueError("Missing proper draft title")
    # Stop at the first editorial/audit appendix.
    content=[]
    for line in lines:
        if line.startswith("## Claims and dates to independently verify") or (
                line.startswith("## Additional editorial notes")) or (
                line.startswith("## Provided leads")):
            break
        content.append(line)
    headings=[i for i,line in enumerate(content) if line.startswith("## ")]
    sections=[]
    for idx,begin in enumerate(headings):
        end=headings[idx+1] if idx+1<len(headings) else len(content)
        heading=content[begin][3:].strip()
        body=" ".join(line.strip() for line in content[begin+1:end]
                      if line.strip() and not line.startswith(">"))
        if heading and body:
            sections.append([heading,body.replace("\\[VERIFY:", "[VERIFY:")])
    # Intro is normally between status notices and the first ## header.
    introduction=[]
    for line in content[1:headings[0] if headings else len(content)]:
        raw=line.strip()
        if not raw or raw.startswith("**") or raw.startswith("#"):
            continue
        introduction.append(raw)
    standfirst=" ".join(introduction).strip()
    if not standfirst:
        raise ValueError("Model draft contains no introduction")
    if not 3<=len(sections)<=7:
        raise ValueError("Model draft is too fragmented; keep for research only")
    return title[:115],standfirst[:260],sections


def prepare_candidate(artifact_dir: Path, selected_slug: str, output_dir: Path) -> Path:
    if not REVIEW_SLUG.fullmatch(selected_slug) or len(selected_slug)>94:
        raise ValueError("Invalid article slug")
    topics=json.loads((artifact_dir/"topics.json").read_text(encoding="utf-8"))
    article=next((x for x in topics.get("shortlist",[])
                  if topic_slug(safe_text(x.get("term")))==selected_slug),None)
    if not article:
        raise ValueError("Selected topic not found in specified Radar run")
    if article.get("requires_review") or article.get("possible_existing_article"):
        raise ValueError("Risky or existing article cannot be fast-tracked")
    draft_file=artifact_dir/"drafts"/(selected_slug+"-ai-draft.md")
    if not draft_file.is_file():
        raise ValueError("No AI draft in this artifact. A research outline is not a publishable article")
    title,intro,sections=parse_draft(draft_file.read_text(encoding="utf-8"))
    audit_file=artifact_dir/"previews"/(selected_slug+"-sources.json")
    evidence=json.loads(audit_file.read_text(encoding="utf-8")) if audit_file.exists() else {}
    asset=evidence.get("licensed_image") or {}
    photo=None
    file_page=str(asset.get("file_page") or "")
    if file_page.startswith("https://commons.wikimedia.org/wiki/File:") and asset.get("license_metadata_checked"):
        filename=urllib.parse.unquote(file_page.partition("/wiki/File:")[2])
        photo={
            "url":"https://commons.wikimedia.org/wiki/Special:Redirect/file/"
                 +urllib.parse.quote(filename,safe="")+"?width=1200",
            "source":file_page,
            "credit":safe_text(asset.get("author"),180)+" / Wikimedia Commons",
            "licenseLabel":asset.get("license"),
            "license":asset.get("license_url"),
        }
    now=dt.datetime.now(dt.timezone.utc).date().isoformat()
    # The original slug is generated from an interest query, not an SEO-approved headline.
    # Editors should change id and file name together if a better search-intent slug is needed.
    sources=[]
    for lead in evidence.get("external_research_leads",[])[:10]:
        if lead.get("url","").startswith("https://"):
            sources.append({"label":safe_text(lead.get("title","Research lead"),150),
                            "url":lead["url"]})
    category=CATEGORIES.get(article.get("category"),"digital")
    result={
        "id":selected_slug,"topic":category,"minutes":max(4,min(12,round(sum(len(x[1].split()) for x in sections)/175))),
        "published":now,"approval":{
            "status":"pending",
            "reviewer":"",
            "checkedAt":"",
            "factsVerified":False,"originalityReviewed":False,"imageRightsVerified":False,
            "editorNotes":"Review all [VERIFY] markers, refresh facts, replace leads with primary sources, "
                          "add substantive original detail, check image rights and update English edition. "
                          "Only then change status to approved and the three flags to true."
        },
        "photoAsset":photo,
        "mediaAlt":{"en":"EDITOR: verify depicted subject and replace this alt text"},
        "sources":sources,
        "en":{
            "title":title,"description":intro[:200],
            "subtitle":intro,
            "photoCaption":"EDITOR: credit and explain this properly licensed real photograph before approval.",
            "sections":sections,
        },
        "editorialOrigin":{
            "interestTerm":safe_text(article["term"]),
            "fromRadarDraft":True,
            "researchNote":"Unverified AI text. No claims independently corroborated by the publishing tool.",
            "artifactRun":None,
        },
    }
    output_dir.mkdir(parents=True,exist_ok=True)
    path=output_dir/(selected_slug+".json")
    if path.exists():
        raise FileExistsError("A candidate with this slug already exists")
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PENDING review candidate: "+str(path))
    return path


def main() -> int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--artifact-dir",required=True)
    p.add_argument("--slug",required=True)
    p.add_argument("--output-dir",default="editorial/approved")
    args=p.parse_args()
    prepare_candidate(Path(args.artifact_dir),args.slug,Path(args.output_dir))
    return 0


if __name__=="__main__":
    raise SystemExit(main())
