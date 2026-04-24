# Pages Instructions

`src/pages/`는 route-level screen과 flow orchestration 레이어다.

- 페이지는 화면 조합, route state, 흐름 전환을 담당한다
- 새 UI를 페이지 안에서 바로 만들기보다 기존 `src/components/`와 `src/components/system/`을 먼저 조합한다
- 공용 제품 패턴이 필요하면 페이지 안에 고정 구현하지 말고 shared component로 끌어올릴지 먼저 판단한다

제품 방향:

- Taste Buddy는 premium dining personalization 서비스다
- raw data보다 interpretation을 먼저 보여준다
- 하드웨어는 optional precision layer이지 필수 진입점이 아니다
- chef-respectful, calm, premium tone을 유지한다

페이지 흐름 규칙:

- 핵심 서비스 루프를 강화해야 한다: calibration -> profile -> reservation personalization -> dining -> feedback -> refinement
- 우선순위가 높은 흐름은 onboarding, calibration, profile interpretation, reservation personalization, feedback loop다
- 사용자가 다음 다이닝 경험으로 전진하고 있다는 감각이 있어야 한다

레이아웃 규칙:

- 기존 shell 패턴을 따른다: tab shell, flow shell, conversion shell
- 모바일 우선 구조를 유지하고, 큰 화면에서도 stage 중심 레이아웃을 지킨다
- 페이지 카피는 "what we know / what it means / what happens next" 흐름에 가깝게 정리한다

피해야 할 방향:

- medical app UX
- generic booking app 구성
- playful quiz tone
- dense dashboard-style metrics screen
