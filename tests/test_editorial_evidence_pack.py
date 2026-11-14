"""Offline evidence-pack tests; no live Wikimedia access needed."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import editorial_evidence_pack as evidence
from scripts import editorial_draft_studio as studio


def topic(term="SpaceX Starship", category="Science & space"):
    return {
        "term": term, "category": category,
        "source_url": "https://trends.google.com/trending/rss?geo=US",
        "references": [{"title": "Context", "url": "https://example.org/context"}],
        "regions": ["US"], "requires_review": [],
        "possible_existing_article": False,
        "opportunity": {
            "type": "background explainer; validate current relevance",
            "working_question": "How does this work?",
            "editorial_priority": 64, "candidate_languages": ["en"],
            "priority_reasons": ["context interest"],
        },
    }


class EvidencePackTests(unittest.TestCase):
    def test_wikipedia_matching_source_and_not_false_verification(self):
        pages = {"query": {"pages": [
            {"index": 1, "title": "SpaceX Starship",
             "extract": "SpaceX Starship is a reusable spacecraft system described in a community-edited reference article. "
                        "This summary is for research context rather than proof of facts about the spacecraft or launches.",
             "fullurl": "https://en.wikipedia.org/wiki/SpaceX_Starship"}
        ]}}
        with patch.object(evidence, "api_get", return_value=pages):
            lead = evidence.wikipedia_lead("spacex starship")
        self.assertIn("wikipedia.org/wiki/", lead["url"])
        self.assertFalse(lead["claims_independently_verified"])
        self.assertTrue(evidence.relevant_title("SpaceX Starship", "SpaceX Starship"))
        self.assertFalse(evidence.relevant_title("SpaceX Starship", "Some unrelated ocean topic"))

    def test_commons_valid_author_and_license_required(self):
        def sample(license_name="CC BY-SA 4.0", author="Jane Example"):
            return {"query": {"pages": [
                {"title": "File:SpaceX Starship launch.jpg", "index": 1,
                 "imageinfo": [{"thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Starship.jpg/1100px-Starship.jpg",
                                "descriptionurl": "https://commons.wikimedia.org/wiki/File:SpaceX_Starship_launch.jpg",
                                "extmetadata": {
                                    "LicenseShortName": {"value": license_name},
                                    "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0/"},
                                    "Artist": {"value": "<span> " + author + " </span>"},
                                }}]}
            ]}}
        with patch.object(evidence, "api_get", return_value=sample()):
            image = evidence.commons_candidate("spaceX Starship")
        self.assertEqual(image["author"], "Jane Example")
        self.assertEqual(image["license"], "CC BY-SA 4.0")
        self.assertTrue(image["license_metadata_checked"])
        with patch.object(evidence, "api_get", return_value=sample("All rights reserved")):
            self.assertIsNone(evidence.commons_candidate("SpaceX Starship"))
        with patch.object(evidence, "api_get", return_value=sample(author="")):
            self.assertIsNone(evidence.commons_candidate("SpaceX Starship"))

    def test_offline_mode_creates_standalone_editor_preview_without_publication(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            drafts = root / "drafts"
            drafts.mkdir()
            items = [topic(), topic("Why do cats purr?", "Nature & animals")]
            with patch.object(evidence, "api_get", side_effect=AssertionError("No network expected")):
                summary = evidence.produce_previews({"shortlist": items}, root / "previews",
                                                    drafts, online=False)
            self.assertEqual(summary["pages_published"], 0)
            self.assertEqual(summary["paid_calls"], 0)
            self.assertEqual(len(summary["previews"]), 2)
            self.assertFalse(summary["previews"][0]["sources_confirmed_independently"])
            gallery = (root / "previews" / "index.html").read_text()
            self.assertIn("Preview the next useful answers", gallery)
            self.assertIn('noindex,nofollow', gallery)
            self.assertIn("editor-preview.html", gallery)
            rendered = list((root / "previews").glob("*-editor-preview.html"))
            self.assertEqual(len(rendered), 2)
            for filename in rendered:
                html = filename.read_text()
                self.assertIn("<svg", html)
                self.assertIn("noindex,nofollow", html)
                self.assertIn("UNVERIFIED", html)
                self.assertIn("not independently checked", html)
                self.assertNotIn("document.write", html)

    def test_styled_preview_uses_photo_only_when_license_confirmed(self):
        i = topic()
        photo = {
            "thumbnail_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/z/a/a.jpg",
            "file_page": "https://commons.wikimedia.org/wiki/File:SpaceX_Starship_launch.jpg",
            "title": "SpaceX Starship", "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
            "license": "CC BY-SA 4.0", "author": "Jane Example"
        }
        sources = {"licensed_image": photo, "wikipedia": None,
                   "external_research_leads": [], "ready_to_publish": False}
        preview = evidence.build_preview(i, sources, "# Draft article\n## Details\nSome draft statement [VERIFY: source].")
        self.assertIn("Jane Example", preview)
        self.assertIn("creativecommons.org", preview)
        self.assertIn("Some draft statement", preview)
        self.assertNotIn("source-confirmed claims", preview)

    def test_editorial_html_escapes_source_injection(self):
        item = topic("<script>alert('x')</script>")
        data = {"licensed_image": None, "wikipedia": None, "external_research_leads": [
            {"title": '<img src=x onerror="alert(1)">', "url": "javascript:alert(2)"}
        ]}
        preview = evidence.build_preview(item, data, None)
        self.assertNotIn("<script>", preview)
        self.assertNotIn("onerror=", preview)
        self.assertNotIn('href="javascript:', preview)
        self.assertIn("&lt;script&gt;", preview)

    def test_source_errors_fail_open_to_research_outline_not_fake_fact(self):
        with patch.object(evidence, "wikipedia_lead", side_effect=TimeoutError), \
             patch.object(evidence, "commons_candidate", side_effect=TimeoutError):
            found = evidence.gather_evidence(topic(), online=True)
        self.assertEqual(len(found["source_access_errors"]), 2)
        self.assertFalse(found["ready_to_publish"])
        self.assertFalse(found["all_article_claims_verified"])
        self.assertIsNone(found["licensed_image"])


if __name__ == "__main__":
    unittest.main()
