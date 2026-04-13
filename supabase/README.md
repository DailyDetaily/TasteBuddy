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

## What Does Not Belong Here

- product UI logic
- exploratory scratch files
- content research notes

Those belong in `src/`, `tmp/`, or `docs/` depending on the job.
