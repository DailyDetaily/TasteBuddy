#!/usr/bin/env python3
"""명시적으로 실행할 때 iOS의 데이터 계약과 브랜드 자산을 Android에 동기화한다.

앱 빌드는 iOS 소스나 React 빌드를 필요로 하지 않는다.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

android = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--source", type=Path, default=android.parent / "ios" / "TasteBuddy")
args = parser.parse_args()
source = args.source
main = android / "app/src/main"
manifest = {}

def copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)
    manifest[str(dst.relative_to(android))] = {
        "source": "ios/TasteBuddy/" + str(src.relative_to(source)),
        "sha256": hashlib.sha256(src.read_bytes()).hexdigest(),
    }

for folder in ["TBA", "Fixtures", "Images"]:
    for file in sorted((source / "Resources" / folder).glob("*")):
        if file.is_file():
            copy(file, main / "assets" / folder.lower() / file.name)
for file in sorted((source / "Resources").glob("*.otf")):
    copy(file, main / "res/font" / file.name.lower().replace("-", "_"))
for name in ["SplashSymbol", "SplashWordmark"]:
    file = source / f"Resources/Assets.xcassets/{name}.imageset/{name}.svg"
    copy(file, main / "assets/images" / file.name)
copy(source / "Resources/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png", main / "res/drawable-nodpi/app_icon.png")
(android / "shared-assets-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
license_file = android.parent / "ios/LICENSES/Pretendard-LICENSE.txt"
if license_file.exists():
    dest = main / "assets/licenses/Pretendard-LICENSE.txt"
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(license_file, dest)
print(f"데이터 계약·브랜드 자산 {len(manifest)}개 동기화 완료")
