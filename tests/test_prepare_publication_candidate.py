"""Research-artifact -> safe, pending publication PR candidate. Pure offline tests."""
import json
import tempfile
import unittest
from pathlib import Path

from scripts import prepare_publication_candidate as pub
from scripts.editorial_draft_studio import topic_slug


def ai_markdown():
    return """# How does an unusual natural phenomenon work?

**STATUS: EDITORIAL RESEARCH ONLY — NOT VERIFIED, NOT APPROVED, NOT PUBLISHED.**

**AI-assisted unverified draft.** Facts require review.

This educational topic is interesting, but readers should check scientific evidence before accepting claims.

## The key scientific question

Observations can help describe the phenomenon. [VERIFY: core cause] Readers deserve independent evidence and a clear explanation. This is only a first draft.

## How to investigate

A well-researched article must compare primary scientific observations and their limitations. [VERIFY: quantitative measurements] We should not invent numbers.

## A practical observation

Provide a simple, safe example with original explanation and the right photograph. [VERIFY: conditions in which this phenomenon appears]

## Remaining uncertainty

Clarify that news reports and crowd-sourced summaries are research leads only. All claims and the final advice require editorial fact checking.

## Claims and dates to independently verify

- [ ] precise physical mechanism
- [ ] measurements

## Additional editorial notes

- Research carefully.

## Provided leads are NOT confirmed citations

- [Wikipedia context](https://en.wikipedia.org/)
"""


class PublicationCandidateTests(unittest.TestCase):
    def fixture(self, root, term="Unusual natural phenomenon", with_draft=True):
        slug=topic_slug(term)
        (root/"drafts").mkdir(parents=True,exist_ok=True)
        (root/"previews").mkdir(parents=True,exist_ok=True)
        (root/"topics.json").write_text(json.dumps({"shortlist":[{
            "term":term, "category":"Science & space", "requires_review":[],
            "possible_existing_article":False
        }]}),encoding="utf-8")
        if with_draft:
            (root/"drafts"/(slug+"-ai-draft.md")).write_text(ai_markdown(),encoding="utf-8")
        (root/"previews"/(slug+"-sources.json")).write_text(json.dumps({
            "external_research_leads":[{"title":"Public science note","url":"https://science.nasa.gov/"}],
            "licensed_image":{
                "file_page":"https://commons.wikimedia.org/wiki/File:Scientific_illustration.jpg",
                "author":"Example Photographer","license":"CC BY 4.0",
                "license_url":"https://creativecommons.org/licenses/by/4.0/",
                "license_metadata_checked":True
            }
        }),encoding="utf-8")
        return slug

    def test_pending_candidate_contains_evidence_without_autoapproval(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/"artifact"
            slug=self.fixture(root)
            out=Path(d)/"approved"
            path=pub.prepare_candidate(root,slug,out)
            self.assertEqual(path.name,slug+".json")
            story=json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(story["approval"]["status"],"pending")
            self.assertFalse(story["approval"]["factsVerified"])
            self.assertFalse(story["approval"]["originalityReviewed"])
            self.assertFalse(story["approval"]["imageRightsVerified"])
            self.assertIn("commons.wikimedia.org/wiki/Special:Redirect/file/",story["photoAsset"]["url"])
            self.assertEqual(len(story["en"]["sections"]),4)
            self.assertIn("[VERIFY:",story["en"]["sections"][0][1])
            self.assertTrue(story["editorialOrigin"]["fromRadarDraft"])
            with self.assertRaises(FileExistsError):
                pub.prepare_candidate(root,slug,out)

    def test_missing_ai_draft_cannot_masquerade_as_article(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/"artifact"
            slug=self.fixture(root,with_draft=False)
            with self.assertRaisesRegex(ValueError,"No AI draft"):
                pub.prepare_candidate(root,slug,Path(d)/"approved")

    def test_unmatched_slug_and_unsafe_path_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)/"artifact"
            self.fixture(root)
            for slug in ("../../etc/passwd","nonexistent-topic-abcdef", "slug;rm"):
                with self.assertRaises(ValueError):
                    pub.prepare_candidate(root,slug,Path(d)/"approved")

    def test_broken_model_content_is_not_promoted(self):
        title,intro,sections=pub.parse_draft(ai_markdown())
        self.assertTrue(title.startswith("How does"))
        self.assertEqual(len(sections),4)
        self.assertNotIn("Claims and dates",str(sections))
        with self.assertRaises(ValueError):
            pub.parse_draft("# Too short\n\nOne sentence with no useful sections.")


if __name__=="__main__":
    unittest.main()
