# Scripts Index

This folder contains the content and data pipeline tooling for Taste Buddy.

If you are looking for app source code, this is not the right place. Start in `src/`.

## Quick Map

### Local regression tests

Run `npm ci` followed by `npm test` to check taste scoring, the food knowledge dataset, review identity/synchronization, server-derived learning, and account/data safety. The runner is [`test-taste-survey-scoring.mjs`](./test-taste-survey-scoring.mjs).

Database tests use PGlite, an isolated PostgreSQL engine, and media tests use mocked HTTP requests. These tests do not modify the linked Supabase project or delete real user media.

### Local preview helpers

- [`open-design-system.mjs`](./open-design-system.mjs)
  Opens the app, design system, or design system update preview in Chrome.

### Catchtable ingestion pipeline

- [`fetch-catchtable-menu-assets.mjs`](./fetch-catchtable-menu-assets.mjs)
- [`ocr-catchtable-menu-assets.mjs`](./ocr-catchtable-menu-assets.mjs)
- [`parse-catchtable-menu-images.mjs`](./parse-catchtable-menu-images.mjs)
- [`generate-catchtable-intake-csv.mjs`](./generate-catchtable-intake-csv.mjs)
- [`generate-catchtable-seed-json.mjs`](./generate-catchtable-seed-json.mjs)
- [`sync-catchtable-review-to-supabase.mjs`](./sync-catchtable-review-to-supabase.mjs)

### Public source pipeline

- [`fetch-public-restaurant-sources.mjs`](./fetch-public-restaurant-sources.mjs)
- [`bootstrap-public-source-review.mjs`](./bootstrap-public-source-review.mjs)
- [`fill-public-review-rows.mjs`](./fill-public-review-rows.mjs)

### Review/bootstrap helpers

- [`bootstrap-catchtable-review.mjs`](./bootstrap-catchtable-review.mjs)
- [`bootstrap-public-source-review.mjs`](./bootstrap-public-source-review.mjs)

### Seed generation and import

- [`generate-intake-seed-json.mjs`](./generate-intake-seed-json.mjs)
- [`import-supabase-seed.mjs`](./import-supabase-seed.mjs)

### Place index sync

- [`sync-place-index.mjs`](./sync-place-index.mjs)
  Fetches restaurant place candidates from Kakao, Naver, or Google and upserts them into Supabase.

### Native food API smoke test

- [`smoke-nongsaro-native-food.mjs`](./smoke-nongsaro-native-food.mjs)
  Checks the Nongsaro native food OpenAPI connection using `NONGSARO_API_KEY` from `.env.local`.
- [`fetch-nongsaro-native-food-dataset.mjs`](./fetch-nongsaro-native-food-dataset.mjs)
  Fetches Nongsaro native food list/detail records and writes a raw JSON dataset for later TBA normalization.

### TBA food knowledge dataset

- [`build-tba-food-knowledge-dataset.mjs`](./build-tba-food-knowledge-dataset.mjs)
  Builds normalized FoodOn, Korean standard food, native food, and final TBA food knowledge bridge datasets.
- [`extract-korean-standard-food-catalog.py`](./extract-korean-standard-food-catalog.py)
  Extracts only Korean food names, food groups, English names, and scientific names from the Korean food composition XLSX.

### TBA 데이터 플랫폼 로컬 파일럿

- [`tba-platform-pilot/run-pilot.mjs`](./tba-platform-pilot/run-pilot.mjs)
  실제 음식 자료 7개와 명시적인 가상 사용자 기록을 메모리 내 PGlite에 연결해 저장·수정·삭제, 규칙 우선 정제와 여러 출력 재사용을 검증한다. 운영 DB와 앱에 연결하지 않으며 모델은 학습하지 않는다.
- [`tba-platform-pilot/semantic-lexicon.json`](./tba-platform-pilot/semantic-lexicon.json), [`tba-platform-pilot/rules.mjs`](./tba-platform-pilot/rules.mjs)
  원본 845개 표현의 ID·라벨을 보존한 의미사전과 선택형·짧은 글의 규칙 추출기다. 정보 부족과 문맥 연결이 필요한 입력을 구분한다.
- [`tba-platform-pilot/ai-extraction.mjs`](./tba-platform-pilot/ai-extraction.mjs)
  규칙이 문맥 연결을 해결하지 못할 때만 Responses API를 호출한다. 원문·범위·버전을 검증하고 조회와 해석 재생성에서는 호출하지 않는다.
- [`tba-platform-pilot/insight-views.mjs`](./tba-platform-pilot/insight-views.mjs)
  원문·소유자·추출 상태를 보존해 현재 관찰을 정제하고 경험 요약·속성 프로필·시점과 대상의 차이·반복 기록·조합·선호 수준·확인 후보를 생성한다. 실제 그룹 연결·추천은 계산하지 않는다.
- [`tba-platform-pilot/semantic-evaluation.mjs`](./tba-platform-pilot/semantic-evaluation.mjs)
  선택형 43개·짧은 글 77개를 분리해 120개 고정 예문을 평가한다. 실제 모델 정확도와 구분한 회귀평가다.
- 검증: `node --test scripts/tba-platform-pilot/*.test.mjs`
- 의미사전 연결 검사: `node scripts/tba-platform-pilot/build-semantic-lexicon.mjs --check`
- 기준 예문 검사: `node scripts/tba-platform-pilot/semantic-evaluation.mjs --check`
- 실행: `node scripts/tba-platform-pilot/run-pilot.mjs`
- 실제 AI 별도 검증: `node scripts/tba-platform-pilot/live-ai-validation.mjs`
  `OPENAI_API_KEY`가 설정된 셸에서 후보 문장만 처리하며 재시도 포함 최대 20회다. 키가 없으면 0회·미검증으로 끝난다. `TBA_AI_MODEL`로 초기 모델을 교체할 수 있다.
- 범위와 결과: [`tba-platform-pilot-report.md`](../docs/product/tba-platform-pilot-report.md)

### TBA 개인 취향 엔진 평가

- [`tba-engine/evaluate.mjs`](./tba-engine/evaluate.mjs), [`tba-engine/validation-cases.mjs`](./tba-engine/validation-cases.mjs)
  추가 가상 시나리오 12개를 실제 저장·정제·인사이트·타입 경로로 평가한다. 항상 오프라인으로 실행하며, 미해석 상태의 보존과 의미 추출 성공을 구분한다.
- 실행: `node scripts/tba-engine/evaluate.mjs --output docs/product/tba-engine-evaluation-results.json`
- 검증: `node --test scripts/tba-engine/*.test.mjs`
- 결과와 한계: [`tba-engine-validation.md`](../docs/product/tba-engine-validation.md)

### Normalization and utilities

- [`normalize-supabase-content-korean.mjs`](./normalize-supabase-content-korean.mjs)
- [`utils/content-localization.mjs`](./utils/content-localization.mjs)

### Swift OCR helpers

- [`extract-pdf-with-pdfkit.swift`](./extract-pdf-with-pdfkit.swift)
- [`ocr-image-with-vision.swift`](./ocr-image-with-vision.swift)

## Common Workflows

### Open the app previews

```bash
npm run dev:app
npm run dev:design-system
npm run dev:design-system-updates
```

### Catchtable menu pipeline

Typical order:

1. fetch assets
2. OCR assets
3. parse OCR output
4. generate intake CSV
5. generate seed JSON
6. import or sync to Supabase

Example commands:

```bash
node scripts/fetch-catchtable-menu-assets.mjs
node scripts/ocr-catchtable-menu-assets.mjs
node scripts/parse-catchtable-menu-images.mjs
node scripts/generate-catchtable-intake-csv.mjs
node scripts/generate-catchtable-seed-json.mjs
node scripts/import-supabase-seed.mjs supabase/seeds/example.seed.json
```

### Place index API sync

```bash
npm run place-index:sync -- --provider kakao --query "정식당" --restaurant-slug jungsik --limit 3
npm run place-index:sync -- --provider google --query "Jungsik Seoul" --restaurant-slug jungsik --with-hours --limit 1
```

### Nongsaro native food API smoke test

```bash
npm run native-food:smoke
npm run native-food:smoke -- --query 비빔밥 --rows 5 --detail
```

### Nongsaro native food raw dataset

```bash
npm run native-food:fetch
npm run native-food:fetch -- --limit 100 --rows 50
npm run native-food:fetch -- --all --rows 100
npm run native-food:fetch -- --query 비빔밥 --limit 20 --out data/native-food/raw/bibimbap.json
```

### TBA food knowledge dataset

```bash
npm run food-knowledge:build
npm run native-food:fetch -- --all --rows 100
npm run food-knowledge:build -- --native-source data/native-food/raw/nongsaro-native-food-dataset.json
npm run food-knowledge:runtime
```

### Public source review workflow

```bash
node scripts/fetch-public-restaurant-sources.mjs
node scripts/bootstrap-public-source-review.mjs
node scripts/fill-public-review-rows.mjs
```

## Related Files

- Config: [`config/catchtable-target-restaurants.json`](./config/catchtable-target-restaurants.json)
- Supabase schema and seeds: [`../supabase/README.md`](../supabase/README.md)
- Place index setup: [`../docs/operations/place-index-api-sync.md`](../docs/operations/place-index-api-sync.md)
- Supporting content docs: [`../docs/content/`](../docs/content/)

### 감각 상세와 네이티브 계약

- `tba-engine/sensory-understanding.mjs`: 같은 음식·대상·시점의 감각 존재, 강도, 직접 평가, 상세 묘사와 부재 조건을 분리한다. 미분류 표현은 원문과 함께 확인 대기로 남긴다.
- `tba-engine/personal-taste-model.mjs`: 식사 단위의 명시 평가와 조건별 분포·반례·유보를 계산한다. 원출처, 시간 경계, 미관찰 조건과 다음 질문을 보존하며 `index.mjs`의 실제 저장·분석 경로에 연결된다.
- `build-personal-taste-model-contract.mjs [--check]`: 조건부 개인 모델 v2의 데이터 전용 JS/Swift 대조 계약 21개를 생성하거나 확인한다. 알맞음·전체 평가 교차·질문 영향의 의미 검사는 `tba-engine/personal-taste-insights.test.mjs`에 있다.
- `tba-engine/advanced-personal-evaluation.mjs docs/product/tba-advanced-model-evaluation-results.json`: 동결한 의미 사례와 합성 시계열 비교를 실행한다. 식사·개인·시점 경계를 지키며 실제 사용자 정확도와는 구분한다.
- `build-tba-sensory-native-contract.mjs [--check]`: 규칙·845개 어휘·정제 예문·메인/윙 예문을 데이터 전용 JSON으로 내보내거나 현재 파일과 비교한다. Swift 구현은 별도로 유지한다.
- `build-dining-sensory-selection-contract.mjs [--check]`: 현재 미각 버블 72개·디테일 태그 60개의 ID·의미 계약과 선택 비교 예문 277개를 내보낸다. `structured_sensory` 입력은 선택 당시 라벨과 직접 평가·조건을 보존하며 자유 문장으로 다시 해석하지 않는다.
- `tba-engine/sensory-review-evaluation.mjs --output docs/product/tba-sensory-review-results.json`: 개발 검토 문장 50개를 재평가한다. 상세 회수·호감 회수·원문 무결성·미해석을 별도로 보고하며 미해석을 성공으로 세지 않는다.
- 앱 연결 및 품질 한계: [감각 모델과 앱 연결](../docs/product/tba-native-sensory-integration.md).
- 선택형 주 입력과 독립 평가: [미각 버블·디테일 태그 수집](../docs/product/tba-structured-selection-intake.md).
