# Plating 네이티브 UX 개선 — 원본 수정과 여러 줄 입력

2026-10-02 · 작업 ID `tsk_8583ac62efcfcf3a` · 1차 적용 범위

## 2026-10-25 후속 — 음식 출처 UI 임시 제거

사용자 요청으로 생성·수정의 공용 기록 정보 폼에서 음식 출처 선택과 직접 만든 요리 연결 UI를 제거했다. 기록 정보 수정은 식사일·식당 연결만 제공하며, 기존 직접 만든 요리 기록의 식당 숨김 규칙은 유지한다. 기록 옵션 설명과 Figma 폼 6곳(생성·수정·하위 화면의 배경 복사본)을 함께 정리했다. 저장된 `foodSource`/`homeCookingID` 및 관련 모델·repository·집계 규칙은 변경하지 않는다. 아래 통합·출처 선택 검증 내역은 제거 전의 이력이다.

제거 후 검증: iPhone 17 / iOS 26.5 시뮬레이터에서 출처 항목 부재와 날짜·식당 변경 저장/재진입을 확인하는 기존 UI 테스트 1개가 통과했다. Figma 기록 흐름 안의 출처 행·문구가 0건임을 확인했다. 증거는 `output/food-source-ui-removal-20261025/`에 보관한다.

## 2026-10-25 후속 — 음식 출처를 기록 정보 편집에 통합 (이전 적용)

이전 적용 단계에서 나의 기록 옵션은 `메모 수정`과 `기록 정보 수정`을 제공했다. 별도 `음식 출처 수정` 화면을 없애고, 식사일·식당 연결·음식 출처를 한 편집 폼에서 수정한다. 날짜·식당 선택은 기존 하위 선택 화면을 사용하고 통합 초안으로 돌아온다. 상세의 날짜를 눌러 바로 날짜를 수정하는 경로는 유지한다. 생성과 수정은 `DiningRecordContextFields`를 공유하며, 음식 출처 선택은 폼에 바로 표시한다.

편집 단위는 현재 계정의 선택한 `DiningEntry` 한 건이다. 집계 기간·분모·중복 제거·미래 날짜 제외 규칙은 변경하지 않는다. 기존 `foodSource.kind`, `homeCookingID`, 식당 namespace/장소 참조와 버전 데이터는 유지한다. 출처를 건드리지 않으면 nil과 알 수 없는 미래 값도 보존한다. 직접 만든 요리는 기존 요리 연결·새 요리 연결을 사용한다. 별도 API·테이블·마이그레이션을 추가하지 않는다.

`DiningRecordFieldUpdate.recordInfo`는 기존 원본에 명시적으로 바꾼 정보만 적용한다. 출처·식당만 고쳤을 때 기존 `date/observedAt`를 재정규화하지 않는다. 사용자가 확정한 식사일을 바꾼 경우에만 해당 시각을 갱신하고, 미확인 날짜를 저장 시각으로 추정하지 않는다. 날짜 휠은 기존 기기 로컬 달력·시간대를 따른다. 메모·사진·감각 응답·평가 등 다른 기록 필드는 보존한다.

초안은 저장 전까지 로컬 상태이며, 변경 후 취소는 버리기 확인을 거친다. 기존 `updateDiningEntry(_:expected:)`와 계정 generation 검사를 사용해 저장·원본 충돌·계정 전환을 처리한다. 저장 실패 시 초안과 오류를 유지해 재시도할 수 있다. 계정별 repository/동기화 경로는 그대로 사용하며 운영 계정 데이터는 변경하지 않았다.

Figma `08 Flows · iOS`의 기존 음식 출처 전용 프레임 `2283:10810`을 `own-record-info`로 전환하고 옵션 진입과 생성 폼 3곳을 동기화했다. `Flow/iOS/FoodSourcePickerRow`는 기존 토큰과 텍스트 스타일을 사용하는 편집 가능한 인스턴스다. 날짜 하위 화면 `2329:7845`와 식당 하위 화면 `2283:10756`은 기록 정보 폼으로 복귀한다. Figma의 값은 합성 디자인 상태이며 실제 계정 저장·날짜 휠·메뉴 선택을 실행하지 않는다.

검증: 원본 날짜·출처 값 보존과 저장/복원/계정 분리/삭제 경계 테스트 4개 통과. 합성 기록을 사용하는 iPhone 17 / iOS 26.5 UI 테스트는 날짜·식당 통합 저장/재진입 1개와 출처 변경 취소/저장/재진입 1개가 통과했다. 출처 테스트의 첫 실행은 상위 컨테이너가 선택 행의 접근성 식별자를 덮어 실패했고, 식별자와 표시 제목을 수정한 뒤 재실행했다. 최종 기본 폼과 직접 만든 요리 연결 상태의 시뮬레이터 화면도 확인했다. 결과와 작업 전 소스는 `output/food-source-integration-20261025/`에 보관한다. 운영 동기화·실기기 동작은 이번 검증에 포함하지 않는다.

## 2026-10-24 후속 — 기록 옵션 분리와 날짜·식당 카드 (이전 적용)

당시에는 `메모 수정`, `날짜 수정`, `식당 수정`, `음식 출처 수정`을 각각 여는 방식으로 적용했다. 이후 2026-10-25에 날짜·식당·출처를 `기록 정보 수정`으로 통합했다. 나의 기록의 `경험 비교` 옵션과 전용 Figma 화면은 삭제했다. 검색에서 쓰는 별도 경험 비교는 유지한다. 기록의 날짜를 눌러도 날짜 휠 피커가 바로 열린다.

`DiningMealTimeEditor`는 선택된 식사일을 카드에 표시하고 `DiningMealDatePicker`를 연다. 휠의 `적용`에서만 날짜를 확정하고, 취소는 원본을 바꾸지 않는다. 미확인 날짜는 `날짜 선택`, 사진 후보·대략적 기간은 출처를 구분하여 표시한다. 저장일/관찰일은 미확인 날짜를 확정하는 값으로 사용하지 않으며, 휠의 초기 후보와 사용자의 적용을 구분한다. 날짜는 기존 기기 로컬 달력·시간대를 따른다. 미래 날짜의 집계 제외 규칙은 그대로다.

`DiningRestaurantLinkEditor`는 현재 식당명과 이동 표시만 보여준다. 누르면 기존 계정 기록과 Kakao 검색을 사용하는 `DiningRestaurantSelectionSheet`에서 식당을 고른다. 연결된 원본 ID·namespace·장소 참조를 재사용하고, 상호만으로 식당 ID를 추정하지 않는다. 로딩·검색 실패·재시도·직접 연결 경로는 선택 화면에 유지한다.

편집 단위는 현재 계정의 선택한 `DiningEntry` 한 건이다. 기간·분모·중복 집계는 변경하지 않는다. 날짜 수정은 `mealTime`과 확정한 `date/observedAt`만, 식당 수정은 식당 참조·명시적 음식 출처와 필요한 메뉴 연결 해제만 바꾼다. 식당 변경으로 레거시 식사일을 다시 정규화하지 않는다. 메모·사진·감각 응답·전체 평가는 보존한다. 원본 스냅샷과 계정 세대를 고정하고 기존 `updateDiningEntry(_:expected:)`로 저장하므로 오래된 편집·다른 계정 덮어쓰기는 거부한다. 저장 실패 시 선택 화면과 오류를 유지한다.

Figma의 날짜·식당 확인 카드는 선택 완료된 합성 상태다. 별도 날짜 휠·식당 선택 화면과 나의 기록의 독립 수정 화면을 연결했다. `Flow/iOS/RecordContextCard`는 공통 토큰을 쓰는 편집 가능한 컴포넌트다. 운영 계정·지도 검색의 실서비스 결과·실기기 검증을 의미하지 않는다.

검증: 합성 기록을 사용하는 iPhone 17 / iOS 26.5 UI 테스트 2개와 원본 필드 보존·날짜/식당 복원·삭제·계정 분리·선택됨/미선택 렌더 테스트 12개가 통과했다. 날짜 변경과 식당 변경을 각각 저장 후 재진입했고, 메모 보존을 확인했다. Figma에서 삭제한 경험 비교 화면·옵션·설명과 해당 화면을 향하는 연결이 남아 있지 않음을 확인했다. 결과와 변경 전 소스는 `output/record-options-split-20261024/`에 보관한다.

## 2026-10-24 메모 수정 진입 경로

나의 기록 옵션의 `메모·날짜 수정`은 `기록 · 추가 메모`와 같은 `DiningReflectionNoteView`를 전체 화면으로 연다. 현재 계정에서 선택한 단일 `DiningEntry.note`를 초깃값으로 사용하며, 수정 화면은 `저장하기`/`취소하기`를 제공한다. 신규 기록은 같은 화면에서 기존 `계속하기` 흐름을 유지한다. 기록 날짜를 누르는 기존 날짜 수정 경로는 유지한다.

편집 대상은 선택한 기록 한 건의 메모 원문이다. 기간 집계·분모·중복 제거는 해당하지 않는다. 날짜·시각·시간대·출처·사진·감각 응답·전체 평가·식별자는 변경하지 않으며, 빈 메모와 공백·줄바꿈도 그대로 저장한다. 열 때의 원본과 계정 세대를 고정하고 기존 `AppModel.updateDiningEntry(_:expected:)` → 계정별 저장·동기화 경로를 사용한다. 원본이 변경·삭제되었거나 저장에 실패하면 초안을 유지하고 오류를 표시한다. 계정이 바뀌면 편집을 닫으며, 변경 후 취소에는 버리기 확인을 표시한다.

Figma `08 Flows · iOS`의 `record-note-edit`는 기존 메모가 표시된 디자인 상태다. 옵션 진입과 저장·취소의 상세 화면 복귀를 연결했다. Figma 프로토타입은 실제 텍스트 입력이나 계정 저장 검증을 대신하지 않는다.

검증: iPhone 17 / iOS 26.5 시뮬레이터의 합성 기록으로 UI 테스트 2개(기존 메모 표시·저장 비활성·수정·저장·재진입·변경 버리기), 기존 저장/원본 계약 테스트 9개(오래된 원본 거부·미확인 날짜 보존·빈 메모·복원/삭제·계정 분리)가 통과했다. 결과는 `output/record-note-edit-20261024/`에 저장했다. 운영 계정 동기화와 실기기 입력은 이번 검증에 포함하지 않는다.

## 목적과 범위

좋은 TB 컴포넌트를 재사용하면서 기본적인 입력·취소·복구 UX를 실제 네이티브 화면에서 보완한다. 앱 전체 UX 감사를 완료한 문서가 아니다. 이번 단위는 **음식 기억 → 회고·식사 시점 바로잡기**와 **다이닝 추가 메모의 공용 입력 적용**이다.

유지: Pretendard, 중립 표면, 20pt 카드/입력 반경, 기존 미각·평가 데이터, 원본 식별자, TBA 분석과 저장·동기화 계약. 기존 `TasteDetailGroup`, `SectionCard`, `TBTokenButtonStyle`, `Callout`, 시스템 TextEditor·Picker·DatePicker·toolbar를 재사용한다. 핵심 탭이나 카테고리·읽기 상세 정책은 변경하지 않는다.

## 확인한 문제와 해결

| ID | 변경 전 근거 | 제품 영향 | 이번 적용 |
| --- | --- | --- | --- |
| EDIT-01 | `FoodMemoryDetailView`의 수정·전체 편집·비교가 연속된 일반 텍스트 Button | 긴 원본을 읽은 뒤 행동을 찾고 누르기 어렵고 삭제와 위계가 섞임 | 기존 `TasteDetailGroup`에 세 개의 전체 행 버튼을 구성. 최소 52pt·줄바꿈·chevron. 삭제는 별도 44pt 행동과 기존 destructiveText |
| EDIT-02 | `FoodMemoryCorrectionSheet`의 취소가 즉시 dismiss, 저장이 항상 활성, 변경 여부 없음 | 수정 중 이탈로 초안 유실, 변경 없는 저장 | `FoodMemoryCorrectionDraft`로 로컬 초안 관리. 변경 없으면 저장 비활성·즉시 취소, 변경 있으면 계속 수정/변경 버리기 확인·스와이프 닫기 차단 |
| EDIT-03 | 전역 `diningPersistenceError`를 폼에 그대로 표시 | 이전 작업 오류가 현재 오류처럼 보이거나 실패 뒤 초안 상태를 파악하기 어려움 | 현재 저장 시도의 오류만 로컬 상태로 표시. 기존 Callout critical을 사용하고 해당 위치로 스크롤·접근성 초점 요청 |
| INPUT-01 | 회고 수정과 `DiningFeedbackSheet.reflectionView`의 개별 TextEditor, 다이닝 선택사항 표기가 입력 뒤에 위치 | 입력의 목적·상태·안내 방식이 화면별로 다름 | 실제 두 사용처를 `TBTextArea`로 교체. 레이블→편집 영역→도움말/오류 구조와 초점·비활성 상태 공용화 |

관찰 근거는 실제 합성 QA 검색→음식 기억 화면 및 위 Swift 소스다. 수정 전 회고 편집 화면의 시각 캡처는 확보하지 못했으며 해당 결함은 소스에서 확인했다. 실제 사용자 조사 결과나 앱 전체의 문제가 모두 해결됐다는 뜻은 아니다.

## 참고한 공식 패턴

확인일: 2026-10-02. 외부 코드·브랜드 자산·라이브러리를 복사하거나 설치하지 않았다.

- [SEED Field](https://seed-design.io/components/field): 레이블·입력·안내의 관계, 오류 우선 안내, 값이 바뀐 편집에서의 이탈 확인. 문구·픽셀 규격을 복사하지 않고 TB의 기존 표면·타이포그래피에 적용.
- [SEED Text Input & Textarea](https://seed-design.io/components/text-input): 입력·초점·오류·비활성의 구분과 고정 편집 영역의 내부 스크롤. 이번 TB 타입은 readOnly·AI loading·내용 길이 기반 autosize를 지원한다고 문서화하지 않는다.
- [Montage Text area / Web](https://montage.wanted.co.kr/docs/components/selection-and-input/text-area/web): 입력 목적의 제목·placeholder·설명과 여러 줄 입력 상태. Web API를 SwiftUI에 그대로 옮기지 않는다.
- [Apple interactiveDismissDisabled](https://developer.apple.com/documentation/swiftui/view/interactivedismissdisabled(_:)): 변경한 초안의 실수 이탈 방지에 시스템 presentation 기능 사용. 확인창·키보드·텍스트 편집은 운영체제 동작을 유지한다.

TDS·Material을 이번 문제의 필수 외형으로 섞지 않았다. 다음 흐름에서 필요할 때 관련 공식 컴포넌트를 별도로 대조한다.

## 컴포넌트 계약

### TBTextArea — 신규 공용 타입, 기존 화면에 실제 적용

파일: `ios/TasteBuddy/Components/NativeInputComponents.swift`

- `text: Binding<String>`, `label: String`은 필수.
- `placeholder`, `accessibilityName`, `helperText`, `errorText`, `minimumHeight`, `isEnabled`, 외부 `FocusState<Bool>.Binding` 지원.
- 기본 편집 viewport는 156pt, 회고 수정은 180pt. **위·아래 10pt 패딩, 레이블과 메시지 높이는 별도**다. 이 값을 컴포넌트 전체 높이로 표시하지 않는다.
- Dynamic Type 배율로 viewport를 넓힌다. 긴 입력은 TextEditor 내부에서 스크롤하며 페이지도 별도로 스크롤한다. 내용 길이에 따른 무제한 autosize가 아니다.
- label 14pt SemiBold, 입력 13pt Regular, 안내 12pt Regular. 기존 `TBFont`와 `TBColor` 사용.
- 초점 경계 2pt, 기본/오류 경계 1pt. 오류가 도움말보다 우선하며, 상위 비활성도 실제 입력을 막는다.
- 저장·검증·필수 여부는 호출부가 소유한다. 선택적인 회고를 필수로 바꾸거나 글자 수 제한을 새로 만들지 않는다.
- Placeholder를 값으로 저장하지 않고 원문의 공백·줄바꿈·Unicode를 보존한다.

### 수정 흐름 — 기존 컴포넌트 조합

파일: `ios/TasteBuddy/Features/Home/FoodMemoryViews.swift`

`FoodMemoryCorrectionDraft`는 note/mealTime/foodSource의 편집값과 **편집을 시작할 때의 원본**을 함께 보관한다. 부모 화면의 live entry가 갱신되어도 `@State` 초안 안의 비교 원본은 바뀌지 않는다. 저장 시 이 원본을 복사하고 기존과 동일하게 확인된 식사 시점만 date/observedAt에 반영한다. 감각·호감·알맞음·전체 평가와 원본 식별자를 변경하지 않는다.

재개 중 소스 대조에서 `let original`을 부모의 갱신값으로 받으면서 초안만 `@State`로 유지하는 불일치를 확인했다. `expected`가 최신 원본으로 자동 교체되지 않도록 기준을 초안으로 옮겼다. 이 위험은 코드 구조에서 판단한 것으로 실제 사용자 데이터에서 덮어쓰기를 재현했다는 뜻은 아니다. 별도 회귀 테스트는 편집 시작 이후 원본 변경 시 저장 거절·최신 원본 유지·초안 보존을 확인한다.

`AppModel.updateDiningEntry(_:expected:)`의 기존 동기 로컬 저장과 stale 원본 검사를 그대로 사용한다. 가짜 대기나 로딩 화면을 넣지 않고, 원격 동기화 완료라고 약속하지 않는다. 실패하면 초안은 화면에 남고 기존 원본을 덮어쓰지 않는다. 계정 generation이 바뀌면 기존대로 편집을 닫는다.

### 실제 교체 위치

| 기존 구현 | 새 구현 | 실제 경로 |
| --- | --- | --- |
| 회고 수정 Form의 개별 TextEditor | TBTextArea + 기존 카드/피커 + 시스템 toolbar | 내 기록 검색 → 음식 기억 → 회고·식사 시점 바로잡기 |
| 다이닝 reflectionView의 개별 TextEditor와 뒤쪽 선택사항 표기 | TBTextArea | 디테일 태그의 추가 메모 행동 → reflectionView |
| 음식 기억의 세 개 일반 텍스트 행동 | TasteDetailGroup + 기존 버튼 스타일 | FoodMemoryDetailView 본문 하단 |
| 현재 편집과 관계없는 전역 오류 노출 | 현재 저장 시도 전용 Callout | FoodMemoryCorrectionSheet 저장 실패 |

## Plating 및 Figma

사이트는 기존 `textarea` 카탈로그 계열을 유지하며 실제 Native 타입을 `TBTextArea`로 갱신한다. Callout은 critical 표시형의 실제 제품 사용처를 추가한다. 모든 Callout 옵션이 제품에 사용된다고 간주하지 않는다.

`NativeComponentReference`에는 항목별 소스 대조일과 실제 Native 사용 설명을 지원한다. 과거 웹 설명과 신규 iOS 사용처를 합치지 않는다. `patterns/revision`은 실제 수정·취소·저장 계약과 소스를 연결한다.

Figma: 기존 웹 TextareaField `77:198`과 인스턴스는 보존한다. 서로 다른 플랫폼 규격을 같은 상태라고 덮어쓰지 않고 `Input/TBTextArea (iOS)` 대응 세트 `126:580`과 검토 보드 `126:581`을 추가했다. 기본·입력됨·초점·오류·비활성의 5가지 시각 상태, Label/Value/Message/Show message 속성을 제공한다. Value와 Message는 상태와 별도이므로 검토 인스턴스에 실제 예문을 명시했다.

기존 Figma 변수·스타일을 재사용했다. iOS hint는 현재 #6F6F6F, 웹은 #888888이므로 기존 공유 변수를 일괄 변경하지 않고 필요한 native 역할을 별도 alias로 연결했다. 작업 당시에는 Noto Sans KR 대체 스타일을 사용했고, 2026-10-07 Pretendard로 전환했다. 플랫폼별 렌더링 동등성은 별도 확인 대상이다. 새 네이티브 변수는 실제 Swift 이름을 갖고, 해당하지 않는 Web/Android code syntax는 만들지 않았다.

[Figma 네이티브 입력 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=126-581) · [원본 수정 상태 계약](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=131-198)

Patterns의 새 보드 `131:198`은 기존 입력 컴포넌트 인스턴스로 변경 없음·수정 중·저장 실패와 취소/완료 계약을 설명한다. 전체 네이티브 화면이나 시스템 시트·키보드의 픽셀 재현은 아니다. 기존 Patterns 프레임은 보존했다. `figma-map.json`의 nativeComponents/nativeReviews/patterns 대응에 새 ID를 기록하고 기존 웹 매핑은 유지한다. iOS의 `NativeProductComponentCatalog`에도 TBTextArea의 실제 사용과 Callout critical의 제품 적용을 반영했다.

## 검증 기록

지속 보관한 요약·최종 소스 해시·로그·합성 화면은 `output/plating/native-ux-20261002-8583-retry/verification.json`과 같은 폴더에 있다. 대용량 `.xcresult`와 빌드 출력은 아래 임시 경로에 보존한다.

2026-10-02 재개 검증. 이전 감사나 중간 빌드의 통과를 최종 결과로 대체하지 않았다. 환경은 Xcode 26.6 / iOS 26.5 / Plating QA iPhone 17 시뮬레이터이며, QA 진입점의 합성 데이터에서 실제 제품 화면을 사용했다. 개인 계정의 기록은 수정하지 않았다.

| 범위 | 실제 결과 | 근거 (`/tmp/tb-ux-20261002-8583/retry/` 기준) |
| --- | --- | --- |
| 최종 iOS 앱 및 단위 테스트 | `PlatingEditingContractTests` 7/7 통과, exit 0 | `unit-final.log`, `unit-final.xcresult` |
| 최종 제품 흐름 UI 테스트 | 수정·취소·버리기·저장·큰 글자 2개 + 기존 검색·비교·정정·Undo/Redo·삭제 1개, 총 3/3 통과, exit 0 | `ui-validated.log`, `ui-validated.xcresult` |
| 실제 편집 화면 | 키보드 열린 편집, 변경 버리기 확인, 큰 글자와 취소 접근을 화면으로 확인. 최종 테스트 첨부 14개 추출 | `ui-final-attachments/manifest.json`; 실제 입력과 취소 화면 확인 |
| SwiftUI 독립 표본 | TBTextArea 5개: 빈 값·입력됨·오류·비활성·큰 글자. 390pt 부모, 3배 PNG, SHA-256 확인 | `native-captures/manifest.json`; 5개 이미지 시각 확인 |
| 기존 캡처 보존 | 기존 42개 계열을 변경하지 않고 textarea 1개 계열만 추가 | `capture-textarea.py`, `capture-textarea.log`, 기존 registry와 항목별 대조 |
| Foundations | Swift 원본 3개와 생성 데이터 일치 | `node scripts/build-plating-ios-foundations.mjs --check` |
| Motion | 생성 CSS 일치, 6/6 테스트 통과 | `npm run test:motion` |
| 최종 TypeScript | `tsc --noEmit` 통과, exit 0 | `typecheck-final.log`, `typecheck-final.exit` |
| Plating 문서 브라우저 | 수정 흐름·Textarea·Callout × 320/390/1280px = 9개 확인. 가로 넘침·중복 ID·실행 예외 0. Textarea 이미지 5개의 로드·상태명 확인 | `site-checks.json`, `site-checks.log` |
| Plating 배포용 빌드 | Vite/PWA 빌드 통과, exit 0. 기존 dist를 덮어쓰지 않고 별도 출력 | `site-build.log`, `site-build.exit`, `site-delivery/` |
| Figma | `126:580`의 5개 실제 컴포넌트 변형, 편집 속성, 변수 연결 25개 노드를 확인. 입력 보드 및 수정 패턴을 시각 확인 | `figma-review.json`; 보드 `126:581`, `131:198` |

단위 테스트는 viewport 계산, 원문/초안 독립, note 외 원본 보존, 빈 회고·미지원 출처값 보존, 확인 시점 적용, stale 편집 차단에 더해 **편집 시작 원본의 고정**을 검사한다. UI 테스트는 QA의 검색 진입점을 사용했으며, 홈의 모든 진입 경로나 앱 전체를 실행한 검증은 아니다.

최종 단위 검사는 `TasteBuddy` scheme의 `test`, UI 검사는 같은 최종 앱 빌드와 수정된 UI 테스트 번들에 대해 `TasteBuddyMemoryQA` scheme의 `test-without-building`으로 수행했다. 공통 destination은 `B25AEC3A-FDA5-4DAE-A549-23061D6E2EB9`, derived data는 `/tmp/plating-native-20260930`이다. 실제 전체 명령은 각 로그 첫머리에 보존했다.

중간 실패도 보존한다. 최초 빌드는 시간 제한으로 종료됐고, 초기 UI 실패는 테스트 입력 helper의 커서 위치 및 iPhone에서 동작하지 않은 Cmd+A 선택 가정 때문이었다. 짧은 fixture의 실제 trailing 편집 영역에 커서를 놓고 원문을 지운 뒤 **입력값 전체 일치 단언**을 유지해 재검증했다. 실패를 피하려고 원문·저장 결과 검사를 제거하지 않았다. `ui-retry.xcresult`에서 3/3 통과한 뒤, 원본 고정 보완을 포함한 최종 앱에서 `ui-validated.xcresult`로 다시 3/3 통과했다.

경고와 제한: 단위 테스트 시작 시 `AttributeGraph: cycle detected` 경고 1회가 있었으며 앞선 `unit-limited.log`에도 같은 종류가 존재했다. 테스트는 통과했지만 경고 원인은 이번에 분리하지 못했다. 웹 빌드에는 일부 큰 번들과 오래된 Browserslist 데이터 경고가 남아 있다. 이를 없애려고 무관한 의존성 업그레이드를 하지는 않았다. VoiceOver/TalkBack 실사용, 실기기, 저장 장치 오류를 주입한 화면 테스트, 다이닝 전체 플로는 미검증이다. 저장 충돌은 단위 테스트에서 확인했고, 오류의 정적 입력 표본을 실제 저장 실패 UI 테스트로 간주하지 않는다.

변경 전 원본은 `baseline/`, 재개 직전 원본은 `retry/baseline/`에 별도로 보존했다. 최종 Figma 재개 수정은 기존 `131:228`, `131:235`의 저장·충돌 설명 두 곳이며 기존 노드와 인스턴스는 유지했다.

캡처는 DEBUG 전용 `--design-system-preview --plating-native-audit-capture --plating-textarea-capture`로 재생성했다. 기본 상태는 Dynamic Type large, 큰 글자 표본은 accessibility2다. 정적 캡처와 실제 입력·저장·보조 기술 검증을 구분한다. 최종 PNG는 `public/plating/native-component-audit/textarea--*.png`, 연결은 `src/plating/nativeAuditCaptures.json`에 있다.

## 미반영 및 다음 범위

이번 적용은 앱 전체 완료가 아니다. 홈·분석·검색 필터·프로필·다른 편집 화면의 전체 UX 감사와 교체는 남아 있다. 날짜 범위/출처 피커의 업무 규칙은 이번에 바꾸지 않았다. 다이닝 전체 기록 플로와 Android·실제 웹 제품의 대응 편집 UX는 별도 검증·반영 대상이다.

향후 진행은 같은 방식으로 실제 흐름 1~2개씩 선택한다. P0 저장/취소/데이터 의미 → P1 입력/선택/탐색/접근성 → P2 일관성과 중복 → P3 문서·장식 순서이며, 문서를 늘리는 것보다 실제 제품 적용과 검증을 우선한다.

## record-details 카드와 텍스트 역할 · 2026-10-25

대상은 Figma `record-details` (`2116:17718`)와 iOS `DiningFeedbackSheet.detailTagsView`다. 추가 메모 카드의 보조 문구를 제거하고 바로 아래에 날짜·시간과 위치 카드 두 개를 한 행으로 놓았다. 두 카드에는 라벨·우측 화살표 없이 16pt 시계/위치 아이콘과 값을 표시한다. 최종 정렬은 아이콘·텍스트 모두 왼쪽이며, 패딩은 상하좌우 12pt, 카드 간격은 8pt, 메모 카드와의 간격은 12pt다. 메모·날짜·위치 값은 모두 `Product/Control`에 연결한다. 메모·사진 버튼을 담은 `Reflection actions`의 내부 간격은 `spacing/8` / `TBSpacing.x8`로 연결하며, 버튼 크기 40pt와 카드의 바깥 여백은 유지한다.

| 화면 역할 | Figma 스타일 | iOS 역할 | 크기 / 굵기 / 행 높이 |
|---|---|---|---|
| 카드 값·메모 제목 | Product/Control | TBTextStyle.control | 14 / Medium / 20 |
| 상단 제목 | Product/TopBar Title | TBTextStyle.topBarTitle | 15 / Bold / 22 |
| 미각 구분 | Component/TasteExperience/Context | TBTextStyle.tasteContext | 11 / SemiBold / 16 |
| 미각 이름 | Component/TasteExperience/Title | TBTextStyle.tasteTitle | 17 / Bold / 23 |
| 태그 그룹 제목 | Product/Card/Label | TBTextStyle.cardLabel | 14 / Bold / 20 |
| 선택사항·하단 안내 | Product/Supporting | TBTextStyle.supporting | 11 / Medium / 16 |
| 태그 | Product/Compact | TBTextStyle.compactControl | 12 / Medium / 18 |
| 완료 버튼 | Component/PrimaryButton/Label | TBTextStyle.primaryButton | 14 / SemiBold / 20 |

앱 텍스트 75개에 역할 스타일을 연결했다. 시스템 상태 표시줄은 시스템 참조를 유지한다. 네이티브는 `tbTypography`에서 폰트·행간·한 줄의 상하 leading을 한 역할에서 계산하고 Dynamic Type 배율을 따른다. 기존 여섯 `TBTextStyle` 역할의 기본값은 유지한다. 공용 상단 바·하단 CTA·버튼·칩은 선택적인 역할 인자를 추가해 이 화면에서만 적용한다. 색상은 기존 의미 토큰을 유지하며 시계/위치 아이콘은 텍스트와 같은 `textPrimary`를 사용한다.

데이터 단위는 현재 계정의 **한 기록 또는 작성 중인 초안**이다. 집계 기간·분모·중복 제거는 적용되지 않는다. 기존 `NativeAccountDataRepository → AppModel.diningEntries → DiningFeedbackSheet(entry:) → workingMealTime/confirmedRestaurantName → recordContext` 경로를 사용한다. 새 API·테이블·표시값 캐시는 추가하지 않는다. 날짜는 `mealTime.source == user_confirmed`인 `start`만 현지 Calendar/TimeZone으로 표시한다. 현재 모델은 날짜 확인만 지원하므로 시각을 추정하지 않고 `시간 미확인`으로 표시한다. nil·출처 미확인·사진 후보·대략적 기간·기록 시각만 있는 경우와 미래의 알 수 없는 출처는 `날짜·시간 미확인`이다. 사용자가 확인한 유효한 미래 날짜는 원문 그대로 표시하며, 그래프의 미래 제외 규칙은 바꾸지 않는다. 식당명은 현재 초안의 원문을 표시하고 빈 값은 `위치 미확인`이며 음식 출처를 위치로 만들지 않는다.

날짜/위치 카드는 기존 `DiningMealDatePicker`와 `DiningRestaurantSelectionSheet`를 연다. 선택 결과는 초안에만 반영하고 원본 저장·오류 처리는 기존 `saveFeedback/onSave` 경로를 유지한다. 별도 비동기 요약 조회가 없으므로 로딩·오류·오프라인 원본은 기존 진입 화면과 저장소가 처리하며, 실패를 0/빈 값으로 변환하지 않는다. 계정 변경 시 기존 `memoryAccountGeneration` 처리로 기록 화면을 닫는다. Figma 값과 `--dining-feedback-preview --record-details-preview`의 데이터는 합성 디자인 표본이다.

검증 기록: `output/record-details-ios-20261025/verification.json`. Swift 구문·iOS 빌드와 날짜 출처/시간대·원본 왕복·계정 격리/삭제를 다루는 XCTest 4개가 통과했다. iPhone 17 / iOS 26.5 시뮬레이터에서 왼쪽 정렬, 날짜 피커 진입과 미확인 값의 즉시 반영, 식당 검색·선택 복귀를 확인했다. 운영 계정이나 실제 기기에서의 검증으로 간주하지 않는다.

식사일 선택 시트의 후속 수정: `DiningMealDatePicker` 콘텐츠를 전체 너비로 확장하고 콘텐츠 배경·`presentationBackground`를 모두 `TBColor.focus`로 지정했다. Light에서는 #FFFFFF이며 좌우의 기본 반투명 시트 재질이 비치지 않는다. Figma의 `record-context-date`와 `own-record-date`에 있는 동일 시트 두 곳도 `color/bg/focus`로 연결했다. `xcode-sheet-build.log` 재빌드 성공 및 `ios-date-editor-white.png`의 시뮬레이터 표시를 확인했다. 날짜 선택·저장 규칙은 변경하지 않았다.
