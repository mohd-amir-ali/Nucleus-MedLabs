"""Initialize a clean source export with the maintainer's verified identity."""
import argparse
from pathlib import Path
import re
import subprocess
from package_release import source_files

ROOT=Path(__file__).resolve().parents[1]
GROUPS=[
 ('build: configure CareerShift web and Android project', ['.gitignore','package.json','package-lock.json','capacitor.config.json','manifest.json']),
 ('feat(brand): add official marks, healthcare banners and licensed fonts', ['Logo-Brandkit','Banner-Images', 'assets','fonts','LICENSE','THIRD_PARTY_NOTICES.md']),
 ('feat(data): define healthcare pathways and source-linked industry reading', ['data']),
 ('style(ui): adapt shared components for phone and tablet screens', ['styles','index.html','app.html']),
 ('feat(workspace): implement career planning, saved progress and portable reports', ['scripts/*.js','sw.js','native']),
 ('build(android): prepare native assets and reproducible public bundles', ['scripts/*.py','scripts/*.mjs','app.py','server.py','install_preview.py','Start-on-WiFi.command','Start-Install-Preview.command']),
 ('test: cover accounts, workspace isolation, reports and responsive flows', ['tests','playwright.config.cjs']),
 ('ci(release): automate web deployment, Android builds and publishing guidance', ['.github','docs','README.md']),
]


def git(*args):
    subprocess.run(['git',*args],cwd=ROOT,check=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--email',required=True);parser.add_argument('--owner',default='mohd-amir-ali')
    parser.add_argument('--repo',default='Nucleus-MedLabs-CareerShift');parser.add_argument('--push',action='store_true')
    args=parser.parse_args()
    if not re.fullmatch(r'[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+',args.email):parser.error('Use your verified GitHub email.')
    if any(not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,99}',v) for v in (args.owner,args.repo)):parser.error('Invalid owner or repository name.')
    if any((p/'.git').exists() for p in (ROOT,*ROOT.parents)):
        parser.error('Existing Git history detected. Use the existing repository; this helper never replaces history.')
    # Expand paths before initializing so private/generated files cannot be staged.
    allowed={p.resolve() for p in source_files()};groups=[];seen=set()
    for message,patterns in GROUPS:
        selected=[]
        for pattern in patterns:
            for item in ROOT.glob(pattern):
                candidates=item.rglob('*') if item.is_dir() else [item]
                for path in candidates:
                    if path.is_file() and path.resolve() in allowed and path.resolve() not in seen:
                        selected.append(str(path.relative_to(ROOT)));seen.add(path.resolve())
        if not selected:parser.error('Empty commit group: '+message)
        groups.append((message,sorted(selected)))
    if allowed!=seen:parser.error('The commit groups do not cover the complete source export.')
    git('init','-b','main');git('config','user.name','Mohd Amir Ali');git('config','user.email',args.email)
    for message,paths in groups:
        git('add','--',*paths);git('commit','-m',message)
    remote='https://github.com/'+args.owner+'/'+args.repo+'.git';git('remote','add','origin',remote)
    if args.push:git('push','-u','origin','main')
    else:print('Local commits created. When the empty remote exists, run: git push -u origin main')


if __name__=='__main__':main()
