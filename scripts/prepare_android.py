"""Generate and configure the Android project from pinned Capacitor packages."""
import json
import os
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
ANDROID=ROOT/'android'
NS='http://schemas.android.com/apk/res/android'
ET.register_namespace('android',NS)


def version_code(version, build_number=1):
    major,minor,patch=map(int,version.split('.'))
    if not (0<=minor<100 and 0<=patch<100 and 0<int(build_number)<10000):
        raise ValueError('Use minor/patch below 100 and an Android build number from 1 to 9999.')
    code=major*100000000+minor*1000000+patch*10000+int(build_number)
    if not 0<code<=2100000000:raise ValueError('Android version code exceeds the supported range.')
    return code


def write_icon(destination, adaptive=False, monochrome=False):
    source=ET.parse(ROOT/'Logo-Brandkit/icons/app-dark.svg').getroot()
    vector=ET.Element('vector',{f'{{{NS}}}width':'108dp',f'{{{NS}}}height':'108dp',f'{{{NS}}}viewportWidth':'1024',f'{{{NS}}}viewportHeight':'1024'})
    parent=vector
    if adaptive:
        parent=ET.SubElement(vector,'group',{f'{{{NS}}}scaleX':'0.82',f'{{{NS}}}scaleY':'0.82',f'{{{NS}}}pivotX':'512',f'{{{NS}}}pivotY':'512'})
    for i,path in enumerate(source.findall('{http://www.w3.org/2000/svg}path')):
        if adaptive and i==0:continue
        ET.SubElement(parent,'path',{f'{{{NS}}}fillColor':'#FFFFFF' if monochrome else path.attrib['fill'],f'{{{NS}}}pathData':path.attrib['d']})
    destination.parent.mkdir(parents=True,exist_ok=True)
    ET.ElementTree(vector).write(destination,encoding='utf-8',xml_declaration=True)


def configure():
    resource=ANDROID/'app/src/main/res'
    write_icon(resource/'mipmap-anydpi/ic_launcher.xml')
    write_icon(resource/'mipmap-anydpi/ic_launcher_round.xml')
    write_icon(resource/'drawable/nucleus_launcher_foreground.xml',adaptive=True)
    write_icon(resource/'drawable/nucleus_launcher_monochrome.xml',adaptive=True,monochrome=True)
    adaptive='''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/nucleus_launcher_background" />
  <foreground android:drawable="@drawable/nucleus_launcher_foreground" />
  <monochrome android:drawable="@drawable/nucleus_launcher_monochrome" />
</adaptive-icon>
'''
    for name in ['ic_launcher','ic_launcher_round']:
        (resource/'mipmap-anydpi-v26').mkdir(parents=True,exist_ok=True)
        (resource/'mipmap-anydpi-v26'/f'{name}.xml').write_text(adaptive)
    (resource/'values/nucleus_colors.xml').write_text('<resources><color name="nucleus_launcher_background">#081F32</color></resources>\n')
    styles=resource/'values/styles.xml'
    tree=ET.parse(styles)
    for style in tree.getroot().findall('style'):
        if 'Launch' in style.attrib.get('name',''):
            for item in list(style):
                if item.attrib.get('name') in ('windowSplashScreenAnimatedIcon','windowSplashScreenBackground','android:windowBackground','android:background'):style.remove(item)
            ET.SubElement(style,'item',{'name':'windowSplashScreenAnimatedIcon'}).text='@drawable/nucleus_launcher_foreground'
            ET.SubElement(style,'item',{'name':'windowSplashScreenBackground'}).text='@color/nucleus_launcher_background'
    tree.write(styles,encoding='utf-8',xml_declaration=True)
    manifest=ANDROID/'app/src/main/AndroidManifest.xml'
    tree=ET.parse(manifest); app=tree.getroot().find('application')
    app.set(f'{{{NS}}}allowBackup','false')
    app.set(f'{{{NS}}}usesCleartextTraffic','false')
    app.set(f'{{{NS}}}fullBackupContent','false')
    activity=app.find('activity');activity.set(f'{{{NS}}}windowSoftInputMode','adjustResize')
    tree.write(manifest,encoding='utf-8',xml_declaration=True)
    gradle=ANDROID/'app/build.gradle';text=gradle.read_text()
    version=json.loads((ROOT/'package.json').read_text())['version']
    number=version_code(version,os.environ.get('GITHUB_RUN_NUMBER','1'))
    text=re.sub(r'versionCode\s+\d+',f'versionCode {number}',text)
    text=re.sub(r'versionName\s+"[^"]+"',f'versionName "{version}"',text)
    if 'nucleus-signing.gradle' not in text:text+='\napply from: "nucleus-signing.gradle"\n'
    gradle.write_text(text)
    (ANDROID/'app/nucleus-signing.gradle').write_text('''def keyPath = System.getenv("ANDROID_KEYSTORE_PATH")
if (keyPath) {
    android {
        signingConfigs {
            nucleus {
                storeFile file(keyPath)
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
        buildTypes {
            debug { signingConfig signingConfigs.nucleus }
            release { signingConfig signingConfigs.nucleus }
        }
    }
}
''')


def main():
    if not ANDROID.exists():subprocess.run(['npx','--no-install','cap','add','android'],cwd=ROOT,check=True)
    subprocess.run(['npx','--no-install','cap','sync','android'],cwd=ROOT,check=True)
    wrapper=ANDROID/'gradle/wrapper/gradle-wrapper.properties'
    wrapper.write_text(wrapper.read_text().replace('networkTimeout=10000','networkTimeout=60000').replace('-all.zip','-bin.zip'))
    configure()
    print('Android resources, version and optional signing configured.')


if __name__=='__main__':main()
