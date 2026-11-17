"""Create a source-only upload folder and ZIP using an explicit allowlist."""
from pathlib import Path
import json
import shutil
import zipfile

ROOT=Path(__file__).resolve().parents[1]
FILES=['README.md','LICENSE','THIRD_PARTY_NOTICES.md','.gitignore','package.json','package-lock.json',
       'capacitor.config.json','manifest.json','index.html','app.html','sw.js','playwright.config.cjs',
       'app.py','server.py','install_preview.py','Start-on-WiFi.command','Start-Install-Preview.command']
FOLDERS=['.github','styles','scripts','data','native','fonts','Logo-Brandkit','Banner-Images','assets','tests','docs']


def source_files(root=ROOT):
    paths=[root/name for name in FILES]
    for folder in FOLDERS:
        paths.extend(p for p in (root/folder).rglob('*') if p.is_file() and not p.is_symlink()
                     and '__pycache__' not in p.parts and p.name!='.DS_Store' and p.suffix not in ('.pyc','.log'))
    return sorted(paths)


def main():
    output=ROOT/'releases';output.mkdir(exist_ok=True)
    folder=output/'Nucleus-MedLabs-CareerShift'
    if folder.exists():shutil.rmtree(folder)
    folder.mkdir()
    files=source_files()
    for source in files:
        if source.suffix in ('.jks','.keystore','.apk','.aab','.db','.sqlite3') or source.name.startswith('.env'):
            raise ValueError('Private or generated file in source allowlist: '+source.name)
        target=folder/source.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
    version=json.loads((ROOT/'package.json').read_text())['version']
    archive=output/f'Nucleus-MedLabs-v{version}-source.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as bundle:
        for source in sorted(folder.rglob('*')):
            if source.is_file():bundle.write(source,source.relative_to(output))
    print(f'Packaged {len(files)} files into {archive.name} ({archive.stat().st_size:,} bytes).')
    print('Upload folder: '+str(folder))


if __name__=='__main__':main()
