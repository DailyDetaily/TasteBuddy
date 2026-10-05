# 공통 대기 이동·스크롤 검증

변경 파일: geometry.ts, Preview.tsx, scripts/taste-data-category.test.mjs, README.md, SENSORY-VALIDATION.md 및 본 문서.

- 경험 기존 물리/대기 함수는 유지한다. 감각·취향은 같은 경험 대기 위치 함수를 사용한다.
- 맥락·변화는 공통 오프셋으로 선·점·레이블을 이동하여 원호 각도 및 층 사이 관계를 보존한다.
- 고정 시드, 12초 주기, 같은 데이터/시간 재현, 12 논리 픽셀 이내 이동을 검증했다.
- 모션 줄이기에서는 이동 없음. 스크롤은 Studio 그림 영역에만 적용한다. 아래로 되감기 / 위로 펼치기, 일시정지 후 재생 버튼으로 재개한다.
- 원본 TasteMotion.tsx 및 taste-motion.ts 해시는 이전과 동일하다.

실행 위치: brand-launch.

| 명령 | 종료 코드 | 결과 |
| --- | --- | --- |
| npx tsc --noEmit | 0 | 통과 |
| npx eslint src/TasteDataCategoryMotion/geometry.ts src/TasteDataCategoryMotion/Preview.tsx | 0 | 통과 |
| node --test scripts/taste-data-category.test.mjs scripts/taste-motion.test.mjs | 1 | 26개 통과, 새 비교 테스트에서 경험의 진입 3초를 대기로 잘못 지정한 1개 실패 |
| node --test --test-name-pattern='idle geometry' scripts/taste-data-category.test.mjs | 0 | 위 테스트를 대기 모드로 수정 후 통과. 구현 추가 변경 없음 |
| node scripts/render-category-frames.mjs --sensory | 0 | 15개 실제 PNG |

최종 테스트 결과: 27개 검증 항목 모두 통과(전체 실행 및 수정 항목 재검증 합산).

웹 확인: 감각에서 1초 간격으로 점 좌표 변화, 스크롤 후 30프레임 → 역방향 42프레임 및 일시정지 확인. 맥락에서도 스크롤 후 36프레임 및 일시정지 확인. 기존 브라우저 경고 1개, 오류 0개.

미리보기: TasteData-experienceCluster / TasteData-sensoryRays / TasteData-preferenceFocus / TasteData-contextLayers / TasteData-changeRipples. 각 -idle, -reduced 상태도 유지.

미검증: 실제 iOS 앱 연결/기기 실행, 사용자 실제 트랙패드 감도. 실제 렌더 재생성은 감각 15프레임이며 다른 카테고리는 기하/회귀 테스트로 확인했다.
