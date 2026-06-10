# Backend Phase 0 Baseline

Captured on June 5, 2026 without making remote schema, data, function, or R2 changes.

## Current Repository Inventory

- Supabase migrations: 18
- SQL policies declared: 79
- `security definer` functions declared: 12
- Tables with explicit RLS enable statements: 29
- Edge Functions:
  - `delete-account`
  - `google-place-enrich`
  - `kakao-place-lookup`
  - `upload-feedback-reflection-photo`
  - `upload-profile-avatar`
- Local environment files expose configuration key names for Supabase, R2 public media, Kakao, and server-side Supabase access.
- Secret values were not read, copied, logged, or added to iOS.

## Environment Separation Finding

The repository contains metadata for one linked Supabase project, but no checked-in source identifies it as staging or production. The iOS project has no `ios/Config` xcconfig files and no `BackendConfiguration` or Supabase client yet.

Until the linked environment is classified:

- Do not run remote migrations.
- Do not deploy Edge Functions.
- Do not seed or mutate remote data.
- Do not run destructive schema commands.
- Do not reuse `SUPABASE_SECRET_KEY` or a service-role key in the app target.

This blocks remote Backend Phase 0 verification, but it does not block local domain, fixture, SwiftUI, repository protocol, or simulator work.

## Required Staging Gate

Before the first live iOS repository call:

1. Add `ios/Config/Base.xcconfig`, `Debug.xcconfig`, and `Release.xcconfig`.
2. Keep `ios/Config/Secrets.local.xcconfig` untracked.
3. Set Debug to a verified staging Supabase URL, publishable key, public media origin, and `staging` environment label.
4. Confirm Release does not inherit Debug credentials.
5. Record the staging project identity, R2 public/private bucket names, seed version, and test account roles in a non-secret environment runbook.
6. Verify a fresh staging database can apply all migrations in order before any iOS write integration.

## Known Security Work

The following items remain open and must be resolved according to [`BACKEND_INTEGRATION_PLAN.md`](../BACKEND_INTEGRATION_PLAN.md):

- Bookmark ownership still uses email and must move to `owner_id`.
- Reflection photos require private R2 storage and signed reads.
- Account deletion requires R2 cleanup or a retryable cleanup tombstone.
- Consumer content writes must be restricted to operator/server roles.
- Dining feedback needs an atomic, idempotent mutation contract.
- Notification creation must be server-generated.
- RLS, RPC, Edge Function, and R2 positive/negative tests are not yet automated.
