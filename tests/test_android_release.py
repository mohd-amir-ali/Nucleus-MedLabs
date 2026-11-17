import json
from pathlib import Path
import unittest
from scripts.prepare_android import version_code


class AndroidVersionTests(unittest.TestCase):
    def test_version_code_orders_releases_and_repeated_builds(self):
        self.assertLess(version_code('8.5.0',9999),version_code('8.5.1',1))
        self.assertLess(version_code('8.5.99',9999),version_code('8.6.0',1))
        self.assertLess(version_code('8.99.99',9999),version_code('9.0.0',1))
        self.assertLess(version_code('8.5.0',1),version_code('8.5.0',2))
        self.assertGreater(version_code('8.5.0'),1)

    def test_invalid_codes_fail_before_building(self):
        for version,number in [('8.5.0',0),('8.5.0',10000),('8.100.0',1),('22.0.0',1)]:
            with self.subTest(version=version,number=number),self.assertRaises(ValueError):
                version_code(version,number)

    def test_package_lock_and_runtime_match_release(self):
        root=Path(__file__).resolve().parents[1]
        version=json.loads((root/'package.json').read_text())['version']
        lock=json.loads((root/'package-lock.json').read_text())
        self.assertEqual(lock['version'],version)
        self.assertEqual(lock['packages']['']['version'],version)
        self.assertIn(version,(root/'scripts/runtime_config.js').read_text())
        self.assertIn(version,(root/'sw.js').read_text())


if __name__=='__main__':unittest.main()
