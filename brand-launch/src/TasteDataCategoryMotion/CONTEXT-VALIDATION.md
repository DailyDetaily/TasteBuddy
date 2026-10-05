# 맥락 점·링 모션 — 참고 영상 반영

참고: /Users/sinjunho/Desktop/edc0940c0ff6e3b908925fa493bb194d_720w.mp4 (720×900, 30fps, 12초).
영상의 중심 점 → 원형 점 층 확장 → 대기 → 중심 수축 흐름을 채택했다. 배경·색·타이포그래피는 Taste Buddy 체계를 유지한다. 참고 영상 자체는 수정하지 않았다.

## 표현과 재생

- 기본 미리보기: 진입 1.8초 → 대기 12초 → 수축 1.8초, 총 15.6초 반복.
- 조건별 점과 얇은 링이 서로 다른 시차로 펼쳐지고, 수축 후 중심 점 하나로 모인다.
- 대기는 데이터 원호의 각도와 층의 반경을 유지하며 점별 작은 움직임과 선 강조만 적용한다.
- 중앙 문구는 진입 정착 때 표시하고 수축 시작 때 먼저 숨긴다.
- 대기 반복은 정착 형태를 유지한다. 모션 줄이기는 즉시 완성 형태이며 움직임이 없다.
- 통합 미리보기의 맥락 선택 시 기본 진입 모드에서 전체 흐름 모드로 전환한다. 다른 카테고리의 기존 재생 방식을 유지한다.

## 데이터 의미

링 하나는 비교 조건 하나이며, 층 위치는 좋고 나쁨의 순서가 아니다. 모든 층의 평가 범주 구역은 같은 각도에 놓인다. 각 응답 구역의 14개 점은 비율 눈금이며 평가 한 건을 의미하지 않는다. main/tintSurface는 반올림한 기록 비율을, 원호는 정확한 조건별 응답 비율을 나타낸다. 각 층은 자기 유효 응답 수 n을 사용한다. 조건별 n은 합산하지 않는다. 선택 패널에는 실제 수와 응답 나뉨·미응답·해석 보류를 분리해 표시한다.

자료 없음은 층을 생성하지 않는다. 유효 응답 0인 조건은 n=0과 중립색 안내만 표시하며 평가 비율을 만들지 않는다. 중심 점은 장식적 전환 요소이고 데이터 기록이 아니다.

## 변경 파일

- context.ts: 독립 기하 계산 및 진입/대기/수축 시간 함수.
- geometry.ts: 맥락 계산 분리 및 전체 흐름 재생 길이.
- types.ts: cycle 재생과 단계 표기 타입.
- Preview.tsx: 전체 흐름 반복·단계 표시·정수 프레임 경계.
- Gallery.tsx: 맥락 전체 흐름 선택.
- index.tsx: 기존 TasteData-contextLayers 기본 미리보기에 전체 흐름 등록.
- scripts/render-category-frames.mjs: --context 프레임 렌더.
- scripts/taste-data-category.test.mjs: 전체 흐름·단계·중앙 여백·회귀 검증.
- README.md 및 본 문서.

## 검증

명령 실행 위치: /Users/sinjunho/Desktop/Taste Buddy/brand-launch.

| 명령 | 종료 코드 | 결과 |
| --- | --- | --- |
| ./node_modules/.bin/tsc --noEmit | 0 | 타입 검사 |
| ./node_modules/.bin/eslint src/TasteDataCategoryMotion/context.ts src/TasteDataCategoryMotion/geometry.ts src/TasteDataCategoryMotion/Preview.tsx src/TasteDataCategoryMotion/Gallery.tsx src/TasteDataCategoryMotion/index.tsx | 0 | 변경 코드 검사 |
| node --test scripts/taste-data-category.test.mjs scripts/taste-motion.test.mjs | 0 | 32개 통과 |
| node scripts/render-category-frames.mjs --context | 0 | 22개 PNG 렌더 |

타입 검사 도중 맥락 분리로 남은 미사용 함수와 변화 모션의 공통 phase 참조를 수정한 뒤 재검증했다. 최종 전체 테스트에서 변화·원본 점 링 회귀까지 통과했다.

렌더: output/category-motion/context-rings/. 진입, 정착, 수축, 중심 점, 조밀한 4개 층을 시각 확인했다. 전체 468프레임의 점 안전 여백과 중앙 문구 충돌을 기하 테스트로 확인했다. 같은 비율 2/3 및 20/30의 원호 각도 일치, 1조건, 페이지 나눔, 결측/0, 모션 줄이기, 12초 대기 및 전체 흐름 경계를 검증했다.

실제 웹에서 통합 맥락 선택 시 cycle 진입, 수축→재진입 반복, 모션 줄이기 즉시 완성 형태를 확인했다. 브라우저 오류 0개, 기존 오디오 자동재생 경고 1개.

미리보기: http://localhost:3110/TasteData-all 에서 맥락 선택. 개별: http://localhost:3110/TasteData-contextLayers, -idle, -reduced, -empty, -dense, -zero, -unanswered, -held, -single.

미검증: 실제 iOS/Swift 렌더·기기 실행, 실제 저장 데이터 연결. 네이티브/TBA/저장 모델은 수정하지 않았다.
