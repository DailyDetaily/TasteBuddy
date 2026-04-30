# Scripts Index

This folder contains the content and data pipeline tooling for Taste Buddy.

If you are looking for app source code, this is not the right place. Start in `src/`.

## Quick Map

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
