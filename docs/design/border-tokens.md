# 보더 토큰

2026-10-10 · Figma / React / SwiftUI · 10월 9일 시작 조사

[Figma 경계 토큰 가이드](https://www.figma.com/design/HHwQ9suI1czmYEwCQ6wW1W?node-id=1436-480)

컴포넌트 이름이 아니라 경계의 강도·상태·배경 조건으로 선택한다. 일반 UI 경계는 불투명 색상이며, 컴포넌트에서 별도 opacity를 더하지 않는다. 선의 두께·반경·표시 조건은 각 컴포넌트가 소유한다.

## 사용처 조사

`src`와 `ios/TasteBuddy`의 선언·호출을 검색해 웹 210개 파일의 후보 1,538개, 네이티브 34개 파일의 후보 252개를 분류했다. 후보에는 반경·SVG·그래프·주석도 포함되므로 UI 보더 개수와 같지 않다. Figma Components에서는 아이콘·차트·아바타를 제외한 원본의 경계 레이어 273개를 확인했고, Assets에는 같은 조건의 추가 경계 원본이 없었다.

원시 조사와 변경 전 소스는 `output/border-token-system-20261009/`에 있다. 이 조사는 데이터·백엔드 로직을 변경하지 않는다.

| 사용처 | 경계 역할 | 주요 구현 |
| --- | --- | --- |
| 일반 카드·약한 외곽 | neutral `faint` / `default` | SectionCard, TasteMeasurementMiniCta, ExpandableCard, ProfileCard |
| 구분선·리스트·Disclosure | neutral `subtle` / `default` | HomeCards, DishFeedbackCard, Accordion, Separator |
| 입력창·선택 필드 | `default` → `focus` / `destructive` / `disabled` | TBTextInput, TBSelectField, TextareaField, form-field.css |
| 선택 카드·라디오·체크박스 | `selected`, `disabled` | SelectionCard, TBSelectionCard, Figma Input controls |
| 인라인 액션의 포커스 | neutral `focus` | InlineButton |
| 채워진 중립색 칩 | neutral `onMuted` | TasteChip, ChipStyle, ChipSurface |
| 미각 칩·선택된 기간/캡슐 탭 | taste `default` | TasteChip, CapsuleTabs, PeriodPicker |
| 미각 배경 카드·추천 카드 | taste `default` | TasteTintCard, RecommendationMiniCardLayout, HomeView의 추천·셰프 카드, TasteMatchFeed |
| 선택·추천 미각 칩과 선택 버블 | taste `strong` | ChipControl, TBSelectableChip, DiningFeedbackFlow, DiningView |
| 미각 아웃라인 | taste `accent` | ChipStyle의 outline |
| 성공·주의 상태 칩 | `success`, `successSoft`, `warning`, `warningSoft` | ChipSurface, ChipStyle |

## 중립색과 상태

기존 중립색 값은 유지한다. Light의 subtle/default/strong이 서로 가까운 기존 설정도 이번 토큰 통합으로 임의 확대하지 않는다. 같은 색이라도 상태와 배경 조건이 다르면 별도 역할을 유지한다.

| Figma 역할 | Light | Dark | 선택 기준 |
| --- | --- | --- | --- |
| `color/border/faint` | #F0F0F0 | #303030 | 아주 약한 구조적 경계 |
| `color/border/subtle` | #E8E8E8 | #333333 | 조용한 구분선 |
| `color/border/default` | #E7E7E7 | #3B3B3B | 일반 컨트롤 경계 |
| `color/border/strong` | #E5E5E5 | #808080 | 기존 강한 중립 경계 |
| `color/border/onMuted` | #E5E5E5 | #484848 | 채워진 중립색·raised 표면의 경계 |
| `color/border/disabled` | #E0E0E0 | #303030 | 비활성 상태 |
| `color/border/focus` | #3F3F3F | #DEDEDE | 포커스·열린 필드 |
| `color/border/selected` | #0F0F0F | #F5F5F5 | 선택 상태 |
| `color/border/destructive` | #D4183D | #F78298 | 오류·유효하지 않은 입력 |

상태 경계는 기존 interaction/feedback 의미를 alias로 참조한다. 성공·주의 경계도 같은 feedback 색상을 재사용한다. 투명한 텍스트 전용 칩처럼 경계 자체가 없는 상태에는 선을 추가하지 않는다.

## 미각색

6개 미각 모두 같은 규칙을 사용한다. `tint/N`의 N은 기준색 비율이다. Light는 #FFFFFF, Dark는 #1C1C1C를 섞는다.

| Figma 역할 | Light | Dark | 사용 |
| --- | --- | --- | --- |
| `taste/{taste}/border/subtle` | tint/80 | tint/70 | 기본 표면 위 약한 경계 |
| `taste/{taste}/border/default` | tint/70 | tint/60 | tintSurface 위 카드·칩·탭 경계 |
| `taste/{taste}/border/strong` | tint/60 | tint/50 | 선택·추천을 구별하는 경계 |
| `taste/{taste}/border/accent` | main | main | 강조색 아웃라인 |

선택 칩의 이전 `main.opacity(0.28)`는 이미 착색된 표면 위에 겹쳐졌다. 새 strong 단계는 그 합성 결과에 가까운 기존 불투명 단계를 사용한다. 색뿐 아니라 선택 배경·문구·체크 표시도 유지한다.

## 적용과 호환

```tsx
borderColor: getTasteBorder(tasteLabel, 'default')
// 또는 UI 팔레트의 borderDefault / borderSubtle / borderStrong / borderAccent
borderColor: BORDER_TOKENS.focus
```

```swift
.stroke(axis.borderDefaultColor)
// 선택 상태
.stroke(axis.borderStrongColor)
// 입력 상태
TBColor.borderFocus
```

- 웹 CSS: `--tb-taste-{taste}-border-{level}`, `--tb-color-border-{role}`.
- `cardBorder`는 `borderDefault`로 이전했다. Figma 변수 ID를 보존해 기존 인스턴스 연결도 유지한다.
- `chipBorder`와 `chip/neutral/border`의 Figma 변수는 `border/subtle`, `color/border/onMuted`로 이름을 바꿨다.
- 2026-10-12부터 칩의 채움이 80/70으로 통일되어 실제 컴포넌트 경계와 CSS/Swift의 chipBorder 호환 접근자는 `border/default`에 연결한다. 위 `border/subtle` 이름은 변수 이전 이력이며 현재 칩의 경계 규칙이 아니다. 새 컴포넌트는 공통 이름을 사용한다.
- 중립색 `borderCard` / `--tb-color-border-card`는 `borderFaint` / `--tb-color-border-faint`의 이전 저장 형식으로 유지한다. 현재 UI 호출은 공통 이름을 사용한다.
- `tintSoftBorder`의 80/80 값은 기존 그래프·시각화 호환용으로 남긴다. Figma에서는 보더 속성 선택 목록에서 숨기고, 일반 UI 선은 새 역할에 연결했다.

## 적용하지 않는 선

그래프 선·레이더·측정 트랙은 값과 상태를 표현하는 시각화 역할이다. 사진 위 분리선, 아바타의 광학 테두리, 유리의 반사광은 바탕 영상과 합성되는 재질 효과다. Figma의 기존 avatar 경계 변수 두 개는 `material/edge/default`·`material/edge/subtle`로 이름을 정리하고 alpha와 기존 코드 접근자는 보존한다. 이 선들은 일반 UI 보더 단계로 강제 변환하지 않는다. 호출자가 제공하는 사용자 미각·미디어 색상도 원본 의미를 보존한다.

## 검증 범위

Figma 변수 alias·범위·코드 문법과 원본/사용 예시의 바인딩, Light/Dark 렌더링을 확인한다. 웹은 두 모드의 실제 CSS 해석 값과 컴포넌트 렌더링, 생성 CSS/Swift 일치 검사를 사용한다. 네이티브 컴파일 결과는 별도 로그로 기록하며 기기 실행이나 프로덕션 데이터 검증으로 해석하지 않는다.

2026-10-12 공통 옅은 채움: 카드·톤 버튼·태그·선택 탭은 Light tint/80 · Dark tint/70이다. 경계가 있는 칩·탭·카드는 같은 색에 묻히지 않도록 border/default(70/60)를 사용한다. 선택·추천은 border/strong(60/50), 강조 아웃라인은 main을 사용한다. 기존 chipBorder 접근자도 default로 연결하며 tintSoftBorder는 시각화 호환용으로 유지한다.

2026-10-26 레이더 가이드라인: 사용자 요청에 따라 값 자체를 표현하지 않는 육각형 격자·방사형 구조선의 `data-viz/radar/renderedGridColor`만 기존 `color/border/strong`을 참조한다. 데이터 윤곽선·그라데이션·노드·측정 트랙은 기존 시각화 역할을 유지한다.
