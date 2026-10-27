# Google Drive 자료 보관과 복원

이 프로젝트의 지난 테스트 기록과 대용량 이미지·영상은 [Taste Buddy Project Archive](https://drive.google.com/drive/folders/1ggN8XhY_czOAZEdShN7G0D17k6c9wY5e)에 보관한다. Drive 계정은 `xinjunho96@gmail.com`이다. 공유 권한을 추가하지 않은 개인 폴더다.

전체 보관 목록의 색인: `docs/operations/google-drive-archives.json`. 검색·복원 명령은 이 색인에 등록된 모든 보관분을 확인한다.

- `output/storage/google-drive-20261023/manifest.json`: 과거 테스트 결과와 미디어.
- `output/storage/google-drive-20261024-builds/manifest.json`: 과거 웹 빌드 21개와 영상 미리보기 빌드 32개.

2026-10-23 보관: 테스트 결과 묶음 76개와 이미지·영상 등 192개, 내부 파일 총 30,617개(원본 3.29 GB). Drive에는 15개 ZIP을 35개 전송 파일(약 2.61 GB)로 저장했다. 모든 전송 파일의 재다운로드 체크섬과 실제 1,222개 파일의 복원을 확인했다. 사람용 전체 목록은 같은 폴더의 `CATALOG.md`에 있다.

2026-10-24 빌드 보관: 6,614개 파일, 원본 합계 5.48 GB. 중복을 제거한 고유 내용 726.5 MB를 289.34 MB ZIP으로 압축해 4개 조각으로 저장했다. 모든 조각을 Drive에서 다시 내려받아 체크섬을 확인하고, 그 파일만 조합해 전체 6,614개 파일의 복원·해시·수정 시각·권한 검사를 통과했다. Drive 위치는 [Historical Web Builds](https://drive.google.com/drive/folders/1SaXvn2T7E6N6YGFWvA0-y0twbM9o4Tt4)이며, 검증 결과와 전체 경로 목록은 해당 로컬 보관 폴더에 기록한다.

## 자료 찾기

프로젝트 폴더에서 다음 명령을 실행한다.

```sh
python3 scripts/drive-archive.py list
python3 scripts/drive-archive.py find bloom
python3 scripts/drive-archive.py find flow-capture
python3 scripts/drive-archive.py find plating-cursor-check
```

검색 결과에는 원래 프로젝트 경로, ZIP 이름, Drive 링크가 나온다. 대화에서 “Drive에 보관한 Taste Buddy의 ○○ 자료를 꺼내줘”라고 요청해도 이 목록을 기준으로 찾는다.

## 필요한 자료만 복원하기

1. 검색 결과의 Drive 링크에서 해당 ZIP을 `다운로드` 폴더에 받는다. 파일명이 `.zip.001`, `.zip.002`처럼 나뉘어 있으면 해당 묶음의 모든 조각을 같은 폴더에 받는다. 연결 도구의 파일당 100 MiB 제한에 맞춰 각 조각을 90 MiB 이하로 보관한다.
2. 아래의 `ZIP_이름`을 검색 결과의 정확한 파일명으로 바꿔 실행한다.

```sh
python3 scripts/drive-archive.py restore ZIP_이름 --dry-run
python3 scripts/drive-archive.py restore ZIP_이름
```

특정 자료만 꺼내려면 원래 경로의 일부를 지정한다. `.xcresult`는 내부 파일 하나보다 결과 묶음 전체 경로를 지정한다.

```sh
python3 scripts/drive-archive.py restore ZIP_이름 --match 'flow-capture.xcresult/'
python3 scripts/drive-archive.py restore ZIP_이름 --from '/다운로드한/실제/파일.zip'
python3 scripts/drive-archive.py restore taste-buddy-historical-web-builds-20261024.zip --match 'output/plating/color-comments-20261001/site/'
```

스크립트는 `다운로드`, 이 Mac의 Google Drive 폴더, 준비 폴더에서 정확한 ZIP 파일명과 조각을 찾는다. 조각별 체크섬을 확인하고 자동으로 합친 뒤 복원하며, 합치기 위한 임시 ZIP은 사용 후 정리한다. Drive 동기화가 꺼져 있어도 브라우저나 연결된 Drive 도구로 내려받아 `--from`으로 파일 또는 조각이 들어 있는 폴더를 지정할 수 있다. 별도 Python 패키지나 API 키는 필요 없다.

복원 전에 ZIP 전체의 SHA-256을 확인하고, 복원하는 각 파일의 SHA-256도 검사한다. 같은 내용의 로컬 파일은 유지하며, 다른 내용의 기존 파일이나 심볼릭 링크가 있으면 중단한다. 원래 상대 경로·수정 시각·권한을 복구한다. 확장 속성이 저장된 경우 함께 복구하지만 macOS가 관리하는 `com.apple.provenance`는 목록에만 남기고 새 파일에 대한 운영체제의 값을 유지한다. Drive 폴더를 저장소 전체에 연결하거나 앱 실행 중 자동으로 내려받는 구조는 아니다.

## 보관 범위와 유지할 파일

- 2026-10-22 00:00 KST 이전의 추적되지 않는 `.xcresult` 묶음과 1 MiB 이상의 과거 이미지·영상·참조 바이너리를 대상으로 한다.
- Git이 추적하는 파일, 앱 소스, `public`과 네이티브 런타임 자산, 코드에서 참조하는 원본, 편집 전 소스 스냅샷, 최근 작업은 로컬에 유지한다.
- 2026-10-24 추가 보관은 고정 목록의 지난 웹 빌드와 Remotion 미리보기 빌드만 대상으로 한다. 현재 `dist`, 소스, 실행 자산, 의존성, Git 이력, Xcode의 사용 중인 캐시, 데이터베이스와 계정 설정은 유지한다. Remotion 빌드의 `public` 심볼릭 링크 32개는 현재 자산을 가리키므로 로컬에 남긴다.
- 2026-10-23 ZIP은 원래 경로를 유지한다. 2026-10-24 ZIP은 같은 내용의 파일을 `objects/<SHA-256>` 하나로 합치고 `ARCHIVE-MANIFEST.json`에서 원래 경로를 대응시킨다. 후자는 일반 압축 해제만으로 폴더 구조가 복구되지 않으므로 위 복원 스크립트를 사용한다.
- sparse 파일과 APFS 공유 블록 때문에 폴더의 파일 크기 합계가 실제 디스크 점유와 다를 수 있다. 정리 대상의 논리적 크기와 관측한 디스크 여유 공간 변화를 구분한다.
- 업로드 결과, Drive 메타데이터 크기, Drive에서 다시 받은 전체 파일의 SHA-256이 일치한 항목만 로컬에서 이동 완료 처리한다. 업로드 실패나 미확인 항목의 원본은 유지한다.
- 이 문서, 복원 스크립트, 로컬 `manifest.json`은 함께 유지한다. Drive에도 목록과 복원 스크립트의 사본을 저장한다. 영구 링크와 파일 ID만 저장하고 일시적인 다운로드 URL이나 인증 토큰을 보관하지 않는다.

## 이후 Codex 작업

자료가 원래 경로에 없으면 재생성하거나 실패로 단정하기 전에 보관 목록을 검색한다. 필요한 ZIP의 파일 ID를 이용해 연결된 Google Drive 도구로 메타데이터를 확인한 뒤 원본 ZIP을 내려받고, 이 복원 스크립트로 필요한 경로를 복구한다. 기존 로컬 변경을 덮어쓰지 않는다. 새 자료를 보관할 때도 먼저 고정 목록을 만들고 업로드·다운로드 검증을 마친 뒤 해당 목록의 원본만 이동한다. 이 문서는 자동 정기 업로드를 설정하지 않는다.
