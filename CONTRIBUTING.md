# Contributing

This file is a practical guide to where things go in the Taste Buddy repo.

It is not a generic open-source policy doc. It is a placement guide so contributors do not lose time guessing where to edit.

## Local Setup

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run dev:app
npm run dev:design-system
npm run dev:design-system-updates
npm run build
```

Native iOS:

```bash
npm run ios:open
npm run dev:all
```

When `ios/project.yml` changes, regenerate the project with `npm run ios:generate`.

## Before You Change UI

Read these first:

- Product UX rules: [`src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](./src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
- Visual system rules: [`DESIGN.md`](./DESIGN.md)
- AI-friendly design system guide: [`docs/AI_DESIGN_SYSTEM.md`](./docs/AI_DESIGN_SYSTEM.md)
- Machine-readable design snapshot: [`docs/design-system.snapshot.json`](./docs/design-system.snapshot.json)
- Repo structure: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Where New Files Should Go

| If you are adding... | Put it here | Why |
| --- | --- | --- |
| A full screen or route | [`src/pages/`](./src/pages/) | Route-level behavior belongs with other pages |
| A native SwiftUI feature | [`ios/TasteBuddy/Features/`](./ios/TasteBuddy/Features/) | Keeps the iOS presentation layer independent from the React app |
| A reusable native product component | [`ios/TasteBuddy/Components/`](./ios/TasteBuddy/Components/) | Mirrors the Taste Buddy product language for SwiftUI |
| A reusable Taste Buddy product component | [`src/components/system/`](./src/components/system/) | This is the app-specific shared UI layer |
| A feature-specific component | A relevant feature folder under [`src/components/`](./src/components/) | Keeps page-specific logic near the feature |
| A low-level generic primitive | [`src/components/ui/`](./src/components/ui/) | This is the generic primitive layer |
| Design tokens or token mirrors | [`src/styles/design-system.css`](./src/styles/design-system.css), [`src/constants/designTokens.ts`](./src/constants/designTokens.ts) | CSS and TS token layers should stay aligned |
| A utility or integration helper | [`src/lib/`](./src/lib/) | Shared logic and integration code lives here |
| A constant dataset or fixture-like app constant | [`src/constants/`](./src/constants/) | Keeps non-component source data in one place |
| A product/process/ops note | [`docs/`](./docs/) | Supporting docs belong in the docs tree |
| A script for ingestion or sync | [`scripts/`](./scripts/) | Keeps pipeline tooling together |
| A new DB migration or seed | [`supabase/`](./supabase/) | Keeps schema and seed work in the database layer |

## Placement Rules That Matter In This Repo

### `system` before `ui`

If the thing you are building is clearly part of the Taste Buddy product language, prefer `src/components/system/` before `src/components/ui/`.

`ui/` is the generic primitive layer. `system/` is the shared product layer.

### Keep CSS and TS tokens in sync

If you update design tokens:

- update [`src/styles/design-system.css`](./src/styles/design-system.css)
- update [`src/constants/designTokens.ts`](./src/constants/designTokens.ts)
- update [`DESIGN.md`](./DESIGN.md) if the visible system changed
- update [`docs/AI_DESIGN_SYSTEM.md`](./docs/AI_DESIGN_SYSTEM.md) and [`docs/design-system.snapshot.json`](./docs/design-system.snapshot.json) when AI-facing interpretation or token naming changed

If the same visible rule is implemented in the native app, also update the Swift mirror in [`ios/TasteBuddy/DesignSystem/TBTheme.swift`](./ios/TasteBuddy/DesignSystem/TBTheme.swift).

### Do not hide important docs

If you add a new doc that future contributors should read, link it from:

- [`README.md`](./README.md), or
- [`docs/README.md`](./docs/README.md)

If it is not discoverable from one of those places, it will effectively disappear.

### Treat `tmp/` as reference, not home

`tmp/` contains useful artifacts, but it is not the clean source tree.

Do not place durable source files there.

## Documentation Rules

Use this rough split:

- Root docs for active source-of-truth and entry-point docs
- `docs/` for supporting notes, planning, ops, archives, and research

Examples:

- Active visual system: [`DESIGN.md`](./DESIGN.md)
- Supporting design note: [`docs/design/`](./docs/design/)
- Product note: [`docs/product/`](./docs/product/)
- Ops runbook: [`docs/operations/`](./docs/operations/)

## Recommended Smoke Test

For UI or structure changes, run:

```bash
npm run build
```

For docs-only changes, a build is optional, but links and file paths should still be checked.
