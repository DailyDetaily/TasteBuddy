# Web ↔ iOS flow UI parity · 2026-10-25

## Reference and scope

The React product routes were aligned with current SwiftUI source and the live [08 Flows · iOS page](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=2064-297). Figma was read only. Existing shared-worktree edits and production records were preserved.

- Start/auth: static bundled launch logo, full-height email/code sheet, native footer, Google action using the existing Supabase provider, guest → onboarding → preferences ordering.
- Onboarding: the native analysis, rotating-layer and feedback-ring equations replace the old videos; reduced-motion and inactive-tab handling are retained.
- Shared chrome: 48px main bar, 32px flow bar, 60px bottom navigation, 48px color-filled record button. Product sheets use native 32px corners, 36×5 grabber, 64px header and presenting-card geometry. The explicit web design-system sheet specimen remains available.
- Home/profile/preferences: native section spacing, category tint roles and text hierarchy, archive/recent-record actions, profile activity heading, native selection cards and edit controls.
- Analysis/data detail: fixed period controls, graph-first panels, grouped value rows, distribution mini-charts/legends, structured previous/current comparisons. Home opens record detail before the edit flow.
- Dining: record feed cards, source-backed photos, full-page own-record detail/options, note/date/rating/photo editing, camera/photo/manual entry, menu selection and current detail-tag layout. The removed selected-detail evaluation editor stays removed while original data is preserved.
- Survey: neutral exploratory treatment, ordinary uncertainty selection cards, review/result wording and layout, semantic evidence colors.
- Restaurant: native spacing and provider loading/unavailable/retry states; a verified place link is distinguished from a map search.

## Data boundary

The path remains the account-scoped native journal/repository → existing validated aggregations → React product views. No new API/table, display-value persistence or production migration was added.

- Measurement details recompute from current records, including saves, edits, deletion and account changes, instead of keeping a stale display-card snapshot.
- Existing units remain separate: meal counts use distinct meal IDs; overall evaluations use dish records; sensory-presence comparisons use meals with valid direct presence observations. Missing responses are not treated as negative or zero.
- Periods use the original confirmed meal date and local calendar boundaries. Unknown/conflicting dates and future dates keep their established exclusions; first/repeat uses the complete prior history. Source classifications are not guessed.
- Comparisons use numeric validated source data, not parsed display strings. Sensory comparisons with absent/incompatible catalog versions remain unknown. The original response history stays intact.
- Account measurement hydration distinguishes ready, known-empty and unavailable. Old auth attempts cannot publish into a newer screen. Account changes clear derived presentation before restoring the new account; unowned legacy survey history is not displayed in a signed-in account.
- Additional photos are admitted only when referenced by the same record's validated photo manifest; appending a gallery image preserves its original primary image and normal stale-edit/owner guards.

## Validation

- Production Vite build passed; output is `/tmp/taste-buddy-web-ios-parity-20261025` to preserve the existing `dist/` work.
- TypeScript `npm run typecheck` passed.
- `npm run test:native-web`: 313 passed, including account/repository, source-date, chart, detail-comparison and presentation-cache ownership cases.
- Additional existing motion geometry checks: 10 passed. Sheet-presentation and focused detail tests passed.
- Live Figma screenshots/context: `output/web-ios-parity-20261025/`.
- Browser screenshots: `output/playwright/web-ios-*.png`, `output/playwright/native-parity-detail-20261025/`, and `output/playwright/web-ios-parity-20261025/`.
- Browser checks use isolated local data and blocked/mocked production transport for record edits; these are not production account verification.
- Actual app UI: auth/guest entry, all four onboarding screens, home/profile, camera/manual menu entry, local record save → dining feed → home source row → record detail → delete-to-empty passed. Same-owner refresh retained the main screen and local record. Detail note/rating/date mutations were also verified in the isolated component harness.
- Layout captures include 402px mobile, 320px dark home, 320px measurement/comparison details and 1280px home. Blocked network failures during these checks are deliberate; no uncaught application exception was observed.

## Platform limits

The native photo library/camera is opened through browser file/capture controls. A live iOS camera preview, native flash/camera-switch controls and adaptive iOS Glass cannot be reproduced identically by browser CSS. The colored record surface is a browser approximation of the native material. This work does not claim pixel identity for all 143 reference states or physical-device/provider-login verification.
