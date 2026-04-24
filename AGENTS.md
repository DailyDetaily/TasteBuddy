# Taste Buddy Scoped Instructions

이 저장소는 크게 두 층으로 나뉜다.

1. `src/`의 React 앱
2. `scripts/`, `docs/content/`, `supabase/`의 콘텐츠/데이터 파이프라인

공통 source of truth:

- 제품 경험: [`src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](./src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
- 시각 시스템: [`DESIGN.md`](./DESIGN.md)
- 구조와 파일 배치: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`CONTRIBUTING.md`](./CONTRIBUTING.md)

경로별로 더 작은 지침을 우선 적용한다.

- `src/pages/*` 작업: [`src/pages/AGENTS.md`](./src/pages/AGENTS.md)
- `src/components/*` 작업: [`src/components/AGENTS.md`](./src/components/AGENTS.md)
- `src/components/system/*` 작업: [`src/components/system/AGENTS.md`](./src/components/system/AGENTS.md)
- `src/components/ui/*` 작업: [`src/components/ui/AGENTS.md`](./src/components/ui/AGENTS.md)

기본 가드레일:

- generated/artifact 폴더에서 작업을 시작하지 않는다: `dist/`, `tmp/`, `test-results/`, `.tmp-playwright/`, `node_modules/`
- app UI와 content/data pipeline 변경을 혼동하지 않는다
- 디자인 토큰이나 공용 시각 규칙이 바뀌면 `DESIGN.md`, `src/styles/design-system.css`, `src/constants/designTokens.ts`까지 같이 확인한다
