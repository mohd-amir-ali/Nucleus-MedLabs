"""Audit authored source and the public build without printing sensitive matches."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'node_modules', 'dist', 'android', 'runtime-data', 'releases', '__pycache__', '.git', 'vendor', 'test-results', 'playwright-report'}
TEXT = {'.html', '.css', '.js', '.cjs', '.mjs', '.json', '.py', '.md', '.yml', '.yaml', '.sh', '.svg', '.txt'}
PATTERNS = {
    'nonstandard dash': re.compile('[\u2013\u2014]'),
    'emoji': re.compile('[\U0001f000-\U0001faff\u2600-\u27bf\uFE0F\u200d]'),
    'private key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'credential-shaped token': re.compile(r'(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk_live_[A-Za-z0-9]{20,})'),
}


def audit(root=ROOT):
    problems, count = [], 0
    for path in root.rglob('*'):
        relative = path.relative_to(root)
        if any(part in SKIP or (part.startswith('.') and part != '.github') for part in relative.parts):
            continue
        if not path.is_file() or path.suffix not in TEXT:
            continue
        count += 1
        text = path.read_text(encoding='utf-8')
        for name, pattern in PATTERNS.items():
            if pattern.search(text): problems.append(f'{relative}: {name}')
        if path.suffix in ('.js', '.mjs') and relative.parts[0] in ('scripts', 'native') and re.search(r'console\.log\s*\(', text):
            problems.append(f'{relative}: debug logging')
    build = root / 'dist'
    if build.exists():
        for path in build.rglob('*'):
            if path.suffix in ('.py', '.sqlite3', '.sqlite', '.db', '.jks', '.keystore') or path.name.startswith('.env'):
                problems.append(f'{path.relative_to(root)}: private/build-only file in public bundle')
    return count, problems


if __name__ == '__main__':
    count, problems = audit()
    for problem in problems: print(problem)
    print(f'Audited {count} authored text files; {len(problems)} findings. Vendor code and generated Android files are excluded from punctuation checks.')
    sys.exit(bool(problems))
