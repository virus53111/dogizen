"""Offline regression tests: no live network connection or secret is needed."""
import datetime as dt
import unittest

from scripts import world_topic_radar as radar

XML = """<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:ht="https://trends.google.com/trending/rss" version="2.0">
 <channel>
 <item><title>Why do cats purr?</title><pubDate>Sat, 14 Nov 2026 08:00:00 GMT</pubDate>
 <ht:approx_traffic>5000+</ht:approx_traffic>
 <ht:news_item><ht:news_item_title>Cat study</ht:news_item_title>
 <ht:news_item_url>https://example.org/cat-study</ht:news_item_url></ht:news_item>
 </item>
 <item><title>New planet discoveries</title><ht:approx_traffic>200+</ht:approx_traffic>
 <ht:news_item><ht:news_item_url>javascript:alert(1)</ht:news_item_url></ht:news_item>
 </item>
 </channel>
</rss>"""


class RadarTests(unittest.TestCase):
    def test_rss_parsing_and_news_urls(self):
        rows = radar.parse_trends(XML, "US")
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["term"], "Why do cats purr?")
        self.assertEqual(rows[0]["observed_bucket"], "5000+")
        self.assertEqual(rows[0]["references"][0]["url"], "https://example.org/cat-study")
        self.assertEqual(rows[1]["references"], [])
        self.assertEqual(rows[0]["signal"], "google_trends_search")

    def test_multicountry_duplicates_are_collapsed(self):
        us = radar.parse_trends(XML, "US")
        gb = radar.parse_trends(XML, "GB")
        combined = radar.normalize_topics(us + gb)
        self.assertEqual(len(combined), 2)
        first = next(x for x in combined if x["term"] == "Why do cats purr?")
        self.assertEqual(set(first["regions"]), {"US", "GB"})
        self.assertTrue(first["is_question"])
        self.assertEqual(len(first["references"]), 1)

    def test_wikipedia_top_articles_are_view_signals_not_searches(self):
        page = {"items": [{"articles": [
            {"article": "Main_Page", "views": 999999},
            {"article": "Jupiter", "views": 54321, "rank": 2},
            {"article": "Special:Search", "views": 123456},
            {"article": "Quantum_mechanics", "views": 15000}
        ]}]}
        date = dt.date(2026, 11, 12)
        rows = radar.parse_wikipedia(page, "en", date)
        self.assertEqual([r["term"] for r in rows], ["Jupiter", "Quantum mechanics"])
        self.assertEqual(rows[0]["views"], 54321)
        self.assertIn("wikipedia.org/wiki/Jupiter", rows[0]["source_url"])
        self.assertEqual(rows[0]["signal"], "wikipedia_pageviews")

    def test_existing_articles_and_category_diversity(self):
        rows = radar.normalize_topics(radar.parse_trends(XML, "US"))
        selected = radar.shortlist(rows, ["why do cats purr"], 10)
        self.assertEqual(len(selected), 1)
        self.assertEqual(selected[0]["term"], "New planet discoveries")
        self.assertTrue(any(x["possible_existing_article"] for x in rows))

    def test_editorial_safety_and_markdown_escaping(self):
        self.assertIn("medical", radar.risk_flags("new cancer vaccine"))
        self.assertEqual(radar.safe_url("javascript:alert(1)"), "")
        self.assertEqual(radar.safe_url("https://example.org/path"), "https://example.org/path")
        self.assertIn("\\|", radar.escape_md("test | table"))
        rows = radar.normalize_topics(radar.parse_trends(XML, "US"))
        report = radar.render_report(rows, rows, [], "2026-11-14 10:00")
        self.assertIn("No article was generated or published", report)
        self.assertIn("not identifiable users", report)
        self.assertIn("editorial verification required", report)


if __name__ == "__main__":
    unittest.main()
