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

### Media assets

- [`migrations/20260513_media_assets_r2.sql`](./migrations/20260513_media_assets_r2.sql)
- [`migrations/20260528_feedback_item_dish_card_details.sql`](./migrations/20260528_feedback_item_dish_card_details.sql)

Public media files live in Cloudflare R2. Supabase stores the metadata and relationships through `media_assets`, while existing fields such as `chefs.avatar_path` can continue to store object keys like `chefs/jungsik.png`. See [`../docs/operations/cloudflare-r2-media-storage.md`](../docs/operations/cloudflare-r2-media-storage.md).

Feedback reflection photos use the same public media origin. `feedback_items` stores the R2 object key plus the dish kind/detail tag metadata needed to rebuild the private feedback card.

### Social taste graph

- [`migrations/20260527_taste_agent_social_seed.sql`](./migrations/20260527_taste_agent_social_seed.sql)
- [`migrations/20260527_taste_agent_social_dev_enrichment.sql`](./migrations/20260527_taste_agent_social_dev_enrichment.sql)

`taste_social_profiles` and `taste_dining_reviews` back the TasteBuddyAgent social discovery surface. They store public/followers/private visibility, seed metadata, taste measurement summaries, and public dining reviews. RLS lets authenticated users read public records, read followers records only through `profile_friendships`, and write only records tied to their own `profiles.id`.

### Profile search and saved restaurants

- [`migrations/20260528_profile_identity_search.sql`](./migrations/20260528_profile_identity_search.sql)
- [`migrations/20260528_restaurant_bookmarks_by_email.sql`](./migrations/20260528_restaurant_bookmarks_by_email.sql)

`search_profiles_by_identity()` searches display name and nickname together while keeping `search_profiles_by_nickname()` as a compatibility wrapper. Restaurant bookmarks retain the lowercase `owner_email` client contract and are bound to their Auth account by `owner_user_id`. Account deletion removes owned rows; another account using the same email cannot inherit them. localStorage remains the offline fallback.

### Edge Functions

- [`functions/kakao-place-lookup`](./functions/kakao-place-lookup)
- [`functions/google-place-enrich`](./functions/google-place-enrich)
- [`functions/delete-account`](./functions/delete-account)
- [`functions/upload-feedback-reflection-photo`](./functions/upload-feedback-reflection-photo)

The app uses these functions to fetch live Kakao Local place details and Google Places enrichment without exposing provider API keys in the browser. Keep `KAKAO_REST_API_KEY` and `GOOGLE_MAPS_API_KEY` as Supabase function secrets.

`delete-account` verifies the caller's JWT, coordinates in-flight media uploads, removes their R2 media, purges the public media cache, and deletes the Auth user with `SUPABASE_SERVICE_ROLE_KEY` only after cleanup succeeds. Keep server credentials in Supabase function secrets. See [deployment order and configuration](../docs/operations/premerge-data-safety-release.md) before releasing these changes.

`upload-feedback-reflection-photo` accepts an authenticated image upload, validates the file type/size, writes it to Cloudflare R2 under `feedback-reflections/{user-id}/{yyyy-mm-dd}/...`, and returns the object key for storage in `feedback_items.reflection_photo_preview_url`.

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
