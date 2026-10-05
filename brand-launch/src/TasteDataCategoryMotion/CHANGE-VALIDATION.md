# 변화 모션 — 맥락과 동일한 점 링 움직임

미리보기: http://localhost:3110/TasteData-all → 변화.
개별: TasteData-changeRipples 및 -idle / -reduced / -empty / -dense / -zero / -held / -unanswered / -decrease / -equal / -unlinked.

## 변경

- change.ts 신규: 이전·최근의 실제 지표, 공통 상한, 기간별 상태와 선택 설명.
- context.ts: 점 링 움직임을 순수 dotRingMotion 함수로 분리해 맥락과 변화가 공유. 기존 맥락의 의미와 동작 유지.
- geometry.ts: 변화 계산을 독립 렌더 프레임으로 연결하고 기존 원호 표현 제거.
- Gallery.tsx / index.tsx: 변화의 전체 흐름 등록. 통합 화면에서 감소·동일·이전 미확인 선택.
- scripts/taste-data-category.test.mjs: 점 비율과 상태 검증, 맥락과 좌표/크기/불투명도/단계 일치 검증.
- scripts/render-category-frames.mjs: --change 실제 프레임 렌더 추가.
- README.md 및 본 문서.

중앙 점 증식 → 두 점 링으로 펼침(1.8초) → 지그재그 A/원형/B/원형/A(12초) → 진입 역재생(1.8초). 기본 점 반경 9.5, 지그재그 ±4. 선 없음. 모션 줄이기는 즉시 완성 형태.

안쪽 36칸은 이전, 바깥 48칸은 최근이다. 점 하나는 실제 기록 한 건이 아니라 비율 눈금이다. 두 기간에 같은 0 기준과 상한을 사용하며 진한 점 비율을 value/maximum에 맞춰 반올림한다. 정확한 값은 중앙과 선택 패널에 표시한다. main/tintSurface 색은 기간과 표시 비율을 나타내며 좋고 나쁨을 뜻하지 않는다.

유효 0은 틴트 점, 미확인은 —/회색 점/해당 상태를 표시한다. 비교 불가 상태는 정지하며, 양쪽 모두 자료가 없으면 점을 생성하지 않는다. 실제 기간은 패널에 표시한다. 저장 모델·집계·TBA 변경 없음.

## 검증

실행 위치: /Users/sinjunho/Desktop/Taste Buddy/brand-launch.

| 명령 | 종료 코드 | 결과 |
| --- | --- | --- |
| ./node_modules/.bin/tsc --noEmit | 0 | 타입 검사 |
| ./node_modules/.bin/eslint src/TasteDataCategoryMotion/{change,context,geometry}.ts src/TasteDataCategoryMotion/{Gallery,index}.tsx | 0 | 변경 파일 린트 |
| node --test scripts/taste-data-category.test.mjs scripts/taste-motion.test.mjs | 0 | 39개 통과 |
| node scripts/render-category-frames.mjs --change | 0 | 20개 PNG |

렌더 위치: output/category-motion/change-dots/. 정착, 미확인, 역재생 수축 프레임을 시각 확인했다. 테스트에서 맥락 두 층과 변화의 좌표·점 크기·불투명도·중앙 글자 등장 및 단계가 일치한다. 기존 모션 회귀, 안전 여백, 결측, 모션 줄이기, 반복 경계를 함께 검증했다.

웹에서 12→18 / 18→12 / 12→12 / 0→12 / —→18 예시의 중앙 수치와 링을 확인했다. 전체 흐름에서 대기→수축→재진입을 확인했다. 브라우저 오류 0, 기존 오디오 자동재생 경고 1.

미검증 범위: 실제 iOS/Swift 렌더와 기기 실행, 실제 저장 데이터 연결.
