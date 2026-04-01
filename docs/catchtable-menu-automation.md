# Catchtable Menu Automation

## Goal

Automate the repeatable part of the Catchtable content workflow:

1. Find the public Catchtable `menus` page for a restaurant slug.
2. Extract menu list metadata from the page.
3. Download the public menu images.
4. Save a machine-readable manifest for review.
5. Hand off the reviewed result to CSV / seed generation.

The pipeline is intentionally **semi-automatic**. Menu collection is automated first, and dish-level interpretation remains human-reviewed.

## Why Script First

For this repo, the stable unit of automation is a project script, not a Codex skill.

- A script gives us a repeatable engine that can be rerun on any machine.
- A script leaves artifacts in the repo workspace (`tmp/`, `docs/`, `supabase/seeds/`).
- A script is easier to test, version, and compose with later steps.

A Codex skill can be added later, after the scripts are stable. At that point the skill becomes a workflow wrapper around existing commands.

## Recommended Pipeline

### Stage 0: Batch-run a restaurant set

Script:

- `scripts/run-catchtable-batch.mjs`

Config:

- `scripts/config/catchtable-target-restaurants.json`

Output:

- `tmp/catchtable/batch-summary.json`

What it automates:

- tests slug candidates in order
- runs fetch for the first working slug
- bootstraps a review template with restaurant / chef metadata
- falls back to public-source collection when Catchtable has no public menu entry
- optionally attempts OCR for restaurants with downloaded menu images
- leaves a machine-readable batch summary for follow-up

### Stage 0.5: Public-source fallback for blocked restaurants

Scripts:

- `scripts/fetch-public-restaurant-sources.mjs`
- `scripts/bootstrap-public-source-review.mjs`

Input:

- `scripts/config/catchtable-target-restaurants.json`
- restaurant key such as `la-yeon-seoul`, `sosuheon-seoul`

Output:

- `tmp/public-sources/<restaurant>/manifest.json`
- `tmp/public-sources/<restaurant>/review-template.json`

What it automates:

- fetches official pages, official menu PDFs, or curated public articles when Catchtable is unavailable
- stores mirrored markdown snapshots for auditability
- follows linked menu PDFs, downloads them, renders page images, and extracts text locally
- extracts conservative `courseTitleDrafts` from public text, image alt labels, and PDF page OCR
- creates a fallback review template that can be manually converted into intake CSVs

### Stage 1: Fetch menu assets

Script:

- `scripts/fetch-catchtable-menu-assets.mjs`

Input:

- Catchtable shop slug such as `jungsik`, `mingles`, `onjium`

Output:

- `tmp/catchtable/<slug>/menus-page.md`
- `tmp/catchtable/<slug>/manifest.json`
- `tmp/catchtable/<slug>/images/*`

What it automates:

- Build the public Catchtable menu page URL.
- Fetch the text-mirrored menu page.
- Extract menu entry links and menu image URLs.
- Download the image assets.
- Produce a manifest that downstream scripts can consume.

### Stage 2: Bootstrap a review template

Script:

- `scripts/bootstrap-catchtable-review.mjs`

Input:

- `tmp/catchtable/<slug>/manifest.json`

Output:

- `tmp/catchtable/<slug>/review-template.json`

What it automates:

- copies restaurant/menu metadata from the manifest
- prepares lunch / dinner buckets
- fills source metadata for each menu
- creates an editable `rows` array for each menu

### Stage 3: OCR menu images

Scripts:

- `scripts/ocr-image-with-vision.swift`
- `scripts/ocr-catchtable-menu-assets.mjs`

Input:

- `tmp/catchtable/<slug>/manifest.json`
- downloaded menu images

Output:

- `tmp/catchtable/<slug>/ocr-output.json`
- optional `tmp/catchtable/<slug>/review-template.with-ocr.json`

What it automates:

- runs macOS Vision OCR locally
- extracts line-by-line text from each menu image
- reassigns menu images more intelligently when a restaurant has extra award / wine pages mixed into Catchtable assets
- stores OCR output as JSON
- can merge OCR text into the review template for easier manual cleanup

### Stage 4: Parse menu images into structured rows

Script:

- `scripts/parse-catchtable-menu-images.mjs`

Input:

- `tmp/catchtable/<slug>/manifest.json`
- downloaded images

Output:

- a reviewed `menu-rows.json` or `menu-rows.csv`

What it automates:

- reads OCR lines from `review-template.with-ocr.json`
- creates `rows` drafts for lunch / dinner
- separates core courses from supplement candidates
- leaves conservative placeholders for human review

### Stage 5: Generate intake CSV

- Script:

- `scripts/generate-catchtable-intake-csv.mjs`

Input:

- reviewed `review-template.json`

Output:

- `docs/mvp-content-intake-<restaurant>-lunch.csv`
- `docs/mvp-content-intake-<restaurant>-dinner.csv`

What it should do:

- fill the shared intake header
- map course positions
- create placeholder `inferred_*` values or reuse curated defaults
- keep a review note for uncertain rows

### Stage 6: Generate seed JSON from reviewed Catchtable data

Script:

- `scripts/generate-catchtable-seed-json.mjs`

Input:

- reviewed `review-template.parsed.json`

Output:

- `supabase/seeds/<restaurant>-catchtable.seed.json`

What it automates:

- creates `restaurants`, `chefs`, `source_documents`, `dish_entities`
- converts reviewed `observed` arrays into `dish_observed_facts`
- converts inferred numeric fields into `dish_inference_profiles`
- preserves OCR evidence text in each source document
- keeps seed JSON aligned with `scripts/import-supabase-seed.mjs`

### Stage 7: Import into Supabase

Already available:

- `scripts/import-supabase-seed.mjs`

## Human Review Boundary

The first automation script should not guess hidden recipes.

Keep the boundaries clear:

- Automated:
  - menu page discovery
  - menu entry extraction
  - image download
  - manifest creation
- Human-reviewed:
  - OCR correction
  - lunch / dinner confirmation
  - supplement interpretation
  - `observed` vs `inferred` separation
  - taste vector tuning

## When To Add A Codex Skill

Add a Codex skill after these conditions are true:

1. the fetch script is stable
2. the OCR / CSV generation path exists
3. the command sequence is predictable

At that point the skill can standardize prompts like:

- "Fetch Catchtable menu assets for `jungsik`"
- "Turn the fetched menu set into lunch / dinner intake CSVs"
- "Convert reviewed intake CSVs into seed JSON"

Until then, the repo should prefer scripts first and a skill second.

## Usage

Fetch a restaurant menu set:

```bash
npm run catchtable:fetch -- jungsik
```

Run the configured restaurant batch:

```bash
npm run catchtable:batch
```

Run the public-source fallback directly for a blocked restaurant:

```bash
npm run public-source:fetch -- la-yeon-seoul
npm run public-source:bootstrap-review -- tmp/public-sources/la-yeon-seoul/manifest.json
```

Auto-fill conservative row drafts from a public-source review:

```bash
npm run public-source:fill-review -- tmp/public-sources/evett-seoul/review-template.json
```

Choose a custom output directory:

```bash
npm run catchtable:fetch -- jungsik --out-dir tmp/catchtable/jungsik-manual-run
```

Skip image downloads and only build the manifest:

```bash
npm run catchtable:fetch -- jungsik --no-download-images
```

Create a review template from the manifest:

```bash
npm run catchtable:bootstrap-review -- tmp/catchtable/jungsik/manifest.json --chef-name "Yim Jung-sik"
```

Run OCR on the downloaded menu images:

```bash
npm run catchtable:ocr -- tmp/catchtable/jungsik/manifest.json --review tmp/catchtable/jungsik/review-template.json
```

Generate auto-parsed row drafts from OCR:

```bash
npm run catchtable:parse -- tmp/catchtable/jungsik/review-template.with-ocr.json
```

Generate lunch / dinner CSV files from the reviewed JSON:

```bash
npm run catchtable:generate-csv -- tmp/catchtable/jungsik/review-template.json
```

Generate a Supabase-ready seed JSON from the reviewed Catchtable data:

```bash
npm run catchtable:generate-seed -- tmp/catchtable/jungsik/review-template.parsed.json
```

Dry-run validate the generated seed against the existing importer:

```bash
npm run seed:supabase -- supabase/seeds/jungsik-catchtable.seed.json --dry-run
```

Or run the reviewed JSON through generation + importer in one command:

```bash
npm run catchtable:sync-review -- tmp/catchtable/jungsik/review-template.parsed.json
```

Write to the real Supabase project only when you are ready:

```bash
npm run catchtable:sync-review -- tmp/catchtable/jungsik/review-template.parsed.json --write
```

## Current Status

Implemented now:

- Catchtable menu list fetch
- public-source fallback fetch for blocked restaurants
- linked PDF download and PDF page extraction for public fallback sources
- image extraction
- menu link extraction
- manifest generation
- image download
- review template generation
- public-source fallback review generation
- OCR output generation via macOS Vision
- PDF page OCR-assisted draft extraction
- OCR merge into review template
- row draft generation from OCR
- intake CSV generation from reviewed JSON
- seed JSON generation from reviewed Catchtable data
- reviewed JSON -> Supabase import wrapper

Still manual for now:

- correcting OCR mistakes
- reviewing auto-generated rows
- final content QA before real Supabase import
