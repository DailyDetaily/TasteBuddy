# Plating의 iOS 컴포넌트 대조

> 아래 표와 실행 기록은 2026-10-01의 감사 스냅샷이다. 2026-10-02에 Textarea 계열의 실제 대응을 공용 `TBTextArea`와 두 제품 사용처로 갱신하고, Callout critical을 원본 수정의 저장 실패 안내에 연결했다. 최신 규격은 `src/plating/nativeComponentAudit.ts`와 [네이티브 UX 개선 기록](./plating-native-ux-improvement.md)을 확인한다. 과거 캡처·통과 결과가 새 구현의 실행 검증을 뜻하지는 않는다.

2026-10-06: iOS `TasteChip`은 공용 `Chip(tasteAxis:)`으로 통합했다. 이름 Medium·값 Semibold, 자연 줄 높이, 내부 1pt 경계와 한 줄 고정을 사용하며 기존 Chip의 아이콘·액션·비활성·톤·표현 방식을 지원한다. 아래 TasteChip 항목과 캡처는 통합 전 스냅샷이며, 현재 타입은 `Chip`과 `ChipSize`다.

2026-10-01 · 현재 카탈로그 51개 계열을 각 Swift 선언 또는 실제 사용처와 대조했다.

기존 웹 예제의 크기·API·상태가 iOS와 같은지 확인한 기록이다. 시스템 컨트롤과 정적 참고 견본은 제품 공용 컴포넌트와 구분한다. 아래 항목의 소스 해시는 `output/plating/native-audit-20261001/audit.json`에 있다.

| 종류 | 수 |
| --- | ---: |
| iOS 제품 구현 | 38 |
| iOS 시스템 컨트롤 | 7 |
| iOS 참고 견본 | 5 |
| 독립 iOS 구현 없음 | 1 |

Native 확인: 시뮬레이터 빌드 성공. 41개 계열의 실제 SwiftUI 타입을 50장의 독립 예제로 캡처하고 전체 이미지를 확인했다. 사진·문구·값은 합성 예제이며 화면 전환·저장·VoiceOver의 실행 검증은 아니다.

감사 당시 소스만 대조한 항목 중 현재 카탈로그에 남은 목록: DropdownMenu, SensoryBubble, DiningResultCard, TextareaField, SelectField, DateField, WheelDatePicker. 화면 안의 private 구성과 시스템 메뉴·피커, 독립 iOS 타입이 없는 항목이다.

## 항목별 확인

2026-10-04 · 프로필 입력은 TBTextInput(.profile), 선택은 TBSelectField로 공통화했다. InputButton은 선택 필드에 통합했다. 최신 규격과 표본은 웹 문서를 기준으로 확인한다.

2026-10-04 · 카탈로그에서 제거한 독립 상세 화면 예제는 아래 목록·문서에서 제외했다. 위 집계는 감사 당시 수치다.

| 항목 | 실제 iOS 대응 | 종류 | 규격 | 확인된 차이 |
| --- | --- | --- | --- | --- |
| [PrimaryButton](http://127.0.0.1:3001/design-system/components/primary-button#native-audit) | PrimaryButton | iOS 제품 구현 | 최소 높이 48 / Compact 40pt · SemiBold 14 / 12pt · 반경 10pt · 기본 패딩 0 / Compact 16×8pt | 구조도는 iOS 값으로 수정했다. 기존 React 프리뷰의 medium 글자와 기본 좌우 16px 패딩은 iOS와 다르다. |
| [IconButton](http://127.0.0.1:3001/design-system/components/icon-button#native-audit) | BottomSheetIconButton | iOS 제품 구현 | 아이콘 24pt · 영역 32×32pt · 선 1.8pt · iconPrimary #3F3F3F | 기존 Native 링크는 SystemParityComponents였으나 실제 선언은 SystemCoreComponents다. 웹의 disabled 속성과 누름 효과를 iOS의 내장 API로 설명할 수 없다. |
| [TextInput](http://127.0.0.1:3001/design-system/components/text-input#native-audit) | TBTextInput(.profile) | iOS 제품 구현 | 최소 48pt · 반경 12 · 값 14 SemiBold · 라벨 12 SemiBold | 프로필 이름·버디네임에 연결했다. dining/auth 규격도 유지한다. |
| [SearchField](http://127.0.0.1:3001/design-system/components/search-field#native-audit) | SearchOverlayShell.searchField | iOS 제품 구현 | 검색 입력 높이 44pt · Capsule · 좌우 16pt · Medium 13 · mutedSurface·border | 기존 연결 파일 NativeInputComponents에는 SearchField가 없다. 실제 검색 셸로 연결했다. 웹 예제의 입력 안 돋보기·지우기 버튼과 레이블은 현재 iOS 배치와 다르다. |
| [SelectionCard](http://127.0.0.1:3001/design-system/components/selection-card#native-audit) | TBSelectionCard | iOS 제품 구현 | 패딩 16·간격 12·반경 20pt · 표시기 18pt · 제목 SemiBold 14 / 설명 Regular 12 | 기존 Native 링크는 NativeInputComponents였으나 실제 선언은 TBComponents다. |
| [Chip](http://127.0.0.1:3001/design-system/components/chip#native-audit) | Chip / TBSelectableChip | iOS 제품 구현 | Chip xs/sm/md: SemiBold 10/11/12 · 좌우 8/10/12·상하 4/6/8·간격 4/6/8pt | 웹 asChild 버튼 조합과 SwiftUI Chip 본체의 API가 다르다. 선택 상태는 일반 Chip에 내장돼 있지 않다. |
| [Checkbox](http://127.0.0.1:3001/design-system/components/checkbox#native-audit) | TBUICheckbox / TBSelectionCard.Indicator.checkbox | iOS 참고 견본 | 독립 견본 18pt·반경 4 / 선택 카드 표시기 18pt·반경 6 · 체크 아이콘 12pt | NativeInputComponents에는 독립 Checkbox가 없다. 웹 16px 혼합·키보드 컨트롤을 이 정적 견본과 동일하다고 볼 수 없다. |
| [RadioGroup](http://127.0.0.1:3001/design-system/components/radio#native-audit) | TBUIRadioGroup / TBSelectionCard.Indicator.radio | iOS 참고 견본 | 독립 견본 원 18pt·선택 점 8pt · 선택 경계 2 / 기본 1pt · 행 간격 8pt | 웹 RadioGroup의 방향키·16px·value/onValueChange와 다르다. 연결된 NativeInputComponents에는 해당 타입이 없다. |
| [Switch](http://127.0.0.1:3001/design-system/components/switch#native-audit) | TBUISwitch | iOS 참고 견본 | 정적 견본 44×26pt · thumb 22pt · inset 2pt · on 검정 / off borderStrong | 웹 Switch와 상호작용 계약이 다르다. NativeInputComponents 링크를 정적 견본의 실제 파일로 수정했다. |
| [TopBar](http://127.0.0.1:3001/design-system/components/top-bar#native-audit) | TopAppBar | iOS 제품 구현 | 일반 48pt / Glass 40pt · 좌우 20pt · 제목 Bold 15 | Appearance 4종. 홈은 Transparent + 프로필·기본 액션, 버블 맵은 Glass + 뒤로·제목·검색·다음. |
| [BottomTab](http://127.0.0.1:3001/design-system/components/bottom-tab#native-audit) | BottomTabBar | iOS 제품 구현 | 최소 높이 60pt · 좌우 8pt · 아이콘 24pt · 글자 10pt · 아이콘-글자 간격 2pt | 웹의 홈·다이닝·분석 3개 예제와 아이콘은 실제 iOS의 목적지·순서·중앙 버튼과 다르다. |
| [BackButton](http://127.0.0.1:3001/design-system/components/back-button#native-audit) | TopAppBar.leadingControl | iOS 제품 구현 | chevron.left 24pt · 영역 32pt · iconPrimary · .plain 스타일 | 웹의 44px 영역·20px ArrowLeft·‘이전 단계’ 텍스트는 이 iOS chrome의 내장 외형과 다르다. |
| [StepIndicator](http://127.0.0.1:3001/design-system/components/step-indicator#native-audit) | TBStepIndicator | iOS 제품 구현 | 높이 6pt · 활성 폭 16·비활성 폭 6 · 간격 6 · Capsule | 사이트의 clamp·마지막 단계 진행 버튼은 예제의 조합이며 TBStepIndicator의 내장 동작이 아니다. |
| [CompactCard](http://127.0.0.1:3001/design-system/components/card#native-audit) | CompactCard | iOS 제품 구현 | 패딩 12·간격 12·반경 20pt · media 40×40pt · 제목 SemiBold 14 / metadata Regular 12 | 기존 Native 연결은 SystemParityComponents였으나 실제 CompactCard는 SearchSystemComponents다. 문서의 긴 문구 무조건 줄바꿈 설명은 실제 1줄 제한과 다르다. |
| [ListRow](http://127.0.0.1:3001/design-system/components/list-row#native-audit) | TasteDetailValueRow | iOS 제품 구현 | 최소 52pt · 좌우 16·상하 12pt · 제목 Regular 13 / 값 SemiBold 15 | 기존 링크와 예제의 CardScrollList는 수평 카드 컨테이너다. 목록 행의 실제 대응을 TasteDetailValueRow로 수정했다. 웹 예제의 최소 48px는 iOS 52pt와 다르다. |
| [StatusChip](http://127.0.0.1:3001/design-system/components/badge#native-audit) | StatusChip | iOS 제품 구현 | SemiBold 10pt · 좌우 6·상하 2pt · 반경 6 · 1줄·내용 너비 | 실제 파일은 SystemCoreComponents다. ‘10–12pt’ 대신 고정 기본 10pt를 명시했다. |
| [TasteProfileAvatar](http://127.0.0.1:3001/design-system/components/avatar#native-audit) | TasteProfileAvatar | iOS 참고 견본 | 참고 아바타 size 기본 48pt · 이니셜 Bold size×0.24 · 미각 AngularGradient 88% | 웹 initials·sm/md/lg/xl·imageSrc 속성은 이 SwiftUI 타입에 없다. 기존 Native 파일은 다른 타입 PalateBloomAvatar였다. |
| [Separator](http://127.0.0.1:3001/design-system/components/divider#native-audit) | SwiftUI.Divider | iOS 시스템 컨트롤 | 시스템 Divider · TasteDetailValueRow에서 borderSubtle overlay·좌우 16pt | 웹 Separator의 orientation/decorative API와 1px를 공통 iOS 컴포넌트 규격으로 볼 수 없다. |
| [ToastSurface](http://127.0.0.1:3001/design-system/components/toast#native-audit) | ToastSurface / TBToastPresenter | iOS 제품 구현 | 패딩 12·반경 14pt · 제목 SemiBold 13 / 본문 Regular 12 · 아이콘 16pt·영역 28pt | 웹 message/media API와 iOS title/message/icon API가 다르다. 모든 토스트가 3.5초라는 설명을 정책별로 수정했다. |
| [InlineError](http://127.0.0.1:3001/design-system/components/inline-error#native-audit) | TBTextInput.errorText | iOS 제품 구현 | Regular 12pt · destructive #D4183D · lineSpacing 3 · 입력과 간격 8pt | aria-describedby는 웹 계약이다. iOS는 TBTextInput의 errorText·accessibilityHint 조합이다. |
| [EmptyState](http://127.0.0.1:3001/design-system/components/empty-state#native-audit) | EmptyState | iOS 제품 구현 | 좌우 24·상하 48·간격 16pt · 제목 Bold 16 / 설명 Regular 13 · action 최소 40pt | 실제 EmptyState와 대응하지만 상태 원인·다음 라우트는 화면이 정한다. 문서의 버튼을 PrimaryButton 48pt로 해석하면 다르다. |
| [Progress](http://127.0.0.1:3001/design-system/components/progress#native-audit) | TBUIProgress / ProgressView | iOS 참고 견본 | 정량 견본 막대 8pt · value를 0…1로 clamp · 비정량은 시스템 ProgressView | 웹 Progress의 0…100 API·aria 속성과 다르다. SystemCoreComponents 링크를 실제 견본 파일로 수정했다. |
| [BottomSheetShell](http://127.0.0.1:3001/design-system/components/bottom-sheet#native-audit) | BottomSheetShell | iOS 제품 구현 | 상단 반경 32·손잡이 36×5pt · fixed 높이 max(0, 화면×0.98−safeTop−12) · 최대 폭 1440pt | 외부 번호와 iOS 구조도는 수정했다. 기존 React 프리뷰의 높이 95%·반경 20·손잡이 40×6은 다르다. 키보드 offset 애니메이션에는 Shell 내부의 동작 줄이기 분기가 없다. |
| [Dialog](http://127.0.0.1:3001/design-system/components/dialog#native-audit) | ActionOverlayCard | iOS 제품 구현 | 최대 폭 320pt·반경 20·stack 패딩 16 · 배경 검정 35% · action 높이 44pt | 웹 Radix Dialog의 focus trap·Escape와 open API는 ActionOverlayCard 내부 기능이 아니다. |
| [DropdownMenu](http://127.0.0.1:3001/design-system/components/menu#native-audit) | SwiftUI.contextMenu | iOS 시스템 컨트롤 | 시스템 메뉴 · 외형·행 높이·전환은 iOS가 결정 | 웹 최소 40px·방향키·Escape를 iOS 공통 규격으로 주장할 수 없다. |
| [TasteChip](http://127.0.0.1:3001/design-system/components/taste-chip#native-audit) | TasteChip | iOS 제품 구현 | xs/sm/md: 글자 10/11/12·간격 4/6/8·좌우 8/10/12·상하 4/6/8pt · 내부 경계 1pt | 구조도의 경계를 내부 strokeBorder처럼 수정했다. React value의 숫자/문자열 API와 title 초기화 기본 tone은 별도로 확인해야 한다. |
| [SensoryBubble](http://127.0.0.1:3001/design-system/components/sensory-bubble#native-audit) | TasteExperienceBubbleView / DiningSensorySelectionEditor | iOS 제품 구현 | 원형 크기는 position.size · 이름 Bold 14·최대 3줄·좌우 14pt · 선택 글자 1.14배 | 웹의 몇 개 고정 크기 버튼은 실제 버블 지도·크기·초점·진입 동작을 재현하지 않는다. 실제 버블 선언은 DiningView에 있다. |
| [TasteBloom](http://127.0.0.1:3001/design-system/components/taste-bloom#native-audit) | PalateBloomAvatar | iOS 제품 구현 | size 기본 40pt · 6축 값 0…100 clamp · 프로필·shapeSeed로 형상 결정 | 웹 ariaLabel과 SwiftUI의 접근성 숨김이 다르다. Canvas의 픽셀·형상·모션 완전 일치는 소스 대응만으로 확인할 수 없다. |
| [DiningResultCard](http://127.0.0.1:3001/design-system/components/dining-result#native-audit) | DiningFeedbackResultCard | iOS 제품 구현 | 반경 20·패딩 12·gap 10pt · 사진 4:5·반경 12 · 제목 Bold 14 / 부제 Regular 12 | 웹 ‘고소함이 남는 식사’ 텍스트·두 칩 예제에는 실제 사진·reaction bubble·메모·빠른 저장 상태가 없다. |
| [InterpretationCard](http://127.0.0.1:3001/design-system/components/interpretation-card#native-audit) | InterpretationCard | iOS 제품 구현 | SectionCard: 반경 20·패딩 12 · 설명 SemiBold 14·보조 Regular 12 · verticalCapsule indicator | 기존 Native 링크는 PersonalTasteInsightCards였다. 웹 단순 요약·미각 칩은 indicator·상단 슬롯·줄 수 계약과 다르다. |
| [TasteGraph](http://127.0.0.1:3001/design-system/components/taste-graph#native-audit) | HexRadarChart | iOS 제품 구현 | Canvas 비율 320:310 · 기준 중심 160/145·최대 반경 100 · grid 25/50/75/100% | 웹 예제는 가로 막대지만 현재 Native 연결은 레이더다. TasteLineChart는 별도 타입이다. 모든 초기화에서 결측을 동일하게 처리한다는 설명은 실제 소스와 다르다. |
| [TextareaField](http://127.0.0.1:3001/design-system/components/textarea#native-audit) | DiningView.reflectionView의 TextEditor | iOS 제품 구현 | 최소 높이 156pt·반경 20·패딩 10pt · Regular 13 · surface·border | 웹 최소 120px·반경 10·세로 resize는 이 iOS 입력과 다르다. |
| [SelectField](http://127.0.0.1:3001/design-system/components/select#native-audit) | TBSelectField | iOS 제품 구현 | 최소 48pt · 반경 12 · 라벨 12/값 14 SemiBold | 프로필 날짜·단일·복수 선택창을 연결한다. |
| [SegmentedControl](http://127.0.0.1:3001/design-system/components/segmented-control#native-audit) | TasteDetailSectionPicker / TBCapsuleTabs | iOS 제품 구현 | 표면 높이 32pt·터치 최소 44pt · 좌우 14·gap 8pt · 글자 13pt·선택 Bold / 기본 Medium | 웹 segmented control의 통합 track·배경·API는 이 개별 Capsule 탭과 다르다. |
| [PeriodPicker](http://127.0.0.1:3001/design-system/components/period-tabs#native-audit) | TasteDetailPeriodPicker | iOS 제품 구현 | 1개월 / 3개월 / 6개월 / 1년 / 전체 · 표면 32·터치 44pt · gap 8pt | 기간 선택이 곧 데이터 재집계라는 예제 동작은 Picker의 내장 기능이 아니다. |
| [TextAction](http://127.0.0.1:3001/design-system/components/text-action#native-audit) | AuthTextActionButton | iOS 제품 구현 | 높이 28pt · 좌우 8·상하 4pt · SemiBold 12 · textFaint(검정 40%) | 웹 TextAction의 44px·hover·underline·tone과 다르다. 작은 실제 영역은 별도 접근성 검토가 필요하다. |
| [IconActionButton](http://127.0.0.1:3001/design-system/components/icon-action-button#native-audit) | IconActionButton | iOS 제품 구현 | 높이 32pt · 기록 아이콘 24pt · 소셜 아이콘 18/17pt · 숫자 12pt | 2026-10-04: RecordActions와 SocialActions로 실제 제품 사용처를 공통화했다. |
| [NotificationBadge](http://127.0.0.1:3001/design-system/components/notification-badge#native-audit) | TopAppBarIconButton.showsDot | iOS 제품 구현 | sweet mainColor의 점 6×6pt · topTrailing · offset x −2 / y 2pt | 웹 수량·99+ 변형은 현재 iOS에 없다. dot 접근성 안내도 실제 확인·보완 대상이다. |
| [ContentSkeleton](http://127.0.0.1:3001/design-system/components/skeleton#native-audit) | TBSkeletonBlock | iOS 제품 구현 | 반경 기본 12pt·크기는 부모가 지정 · disabledSurface·정적 흰 gradient | 웹 애니메이션 Skeleton과 다르다. loading을 이 뷰 자체가 읽어 주는 것으로 설명하면 틀리다. |
| [ImageBox](http://127.0.0.1:3001/design-system/components/image-frame#native-audit) | ImageBox | iOS 제품 구현 | 반경 8pt · size small/medium/large는 TokenBox 치수 · 부모 비율은 별도 지정 | 기존 연결은 SensoryAnalysisCards였으나 실제 공용 타입은 SystemCoreComponents다. 웹 ImageBox의 사진 크기·onError 로직이 SwiftUI AsyncImage의 렌더 결과와 동일하다는 증거는 없다. |
| [Disclosure](http://127.0.0.1:3001/design-system/components/disclosure#native-audit) | TasteDetailDisclosure / DisclosureGroup | iOS 시스템 컨트롤 | 제목 Medium 12·최소 44pt · 본문 Regular 12·textSecondary · 위·요소 간격 8pt | 웹 open/onOpenChange·details/summary API와 다르다. 사용처가 제어하는 펼침 상태로 설명하면 틀리다. |
| [ScopeLabel](http://127.0.0.1:3001/design-system/components/scope-label#native-audit) | TasteDetailScope | iOS 제품 구현 | Regular 11pt · textSecondary #3F3F3F · 세로 줄바꿈 | 웹 종류별 badge/tone과 글자색이 다르면 동일한 Native 변형으로 볼 수 없다. |
| [ChipGroup](http://127.0.0.1:3001/design-system/components/chip-group#native-audit) | TBWrapLayout / TBOverflowTagRow | iOS 제품 구현 | Wrap spacing은 필수·자연 너비 측정 / Overflow spacing 기본 6pt·+N 실제 너비 포함 | 웹 ChipGroup의 label·overflow·내장 전체 보기 동작을 iOS Layout API로 설명할 수 없다. |
| [FlowLoadingState](http://127.0.0.1:3001/design-system/components/flow-loading#native-audit) | TBFlowLoadingState | iOS 제품 구현 | 시스템 ProgressView + SemiBold 14·textBody 안내 · gap 16pt · 전체 영역 가운데 | 웹 role=status·동작 줄이기 회전 중단 설명은 실제 SwiftUI 소스의 보장과 다르다. |
| [FlowRetryState](http://127.0.0.1:3001/design-system/components/flow-retry#native-audit) | TBFlowRetryState | iOS 제품 구현 | SectionHeading + PrimaryButton 48pt · 간격 20pt · tbPageContentPadding | 웹 busy prop과 disabled 연결은 현재 Native 타입에 없다. |
| [Flow step pattern](http://127.0.0.1:3001/design-system/patterns/flow-step#native-audit) | TBStepIndicator + PrimaryButton 화면 조합 | iOS 제품 구현 | 높이 140pt · 좌우 20·하단 12pt · 주요 버튼 48 / Compact 40 · 단계 표시 아래 32pt | 웹 absolute 배치와 iOS VStack·고정 140pt 구조는 다르다. native CTA에 safe area 자동 포함이라는 설명을 수정했다. |
| [DateField](http://127.0.0.1:3001/design-system/components/date-picker#native-audit) | DiningMealTimeEditor의 DatePicker | iOS 시스템 컨트롤 | OS 날짜 DatePicker · confirmed 식사일 / approximate 기간 시작·끝 · 글자 Regular 14 사용처 | 웹 input[type=date]·error·44px API는 현재 Native 공통 속성이 아니다. |
| [WheelDatePicker](http://127.0.0.1:3001/design-system/components/wheel-picker#native-audit) | ProfileEditPickerOverlay의 DatePicker(.wheel) | iOS 시스템 컨트롤 | 카드 패딩 20·반경 24·닫기 36·적용 48pt · 1940-01-01부터 오늘 기준 12년 전 | 시스템 휠을 담는 프로필 선택창. 적용 시 프로필 초안에 반영하며 닫기·배경 탭은 적용하지 않는다. |

## 소스와 상태

### PrimaryButton

- [ios/TasteBuddy/Components/TBComponents.swift:123](../../ios/TasteBuddy/Components/TBComponents.swift#L123) · `struct PrimaryButton:`
- [ios/TasteBuddy/Components/TBComponents.swift:88](../../ios/TasteBuddy/Components/TBComponents.swift#L88) · `struct TBTokenButtonStyle:`

규격: 최소 높이 48 / Compact 40pt · SemiBold 14 / 12pt · 반경 10pt · 기본 패딩 0 / Compact 16×8pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / action | 필수 |
| isEnabled / visualDisabled | true / false |
| fullWidth / size / appearance | true / .default / .primary |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 검정 바탕·흰 글자 |
| 비활성 | #EFEFEF·#AFAFAF, 실행 차단 |
| visualDisabled | 비활성 색만 적용, action 유지 |
| 누름 | 활성에서 0.98배; 동작 줄이기에서는 축소 생략 |

처리 중 상태는 호출부가 title과 isEnabled로 조합한다. 기본 primary만 검정 10% 그림자(radius 20, y 8)를 사용한다.

### IconButton

- [ios/TasteBuddy/Components/SystemCoreComponents.swift:1159](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L1159) · `struct BottomSheetIconButton:`

규격: 아이콘 24pt · 영역 32×32pt · 선 1.8pt · iconPrimary #3F3F3F

| 속성 | 기본값 또는 계약 |
| --- | --- |
| ariaLabel / icon / action | 필수 |
| iconSize / iconStrokeWidth | 24 / 1.8 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | Circle contentShape, .plain 스타일 |
| 상위 비활성 | SwiftUI 환경이 실행을 막음 |

누름 축소나 자체 selected·loading·disabled 속성은 없다. 접근성 이름을 ariaLabel로 전달한다.

### TextInput

`ios/TasteBuddy/Components/NativeInputComponents.swift`의 `TBTextInput`은 프로필의 이름·버디네임에 `.profile` 규격으로 사용한다. 높이 48pt, 반경 12pt, 값 14pt SemiBold, 라벨 12pt SemiBold, 도움말 11pt Regular다. 키보드·초점·입력 값과 저장은 화면에서 관리한다. 기존 dining(44pt)과 auth(48pt) 규격을 유지한다.

### SearchField

- [ios/TasteBuddy/Components/SearchSystemComponents.swift:14](../../ios/TasteBuddy/Components/SearchSystemComponents.swift#L14) · `struct SearchOverlayShell<`
- [ios/TasteBuddy/Components/SearchSystemComponents.swift:99](../../ios/TasteBuddy/Components/SearchSystemComponents.swift#L99) · `private var searchField:`

규격: 검색 입력 높이 44pt · Capsule · 좌우 16pt · Medium 13 · mutedSurface·border

| 속성 | 기본값 또는 계약 |
| --- | --- |
| query / placeholder | Binding<String> / 필수 |
| onSubmit / onClose | 필수 |
| 검색 실행 / 취소 | 별도 44pt 컨트롤 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 입력 + 원형 검색 버튼 + 취소 |
| 진입 | 0.1초 뒤 검색 focus |
| 결과 | content 슬롯을 ScrollView로 표시 |

검색 결과와 요청은 호출부가 관리한다. TextField 내부의 돋보기·지우기 버튼은 내장하지 않는다.

### SelectionCard

- [ios/TasteBuddy/Components/TBComponents.swift:509](../../ios/TasteBuddy/Components/TBComponents.swift#L509) · `struct TBSelectionCard:`
- [ios/TasteBuddy/Components/TBComponents.swift:497](../../ios/TasteBuddy/Components/TBComponents.swift#L497) · `enum SelectionCardMetrics`

규격: 패딩 16·간격 12·반경 20pt · 표시기 18pt · 제목 SemiBold 14 / 설명 Regular 12

| 속성 | 기본값 또는 계약 |
| --- | --- |
| indicator | .radio 또는 .checkbox |
| isSelected / isEnabled / singleLine | false / true / false |
| description / trailing | 선택적 콘텐츠 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 선택 | 강조 경계와 검정 6% 그림자(radius 12, y 8) |
| 비활성 | 비활성 색과 실제 실행 차단 |
| 한 줄 | 최소 높이 44pt, 표시기 가운데 정렬 |

실제 Button이며 선택 여부는 호출부가 갱신한다. 상위 isEnabled와 선택 접근성 trait를 반영한다.

### Chip

- [ios/TasteBuddy/Components/SystemParityComponents.swift:250](../../ios/TasteBuddy/Components/SystemParityComponents.swift#L250) · `struct Chip:`
- [ios/TasteBuddy/Components/NativeInputComponents.swift:113](../../ios/TasteBuddy/Components/NativeInputComponents.swift#L113) · `struct TBSelectableChip:`

규격: Chip xs/sm/md: SemiBold 10/11/12 · 좌우 8/10/12·상하 4/6/8·간격 4/6/8pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| Chip: size / tone / variant | .small / .neutral / .soft |
| 선택형: isSelected / variant | TBSelectableChip에서 false / .dining |
| trailingAction | 후행 아이콘에만 선택적 action |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 정보 표시 | Chip은 HStack, 본체 action 없음 |
| 선택형 | TBSelectableChip은 Button |
| 비활성 | 실제 enabled 환경과 비활성 색 반영 |

일반 Chip과 선택형 TBSelectableChip은 별도 API다. 선택형 dining은 최소 36pt, correction은 상하 9pt이며 줄바꿈을 허용한다.

### Checkbox

- [ios/TasteBuddy/Components/DesignSystemFullComponents.swift:642](../../ios/TasteBuddy/Components/DesignSystemFullComponents.swift#L642) · `struct TBUICheckbox:`
- [ios/TasteBuddy/Components/TBComponents.swift:583](../../ios/TasteBuddy/Components/TBComponents.swift#L583) · `private var selectionIndicator:`

규격: 독립 견본 18pt·반경 4 / 선택 카드 표시기 18pt·반경 6 · 체크 아이콘 12pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| TBUICheckbox: title / isChecked | title 필수 / false |
| 실제 선택 | TBSelectionCard의 indicator: .checkbox와 action |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 독립 견본 | isChecked로 외형만 변경 |
| 제품 카드 | 상위 Button이 선택·비활성을 처리 |

TBUICheckbox는 Binding이나 action이 없는 정적 참고 견본이다. 제품 선택은 TBSelectionCard가 담당한다.

### RadioGroup

- [ios/TasteBuddy/Components/DesignSystemFullComponents.swift:669](../../ios/TasteBuddy/Components/DesignSystemFullComponents.swift#L669) · `struct TBUIRadioGroup:`
- [ios/TasteBuddy/Components/TBComponents.swift:583](../../ios/TasteBuddy/Components/TBComponents.swift#L583) · `private var selectionIndicator:`

규격: 독립 견본 원 18pt·선택 점 8pt · 선택 경계 2 / 기본 1pt · 행 간격 8pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| options / selectedIndex | 필수 / 0 |
| 제품 선택 | TBSelectionCard(indicator: .radio)의 action |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 독립 견본 | selectedIndex로 외형만 변경 |
| 제품 선택 | 호출부가 단일 선택 상태 관리 |

TBUIRadioGroup은 상태 변경 콜백과 Binding을 제공하지 않는다.

### Switch

- [ios/TasteBuddy/Components/DesignSystemFullComponents.swift:694](../../ios/TasteBuddy/Components/DesignSystemFullComponents.swift#L694) · `struct TBUISwitch:`

규격: 정적 견본 44×26pt · thumb 22pt · inset 2pt · on 검정 / off borderStrong

| 속성 | 기본값 또는 계약 |
| --- | --- |
| isOn | true, 값형 Bool |

| 상태 | 실제 표현·책임 |
| --- | --- |
| On | 오른쪽 thumb |
| Off | 왼쪽 thumb |

이 견본은 Toggle이 아니며 Binding·action·접근성 조작을 내장하지 않는다. 제품 설정은 사용처의 SwiftUI Toggle을 확인해야 한다.

### TopBar

- [ios/TasteBuddy/Components/Shell/AppChromeComponents.swift:666](../../ios/TasteBuddy/Components/Shell/AppChromeComponents.swift#L666) · `struct TopAppBar:`
- [ios/TasteBuddy/Components/Shell/AppChromeComponents.swift:6](../../ios/TasteBuddy/Components/Shell/AppChromeComponents.swift#L6) · `enum AppChromeMetrics`

규격: 일반형 48pt / Glass 40pt · 좌우 20pt · 제목 Bold 15 · Glass 제목 패딩 12pt·원형 버튼 40pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| appearance | .default / .solid / .transparent / .glass |
| showBack / showsDefaultActions | false / true |
| rightActions / callbacks | 사용처가 전달 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 프로필 + 알림·측정/검색·메뉴 |
| 뒤로 | leadingControl이 chevron.left로 대체 |
| 스크롤 | 공용 chrome의 blur·dissolve 연동 |

기본 아이콘 24pt·영역 32pt·간격 8pt. 제목은 전체 폭 중앙이며 버튼 action은 호출부가 제공한다.


2026-10-06: 버블 맵은 공용 `TopAppBar(.glass)`를 사용한다. iOS 홈은 `transparent`에 프로필·기본 액션을 조합하고 검색 화면은 `solid`로 전환한다. 홈 검색창은 별도 구성이다. Glass의 뒤로·검색·다음은 버블 맵이 콜백과 표시 조건을 제공한다.

### BottomTab

- [ios/TasteBuddy/Components/Shell/AppChromeComponents.swift:1002](../../ios/TasteBuddy/Components/Shell/AppChromeComponents.swift#L1002) · `struct BottomTabBar:`
- [ios/TasteBuddy/App/AppNavigation.swift:3](../../ios/TasteBuddy/App/AppNavigation.swift#L3) · `enum MainTab:`
- [ios/TasteBuddy/Components/Shell/BottomTabCenterButton.swift:3](../../ios/TasteBuddy/Components/Shell/BottomTabCenterButton.swift#L3) · `struct BottomTabCenterButton:`

규격: 최소 높이 60pt · 좌우 8pt · 아이콘 24pt · 글자 10pt · 아이콘-글자 간격 2pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| activeTab | Binding<MainTab> |
| 목적지 | 홈 / 나의 입맛 / 다이닝 / 프로필 |
| 중앙 기록 | onCreateDishMemory(TasteBeamLaunchState) |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 활성 | textPrimary·SemiBold |
| 비활성 목적지 | textDisabled·Medium; 실행은 가능 |
| 중앙 누름 | 상단 경계선 숨김·기록 시작 모션 |

4개 목적지 사이에 별도의 중앙 기록 버튼이 있다. 안전 영역은 상위 AppShell에서 처리한다.

### BackButton

- [ios/TasteBuddy/Components/Shell/AppChromeComponents.swift:757](../../ios/TasteBuddy/Components/Shell/AppChromeComponents.swift#L757) · `private var leadingControl:`
- [ios/TasteBuddy/Components/Shell/AppChromeComponents.swift:850](../../ios/TasteBuddy/Components/Shell/AppChromeComponents.swift#L850) · `private struct TopAppBarIconButton:`

규격: chevron.left 24pt · 영역 32pt · iconPrimary · .plain 스타일

| 속성 | 기본값 또는 계약 |
| --- | --- |
| showBack / onBack | TopAppBar에서 true / callback |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 뒤로 아이콘, 접근성 이름 ‘뒤로’ |

호출부의 onBack을 실행한다. 방문 이력·dismiss·단계 복귀의 선택은 라우트가 담당한다.

### StepIndicator

- [ios/TasteBuddy/Components/TBComponents.swift:205](../../ios/TasteBuddy/Components/TBComponents.swift#L205) · `struct TBStepIndicator:`
- [ios/TasteBuddy/Components/TBComponents.swift:198](../../ios/TasteBuddy/Components/TBComponents.swift#L198) · `enum StepIndicatorMetrics`

규격: 높이 6pt · 활성 폭 16·비활성 폭 6 · 간격 6 · Capsule

| 속성 | 기본값 또는 계약 |
| --- | --- |
| currentIndex / total | 필수, 0부터 시작 |
| activeColor / inactiveColor | textPrimary / borderStrong |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 현재 단계 | 해당 index만 폭 16 |
| total≤0 | 표시 요소 없음 |

content 역할 모션으로 폭이 바뀐다. 접근성은 요소를 묶어 ‘진행 단계 n / total’을 읽는다. index 정규화는 호출부 책임이다.

### CompactCard

- [ios/TasteBuddy/Components/SearchSystemComponents.swift:134](../../ios/TasteBuddy/Components/SearchSystemComponents.swift#L134) · `struct CompactCard<`
- [ios/TasteBuddy/Components/SearchSystemComponents.swift:119](../../ios/TasteBuddy/Components/SearchSystemComponents.swift#L119) · `enum CompactCardMetrics`

규격: 패딩 12·간격 12·반경 20pt · media 40×40pt · 제목 SemiBold 14 / metadata Regular 12

| 속성 | 기본값 또는 계약 |
| --- | --- |
| heading / metadata | 필수 / 선택 |
| isSelected / action | false / nil |
| media / actions | ViewBuilder 슬롯 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 선택 | mutedSurface |
| 기본 | surface |
| action 있음 | 64pt 높이의 투명 Button + 독립 actions |

제목과 metadata는 각 1줄이다. 행 행동과 우측 행동의 hit testing을 분리한다.

### ListRow

- [ios/TasteBuddy/Components/TasteDetailPage.swift:261](../../ios/TasteBuddy/Components/TasteDetailPage.swift#L261) · `struct TasteDetailValueRow:`

규격: 최소 52pt · 좌우 16·상하 12pt · 제목 Regular 13 / 값 SemiBold 15

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / value | 필수 |
| showsDivider / showsChevron | true / false |
| accent | textPrimary |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | baseline 정렬의 가로 행 |
| 큰 글자 | 세로 배치 + 8pt 간격 |

정보 표시 View이며 자체 action은 없다. Divider와 제목·값을 묶어서 읽는다.

### StatusChip

- [ios/TasteBuddy/Components/SystemCoreComponents.swift:336](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L336) · `struct StatusChip:`
- [ios/TasteBuddy/Components/SystemCoreComponents.swift:329](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L329) · `enum StatusChipMetrics`

규격: SemiBold 10pt · 좌우 6·상하 2pt · 반경 6 · 1줄·내용 너비

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title | 필수 |
| backgroundColor / foregroundColor | mutedSurface / textTertiary |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | #F7F7F7 / #535353 |
| 색 변경 | 직접 전달한 Color 사용 |

독립 상호작용과 tone enum은 없다.

### TasteProfileAvatar

- [ios/TasteBuddy/Components/DesignSystemFullComponents.swift:82](../../ios/TasteBuddy/Components/DesignSystemFullComponents.swift#L82) · `struct TasteProfileAvatar:`
- [ios/TasteBuddy/Components/PalateBloomAvatar.swift:383](../../ios/TasteBuddy/Components/PalateBloomAvatar.swift#L383) · `struct PalateBloomAvatar:`

규격: 참고 아바타 size 기본 48pt · 이니셜 Bold size×0.24 · 미각 AngularGradient 88%

| 속성 | 기본값 또는 계약 |
| --- | --- |
| scores | [TasteAxis: Int] 필수 |
| size | 48pt, 직접 수치 지정 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 참고 견본 | 상위 두 축의 첫 글자와 점수 기반 gradient |
| 제품 프로필 | TopAppBar는 PalateBloomAvatar를 사용 |

TasteProfileAvatar는 file-only 참고 견본이다. 제품의 꽃 또는 사진 아바타와 구분한다.

### Separator

- [ios/TasteBuddy/Components/TasteDetailPage.swift:270](../../ios/TasteBuddy/Components/TasteDetailPage.swift#L270) · `if showsDivider { Divider()`

규격: 시스템 Divider · TasteDetailValueRow에서 borderSubtle overlay·좌우 16pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| 색 / 여백 / 방향 | 사용처의 modifiers와 배치로 지정 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 정보 그룹의 경계, 독립 조작 없음 |

앱에 독립 Separator 타입은 없다. 시스템 Divider의 실제 두께는 실행 환경과 배율에 영향을 받는다.

### ToastSurface

- [ios/TasteBuddy/Components/DesignSystemFullComponents.swift:181](../../ios/TasteBuddy/Components/DesignSystemFullComponents.swift#L181) · `struct ToastSurface:`
- [ios/TasteBuddy/Components/NativeFeedbackComponents.swift:5](../../ios/TasteBuddy/Components/NativeFeedbackComponents.swift#L5) · `enum TBToastPolicy:`

규격: 패딩 12·반경 14pt · 제목 SemiBold 13 / 본문 Regular 12 · 아이콘 16pt·영역 28pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / message / icon / tone | title 필수 / nil / .circleCheck / .neutral |
| actionTitle / action | 둘 다 있어야 행동 표시 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 완료·되돌리기 | presenter 3.5초 |
| 북마크 후 시트 닫기 | 별도 policy 0.7초 |
| 대체·취소 | 이전 timeout을 취소 |

Surface는 외형만 담당한다. 동작 버튼은 높이 32pt, 좌우 12pt의 Capsule이며 수명은 presenter의 책임이다.

### InlineError

- [ios/TasteBuddy/Components/NativeInputComponents.swift:35](../../ios/TasteBuddy/Components/NativeInputComponents.swift#L35) · `private var message:`
- [ios/TasteBuddy/Components/NativeInputComponents.swift:91](../../ios/TasteBuddy/Components/NativeInputComponents.swift#L91) · `.accessibilityHint(errorText.map`

규격: Regular 12pt · destructive #D4183D · lineSpacing 3 · 입력과 간격 8pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| errorText / helperText | nil / nil, errorText 우선 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 오류 | 입력 경계 + 오류 문구 |
| 오류 없음 | helperText 표시 또는 영역 생략 |

독립 InlineError 타입은 없다. 입력의 accessibilityHint에 오류 이유를 포함하며 에러 검사는 호출부가 담당한다.

### EmptyState

- [ios/TasteBuddy/Components/SystemCoreComponents.swift:370](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L370) · `struct EmptyState:`
- [ios/TasteBuddy/Components/SystemCoreComponents.swift:359](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L359) · `enum EmptyStateMetrics`

규격: 좌우 24·상하 48·간격 16pt · 제목 Bold 16 / 설명 Regular 13 · action 최소 40pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / description | 필수 |
| icon / actionLabel / onAction | nil; label과 action이 함께 있어야 버튼 표시 |
| actionTone | .default 또는 .userAccent |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 본문 | 가운데 정렬 |
| action | SemiBold 12·반경 10·위 간격 8pt |

아이콘은 18pt, 컨테이너 32pt·반경 14다. 접근성 요소를 합쳐 읽는다.

### Progress

- [ios/TasteBuddy/Components/DesignSystemFullComponents.swift:754](../../ios/TasteBuddy/Components/DesignSystemFullComponents.swift#L754) · `struct TBUIProgress:`
- [ios/TasteBuddy/Components/NativeLayoutComponents.swift:119](../../ios/TasteBuddy/Components/NativeLayoutComponents.swift#L119) · `struct TBFlowLoadingState:`

규격: 정량 견본 막대 8pt · value를 0…1로 clamp · 비정량은 시스템 ProgressView

| 속성 | 기본값 또는 계약 |
| --- | --- |
| TBUIProgress.value | CGFloat, 0…1 |
| 비정량 | TBFlowLoadingState의 ProgressView |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 정량 견본 | 검정 fill·borderSubtle track |
| 제품 로딩 | 시스템 spinner + 안내 |

앱의 정량 막대는 정적 primitive 참고 견본이다. 이 견본에는 자체 progress 접근성 값을 넣지 않았다.

### BottomSheetShell

- [ios/TasteBuddy/Components/SystemCoreComponents.swift:1198](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L1198) · `struct BottomSheetShell<`
- [ios/TasteBuddy/Components/SystemCoreComponents.swift:693](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L693) · `enum BottomSheetShellMetrics`

규격: 상단 반경 32·손잡이 36×5pt · fixed 높이 max(0, 화면×0.98−safeTop−12) · 최대 폭 1440pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| stageMode | .fixed / .auto(maxHeightRatio:) |
| headerStart / headerCenter / headerEnd | nil |
| footer / footerKeyboardOffset | nil / 0 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 헤더 | 손잡이와 ZStack으로 겹침; 기본 64pt |
| 푸터 | 좌우 20·상단 16·하단 max(12,safeBottom) |
| 키보드 offset | 호출부 값·easeOut 0.24초 |

표시·닫기·드래그는 presenter가 관리한다. Content 자체에 ScrollView나 패딩을 내장하지 않는다.

### Dialog

- [ios/TasteBuddy/Components/SystemCoreComponents.swift:477](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L477) · `struct ActionOverlayCard<`
- [ios/TasteBuddy/Components/SystemCoreComponents.swift:465](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L465) · `enum ActionOverlayCardMetrics`

규격: 최대 폭 320pt·반경 20·stack 패딩 16 · 배경 검정 35% · action 높이 44pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / description / actions | 필수 / nil / [] |
| layout | .stack / .split |
| onBackdropTap | nil, 자동 닫기 없음 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 제목 Bold 16·설명 Regular 12 |
| 헤더 슬롯 | 양쪽 40pt 슬롯·제목 Bold 15 |
| 행동 | 전달한 actions의 enabled·tone·callback |

오버레이는 표시·복귀를 스스로 관리하지 않는다. 검정 24% 그림자(radius 30, y 20)를 사용한다.

### DropdownMenu

- [ios/TasteBuddy/Features/Home/HomeDiscoveryViews.swift:21](../../ios/TasteBuddy/Features/Home/HomeDiscoveryViews.swift#L21) · `.contextMenu {`

규격: 시스템 메뉴 · 외형·행 높이·전환은 iOS가 결정

| 속성 | 기본값 또는 계약 |
| --- | --- |
| content | Button 등의 menu 콘텐츠 |
| 예: 발견 메뉴 | ‘이 발견 7일간 보지 않기’ action |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 열림 | 시스템 context menu |
| 선택 | 호출부 callback 실행 |

SystemParityComponents에는 독립 DropdownMenu가 없다. 실제 제품 사용처는 contextMenu이며 별도 목록은 Picker(.menu)도 사용한다.

### TasteChip

- [ios/TasteBuddy/Components/SystemParityComponents.swift:391](../../ios/TasteBuddy/Components/SystemParityComponents.swift#L391) · `struct TasteChip:`
- [ios/TasteBuddy/Components/SystemParityComponents.swift:353](../../ios/TasteBuddy/Components/SystemParityComponents.swift#L353) · `enum TasteChipSize`

규격: xs/sm/md: 글자 10/11/12·간격 4/6/8·좌우 8/10/12·상하 4/6/8pt · 내부 경계 1pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| axis / title 초기화 | axis는 .taste / title은 .neutral 기본 |
| value | String? = nil; ‘0’ 보존 |
| colorAxis / size | nil / .xs |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 이름만 | Medium·tintTextColor |
| 값 포함 | 이름 textPrimary·값 SemiBold tintTextColor |
| neutral / axis 없음 | 중립 팔레트 |

정보 표시 뷰다. accessibility children를 합치며 선택·disabled·누름 상태를 내장하지 않는다.

### SensoryBubble

- [ios/TasteBuddy/Features/Dining/DiningView.swift:6796](../../ios/TasteBuddy/Features/Dining/DiningView.swift#L6796) · `private struct TasteExperienceBubbleView:`
- [ios/TasteBuddy/Features/Dining/DiningSensorySelectionEditor.swift:28](../../ios/TasteBuddy/Features/Dining/DiningSensorySelectionEditor.swift#L28) · `struct DiningSensorySelectionEditor:`

규격: 원형 크기는 position.size · 이름 Bold 14·최대 3줄·좌우 14pt · 선택 글자 1.14배

| 속성 | 기본값 또는 계약 |
| --- | --- |
| position / isSelected / onTap | 필수 |
| priorityIndex / reduceMotion | 메인·보조 표시 / 호출부 전달 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 선택 | 미각 경계·그림자 12%, radius 23, y 18 |
| 진입 | 0.72배에서 나타남; reduceMotion이면 즉시 표시 |

실제 버블 배치와 outline은 다이닝 화면에서 계산한다. 감각 존재·강도·호감·알맞음은 별도 계약이다.

### TasteBloom

- [ios/TasteBuddy/Components/PalateBloomAvatar.swift:383](../../ios/TasteBuddy/Components/PalateBloomAvatar.swift#L383) · `struct PalateBloomAvatar:`
- [ios/TasteBuddy/Components/PalateBloomAvatar.swift:4](../../ios/TasteBuddy/Components/PalateBloomAvatar.swift#L4) · `struct PalateBloomProfile:`

규격: size 기본 40pt · 6축 값 0…100 clamp · 프로필·shapeSeed로 형상 결정

| 속성 | 기본값 또는 계약 |
| --- | --- |
| bloomProfile / tasteProfile / seed | 서로 다른 초기화 방식 |
| image / showFrame | nil / true |
| petal / stamen / pistil | 선택적 형상 override |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 사진 있음 | 원형 crop |
| 프로필 없음 | seed 기반 장식용 fallback |
| 프로필 있음 | 현재 값으로 Bloom layout 생성 |

뷰 자체는 accessibilityHidden(true)다. 의미 있는 접근성 설명은 상위 버튼·화면이 제공한다. fallback은 사용자 취향 근거가 아니다.

### DiningResultCard

- [ios/TasteBuddy/Features/Dining/DiningView.swift:6006](../../ios/TasteBuddy/Features/Dining/DiningView.swift#L6006) · `private struct DiningFeedbackResultCard:`
- [ios/TasteBuddy/Features/Dining/DiningView.swift:6139](../../ios/TasteBuddy/Features/Dining/DiningView.swift#L6139) · `private enum DiningFeedbackResultLayout`

규격: 반경 20·패딩 12·gap 10pt · 사진 4:5·반경 12 · 제목 Bold 14 / 부제 Regular 12

| 속성 | 기본값 또는 계약 |
| --- | --- |
| kind | .quickCapture 또는 .tasteFeedback |
| restaurant / menuTitle / experiences / detailTags | 실제 기록 콘텐츠 |
| reflectionNote / photoData | 메모 / 선택적 사진 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 빠른 저장 | 취향 덧붙이기 안내 |
| 미각 기록 | 최대 3개 reaction bubble·상세 tag·메모 |
| 사진 없음 | 카메라 fallback |

카드 shadow는 검정 16%, radius 35, y 24다. 공유·저장은 바깥 resultView가 담당한다.

### InterpretationCard

- [ios/TasteBuddy/Components/SystemParityComponents.swift:1557](../../ios/TasteBuddy/Components/SystemParityComponents.swift#L1557) · `struct InterpretationCard:`

규격: SectionCard: 반경 20·패딩 12 · 설명 SemiBold 14·보조 Regular 12 · verticalCapsule indicator

| 속성 | 기본값 또는 계약 |
| --- | --- |
| description | 필수 |
| eyebrow / supportingText / detailLabel | nil |
| onExpand / indicatorColors / indicatorWeights | nil / 선택적 데이터 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 읽기 | action 없으면 정보 표시 |
| 펼치기 | onExpand가 있으면 전체 Button |
| 문구 | 보조가 있으면 설명 1줄, 없으면 2줄 |

현재 실제 공용 타입은 SystemParityComponents다. 개인 취향 분석 카드의 별도 구성과 구분한다.

### TasteGraph

- [ios/TasteBuddy/Components/TasteRadarView.swift:95](../../ios/TasteBuddy/Components/TasteRadarView.swift#L95) · `struct HexRadarChart:`
- [ios/TasteBuddy/Components/TasteRadarView.swift:50](../../ios/TasteBuddy/Components/TasteRadarView.swift#L50) · `enum TasteRadarContract`

규격: Canvas 비율 320:310 · 기준 중심 160/145·최대 반경 100 · grid 25/50/75/100%

| 속성 | 기본값 또는 계약 |
| --- | --- |
| entries / profile | 0…100 score 초기화 |
| reportedValues / maximum / referenceValues | 별도 실제 보고값 초기화 |
| shouldAnimate | 기본 true |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 score | 없는 축은 50으로 normalized |
| reportedValues 결측 | 기록 없음으로 읽고 0과 구분 |
| 0 | 실제 0 값 보존 |

기본 score와 reportedValues는 결측 계약이 다르다. 접근성 요약은 여섯 축의 값·척도·기준을 읽는다.

### TextareaField

- [ios/TasteBuddy/Features/Dining/DiningView.swift:1922](../../ios/TasteBuddy/Features/Dining/DiningView.swift#L1922) · `TextEditor(text: $reflectionNote)`

규격: 최소 높이 156pt·반경 20·패딩 10pt · Regular 13 · surface·border

| 속성 | 기본값 또는 계약 |
| --- | --- |
| reflectionNote | 화면 소유 Binding<String> |
| 선택 사항 | 메모를 입력하지 않아도 진행 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본·입력 | TextEditor가 편집 |
| 완료·취소 | 별도 하단 CTA와 방문 이력 처리 |

독립 TextareaField 타입과 공통 label/hint/error/resize API는 없다. 회고 편집의 다른 TextEditor는 최소 180pt다.

### SelectField

`ios/TasteBuddy/Components/NativeInputComponents.swift`의 `TBSelectField`는 현재 값을 표시하고 선택창을 연다. 프로필 네 항목이 같은 필드를 사용한다. 날짜는 적용할 때, 성별·흡연·식이제한은 프로필 초안에 반영하며 전체 저장은 화면이 담당한다.

### SegmentedControl

- [ios/TasteBuddy/Components/TasteDetailPage.swift:130](../../ios/TasteBuddy/Components/TasteDetailPage.swift#L130) · `struct TasteDetailSectionPicker:`
- [ios/TasteBuddy/Components/SystemParityComponents.swift:4](../../ios/TasteBuddy/Components/SystemParityComponents.swift#L4) · `struct TBCapsuleTabs<`

규격: 표면 높이 32pt·터치 최소 44pt · 좌우 14·gap 8pt · 글자 13pt·선택 Bold / 기본 Medium

| 속성 | 기본값 또는 계약 |
| --- | --- |
| selection | Binding<TasteDetailSection> |
| overviewTitle / evidenceTitle | ‘요약’ / ‘기록’ |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 글자 | Capsule tabs |
| 접근성 글자 크기 | OS menu Picker, 최소 44pt·좌우 20·하단 12 |

선택 탭은 흰 표면·1pt 경계를 사용한다. matchedGeometryEffect와 feedback 모션을 적용한다.

### PeriodPicker

- [ios/TasteBuddy/Components/TasteDetailPage.swift:185](../../ios/TasteBuddy/Components/TasteDetailPage.swift#L185) · `struct TasteDetailPeriodPicker:`
- [ios/TasteBuddy/Components/TasteDetailPage.swift:153](../../ios/TasteBuddy/Components/TasteDetailPage.swift#L153) · `enum TasteDetailPeriod:`

규격: 1개월 / 3개월 / 6개월 / 1년 / 전체 · 표면 32·터치 44pt · gap 8pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| selection / axis | Binding<TasteDetailPeriod> / nil |

| 상태 | 실제 표현·책임 |
| --- | --- |
| axis 있음 | 해당 미각 tint 팔레트 |
| 큰 글자 | OS menu Picker로 전환 |

range는 기준일 다음 날 0시를 end로 잡고 월 단위로 start를 계산한다. 같은 기간의 원자료 재집계는 화면 책임이다.

### TextAction

- [ios/TasteBuddy/Components/TBComponents.swift:163](../../ios/TasteBuddy/Components/TBComponents.swift#L163) · `struct AuthTextActionButton:`

규격: 높이 28pt · 좌우 8·상하 4pt · SemiBold 12 · textFaint(검정 40%)

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / action | 필수 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | .plain 버튼, 밑줄 없음 |

일반 링크·재시도·모든 보조 행동의 공용 타입이 아니라 인증 텍스트 행동 타입이다. 최소 44pt 영역을 내장하지 않는다.

### IconActionButton · RecordActions · SocialActions

2026-10-04에 실제 제품의 저장·북마크와 좋아요·댓글·공유를 `Components/IconActionButton.swift`로 공통화했다. 세 타입은 `Features/Home/HomeView.swift`, `Features/Restaurant/RestaurantDetailRouteView.swift`, `Components/TBComponents.swift`의 제품 사용처에 연결돼 있다. 최신 속성·상태는 `src/plating/nativeComponentAudit.ts`를 확인한다.

기본·활성·비활성·숫자 없음 표본 총 11개를 실제 SwiftUI로 렌더했다. 기존 감사 당시의 작은 북마크 표본은 새 타입의 증거로 재사용하지 않는다.

### NotificationBadge

- [ios/TasteBuddy/Components/Shell/AppChromeComponents.swift:850](../../ios/TasteBuddy/Components/Shell/AppChromeComponents.swift#L850) · `private struct TopAppBarIconButton:`

규격: sweet mainColor의 점 6×6pt · topTrailing · offset x −2 / y 2pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| showsDot / hasUnreadNotifications | false / false |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 새 알림 | 6pt 점 표시 |
| 읽음 | 점 없음 |

독립 NotificationBadge 타입과 count·max·99+ API는 없다. 알림 버튼의 접근성 이름은 ‘알림’이며 점 자체의 추가 안내는 없다.

### ContentSkeleton

- [ios/TasteBuddy/Components/TBComponents.swift:180](../../ios/TasteBuddy/Components/TBComponents.swift#L180) · `struct TBSkeletonBlock:`

규격: 반경 기본 12pt·크기는 부모가 지정 · disabledSurface·정적 흰 gradient

| 속성 | 기본값 또는 계약 |
| --- | --- |
| cornerRadius | TBRadius.row = 12 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 정적 gradient, 내장 shimmer 없음 |

실제 레이아웃 placeholder다. 회전·shimmer·동작 줄이기 분기를 내장하지 않는다.

### ImageBox

- [ios/TasteBuddy/Components/SystemCoreComponents.swift:142](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L142) · `struct ImageBox:`
- [ios/TasteBuddy/Components/SystemCoreComponents.swift:132](../../ios/TasteBuddy/Components/SystemCoreComponents.swift#L132) · `enum ImageBoxMetrics`

규격: 반경 8pt · size small/medium/large는 TokenBox 치수 · 부모 비율은 별도 지정

| 속성 | 기본값 또는 계약 |
| --- | --- |
| alt / imageName / imageURL | alt 필수 / nil / nil |
| size / variant / contentMode | .medium / .neutral / .fill |
| kind / fallback | chef·menu·restaurant / 선택적 fallback |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 로컬 원본 | BundledPNG |
| 요청 중 | fallback opacity 0.72 |
| 원본 없음·실패 | 역할별 fallback |

aspect 16:9나 1:1을 내장하지 않는다. 접근성 이름은 alt이며 .chef는 번들 이미지를 resolver로 찾는다.

### Disclosure

- [ios/TasteBuddy/Components/TasteDetailPage.swift:316](../../ios/TasteBuddy/Components/TasteDetailPage.swift#L316) · `struct TasteDetailDisclosure<`

규격: 제목 Medium 12·최소 44pt · 본문 Regular 12·textSecondary · 위·요소 간격 8pt

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / content | ‘세부 정보’ / ViewBuilder |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 접힘·펼침 | OS DisclosureGroup의 내부 상태 |
| 긴 본문 | 세로 fixedSize로 줄바꿈 |

공통 타입은 외부 expanded Binding이나 callback을 제공하지 않는다. disclosure 화살표와 전환은 시스템이 담당한다.

### ScopeLabel

- [ios/TasteBuddy/Components/TasteDetailPage.swift:307](../../ios/TasteBuddy/Components/TasteDetailPage.swift#L307) · `struct TasteDetailScope:`

규격: Regular 11pt · textSecondary #3F3F3F · 세로 줄바꿈

| 속성 | 기본값 또는 계약 |
| --- | --- |
| text | 필수 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 기본 | 기간·출처·척도를 전달한 그대로 표시 |

단순 Text이며 tone·근거 판정·날짜 계산을 내장하지 않는다. 의미는 데이터와 호출부가 제공한다.

### ChipGroup

- [ios/TasteBuddy/Components/NativeLayoutComponents.swift:5](../../ios/TasteBuddy/Components/NativeLayoutComponents.swift#L5) · `struct TBWrapLayout:`
- [ios/TasteBuddy/Components/NativeLayoutComponents.swift:81](../../ios/TasteBuddy/Components/NativeLayoutComponents.swift#L81) · `struct TBOverflowTagRow<`

규격: Wrap spacing은 필수·자연 너비 측정 / Overflow spacing 기본 6pt·+N 실제 너비 포함

| 속성 | 기본값 또는 계약 |
| --- | --- |
| items / tag / overflow | 호출부가 콘텐츠 제공 |
| spacing | Wrap 필수 / Overflow 6 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| Wrap | 줄바꿈, 각 행의 최대 높이 사용 |
| Overflow | 최장 prefix + 남은 개수, 원래 순서 보존 |

Layout은 칩 외형·접근성·전체 보기 버튼을 제공하지 않는다. +N 탭의 확장·접기는 호출부의 책임이다.

### FlowLoadingState

- [ios/TasteBuddy/Components/NativeLayoutComponents.swift:119](../../ios/TasteBuddy/Components/NativeLayoutComponents.swift#L119) · `struct TBFlowLoadingState:`

규격: 시스템 ProgressView + SemiBold 14·textBody 안내 · gap 16pt · 전체 영역 가운데

| 속성 | 기본값 또는 계약 |
| --- | --- |
| message / background | 필수 / TBColor.focus |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 로딩 | 정량 값 없이 spinner·문구 |

children를 합쳐 읽는다. 회전은 OS ProgressView가 담당하고 공통 타입에 직접 reduceMotion 분기를 넣지 않았다.

### FlowRetryState

- [ios/TasteBuddy/Components/NativeLayoutComponents.swift:136](../../ios/TasteBuddy/Components/NativeLayoutComponents.swift#L136) · `struct TBFlowRetryState:`

규격: SectionHeading + PrimaryButton 48pt · 간격 20pt · tbPageContentPadding

| 속성 | 기본값 또는 계약 |
| --- | --- |
| title / message / retry | 필수 |
| retryTitle / background | ‘다시 시도’ / focus |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 실패 | 제목·이유·다시 시도 action |

retry callback만 실행한다. 내장 busy·재시도 횟수·중복 요청 차단은 없으며 화면이 로딩 상태로 전환해야 한다.

### Flow step pattern (2026-10-10)

- [OnboardingView.swift](../../ios/TasteBuddy/Features/Onboarding/OnboardingView.swift) · `TBStepIndicator`와 `PrimaryButton` 직접 조합
- [CalibrationFlowView.swift](../../ios/TasteBuddy/Features/Calibration/CalibrationFlowView.swift) · 단계별 표시 조건·보조 행동 유지
- [TBComponents.swift](../../ios/TasteBuddy/Components/TBComponents.swift) · `FlowBottomCtaMetrics` 배치 값

규격: 높이 140pt · 좌우 20·하단 12pt · 주요 버튼 48pt · 단계 표시 아래 32pt.

화면이 현재 단계와 전체 단계 수, 다음 행동, 입력 조건과 저장 상태를 전달한다. 필요할 때 보조 버튼과 안내 문구를 직접 조합하며, 화면이 배치·키보드·safe area를 담당한다. 별도 단계 CTA 컴포넌트는 없다.

기본·보조 행동·비활성 조합은 [Plating 패턴 페이지](http://127.0.0.1:3001/design-system/patterns/flow-step)와 [Figma Patterns](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1282-5137)에서 확인한다. 이 조합 변경은 기기나 실계정 저장 검증을 의미하지 않는다.

### DateField

- [ios/TasteBuddy/Features/Home/FoodMemoryViews.swift:314](../../ios/TasteBuddy/Features/Home/FoodMemoryViews.swift#L314) · `DatePicker(source == .confirmed`

규격: OS 날짜 DatePicker · confirmed 식사일 / approximate 기간 시작·끝 · 글자 Regular 14 사용처

| 속성 | 기본값 또는 계약 |
| --- | --- |
| value | Binding<DiningMealTime?> |
| 기간 끝 범위 | 시작일 이후만 선택 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| confirmed | 식사일 1개 |
| approximate | 시작·끝 |
| 다른 출처 | 날짜 필드 숨김, 출처 유지 |

식사일과 저장 시각을 구분한다. 기본 날짜 스타일과 높이는 OS에 맡기며 독립 44pt DateField가 아니다.

### WheelDatePicker

- [ios/TasteBuddy/Components/Shell/AppShellView.swift:2679](../../ios/TasteBuddy/Components/Shell/AppShellView.swift#L2679) · `ProfileEditPickerOverlay`

규격: 카드 패딩 20pt · 반경 24pt · 닫기 영역 36pt · 제목 Bold 16 · 휠 아래 간격 16pt · 적용 버튼 48pt. 휠 외형은 OS와 언어 설정을 따른다.

| 속성 | 기본값 또는 계약 |
| --- | --- |
| selection | Binding<Date> = birthDateSelection · 선택창 임시값 |
| in / displayedComponents | 1940-01-01 ... 오늘 기준 12년 전 / .date |
| 적용 | identity.birthDate에 반영하고 닫기 |
| 닫기 / 배경 탭 | 적용하지 않고 닫기 |

| 상태 | 실제 표현·책임 |
| --- | --- |
| 선택 중 | birthDateSelection만 변경 |
| 적용 | 프로필 초안에 날짜 반영 |
| 말일·윤년 | OS DatePicker가 처리 |

시스템 DatePicker(.wheel)를 제목·닫기·적용과 조합한다. 전체 계정 저장은 프로필 저장 버튼이 담당한다. 별도 직접 입력 전환과 취소 버튼은 없다. 현재 SwiftUI 소스와 사용자 제공 2026-10-04 23:27 iOS 26.5 한국어 화면을 함께 대조했다. 캡처의 기본 선택은 1995년 1월 1일이며, 선택창 크기는 362 × 368pt다. Figma·웹 예제의 캡슐과 곡면 행을 수정했다. 원본 화면을 잘라 웹 문서에 수록했으며 새 네이티브 실행·저장 검증은 수행하지 않았다.

## 검증 범위

51개 계열 모두 선언·사용처와 연결하고 각 anchor의 존재를 확인했다. 소스만으로 OS 외형, 모션의 체감, VoiceOver, 실제 저장·복귀 여정을 검증했다고 표시하지 않는다. Native 스냅샷과 빌드 결과는 같은 증거 폴더에서 별도로 확인한다.
