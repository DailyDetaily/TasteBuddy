# Taste Buddy SwiftUI Native Migration Guide

이 문서는 현재 React/Vite 기반 Taste Buddy 웹앱을 독립적인 SwiftUI 네이티브 iOS 앱으로 재구현하기 위한 실행 가이드다.

목표는 화면을 비슷하게 다시 그리거나 새로운 iOS 스타일로 재디자인하는 것이 아니다. React 웹앱의 레이아웃, UI 디자인, 정보 위계, 컴포넌트 구조, 상태, 카피, 상호작용, 데이터 계약을 기준으로 동일한 제품 화면을 만들고, 내부 구현만 SwiftUI의 상태 관리·탐색·presentation 방식으로 옮기는 것이다.

진행 상태는 [`PARITY_MATRIX.md`](./PARITY_MATRIX.md)에 기록한다. 이 문서는 "어떤 순서와 구조로 구현할지"를 설명하고, [`BACKEND_INTEGRATION_PLAN.md`](./BACKEND_INTEGRATION_PLAN.md)는 Supabase, PostgreSQL, RLS, Edge Functions, Cloudflare R2와 iOS 동기화를 설명한다. parity matrix는 "무엇이 실제로 완료됐는지"를 판정한다.

React 컴포넌트를 SwiftUI로 옮기는 순서와 실제 TSX 사용 그래프는 [`REACT_COMPONENT_PORTING_REGISTER.md`](./REACT_COMPONENT_PORTING_REGISTER.md)를 기준으로 관리한다. 화면 구현은 가능한 한 이 등록표의 컴포넌트를 먼저 이식하고, 그 컴포넌트들로 화면을 조립하는 방식으로 진행한다.

## 1. 재구현 원칙

### 1.1 제품 원칙

- Taste Buddy는 일반 예약 앱이 아니라 premium dining personalization 서비스다.
- raw taste data보다 해석과 다음 행동을 먼저 보여준다.
- 핵심 가치는 사용자의 취향을 셰프가 활용할 수 있는 언어로 번역하는 것이다.
- 프로필은 완료 여부가 아니라 점진적으로 높아지는 confidence로 표현한다.
- 하드웨어는 optional precision layer다.
- 셰프 가이드는 명령이 아니라 respectful하고 operationally realistic한 참고 정보여야 한다.

### 1.2 구현 원칙

- React 컴포넌트를 Swift 문법으로 줄 단위 번역하지 않는다.
- WebView를 최종 화면 구현으로 사용하지 않는다.
- 웹앱의 도메인 모델과 API 계약뿐 아니라 visible layout과 design hierarchy도 유지한다. 화면 상태와 탐색의 내부 구현만 SwiftUI 방식으로 구성한다.
- 한 기능을 기본·로딩·빈 상태·오류·상세 상태까지 완성한 뒤 다음 기능으로 이동한다.
- 공용 토큰과 컴포넌트를 먼저 만든 후 feature 화면을 조립한다.
- 웹과 iOS는 독립적으로 빌드되고 배포되지만, backend contract와 제품 언어뿐 아니라 React reference로 고정된 visible layout·design contract도 공유한다.

### 1.3 Native UI Parity Rule

SwiftUI 앱은 React 웹앱을 새로운 iOS 디자인 언어로 재해석하는 프로젝트가 아니다. React 화면과 reference screenshot이 visible UI의 source of truth이며, 최종 simulator 화면은 같은 fixture와 상태에서 동일한 Taste Buddy 제품 화면으로 보여야 한다.

반드시 유지하는 항목:

- 화면의 주요 영역, section 순서, 상단·하단 chrome, content flow
- 정보 위계, 제목·본문·보조 정보의 우선순위, action 위치
- card·row·chip·button·search·sheet 등 컴포넌트의 역할과 grouping
- typography 크기·굵기·줄 수, color, spacing, radius, border, shadow, density
- 이미지와 데이터 시각화의 위치, 비율, fallback 의미
- loading·empty·error·populated·detail 상태에서 유지되는 layout 구조

허용되는 플랫폼 차이:

- iOS safe area와 system status area
- keyboard avoidance, text input behavior, focus handling
- native sheet presentation mechanics와 dismiss gesture
- 최소 touch target, haptic feedback, system gesture 충돌 회피
- Dynamic Type, VoiceOver, Reduce Motion 등 접근성 대응

플랫폼 차이는 기존 디자인 시스템이나 화면 위계를 바꾸는 근거가 될 수 없다. 차이가 필요한 경우에도 React 컴포넌트의 시각적 역할과 정보 구조를 보존하고, 해당 차이와 근거를 parity matrix에 기록한다.

이 문서에서 "SwiftUI 방식으로 옮긴다", "native adaptation", "재해석"이라는 표현은 상태 소유권, navigation, lifecycle, accessibility, input·presentation mechanics 같은 내부 구현을 뜻한다. 새로운 레이아웃, 새로운 컴포넌트 미감, 새로운 정보 위계를 만들어도 된다는 의미가 아니다. 기본 SwiftUI control이나 iOS 관용 패턴이 React reference와 다르게 보이면 그대로 사용하지 않고 기존 Taste Buddy design system에 맞게 구성한다.

## 2. 범위

### 2.1 첫 번째 네이티브 범위

1. Splash
2. Onboarding
3. Preference intake
4. Quick Taste Calibration
5. Starter Taste Profile
6. 메인 앱 셸
7. 홈 추천·통합 검색·소셜 피드
8. 나의 입맛 분석
9. 다이닝 기록·post-dining feedback
10. 프로필·관계·저장 목록
11. 레스토랑 상세·메뉴 상세·북마크
12. 인증·프로필 편집·알림·메뉴 등 전역 presentation
13. Supabase 인증·조회·저장·동기화

### 2.2 이번 범위에서 보류하는 기능

- 실제 예약 탐색·예약 생성·예약 확정
- Tastick 연결
- 정밀 측정 기기 플로우
- 정밀도 향상 플로우

보류 기능의 React 코드와 데이터 계약은 삭제하지 않는다. 초기 네이티브 parity가 완료된 후 별도 단계로 다시 평가한다.

### 2.3 네이티브 소비자 앱으로 옮기지 않는 화면

- `/design-system`
- `/design-system-updates`
- 개발용 preview 페이지
- TBA admin·content pipeline 관리 화면

이 화면들은 SwiftUI Preview catalog와 개발 문서의 참고 자료로만 사용한다.

## 3. Source Of Truth

충돌이 있을 때 아래 순서를 따른다.

1. [`../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md`](../src/guidelines/TASTE_BUDDY_PRODUCT_EXPERIENCE_GUIDELINES.md)
2. 승인된 React 제품 흐름과 카피
3. [`../DESIGN.md`](../DESIGN.md)
4. [`../docs/AI_DESIGN_SYSTEM.md`](../docs/AI_DESIGN_SYSTEM.md)
5. [`../src/styles/design-system.css`](../src/styles/design-system.css)
6. [`../src/constants/designTokens.ts`](../src/constants/designTokens.ts)
7. [`../src/components/system`](../src/components/system)
8. 현재 `ios/TasteBuddy` 구현

현재 iOS 코드는 초기 프로토타입이다. 웹과 다른 부분에서 iOS 구현을 기준으로 웹 요구사항을 축소하면 안 된다.

## 4. 현재 웹앱 분석

### 4.1 앱 단계

[`../src/App.tsx`](../src/App.tsx)의 최상위 상태는 다음 제품 단계를 관리한다.

```text
splash
  -> onboarding
  -> intake
  -> calibration
  -> main
```

웹에는 Tastick과 정밀 측정 단계도 존재하지만 첫 번째 네이티브 범위에서는 보류한다. 하드웨어 없이도 `calibration -> profile -> main`으로 진입할 수 있어야 한다.

설문 기반 보정은 다음 세부 단계로 구성된다.

```text
intro
  -> context
  -> questions intro
  -> questions
  -> profile intro
  -> review
  -> result
```

### 4.2 메인 앱 셸

관련 파일:

- [`../src/components/TopAppBar.tsx`](../src/components/TopAppBar.tsx)
- [`../src/components/BottomTabBar.tsx`](../src/components/BottomTabBar.tsx)
- [`../src/App.tsx`](../src/App.tsx)

필수 동작:

- 상단에는 프로필, 제목·뒤로 가기, 알림, 검색·추가, 메뉴 action이 상태에 따라 표시된다.
- 하단 탭 순서는 `홈`, `나의 입맛`, `다이닝`, `프로필`이다.
- 검색, 댓글 focus, 레스토랑 상세, 저장 목록과 같은 집중 화면에서는 메인 chrome을 숨긴다.
- sheet나 drawer가 열릴 때 배경 화면은 단순 정지가 아니라 축소·이동·모서리·그림자 표현을 사용한다.
- safe area를 포함한 web 기준 상단 높이는 56pt, 하단 탭 최소 높이는 60pt에 대응한다.

현재 [`TasteBuddy/Features/Main/MainTabView.swift`](./TasteBuddy/Features/Main/MainTabView.swift)의 기본 `TabView`는 임시 구현이다. 최종 구현은 웹의 정보 위계와 action 위치를 보존하는 custom shell이어야 한다.

### 4.3 Home

관련 파일:

- [`../src/pages/HomePage.tsx`](../src/pages/HomePage.tsx)
- [`../src/components/home/HomeUnifiedSearch.tsx`](../src/components/home/HomeUnifiedSearch.tsx)
- [`../src/components/social/TasteMatchFeed.tsx`](../src/components/social/TasteMatchFeed.tsx)
- [`../src/components/social/SocialDishFeedbackCard.tsx`](../src/components/social/SocialDishFeedbackCard.tsx)
- [`../src/components/social/SocialDishFeedbackCommentFocusScreen.tsx`](../src/components/social/SocialDishFeedbackCommentFocusScreen.tsx)

필수 화면과 상태:

- 측정 또는 프로필이 없는 준비 상태
- 레스토랑·메뉴·셰프·버디를 찾는 통합 검색
- 최근 검색어 최대 5개 로컬 저장
- 검색 결과의 그룹별 섹션과 각 결과 action
- `버디 추천`, `레스토랑 추천`, `셰프 추천` 모드
- 132 x 132 추천 카드와 편집 상태
- 추천 skeleton과 fallback profile
- 팔로잉 사용자의 dish feedback feed
- 댓글 focus 화면
- 검색 결과에서 레스토랑 상세·북마크·다이닝 feedback으로 이어지는 action

### 4.4 Analysis

관련 파일:

- [`../src/pages/AnalysisPage.tsx`](../src/pages/AnalysisPage.tsx)
- [`../src/components/analysis`](../src/components/analysis)
- [`../src/components/system/ProfileConfidenceCard.tsx`](../src/components/system/ProfileConfidenceCard.tsx)
- [`../src/components/system/HexRadarChart.tsx`](../src/components/system/HexRadarChart.tsx)
- [`../src/components/system/InterpretationDetailDrawer.tsx`](../src/components/system/InterpretationDetailDrawer.tsx)

기본 렌더 순서:

1. `나의 미각`
2. palate signature hero
3. chef translation interpretation
4. profile confidence
5. 기간 이동이 있는 six-axis radar
6. 측정 CTA
7. taste profile summary
8. special note
9. `세부 분석`의 taste tint horizontal cards
10. `인사이트`의 expandable interpretation cards
11. interpretation detail presentation

추가 상세 화면:

- taste change trend
- 기간 범위 선택
- 이전·다음 기간 이동
- taste filter
- swipe·pinch 또는 이에 대응하는 native chart interaction

분석 화면은 숫자 대시보드가 아니라 `what we know -> what it means -> what happens next` 구조를 유지해야 한다.

### 4.5 Dining

관련 파일:

- [`../src/pages/DiningPage.tsx`](../src/pages/DiningPage.tsx)
- [`../src/components/dining/DishFeedbackCard.tsx`](../src/components/dining/DishFeedbackCard.tsx)
- [`../src/components/reservation/DiningFeedbackFlow.tsx`](../src/components/reservation/DiningFeedbackFlow.tsx)
- [`../src/constants/diningFeedbackData.ts`](../src/constants/diningFeedbackData.ts)

첫 번째 네이티브 범위는 예약 기능이 아니라 식사 후 학습 루프에 집중한다.

필수 화면과 상태:

- `나의 디시` 목록
- 작성자·대상·날짜가 포함된 dish feedback card
- 이미지 rail
- main·secondary taste bubbles
- 상세 tag
- dining note preview
- like·comment·share action
- edit·delete·share action sheet
- dish detail focus
- comments focus
- per-dish guided feedback flow
- 로딩·빈 상태·오류 상태

feedback editor는 generic form이 아니라 다음 다이닝 경험의 개인화를 개선하는 guided reflection이어야 한다.

### 4.6 Profile

관련 파일:

- [`../src/pages/ProfilePage.tsx`](../src/pages/ProfilePage.tsx)
- [`../src/components/profile`](../src/components/profile)
- [`../src/components/system/PalateBloomAvatar.tsx`](../src/components/system/PalateBloomAvatar.tsx)
- [`../src/pages/SavedRestaurantListPage.tsx`](../src/pages/SavedRestaurantListPage.tsx)

필수 화면과 상태:

- palate bloom avatar와 identity
- 이름·닉네임·설정
- follower·following 수와 목록
- buddy 찾기
- 선택한 다른 사용자의 public profile
- follow·following·loading·canceling 상태
- `활동 요약`
- 미각 기록·다이닝 리뷰·테이스트 리스트·평균 만족도
- saved restaurant list
- profile setup·edit·identity sheet
- avatar editor
- logout·account deletion confirmation

### 4.7 Restaurant And Saved List

관련 파일:

- [`../src/pages/RestaurantDetailPage.tsx`](../src/pages/RestaurantDetailPage.tsx)
- [`../src/components/restaurant`](../src/components/restaurant)
- [`../src/pages/SavedRestaurantListPage.tsx`](../src/pages/SavedRestaurantListPage.tsx)

필수 화면:

- restaurant hero
- taste match·score summary
- memorable dish
- restaurant information
- feedback list
- menu detail
- bookmark sheet와 list assignment
- restaurant information suggestion
- saved category tabs와 저장 결과

### 4.8 전역 Presentation

[`../src/App.tsx`](../src/App.tsx)에는 page 밖에서 관리되는 다음 presentation이 있다.

- unified search
- notification panel
- app menu drawer
- auth profile dialog
- profile identity sheet
- profile edit sheet
- avatar editor
- email·code auth entry
- profile setup
- survey intro·intake
- support action overlay
- logout confirmation
- account deletion confirmation
- restaurant bookmark·information suggestion sheet

SwiftUI에서는 boolean 여러 개를 중첩하지 않고 식별 가능한 route와 sheet enum으로 관리한다.

## 5. 현재 네이티브 코드 평가

| 현재 파일·구조 | 판정 | 처리 방향 |
| --- | --- | --- |
| `DesignSystem/TBTheme.swift` | 부분 확정 | web token audit를 통과한 foundation token은 유지하고, motion·component-specific token은 이후 분리 |
| `Models/CalibrationModels.swift` | 재사용 후보 | React scoring fixture와 golden test를 통과한 뒤 확정 |
| `Components/TasteRadarView.swift` | 재사용 후보 | label, geometry, comparison, interaction parity 검증 |
| `Components/TBComponents.swift` | 부분 재사용 | preview catalog로 검증된 공용 컴포넌트부터 유지하고, variant가 늘어나는 컴포넌트는 system component별 파일로 분리 |
| `App/AppModel.swift` | 교체 필요 | app phase, route, presentation, repository state를 분리 |
| `App/AppNavigation.swift` | 신규 기준 | `MainTab`, `AppSheet`의 식별 가능한 navigation/presentation contract |
| `Components/Shell/AppShellView.swift` | 부분 확정 | custom top·bottom shell, global sheet entry, current-tab accessibility 구조를 유지하고 detail route hiding은 이후 확장 |
| `Features/Main/MainTabView.swift` | wrapper | `AppShellView` 진입점으로 유지 |
| `Models/TasteModels.swift` fixture | 임시 | DTO·domain·preview fixture를 분리하고 backend contract로 교체 |
| 각 feature view | 부분 프로토타입 | parity matrix를 기준으로 누락 상태와 presentation을 채움 |
| `UserDefaults` persistence | 임시 | 작은 사용자 설정만 유지하고 account data는 repository로 이동 |

현재 native 화면이 존재한다는 이유만으로 parity 완료로 표시하지 않는다.

## 6. 목표 SwiftUI 구조

```text
ios/TasteBuddy/
  App/
    TasteBuddyApp.swift
    AppStore.swift
    AppPhase.swift
    AppRoute.swift
    AppPresentation.swift
    DependencyContainer.swift

  DesignSystem/
    TBTokens.swift
    TBTypography.swift
    TBTastePalette.swift
    TBMotion.swift

  Domain/
    Models/
    UseCases/
    Protocols/

  Data/
    DTO/
    Repositories/
    Services/
    Persistence/

  Components/
    Shell/
    Cards/
    Feedback/
    Profile/
    Search/

  Features/
    Launch/
    Onboarding/
    Calibration/
    Main/
    Home/
    Analysis/
    Dining/
    Profile/
    Restaurant/
    SavedList/
    Search/

  Fixtures/
  Resources/

ios/TasteBuddyTests/
  Contracts/
  Calibration/
  Repositories/
  FeatureState/
```

기존 폴더를 한 번에 이동하지 않는다. 각 vertical slice를 구현할 때 관련 코드를 목표 구조로 옮긴다.

## 7. 상태와 탐색 설계

### 7.1 앱 단계

```swift
enum AppPhase {
    case splash
    case onboarding
    case preferenceIntake
    case calibration
    case profileResult
    case main
}
```

앱 진입 상태는 인증 여부, onboarding 완료 여부, calibration 결과 존재 여부를 조합해 결정한다.

### 7.2 메인 탭

```swift
enum MainTab {
    case home
    case analysis
    case dining
    case profile
}
```

웹 코드에서 일부 내부 이름이 `reservation`이어도 native public 이름은 `dining`으로 명확히 정의한다.

### 7.3 Route

```swift
enum AppRoute: Hashable {
    case restaurant(RestaurantID)
    case restaurantMenu(RestaurantID, MenuID)
    case dishFeedback(FeedbackID)
    case comments(FeedbackID)
    case tasteChange
    case savedRestaurants
    case connectionList(ConnectionKind)
    case publicProfile(ProfileID)
}
```

route는 `NavigationStack`의 path를 구성한다. route destination에서 필요한 전체 model을 저장하지 않고 안정적인 ID를 전달한다.

### 7.4 Presentation

```swift
enum AppSheet: Identifiable {
    case search
    case notifications
    case appMenu
    case bookmark(RestaurantID)
    case profileEdit
    case profileIdentity
    case auth
    case support
}
```

- 선택된 model에 따라 sheet가 열리는 경우 `.sheet(item:)`을 사용한다.
- destructive confirmation은 `confirmationDialog` 또는 `alert`로 분리한다.
- full-screen avatar editor처럼 몰입이 필요한 흐름은 `fullScreenCover`를 사용한다.
- 상세 route에서는 top·bottom shell 노출 여부를 route metadata로 결정한다.

### 7.5 상태 소유권

- 앱 단계·session·selected tab·navigation은 app-level store가 소유한다.
- 검색어, 카드 확장, 선택 필터처럼 화면에만 필요한 값은 local state가 소유한다.
- 서버 데이터는 repository protocol 뒤에 둔다.
- view가 Supabase SDK를 직접 호출하지 않는다.
- iOS 17 target에서는 app-level state를 `@Observable`로 통일하는 것을 우선 검토한다.

## 8. 데이터와 Backend 전략

이 절은 앱 아키텍처 관점의 요약이다. 실제 table·RLS·RPC·R2 bucket·보안 migration·offline sync 구현 순서는 [`BACKEND_INTEGRATION_PLAN.md`](./BACKEND_INTEGRATION_PLAN.md)를 따른다.

### 8.1 먼저 고정할 계약

| 계약 | React source |
| --- | --- |
| taste axis·색상·label | `src/constants/designTokens.ts`, `src/constants/tasteColors.ts` |
| measurement snapshot | `src/constants/tasteMeasurementData.ts` |
| quick calibration | `src/constants/quickTasteCalibrationData.ts` |
| dining feedback draft | `src/constants/diningFeedbackData.ts` |
| dining·dish tag | `src/constants/diningDetailTags.ts`, `src/constants/dishKindTags.ts` |
| profile·feed·review | `src/types/tasteBuddyAgent.ts` |
| personalization | `src/types/tastePersonalization.ts` |
| Supabase persistence | `src/lib/tasteBuddySupabase.ts`, `src/lib/tasteBuddyAgentSupabase.ts` |
| bookmark persistence | `src/lib/restaurantBookmarksSupabase.ts` |

각 계약은 다음 세 층으로 나눈다.

1. `DTO`: backend JSON과 직접 대응
2. `Domain Model`: 앱에서 사용하는 의미 중심 모델
3. `View State`: 로딩·빈 상태·오류와 화면 표시를 포함

### 8.2 알고리즘 이식

다음 로직은 Swift로 재작성하되 React 결과와 비교하는 golden fixture를 먼저 만든다.

- quick calibration scoring
- taste vector 생성
- profile stage와 confidence
- taste identity 생성
- similarity와 recommendation explanation
- measurement stale 판단
- dining review ingestion과 profile refinement

동일 입력 JSON에 대해 TypeScript와 Swift 결과가 같아야 한다. 부동소수점은 허용 오차를 테스트에 명시한다.

### 8.3 Repository

최소 protocol:

```swift
protocol ProfileRepository
protocol MeasurementRepository
protocol RecommendationRepository
protocol DiningFeedbackRepository
protocol RestaurantRepository
protocol BookmarkRepository
protocol SocialRepository
protocol SessionRepository
```

각 protocol에는 production Supabase 구현과 preview·test용 fixture 구현을 둔다.

backend adapter는 기능 구현 마지막에 한꺼번에 추가하지 않는다. Phase 1에서 contract를 고정하고, 각 vertical slice에서 필요한 read·write repository를 fixture와 production 구현으로 함께 검증한다. Phase 11은 누락된 production integration, 보안 hardening, offline sync를 닫는 단계다.

### 8.4 로컬 저장

- `UserDefaults`: onboarding flag, 선택한 UI preference, 최근 검색어
- Keychain: 인증 token 또는 민감한 session 정보
- repository cache: backend에서 다시 받을 수 있는 account data
- 파일·이미지 cache: URL 기반 media

프로필 전체나 dining history를 장기적으로 `UserDefaults`에 저장하지 않는다.

## 9. 디자인 시스템 이식

### 9.1 핵심 토큰

- font: Pretendard
- product UI text 최대 18pt
- page surface: `#F3F3F3`
- 기본 page gutter: 20pt
- section 간격: 20pt
- card stack 간격: 12pt
- card radius: 20pt
- control radius: 10pt
- 기본 button 높이: 48pt
- top app bar: 56pt
- bottom tab bar: 최소 60pt
- 추천·taste tint card: 132 x 132pt

색상은 asset catalog와 semantic Swift token을 함께 사용한다. view에 hex 값을 반복 작성하지 않는다.

### 9.2 우선 이식할 공용 컴포넌트

1. App shell
2. `PageSection`
3. `SectionCard`
4. primary·secondary button
5. neutral·taste chip
6. `PalateBloomAvatar`
7. `InterpretationCard`
8. `ProfileConfidenceCard`
9. `HexRadarChart`
10. `TasteTintCard`
11. `DishFeedbackCard`
12. hospitality empty state
13. bottom sheet shell
14. toast·action overlay

각 컴포넌트에는 아래 Preview를 둔다.

- 기본
- 긴 한국어 카피
- Dynamic Type
- loading 또는 disabled
- light·dark appearance 중 실제 지원 범위
- iPhone 17 Pro 기준 폭

## 10. 단계별 재구현 계획

### Phase 0. 기준 화면 고정

현재 캡처 기준선과 미완료 상태 목록은 [`Reference/README.md`](./Reference/README.md)에서 관리한다.

입력:

- React dev server
- 제품·디자인 문서
- 실제 fixture와 계정 상태

작업:

- 각 화면의 기본·로딩·빈 상태·오류·상세 상태를 목록화한다.
- 고정 viewport와 동일 데이터로 웹 screenshot을 저장한다.
- 화면별 visible copy, action, spacing, media fallback을 기록한다.
- [`PARITY_MATRIX.md`](./PARITY_MATRIX.md)의 행을 누락 없이 보완한다.

산출물:

- reference screenshot set
- 화면별 fixture
- 갱신된 parity matrix

완료 조건:

- 구현자가 React 코드를 다시 탐색하지 않아도 한 화면의 요구사항을 설명할 수 있다.
- 각 화면의 React reference screenshot이 layout, design, information hierarchy 비교 기준으로 지정되어 있다.

### Phase 1. 계약과 Golden Test

작업:

- TypeScript domain type을 Swift `Codable` DTO로 정의한다.
- taste axis ID와 enum raw value를 고정한다.
- calibration·profile·feedback fixture를 JSON으로 공유한다.
- deterministic 알고리즘에 Swift unit test를 추가한다.

완료 조건:

- 같은 fixture에서 TypeScript와 Swift의 핵심 계산 결과가 일치한다.
- 화면이 임의의 fixture 상수가 아니라 domain model을 사용한다.

2026-06-05 checkpoint:

- quick calibration과 12문항 taste survey의 React-generated golden fixture가 Swift unit test와 일치한다.
- preference intake selection rules, survey catalog, nullable measurement snapshot, restaurant-ready guidance, dining feedback scenario DTO가 Swift에 고정됐다.
- calibration 화면은 bundled survey contract와 scoring engine을 사용한다.
- preference intake는 bundled contract와 draft persistence를 사용한다.
- repository contract와 feedback mutation payload는 아직 Phase 1 잔여 작업이다.

### Phase 2. SwiftUI Design System

작업:

- CSS와 TypeScript token을 Swift semantic token으로 옮긴다.
- typography, color, spacing, radius, shadow, motion을 분리한다.
- 핵심 공용 컴포넌트와 Preview catalog를 만든다.
- 현재 `TBTheme.swift`와 `TBComponents.swift`를 audit하고 필요한 부분만 분리·재사용한다.

완료 조건:

- feature view에 임의 색상·radius·font 선언이 없다.
- 같은 fixture의 web·SwiftUI component screenshot을 비교할 수 있다.
- React component와 SwiftUI component의 geometry, typography, spacing, visual state가 같은 디자인 시스템으로 식별된다.

2026-06-05 checkpoint:

- `TBTheme.swift`에 web foundation token과 맞는 neutral color, disabled/overlay surface, spacing, radius, size, 18pt font cap을 보강했다.
- `PrimaryButton`, `SectionCard`, `OutlineBadge`가 shared token을 사용하도록 정렬됐다.
- `DesignSystemPreviewView`와 `--design-system-preview` launch argument를 추가했다.
- iPhone 17 Pro simulator에서 preview catalog를 실행했고 runtime snapshot에서 Foundation, Taste Palette, Core Controls, Product Cards, State Recipes 섹션을 확인했다.
- reference screenshot은 `Reference/Native/06-design-system-preview-368x800.jpg`에 저장했다.
- `PageSection`, `Chip`, `TasteChip`, `ProfileConfidenceCard`, `InterpretationCard`, `TasteTintCard`, `SummaryMetricCard`의 React TSX props·variant·geometry를 공용 SwiftUI 컴포넌트로 이식했다.
- Chip의 3개 size·4개 tone·4개 variant와 Profile Confidence 3단계 contract를 unit test로 고정했고, `Reference/Native/37`, `38`에서 design-system catalog와 실제 Analysis 화면을 검증했다.
- `HexRadarChart.tsx`의 320x310 좌표계, 축 시작 각도, 4단계 grid, 기준 반응 경로, taste spoke·node·gradient outline, adaptive corner, center mask, label anchor, 1초 cubic-bezier motion을 `TasteRadarView`로 직접 이식했다. React 평균값과 geometry는 unit test로 고정했고 `Reference/Native/41`에서 실제 Analysis 카드 렌더를 검증했다.
- `PalateSignatureHeroCard.tsx`의 delta 기반 6개 signature 판정식과 우선순위를 Swift contract test로 고정하고, 하드코딩된 native hero를 실제 profile 계산형 공용 컴포넌트로 교체했다. `TasteMeasurementMiniCta.tsx`의 tone·padding·action placement·compact button을 이식해 Analysis CTA가 실제 quick refinement sheet를 열도록 연결했으며 `Reference/Native/42`에서 검증했다.
- `TasteInsightSummaryCard.tsx`, `TastePointArrowBox.tsx`, `TasteLineChart.tsx`를 공용 SwiftUI 컴포넌트로 이식해 기존 단색 `Taste profile`/`Special note` 임시 카드를 교체했다. `Reference/Native/43`에서 두 카드의 공용 구조를 검증했고, 미각변화 route와 특이사항 detail presentation을 simulator에서 확인했다. 특이사항 전용 legacy detail 화면은 잔여 작업이다.
- web component의 모든 variant가 native로 옮겨진 것은 아니므로 Phase 2 전체는 parity matrix 기준 Partial 항목을 계속 따른다.

### Phase 3. App Shell And Navigation

작업:

- `AppPhase`, `MainTab`, `AppRoute`, `AppSheet`를 도입한다.
- custom top app bar와 bottom tab bar를 만든다.
- route별 shell 표시 규칙을 구현한다.

2026-06-05 checkpoint:

- `MainTab`과 `AppSheet`를 추가해 main tab과 global presentation을 식별 가능한 타입으로 고정했다.
- 기본 iOS `TabView`를 `AppShellView` custom shell로 교체했다.
- top shell은 profile, notification, quick refinement/search, menu action을 제공한다.
- bottom shell은 `홈`, `나의 입맛`, `다이닝`, `프로필` 순서와 label을 React 기준에 맞췄다.
- `--shell-preview` launch argument로 sample profile shell을 deterministic하게 검증할 수 있다.
- iPhone 17 Pro simulator에서 home shell, tab switch to `나의 입맛`, global search sheet opening을 runtime snapshot으로 확인했다.
- `AppRoute` stack을 직접 소유하는 focus container를 추가해 saved list, restaurant detail, connection list, public profile route에서 main top/bottom shell을 숨긴다.
- React `TopAppBar.tsx`와 `BottomTabBar.tsx`를 공용 SwiftUI `TopAppBar`, `BottomTabBar`로 직접 이식해 40pt action, Lucide 24pt icon, 8pt action gap, 32pt bloom, custom Home/Analysis path, selected semantics를 contract test로 고정했다.
- root Home/Analysis와 restaurant detail의 profile/back/title/right-action 전환은 `Reference/Native/39`, `40`에서 simulator 검증했다.
- root `NavigationStack(path:)`는 현재 nested feature `NavigationStack`과 함께 iOS 26 simulator에서 `NavigationColumnState.boundPathChange` crash를 유발했으므로 쓰지 않는다. Phase 3에서는 manual route stack을 기준으로 유지한다.
- Profile `테이스트 리스트` metric -> saved list -> restaurant detail route, restaurant bookmark sheet를 simulator에서 확인했다.
- restaurant detail reference는 `Reference/Native/08-restaurant-detail-route-368x800.jpg`에 저장했다.
- 현재는 restaurant feedback/menu detail, saved-list category editing, connection follow states가 남아 있으므로 Phase 3 전체는 Partial이다.
- background card transform과 sheet presentation을 구현한다.
- deep link가 필요한 route ID 체계를 고정한다.

완료 조건:

- 네 탭, 상세 push, global sheet, full-screen flow가 서로 충돌하지 않는다.
- 상세·focus 화면에서 shell이 웹과 같은 조건으로 숨겨진다.

### Phase 4. Launch, Onboarding, Calibration

작업:

- splash와 onboarding을 웹 순서와 카피로 이식한다.
- preference intake와 survey step을 native form·selection pattern으로 구현한다.
- quick calibration result와 Starter Taste Profile을 domain model에 연결한다.
- calibration을 건너뛰거나 하드웨어 없이 진행하는 경로를 보장한다.

완료 조건:

- 신규 사용자가 `splash -> main`까지 중단 없이 진행한다.
- 앱 재실행 시 올바른 phase로 복원된다.
- scoring golden test가 통과한다.

현재 상태:

- native splash가 추가됐고 `--splash-preview`로 simulator 캡처가 고정됐다.
- `AppPhase` resolver가 `splash -> onboarding -> preferenceIntake -> calibration -> main` 순서를 명시하며, 예약·Tastick phase를 첫 native scope에 포함하지 않는 테스트가 추가됐다.
- `--reset-app-state` launch 검증에서 splash delay 뒤 onboarding 첫 화면으로 자동 전환되는 것을 확인했다.
- `intro -> context -> questions intro -> 12 questions -> profile intro -> review -> result`는 simulator에서 검증됐다.
- onboarding 뒤 7문항 preference intake가 실행되고, 중간 draft와 완료 profile이 분리 복원된다.
- result 저장 후 로컬 profile 복원과 main shell 진입이 검증됐다.
- Supabase Swift package, xcconfig 기반 backend 설정, publishable-key guard, session repository protocol, 앱 시작 시 1회 session restore 호출이 추가됐고 `BackendIntegrationTests`로 검증됐다. React `supabase.ts`의 anonymous session, email OTP, link-current-profile, local sign out, `delete-account` Edge Function contract도 `BackendAuthRepository`로 감쌌다. 실제 staging credential을 넣은 auth roundtrip과 profile/measurement repository 복원이 아직 없으므로 Phase 4 전체는 완료되지 않았다.

### Phase 5. Home

작업 순서:

1. 준비 상태
2. unified search trigger
3. search overlay와 최근 검색어
4. grouped results
5. recommendation mode editor
6. 132pt recommendation cards
7. skeleton·fallback
8. following dish feed
9. comment focus와 detail action

완료 조건:

- 모든 검색 그룹과 추천 모드가 같은 fixture에서 표시된다.
- 최근 검색어가 최대 5개로 유지된다.
- 빈 상태와 loading 상태가 실제 repository state에서 나타난다.

현재 상태:

- `HomeSearchEngine`이 React 검색 규칙의 핵심인 최근 검색 최대 5개, 중복 제거, 빈 쿼리 추천 탐색, 그룹 필터링을 담당한다.
- `--search-preview`, `--search-results-preview`, `--search-empty-preview`로 default, grouped result, no-result 상태를 simulator 캡처로 고정했다.
- 최근 검색 persistence와 검색 그룹 필터링은 unit test로 검증됐다.
- React `SearchOverlayShell.tsx`를 native `SearchOverlayShell`로 이식해 44pt search field, 44pt search action, 20pt horizontal padding, 12pt header gap, clear button, cancel action, body scroll padding을 contract test로 고정했다.
- React `CompactCard.tsx`를 native `CompactCard`로 이식해 20pt radius, 12pt padding/gap, 40pt media slot, 32pt action button, 24pt action icon을 고정했다. Home search results는 더 이상 임시 `SectionCard` row가 아니라 `CompactCard` media/content/actions slot으로 렌더하며, 기록 추가와 bookmark action을 React 구조처럼 별도 action slot으로 노출한다.
- React system component batch를 native `SystemCoreComponents.swift`로 이식했다. 이번 배치는 `SectionTitle`, `TokenBox`, `ImageBox`, `ChefAvatar`, `StatusChip`, `EmptyState`, `ActionOverlayCard`, `BottomSheetShell`, `BottomSheetCloseButton`, `BottomSheetIconButton`을 포함하며, React TSX/CSS의 32/40/48pt media box, 8pt image radius, 6pt status chip radius, 48x24pt empty-state padding, 320pt overlay card, 95vh bottom sheet shell, 40pt header slot을 contract test로 고정했다.
- 기존 `SearchEmptyState` 임시 구현은 제거하고 Home search no-result state가 공용 `EmptyState`를 사용하도록 연결했다. 기존 `TBFlowStepCTA`, `TBSelectionCard`, `TBStepIndicator`도 React metrics enum과 unit test를 추가해 현재 구현 범위를 명확히 했다.
- React `/design-system` 전체 인벤토리를 native `DesignSystemFullComponents.swift`와 `NativeDesignSystemInventory`로 확장했다. 이 배치는 design-system architecture group의 59개 컴포넌트 이름, `filePreviewRegistry.tsx`의 52개 파일 프리뷰, `componentStyleSpecs.ts`의 30개 style spec, `UNUSED_UI_PRIMITIVES`의 20개 generic primitive를 Swift 테스트로 고정한다.
- `TBTheme.swift`는 `designTokens.ts`/`design-system.css`의 색상, 타이포그래피, spacing, radius, icon, shadow, motion, layout, data-viz, taste-loop 계열 토큰을 native 상수로 확장했다. 제품 UI의 18pt clamp는 기존 `TBFont`에 유지하면서 React의 20/22/24/28 token도 18pt로 mirror한다.
- `/design-system`에 보이는 컴포넌트뿐 아니라 `filePreviewRegistry.tsx`에만 있는 `TCSHintCard`, measurement panels, reservation card, generic `ui/card`, `ui/button`, `ui/badge`, `ui/input`, `ui/textarea`, `ui/select` 대응 컴포넌트도 SwiftUI 카탈로그에서 렌더한다. generic primitive는 제품 컴포넌트와 충돌하지 않도록 `TBUI*` prefix를 사용한다.
- Search result bookmark action은 레스토랑 상세에서 쓰던 native bookmark sheet를 공유하도록 연결했다. create/select, cover editor, privacy flag, move/remove, UserDefaults persistence, pending mutation queue, conflict resolver, sync status row까지 native contract로 고정했다. 실제 Supabase client 구현과 staging RLS 검증은 Backend Phase 6에 남아 있다.
- `HomeUnifiedSearch.tsx`의 async Kakao/friend search 흐름을 native `HomeSearchRepository` protocol과 `FixtureHomeSearchRepository`로 이식했다. Search overlay는 query별 loading/error phase, remote/local result merge, local/remote duplicate suppression, selected result focus card, Kakao place fixture, profile identity search fixture를 가진다. Live Kakao Edge Function과 Supabase profile RPC 연결은 아직 repository 구현체 교체가 필요하다.
- 추천 section의 `편집` toggle, 세 추천 모드, 132pt cards, skeleton, fallback buddy cards가 native 상태로 구현됐고 `--recommendation-loading-preview`, `--recommendation-fallback-preview`로 캡처됐다.
- `TasteMatchFeed.tsx`의 recommendation mini card media contract를 native metrics로 고정했다. Buddy mode는 `PalateBloomAvatar`, restaurant mode는 `ImageBox(kind: .restaurant)`, chef mode는 `ChefAvatar`를 사용하며 132pt card, 12pt padding/gap, 48pt media box, 28pt fallback icon을 contract test로 검증한다.
- 홈 feed 카드의 detail/comment route가 연결됐고 `--comments-preview`로 focus chrome과 댓글 read state가 캡처됐다.
- `DishFeedbackCard.tsx`의 optional media rail과 card action sheet 구조를 `NativeDishFeedbackCard`에 이식했다. Media rail은 사용자가 업로드한 feedback photo source만 허용하며, 셰프·레스토랑 portrait asset은 fixture와 렌더 가드에서 제외했다.
- `DishFeedbackCard.tsx`와 `SocialDishFeedbackCard.tsx`의 view model contract를 기준으로 `tasteBubbles`를 단순 taste axis가 아닌 `id`, `label`, `title`, `colorTaste` metadata를 가진 native model로 확장했다. Home과 Dining 모두 `NativeDishFeedbackCard`를 통해 React와 같은 taste bubble label chip row, detail tag row, dining note preview, action row를 렌더한다.
- `SocialDishFeedbackCard.tsx`의 `TasteMatchFeedItem -> DishFeedbackCardViewModel` 변환을 native `DiningDishFeedbackItem.fromTasteMatchFeedItem`으로 추가했다. 이 경로는 native TBA dining note/snapshot을 생성하고, React와 같이 alt-only image view model은 실제 feedback media가 아니므로 image rail에 렌더하지 않는다.
- `detailTags`도 React `DishFeedbackCardTag`와 같은 `id`, `label`, optional `title` native model로 확장했다. `NativeDishFeedbackCard`의 detail tag row는 한 줄 안에서 가장 많이 들어가는 조합을 선택하고, 남는 태그는 React와 같은 `+N` chip으로 축약한다.
- React `tasteBuddyAgent.ts`의 전체 deterministic TBA 계층을 native `TasteBuddyAgent`로 이식했다. Native는 taste identity, 공개 프로필, review ingestion, dining note/snapshot, similarity edge, taste-match feed, evidence confidence learning, signal/FoodOn mapping, menu context inference를 제공한다.
- `Tools/contract-fixture-entry.ts`가 `tba-dining-analysis-golden.json`과 `tba-full-engine-golden.json`을 생성한다. Swift 테스트는 dining note뿐 아니라 identity, profile publish, review ingest, similarity, confidence aggregation, feed score, FoodOn/signal mapping을 React 결과와 비교한다.
- Home과 Dining의 `NativeDishFeedbackCard`는 native TBA snapshot의 `tasteBubbles`, `detailTags`, `summary`, `source`, `confidence`, evidence ids를 사용한다. 새 식사 기록은 당시의 사용자 TBA profile, dish-kind IDs, 분석 snapshot을 함께 저장하고 생성·수정·삭제 evidence에서 학습된 confidence를 재계산해 로컬에 보존한다.
- `DishFeedbackFeedRepository`와 `DishFeedbackFeedPhase`를 추가해 remote TBA feed hydration이 `.loading`, `.empty`, `.failed`, `.populated` 상태로 화면에 들어올 수 있게 했다. Home following card section은 loading skeleton뿐 아니라 empty/error 상태도 공용 `EmptyState`로 표시한다.
- R2 private reflection media는 아직 네트워크 업로드를 구현하지 않았지만, `FeedbackReflectionMediaLifecycleOperation`과 `FeedbackReflectionMediaPolicy`로 upload/read/replace/delete/account cleanup action, `feedback-reflections/{user-id}/{yyyy-mm-dd}/{asset-id}.jpg` object key, 6MB limit, 1600px resize target, JPEG/PNG/WebP content type contract를 고정했다.
- `NativeDishFeedbackCard` action sheet는 edit/share/delete callback과 destructive confirmation callback을 실제 action closure로 연결한다.
- 댓글 focus의 seed comment, composer submission, local persistence, 카드 comment count 반영은 `AppModel` 상태로 연결했고 `Reference/Native/45-comments-focus-comment-store-368x800.jpg`로 캡처했다.
- Home/Dining 카드 계약은 `Reference/Native/46-home-dish-card-contract-368x800.jpg`, `Reference/Native/47-dining-dish-card-contract-368x800.jpg`에서 simulator로 확인했다.
- detail tag metadata와 fit row 계약은 `Reference/Native/48-home-dish-detail-tags-contract-368x800.jpg`, `Reference/Native/49-dining-dish-detail-tags-contract-368x800.jpg`에서 simulator로 확인했다.
- native TBA dining note/snapshot이 적용된 Home/Dining 카드는 `Reference/Native/50-home-native-tba-dish-card-368x800.jpg`, `Reference/Native/51-dining-native-tba-dish-card-368x800.jpg`에서 simulator로 확인했다.
- native search overlay/card component parity는 `Reference/Native/52-search-overlay-compact-card-parity-368x800.jpg`에서 simulator로 확인했다.
- native system core component parity는 `Reference/Native/53-system-core-components-parity-368x800.jpg`에서 simulator로 확인했다.
- full native design-system inventory와 file-preview registry parity는 `Reference/Native/54-design-system-full-inventory-parity-368x800.jpg`, `Reference/Native/55-design-system-file-preview-registry-parity-368x800.jpg`에서 simulator로 확인했다.
- 이번 Phase 5 Home component batch의 build/run smoke 화면은 `Reference/Native/58-phase5-home-batch-verification-368x800.jpg`로 보존했다.
- `tba:native-bundle` 생성기는 React 원본에서 100개 Core Taste Lexicon, 180개 signal taxonomy, 46개 FoodOn bridge, 260개 빠른 runtime을 네이티브 JSON으로 만들고 6,800개 전체 food knowledge bridge를 함께 번들링한다. 로컬 TBA 엔진은 이 전체 데이터와 profile/feed/similarity/confidence learning까지 연결됐다. Live Supabase social graph, Kakao Edge Function, comment mutation/sync, R2 network lifecycle은 별도 backend Phase 5 범위다.

### Phase 6. Analysis

작업 순서:

1. palate signature hero
2. chef translation
3. profile confidence
4. radar period navigation
5. measurement CTA
6. profile·special note
7. six taste tint cards
8. expandable insights
9. interpretation detail
10. taste change trend

완료 조건:

- React render 순서와 visible information이 일치한다.
- current·stale·no measurement 상태가 구분된다.
- VoiceOver가 chart의 의미와 각 축 값을 읽을 수 있다.

### Phase 7. Dining Feedback

작업 순서:

1. `나의 디시` 목록
2. full dish feedback card
3. detail focus
4. comments
5. option sheet
6. guided per-dish editor
7. media·save·error handling

완료 조건:

- 작성·수정·삭제 후 목록과 profile summary가 일관되게 갱신된다.
- generic review form이 아니라 taste refinement 흐름으로 보인다.
- 예약 생성 기능 없이 post-dining feedback이 독립적으로 동작한다.

### Phase 8. Profile, Connections, Saved List

작업 순서:

1. identity card와 palate bloom
2. activity metrics
3. follower·following list
4. public profile
5. follow state machine
6. saved restaurant list
7. profile setup·edit·avatar
8. logout·delete confirmation

완료 조건:

- 내 프로필과 public profile의 action이 혼동되지 않는다.
- follow mutation의 loading·success·rollback이 보인다.
- saved list에서 restaurant detail로 왕복할 수 있다.

### Phase 9. Restaurant Detail And Bookmark

작업 순서:

1. hero
2. match·score summary
3. memorable dish
4. restaurant information
5. feedback
6. menu detail
7. bookmark sheet
8. information suggestion

완료 조건:

- Home·Search·Saved List에서 같은 restaurant detail route를 사용한다.
- bookmark mutation이 모든 진입 화면에 반영된다.

### Phase 10. Auth And Global Presentation

작업:

- email·code auth
- profile setup
- notification panel
- app menu
- support action
- identity·edit presentation
- logout·account deletion

완료 조건:

- presentation이 중복으로 겹치지 않는다.
- 인증 취소·오류·재시도 경로가 존재한다.
- destructive action은 명확한 확인과 결과 feedback을 제공한다.

현재 상태:

- React `AuthEntryScreen.tsx`의 `AuthEntryForm`, `src/components/system/BottomSheetShell.tsx`, `App.tsx`의 AuthEntry sheet usage를 기준으로 native `AuthEntrySheet`/`AuthEntryModel`을 추가했다. 이메일 입력, 6자리 OTP code step, message success/error surface, `옵션보기` action overlay, resend, cancel confirmation, dev bypass, sheet footer CTA labels를 SwiftUI로 재구현했다.
- React AuthEntry bottom sheet의 `h-auto max-h-[72vh]` email step과 `95vh - safe-area-top - 12px` code step stage를 native `BottomSheetStageMode`와 AuthEntry 전용 presentation detent로 맞췄다.
- React `App.tsx`의 email submit/code submit 상태 전환을 native model에 반영했다. anonymous user의 `start-with-email` 요청이 missing-account 계열 오류로 실패하면 `link-current-profile` intent로 전환한 뒤 code step으로 넘어간다.
- React `supabase.ts`의 `sendSupabaseEmailOtp`/`verifySupabaseEmailOtp` contract는 `BackendAuthRepository`를 통해 호출되며, SwiftUI view는 Supabase SDK를 직접 import하지 않는다.
- Profile summary의 account-link CTA가 native auth entry sheet를 연다. `--auth-entry-preview` launch argument와 `Reference/Native/60-auth-entry-sheet-email-parity-368x800.jpg`, `Reference/Native/61-auth-entry-sheet-code-parity-368x800.jpg`로 simulator 확인을 남겼다.
- 실제 staging email OTP roundtrip, deep link/session hydration, profile setup/edit/identity completion, logout/account deletion presentation은 아직 남아 있다.

### Phase 11. Supabase Integration

작업:

- [`BACKEND_INTEGRATION_PLAN.md`](./BACKEND_INTEGRATION_PLAN.md)의 남은 production integration 수행
- repository protocol의 Supabase 구현 완성
- session 복원
- DTO와 domain mapping
- pagination
- optimistic mutation과 rollback
- cache·offline·retry
- analytics event parity
- RLS·RPC·Edge Function authorization 검증
- R2 private media와 account deletion cleanup 검증

완료 조건:

- fixture repository와 production repository를 dependency로 교체할 수 있다.
- view에 Supabase SDK import가 없다.
- 동일 account의 웹·iOS 핵심 데이터가 일치한다.
- 다른 사용자의 private row와 reflection media에 접근할 수 없다.

현재 상태:

- Supabase Swift package는 Xcode project dependency로 고정됐고, Debug/Release `xcconfig`와 Info.plist build setting placeholder가 연결됐다.
- `BackendConfiguration`은 Supabase URL, publishable key, public media base URL, backend environment를 읽으며 placeholder와 service-role/secret marker를 거부한다.
- `SupabaseClientProvider`, `BackendSessionRepository`, `SupabaseSessionRepository`, `BackendAuthRepository`, fixture/missing-configuration repository를 추가했다. SwiftUI view는 Supabase SDK를 직접 import하지 않는다.
- `AppModel`은 injected session repository를 통해 앱 시작 시 session restore를 한 번 수행하고 `BackendSessionStatus`를 노출한다.
- `BackendAuthRepository`는 React `supabase.ts`의 `ensureSupabaseSession`, `sendSupabaseEmailOtp`, `verifySupabaseEmailOtp`, `linkAnonymousSupabaseUserEmail`, `signOutSupabaseSession`, `deleteCurrentSupabaseAccount` contract를 native API로 감싼다.
- `BackendIntegrationTests`는 staging config decode, placeholder/secret rejection, injected session restore, Auth intent/message mapping, fixture auth result, AuthEntry empty-email/invalid-code validation, anonymous `start-with-email` to `link-current-profile` fallback을 검증한다.
- 실제 staging credential을 넣은 anonymous auth 생성, email OTP roundtrip, logout, account deletion, profile/measurement/feedback/social/bookmark/notification repository의 live staging 구현, RLS positive/negative 검증, R2 lifecycle 검증은 아직 남아 있다.

### Phase 12. 회귀 검증과 출시 준비

검증:

- web vs native screenshot
- default·loading·empty·error·populated
- Dynamic Type
- VoiceOver
- Reduce Motion
- 긴 한국어·영어 카피
- 작은 iPhone과 iPhone 17 Pro
- 느린 네트워크·오프라인
- launch·scroll performance
- memory와 image cache

완료 조건:

- parity matrix의 첫 native scope 항목이 모두 complete다.
- blocker 수준의 시각·동작·접근성 차이가 없다.
- 사용자 데이터 mutation과 복구 경로가 테스트됐다.
- 동일 fixture와 대응 viewport에서 React reference screenshot과 simulator screenshot을 layout·design 기준으로 비교했고, safe area 등 문서화된 플랫폼 차이를 제외한 제품 레벨 차이가 없다.

### Phase 13. 보류 기능 재평가

초기 parity 완료 후 다음을 별도 설계한다.

- reservation browsing·booking
- Tastick pairing
- precision measurement
- accuracy improvement

이 단계는 hardware 없이도 성립하는 핵심 서비스 경험을 훼손하지 않아야 한다.

## 11. Vertical Slice 작업 템플릿

각 기능은 다음 순서로 구현한다.

1. React source와 parity matrix 행을 지정한다.
2. fixture와 domain contract를 먼저 고정한다.
3. 공용 SwiftUI component가 필요한지 확인한다.
4. 기본 화면을 구현한다.
5. loading·empty·error·detail 상태를 구현한다.
6. navigation과 sheet action을 연결한다.
7. unit test와 repository test를 추가한다.
8. simulator에서 UI snapshot과 screenshot을 확인한다.
9. 동일 fixture와 대응 viewport의 React reference screenshot을 나란히 비교해 layout, design, information hierarchy, component structure 차이를 기록하고 수정한다.
10. 완료된 행만 parity matrix를 갱신한다.

한 slice의 pull request 또는 작업 단위는 가능한 한 하나의 사용자 목표를 끝까지 포함해야 한다.

## 12. 검증 명령

### Web

```bash
npm run dev
npm run build
```

주요 URL:

- app: `http://127.0.0.1:3001`
- design system: `http://127.0.0.1:3001/design-system`
- design system updates: `http://127.0.0.1:3001/design-system-updates`

### iOS

```bash
cd ios
xcodegen generate
xcodebuild \
  -project TasteBuddy.xcodeproj \
  -scheme TasteBuddy \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build
```

테스트:

```bash
xcodebuild \
  -project TasteBuddy.xcodeproj \
  -scheme TasteBuddy \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  test
```

Design-system preview verification:

```bash
cd ios
xcodegen generate
xcodebuild \
  -project TasteBuddy.xcodeproj \
  -scheme TasteBuddy \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build

# Launch with:
# --design-system-preview
```

App shell preview verification:

```bash
cd ios
xcodegen generate
xcodebuild \
  -project TasteBuddy.xcodeproj \
  -scheme TasteBuddy \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  build

# Launch with:
# --shell-preview
```

Codex에서는 XcodeBuildMCP의 build·test·simulator screenshot·UI snapshot을 우선 사용한다. 필요할 때 simulator browser workflow로 같은 simulator를 Codex 내부 브라우저에 표시한다.

## 13. 화면 비교 체크리스트

- React reference와 같은 fixture·상태·대응 viewport를 사용했는가?
- 화면 frame 안의 주요 영역 위치와 content width가 같은가?
- section 순서가 같은가?
- section 간격, page gutter, card size와 내부 padding이 같은가?
- visible label과 action이 빠지지 않았는가?
- 제목·본문·보조 정보·CTA의 시각적 우선순위가 같은가?
- React component grouping을 다른 native component 구조로 임의 변경하지 않았는가?
- interpretation이 raw metric보다 먼저 보이는가?
- typography, color, radius, border, shadow, icon size가 기존 token과 일치하는가?
- 상단·하단 chrome의 노출 조건이 같은가?
- 같은 상태에서 line wrapping과 content density가 제품 인상을 바꾸지 않는가?
- 이미지가 없을 때 fallback이 같은 의미를 전달하는가?
- loading이 layout을 과도하게 흔들지 않는가?
- empty state가 다음 행동을 설명하는가?
- error가 재시도와 복구 방법을 제공하는가?
- sheet, alert, detail에서 되돌아갈 때 상태가 유지되는가?
- Dynamic Type에서 잘림과 겹침이 없는가?
- VoiceOver 순서와 label이 시각적 위계와 일치하는가?

## 14. 피해야 할 구현

- 현재 native mock screen을 완성본으로 간주하는 것
- 모든 상태를 하나의 거대한 `AppModel`에 추가하는 것
- view에서 Supabase를 직접 호출하는 것
- React의 boolean overlay 상태를 SwiftUI boolean 여러 개로 그대로 옮기는 것
- 화면마다 임의 색상·font·spacing을 선언하는 것
- "native답게" 보이게 한다는 이유로 React layout, component grouping, typography hierarchy를 바꾸는 것
- 기본 SwiftUI component style을 사용해 React reference의 시각적 구조를 대체하는 것
- 기본 `TabView`만 사용하고 web shell action을 생략하는 것
- 숫자와 chart만 늘리고 interpretation을 줄이는 것
- 예약 기능을 빼면서 post-dining feedback까지 함께 제거하는 것
- WebView로 parity 완료를 선언하는 것
- preview fixture와 production data model을 같은 파일에 계속 섞어 두는 것

## 15. 첫 실행 순서

현재 상태에서 feature 화면을 더 덧칠하기 전에 다음 순서로 시작한다.

1. Phase 0 reference screenshot과 fixture를 고정한다.
2. Phase 1의 taste·measurement·feedback contract를 Swift로 확정한다.
3. Phase 2의 token과 핵심 component preview를 완성한다.
4. Phase 3의 custom app shell과 navigation을 교체한다.
5. 이후 Home부터 vertical slice로 parity를 올린다.

이 순서를 지키면 화면별 임시 스타일과 전역 상태가 다시 쌓이는 것을 줄이고, 웹과 iOS가 동일한 layout과 design의 제품 화면을 유지한 채 내부 구현만 각 플랫폼 방식으로 제공할 수 있다.
