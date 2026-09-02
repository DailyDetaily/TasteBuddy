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
