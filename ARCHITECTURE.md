# Architecture

This file explains how the Taste Buddy repo is laid out so you can find the right file before editing.

## High-Level Shape

The repo has three active layers:

1. the React app in `src/`
2. the content/data pipeline in `scripts/`, `docs/content/`, and `supabase/`
3. supporting documentation in root docs and `docs/`

That split matters because the codebase mixes product UI work with content ingestion work.

## App Layer

### Entry points

- App bootstrap: [`src/main.tsx`](./src/main.tsx)
- Route composition and preview mode switching: [`src/App.tsx`](./src/App.tsx)

### Pages

The main route-level screens live in [`src/pages/`](./src/pages/).

Common examples:

- [`HomePage.tsx`](./src/pages/HomePage.tsx)
- [`AnalysisPage.tsx`](./src/pages/AnalysisPage.tsx)
- [`ReservationPage.tsx`](./src/pages/ReservationPage.tsx)
- [`ProfilePage.tsx`](./src/pages/ProfilePage.tsx)
- [`DesignSystemPage.tsx`](./src/pages/DesignSystemPage.tsx)

If you are changing a full screen or flow, start in `src/pages/`.

### Components

There are three important component layers:

| Folder | Role | Use when |
| --- | --- | --- |
| [`src/components/system/`](./src/components/system/) | App-specific reusable product components | You want something shared that matches Taste Buddy's design language |
| [`src/components/ui/`](./src/components/ui/) | Generic low-level primitives | You are editing base UI primitives or wiring Radix/shadcn-level pieces |
| feature folders under [`src/components/`](./src/components/) | Page- or domain-specific parts | You are editing a flow-specific or feature-specific component |

The most common confusion in this repo is `system` versus `ui`.

- `system` is closer to the real product design language
- `ui` is more generic and lower-level

If a component is visible in the main product shell, `system` is usually the better first home.

### Styling and tokens

There are two layers to know:

- Taste Buddy app tokens: [`src/styles/design-system.css`](./src/styles/design-system.css)
- Typed token mirror: [`src/constants/designTokens.ts`](./src/constants/designTokens.ts)

There is also a generic semantic theme in [`src/styles/globals.css`](./src/styles/globals.css), but the active app shell is primarily driven by `tb-*` tokens.

Related references:

- Design system doc: [`DESIGN.md`](./DESIGN.md)
- Product guideline doc: [`src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](./src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)

### Logic and data helpers

- Shared utilities and integration code: [`src/lib/`](./src/lib/)
- Feature constants and token data: [`src/constants/`](./src/constants/)
- Shared types: [`src/types/`](./src/types/)

## Content And Data Pipeline Layer

This repo is also a working content pipeline for restaurant/menu data.

### Scripts

[`scripts/`](./scripts/) contains the fetch, OCR, parsing, CSV generation, seed generation, and sync tooling.

See [`scripts/README.md`](./scripts/README.md) for the grouped map.

### Documentation and planning

[`docs/content/`](./docs/content/) holds intake files and planning notes for MVP content work.

### Database layer

- Schema changes: [`supabase/migrations/`](./supabase/migrations/)
- Seed payloads: [`supabase/seeds/`](./supabase/seeds/)

See [`supabase/README.md`](./supabase/README.md) for how those pieces connect.

## Assets

### Bundled assets

[`src/assets/`](./src/assets/) is for assets imported by the app bundle.

### Static public assets

[`public/`](./public/) is for files served directly by Vite without import-time bundling.

## Documentation Layer

There are two doc zones:

| Location | Role |
| --- | --- |
| Root docs (`README.md`, `DESIGN.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`) | Active entry-point docs and source-of-truth docs |
| [`docs/`](./docs/) | Supporting notes, planning, ops, design archives, product notes |

If a doc needs to be found quickly by every collaborator, it should usually live at the repo root or be linked from the root README.

## Non-Source Directories

These folders exist, but they are not the cleanest source tree:

| Folder | Meaning |
| --- | --- |
| [`dist/`](./dist/) | Generated build output |
| [`tmp/`](./tmp/) | Scratch files, captures, OCR output, experimental previews |
| [`test-results/`](./test-results/) | Test runner artifacts |
| [`.tmp-playwright/`](./.tmp-playwright/) | Browser automation artifacts |

Do not start an edit in those directories unless you are intentionally working on generated output or temporary artifacts.

## Recommended Editing Flow

1. Read [`README.md`](./README.md) for entry points.
2. Read [`DESIGN.md`](./DESIGN.md) and [`src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](./src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md) before making product-facing UI changes.
3. Edit the route in `src/pages/` or the right shared component layer.
4. If the change affects docs or project structure, update the linked docs from the README so the next person can actually find them.
