# Supabase Layout

This folder holds the database-side artifacts for Taste Buddy.

## Structure

### Migrations

- [`migrations/`](./migrations/)

Schema changes live here.

### Seeds

- [`seeds/`](./seeds/)

Restaurant/menu seed payloads live here.

These seed files are often produced or updated by the scripts in [`../scripts/`](../scripts/).

### Place index

- [`migrations/20260430_place_index.sql`](./migrations/20260430_place_index.sql)

External map providers are stored as a place index layer, separate from Taste Buddy's menu and taste interpretation data. See [`../docs/operations/place-index-api-sync.md`](../docs/operations/place-index-api-sync.md).

### Edge Functions

- [`functions/kakao-place-lookup`](./functions/kakao-place-lookup)
- [`functions/google-place-enrich`](./functions/google-place-enrich)

The app uses these functions to fetch live Kakao Local place details and Google Places enrichment without exposing provider API keys in the browser. Keep `KAKAO_REST_API_KEY` and `GOOGLE_MAPS_API_KEY` as Supabase function secrets.

## Typical Workflow

1. Gather or review content in `docs/content/`
2. Run the ingestion/generation scripts in `scripts/`
3. Produce or update a seed file in `supabase/seeds/`
4. Import it with the seed import script

Example:

```bash
node scripts/import-supabase-seed.mjs supabase/seeds/mvp-content-seed.example.json
```

## What Belongs Here

- migrations that change schema
- seed payloads that are ready to import
- external place index tables and operating-hours sync schema

## What Does Not Belong Here

- product UI logic
- exploratory scratch files
- content research notes

Those belong in `src/`, `tmp/`, or `docs/` depending on the job.
