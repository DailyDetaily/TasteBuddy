# 독립 이동 / 감각 순차 진입

변경: experience.ts, sensory.ts, scripts/taste-data-category.test.mjs, README.md, 경험 표준 프레임 JSON.

경험·감각·취향의 점은 공통 각도 흐름 없이 ID별 경로로 움직인다. 최대 변위 1.87 논리 단위, 12초 주기, 모션 줄이기는 고정. 맥락·변화는 기록 점이 없는 원호 표현으로 이전 단계의 원호 이동을 유지한다.

감각은 미각 무리별 시차로 등장한다. 각 무리 안에서 진한 점을 먼저 드러낸 뒤 틴트 점을 표시한다. 미각별 21칸 / 전체 126칸, 진한 점 수와 tintSurface 토큰은 유지한다. 1.8초 정착, 스크롤 되감기 유지.

실행 위치: brand-launch.
- npx tsc --noEmit: 종료 0.
- npx eslint src/TasteDataCategoryMotion/experience.ts src/TasteDataCategoryMotion/sensory.ts: 종료 0.
- node scripts/render-category-frames.mjs --sensory: 종료 0, 15개 PNG. 진입 27프레임 시각 확인.
- node scripts/export-experience-motion.mjs: 종료 0, 552프레임 / 126점 JSON 갱신. Swift 소스 변경 없이 기존 클립 로더가 소비한다.

미리보기: http://localhost:3110/TasteData-sensoryRays 및 -idle / -reduced.
실제 iOS 빌드·기기 실행은 미검증.

node --test scripts/taste-data-category.test.mjs scripts/taste-motion.test.mjs: 종료 0, 28개 통과. 독립 이동, 거리 제한, 충돌 여백, 루프, 진한 점 선행, 기존 점 링 회귀 검증.
