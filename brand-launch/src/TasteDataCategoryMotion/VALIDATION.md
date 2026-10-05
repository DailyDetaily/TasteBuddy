# 경험 모션 수정 및 검증 — 2026-09-16

미리보기 `TasteData-experienceCluster`. 기존 다섯 MotionStyle, 나머지 네 카테고리, 앱 화면 연결, TBA·집계·저장 모델은 이 경험 수정에 포함하지 않았다.

## 최종 동작

- 126개 표현점, 기본 fixture는 진한 점 21개 + 연한 점 105개. 중앙은 요리 기록과 별도로 계산한 11번 식사.
- 진한 점은 각 메뉴 컬러 모음의 중앙 쪽. 사용자 선택에 따라 이 배치를 유지했다.
- 기본 반경 9.5, 진한 점은 충돌 뒤 10.8로 조금 커짐. 보호 간격은 다른 점 경계까지 최소 7 논리 단위.
- 연한 점은 기존 `TASTE_TOKENS.*.palette.tintSurface`로 내부를 채운 원. 테두리 없음. main 컬러 불투명도만 낮춰 대체하지 않음.
- 120Hz 고정 시간 간격으로 관성·감쇠·충돌 반발을 계산하고 fixture별 궤적을 캐시. 30fps 출력과 프레임 탐색은 캐시를 읽음.
- 실제 같은 메뉴 점끼리 충돌하면 0.24초 동안 tintSurface로 전환. 분산 이후 모든 점끼리 겹침을 방지.
- 기존 점 링 진입·펼침을 이어받아 6.4초 정착, 이후 12초 반복. 반복마다 진입이나 시뮬레이션을 재시작하지 않음.
- 모션 줄이기는 완성 형태를 즉시 표시. 조밀한 예시의 메뉴명은 선택 목록에 기록 수와 함께 표시하고, 선택한 메뉴만 도형 내부에 표시하여 글자 겹침을 제거.

## 변경 파일

| 파일 | 역할 |
|---|---|
| `brand-launch/src/TasteDataCategoryMotion/experience.ts` | 126개 배분, 메뉴별 중앙 배치, 기존 진입 연결, 컬러·크기·요약 계산 |
| `brand-launch/src/TasteDataCategoryMotion/experience-physics.ts` | 결정적 구슬 충돌·관성·비겹침·궤적 캐시 |
| `brand-launch/src/TasteDataCategoryMotion/Preview.tsx` | 실제 SVG 채움 컬러 전환과 상호작용 |
| `brand-launch/src/TasteDataCategoryMotion/types.ts` | tintColor / tint 프레임 계약 |
| `brand-launch/src/TasteDataCategoryMotion/geometry.ts`, `index.tsx` | 별도 경험 엔진 및 192+360프레임 등록 |
| `brand-launch/scripts/export-experience-motion.mjs` | 공용 geometry에서 schema 4 JSON 출력 |
| `brand-launch/scripts/taste-data-category.test.mjs` | 카테고리·물리·토큰·의미 검증 13개 |
| `brand-launch/scripts/render-category-frames.mjs` | 상태별 실제 Remotion 프레임 렌더 |
| `ios/Reference/TasteExperienceClusterMotion.swift` | 같은 JSON의 독립 SwiftUI Canvas 및 재생·정지·프레임 탐색 |
| `brand-launch/src/TasteDataCategoryMotion/README.md`, `VALIDATION.md` | 의미·실행·검증 기록 |

앞선 카테고리 등록에서 변경한 `brand-launch/src/Root.tsx`와 `brand-launch/package.json`은 기존 preview 목록을 유지한다. 토큰 원본 `src/constants/designTokens.ts`는 읽어서 재사용하며 수정하지 않았다.

## 실행 명령과 종료 코드

작업 디렉터리: `/Users/sinjunho/Desktop/Taste Buddy/brand-launch`

| 명령 | 결과 |
|---|---|
| `npm run studio:categories` | 포트 3110 정상 실행 중. 장기 실행 서버이므로 종료 코드 없음 |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 |
| `node node_modules/eslint/bin/eslint.js src/TasteDataCategoryMotion src/Root.tsx` | 0 |
| `node --test scripts/taste-data-category.test.mjs scripts/taste-motion.test.mjs` | 0 · 23개 통과(카테고리 13 + 기존 모션 10) |
| `node scripts/render-category-frames.mjs --experience` | 0 · 실제 PNG 16개 |
| `node scripts/export-experience-motion.mjs` | 0 · 30fps 552프레임 JSON |
| `xcrun swiftc -target x86_64-apple-macosx14.0 ../ios/Reference/TasteExperienceClusterMotion.swift /tmp/taste-experience-main.swift -o /tmp/taste-experience-native-check` | 0 |
| `/tmp/taste-experience-native-check output/category-motion/experience-v2/experience-standard.json` | 0 · Swift 디코딩, 수량, 반경, 7px 간격, 모션 줄이기, 루프 검사 |
| Playwright CLI `run-code` (전체 스크립트: `verification/browser-final.log`) | 0 · 78프레임 탐색 후 실제 재생·정지 및 126개 유지 |
| `git diff --check` | 0 |

Swift 검증 소스는 `output/category-motion/experience-v2/verification/ExperienceMotionVerification.swift`에도 보관한다.

## 확인 결과

- 표준·조밀·기록 추가 fixture에서 실제 충돌 발생, 분산 이후 점 사이 비겹침, 프레임당 이동량 제한, 반발, 충돌 이후 tint 전환 확인.
- 표준 JSON 전체 552프레임 중 분산 이후 최소 점 사이 간격 약 0.3495px, 프레임당 최대 이동량 약 3.1259px. 정착 이후 진한 점 주변 7px 보호 간격은 별도 검증.
- 모든 실제 tintSurface 토큰 값, 126개 총수와 기록/식사 단위, 12초 반복 경계, 첫 프레임부터 완성된 모션 줄이기 검증.
- 표준 진입 0/9/18/30/57/78/105/135/165/192프레임, idle 시작/끝, reduced, empty, dense, added 실제 렌더 확인.
- 웹 SVG: 126개 점, 큰 점 21개, tintSurface 점 105개, 테두리 0개 확인. 프레임 탐색·재생·정지·메뉴 선택 확인.
- 된장국 선택: 4번 식사 / 8개 요리 기록 / 48개 표현점(진한 8 + 연한 40).

산출물: `output/category-motion/experience-v2/`. 렌더 목록은 `render-manifest.json`, 명령 로그와 JSON 측정 결과는 `verification/`에 보관한다.

## 원본 보존

- `TasteMotion.tsx` SHA-256: `8603c525dad163091d601a0eaa3ad1a68fdf058f1fecd6085a5fdd204fe3259f`
- `taste-motion.ts` SHA-256: `32a32ea05ecd15506ad8a60c45b6f07de7a8fd6a55a4403fb12a44cd48488192`

기존 점 링, 누르기 정렬, 드래그 회전 및 analysis → rotatingLayers → feedbackRings 전환의 원본 파일은 동일하다. 기존 iOS 작업 파일과 사용자의 다른 변경사항은 수정하지 않았다.

## 미검증 범위

실제 iOS 앱 연결·시뮬레이터/실기기 화면·기기 성능·실계정 데이터·TBA 집계는 검증하지 않았다. Swift는 독립 소스의 macOS 타깃 컴파일과 동일 JSON 재생 계약을 검증했다. Studio의 실시간 30fps 유지 성능은 측정하지 않았다.

## 후속 수정: 지속적인 작은 불규칙 움직임

- `experience.ts`: 점별 고정 시드의 독립적인 이동 경로. 승인한 정착 배치 주변 1.87 논리 단위 미만에서 12초 동안 연속적으로 움직임. 모션 줄이기는 정지 유지.
- `taste-data-category.test.mjs`: 독립 경로·이동 범위·속도 연속성·반복 경계 검사 추가.
- `render-category-frames.mjs`: `--idle-only`로 대기 시작/끝 프레임만 선택 검증.
- `experience-standard.json`: Swift 미리보기용 좌표 동기화.

| 명령 | 결과 |
|---|---|
| `node node_modules/typescript/bin/tsc --noEmit` | 0 |
| `node --test --test-name-pattern='experience reserves\|experience idle wander' scripts/taste-data-category.test.mjs` | 0 · 집중 검사 2개 통과 |
| `node scripts/render-category-frames.mjs --experience --idle-only` | 0 · 실제 PNG 2개 |
| `node scripts/export-experience-motion.mjs` | 0 · Swift용 JSON 갱신 |

프레임 목록: `output/category-motion/experience-v2/render-idle-manifest.json`. 로그: `verification/idle-*.log`. 앞선 전체 23개 검사 이후 이번에는 변경한 대기 경로에 대한 집중 검사만 실행했다.

## 후속 수정: 실제 화면의 정지와 가시성 문제 해결

- 확인한 Studio에서 기본 일시정지 상태였고, 재생해도 1.5초간 화면 평균 이동이 약 0.35px로 작았다.
- `Preview.tsx`: 대기 미리보기를 무음 자동 재생. Remotion Player의 재생·탐색 API로 실제 프레임을 진행하고, 반복 종료 및 프레임 누락 시에도 재생을 이어감. 상단 정지·재생 버튼 추가. 수동 정지와 프레임 탐색은 유지. 정적 내보내기에서는 제어 컴포넌트를 마운트하지 않음.
- `package.json`, `package-lock.json`: 이미 설치된 `@remotion/player@4.0.521`을 직접 의존성으로 명시.
- `experience.ts`: 국소 흐름과 점별 변위를 결합해 이동을 보이게 확대. 전체 그림의 단순 회전이 아니며, 기존 중심 배치와 보호 간격을 유지.
- 새 브라우저에서 사용자 클릭 없이 재생 확인. 1.5초간 화면 평균 이동 1.876px / 최대 4.752px. 12초 반복 경계를 지난 뒤에도 점 좌표가 계속 변함을 확인. 정지 시 좌표 고정 확인.

최종 확인: 타입 검사 0, ESLint 0, 대기·간격 집중 테스트 3개 통과(0), 실제 대기 PNG 2개 렌더(0), Swift용 JSON 재출력(0). 전체 테스트를 다시 실행한 것은 아니다. 로그는 `verification/visible-*.log`에 보관한다. 실제 iOS 기기 검증 범위는 앞선 기록과 동일하다.

추가 UI 검증: 358프레임을 일시정지 상태로 탐색해 정지 유지 확인. 재생 후 200ms 프레임 지연을 유도한 뒤 반복 경계에서 25→44프레임으로 계속 진행 확인. 원래 점 링 미리보기로 이동한 뒤 음소거 상태 복원 확인. Swift JSON 계약 재검증도 종료 0.
