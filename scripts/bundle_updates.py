"""Generate the direct-file/offline fallback from the canonical reading edition."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def bundled_source():
    edition = json.loads((ROOT / 'data/updates.json').read_text())
    return ('// Generated from updates.json by scripts/bundle_updates.py.\n'
            'window.NucleusBundledUpdates = ' + json.dumps(edition, ensure_ascii=True, indent=2) + ';\n')


def write_bundle():
    (ROOT / 'data/updates-bundled.js').write_text(bundled_source())


if __name__ == '__main__':
    write_bundle()
