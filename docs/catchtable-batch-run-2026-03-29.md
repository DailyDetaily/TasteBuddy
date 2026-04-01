# Catchtable Batch Run

Date:
- `2026-03-29`

Goal:
- `소수헌`
- `모수`
- `에빗`
- `라연`
- `레스토랑 알렌`
- `권숙수`
- `미토우`
- `스와니예`
- `알라프리마`

## Success

### 모수
- Slug: `tempmosuseoul`
- Chef: `안성재`
- Result: `manifest + review template 생성`
- Output:
  - `tmp/catchtable/tempmosuseoul/manifest.json`
  - `tmp/catchtable/tempmosuseoul/review-template.json`
- Notes:
  - 메뉴 항목 `3개`
  - 공개 메뉴 이미지 `0개`

### 에빗
- Slug: `evett`
- Chef: `조셉 리저우드`
- Result: `manifest + review template 생성`
- Output:
  - `tmp/catchtable/evett/manifest.json`
  - `tmp/catchtable/evett/review-template.json`
- Notes:
  - 메뉴 항목 `10개`
  - 공개 메뉴 이미지 `0개`

### 권숙수
- Slug: `kwonsooksoo`
- Chef: `권우중`
- Result: `manifest + review template 생성`
- Output:
  - `tmp/catchtable/kwonsooksoo/manifest.json`
  - `tmp/catchtable/kwonsooksoo/review-template.json`
- Notes:
  - 메뉴 항목 `3개`
  - 공개 메뉴 이미지 `0개`

### 미토우
- Slug: `mitou`
- Chef: `권영운 / 김보미`
- Result: `manifest + review template 생성`
- Output:
  - `tmp/catchtable/mitou/manifest.json`
  - `tmp/catchtable/mitou/review-template.json`
- Notes:
  - 메뉴 항목 `1개`
  - 공개 메뉴 이미지 `0개`

### 레스토랑 알렌
- Slug: `allen`
- Chef: `서현민`
- Result: `manifest + review template 생성`
- Output:
  - `tmp/catchtable/allen/manifest.json`
  - `tmp/catchtable/allen/review-template.json`
- Notes:
  - 메뉴 항목 `2개`
  - 공개 메뉴 이미지 `0개`

### 스와니예
- Slug: `soigneseoul`
- Chef: `이준`
- Result: `manifest + review template 생성`
- Output:
  - `tmp/catchtable/soigneseoul/manifest.json`
  - `tmp/catchtable/soigneseoul/review-template.json`
  - `tmp/catchtable/soigneseoul/images/`
- Notes:
  - 메뉴 항목 `4개`
  - 공개 메뉴 이미지 `2개`
  - OCR 단계는 로컬 Swift/Vision 환경 문제로 중단

### 알라프리마
- Slug: `allaprima`
- Chef: `김진혁`
- Result: `manifest + review template 생성`
- Output:
  - `tmp/catchtable/allaprima/manifest.json`
  - `tmp/catchtable/allaprima/review-template.json`
  - `tmp/catchtable/allaprima/images/`
- Notes:
  - 메뉴 항목 `2개`
  - 공개 메뉴 이미지 `5개`
  - OCR 단계는 로컬 Swift/Vision 환경 문제로 중단

## Catchtable Blocked, Public Fallback Ready

### 소수헌
- Tried slug: `sosuheon`
- Catchtable result: `No menu entries were found`
- Fallback result: `public manifest + review template 생성`
- Output:
  - `tmp/catchtable/sosuheon/`
  - `tmp/public-sources/sosuheon-seoul/manifest.json`
  - `tmp/public-sources/sosuheon-seoul/review-template.json`
- Notes:
  - 최신 대체 source: `Korea JoongAng Daily Michelin 2026 article`
  - 코스 수준 메뉴는 아직 없고 소개형 reference source만 확보

### 라연
- Tried slug:
  - `layeon`
  - `layeonseoul`
  - `layeon_shilla`
  - `shillalayeon`
  - `hotelshillalayeon`
  - `layeonhotel`
  - `shillalayeonseoul`
- Catchtable result: `No menu entries were found`
- Fallback result: `public manifest + review template 생성`
- Output:
  - `tmp/catchtable/layeon/`
  - `tmp/public-sources/la-yeon-seoul/manifest.json`
  - `tmp/public-sources/la-yeon-seoul/review-template.json`
- Notes:
  - 최신 대체 source: `The Shilla Seoul dining page`
  - 이미지 alt 텍스트에서 코스명 draft 일부 추출됨

### 레스토랑 알렌 대체 slug
- Tried slug:
  - `restaurantallen`
  - `allenseoul`
- Result: `No menu entries were found`
- Output:
  - `tmp/catchtable/restaurantallen/`

## OCR Blocker

Current blocker:
- `scripts/ocr-catchtable-menu-assets.mjs` 실행 시 로컬 Swift toolchain / macOS SDK mismatch 발생

Observed error:
- `failed to build module 'Swift'; this SDK is not supported by the compiler`

Mitigation already applied:
- Swift module cache를 workspace 아래 `tmp/swift-module-cache`로 바꾸어 sandbox write 오류는 줄임

Remaining action:
- 로컬 Xcode / Command Line Tools 버전 정렬 후 다시 아래 명령 재실행

```bash
npm run catchtable:ocr -- tmp/catchtable/soigneseoul/manifest.json --review tmp/catchtable/soigneseoul/review-template.json
npm run catchtable:parse -- tmp/catchtable/soigneseoul/review-template.with-ocr.json
npm run catchtable:ocr -- tmp/catchtable/allaprima/manifest.json --review tmp/catchtable/allaprima/review-template.json
npm run catchtable:parse -- tmp/catchtable/allaprima/review-template.with-ocr.json
```
