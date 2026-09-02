# Components Rules

`src/components/`는 shared UI와 feature component 레이어다.

- 제품 언어가 있는 재사용 UI는 `system/`, generic primitive는 `ui/`, 도메인 전용 구현은 feature 폴더에 둔다.
- 새 컴포넌트 전 기존 shared component, token, established pattern을 먼저 재사용한다.
- reusable pattern 변경 시 design system 문서/preview 반영 필요 여부를 확인한다.
- `system/*`와 `ui/*`는 각 하위 `AGENTS.md`를 우선 적용한다.
- hardware mandatory framing이나 generic restaurant booking drift를 넣지 않는다.
