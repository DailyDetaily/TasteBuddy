# 감각 점 링 검증 — 2026-09-16

웹: http://localhost:3110/TasteData-sensoryRays
대기 / 모션 줄이기 / 빈 자료 / 조밀한 자료: 동일 ID에 -idle / -reduced / -empty / -dense.

## 이번 변경

- sensory.ts: 기존 insightFrame 진입과 점 크기 재사용. 126개의 고정 비율 칸. 맛 6개 영역 각 21칸, main과 tintSurface 채움. 선택 시 정확한 분자/분모를 중앙에 표시.
- fixtures.ts: 기존 네이티브 TasteAxis.fat에 대응하는 예시 항목 native-axis:fat 추가. TBA 계약과 구분하며 프로덕션 모델 변경 없음.
- taste-data-category.test.mjs: 독립 분모, 중복 제거, 14/21 대 7/21, 유효 0, 상태별 결측, 선택/시간에 따른 위치 불변 검증.
- render-category-frames.mjs: sensory-ring 출력 폴더로 변경.
- README.md 및 본 검증 문서 업데이트.

## 실행 결과

| 명령 (brand-launch에서 실행) | 종료 코드 | 결과 |
| --- | --- | --- |
| npx tsc --noEmit | 0 | 타입 검사 통과 |
| npx eslint src/TasteDataCategoryMotion/sensory.ts src/TasteDataCategoryMotion/fixtures.ts | 0 | 통과 |
| node --test scripts/taste-data-category.test.mjs scripts/taste-motion.test.mjs | 0 | 26개 통과 |
| node scripts/render-category-frames.mjs --sensory | 0 | 15개 PNG 렌더 |

실제 렌더: output/category-motion/sensory-ring/. 기본 정착/빈 자료 프레임을 시각 확인했고, 중앙·외곽 안전 여백과 대기 경계는 기하 테스트로 확인했다. 맛/향/식감 상태 프레임을 렌더했다.

Playwright로 실행 중인 3110 Studio에서 자동 재생 및 루프 경계 400→60 프레임 진행을 확인했다. 짠맛 선택 후 중앙 8/12, 강도 약함 1 · 중간 2 · 강함 5 표시를 확인했다.

기존 TasteMotion.tsx / taste-motion.ts SHA-256은 이전 검증값과 동일하다. 경험 및 네이티브 구현은 이번에 수정하지 않았다.

## 범위와 한계

- 점 하나는 실제 기록 한 건이 아니다. 반올림된 비율 칸이며 정확한 값은 선택 시 숫자로 제공한다.
- 맛은 6×21, 향은 7×18, 식감은 8영역에 15~16칸 배분. 각 영역은 독립 분모를 사용한다.
- 유효 0회는 틴트 점, 자료 없음·미응답·해석 보류는 점 없이 별도 상태.
- 데이터 점은 정착 후 비율을 유지하고 작은 범위에서 움직인다. 후속 요청으로 기존 위치 고정 정책을 대체했다.
- 실제 앱 연결, 실제 저장 데이터, iOS 빌드/기기 동작은 이번 검증 범위 밖이다.
