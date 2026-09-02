# Taste Buddy iOS

The native app lives beside the existing Vite/React app. Neither app is generated from the other, so both can be developed and released independently while sharing the product language and backend contracts.

## Current Native Scope

- onboarding
- seven-step preference intake
- 12-item taste survey with optional respondent context
- Starter Taste Profile
- home recommendations and interpretation
- profile analysis
- dining history and post-dining feedback
- local profile management

Reservation and Tastick connectivity are intentionally excluded from this first native scope.

The implementation sequence and target SwiftUI architecture are documented in [`NATIVE_MIGRATION_GUIDE.md`](./NATIVE_MIGRATION_GUIDE.md). Supabase, PostgreSQL, RLS, Edge Functions, Cloudflare R2, offline sync, and backend security are covered in [`BACKEND_INTEGRATION_PLAN.md`](./BACKEND_INTEGRATION_PLAN.md). Native parity with the existing React guest app is tracked in [`PARITY_MATRIX.md`](./PARITY_MATRIX.md). Treat the guides as the execution plans and the matrix as the checklist for deciding whether a screen is actually ported, not just visually approximated.

## Project Layout

| Path | Role |
| --- | --- |
| `TasteBuddy/App` | app entry point and persisted app state |
| `TasteBuddy/DesignSystem` | Swift mirrors of the active Taste Buddy tokens |
| `TasteBuddy/Models` | calibration, profile, and dining models |
| `TasteBuddy/Components` | reusable native product components |
| `TasteBuddy/Features` | screen-level SwiftUI features |
| `TasteBuddyTests` | focused model and scoring tests |
| `project.yml` | XcodeGen source of truth |

Pretendard Regular, Medium, SemiBold, and Bold are bundled for parity with the web design system. Their license is included at [`LICENSES/Pretendard-LICENSE.txt`](./LICENSES/Pretendard-LICENSE.txt).

## Generate And Run

Requirements:

- Xcode 16 or newer
- XcodeGen

Generate the project after changing `project.yml`:

```bash
cd ios
xcodegen generate
open TasteBuddy.xcodeproj
```

Select the `TasteBuddy` scheme and an iPhone simulator, then run.

## Web And iOS Together

Run the web app from the repository root:

```bash
npm run dev
```

Run the native app from Xcode. The web app continues to own the existing React UI and content/admin previews; `ios/` owns the native guest experience.

To open Xcode and start the web server in one command:

```bash
npm run dev:all
```

## Data Status

The current feature views still persist preference intake, profile, and dining feedback locally with `UserDefaults`, so the running app remains a prototype. Phase 0 reference captures and React-generated contract fixtures live in [`Reference`](./Reference) and `TasteBuddy/Resources/Fixtures`. Preference selection rules, quick calibration, and the 12-item survey scoring are checked against React-generated golden fixtures. The dining feedback scenario contract is also decoded in Swift before repository-backed domain state is introduced.
