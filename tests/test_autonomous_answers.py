"""Offline safety and selection tests for autonomous answer publishing."""
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import autonomous_answers as bot


class AutonomousAnswersTests(unittest.TestCase):
    def lead(self, term="Aurora", category="Science & space"):
        return {
            "term": term, "signal": "wikipedia_pageviews", "category": category,
            "requires_review": [], "possible_existing_article": False,
            "source_url": "https://en.wikipedia.org/wiki/" + term.replace(" ", "_"),
        }

    def test_only_low_risk_wikipedia_article_candidates(self):
        topics = {"shortlist": [
            self.lead("Aurora"),
            self.lead("Medical trial", "Health & wellbeing"),
            self.lead("President Election", "Science & space"),
            {**self.lead("Aurora"), "possible_existing_article": True},
            {**self.lead("Aurora"), "signal": "google_trends_search"},
        ]}
        results = bot.choose_leads(topics, [])
        self.assertEqual([r["term"] for r in results], ["Aurora"])

    def test_prior_article_is_not_repeated(self):
        lead = self.lead("Aurora")
        prior = [{"origin": {"wiki": lead["source_url"]}}]
        self.assertEqual(bot.choose_leads({"shortlist": [lead]}, prior), [])

    def test_model_output_must_have_genuine_bilingual_sections(self):
        valid = {
            "title": "A useful explanation of the phenomenon",
            "description": "A clear reader-first explanation with useful background details and information based on the cited encyclopedia source.",
            "intro": "This introduction contains enough substantial explanation to orient a reader to the subject and show what the following practical sections cover in detail.",
            "sections": [
                {"heading": "The context behind the phenomenon", "body": "This is a substantive paragraph explaining the context using source-grounded information without repeating the same answer. " * 3},
                {"heading": "How the process is described", "body": "The explanation connects the details together and describes the process using evidence and accessible language for the reader. " * 3},
                {"heading": "Important distinctions and limitations", "body": "The article tells readers what the evidence supports and where the source does not address the question in a useful, readable way. " * 3},
            ],
        }
        self.assertEqual(len(bot.validate_translation(valid, "en")["sections"]), 3)
        with self.assertRaises(ValueError):
            bot.validate_translation({**valid, "sections": [{"heading": "Short", "body": "short"}]}, "en")
        with self.assertRaises(ValueError):
            bot.validate_translation({**valid, "intro": "[VERIFY: missing evidence] " + valid["intro"]}, "en")

    def test_model_unavailable_means_no_publication(self):
        topic = self.lead("Aurora")
        summary = {"title": "Aurora", "extract": "Detailed factual extract." * 30,
                   "url": "https://en.wikipedia.org/wiki/Aurora"}
        with tempfile.TemporaryDirectory() as tmp:
            radar = Path(tmp) / "radar.json"
            radar.write_text('{"shortlist":[' + __import__('json').dumps(topic) + ']}')
            output = Path(tmp) / "articles"
            with mock.patch.object(bot, "fetch_source", return_value=summary), \
                    mock.patch.object(bot, "ask_free_model", side_effect=ValueError("free inference unavailable")):
                self.assertIsNone(bot.publish_one(radar, output))
            self.assertEqual(list(output.glob("*.json")), [])


if __name__ == "__main__":
    unittest.main()
