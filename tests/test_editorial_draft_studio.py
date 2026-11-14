"""Draft Studio must work offline, never publish, and bound API usage."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from scripts import editorial_draft_studio as studio


def topic(term="Why does the sky change color?", priority=75, risk=None,
          type_name="question-led evergreen explainer", references=None):
    return {
        "term": term, "category": "Science & space",
        "source_url": "https://trends.google.com/trending/rss?geo=US",
        "references": (references if references is not None else [
            {"title": "An informational science source", "url": "https://www.nasa.gov/"}
        ]),
        "regions": ["US", "GB"], "requires_review": list(risk or []),
        "possible_existing_article": False,
        "opportunity": {"editorial_priority": priority,
                        "candidate_languages": ["en", "ru"],
                        "type": type_name,
                        "working_question": term,
                        "priority_reasons": ["query intent", "global interest"]},
    }


class StudioTests(unittest.TestCase):
    def test_source_validation_and_markdown_safety(self):
        self.assertEqual(studio.https_url("javascript:alert(1)"), "")
        self.assertEqual(studio.https_url("https://example.com/ok"), "https://example.com/ok")
        self.assertEqual(studio.md("<script>alert</script>"), "&lt;script&gt;alert&lt;/script&gt;")
        rows = studio.source_links(topic(references=[
            {"title": "bad", "url": "javascript:alert(1)"},
            {"title": "good", "url": "https://example.com/a"},
            {"title": "repeat", "url": "https://example.com/a"},
        ]))
        self.assertEqual(len(rows), 2)
        self.assertFalse(any("javascript:" in x["url"] for x in rows))

    def test_eligibility_rejects_risky_urgent_duplicate_and_unresearched(self):
        base = topic()
        self.assertTrue(studio.eligible_for_ai(base))
        self.assertFalse(studio.eligible_for_ai(topic(risk=["medical"])))
        self.assertFalse(studio.eligible_for_ai(topic(type_name="time-sensitive context")))
        self.assertFalse(studio.eligible_for_ai(topic(references=[])))
        duplicate = topic()
        duplicate["possible_existing_article"] = True
        self.assertFalse(studio.eligible_for_ai(duplicate))

    def test_offline_mode_writes_only_review_briefs(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            items = [topic(), topic("How do penguins survive the cold?", priority=50)]
            report = root / "report.md"
            report.write_text("# Radar\n", encoding="utf-8")
            data = studio.produce({"shortlist": items}, root / "drafts", report,
                                  ai=True, api_key="", generated_at="2026-11-14 12:00")
            self.assertEqual(len(data["topics_prepared"]), 2)
            self.assertEqual(data["ai_drafts"], 0)
            self.assertFalse(data["api_enabled"])
            self.assertEqual(data["publishing"], "disabled")
            self.assertEqual(len(list((root / "drafts").glob("*-brief.md"))), 2)
            self.assertEqual(len(list((root / "drafts").glob("*-ai-draft.md"))), 0)
            summary = json.loads((root / "drafts" / "summary.json").read_text())
            self.assertEqual(summary["forum_replies"], "disabled")
            self.assertIn("not published", report.read_text())

    def test_model_draft_has_validation_and_max_one(self):
        output = {
            "title": "Why does the sky change its colors?",
            "standfirst": "This draft explores the question and shows what a writer must confirm.",
            "sections": [{"heading": "The key question",
                          "body": "Before publication, this section explains what measurements and scientific sources must be independently checked. [VERIFY: physical explanation and any wavelength claims]."},
                         {"heading": "How to investigate",
                          "body": "Researchers and curious readers can compare clear skies and cloudy scenes, but must check that each claim is supported by primary sources, then add a meaningful illustration."},
                         {"heading": "What remains uncertain",
                          "body": "Readers deserve clear limitations, example observations and accurate source information rather than unsupported numerical claims or copied online news."}],
            "claims_to_verify": ["Atmospheric scattering mechanism", "Conditions of observation"],
            "editorial_notes": ["Find first-party science sources", "Do not publish without review"],
        }
        with tempfile.TemporaryDirectory() as directory, patch.object(studio, "model_request", return_value=output) as mock:
            result = studio.produce({"shortlist": [
                topic("Why does the sky change color?", 91),
                topic("Why do stars flicker?", 88),
            ]}, Path(directory), ai=True, api_key="test-secret",
                generated_at="2026-11-14 12:00")
            self.assertEqual(result["ai_drafts"], 1)
            self.assertEqual(mock.call_count, 1)
            draft = list(Path(directory).glob("*-ai-draft.md"))[0].read_text()
            self.assertIn("NOT VERIFIED", draft)
            self.assertIn("[VERIFY:", draft.replace("\\[", "["))
            self.assertIn("Publication blocked", draft)
            self.assertNotIn("test-secret", draft)

    def test_model_validation_fails_html_and_short_fake_drafts(self):
        with self.assertRaises(ValueError):
            studio.validate_ai_draft({"title": "a", "standfirst": "b",
                                      "sections": [], "claims_to_verify": [], "editorial_notes": []})
        result = {"title": "Safe title but unsafe content", "standfirst": "Long enough meaningful explanatory introduction about the issue.",
                  "sections": [{"heading": "The main angle",
                                "body": "Visit https://unverified.example.com and buy now. " + "More text. " * 20}] * 3,
                  "claims_to_verify": [], "editorial_notes": []}
        with self.assertRaises(ValueError):
            studio.validate_ai_draft(result)

    def test_unknown_shortlist_and_duplicate_selection(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                studio.produce({}, Path(directory))
            d = topic()
            duplicate = topic()
            selected = studio.select_topics([d, duplicate], maximum=2)
            self.assertEqual(len(selected), 1)


if __name__ == "__main__":
    unittest.main()
