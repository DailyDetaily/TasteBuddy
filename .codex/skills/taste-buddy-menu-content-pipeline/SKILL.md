---
name: taste-buddy-menu-content-pipeline
description: Run the existing Taste Buddy restaurant/menu content pipeline for Catchtable or public-source menu collection, OCR review templates, intake CSV generation, seed JSON generation, and optional Supabase import. Use when the user asks to collect restaurant/menu data, prepare menu-level taste content, turn reviewed menu data into CSV/seed files, or sync reviewed menu content.
---

# Taste Buddy Menu Content Pipeline

Use this skill as a thin wrapper around the repository's existing scripts and operational doc. Do not invent a parallel scraper, CSV format, or seed schema.

## Source Of Truth

Read only the relevant section of [catchtable-menu-automation.md](/Users/sinjunho/Desktop/Taste Buddy app/docs/operations/catchtable-menu-automation.md) before running commands. Use the scripts listed there as the implementation source of truth.

Key scripts:

- `scripts/run-catchtable-batch.mjs`
- `scripts/fetch-catchtable-menu-assets.mjs`
- `scripts/fetch-public-restaurant-sources.mjs`
- `scripts/bootstrap-catchtable-review.mjs`
- `scripts/bootstrap-public-source-review.mjs`
- `scripts/ocr-catchtable-menu-assets.mjs`
- `scripts/parse-catchtable-menu-images.mjs`
- `scripts/generate-catchtable-intake-csv.mjs`
- `scripts/generate-catchtable-seed-json.mjs`
- `scripts/sync-catchtable-review-to-supabase.mjs`
- `scripts/import-supabase-seed.mjs`

## Workflow

1. Identify the requested stage and input.
   - Restaurant slug or configured restaurant key: collect/fetch/bootstrap.
   - Reviewed JSON: generate CSV, seed JSON, or sync.
   - Seed JSON: dry-run or real Supabase import.
   - If the user asks for taste vectors, keep them human-reviewed unless a reviewed source file already contains inferred values.

2. Choose the existing command.
   - Batch configured restaurants: `npm run catchtable:batch`
   - Fetch Catchtable assets: `npm run catchtable:fetch -- <slug>`
   - Public fallback fetch: `npm run public-source:fetch -- <restaurant-key>`
   - Bootstrap Catchtable review: `npm run catchtable:bootstrap-review -- <manifest.json>`
   - Bootstrap public fallback review: `npm run public-source:bootstrap-review -- <manifest.json>`
   - OCR: `npm run catchtable:ocr -- <manifest.json> --review <review-template.json>`
   - Parse OCR rows: `npm run catchtable:parse -- <review-template.with-ocr.json>`
   - Generate CSV: `npm run catchtable:generate-csv -- <review-template.json>`
   - Generate seed: `npm run catchtable:generate-seed -- <review-template.parsed.json>`
   - Validate seed dry-run: `npm run seed:supabase -- <seed.json> --dry-run`
   - Sync reviewed JSON dry-run/write: `npm run catchtable:sync-review -- <review-template.parsed.json>` and add `--write` only when the user explicitly asks.

3. Preserve the review boundary.
   - Automated: page/source discovery, menu asset download, manifest creation, OCR extraction, conservative draft rows, CSV/seed generation from reviewed files.
   - Human-reviewed: OCR correction, lunch/dinner confirmation, supplement interpretation, observed vs inferred separation, taste vector tuning.
   - Never present inferred dish taste values as confirmed facts without reviewed evidence.

4. Keep artifacts in the expected places.
   - Scratch fetch/OCR artifacts: `tmp/catchtable/` or `tmp/public-sources/`
   - Intake CSVs: `docs/content/intake/`
   - Supabase seeds: `supabase/seeds/`
   - Do not begin work from generated folders unless consuming an expected artifact from a previous pipeline step.

5. Verify before writing live data.
   - Prefer dry-runs first.
   - For seed imports, run the dry-run importer before any write.
   - Use `--write` only with explicit user authorization and mention the source file being written.

## Output

Report:

- command(s) run
- generated or updated artifact paths
- unresolved human review items
- whether the result is dry-run only or written to Supabase
