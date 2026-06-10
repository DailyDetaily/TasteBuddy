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

## Lightweight Codex Mode

다른 세션에서도 기본적으로 가볍게 움직인다.

- 사용자가 원인 설명만 물으면 먼저 코드/브라우저 수정 없이 답한다. 확인이 필요할 때만 관련 파일 1-3개를 좁게 읽는다.
- 브라우저 자동화는 시각 회귀, 실제 렌더 확인, 클릭/상태 재현이 필요한 경우에만 사용한다. DOM snapshot은 필요한 영역만 확인하고 큰 body text dump를 피한다.
- `npm run build`는 앱 UI/로직 변경 후에만 실행한다. 문서, 지침, 설명-only 변경에는 생략하고 최종 답변에 생략 이유를 말한다.
- `git status`, `git diff`는 전체 출력 대신 대상 파일을 지정한다. 큰 diff/log는 `sed`, `rg`, `--stat` 등으로 범위를 제한한다.
- 이미 열린 dev server와 브라우저 상태를 재사용한다. 같은 URL을 불필요하게 반복 reload하지 않는다.
- 사용자가 “가볍게”, “토큰 아껴”, “설명만”이라고 말하면 검증보다 빠른 답변을 우선하고, 필요한 추가 검증은 짧게 제안한다.
