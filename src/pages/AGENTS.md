# Pages Rules

`src/pages/`는 route-level screen과 flow orchestration 레이어다.

- 페이지는 화면 조합, route state, 흐름 전환을 담당한다.
- 새 UI는 먼저 `src/components/`와 `src/components/system/` 조합으로 만든다.
- 핵심 흐름은 calibration -> profile -> reservation -> dining -> feedback -> refinement를 강화해야 한다.
- 카피는 가능하면 what we know / what it means / what happens next 구조로 정리한다.
- 모바일 우선 shell 패턴을 유지하고 dense dashboard, generic booking, quiz tone은 피한다.
