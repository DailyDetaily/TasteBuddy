# Taste Buddy Native Design System

이 문서는 현재 SwiftUI 제품의 디자인 시스템 진입점이다. 제품 방향은 [제품 경험 지침](../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)과 [DESIGN.md](../DESIGN.md)를 우선한다. 네이티브 컴포넌트의 현재 값과 사용법은 이 문서와 실제 Swift 구현을 함께 확인한다.

차분하고 정제된 분위기, Pretendard, 미각 6색의 의미, 기존 정보 구조를 유지한다. 웹 구현과 네이티브 구현은 서로 import하지 않는다. 예약과 Tastick 연결은 현재 네이티브 제품 범위 밖이다.

## 기준 파일과 프리뷰

| 목적 | 파일 또는 진입점 |
| --- | --- |
| 색상·여백·글자 역할 | `TasteBuddy/DesignSystem/TBTheme.swift` |
| 미각 팔레트 | `TasteBuddy/Models/TasteModels.swift`의 `TasteAxis` |
| 버튼·카드·선택 카드 | `TasteBuddy/Components/TBComponents.swift` |
| 시트·아이콘 버튼·빈 상태 | `TasteBuddy/Components/SystemCoreComponents.swift` |
| 칩·해석 카드·상세 보기 | `TasteBuddy/Components/SystemParityComponents.swift` |
| 실제 입력·선택형 칩 | `TasteBuddy/Components/NativeInputComponents.swift` |
| 줄바꿈·넘침 태그·설문 상태 | `TasteBuddy/Components/NativeLayoutComponents.swift` |
| 토스트 생명주기 | `TasteBuddy/Components/NativeFeedbackComponents.swift` |
| 네이티브 타입·파일·사용 상태 등록부 | `NativeProductComponentCatalog` in `TasteBuddy/Components/DesignSystemFullComponents.swift` |
| 전체 카탈로그 | `--design-system-preview` → `DesignSystemPreviewView` |
| 실제 상태와 글자 확대 확인 | `--native-design-states-preview` → `NativeDesignStatesPreview` |

카탈로그의 **제품 사용** 항목은 실제 화면에서 재사용한다. **시각 참고**의 `TBUIInput`, `TBUITextarea`는 편집 기능이 없는 정적 견본이다. `TBUIButton`은 action을 받는 버튼이지만 현재 카탈로그의 웹 variant 참고용으로 사용한다. 제품 입력에는 `TBTextInput`, 주요 액션에는 `PrimaryButton`을 사용한다. **이식 참고**와 **현재 제품 범위 밖**은 별도로 표시한다.

기존 `NativeDesignSystemInventory`의 7개 그룹·59개 컴포넌트·52개 파일 프리뷰·30개 스타일·20개 primitive 수치는 웹 카탈로그 이식 이력이다. 제품에서 실제 사용 중이라는 뜻이나 모든 상태의 검증 완료를 뜻하지 않는다. 네이티브 등록부는 이 계약과 독립적으로 관리하며, 재사용 판단에 필요한 주요 부품을 추적한다.

## 글자와 색상

`TBFont`는 Pretendard의 기존 기본 크기를 유지한다. 기본 크기 상한은 18pt이며 Dynamic Type에 따른 실제 표시 크기를 18pt로 강제 제한하지 않는다. 제목과 본문을 새로 작성할 때는 아래 `TBTextStyle`과 `.tbTextStyle(...)`을 우선 사용한다. 긴 문장의 줄 수 제한은 글자 역할이 아닌 컴포넌트에서 정한다.

| 역할 | 기본 크기·굵기 | 색상 | 추가 행간 |
| --- | --- | --- | --- |
| `sectionTitle` | 18pt bold | `textPrimary` | 0 |
| `subsectionTitle` | 16pt bold | `textPrimary` | 0 |
| `sheetTitle` | 15pt bold | `textPrimary` | 0 |
| `body` | 14pt regular | `textBody` | 4pt |
| `caption` | 12pt semibold | `textBody` | 3pt |
| `detailAction` | 11pt medium | `textAction` | 0 |

이 역할은 기존 화면 전체의 글자를 일괄 변환하는 지시가 아니다. 13pt 본문이나 10pt 메타처럼 컴포넌트에 의미가 있는 기존 변형은 보존하고 해당 부품에서 문서화한다.

- `textAction`은 현재 `textBody`(`#666666`)를 재사용하는 활성 보조 액션의 의미 토큰이다. 누를 수 있는 상세 보기·펼치기에 `textDisabled`를 사용하지 않는다.
- `textDisabled`는 실제 비활성 표현에 사용한다. 기존 비선택 탭·진행 표시의 가독성은 별도 검토 대상으로, 이 정리에서 일괄 변경하지 않았다.
- 미각 `mainColor`는 아이콘·차트 노드·숫자 시그널의 원색이다. 작은 라벨이나 음식명처럼 읽어야 하는 미각 텍스트에는 기존 `tintTextColor`(팔레트 `tintSurfaceText`)를 사용한다. 장문의 일반 본문은 중립색을 사용한다.
- `TasteChip`의 **라벨 전용** 미각형은 `tintSoft` 배경과 읽기용 `tintSurfaceText` 라벨을 사용한다. **숫자형**은 중립 라벨과 `mainColor` 값, **중립형**은 중립 팔레트라는 의도된 변형을 유지한다. 미각 6색 값은 변경하지 않는다.
- 셰프 가이드 카드는 두 줄 안에서 의미가 완결되는 `chefTranslationSummary`를 사용한다. 긴 `chefTranslationCopy`는 상세 설명에서 유지한다. 글자 축소로 긴 문장을 밀어 넣지 않는다.

## 치수와 배치

| 항목 | 현재 네이티브 계약 |
| --- | --- |
| 페이지·섹션 | gutter 20pt, section gap 20pt |
| 기본 카드 | 내부 여백 12pt, radius 20pt |
| 기본 버튼 | 최소 높이 48pt, radius 10pt |
| compact 버튼 | 최소 높이 40pt, 12pt semibold |
| 상단 바 | `TBSize.topAppBarHeight`는 **내용 행 32pt**. 위·아래 8pt씩을 더한 바 자체는 48pt이며, 상태 영역·safe area는 셸이 별도로 반영 |
| 바텀시트 고정 stage | `max(0, screenHeight × 0.98 − safeAreaTop − 12)` |
| 바텀시트 자동 stage | `.auto(maxHeightRatio:)`의 상한은 `screenHeight × ratio`; 고정 stage 공식과 구분 |
| 바텀시트 상단 | 상단 radius 32pt, grabber 36×5pt, grabber 위 여백 5pt |
| 바텀시트 header | 좌우 20pt, 위 20pt, 아래 12pt, 양쪽 slot 32pt |
| 바텀시트 footer | 기본 좌우 20pt·위 16pt, 아래 `max(12, safeAreaBottom)`; 키보드·보조 액션에 명시적 override 허용 |

이전 이식 문서의 `95vh`, `40×6` grabber, `40pt` header slot은 과거 기준이다. 현재 값으로 되돌리기 지시로 해석하지 않는다. 시트 높이는 목적에 따라 다르다. 인증 이메일은 최대 0.72 비율의 자동 stage를 사용하고, 분석 인사이트는 기존 큰 native detent와 `.auto(maxHeightRatio: 1)`를 유지하면서 제목·닫기·grabber만 공용 셸을 사용한다.

`TBWrapLayout`은 각 subview를 실제로 측정해 자연스러운 폭으로 줄바꿈한다. `TBFlowLayout`은 균등한 adaptive grid가 필요한 기존 배치에 유지한다. 이름이 비슷하다는 이유로 서로 바꾸지 않는다.

`TBOverflowTagRow`는 원래 순서의 가장 긴 prefix와 남은 수 `+N`이 함께 들어가는 조합을 선택한다. `+N`의 실제 렌더 폭까지 계산하므로 별도의 `UIFont` 측정이나 고정 높이로 행을 자르지 않는다. 표시용 칩 크기와 접근성 설명은 호출부가 제공한다.

## 입력·선택·버튼

- `TBTextInput`: `Binding<String>`을 갖는 실제 입력이다. `.dining`은 기존 44pt 최소 높이·13pt semibold, `.auth`는 48pt 최소 높이·14pt regular를 보존한다. 라벨·별도 접근성 이름·도움말·오류·포커스·실제 비활성을 공유한다.
- 검증·제출·키보드 종류·submit label·데이터 저장은 화면이 소유한다. 인증 성공·오류 상태 메시지를 입력 안으로 강제로 옮기지 않는다. 모든 기존 폼을 새 입력으로 변경한 것은 아니다.
- `TBSelectableChip`: `.dining`과 `.correction`의 기존 배경·높이 변형을 유지한다. 실제 Button, 선택 접근성 trait, 비활성 처리, `TBTokenButtonStyle` 눌림 반응을 공유한다.
- `PrimaryButton`: 기본 중립 액션과 `.tasteTint(TasteAxis)`를 제공한다. 미각 측정 compact CTA는 40pt 높이와 미각 tint를 유지하며 공용 눌림·비활성·Reduce Motion 규칙을 사용한다.
- 실제 비활성은 `isEnabled: false` 또는 상위 `.disabled(true)`로 동작까지 막는다. 기존 `visualDisabled`는 기존 플로우의 시각 표현 계약이며 실제 비활성과 혼동하지 않는다.

## 상태와 토스트

`TBFlowLoadingState`와 `TBFlowRetryState`는 미각 설문과 사전조사에서 사용한다. 재시도 동작은 해당 화면 모델에 전달하며, 컴포넌트가 네트워크 요청을 시작하거나 문구를 결정하지 않는다. 빈 상태는 기존 `EmptyState`를 우선 사용한다. 새 화면에서는 상태별로 이유와 가능한 다음 행동을 함께 설계한다.

`ToastSurface`는 외형을, `TBToastPresenter`는 표시·교체·취소·만료를 담당한다. 토스트 문구, 삭제된 메뉴 복원 데이터, 시트 닫기 동작은 화면이 소유한다.

| `TBToastPolicy` | 표시 시간 | 만료 시 화면 동작 |
| --- | --- | --- |
| `.copyConfirmation` | 3.5초 | 복사 완료 표시 종료 |
| `.undo` | 3.5초 | 해당 삭제의 되돌리기 상태 만료. 되돌리기를 누르면 먼저 취소 후 복원 |
| `.bookmarkSheetClose` | 0.7초 | 저장 완료 표시 후 해당 북마크 시트 닫기 |

새 `present(policy:onDismiss:)`는 이전 타이머와 callback을 교체한다. `dismiss()`와 정상 만료는 현재 callback을 한 번만 실행한다. `cancel()`은 callback을 실행하지 않으며 호스트 `onDisappear`에서 호출한다. 따라서 사라진 북마크 시트의 오래된 타이머가 뒤늦게 다른 화면을 닫지 않는다. Dining의 되돌리기 데이터와 저장 동작은 presenter로 옮기지 않는다.

## 변경과 검증 규칙

1. 새 공용 패턴은 실제로 반복되는 역할과 상태를 먼저 확인한다. 크기나 모습이 비슷하다는 이유만으로 합치지 않는다.
2. 기존 부품의 variant로 해결되는 경우 새로운 부품을 만들지 않는다. 새 의미 토큰·variant는 이름, 사용 위치, 기본값을 기록한다.
3. `NativeProductComponentCatalog`에 Swift 타입, 파일, 사용 상태를 기록하고 실제 상태의 `#Preview` 또는 카탈로그 예시를 제공한다. 정적 견본을 제품 상태 검증으로 세지 않는다.
4. 네이티브 변경은 iOS build와 관련 unit tests, 변경 화면의 simulator 확인을 수행한다. 문서만 바뀐 경우 build는 생략할 수 있다. 웹 소스가 바뀌지 않았다면 웹 build를 네이티브 검증으로 대신하지 않는다.
5. 글자 확대·VoiceOver·터치 영역·Reduce Motion은 확인한 범위만 완료로 기록한다. 글자 확대 프리뷰가 있다는 이유로 앱 전체 접근성 검증 완료로 선언하지 않는다.

2026-09-03 정리에서 추가된 상태 프리뷰는 실제 부품의 입력·포커스·선택·오류·비활성·로딩·재시도·빈 상태·토스트를 확인하기 위한 fixture다. 전 화면의 큰 글자/VoiceOver, 중앙 추가 버튼의 모든 애니메이션 프레임, 비선택 탭·진행 표시의 대비는 별도 확인 대상이다.

현재 홈 추천 상태는 주입된 fixture 상태이며 실제 다시 불러오기 API가 없다. 동작하지 않는 재시도 버튼을 추가하지 않았고, 복구 API가 마련되면 기존 EmptyState 액션에 연결한다. 다이닝의 디시 종류 직접 입력 추가 버튼도 기존에 빈 action이며, 상세 태그 입력과 다른 데이터 계약이 필요하므로 이 디자인 정리에서 새 입력 기능을 만들지 않았다.
