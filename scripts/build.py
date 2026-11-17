"""Build public assets only: exclude accounts, requests, tests and server source."""
from pathlib import Path
import argparse
import json
import os
import shutil
import subprocess
if __package__:
    from .bundle_updates import write_bundle
else:
    from bundle_updates import write_bundle
ROOT = Path(__file__).resolve().parents[1]
def build(output=None, mode='offline'):
    write_bundle()
    output = Path(output) if output is not None else ROOT / 'dist'
    # A custom destination is for an empty, dedicated preview directory only.
    if output.resolve() == ROOT.resolve() or output.resolve() in ROOT.resolve().parents:
        raise ValueError('Build output must not replace the project or a parent directory.')
    if output.exists():
        shutil.rmtree(output)
    output.mkdir()
    for name in ('index.html', 'app.html', 'manifest.json', 'sw.js'):
        shutil.copy2(ROOT / name, output / name)
    for name in ('styles', 'data', 'Banner-Images', 'Logo-Brandkit', 'assets', 'fonts'):
        shutil.copytree(ROOT / name, output / name, ignore=shutil.ignore_patterns('.*', '__pycache__'))
    (output / 'scripts').mkdir()
    for source in (ROOT / 'scripts').glob('*.js'):
        shutil.copy2(source, output / 'scripts' / source.name)
    vendor = ROOT / 'vendor/pdf_vendor.js'
    if not vendor.exists():
        raise RuntimeError('Run npm ci and npm run bundle once before building.')
    shutil.copy2(vendor, output / 'scripts/pdf_vendor.js')
    shutil.copy2(ROOT / 'vendor/pdf_vendor.js.LEGAL.txt', output / 'scripts/pdf_vendor.js.LEGAL.txt')
    config = {'installPreview': mode != 'pilot', 'mode': mode, 'version': json.loads((ROOT/'package.json').read_text())['version'],
              'updatesUrl': ''}
    (output / 'scripts/runtime_config.js').write_text('window.NucleusRuntime = Object.freeze(' + json.dumps(config) + ');\n')
    if mode == 'android':
        if output.resolve() != (ROOT / 'dist').resolve():
            raise ValueError('Android build must use the standard dist directory.')
        subprocess.run(['node', 'scripts/bundle.mjs', '--android'], cwd=ROOT, check=True)
        shutil.copy2(output / 'app.html', output / 'index.html')
        index = output / 'index.html'
        index.write_text(index.read_text().replace('<!-- NATIVE_BRIDGE -->', '<script src="scripts/native_bridge.js"></script>'))
    return output
if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['offline','pilot','android'], default='offline')
    args=parser.parse_args()
    print(f'Built {build(mode=args.mode)} ({args.mode})')
