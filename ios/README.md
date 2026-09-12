# Taste Buddy iOS

The native app lives beside the existing Vite/React app. Neither app is generated from the other, so both can be developed and released independently while sharing the product language and backend contracts.

## Current Native Scope

- onboarding
- seven-step preference intake
- 12-item taste survey with optional respondent context
- Starter Taste Profile
- home recommendations and interpretation
- profile analysis
- dining history and post-dining feedback
- local profile management

Reservation and Tastick connectivity are intentionally excluded from this first native scope.

The implementation sequence and target SwiftUI architecture are documented in [`NATIVE_MIGRATION_GUIDE.md`](./NATIVE_MIGRATION_GUIDE.md). Supabase, PostgreSQL, RLS, Edge Functions, Cloudflare R2, offline sync, and backend security are covered in [`BACKEND_INTEGRATION_PLAN.md`](./BACKEND_INTEGRATION_PLAN.md). Native parity with the existing React guest app is tracked in [`PARITY_MATRIX.md`](./PARITY_MATRIX.md). Treat the guides as the execution plans and the matrix as the checklist for deciding whether a screen is actually ported, not just visually approximated.

## Project Layout

| Path | Role |
| --- | --- |
| `TasteBuddy/App` | app entry point and persisted app state |
| `TasteBuddy/DesignSystem` | Swift mirrors of the active Taste Buddy tokens |
| `TasteBuddy/Models` | calibration, profile, and dining models |
| `TasteBuddy/Components` | reusable native product components |
| `TasteBuddy/Features` | screen-level SwiftUI features |
| `TasteBuddyTests` | focused model and scoring tests |
| `project.yml` | XcodeGen source of truth |

Pretendard Regular, Medium, SemiBold, and Bold are bundled for parity with the web design system. Their license is included at [`LICENSES/Pretendard-LICENSE.txt`](./LICENSES/Pretendard-LICENSE.txt).

UI 모션은 [TasteBloomMotion 규칙](../docs/design/taste-bloom-motion.md)을 따른다. 꽃잎이 열리고 접히며 끝에서 작은 봉우리를 맺는 곡선과 다섯 역할을 공통으로 사용한다. 새 UI에는 `tasteBloomMotion(_:value:)` 또는 `TasteBloomMotion.animation(_:reduceMotion:)`을 적용한다.

## Generate And Run

Requirements:

- Xcode 16 or newer
- XcodeGen

Generate the project after changing `project.yml`:

```bash
cd ios
xcodegen generate
open TasteBuddy.xcodeproj
```

Select the `TasteBuddy` scheme and an iPhone simulator, then run.

## Web And iOS Together

Run the web app from the repository root:

```bash
npm run dev
```

Run the native app from Xcode. The web app continues to own the existing React UI and content/admin previews; `ios/` owns the native guest experience.

To open Xcode and start the web server in one command:

```bash
npm run dev:all
```

## Data Status

The current feature views still persist preference intake, profile, and dining feedback locally with `UserDefaults`, so the running app remains a prototype. Phase 0 reference captures and React-generated contract fixtures live in [`Reference`](./Reference) and `TasteBuddy/Resources/Fixtures`. Preference selection rules, quick calibration, and the 12-item survey scoring are checked against React-generated golden fixtures. The dining feedback scenario contract is also decoded in Swift before repository-backed domain state is introduced.

## 감각 모델과 앱 연결

홈과 나의 입맛, 식사 기록의 해석은 `SensoryAnalysisEngine`에서 같은 원문 기록을 분석한 결과를 사용한다. 기존 축 점수·강도·예시 매칭률을 새 취향 근거로 사용하지 않는다. 앱 시작과 기록 수정·삭제 때 다시 계산하며 실제 원문과 선택·사진은 보존한다. 자세한 계약, 검증, 한계는 [감각 모델과 앱 연결](../docs/product/tba-native-sensory-integration.md)을 확인한다.

주 입력은 미각 버블과 디테일 태그의 고정 선택이며, 메모는 선택을 보충한다. 선택 당시 라벨과 직접 평가·조건을 함께 저장하고, 평가하지 않은 감각의 호감을 만들지 않는다. 저장·호환·의미 계약은 [선택형 수집](../docs/product/tba-structured-selection-intake.md)을 확인한다.

공유 계약을 바꿨다면 프로젝트 루트에서 `node scripts/build-dining-sensory-selection-contract.mjs`와 `node scripts/build-tba-sensory-native-contract.mjs`로 데이터 전용 JSON을 재생성한다. Swift 정제·메인/윙 계약은 `SensoryAnalysisEngineTests`에서, 선택 의미와 저장·재시작은 `SensoryStructuredSelectionTests`, `AppModelStructuredSelectionPersistenceTests`, `SensoryOverallEvaluationTests`에서 검증한다. DEBUG 또는 시뮬레이터 빌드의 실행 인자 `--sensory-home-qa`, `--sensory-analysis-qa`, `--sensory-collection-qa`, `--sensory-overall-qa`, `--sensory-map-qa`는 별도 UserDefaults에 메모 없는 명시적 가상 선택을 넣어 홈·분석·디테일 입력·전체 평가·미각 지도 화면을 점검한다.

조건부 개인 모델은 `PersonalTasteModelBuilder`를 사용하며 `mealID`별 반복 근거, 강도·대상·시점·음식 종류의 비교, 반례·중립·상충과 다음 확인 질문을 보존한다. `node scripts/build-personal-taste-model-contract.mjs --check`로 별도 JS/Swift 계약을 확인한다. `PersonalTasteModelTests`, `AdvancedPersonalTasteModelTests`, `AppModelAdvancedModelTests`, `DiningAdvancedStorageTests`, `PersonalTasteQuestionResolutionTests`는 모델·저장·질문 해결 경계를 검증한다. `--sensory-advanced-qa`는 실제 같은 식사의 여러 접시와 조건 반전·반례를 담은 별도 가상 기록으로 분석 화면을 연다. 모델의 적용 범위와 실제 실행 결과는 [조건부 개인 취향 모델](../docs/product/tba-advanced-personal-model.md)에 기록한다.

같은 가상 기록의 홈은 `--sensory-advanced-home-qa`, 조건별 근거 상세는 `--sensory-advanced-detail-qa`로 확인한다. 이 실행 인자들은 DEBUG 또는 시뮬레이터 검증 범위에서만 동작한다.

개인 모델 v2는 알맞음의 조건별 반복, 전체 5단계와 개별 3단계 평가의 교차 해석, 답변에 따른 해석 변화로 고르는 다음 질문을 추가한다. `PersonalTasteInsightTests`와 공유 계약 21개가 이 의미를 검증한다. 분석·홈은 `--sensory-insights-qa`, `--sensory-insights-home-qa`, 근거 상세는 `--sensory-fit-detail-qa`, `--sensory-overall-detail-qa`로 확인한다. 범위와 실제 검증 결과는 [개인 모델 v2](../docs/product/tba-personal-insights-v2.md)를 확인한다.
