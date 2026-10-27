# 플레이팅 추가 컴포넌트 검토

## 그룹형 미니 그래프 · 2026-10-07

- 기존 기본·촘촘한 예시 옆에 4개 항목 × 이전·현재 2계열의 그룹형을 추가했다. Figma 원본은 `813:3630`, 리뷰는 `752:3284`다. 기존 기록한 식사·음식 전체 평가 카드는 유지한다.
- React `MiniChart`·SwiftUI `TBMiniChart`가 선택적인 `comparisonValues`를 받는다. 이전은 왼쪽 회색, 현재는 오른쪽 미각색이며 두 계열의 공통 최댓값으로 높이를 계산한다.
- 132×32, 막대 폭 12, 내부 간격 2, 그룹 간격 8. 0은 반높이·1은 원형을 유지한다. 실제 홈의 이전 기간 집계 연결은 별도이며 공용 컴포넌트와 합성 예시를 추가한 범위다.
- 확인: Figma·웹 프리뷰, 비교 척도·결측·Figma 치수 회귀 검사 7개, 웹 타입·빌드, Swift 구문·치수 계산 및 네이티브 시뮬레이터 빌드 통과. 실기기·XCTest는 실행하지 않았다. 근거: `output/summary-card-figma-20261006/grouped-validation-20261007.json`.

## Pretendard 통일 · 2026-10-07

- Figma 27개 페이지의 텍스트 2,668개와 공통 텍스트 스타일 35개를 Pretendard로 전환했다. 최종 검사에서 Noto Sans 폰트와 대체 안내가 남은 텍스트는 0개다.
- 기존 크기·행간·색상·문구를 유지하고 굵기 400/500/600/700을 Regular/Medium/SemiBold/Bold로 대응했다. 오래된 폰트 제한 안내만 현재 상태로 수정했다.
- 웹과 iOS는 기존부터 Pretendard를 사용한다. Figma 생성 스크립트 7개와 대응표·플레이팅 문서를 갱신했다. 요약 카드·미니 그래프 보드의 렌더와 생성 스크립트 구문을 확인했다.
- 근거: `output/plating/pretendard-20261007/migration.json`, `validation.json`. 전체 제품 화면의 줄바꿈·플랫폼별 렌더링 동등성을 보장하는 검증은 아니다.

## 미니 그래프 · 2026-10-07

- `MiniChart` / `TBMiniChart`를 공용화하고 Figma `197:1505`·`787:3292`, 플레이팅 `/design-system/components/mini-chart`, 홈 아카이브·기간 카드에 연결했다.
- 컨테이너 132×32, 7개 막대 폭 12, 12개 막대 폭 8.25. 0의 높이는 두께의 절반, 1은 원형, 2 이상은 값에 따라 늘어난다. 상세 차트의 실제 비율 높이는 유지한다.
- 예제 흰 컨테이너는 164px·좌우 패딩 16px. 기록한 식사·음식 전체 평가 예제 카드는 유지한다.
- 공통 규격과 연결 자료: [미니 그래프](mini-chart.md). 컴포넌트 변경은 Figma·플레이팅·코드·토큰·문서·대응표를 같은 작업에서 갱신한다.
- 확인: Figma 및 웹 프리뷰, 웹 타입 검사·빌드, 치수 회귀 검사 4개, Swift 구문과 네이티브 치수 계산 실행 통과. 네이티브 TasteBuddyMemoryQA 시뮬레이터 빌드도 통과했다. XCTest·실제 앱 상호작용은 실행하지 않았다. 근거: `output/summary-card-figma-20261006/cross-surface-validation-20261007.json`.

## 네이티브 실제 적용 · 2026-10-02

기존 웹 TextareaField와 Figma ID를 유지하고 실제 네이티브 `TBTextArea`를 회고 수정·다이닝 추가 메모에 적용했다. 기존 Callout의 critical 표시형은 회고 수정의 저장 실패에 사용한다. 새 입력은 TB 스타일을 유지하며 SEED Field의 구조·이탈 확인과 Montage의 여러 줄 입력 상태를 참고했다. 코드·사이트·Figma 변경과 검증 상태는 [네이티브 UX 개선 기록](./plating-native-ux-improvement.md)에 모은다. 아래 내용은 이전 추가 작업 기록이다.

2026-10-01 · 추가 20개 계열 / Figma 70개 변형 · 기존 31개와 합쳐 웹 카탈로그 51개.

## 현재 검토

### TopBar Glass 배리언트 · 2026-10-06

- iOS 버블 맵의 제목 캡슐·원형 버튼을 공용 `TopAppBar(appearance: .glass)`로 옮겼다. 기존 40pt 높이, 제목 Bold 15·좌우 패딩 12, 아이콘 24, 좌우 여백 20과 검색·다음 버튼의 표시 조건·동작을 유지한다.
- 일반 Default/Solid/Transparent는 48pt이며, Glass는 iOS 26의 clear glassEffect와 이전 OS의 ultraThinMaterial을 사용한다.
- iOS 홈은 Transparent에 프로필·알림·측정·메뉴를 조합한다. 아래 검색창은 별도 구성이고 검색 화면에서는 Solid로 전환한다. 웹 홈은 기존 Default 구현을 유지한다.
- Figma 기존 TopBar 원본 ID `7:99`를 유지하고 Appearance 4종과 홈 사용 예제를 추가했다. 제목·Leading·Actions 슬롯을 연결했다. Figma와 웹의 글래스 표현은 정적/브라우저 참고이며 실제 iOS 재질 렌더와 구분한다.

확인: iOS 시뮬레이터 빌드와 Appearance 4종·홈 구성의 실제 SwiftUI 렌더 5개를 확인했다. 웹 타입 검사·빌드, 1280/390/320px에서 버튼과 제목의 겹침 없음, 뒤로·검색·다음 예제 콜백을 확인했다. 실제 계정 저장·버블 맵 전체 제스처·VoiceOver 실사용은 이번 검증 범위 밖이다.

### 사진 입력 항목 제거 · 2026-10-05

사용자 요청으로 문서 전용 AttachmentInput과 Figma 원본·검토 보드·리소스 카드를 제거했다. 호출되지 않는 iOS `DiningReflectionPhotoEditor`도 제거했다. 실제 제품의 카메라·사진첩 선택·저장은 기존 구현을 유지한다.

### 프로필 생년월일 선택창 대조 · 2026-10-04

- `ProfileEditPickerOverlay`의 현재 SwiftUI 코드와 사용자가 제공한 2026-10-04 23:27 iOS 26.5 한국어 캡처를 함께 대조했다. 기본 견본 날짜는 **1995년 1월 1일**이다.
- 캡처에서 확인한 362 × 368pt 카드, 302 × 34pt 선택 캡슐, 9개 곡면 행, 숫자 열 위치와 월·일 순환 표시를 Figma와 웹 예제에 반영했다. 카드 패딩 20·반경 24·닫기 영역 36·적용 버튼 48pt 및 버튼 그림자는 현재 코드와 대조했다.
- Figma는 기존 원본·리소스 카드 ID를 유지했다. 휠은 시스템 글꼴 대체를 피하기 위해 시스템 글리프를 벡터로 표시한다. 제목·닫기·적용은 기존 Plating 구성요소다. 윤년 말일은 동일한 표시 규칙의 참고 예시다.
- 웹 문서의 실제 iOS 렌더에 **사용자 제공 화면에서 선택창만 자른 이미지**와 출처를 추가했다. 웹 비교 예제는 기존 `BirthDatePicker`의 프로필 전용 외형 옵션으로 제공한다. 기본 제품용 외형은 유지한다.
- 날짜 범위는 1940-01-01부터 오늘 기준 12년 전이다. 적용은 프로필 초안에 반영하고 닫기는 임시 변경을 폐기한다. 웹에서 월·일 키보드 순환, 휠 경계 스크롤, 닫기·적용·다시 열기, 연도 범위를 확인했다.
- 실제 iOS 외형 근거는 제공된 캡처이며, 네이티브 제품 코드는 변경하지 않았다. 새 네이티브 빌드·제스처·저장·실기기 검증을 수행한 결과는 아니다.

### 프로필 입력·선택 필드 통합 · 2026-10-04

- `TextInput`은 키보드 입력, `SelectField`는 현재 값 표시와 선택창 열기를 담당한다. `InputButton`은 SelectField에 통합하고 기존 URL은 선택 필드로 연결한다.
- 네이티브의 이름·버디네임은 `TBTextInput(.profile)`, 생년월일·성별·흡연유무·식이제한은 `TBSelectField`를 사용한다. 기존 날짜 적용·프로필 초안·전체 저장 흐름을 유지했다.
- 웹 프로필도 `TextInput`과 `SelectField`를 사용한다. 두 필드는 `FormField`와 공통 CSS로 라벨·48px 높이·12px 반경·메시지 규칙을 공유한다. SelectField의 menu 모드는 기존 목록 선택에 사용한다.
- [Figma 입력·선택 필드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=77-281)에서 두 종류와 실제 프로필 연결을 비교할 수 있다. 기존 TextInput·SelectField 원본 ID를 유지하고 중복 InputButton 원본·보드·리소스 카드를 제거했다.
- 확인: 웹 빌드와 로컬 문서 예제의 입력·오류·비활성·단일/복수/날짜/메뉴 선택, 초점 복귀, 이전 URL 연결을 확인했다. Swift 구문 검사는 통과했다. iOS 전체 빌드는 자산 컴파일과 CoreSimulator 응답 대기에서 중단되어 실행·신규 캡처를 확인하지 못했다. 이전 필드 캡처는 현재 규격의 근거에서 제외했다.


### 기록·소셜 액션 공통화 · 2026-10-04

- `IconActionButton`: 저장·북마크·좋아요·댓글·공유의 아이콘, 활성 상태, 숫자, 누름 효과를 공통화했다.
- `RecordActions`: 저장 + 북마크. 검색 결과·식당 상세에서 기존 기록 작성과 북마크 편집 콜백을 호출한다.
- `SocialActions`: 좋아요 + 댓글 + 공유. 다이닝 카드의 좋아요 상태와 기존 댓글·공유 콜백을 유지한다.
- SwiftUI 원본은 `ios/TasteBuddy/Components/IconActionButton.swift`. 웹 세 컴포넌트는 `src/components/system/plating`에 있고 같은 제품 화면에 연결했다.
- Figma 원본: [IconActionButton](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=78-318) · [RecordActions](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=339-2463) · [SocialActions](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=339-2502). 그룹 안의 개별 상태·숫자는 노출된 하위 인스턴스 속성으로 수정한다.
- 기존 토글 액션 URL은 아이콘 액션 문서로 이동한다. 새 웹 문서: [기록 액션](http://127.0.0.1:3001/design-system/components/record-actions) · [소셜 액션](http://127.0.0.1:3001/design-system/components/social-actions).
- 웹 타입 검사·프로덕션 빌드와 브라우저 예제 동작 확인을 통과했다. 좋아요의 키보드 토글, 북마크의 명시적 저장, 기록·북마크 상태 독립성, 댓글·공유의 실행, 비활성, 숫자 없는 배치를 확인했다.
- 네이티브 빌드와 실제 SwiftUI 표본 11개 렌더를 확인했다. 근거: `output/icon-actions-20261004/native-build.log`, `native-captures.json`, `figma-review.png`, `figma-groups.png`. 표본의 숫자는 합성 값이며 실제 계정 저장·공유 완료나 VoiceOver 실행을 검증한 결과는 아니다.


2026-10-04 · 독립 상세 화면 예제를 웹 카탈로그와 Figma에서 제거했다. 아래 과거 집계·검증 결과는 당시 기준이며, 제거한 항목의 링크는 목록에서 제외했다.

### 공통 시각 문서

카탈로그 52개 문서에 Anatomy 도해를 공통 적용했다. 실제 캡처가 있는 항목은 SwiftUI 원본 위에 부품 연결선을 표시하고, 캡처가 없는 항목은 소스 슬롯 구조로 표시한다. 연결선은 위·아래·좌·우로 분산하고, 부품 위치 순서에 맞춰 배치한다. 번호 원·직선·끝점은 뉴트럴 회색을 사용한다. 끝점은 컴포넌트 바깥 여백에서 멈추고 부품 이름은 도해 아래 번호 목록에 표시한다.

PrimaryButton, Callout, TextInput, Chip, TasteChip, Avatar, TopBar, SelectionCard, ListRow, Toast의 실제 지원 옵션을 Size/Layout/Variant 비교 보드로 표시한다. 16개 계열에서 SwiftUI 표본 64개를 새로 캡처했다. 상태 보드도 실제 캡처를 사용한다. 표본의 외곽 빈 여백만 SVG 표시 영역으로 줄였으며 원본 PNG는 유지한다. 독립 옵션이 없는 항목은 현재 크기·배치 계약을 설명한다.

확인: iOS 시뮬레이터 빌드, 웹 타입 검사, 새 출력 경로의 프로덕션 빌드 통과. 기존 브라우저 탭에서 52개 문서의 Anatomy 표시·문서 전체 가로 넘침·중복 ID를 확인했으며 오류가 없었다. Callout Anatomy와 PrimaryButton 크기·배치·변형 보드를 시각 확인했다. 문서용 고정 표본이며 제품 상호작용 검증은 포함하지 않는다.

근거: `output/plating/component-visual-docs-native-build-20261001.log`, `output/plating/component-visual-docs-native-captures-20261001.json`, `output/plating/component-visual-docs-typecheck-20261001.log`, `output/plating/component-visual-docs-build-20261001.log`, `output/plating/component-visual-docs-browser-20261001.json`. 웹 출력: `/tmp/plating-component-visual-docs-20261001`.

**Callout** — [비교 화면](http://127.0.0.1:3001/design-system/review/callout) · [네이티브 공용 컴포넌트](http://127.0.0.1:3001/design-system/components/callout). 사용자 지시에 따라 SwiftUI `Callout`을 구현했다. SEED 공식 원본과 Plating의 네이티브 표시형·전체 클릭형·닫기형을 대조한다. Montage 공개 원본 목록에는 독립 Callout 항목이 없다.

현재 플레이팅에 없는 후보를 영문 알파벳 순으로 하나씩 검토한다: **Callout → Pagination → Slider → Tooltip**. 이번에는 Callout만 진행한다. 앞서 추가한 20개 계열은 현재 존재하므로 새 누락 검토 순서에서 제외한다. 아래 20개 표는 이전 추가 작업 기록이다.

`ios/TasteBuddy/Components/Callout.swift`는 기존 `TBColor`와 `TBFont`를 사용하는 네이티브 공용 타입이다. 표시형은 선택적 `CalloutLink`, 전체 클릭형은 `Button`과 콜백, 닫기형은 접근성 이름을 가진 독립 44pt 버튼을 제공한다. 제목·아이콘·다섯 톤을 지원하며 큰 글자는 본문 높이가 늘어난다. 닫기 상태와 닫힌 뒤 접근성 초점은 호출부가 관리한다. 주의·오류에는 닫기 버튼을 표시하지 않는다. 제품 화면 적용은 별도다.

네이티브 등록부는 `공용 라이브러리`로 분류한다. 시뮬레이터 프리뷰는 `--design-system-preview --callout-preview`로 단독 실행하고, `--plating-native-audit-capture --plating-callout-capture`를 함께 지정하면 실제 SwiftUI 표본을 캡처한다. 앞선 웹 시안은 비교 화면에서 별도로 구분한다.

검증: `TasteBuddyMemoryQA` 시뮬레이터 빌드와 `GastronomyUITests.testNativeCalloutActionAndDismissal` 실행 통과. 전체 영역 탭·닫기·다시 표시를 확인했다. 기본/전체 클릭/닫기/성공/주의/오류/큰 글자(접근성 2)의 실제 SwiftUI 표본 7개를 캡처하고 기본·큰 글자·프리뷰 화면을 시각 확인했다. 근거: `output/plating/callout-native-build-test-20261001.log`, `/tmp/plating-callout-native-ui-20261001.xcresult`, `output/plating/callout-native-captures-20261001.json`. VoiceOver 실사용·실기기·제품 화면 적용은 검증 범위 밖이다.

현재 소스에는 `TasteCardDetailRoute.unavailable`에서 해석 연결 실패를 설명하는 `TasteDetailNote` 사용처가 있다. 해당 제품 사용처와 새 `Callout` 공용 타입을 구분한다. 사용자는 우선 네이티브용 Callout 구현을 선택했다.

이전 [아코디언 비교](http://127.0.0.1:3001/design-system/review/disclosure)는 유지한다.

## 이전 추가 작업 기록

| 순서 | 컴포넌트 | 웹 | Figma |
| --- | --- | --- | --- |
| 1 | 아코디언 · Accordion | [프리뷰](http://127.0.0.1:3001/design-system/components/disclosure) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=79-459) |
| 2 | 여러 줄 입력 · TextareaField | [프리뷰](http://127.0.0.1:3001/design-system/components/textarea) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=77-215) |
| 3 | 선택 필드 · SelectField | [프리뷰](http://127.0.0.1:3001/design-system/components/select) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=77-281) |
| 5 | 상세 모드 선택 · SegmentedControl | [프리뷰](http://127.0.0.1:3001/design-system/components/segmented-control) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=77-431) |
| 6 | 기간 선택 · PeriodPicker | [프리뷰](http://127.0.0.1:3001/design-system/components/period-tabs) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=79-278) |
| 7 | 텍스트 행동 · TextAction | [프리뷰](http://127.0.0.1:3001/design-system/components/text-action) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=78-296) |
| 8 | 아이콘 액션 · IconActionButton | [프리뷰](http://127.0.0.1:3001/design-system/components/icon-action-button) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=78-360) |
| 9 | 알림 배지 · NotificationBadge | [프리뷰](http://127.0.0.1:3001/design-system/components/notification-badge) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=80-145) |
| 10 | 스켈레톤 · ContentSkeleton | [프리뷰](http://127.0.0.1:3001/design-system/components/skeleton) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=80-209) |
| 11 | 이미지·대체 표현 · ImageBox | [프리뷰](http://127.0.0.1:3001/design-system/components/image-frame) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=79-392) |
| 12 | 칩 그룹 · ChipGroup | [프리뷰](http://127.0.0.1:3001/design-system/components/chip-group) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=79-540) |
| 13 | 기간·출처 안내 · ScopeLabel | [프리뷰](http://127.0.0.1:3001/design-system/components/scope-label) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=81-189) |
| 14 | 화면 로딩 · FlowLoadingState | [프리뷰](http://127.0.0.1:3001/design-system/components/flow-loading) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=80-252) |
| 15 | 오류·재시도 · FlowRetryState | [프리뷰](http://127.0.0.1:3001/design-system/components/flow-retry) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=80-287) |
| 16 | 하단 행동 영역 · Flow step pattern | [프리뷰](http://127.0.0.1:3001/design-system/patterns/flow-step) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1282-5137) |
| 17 | 식사일·기간 입력 · DateField | [프리뷰](http://127.0.0.1:3001/design-system/components/date-picker) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=77-504) |
| 18 | 생년월일 휠 · WheelDatePicker | [프리뷰](http://127.0.0.1:3001/design-system/components/wheel-picker) | [상태 보드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=78-599) |

## 구현 범위와 확인

- 당시 기존 ImageBox와 FlowStepCta를 카탈로그에 등록하고(FlowStepCta는 2026-10-10 조합 패턴으로 전환), 나머지는 재사용 가능한 웹 라이브러리로 추가했다. 새로운 컴포넌트의 제품 화면 편입은 별도다.
- BirthDatePicker의 열별 방향키·Home/End·단일 Tab 정지점과 보이는 초점을 보완했다. WheelDatePicker는 말일 보정과 직접 입력, 확정/취소 예제를 제공한다.
- 참조의 중복 역할은 합쳤다. Scroll Fog는 WheelDatePicker 내부, Content Placeholder는 ImageBox, Wrap/Overflow는 ChipGroup에 연결한다.
- 타입 검사 통과: `output/plating/additions-typecheck-20261001.log`. 프로덕션 빌드 통과: `/tmp/plating-additions-final-20261001`, `output/plating/additions-build-final-20261001.log`.
- 1440/320px에서 직접 진입·키보드·취소·실패 복귀·파일 선택·말일·동작 줄이기 등 77/77 확인. 런타임 오류 0. 근거: `output/plating/additions-browser-20261001.json`.
- 비교 화면: 원본 이미지 표시, 접힘/펼침 클릭·Space, 제목 편집, 긴 본문, 390px 넘침 없음 확인.
- Figma: 20세트/70변형, 상태별 원본과 인스턴스 보드, 기존 변수·텍스트 스타일 연결. 긴 문구 높이와 날짜 범위를 보정했다. 대표 최종 캡처: `output/plating/additions/figma-*-final.png`.
- 2026-10-07 Figma의 Noto Sans KR 대체 스타일을 Pretendard로 전환했다. 웹·네이티브와 폰트 패밀리 및 400/500/600/700 굵기를 공유한다.
- Native/Android 실행, 계정 저장·서버 동기화, 배포는 이번 검증에 포함하지 않았다.

## 아코디언 구조 적용

- [SEED Accordion](https://seed-design.io/components/accordion)의 세로 목록을 기준으로 `Accordion → AccordionItem → AccordionTrigger / AccordionContent` 구조를 추가했다. 기존 단일 `Disclosure`는 별도 용도로 유지한다.
- 비교 화면은 각각 세 개의 항목으로 구성한다. 접힘은 헤더 타이틀·아래 화살표, 펼침은 헤더 타이틀·위 화살표·콘텐츠 패널을 표시한다.
- 본문 형식을 불렛 목록과 문장형으로 전환할 수 있다. 긴 본문은 패널 높이가 늘어난다. 헤더 전체가 클릭 영역이다.
- 기본은 단일 펼침이며 `multiple`로 복수 펼침을 지원한다. `values / defaultValues / onValuesChange`, `inline / separated`, `medium / large / responsive`, 개별 또는 전체 비활성, 선택적인 설명·앞쪽 슬롯을 제공한다.
- 컴포넌트 상세의 프리뷰, 속성 설명, 사용 코드와 카탈로그 이름을 함께 갱신했다. 카탈로그 URL은 `/design-system/components/disclosure`를 유지한다. 현재 iOS 공용 타입이 단일 Disclosure라는 설명도 구분해 남긴다.
- Figma의 기존 컴포넌트 세트 `79:431`과 보드 `79:459`를 갱신했다. 세 가지 대표 상태는 접힘, 불렛 펼침, 문장형 펼침이다. 기존 소스 ID를 유지하고 Plating 색상·간격 변수와 텍스트 스타일을 연결했다.
- 타입 검사와 새 출력 경로의 프로덕션 빌드 통과 (`/tmp/plating-accordion-final-20261001.z8CTsn`). 브라우저에서 헤더 목록, 단일·복수 전환, Enter/Space, 방향키/Home/End, 콘텐츠 연결, 본문 형식, 긴 내용, 390px 넘침 없음, 동작 줄이기 등 비교 화면 17개와 상세 페이지 7개, 총 24개 확인 통과. 런타임 오류 0.
- 근거: `output/plating/accordion-browser-checks-20261001.json`, `output/plating/accordion-structure-typecheck-20261001.log`, `output/playwright/plating-accordion-structure-20261001.png`, `output/plating/additions/figma-accordion-structure-20261001.png`.

- 헤더 크기 최종 조정: Medium 제목을 16px·Medium(500)·줄 높이 24px로 되돌렸다. 웹과 Figma 제목 스타일을 함께 갱신했다.
