"""Guard the client presentation's curated reading edition and public bundle."""
import json
from pathlib import Path
import unittest
from scripts.bundle_updates import bundled_source
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]

class ReadingEditionTests(unittest.TestCase):
    def test_direct_file_edition_matches_canonical_json(self):
        self.assertEqual((ROOT/'data/updates-bundled.js').read_text(), bundled_source())

    def setUp(self):
        self.feed = json.loads((ROOT/'data/updates.json').read_text())

    def test_twelve_distinct_articles_and_covers(self):
        items = self.feed['articles']
        self.assertEqual(len(items), 12)
        self.assertEqual(len({x['id'] for x in items}), 12)
        self.assertEqual(len({x['image'] for x in items}), 12)
        for item in items:
            self.assertTrue((ROOT/'assets/updates'/(item['image']+'.jpg')).is_file())

    def test_nucleus_and_diverse_official_sources(self):
        sources = {x['source'] for x in self.feed['articles']}
        self.assertGreaterEqual(len(sources), 4)
        self.assertIn('Nucleus MedLabs', sources)
        self.assertGreaterEqual(sum(x['category']=='Job readiness' for x in self.feed['articles']), 3)
        for item in self.feed['articles']:
            self.assertEqual(urlsplit(item['url']).scheme, 'https')

    def test_archive_does_not_override_current_articles(self):
        current = {x['id'] for x in self.feed['articles']}
        archived = {x['id'] for x in self.feed['archive']}
        self.assertFalse(current & archived)
        self.assertIn('nucleus-services', archived)

    def test_client_has_no_unpublished_remote_feed_or_refresh_control(self):
        self.assertNotIn('btn-refresh-updates', (ROOT/'index.html').read_text())
        self.assertNotIn('raw.githubusercontent.com', (ROOT/'scripts/build.py').read_text())
        self.assertFalse((ROOT/'.github/workflows/refresh-updates.yml').exists())

if __name__ == '__main__':
    unittest.main()
