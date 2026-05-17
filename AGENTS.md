# Taste Buddy Codex Rules

Taste Buddy는 미각 프로필을 해석해 다음 다이닝 경험을 개인화하는 premium service다.

- UX는 calm, premium, precise. Raw data보다 해석과 다음 행동을 먼저 보여준다.
- 의료/실험실/일반 예약/취향 테스트처럼 보이는 방향은 피한다.
- 하드웨어는 optional layer, 셰프 가이드는 존중하는 톤으로 쓴다.
- 필요 시 제품/디자인/구조 기준은 `src/guidelines/...`, `DESIGN.md`, `docs/AI_DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`를 확인한다.
- 경로별 `AGENTS.md`가 있으면 우선 적용한다.
- UI는 기존 `src/components/system/`과 디자인 토큰을 먼저 재사용한다.
- `src/` 앱 UI와 `scripts/`, `docs/content/`, `supabase/` 데이터 파이프라인을 구분한다.
- 토큰 절약을 위해 브라우저 자동화는 꼭 필요할 때만 쓰고, 파일은 필요한 범위만 읽으며, 큰 diff/log는 제한하고, 문서-only 변경에는 빌드를 생략한다.
- `dist/`, `tmp/`, `test-results/`, `.tmp-playwright/`, `node_modules/`에서 작업을 시작하지 않는다.
- 가능하면 변경 후 `npm run build`.
