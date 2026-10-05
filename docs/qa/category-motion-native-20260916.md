# 카테고리 상단 모션 네이티브 연결

대상 체크아웃: `/Users/sinjunho/Desktop/Taste Buddy`.

## 연결

- `TasteDataCategoryView.swift`: 선택한 기간·출처·감각·평가 척도·조건·경험 지표의 검증된 `TDState`/`TDResult`를 헤더에 전달.
- `TasteDataMotionInput.swift`: 실제 근거 ID를 웹 모션 데이터 계약으로 매핑. 식사 ID와 요리 기록 ID를 구분하며, 미응답·해석 보류·자료 없음은 임의의 0/긍정 응답으로 대체하지 않음.
- `TasteDataMotionView.swift`: 직렬 백그라운드 JavaScriptCore에서 결정적 기하 계산, SwiftUI Canvas에서 점과 연결부 렌더, SwiftUI에서 중앙 정보 렌더. 화면 이탈·백그라운드·모션 줄이기에서는 타임라인 중지.
- `TasteDataVisuals.swift`: 기존 헤더 위치 및 스크롤 축소/배경 틴트 유지. 스크롤에 따라 진입 프레임 역탐색.
- 취향/감각 드래그 회전·관성, 취향 탭 모음, 맥락 4개 초과 조건의 탭 페이지 이동 지원.
- 앱에는 fixture를 포함하지 않음. QA 실행 인자의 기존 격리된 예시 데이터만 테스트에서 사용.

| 화면 | 공유 모션 | 중앙 정보 |
|---|---|---|
| 경험 | experienceCluster | 실제 식사 수 (요리 기록 수와 구분) |
| 감각 | sensoryRays | 선택 감각 또는 현재 감각 영역의 기록 요약 |
| 취향 | preferenceFocus | 실제 평가 수와 해당 척도 |
| 맥락 | contextLayers | 같은 감각·척도의 조건 비교 요약 |
| 변화 | changeRipples | 선택한 경험 지표의 이전 → 최근 값 |

웹에서 승인된 기하를 Swift로 따로 재작성하지 않고, 순수 TS 모듈만 앱 리소스로 번들한다. React·fixture·네트워크 의존성은 번들에 포함하지 않는다. 중앙 텍스트도 동일한 프레임 결과를 사용한다.

## 웹 기하 변경 후 갱신

저장소 루트에서:

```sh
node brand-launch/scripts/export-native-category-motion.mjs
node --test brand-launch/scripts/native-category-motion.test.mjs
```

생성 파일: `ios/TasteBuddy/Resources/CategoryMotion/TasteDataCategoryMotion.js`.
프로젝트에 Swift 소스 2개와 JS 리소스, 네이티브 테스트 파일을 등록했다.

## 검증

- 공유 JS 번들/원본 TS의 5개 카테고리 프레임 일치: 2개 테스트 통과, 종료 코드 0.
- 네이티브 XCTest 최종: `TasteDataMotionTests` 6개 통과, 종료 코드 0. 실제 JavaScriptCore에서 다섯 종류의 프레임과 빈 상태, 응답 나뉨과 미응답의 구분을 확인.

```sh
xcodebuild -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -configuration Debug -destination 'platform=iOS Simulator,id=54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4' -derivedDataPath ios/DerivedData -only-testing:TasteBuddyTests/TasteDataMotionTests test
```

최종 성공 로그: `/tmp/taste-category-native-final.log` (확대 전 5개 테스트도 `/tmp/taste-category-native-test3.log`에서 통과). 앞선 빌드 두 번은 SwiftUI 타입 검사 병목 조사 중 직접 중단되어 종료 코드 75. 긴 접근성 레이블의 문자열 결합을 명시적 `Text` 보간으로 바꾸고 행 뷰를 분리한 후 통과했다. 카드 데이터/동작은 유지했다.

- UI XCTest 3개 통과, 종료 코드 0: 다섯 카테고리 상단/중앙 요약, 빈 데이터, 스크롤 배경 틴트·가로 발견 카드·근거 상세 이동. `/tmp/taste-category-motion-ui2.log`.
- 최초 UI 실행은 중첩된 모션 ID 대신 기존 헤더 ID를 사용하도록 테스트를 수정하며 중단 (종료 코드 143). 실제 화면의 표시 오류는 없었고, 수정된 식별자로 통과했다.
- 사용자 확인 후 중앙 숫자의 실제 표시 크기를 18→22pt, 긴 비교 숫자를 18→20pt로 확대. `TBFont`의 공통 18pt 상한을 변경하지 않고 중앙 수치에만 같은 Pretendard-Bold를 직접 지정. 제목·단위 크기는 유지. 확대 후 다섯 화면 UI 재검증 통과, 종료 코드 0 (`/tmp/taste-category-motion-ui-font.log`). 최종 캡처는 `output/qa/category-motion-native/enlarged/manifest.json`. 기본 글자 크기에서 중앙 정보 충돌과 외곽 잘림이 없음을 캡처로 확인.

```sh
xcodebuild -project ios/TasteBuddy.xcodeproj -scheme TasteBuddyMemoryQA -configuration Debug -destination 'platform=iOS Simulator,id=54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4' -derivedDataPath ios/DerivedData -only-testing:TasteBuddyMemoryUITests/GastronomyUITests/testCategorySpecificMotionHeadersUseNativeDataAndCentralSummaries -only-testing:TasteBuddyMemoryUITests/GastronomyUITests/testEmptyArchiveKeepsNeutralRingAndHasNoInventedMeasurements -only-testing:TasteBuddyMemoryUITests/GastronomyUITests/testRingTintAndHorizontalDiscoveryCardsOpenEvidence test
```

캡처: `output/qa/category-motion-native/first-validation/manifest.json` (각 카테고리·빈 상태·스크롤·근거 상세).
- 실기기 프레임 유지율과 실제 계정 데이터는 별도 확인 범위.

## 이번 연결의 변경 파일

- `ios/TasteBuddy/Features/Gastronomy/TasteDataCategoryView.swift`
- `ios/TasteBuddy/Features/Gastronomy/TasteDataVisuals.swift`
- `ios/TasteBuddy/Features/Gastronomy/TasteDataMotionInput.swift` (신규)
- `ios/TasteBuddy/Features/Gastronomy/TasteDataMotionView.swift` (신규)
- `ios/TasteBuddy/Resources/CategoryMotion/TasteDataCategoryMotion.js` (생성 리소스)
- `ios/TasteBuddy.xcodeproj/project.pbxproj` (소스·리소스·테스트 등록)
- `ios/TasteBuddyTests/TasteDataMotionTests.swift` (신규)
- `ios/TasteBuddyMemoryUITests/GastronomyUITests.swift` (헤더 연결 테스트 추가, 빈 상태 기대값 갱신)
- `brand-launch/scripts/export-native-category-motion.mjs` (신규)
- `brand-launch/scripts/native-category-motion.test.mjs` (신규)
- 이 검증 문서

기존 `TasteData-all` 웹 미리보기와 다섯 `TasteData-*` 미리보기는 유지한다. 이 연결 작업은 기존 TS 기하를 가져오며, 기본 `MotionStyle`/`TasteMotionStyle`, 저장 모델, TBA, 집계 엔진을 변경하지 않는다.

기타 정적 확인: `git diff --check`, `plutil -lint ios/TasteBuddy.xcodeproj/project.pbxproj` 각각 종료 코드 0.


## 최종 실행 미리보기

- 시뮬레이터 QA 예시 데이터 사용. 실제 사용자 계정 데이터의 결과로 제시하지 않는다.
- 경험 진입·대기 실행 녹화: `output/qa/category-motion-native/experience-live-final.mp4`.
- 네이티브 기동/녹화/스크린샷: `xcrun simctl launch`, `xcrun simctl io recordVideo --codec=h264`, `xcrun simctl io screenshot` 사용 (기동 인자 `--gastronomy-qa --gastronomy-category=경험`, 모션 줄이기 제외).
- 미검증: 실기기, 실제 계정 데이터, 지속 30fps 성능, 가장 큰 접근성 글자 크기, 모든 필터 조합의 UI 조작. 데이터 계약과 빈 상태는 단위 테스트로 별도 검증했다.

최종 녹화 약 29초, 모션 줄이기 비활성: 기동·녹화·스크린샷 모두 종료 코드 0. 최종 정착 캡처 `output/qa/category-motion-native/experience-enlarged.png` 확인. 녹화에는 시뮬레이터 앱 기동 시간도 포함된다.

유지된 웹 식별자: `TasteData-all`, `TasteData-experienceCluster`, `TasteData-sensoryRays`, `TasteData-preferenceFocus`, `TasteData-contextLayers`, `TasteData-changeRipples`, `TasteMotion-insightRing`.

## 경험 틴트 점 대비 보정

경험의 보조 점 채움에 기존 `tintSurface` 68% + 동일 미각 `main` 32%를 사용한다. 전체 색상 토큰은 그대로 두며, 진한 점·반경·배치·개수·타이밍·다른 카테고리에는 적용하지 않는다. 변경: `experience.ts`, 기존 색 검증의 토큰 유래 범위 조건, 생성된 iOS JS 리소스.

검증 (모두 종료 코드 0):
- `npx tsc --noEmit` (`brand-launch`): `/tmp/experience-tint-typecheck.log`
- `node --test --test-name-pattern='experience reserves' scripts/taste-data-category.test.mjs`: 1개 통과, `/tmp/experience-tint-test.log`
- `node --test scripts/native-category-motion.test.mjs`: 2개 통과, `/tmp/experience-tint-parity.log`
- `xcodebuild -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -configuration Debug -destination 'platform=iOS Simulator,id=54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4' -derivedDataPath ios/DerivedData build`: `/tmp/experience-tint-native-build.log`

최신 경험 캡처: `output/qa/category-motion-native/experience-tint-visible.png` (시뮬레이터 예시 데이터).

### 틴트 강도 재조정 및 카테고리 공통 적용

사용자 피드백에 따라 위 경험 32% 보정은 **16%**로 낮췄다. `TasteDataCategoryMotion/colors.ts`의 `motionTint`에서 `tintSurface` 84% + 같은 미각 `main` 16%를 계산하여 경험·감각·맥락·변화에 공통 적용한다. 취향은 틴트 서페이스가 아닌 기존 불투명도 단계 표현을 사용한다. 다른 데이터 좌표나 의미는 변경하지 않는다. 생성된 iOS JS 리소스도 함께 갱신했다.

16% 공통 보정 검증: `npx tsc --noEmit` 종료 0 (`/tmp/category-tint16-typecheck.log`), `node --test brand-launch/scripts/native-category-motion.test.mjs` 2개 통과·종료 0 (`/tmp/category-tint16-parity-final.log`), 위와 같은 iOS build 명령 종료 0 (`/tmp/category-tint16-native-build.log`). 새 공통 색 모듈을 읽도록 기존 테스트/경험 export 스크립트의 로더도 갱신했다 (초기 일치 테스트의 모듈 경로 오류 해결).

최신 16% 예시 화면: `output/qa/category-motion-native/experience-tint16.png`, `output/qa/category-motion-native/sensory-tint16.png`.

## 수축은 스크롤에서만 실행

자동 `cycle` 재생과 해당 선택 옵션/기본값을 제거했다. 맥락·변화는 1.8초 진입 후 12초 지그재그 대기만 계속 반복하며, 중앙 정보도 대기 중 유지한다. `contextPhase`의 대기 시간을 12초에서 멈추던 제한도 제거하여 장시간 대기가 정지하지 않는다. 수축은 웹 wheel과 iOS `collapseProgress`가 진입 시간을 거꾸로 탐색할 때만 발생한다.

변경: `context.ts`, `types.ts`, `geometry.ts`, `Gallery.tsx`, `index.tsx`, `Preview.tsx`, `TasteDataMotionInput.swift`, 생성 JS 리소스, 해당 시간/스크롤 회귀 테스트, 프레임 렌더 스크립트의 길이.

검증:
- `npx tsc --noEmit`: 종료 0 (`/tmp/scroll-only-typecheck.log`).
- `node --test --test-name-pattern='context|change and context|scroll seeks' scripts/taste-data-category.test.mjs`: 9개 통과, 종료 0 (`/tmp/scroll-only-motion-test.log`). 14.5초·15.6초·60초·1시간에도 정착을 유지하며, 장시간 대기 뒤 55개 진입 프레임을 역순 탐색해 비교했다.
- `node --test scripts/native-category-motion.test.mjs`: 2개 통과, 종료 0 (`/tmp/scroll-only-parity.log`).
- `xcodebuild` 동일 목적지에서 `-only-testing:TasteBuddyTests/TasteDataMotionTests test`: 7개 통과, 종료 0 (`/tmp/scroll-only-native-test.log`). 실제 JavaScriptCore에서 맥락·변화의 장시간 유지와 명시적 되감기를 확인했다.
- 실제 웹 통합 미리보기: Playwright로 맥락·변화를 각각 16초 동안 64회 샘플링하여 점 수와 정착 반경이 유지되는지 확인. 그림 위 아래 방향 wheel에서 중심 점 하나로 수축하고, 반대 방향 wheel에서 정착 링으로 복귀함을 확인. 종료 0 (`/tmp/scroll-only-web-ui-final.log`). 캡처: `output/playwright/맥락-idle-scroll-only.png`, `맥락-scrolled-contracted.png`, `변화-idle-scroll-only.png`, `변화-scrolled-contracted.png`. 최초 검사에서 투명 터치 영역까지 반경에 포함한 문제는 보이는 점만 검사하도록 수정했다.

## 해석 보류의 뉴트럴 표시

`frame.state === "held"`인 경우 기본 Home 점 링의 `TBColor.borderSubtle`과 같은 `COLOR_TOKENS.border.subtle` (#E8E8E8)을 사용한다. 기존 형태가 있으면 점/연결부 색만 뉴트럴로 바꾸고, 데이터 형태가 없으면 126개 기본 점 링을 상태 표시용으로 그린다. 이 점은 `data: false`이며 그룹/기록 역할을 제거한다. `—`, `해석 보류` 상태, 모션 줄이기, 스크롤 역재생은 유지한다. 자료 없음·미응답·유효 0은 별도 상태로 유지한다.

변경: `geometry.ts`, 생성 iOS JS 리소스, 상태 표시 회귀 테스트와 공유 번들 일치 테스트, 네이티브 테스트.

검증 (모두 종료 0):
- `npx tsc --noEmit`: `/tmp/held-neutral-typecheck.log`.
- `node --test scripts/taste-data-category.test.mjs scripts/native-category-motion.test.mjs`: 32개 통과 (`/tmp/held-neutral-tests.log`).
- 동일 iOS 목적지 `-only-testing:TasteBuddyTests/TasteDataMotionTests test`: 8개 통과 (`/tmp/held-neutral-native.log`). 실제 JavaScriptCore에서 다섯 카테고리의 뉴트럴 색 확인.
- Playwright 통합 미리보기의 다섯 해석 보류 화면: 각 126개 표시점, 단일 #E8E8E8 색, `—`와 해석 보류 문구 확인 (`/tmp/held-neutral-web-ui.log`). 캡처 `output/playwright/{경험,감각,취향,맥락,변화}-held-neutral.png`.

## 2026-09-17 경험 정착 위치 연속성

`experience.ts`에서 대기 기준 좌표를 사전에 계산한 목표 배치에서 **충돌 시뮬레이션 마지막 프레임의 실제 위치**로 변경했다. 정착 시 목표 좌표로 바꿔 끼우지 않으며, 마지막 위치에서 기존의 작은 독립 움직임을 이어간다. 충돌 계산·점 크기·색·보호 간격·기록 수는 유지한다.

변경: `experience.ts`, 끝점 일치/전환 경계 회귀 테스트, 생성 iOS JS 리소스.

검증 (최종 모두 종료 0):
- `node --test --test-name-pattern='experience' brand-launch/scripts/taste-data-category.test.mjs`: 6개 통과 (`/tmp/experience-continuity-test2.log`). 기본·조밀·추가 기록의 모든 점에서 실제 시뮬레이션 끝점과 정착 위치의 오차 < 1e-8, 경계 ±0.00001초 연속성, 기존 보호 간격/독립 대기 움직임 검증.
- `npx tsc --noEmit`: `/tmp/experience-endpoint-typecheck.log`.
- `node --test scripts/native-category-motion.test.mjs`: 2개 통과 (`/tmp/experience-endpoint-parity.log`).
- 기존 iOS 목적지의 `xcodebuild ... build`: `/tmp/experience-endpoint-native-build.log`.
- 실제 웹 미리보기 프레임 191→192→193 (6.4초 정착 경계): 각 126개 점 유지. 최대 프레임 간 변위 0.000769 / 0.042038 논리 단위 (`/tmp/experience-endpoint-web.log`). 캡처 `output/playwright/experience-endpoint-{191,192,193}.png`.

중지되어 있던 3110 웹 미리보기는 `npm run studio`로 재시작했다 (`/tmp/taste-motion-studio.log`). 실기기 실행은 이번 검증에 포함하지 않는다.

## 2026-09-17 상단 표시 대기 시간 단축

- `TasteDataCategoryView.swift`: 유효한 상단 데이터가 준비되면 먼저 게시한다. 하단의 발견 카드·추가 경험 카드·카드 표현 계산을 모두 기다리지 않는다. 기간·출처·계정 키와 취소 상태를 확인하므로 이전 범위의 상단을 표시하지 않는다. 후속 결과도 동일한 모션 입력을 사용해 진입을 재시작하지 않는다.
- `experience-physics.ts`: 한 시점의 반경/보호 범위를 반복 계산하지 않고, 충돌할 수 없는 먼 점 쌍을 먼저 제외한다. 실제 근접 점에는 기존 충돌 계산을 그대로 적용한다.
- `experience.ts`: 배치 정리의 고정 점 쌍 조건을 재사용하고, 멀리 떨어진 쌍의 거리 계산을 생략한다.
- `TasteDataMotionView.swift`: 집계가 이미 완료된 모션 준비 단계는 `준비 중`으로 표시한다.
- 생성 JS와 네이티브 테스트의 첫 프레임 계측도 갱신했다.

성능 비교: Node VM의 새 실행기에서 초기 준비를 포함한 5개 프레임(0/1.9/3/6.4/12초)을 계산했다. 3종의 예시 분포에서 기존 12.2~27.4초 → 0.85~1.50초 (약 14~23배). 비교한 좌표·크기·색·모든 프레임 필드는 정확히 같았다. 이는 Node VM 측정으로 실제 앱 화면 전체 로딩 시간과 다르다. 근거: `output/qa/category-motion-startup/node-comparison.json`.

iOS 시뮬레이터의 테스트 예시: 새 JavaScriptCore 실행기를 포함한 경험 첫 프레임 약 297ms. 나머지 카테고리는 같은 실행기를 재사용한 첫 프레임 약 3.5~6.2ms이며, 개별 화면 전체 기동 시간으로 해석하지 않는다.

검증:
- `npx tsc --noEmit`: 종료 0 (`/tmp/motion-startup-typecheck.log`).
- `node --test scripts/taste-data-category.test.mjs scripts/native-category-motion.test.mjs`: 33개 통과, 종료 0 (`/tmp/motion-startup-tests.log`).
- 동일 iOS 목적지의 `-only-testing:TasteBuddyTests/TasteDataMotionTests test`: 8개 통과, 종료 0 (`/tmp/motion-startup-native.log`).
- `TasteBuddyMemoryQA`의 다섯 카테고리 상단 연결/중앙 요약 및 빈 화면 UI 테스트: 2개 통과, 종료 0 (`/tmp/motion-startup-ui.log`). 실기기의 전체 진입 지연과 대규모 실제 계정 데이터는 별도 확인 범위다.

## 2026-09-19 경험 정착 후 회전·드래그·관성

- 경험은 기존 6.4초 충돌/정착 후 60초에 한 바퀴 시계방향으로 회전한다. 12초 점별 작은 움직임은 유지하며 전체 반복은 60초에서 이어진다.
- 웹은 감각 링의 기존 드래그/감속 관성 제어를 공유한다. 진입 중 드래그는 막고, 대기/모션 줄이기에서는 직접 회전할 수 있다. 모션 줄이기에서는 자동 회전·관성을 끈다.
- 웹 메뉴 라벨 위치는 점과 함께 돌지만 글자 방향과 중앙 정보는 유지한다. 스크롤 수축 시 보던 회전 방향을 이어받는다.
- iOS의 경험 헤더에도 기존 InsightRotation 드래그/관성을 연결하고, 스크롤 역탐색 시간과 회전 시간을 구분한다.
- MJS 경험 내보내기는 동일 `categoryFrame`을 사용하도록 연결했다. 192프레임 진입 + 1,800프레임 대기, 총 1,992프레임. 프레임별 메뉴 라벨 위치를 함께 저장하며 Swift 참조 뷰가 이를 읽는다.

변경: `geometry.ts`, `types.ts`, `Preview.tsx`, `TasteDataMotionView.swift`, 생성 JS, `export-experience-motion.mjs`, `ios/Reference/TasteExperienceClusterMotion.swift`, 회전/드리프트 회귀 테스트.

검증 (최종 종료 0):
- `npx tsc --noEmit`: `/tmp/experience-spin-typecheck.log`.
- `node --test scripts/taste-data-category.test.mjs scripts/native-category-motion.test.mjs`: 34개 통과 (`/tmp/experience-spin-tests-final.log`). 기존 드리프트 검사는 전체 회전을 역변환한 뒤 점별 움직임을 검사하도록 갱신했다.
- 동일 목적지의 `-only-testing:TasteBuddyTests/TasteDataMotionTests test`: 8개 통과 (`/tmp/experience-spin-native.log`).
- `node scripts/export-experience-motion.mjs standard`: 1,992프레임/126점/프레임별 라벨 확인. Swift 참조 파일 `swiftc -frontend -parse` 통과.
- 실제 웹 Playwright: 진입 드래그 무시, 대기 900ms 동안 약 0.098rad 시계방향 이동, 드래그 후 관성 증가분 약 0.732rad → 후기 0으로 감속, 스크롤 수축/복원 확인 (`/tmp/experience-spin-web.log`). 캡처 `output/playwright/experience-drag-inertia.png`, `experience-drag-scroll-restored.png`.
- 실기기 직접 드래그는 이번에 검증하지 않았다.
