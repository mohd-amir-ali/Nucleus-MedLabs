"""Hash distributable Android files without including signing material."""
from pathlib import Path
import hashlib
root=Path(__file__).resolve().parents[1]/'releases'
files=sorted(p for p in root.iterdir() if p.suffix in ('.apk','.aab'))
(root/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in files))
