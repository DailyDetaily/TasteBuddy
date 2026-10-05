# 미식 데이터 v2 구현

기준 명세: `TasteBuddy_gastronomy_implementation_spec_v2.md` (2026-09-15).
적용 체크아웃: `/Users/sinjunho/Desktop/Taste Buddy`, 시작 HEAD `d1845d0`.

## 브랜치 재사용

`origin/feat/gastronomy-data-five-categories-20260915`의 `7f16530`을 조회하고
5개 카테고리 화면과 순수 집계 구조를 재사용했다. 브랜치를 통째로 병합하지 않고,
기존 `HomeSummaryComponents.swift`에 모인 코드를 `Features/Gastronomy`로 나눴다.
식사 원본 검증, 근거 역할, 현재 원본 갱신, 공통 발견 정책은 v2 계약으로 보완했다.

## 실제 호출 경로

- 홈의 경험·감각·취향·맥락·변화 카드 → 기존 `homeInsight` 경로 → `TasteDataCategoryView`.
- 이전 9개 요약 경로는 5개 카테고리로 매핑한다.
- `TDNativeAdapter` → `TDDataEngine.prepare` → 카테고리별 측정과 공통 발견 후보.
- 홈과 카테고리는 같은 검증 입력을 재사용한다. 카테고리 계산은 취소 가능한 비동기 작업이며,
  원본·분석·계정·기간·시간대·선택이 달라지면 이전 결과를 화면에 적용하지 않는다.
- 측정 상세와 발견 상세 → 분자/분모/반례/미응답/보류/참고 원본 → 기존 기록 상세 및 수정.
- 바깥 카드 목록은 개수가 정해진 일반 스택을 사용하고, 긴 측정·발견·원본 목록은 30개씩 펼친다.
  iOS 26.5에서 처음/다시 선택 후 지연 스택을 스크롤할 때 발생한 레이아웃 반복을 UI 테스트로 발견해 수정했다.

## 측정 19종

| 카테고리 | 측정 |
| --- | --- |
| 경험 6종 | 식사, 메뉴, 식당, 음식 종류, 처음 기록한 경험, 다시 기록한 경험 |
| 감각 2종 | 감각 존재와 비중, 강도 분포 |
| 취향 3종 | 음식 전체 평가, 감각 호감, 알맞음 |
| 맥락 4종 | 음식 종류·부위·시점·연결된 강도별 반응 |
| 변화 4종 | 경험 수, 감각 존재 비중, 같은 범위의 호감, 같은 범위의 알맞음 |

처음/다시는 각각 메뉴·식당·음식 종류를 선택한다. 기간 밖의 전체 기록을 사용해 최초 여부와
이전 기록을 판별하며, 같은 첫날의 여러 식사는 임의로 순서를 정하지 않는다.
변화는 기본 최근 90일과 이전 90일을 사용하며 선택 기간과 같은 길이의 직전 기간을 비교한다.

## 상세 화면 구성 변경 (2026-09-15 추가 지시)

Withings 화면은 영역 순서와 가로 목록 구성의 참고로 사용했다. Taste Buddy의 기존 카드,
서체, 간격, 카테고리 색을 사용한다.

- 다섯 화면 상단에 기존 `HomeInsightDotRing`을 복구했다. 현재는 같은 점 링을 쓰며,
  `TDCategoryRingHeader` 영역을 나중에 카테고리별 시각화로 바꿀 수 있다.
- 링은 위로 스크롤하면 접히고, 마지막 구간에서 페이지와 상단 바 배경이 해당 카테고리의
  `tintSurface`로 전환된다. 다시 위로 돌아오면 링과 기본 배경을 복원한다.
- 링의 숫자는 현재 기간·출처의 검증된 독립 식사 수다. 로딩, 빈 아카이브, 확인 불가와 실제 0을
  구분한다. 색 분포는 선택 범위의 직접 감각 존재 응답만 사용한다.
- 측정은 `TDArchiveMeasurementCard`가 홈의 실제 `HomePeriodInsightCard`를 재사용해 세로로 표시한다.
  카드 앞면에는 대표값·미리보기, 탭하면 전체 항목과 집계 근거를 표시한다. 겹치는 감각·조건의
  응답 분포를 하나로 합치지 않으며, 홈의 메뉴·식당 구성 그래프 생략 정책도 유지한다.
  경험 카드 앞면은 기록 이름·횟수·첫 기록 날짜를 요약한다. 호감/알맞음 변화는 같은 범위의
  이전·최근 응답을 함께 표시하며, 한쪽 기간의 분포를 변화 그래프로 대신 표시하지 않는다.
- 기간 선택은 측정 제목 옆에 두고, 출처·감각 선택은 ‘보기 설정’으로 묶었다. 처음/다시 경험의
  메뉴·식당·음식 종류 선택은 각 카드 안에 유지한다. 접근성 글자 크기에서는 세로 배치와 메뉴를 쓴다.
- 발견은 `TDDiscoveryCard`와 `TDDiscoveryCardList`로 컴포넌트화했다. 같은 범위의 카드를 가로로
  묶고 다음 카드 일부를 노출한다. 현재 범위·전체 기록·별도 비교 기간의 구분과 읽음·숨김 정책,
  근거 상세와 원본 열기는 유지한다.
- 상단 바의 틴트는 경로 제목 대신 실제 카테고리 키로 연결했다. 취향/맥락도 화면 배경과 함께 변한다.
- UI 테스트의 `--gastronomy-reduce-motion`은 DEBUG 시뮬레이터 QA 진입점에서만 링을 정지시킨다.
  일반 화면에서는 시스템 동작 줄이기 설정과 기존 애니메이션 수명 주기를 따른다.

## 발견 13개 관계의 매핑

| 명세 | 구현 | 방식 |
| --- | --- | --- |
| E-D01 한 식당의 여러 메뉴 | `restaurantCollection` | 기존 규칙 재사용 |
| E-D02 함께 기록한 메뉴 | `menuCooccurrence` | 같은 식사의 메뉴 쌍 |
| E-D03 여러 식당의 같은 종류 | `foodKindAcrossRestaurants` | 검증 식당·명시 분류 |
| E-D04 익숙한 식당의 새 메뉴 | `newMenuAtKnownRestaurant` | 전체 기록의 엄격한 선후 관계 |
| S-D01 함께 나타난 감각 | `sensoryCooccurrence` | 같은 요리, 독립 식사 반복 |
| P-D01 여러 메뉴의 공통 호감 | `commonPreference` | 기존 75% 및 다중 메뉴 규칙 |
| P-D02 전체 평가와 다른 감각 평가 | `overallContrast` | 기존 같은 요리의 반대 방향 |
| P-D03 기존 패턴의 최신 예외 | `patternException` | 기존 반례·안정성 규칙 |
| C-D01 조건별 반응 차이 | `conditionalContrast` | 기존 메뉴 조건 대비 범위 유지 |
| C-D02 반복된 강도와 알맞음 | `preferredIntensity` | 기존 직접 연결·알맞음 규칙 |
| T-D01 감각 비중 변화 | `sensoryPeriodChange` | 기간별 최소 5식사, 20pp |
| T-D02 같은 범위의 평가 변화 | `periodChange`, `fitPeriodChange` | 호감 기존/알맞음 확장, 40pp 및 안정성 |
| T-D03 같은 메뉴의 두 시점 평가 | `revisitComparison` | 기존 확인 식사일 비교 |

새 유형도 `HomeDiscoveryCard`, 의미 키, source revision, 계정별 읽음·7일 숨김을 사용한다.
홈에서 읽은 발견은 카테고리의 ‘확인한 발견’에서 다시 열 수 있다.
단순 메뉴 횟수는 측정에 있으므로 통합 발견 목록에 복제하지 않는다. 기존 회상 카드는 유지한다.

## 데이터 경계

- 식사는 `mealID`, 요리 원본은 entry ID로 구분한다. 충돌하는 중복 원본은 식사 전체를 보류한다.
- 식사 구성원 전체의 확인 날짜를 먼저 검증한다. 부분 미확인·상충 날짜는 기간 집계에서 제외하고,
  확인된 미래 날짜가 하나라도 있으면 식사 전체를 제외한다.
- 식당명만으로 식당 정체성을 만들지 않는다. 식당/제공자 ID를 사용하며 메뉴 정체성은 식당 범위다.
- 직접 요리는 선택적 `DiningFoodSource`와 명시적인 동일 요리 ID를 저장한다. 과거 출처는 unknown이다.
- 감각은 현재 카탈로그와 원본 선택을 다시 파싱해 snapshot 관찰의 의미·척도·대상·시점·revision을 대조한다.
- 강도·호감·알맞음·전체 평가는 독립된 척도다. AI 회고나 사진으로 빈 응답을 채우지 않는다.
- 강도는 같은 직접 선택 또는 현재 검증된 부모 선택으로만 연결한다. 부모가 같다는 이유로 형제 선택끼리 연결하지 않는다.
  검증한 연결 ID를 기존 호감·알맞음 규칙에 전달하며, 다른 호출 경로의 기본 선택 연결 규칙은 유지한다.
- 다른 유효 응답은 혼합, 같은 선택의 충돌은 보류, 대상이 알려진 무응답은 미응답으로 보존한다.
- 미연결·확인 불가는 0과 다르다. 근거 상세에서 집계 단위, 범위, 분자/분모, 겹치는 식사와 참고 기록을 구분한다.

## 검증

검증 로그 및 xcresult: `/tmp/tastebuddy-gastronomy-v2-20260915/`.

- 초기 전체 네이티브 빌드: 성공 (`build-1.log`).
- 첫 회귀 실행: 148개 중 4개 실패 (`unit-2.log`). 직접 요리 출처의 JSON 저장 누락을 수정했고,
  기존 반복 횟수 발견에 의존하던 생명주기 테스트 3개는 새 메뉴 조합 발견으로 전환했다.
- 첫 UI 실행: 빈 아카이브 통과 후 스크롤 정지로 중단 (`ui-1.log`, `ui-stall-sample.txt`).
- 두 번째 UI 실행: 스크롤·토글·근거 열람이 통과했다. 홈 가로 목록 밖 카드의 XCTest 터치 조회 오류를
  가시 영역 확인 후 스와이프하는 방식으로 수정했다. 캡처를 직접 검토하며 큰 글자에서 기간 컨트롤이
  날짜와 겹치는 문제를 추가로 발견해 세로 배치로 수정했다.
- 최종 단위·통합 회귀: **198개 통과, 실패 0, 종료 코드 0** (`unit-3.log`, `unit-3.xcresult`). 신규 미식 데이터 49개와 기존 기능 149개를 실행했다.
- 네이티브 UI: **4개 통과, 실패 0, 종료 코드 0** (`ui-3.log`, `ui-3.xcresult`). 실제 홈의 다섯 경로·뒤로 가기, 처음/다시 토글 6가지, 근거 상세, 빈 기록, 접근성 최대 글자 크기의 맥락/변화 스크롤을 실행했다.
- 이후 날짜 미확인 원본의 전체 아카이브 범위 표기를 보완한 최종 앱 빌드도 성공했다. **종료 코드 0** (`build-final.log`).
- `git diff --check`: 통과. 작업은 시작 시의 main 작업 트리에 있으며 커밋·푸시·병합은 수행하지 않았다.
- 합성 원본을 사용하는 DEBUG 시뮬레이터 진입점: `--gastronomy-qa`,
  `--gastronomy-category=경험`, `--gastronomy-empty`. 제품 데이터나 운영 백엔드에 가상 기록을 넣지 않는다.
- 실기기 터치·VoiceOver 음성·운영 계정 동기화는 별도 검증 범위다.

### 회귀 실행 환경과 명령

iOS 26.5 시뮬레이터 `Taste Buddy Memory QA 20260913`
(`54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4`), Xcode `/Applications/Xcode.app`, Debug, Intel x86_64.
다음 명령은 실제 실행 로그의 invocation이다. 저장소 루트에서 실행했으며 새 결과 번들 경로가 필요하다.

```sh
/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild test -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -destination "platform=iOS Simulator,id=54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4" -derivedDataPath ios/DerivedData -disableAutomaticPackageResolution -jobs 2 -parallel-testing-enabled NO -collect-test-diagnostics never "-only-testing:TasteBuddyTests/GastronomyDataTests" "-only-testing:TasteBuddyTests/GastronomyNativeTests" "-only-testing:TasteBuddyTests/GastronomyIntegrationTests" "-only-testing:TasteBuddyTests/HomeDiscoveryEngineTests" "-only-testing:TasteBuddyTests/HomeTasteQuestionsIntegrationTests" "-only-testing:TasteBuddyTests/PersonalTasteInsightTests" "-only-testing:TasteBuddyTests/HomeSummaryEngineTests" "-only-testing:TasteBuddyTests/LongitudinalFoodMemoryTests" "-only-testing:TasteBuddyTests/PersonalTasteModelTests" "-only-testing:TasteBuddyTests/AdvancedPersonalTasteModelTests" "-only-testing:TasteBuddyTests/PersonalTasteQuestionResolutionTests" "-only-testing:TasteBuddyTests/DiningAdvancedStorageTests" -resultBundlePath /tmp/tastebuddy-gastronomy-v2-20260915/unit-3.xcresult CODE_SIGNING_ALLOWED=NO
```

기존 전체 회고 분석의 합성 2,000개 원본 검사는 최초 분석 약 63.0초, 정정 후 재분석 약 65.9초였다.
이는 해당 시뮬레이터의 기존 전체 분석 경로 측정이며 새 카테고리 화면의 스크롤 지연 수치가 아니다.
카테고리는 정규화 입력과 집계 결과를 캐시하고 계산 중에는 갱신 상태를 표시한다. 실기기 분석 시간은 측정하지 않았다.

### UI 및 최종 빌드 명령

```sh
/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild test -project ios/TasteBuddy.xcodeproj -scheme TasteBuddyMemoryQA -destination "platform=iOS Simulator,id=54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4" -derivedDataPath ios/DerivedData -disableAutomaticPackageResolution -jobs 2 -parallel-testing-enabled NO -collect-test-diagnostics never "-only-testing:TasteBuddyMemoryUITests/GastronomyUITests" -resultBundlePath /tmp/tastebuddy-gastronomy-v2-20260915/ui-3.xcresult CODE_SIGNING_ALLOWED=NO
/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild build -project ios/TasteBuddy.xcodeproj -scheme TasteBuddy -destination "platform=iOS Simulator,id=54C3F98C-6BD5-47E0-98E5-DC9C1FCC40C4" -derivedDataPath ios/DerivedData -disableAutomaticPackageResolution -jobs 2 CODE_SIGNING_ALLOWED=NO
```

### 캡처 검토

UI 테스트에서 보존한 캡처 13개를 `ui-3-attachments`에 내보냈다. 일반 크기의 다섯 화면과
근거 상세, 큰 글자에서의 상단·히어로를 직접 검토했다. 큰 글자에서 기간 선택과 날짜가
겹치던 문제는 세로 배치 후 해소됐다.

| 화면 | 캡처 |
| --- | --- |
| 경험 | [열기](/tmp/tastebuddy-gastronomy-v2-20260915/ui-3-attachments/CF568E55-1D2D-43A6-9B2E-999AEAC94278.png) |
| 감각 | [열기](/tmp/tastebuddy-gastronomy-v2-20260915/ui-3-attachments/ECA315B8-E0B2-4F55-B8F0-78B922B3451B.png) |
| 취향 | [열기](/tmp/tastebuddy-gastronomy-v2-20260915/ui-3-attachments/5D97DE27-B49F-4C1C-8CE7-BCC69A2914DE.png) |
| 맥락 | [열기](/tmp/tastebuddy-gastronomy-v2-20260915/ui-3-attachments/D5326BD3-E63C-428D-8D37-F0257592FC41.png) |
| 변화 | [열기](/tmp/tastebuddy-gastronomy-v2-20260915/ui-3-attachments/BDDF01E8-1F7C-452D-A47A-FB641FD9E675.png) |
| 큰 글자 변화 상단 | [열기](/tmp/tastebuddy-gastronomy-v2-20260915/ui-3-attachments/9DF8E479-70D2-48C8-B19A-60F05CC9C58D.png) |
| 큰 글자 변화 히어로 | [열기](/tmp/tastebuddy-gastronomy-v2-20260915/ui-3-attachments/ED597FCA-75CC-4329-8206-0C4075894131.png) |

## 변경 파일 안내

- `Features/Gastronomy/`: 측정 모델·집계·네이티브 입력 검증·발견 통합·카테고리 화면·차트·근거 상세·직접 요리 출처 편집·DEBUG 시뮬레이터 자료.
- `HomeArchiveVisualizationModels.swift`, `HomeDiscoveryModels.swift`, `HomeDiscoveryViews.swift`: 공통 입력, 범위별 후보와 근거, 기존 발견 상세 연결.
- `HomeSummaryComponents.swift`, `AppNavigation.swift`, `SystemParityComponents.swift`: 홈 5개 진입점, 이전 경로 매핑, 공통 카드 레이아웃 재사용.
- `DiningFoodSource.swift`, `TasteModels.swift`, `DiningMemoryContext.swift`, `DiningView.swift`, `FoodMemoryViews.swift`, `PersonalTasteQuestionAnswer.swift`: 출처 저장·복원·수정 및 기존 답변 흐름의 필드 보존.
- `PersonalTasteModel.swift`, `PersonalTasteInsights.swift`: 검증된 강도 연결 ID를 받는 선택적 인자. 기본 호출 정책 유지.
- `AppModel.swift`, `TasteBuddyApp.swift`: 계정·원본 revision을 확인한 발견 이력 갱신과 DEBUG UI 진입점.
- `GastronomyDataTests.swift`, `GastronomyNativeTests.swift`, `GastronomyIntegrationTests.swift`, `GastronomyUITests.swift`, `HomeTasteQuestionsIntegrationTests.swift`: 집계·관계·수명 주기·UI 실행 회귀.
- `TasteBuddy.xcodeproj/project.pbxproj`: 신규 파일을 기존 앱·테스트 타깃에 등록.

## 2026-09-15 실기기 SDK 빌드 오류 확인

Xcode의 실패한 `Debug-iphoneos/arm64` 빌드 목록은 101개였으며 새 소스 10개
(`Gastronomy` 9개와 `DiningFoodSource.swift`)가 빠져 있었다. 디스크 프로젝트와 최신
Xcode 인덱스에는 이미 등록돼 있었다. 같은 Xcode DerivedData 경로에서 재빌드해 목록을
111개(생성 소스 포함)로 갱신했고, 앱 코드 추가 수정 없이 **BUILD SUCCEEDED / 종료 코드 0**을 확인했다.

- 로그: `/tmp/tastebuddy-device-build-fix-20260915/device-build.log`
- 전후 목록: 같은 폴더의 `device-sources-before.txt`, `device-sources-after.txt`.
- 검증 범위: Debug, iOS 실기기 SDK, arm64 앱 빌드. `CODE_SIGNING_ALLOWED=NO`로 서명·설치·실기기 실행은 제외했다.
- Xcode에 이전 오류가 남아 있으면 새 빌드(⌘B) 결과를 확인한다.

## 2026-09-15 상세 화면 복구 검증

증거 폴더: `/tmp/tastebuddy-category-layout-20260915/`.

- 데이터·렌더링 회귀 **37개 통과, 실패 0, 종료 코드 0** (`unit-2.log`, `unit-2.xcresult`).
  미식 데이터 29개, 홈 요약 7개, 실제 링 렌더링 1개를 실행했다. 선택 범위의 독립 식사 수,
  직접 감각 존재와 호감의 분리, 겹치는 평가 분포를 합산하지 않는 카드 미리보기를 확인했다.
  링 렌더링 테스트는 시간차 이미지와 동작 줄이기의 정지 이미지를 비교했다.
- 최초 UI 실행에서 측정 영역의 상위 식별자가 카드별 식별자를 덮는 문제를 확인해 제거했다.
  링의 빈 상태 검사는 실제 접근성 요소의 식별자로 수정했다. 이 실행은 중단했다 (`ui.log`).
- 경험 화면 캡처에서 발견 제목의 중복 표시를 확인해 공통 발견 카드에서 정리했다.
- 두 번째 UI 실행은 **5개 통과, 실패 0, 종료 코드 0** (`ui-2.log`, `ui-2.xcresult`).
  다섯 카테고리 경로·뒤로 가기·스크롤 시 페이지/상단 바 틴트 일치·위로 돌아올 때 기본 배경 복원,
  처음/다시의 세 가지 단위, 측정/발견 근거 상세와 읽음 처리, 빈 기록, 큰 글자를 실행했다.
  캡처 22개는 `ui-2-attachments`에 있다. 캡처 검토 후 경험 요약 문구, 변화의 양쪽 기간 미리보기,
  큰 글자에서의 카드 제목 공간을 추가 보완했다.
- 최종 데이터·렌더링 회귀는 **38개 통과, 실패 0, 종료 코드 0** (`unit-verified.log`,
  `unit-verified.xcresult`). 서로 다른 메뉴/조건 범위의 행 순서를 바꿔도 이전과 최근을
  같은 범위끼리 짝지어 미리보기하는지 추가로 확인했다.
- 최종 앱 바이너리로 UI **5개 재실행 통과, 실패 0, 종료 코드 0** (`ui-final.log`, `ui-final.xcresult`).
  최종 캡처 22개는 `ui-final-attachments`에 있다. 경험 요약, 양쪽 기간의 변화 요약,
  큰 글자에서 생략되지 않는 측정 제목을 직접 검토했다. 모든 검증은 iOS 26.5 시뮬레이터의
  합성 기록을 사용했으며, 실기기 터치·운영 계정 동기화·VoiceOver 음성 실행은 포함하지 않는다.
- 동작 줄이기 QA 플래그 없이 경험 화면을 다시 실행해 `live-ring-b.png`, `live-ring-c.png`에서
  실제 화면의 점 위치가 시간에 따라 달라지는 것도 확인했다.

### 최종 화면 예시

- [복구된 점 링과 측정 카드](/tmp/tastebuddy-category-layout-20260915/live-ring-b.png)
- [스크롤 후 경험 측정과 가로 발견 목록](/tmp/tastebuddy-category-layout-20260915/ui-final-attachments/BD4F0328-C3EC-4747-BAC6-E3F39D51D424.png)
- [이전·최근 비교와 가로 발견 카드](/tmp/tastebuddy-category-layout-20260915/ui-final-attachments/7CCB16CB-2D81-4F50-BFBB-4CC78EB11999.png)
- [큰 글자에서의 측정 카드](/tmp/tastebuddy-category-layout-20260915/ui-final-attachments/DBF49009-3B8A-45D7-800C-4F9EE4CA33C3.png)
