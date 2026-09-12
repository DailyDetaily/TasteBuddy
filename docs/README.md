# Docs Index

This folder is for supporting documents, not every source of truth in the repo.

The important thing to know is that some of the most important docs live at the repo root or under `src/guidelines/`.

## Read These First

### Root and source-of-truth docs

- Repo entry point: [`../README.md`](../README.md)
- Architecture guide: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
- Contribution and file placement guide: [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- Visual design system: [`../DESIGN.md`](../DESIGN.md)
- Product UX guideline: [`../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
- AI-friendly design system guide: [`AI_DESIGN_SYSTEM.md`](./AI_DESIGN_SYSTEM.md)
- Machine-readable design snapshot: [`design-system.snapshot.json`](./design-system.snapshot.json)
- App/service summary: [`TASTE_BUDDY_APP_SUMMARY.md`](./TASTE_BUDDY_APP_SUMMARY.md)

## Docs Folder Structure

| Folder | What it contains |
| --- | --- |
| [`content/intake/`](./content/intake/) | Restaurant intake CSVs used for MVP content generation |
| [`content/planning/`](./content/planning/) | Content planning notes, shortlists, and worklists |
| [`design/`](./design/) | Design notes, visual replans, and design archives |
| [`operations/`](./operations/) | Catchtable workflow docs, Supabase setup, and run logs |
| [`product/`](./product/) | Product notes and onboarding/product idea documents |

## Recommended Entry Points By Task

### Product and UX

- App/service summary: [`TASTE_BUDDY_APP_SUMMARY.md`](./TASTE_BUDDY_APP_SUMMARY.md)
- Product source of truth: [`../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
- Design system: [`../DESIGN.md`](../DESIGN.md)
- TasteBuddyAgent guide: [`product/taste-buddy-agent.md`](./product/taste-buddy-agent.md)
- TBA knowledge/RAG plan: [`product/tba-knowledge-rag-plan.md`](./product/tba-knowledge-rag-plan.md)
- TBA 장기 데이터 플랫폼 설계: [`product/tba-data-platform-architecture.md`](./product/tba-data-platform-architecture.md)
- TBA 분석·해석 모델 설계: [`product/tba-analysis-interpretation-model.md`](./product/tba-analysis-interpretation-model.md)
- TBA 미각 타입 9종 설계 초안: [`product/tba-palate-styles.md`](./product/tba-palate-styles.md)
- TBA 개인 취향 분석 엔진: [`product/tba-personal-engine.md`](./product/tba-personal-engine.md)
- TBA 감각 모델과 네이티브 앱 연결: [`product/tba-native-sensory-integration.md`](./product/tba-native-sensory-integration.md)
- TBA 미각 버블·디테일 태그 수집: [`product/tba-structured-selection-intake.md`](./product/tba-structured-selection-intake.md)
- TBA 조건부 개인 취향 모델: [`product/tba-advanced-personal-model.md`](./product/tba-advanced-personal-model.md)
- TBA 개인 모델 v2의 알맞음·전체 평가·다음 질문: [`product/tba-personal-insights-v2.md`](./product/tba-personal-insights-v2.md)
- TBA 고도화 모델 독립 평가: [`product/tba-advanced-model-evaluation.md`](./product/tba-advanced-model-evaluation.md)
- TBA 실제 자료 파일럿 검증: [`product/tba-platform-pilot-report.md`](./product/tba-platform-pilot-report.md)
- Onboarding product note: [`product/onboarding-digital-anchoring.md`](./product/onboarding-digital-anchoring.md)
- Onboarding intake plan: [`product/onboarding-preference-intake-plan.md`](./product/onboarding-preference-intake-plan.md)

### Design

- AI entry guide: [`AI_DESIGN_SYSTEM.md`](./AI_DESIGN_SYSTEM.md)
- Machine-readable snapshot: [`design-system.snapshot.json`](./design-system.snapshot.json)
- Design note: [`design/analysis-page-direction-replan.md`](./design/analysis-page-direction-replan.md)
- Archived HTML reference: [`design/beli-inspired-tastebuddy-archive.html`](./design/beli-inspired-tastebuddy-archive.html)

### Content and restaurant data

- Content planning: [`content/planning/mvp-content-data-plan.md`](./content/planning/mvp-content-data-plan.md)
- Restaurant shortlist: [`content/planning/mvp-restaurant-shortlist.md`](./content/planning/mvp-restaurant-shortlist.md)
- Intake CSV template: [`content/intake/mvp-content-intake-template.csv`](./content/intake/mvp-content-intake-template.csv)

### Operations

- Catchtable workflow: [`operations/catchtable-menu-automation.md`](./operations/catchtable-menu-automation.md)
- Batch run log: [`operations/catchtable-batch-run-2026-03-29.md`](./operations/catchtable-batch-run-2026-03-29.md)
- Supabase setup: [`operations/supabase-connect-and-seed.md`](./operations/supabase-connect-and-seed.md)
- Cloudflare R2 media storage: [`operations/cloudflare-r2-media-storage.md`](./operations/cloudflare-r2-media-storage.md)
- Native photo performance: [`operations/native-photo-performance.md`](./operations/native-photo-performance.md)

## Notes

- `docs/` is for supporting material. It is not the only doc location in the repo.
- If you add a doc that future contributors should find quickly, link it from [`../README.md`](../README.md) or from this file.
