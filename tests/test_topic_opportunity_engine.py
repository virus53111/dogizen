"""Offline opportunity-engine regression tests: no network/API keys."""
import csv
import tempfile
import unittest
from pathlib import Path

from scripts import topic_opportunity_engine as engine


def item(term, signal="google_trends_search", regions=("US",), category="Technology & AI",
         question=False, risks=None):
    return {
        "term": term, "signal": signal, "regions": list(regions),
        "category": category, "is_question": question,
        "requires_review": list(risks or []), "references": [],
        "source_url": "https://trends.google.com/trending/rss?geo=US",
        "possible_existing_article": False,
    }


class OpportunityTests(unittest.TestCase):
    def test_global_languages_and_evergreen_question(self):
        row = item("Why does the moon change shape?", regions=("GB", "LV", "DE"), question=True,
                   category="Science & space")
        result = engine.enrich([row])[0]["opportunity"]
        self.assertEqual(result["type"], "question-led evergreen explainer")
        self.assertEqual(result["candidate_languages"], ["en", "lv", "de"])
        self.assertGreaterEqual(result["editorial_priority"], 55)
        self.assertFalse(result["publish_automatically"])
        self.assertIn("Why does the moon change shape?", result["working_question"])

    def test_safety_penalty_and_fresh_event_priority(self):
        safe = item("How to back up a phone?", question=True)
        risky = item("New drug cures cancer", risks=["medical"])
        sports = item("Japan vs Brazil", category="Sports", regions=("GB", "BR"))
        ranked = engine.enrich([risky, sports, safe])
        self.assertGreater(safe["opportunity"]["editorial_priority"], risky["opportunity"]["editorial_priority"])
        self.assertEqual(sports["opportunity"]["type"], "time-sensitive context")
        self.assertIn("Specialist review", " ".join(risky["opportunity"]["fact_check_plan"]))
        self.assertTrue(all(not x["opportunity"]["publish_automatically"] for x in ranked))

    def test_gsc_csv_and_relative_benchmark_not_forecast(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "queries.csv"
            with path.open("w", newline="", encoding="utf-8-sig") as handle:
                writer = csv.writer(handle)
                writer.writerow(["Top queries", "Clicks", "Impressions", "CTR", "Position"])
                writer.writerow(["why does phone battery drain", 3, 400, "0.75%", 8.2])
                writer.writerow(["other exact query", 0, 100, "0%", 4.1])
                writer.writerow(["high ranking query", 20, 30, "66%", 1.2])
                writer.writerow(["wrong data", "xx", "bad", "", 3])
            rows = engine.load_gsc_csv(path)
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]["query"], "why does phone battery drain")
            self.assertEqual(rows[0]["ctr"], 0.0075)
            self.assertEqual(len(engine.find_gsc_matches("phone battery drain", rows)), 1)
            strong = item("phone battery drain", question=False)
            engine.enrich([strong], rows)
            self.assertEqual(len(strong["opportunity"]["gsc_matches"]), 1)
            self.assertIn("not an estimate", strong["opportunity"]["priority_meaning"])

    def test_not_deducing_gsc_match_from_one_generic_word(self):
        rows = [{"query": "star trek movie", "impressions": 100, "clicks": 4, "position": 8.5}]
        self.assertEqual(engine.find_gsc_matches("star constellations", rows), [])

    def test_gsc_validation_and_empty_file(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "empty.csv"
            path.write_text("", encoding="utf-8")
            with self.assertRaises(ValueError):
                engine.load_gsc_csv(path)
            with self.assertRaises(FileNotFoundError):
                engine.load_gsc_csv(Path(d) / "missing.csv")

    def test_linguistic_distribution_without_automatic_translations(self):
        x = item("What is an eclipse?", regions=("BR", "FR", "JP", "US", "BR"), question=True)
        self.assertEqual(engine.recommended_languages(x["regions"]), ["pt", "fr", "en"])
        assert "No translation" not in x


if __name__ == "__main__":
    unittest.main()
