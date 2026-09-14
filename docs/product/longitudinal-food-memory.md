# Longitudinal Food Memory 구현 및 인수 기록

시작: 2026-09-13, `/Users/sinjunho/Desktop/Taste Buddy`, `main`, `a69feb0fbb112834068f8191cc7a120a8bcef3d9`. 작업 트리 깨끗함. `git ls-remote origin refs/heads/main`으로 동일 원격 ref 확인. push/운영 배포 없음.

| 요구 | 현재 입력·저장·호출 | 재사용 | 실제 공백 / 변경 위치 | 검증 |
|---|---|---|---|---|
| 내 기록 찾기 | HomeSearchSheet → HomeSearchEngine → Kakao/profile fallback | 검색 shell·토큰 | 개인 범위, 전체 로컬 원문 인덱스, 외부 fallback 차단 | R1–R9·검색 범위·개인 query |
| 원문·비교 | DiningEntry → SensoryAnalysisEngine → SensoryEvidenceList | 정제·선택 출처·조건부 모델 | 현재 ID 기반 상세·공유 비교 경로 | 범위별 호감·반례·미해석 |
| 교정 | DiningFeedbackSheet → updateDiningEntry → 재분석 | 편집·계정 snapshot·취소/revision | 원문 교정 이력, 필드별 알려진 시각, 삭제 이력 제거 | C1·재실행·계정 round trip |
| 시간 | workingEntryDate → observedAt/date; knownAt=updatedAt/savedAt | TastePerceptionEngine·TasteChangeSeries | 식사 시점 출처/정밀도, 식사일 선택, 교정을 시간 변화와 구분 | 레거시·시점 미상·부분 수정 |
| 외부 분석 | ChatGPTAnalysisCard → v1 export → strict Zod → 24h snapshot | 선택적 공유·20개 제한 | mealID·원본 revision·시간/선택 출처·현재성 | 수신 validator·버전 호환·stale |
| 저장 | AppModel → UserDefaults → NativeAccountDataSnapshot → revision CAS | 계정 격리·충돌/삭제 전파·사진 repository | 새 Codable 필드 보존 및 저장 실패 표시 | 기존 계정·사진·회귀 테스트 |

기존 문서의 계획과 실제 구현을 구분했다. 네이티브 `DishFeedbackDetailSheet`는 현재 개인 원문을 직접 보여주지 않는 표시용 item 상세였으며, 분석 근거 목록에는 원본 편집 진입점이 없었다. 사진 EXIF는 `workingEntryDate`로 들어오지 않는다. 레거시 `date`를 확인된 식사일로 승격시키지 않는다.

진행 체크리스트:

- [x] 시작 ref·지침·호출 경로 조사
- [x] 변경 전 앱·기존 테스트 번들 컴파일 및 원래 바이너리 보관
- [ ] 변경 전 네이티브 baseline **실행**: Simulator 설치/기기 인식 단계에서 막힘
- [x] 고정 R1–R9/C1 원본·독립 의미 기대 테스트 작성, QA JSON과 별도 원본 고정
- [x] 개인 검색·원본·비교를 기존 화면과 라우트에 연결하고 컴파일
- [x] 교정·삭제·시간·계정·export 코드 및 관련 테스트 작성
- [x] 앱·전체 단위 테스트·UI 테스트 번들 빌드
- [x] JS/MCP/PGlite 회귀와 실제 Swift 파서 보조 실행
- [ ] 네이티브 XCTest/AppModel 수명주기 및 XCUITest **실행**
- [ ] 실제 앱 화면·연속 입력/스크롤·Dynamic Type·VoiceOver·Reduce Motion 확인
- [x] 인수 결과·실행 경계·재개 절차 기록

제품 검증: 합성 자료로 기술적 경계를 검사한다. 실제 사용자 원문/사진을 사용하거나 외부로 공유하지 않는다. 실제 사용자 연구와 유지율/정확도 개선 측정은 수행하지 않는다.

## 구현 경로

- `DiningEntry`의 선택·전체 평가·원문·ID·mealID를 유지한다. `mealTime`은 사용자 확인 날짜/대략적 기간/사진 후보/기록일만/시점 미상을 구분한다. 기존 날짜의 출처는 nil이다. EXIF 추출을 추가하지 않았다.
- `AppModel.persistDiningEntries`는 인코딩과 로컬 저장 확인 후 현재 배열을 바꾸고 기존 분석을 갱신한다. 원본이 없는 오래된 편집은 새 기록으로 삽입하지 않는다. 기존 입력 화면은 저장 실패 시 완료 화면으로 넘어가지 않는다.
- `FoodMemoryIndex.build`는 현재 계정의 모든 로컬 원문을 읽고 기존 observations/unresolved를 붙인다. 분석 대기 중에도 먼저 원문 인덱스를 제공한다. query는 지연·취소 가능한 기기 내 조회이며 최근 20개 export 제한을 재사용하지 않는다.
- `HomeSearchSheet`의 내 기록/공개 장소 범위를 명시하고 전환 시 query를 비운다. 개인 검색을 최근 공개 검색어에 저장하지 않고 Kakao/profile fallback으로 보내지 않는다. 전체 문장 이해는 한정된 회상 문형만 지원하며 그 밖에는 원문 검색과 명시적 필터로 돌아간다.
- `FoodMemoryDetailView`는 ID로 현재 `AppModel` 원본을 연다. 기존 개인 디시 상세·분석 근거·Taste Change와 같은 경로를 공유한다. `FoodMemoryComparisonView`는 전체/검색/관련 범위의 긍정·부정·중립·미확인을 함께 읽는다. 선택의 공통점과 상반 반응, 실제 조건 응답, 원문 포만 맥락을 표시한다. 인과효과·같은 레시피·영구 취향 전환을 추론하지 않는다.
- `DiningMemoryCorrection`은 실제로 바뀐 필드의 전후와 시각·revision만 보존한다. 이전 이력은 검색/학습 입력으로 사용하지 않는다. 명시적으로 지운 필드는 이력에서도 삭제한다. 되돌리기도 새 교정이며 새 식사가 아니다. 이전 원문이 없는 과거 revision은 만들지 않는다.
- 시점 출처가 없는 기록은 지각 변화 그래프에서 제외한다. 직접 회상 응답과 식사 강도 비교는 기존 `TastePerceptionEngine`/`TasteChangeSeries`를 유지한다. 기존 3+3 정책은 표시 정책임을 설명한다. 현재 원본의 `asOf` 필터는 과거 원문 전체 복원으로 표현하지 않는다.

## 배포와 호환

운영 환경에 적용하지 않은 migration 두 개가 있다. 로컬 보관은 즉시 작동하지만 계정 v2 백업에는 DB migration이 필요하다. 운영자 승인 후 순서는 v2 MCP 수신기 → DB의 v1/v2 허용 → 새 앱과 `TB_CHATGPT_EXPORT_VERSION=2` 설정이다. 외부 공유는 기존 사용자의 명시적 버튼 동작으로만 생성한다.

NativeAccountSnapshot 새 쓰기는 v2다. 새 클라이언트는 v1/v2를 읽고, 기존 v1 클라이언트는 이미 unknown version을 거부하므로 새 교정 필드를 지우며 다시 저장할 수 없다. 서버 trigger도 v2→v1 역행을 거부한다. v2를 강제로 v1로 변환하는 rollback은 제공하지 않는다. 호환 reader와 원문 archive를 유지해 복구한다. 충돌 시 기존 양쪽 보관본/CAS 경로를 유지한다.

ChatGPT v2는 최근 최대 20개 범위, 전체 로컬 수/제외 사유, mealID·경험 ID·revision, 저장 날짜와 식사 시각 출처, 선택 문구·응답, 알려진 시각을 분리한다. 원문 변경 시 이전 export를 낡은 상태로 표시하고 서버 제거를 시도한다. 오프라인이면 제거 대기로 보존한다. 이미 외부 대화에 들어간 답변을 삭제했다고 주장하지 않는다. v1 수신도 계속 지원하며 없는 정보를 보충하지 않는다.

## 실행 기록

- 시작 baseline: 기존 원본으로 앱·기존 XCTest bundle 컴파일/서명 완료. 시뮬레이터 테스트 시작 단계가 오래 대기하여 초기 명령을 중단했으며, 이 시점의 XCTest 실행 성공은 주장하지 않는다. 원래 바이너리를 `output/longitudinal-memory/baseline-binary/TasteBuddy.app`에 보관했다.
- 초기 새 빌드: generic destination과 `-arch`를 함께 전달한 명령은 Xcode 옵션 오류로 실패. 이후 `ARCHS=x86_64 ONLY_ACTIVE_ARCH=YES` 설정으로 수정했다.
- 첫 구현 컴파일: 인덱스의 긴 식에 Swift type-check 시간 초과. 명시적 배열·루프로 분리했다.
- `npm test --prefix integrations/chatgpt`: 7 passed.
- `node --test scripts/longitudinal-memory-storage.test.mjs`: 2 passed (로컬 PGlite, 운영 DB 아님).
- 기존 ChatGPT 소유권/만료, OAuth 계정 경계, 계정 revision/삭제 회귀: 3 passed (로컬).
- `node --test scripts/tba-platform-pilot/rules.test.mjs scripts/tba-platform-pilot/semantic-evaluation.test.mjs scripts/tba-engine/personal-taste-model.test.mjs scripts/tba-engine/advanced-personal-evaluation.test.mjs`: 62 passed. 공용 JS 회귀이며 네이티브 UI 실행 증거와 구분한다.
- 시뮬레이터 시작 지연 중 `python3 scripts/test-native-memory-parser.py`로 실제 Foundation 기반 Swift 파서 소스를 실행했다. 기존 계약 fixture 148개는 모두 일치했지만, 수정 전 R9에서 `고소해서 좋았다.`가 `overall_liking/positive/whole_dish`로 나와 독립 의미 기대에 실패했다. 문장·부위 범위를 연결하는 수정 후에는 같은 원문 전체 구간으로 `part_liking/positive/sauce`를 보존하고 148개 동등성 검사도 유지했다. 이 보조 실행은 iOS XCTest나 화면 실행을 대신하지 않는다.
- native sensory v3의 `part_liking`은 명시된 부위의 평가다. 특정 감각 속성·음식 전체 평가·지속 선호 후보로 변환하지 않으며, `고소함`의 감각 영역은 미해석으로 보존한다. 공유 계약의 기존 148개 결과는 바꾸지 않았다.
- 이후 빌드에서 기존 Void API 반환형 변경, private catalog 참조, 유효하지 않은 강도 enum, UI 테스트 PRODUCT_NAME 누락을 발견해 수정했다. 중간 빌드 중 시그니처 변경으로 발생한 혼합 object 링크 실패도 현재 전체 소스의 재빌드로 해소했다. 기존 baseline의 의미 테스트 실패로 분류하지 않는다.
- `implementation-build-7.log`, `implementation-build-final.log`: `TasteBuddy` scheme 앱과 모든 단위 테스트의 `TEST BUILD SUCCEEDED`. 최종 결과는 마지막 R1 검색 assertion 수정까지 포함한다.
- `implementation-build-search-optimization.log`: 검색 비용 수정까지 포함한 마지막 앱·단위 테스트 전체 `TEST BUILD SUCCEEDED`. 마지막 `git diff --check`도 통과했다.
- `ui-build-2.log`: 별도 `TasteBuddyMemoryQA` scheme의 앱·XCUITest 번들 `TEST BUILD SUCCEEDED`. UI 시나리오 2개는 검색/비교/C1/실행 취소/재실행/삭제 및 큰 글자 크기를 다룬다. 번들 빌드는 화면 실행 성공이 아니다.
- baseline와 현재 앱 모두 Simulator 설치 또는 테스트 시작에서 대기했다. 기존 QA 기기는 원래 꺼진 상태로 되돌렸고, 사용자 계정이 없는 별도 `Taste Buddy Memory QA 20260913` 기기를 생성했다. 이 기기는 부팅되지만 Xcode `-showdestinations`에는 실제 iOS Simulator가 하나도 나타나지 않는다. `memory-ui.log`의 실패는 `Unable to find a device matching the provided destination specifier`다. 런타임은 x86_64 지원/available로 보고됐으며 아키텍처 명시와 새 기기 부팅으로 해결되지 않았다.
- 네이티브 화면 제어는 `Frontmost app changed during capture. Observe again.`로 반복 실패했다. 대체한 `simctl` 캡처는 SpringBoard만 보여 앱 실행 증거로 사용하지 않는다. 실제 기능 화면 캡처는 아직 없다.
- 원래 바이너리로 별도 `baseline-preserved.xctestrun` 실행도 시뮬레이터 단계에서 멈췄다. 기존 테스트와 새 테스트 모두 실행 결과를 얻지 못했으므로 새 회귀가 없다고 단정하지 않는다.

## 사용자에게 보이는 변화와 답변 범위

| 질문 | 연결된 사용자 동작 | 고정 자료의 허용 의미 | 여전히 알 수 없는 것 |
|---|---|---|---|
| A | 기존 검색 → 내 기록 → 음식 전체/부분/불확실 필터 → 원본 | 전체 긍정 R1/R3/R4, R9 부분 긍정, R5 불확실, R2/R6 호감 미확인 | 기록하지 않은 호감 이유, 임의 문장 전체의 자연어 의도 |
| B | 검색 후보 전체 또는 모든 기억 비교 → 원본 열기 | R3/R4의 반대 산미 반응, R8/R9 포만·소스 회고, 긍정군 공통점과 같은 범위 반례 | 포만의 인과효과, 음식명으로 확정한 같은 레시피 |
| C | 비교의 날짜 출처와 원문 + 기존 Taste Change 근거 | 저장 날짜·확인된 식사일·나중 교정을 구분, R5 및 레거시 실제 식사일 보류 | 고정 R1–R9로 안정적인 취향 변화 판정, 없는 과거 원본 복원 |
| D | R7 원본 → 회고·시점 교정 또는 기존 전체 편집 → 저장 → 다시 조회 | C1 현재 원문, R7을 산미 불호로 사용하지 않음, 다른 R3의 불호 유지 | 생선 비린 향 문장 전체의 완전한 구조화, 기록에 없는 원인 |

이 표는 구현된 동작과 테스트 기대를 설명한다. 실제 사용자 UI 통과나 사용자 연구 결과를 의미하지 않는다. 변경 전 공개 식당·메뉴 중심 검색에서 개인 원문을 직접 찾고, 같은 상세·비교·교정 경로로 돌아갈 수 있게 했다. 화면의 목록 40개 표시는 전체 로컬 검색 범위와 분리되어 추가 표시할 수 있다. QA fixture는 `--food-memory-qa` 검증 전용 화면에만 들어가며 일반 내 기록에는 섞이지 않는다.

주요 연결: `DiningView`의 기존 입력/편집 → `DiningEntry.preparedForUpdate`와 `DiningMemoryContext` → `AppModel.persistDiningEntries` → 기존 `SensoryAnalysisEngine`의 관찰/미해석 → `FoodMemoryIndex` → `HomeSearchSheet`/`FoodMemoryResultsView` → ID 기반 `FoodMemoryDetailView`/공유 `FoodMemoryComparisonView` → `updateDiningEntry(expected:)`/`undoMemoryCorrection`/`deleteDiningEntry`. 프로필·질문 응답은 기존 엔진을 재사용하고, 열려 있는 과거 근거 시트는 원본 generation 변경 시 닫아 다시 현재 근거를 열도록 했다.

## 검증 수준별 인수 상태

| 항목 | 실행 증거 | 남은 검증 |
|---|---|---|
| R1–R9/C1 의미 | 실제 Swift 파서 148 계약 동등성 + 11 독립 원문/범위 검사 통과 | 앱의 전체 분석/XCTest/화면 |
| 구조화 평가 | 기존 JS 공용 회귀 62개, 네이티브 구조화 테스트 컴파일 | iOS 실행 시 강도/호감/fit/전체 상반·중립·미응답·미래값 전체 통합 |
| 교정/삭제/undo/redo/재실행 | 구현 및 5개 AppModel 수명주기 테스트 컴파일 | 현재 UserDefaults/계정 repository/비동기 index를 함께 실행 |
| 계정 백업·충돌·삭제 | 로컬 PGlite 새 v2 2개 + 기존 경계 3개 통과 | 실제 backend 배포·두 계정 앱 전환·사진 복원 |
| export | MCP 수신/validator 7개 통과, v1/v2·원본/식사/revision 계약 검사 | 설정 활성화 후 앱 publish/오프라인 제거 및 운영 연동 |
| UI | 실제 SwiftUI 호출 연결과 XCUITest 2개 컴파일 | 화면 조작/캡처, 큰 글자/VoiceOver/Reduce Motion/긴 회고 |

로컬 저장 확인은 JSON 인코딩 및 UserDefaults read-back이다. 디스크 flush·비정상 종료 내구성을 입증하는 것으로 표현하지 않는다. 서버 제거 대기는 삭제 완료와 다르게 표시하며 이미 외부 대화에 들어간 내용을 회수할 수는 없다.

## 보조 Swift 실행과 성능

`scripts/test-native-food-memory-core.py`는 실제 `DiningEntry` Codable/교정, 선택 파서, 엔진의 관찰 생성 부분, `FoodMemory.swift` 전체를 추출해 macOS에서 실행한다. UI 전용 사진 palette/생성 해석 컨테이너는 opaque JSON이며 카탈로그 표시 문구는 같은 계약에서 읽는다. 프로필·Taste Change·AppModel 저장·비동기 적용·화면은 이 실행에 포함되지 않는다. 이를 iOS 전체 네이티브 테스트로 부르지 않는다.

첫 실행: 독립 기억/교정 검사 14개 + 기존 구조화 감각·전체 평가 계약 fixture 286개 + 부하 정합성 3개, 총 303개 통과. R1–R9 JSON을 그대로 읽었으며 원본 수정 없이 A 전체 긍정 집합, 부분/불확실 분리, 공통점과 반례, C1 출처 시각·다른 경험 보존, 명시적 회고 삭제 시 이력 제거와 Codable round trip을 검사했다. 기존 286개 fixture 동등성과 14개 독립 의미 기대는 별개다.

측정 환경: Intel Core i7-9750H 6코어/16GB, macOS 26.5.2, Xcode Swift `-Onone`, 합성 한글 회고 약 200자 및 서로 다른 mealID. 같은 작업 중 수집한 호스트 진단은 load 약 333, CPU 약 94%, 메모리 여유 약 182MB로 매우 혼잡했다. 각 측정 구간의 부하를 통제하지 않았으므로 기기 성능 기준이나 개선율로 일반화하지 않는다. 사용자 자료·제품 지표는 사용하지 않았다.

첫 실행 측정(밀리초):

| 합성 기록 | 관찰 생성만 | 원문 인덱스 | 검색 20회 합계 | 비교 |
|---:|---:|---:|---:|---:|
| 50 | 5,548.99 | 713.81 | 1,457.29 | 13.73 |
| 500 | 31,161.22 | 1,816.51 | 4,742.33 | 134.83 |
| 2,000 | 76,369.49 | 4,993.26 | 18,246.40 | 491.66 |

이 결과를 빠른 UI의 증거로 사용할 수 없다. 긴 회고에서 이름의 공백 제거 비교를 매 검색마다 수행하던 비용을 확인해, 동등해질 수 있는 길이의 필드에만 적용하고 공백 정규식도 재사용하도록 좁혀 수정했다. 전체 분석과 수정 재계산, 초기 표시·연속 입력·스크롤의 실제 iOS 측정은 남아 있다. 백그라운드 계산과 취소/generation 보호가 있어도 전체 분석 완료 지연은 후속 실기기 검증 대상이다.

수정 후 같은 합성 부하의 보조 실행도 303개 검사를 통과했다. 별도 `--skip-performance` 실행은 붙여 쓴 한글 메뉴·조사·다른 음식 부분 문자열·여러 공백과 긴 원문 경계를 추가해 304개 통과했다. 다음은 수정 후 측정이며, 관찰 생성처럼 수정하지 않은 구간도 시간 변동이 커 통제된 전후 성능 비교로 해석하지 않는다.

| 합성 기록 | 관찰 생성만 | 원문 인덱스 | 검색 20회 합계 | 비교 |
|---:|---:|---:|---:|---:|
| 50 | 2,063.19 | 114.96 | 286.19 | 9.42 |
| 500 | 27,034.10 | 3,967.06 | 4,087.74 | 217.72 |
| 2,000 | 157,780.01 | 7,588.85 | 9,421.34 | 625.07 |

원본 로그는 `output/longitudinal-memory/host-memory-core-before-search-optimization.log`, `host-memory-core.log`, `host-memory-core-boundaries.log`에 보존했다. 로그·시뮬레이터 inventory·SpringBoard 캡처는 로컬 진단 자료로 두고 커밋 대상에서 제외했다.

## 재현 및 재개

아래 명령은 저장소 루트 기준이다. `-Onone`은 이번 검증 빌드에만 전달했다. 프로젝트의 제품 최적화 설정을 바꾸지 않았다.

```sh
npm test --prefix integrations/chatgpt
node --test scripts/longitudinal-memory-storage.test.mjs
node --test scripts/chatgpt-connection.test.mjs scripts/chatgpt-session-boundary.test.mjs scripts/test-native-account-data.mjs
node --test scripts/tba-platform-pilot/rules.test.mjs scripts/tba-platform-pilot/semantic-evaluation.test.mjs scripts/tba-engine/personal-taste-model.test.mjs scripts/tba-engine/advanced-personal-evaluation.test.mjs
python3 scripts/test-native-memory-parser.py
python3 scripts/test-native-food-memory-core.py
xcodebuild build-for-testing -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/DerivedData ARCHS=x86_64 ONLY_ACTIVE_ARCH=YES SWIFT_OPTIMIZATION_LEVEL=-Onone -jobs 2
xcrun simctl list devices available
xcodebuild -showdestinations -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -derivedDataPath ios/DerivedData
```

실제 기기가 Xcode에 다시 나타난 뒤, 아래 `<available-device-UUID>`를 그 ID로 교체한다. 현재 전용 QA 기기 ID는 `output/longitudinal-memory/qa-device-id.txt`에 있다.

```sh
xcodebuild test-without-building -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -destination 'platform=iOS Simulator,id=<available-device-UUID>' -derivedDataPath ios/DerivedData -parallel-testing-enabled NO -only-testing:TasteBuddyTests/LongitudinalFoodMemoryTests -only-testing:TasteBuddyTests/LongitudinalMemoryLifecycleTests -resultBundlePath output/longitudinal-memory/native-core-resumed.xcresult
xcodebuild test -project ios/TasteBuddy.xcodeproj -scheme TasteBuddyMemoryQA -destination 'platform=iOS Simulator,id=<available-device-UUID>' -derivedDataPath ios/DerivedData -parallel-testing-enabled NO SWIFT_OPTIMIZATION_LEVEL=-Onone -jobs 2 -resultBundlePath output/longitudinal-memory/ui-resumed.xcresult
```

첫 명령이 통과하면 관련 기존 네이티브 전체 회귀를 실행한다. UI scheme 빌드가 앱 내부 기존 단위 테스트 plugin을 정리할 수 있으므로, 단위 테스트 재개 직전에는 `TasteBuddy` scheme으로 다시 build-for-testing한다. `.xcresult` 경로는 재실행마다 새 이름을 사용한다.

시뮬레이터 서비스 재시작은 다른 프로젝트의 실행 중인 시뮬레이터도 멈출 수 있어 사용자 확인을 요청했다. 확인 없이 서비스나 다른 기기를 종료하지 않는다. UI 실행이 가능해지면 A–D 실제 화면 캡처, 긴 한글 입력/연속 검색/스크롤/수정 반영, Dynamic Type/VoiceOver/Reduce Motion, 50/500/2000개 전체 분석 및 수정 재계산 측정을 이어간다. QA preview 재실행은 fixture 초기화이므로 영속성 재실행 증거로 쓰지 않는다.

제품 검증 계획: 동의받은 별도 세션에서 사용자가 A–D를 수행하며 찾은 원문 ID, 누락/오탐, 평가 대상 오해, 교정 후 재조회 여부를 확인한다. 만족 응답만으로 의미 정확성을 판정하지 않는다. 이번 작업에서는 사용자 연구·실사용 성능·유지율·정확도 개선을 측정하지 않았다.

단순 Swift/JS 구현 동등성과 독립적인 고정 원문 의미 판정은 별도로 취급한다. 전체 기술적 인수는 Simulator 실행 항목이 남아 있어 아직 완료가 아니다.

종료 시점 확인: 브랜치 `main`, HEAD `a69feb0fbb112834068f8191cc7a120a8bcef3d9`. `git ls-remote origin refs/heads/main` 직접 재조회도 같은 SHA였다. 최신성 확인 범위는 이 원격 main ref다. 시작 작업 트리는 깨끗했고 종료에는 이번 구현의 미커밋 변경이 있다. reset/rebase/stash/push/PR 병합/운영 배포/운영 DB 변경/실제 사용자 export를 하지 않았다. 다른 프로젝트 시뮬레이터를 종료하지 않았으며, 이번에 만든 전용 QA 기기에만 종료를 요청했다.
