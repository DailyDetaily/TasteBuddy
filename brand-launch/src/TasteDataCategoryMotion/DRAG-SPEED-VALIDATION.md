# 감각 회전 관성 및 점별 속도

변경 파일: Preview.tsx, geometry.ts, scripts/taste-data-category.test.mjs, README.md.

- 감각 드래그 각도와 놓는 순간 속도에 기존 insightDragDelta / insightInertia 사용.
- 빠르게 놓으면 관성, 120ms 이상 멈춘 뒤 놓으면 관성 없음. 모션 줄이기도 관성 없음.
- 관성은 Remotion 프레임 시계를 사용하며 재생 정지 시 멈춘다. 루프 경계에는 누적 시간으로 연속 진행한다.
- 안정적인 점 ID 해시로 1·2·3·4배 속도 배정. 이동 범위 및 비율 유지.
- 스크롤 되감기는 관성을 중지하고 프레임 탐색한다. 드래그 종료 클릭은 선택하지 않는다.

실행 위치: brand-launch.
- npx tsc --noEmit: 종료 0.
- npx eslint src/TasteDataCategoryMotion/geometry.ts src/TasteDataCategoryMotion/Preview.tsx: 종료 0.
- node --test --test-name-pattern='sensory|idle geometry|all categories|드래그' scripts/taste-data-category.test.mjs scripts/taste-motion.test.mjs: 종료 0, 8개 통과.

실제 웹 Playwright: 드래그 회전 확인. 빠르게 놓은 뒤 회전각 1.6115 → 1.6596 → 1.6787 rad로 관성 진행 및 감속 확인. 놓기 전 잠시 멈춘 경우 각도 유지 확인. 브라우저 오류 0, 기존 오디오 자동재생 경고 1.

미리보기: http://localhost:3110/TasteData-sensoryRays
미검증: 실제 iOS 기기, 사용자 트랙패드 감도. 이번 검증은 실제 웹 상호작용 및 기하 테스트이며 영상 내보내기는 다시 실행하지 않았다.
