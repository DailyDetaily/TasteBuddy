# Taste Buddy app

Taste Buddy is a premium dining personalization app.

This repo contains two big things in one place:

1. the React app that powers the guest-facing experience
2. the content and data pipeline used to prepare restaurant/menu data for Supabase

If you are opening the project for the first time, start here instead of jumping straight into random folders.

## Start Here

### What to read first

- Codex working rules for this repo: [`AGENTS.md`](./AGENTS.md)
- Product UX source of truth: [`src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](./src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
- Visual design source of truth: [`DESIGN.md`](./DESIGN.md)
- AI-friendly design system guide: [`docs/AI_DESIGN_SYSTEM.md`](./docs/AI_DESIGN_SYSTEM.md)
- Machine-readable design snapshot: [`docs/design-system.snapshot.json`](./docs/design-system.snapshot.json)
- Project structure and architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Where to put new files and how to work in this repo: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Supporting docs index: [`docs/README.md`](./docs/README.md)
- Script map: [`scripts/README.md`](./scripts/README.md)
- Supabase structure: [`supabase/README.md`](./supabase/README.md)

### What to edit most often

- UI screens: [`src/pages`](./src/pages/)
- Product-facing reusable components: [`src/components/system`](./src/components/system/)
- Feature components: [`src/components`](./src/components/)
- Design tokens and styles: [`src/constants/designTokens.ts`](./src/constants/designTokens.ts), [`src/styles/design-system.css`](./src/styles/design-system.css)
- Supporting logic: [`src/lib`](./src/lib/)
- Supporting docs and research notes: [`docs`](./docs/)

### What usually is not the first place to edit

- Build output: [`dist`](./dist/)
- Scratch and research artifacts: [`tmp`](./tmp/)
- Browser/test runner artifacts: [`test-results`](./test-results/)
- Static passthrough assets: [`public`](./public/)
- Local tooling and agent metadata: [`.agents`](./.agents/), [`.codex`](./.codex/), [`codex`](./codex/)

## Running the App

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The app runs on port `3001`.

- Local app: [http://127.0.0.1:3001](http://127.0.0.1:3001)
- Design system: [http://127.0.0.1:3001/design-system](http://127.0.0.1:3001/design-system)
- Design system update preview: [http://127.0.0.1:3001/design-system-updates](http://127.0.0.1:3001/design-system-updates)

Convenience scripts:

```bash
npm run dev:app
npm run dev:design-system
npm run dev:design-system-updates
npm run build
```

## Project Map

| Path | What it is | When to go there |
| --- | --- | --- |
| [`src/`](./src/) | Main application source | Building product UI or behavior |
| [`src/pages/`](./src/pages/) | Route-level screens and preview routes | Editing a page or flow |
| [`src/components/system/`](./src/components/system/) | App-specific reusable building blocks | Adding product-facing shared UI |
| [`src/components/ui/`](./src/components/ui/) | Generic Radix/shadcn-style primitives | Working on low-level primitives |
| [`src/constants/`](./src/constants/) | Tokens, catalog data, feature constants | Editing design tokens or seed-like constants |
| [`src/lib/`](./src/lib/) | Utility and integration logic | Editing data access or helper logic |
| [`docs/`](./docs/) | Supporting docs, planning, ops notes, design notes | Looking for process or research docs |
| [`scripts/`](./scripts/) | Data/content pipeline scripts | Fetching, OCRing, parsing, generating, syncing |
| [`supabase/`](./supabase/) | Migrations and seed payloads | Working on DB schema or content import |
| [`public/`](./public/) | Static assets served directly | Hosting files without bundling |
| [`dist/`](./dist/) | Build output | Checking packaged output, not primary editing |
| [`tmp/`](./tmp/) | Scratch files and generated research artifacts | Reference only, unless intentionally regenerating |

## Common Sources Of Truth

Not every important doc lives in `docs/`.

| Concern | Source of truth |
| --- | --- |
| Codex repo-specific working rules | [`AGENTS.md`](./AGENTS.md) |
| Product behavior and UX principles | [`src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](./src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md) |
| Visual system and component rules | [`DESIGN.md`](./DESIGN.md) |
| AI design-system fast path | [`docs/AI_DESIGN_SYSTEM.md`](./docs/AI_DESIGN_SYSTEM.md), [`docs/design-system.snapshot.json`](./docs/design-system.snapshot.json) |
| Codebase shape and directory roles | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| File placement and working rules | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Supporting notes and ops docs | [`docs/README.md`](./docs/README.md) |

## A Few Repo-Specific Notes

- `src/components/system` is the app-specific design language. Start there before creating something new in `src/components/ui`.
- `src/components/ui` exists, but many primitives are generic and not the first layer used by the main app shell.
- `DESIGN.md` and the `/design-system` route are meant to stay aligned.
- `tmp/` contains a lot of useful historical artifacts, but it is not the clean source tree.
- `dist/` is tracked in this repo, so do not assume it is disposable build output even though it is generated.

## Related Docs

- Architecture guide: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Contribution guide: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- AI design guide: [`docs/AI_DESIGN_SYSTEM.md`](./docs/AI_DESIGN_SYSTEM.md)
- Design snapshot: [`docs/design-system.snapshot.json`](./docs/design-system.snapshot.json)
- Docs index: [`docs/README.md`](./docs/README.md)
- Scripts index: [`scripts/README.md`](./scripts/README.md)
- Supabase index: [`supabase/README.md`](./supabase/README.md)
