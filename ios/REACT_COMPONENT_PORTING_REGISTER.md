# React Component Porting Register

This document structures the React screen flow and TSX component usage before continuing the SwiftUI native rebuild. It exists to keep the migration component-first: port the React components that are actually used, verify their variants, then compose native screens from those SwiftUI components.

The native app is not a redesign. SwiftUI components should preserve the React layout, information hierarchy, component grouping, token usage, state variants, and screen role. Platform adaptation means lifecycle, navigation, sheet, keyboard, accessibility, touch, and haptic behavior only.

## Scope Rule

Component porting order is decided by:

1. First native scope from `NATIVE_MIGRATION_GUIDE.md`
2. Actual React screen reachability and usage frequency
3. Product/component risk: shell, flow CTA, search, feedback, profile, and restaurant cards are higher priority than isolated one-off visuals
4. Current parity blockers in `PARITY_MATRIX.md`

Frequency alone is not enough. A component used by one critical screen, such as `DishFeedbackCard.tsx`, can outrank a widely used low-risk token wrapper when it blocks a required product loop.

Excluded from the first native consumer scope unless referenced by an in-scope screen:

- design-system and development preview pages
- TBA admin/content pipeline screens
- reservation creation/confirmation
- Tastick connection

## React Screen Flow

The consumer app flow is controlled by `src/App.tsx`.

```text
splash
  -> onboarding
  -> intake
  -> calibration
       intro
       -> context
       -> questionsIntro
       -> questions
       -> profileIntro
       -> review
       -> result
  -> main
       Home
       Analysis
       Dining
       Profile
       Saved list
       Restaurant detail / menu detail
       Comments focus
       Connection / public profile
       Notification / menu / auth / profile sheets
```

Out-of-first-scope app states still present in React:

```text
tastick
measurement hardware flow
improve-accuracy precision flow
reservation creation/confirmation
```

These are not deleted from the analysis, but they should not drive first-scope native completion.

## Screen TSX Inventory

Consumer in-scope or supporting screens:

| Flow area | React screen TSX | Current native target |
| --- | --- | --- |
| Splash | `src/pages/SplashScreen.tsx` | `TasteBuddy/Features/Launch/SplashView.swift` |
| Onboarding | `src/pages/OnboardingScreen.tsx` | `TasteBuddy/Features/Onboarding/OnboardingView.swift` |
| Preference intake | `src/pages/PreferenceIntakeScreen.tsx` | `TasteBuddy/Features/Intake/PreferenceIntakeFlowView.swift` |
| Calibration intro/context/question/review/result | `src/pages/TasteSurveyIntroScreen.tsx`, `TasteSurveyContextScreen.tsx`, `TasteSurveyScreen.tsx`, `TasteSurveyReviewScreen.tsx`, `TasteSurveyResultScreen.tsx` | `TasteBuddy/Features/Calibration/CalibrationFlowView.swift`, `TasteBuddy/Features/Profile/ProfileResultView.swift` |
| Home | `src/pages/HomePage.tsx` | `TasteBuddy/Features/Home/HomeView.swift` |
| Analysis | `src/pages/AnalysisPage.tsx`, `src/pages/TasteChangePage.tsx`, `src/pages/QuickTasteCalibrationScreen.tsx` | `TasteBuddy/Features/Analysis/AnalysisView.swift`, route destinations |
| Dining | `src/pages/DiningPage.tsx` | `TasteBuddy/Features/Dining/DiningView.swift` |
| Profile | `src/pages/ProfilePage.tsx` | `TasteBuddy/Features/Profile/ProfileView.swift` |
| Saved list | `src/pages/SavedRestaurantListPage.tsx` | route destinations |
| Restaurant detail | `src/pages/RestaurantDetailPage.tsx` | route destinations |
| Auth/profile setup | `src/pages/AuthEntryScreen.tsx`, profile sheet components | shell sheets |
| Accuracy support | `src/pages/ImproveAccuracyScreen.tsx` | later native support/precision surface |

React screens outside first native consumer scope:

| Area | React screen TSX | Native status |
| --- | --- | --- |
| Reservation confirmation | `src/pages/ReservationConfirmationScreen.tsx` | Deferred |
| Tastick intro/connect | `src/pages/TastickIntroScreen.tsx`, `src/pages/TastickConnectScreen.tsx` | Deferred |
| TBA admin | `src/pages/TbaAdminPage.tsx` | Not a consumer native screen |
| Design/dev previews | `DesignSystemPage.tsx`, `DesignSystemPreviewPage.tsx`, `FigmaWorksPreviewPage.tsx`, `FlowIntroScreen.tsx` | SwiftUI preview/catalog reference only |

## Usage Snapshot

Calculated from local TSX import graph:

| Metric | Count |
| --- | ---: |
| TSX files under `src` | 243 |
| TSX/TS files reachable from `src/App.tsx` | 200 |
| Consumer-scope reachable files | 133 |
| Consumer/supporting screen TSX files | 18 |
| Component TSX files under `src/components` | 158 |

## Component Porting Order

## Design-System Full Inventory Batch

This batch mirrors the full React `/design-system` surface, not only the components visible in the first native preview viewport.

- React sources: `src/pages/DesignSystemPage.tsx`, `src/components/design-system/inventory.ts`, `src/components/design-system/componentStyleSpecs.ts`, `src/components/design-system/filePreviewRegistry.tsx`, `src/constants/designTokens.ts`, `src/styles/design-system.css`.
- Native sources: `TasteBuddy/DesignSystem/TBTheme.swift`, `TasteBuddy/Components/DesignSystemFullComponents.swift`, `TasteBuddy/Features/DesignSystem/DesignSystemPreviewView.swift`.
- Coverage now tracked by test: 7 architecture groups, 59 component names, 52 file-preview entries, 30 style specs, 32 currently-used components, and 20 generic primitives.
- File-only components included: `TCSHintCard`, measurement panels, `ReservationCard`, generic `ui/card`, `ui/button`, `ui/badge`, `ui/input`, `ui/textarea`, `ui/select`, and the screen-preview entries represented by existing native route/screen previews or native catalog panels.
- Verification: `SystemParityComponentTests.testNativeDesignSystemInventoryMirrorsReactDesignSystemPage`, `testNativeThemeMirrorsFullReactDesignTokenLayer`, and simulator captures `Reference/Native/54-design-system-full-inventory-parity-368x800.jpg`, `Reference/Native/55-design-system-file-preview-registry-parity-368x800.jpg`.

Status meanings:

- `Complete`: React contract is represented by SwiftUI component and tested/captured for current native scope.
- `Partial`: native component exists, but variants, states, screen coverage, or backend-connected behavior remain.
- `Pending`: should be ported before relying on a custom one-off SwiftUI replacement.
- `Deferred`: not needed for first native scope unless product scope changes.

| Priority | React component TSX | Usage signal | SwiftUI target | Status |
| ---: | --- | --- | --- | --- |
| 1 | `src/components/system/PrimaryButton.tsx` | 16 screens | `PrimaryButton` | Complete for core variants |
| 2 | `src/components/system/FlowBottomCta.tsx` | 14 screens | `TBFlowBottomCTA`, `TBFlowStepCTA`, `FlowBottomCtaMetrics` | Complete for shared component contract: topSlot, helper, split/secondary actions, compact/default CTA sizes, and visual-disabled variants tested |
| 3 | `src/components/system/OutlineBadge.tsx` | 13 screens | `OutlineBadge` | Complete |
| 4 | `src/components/system/SectionTitle.tsx` | 11 screens | `SectionTitle`, `TBPageSection` | Complete for md/lg title scale |
| 5 | `src/components/SectionCard.tsx` | 10 screens / 21 direct imports | `SectionCard` | Complete for core card |
| 6 | `src/components/system/TasteChip.tsx` | 9 screens | `TasteChip` | Complete for current variants |
| 7 | `src/components/system/PalateBloomAvatar.tsx` | 8 screens | `PalateBloomAvatar` | Complete |
| 8 | `src/components/TopAppBar.tsx` | 8 screens | `TopAppBar` | Complete for current shell |
| 9 | `src/components/BottomTabBar.tsx` | app shell | `BottomTabBar` | Complete for current shell |
| 10 | `src/components/system/SelectionCard.tsx` | 8 screens | `TBSelectionCard`, `SelectionCardMetrics` | Complete for shared component contract: radio/checkbox geometry, enabled state, and trailing slot verified in real flow call sites |
| 11 | `src/components/system/ImageBox.tsx` | 6 screens | `ImageBox`, `TokenBox` | Complete for current native image/fallback contract |
| 12 | `src/components/system/Chip.tsx` | 6 screens | `Chip`, `NeutralChip` | Complete for token matrix |
| 13 | `src/components/system/PageSection.tsx` | 6 screens | `TBPageSection` | Complete |
| 14 | `src/components/system/FlowStepCta.tsx` | 6 screens | `TBFlowStepCTA` | Complete for shared component contract; remaining work is screen-by-screen adoption where old local CTAs still exist |
| 15 | `src/components/system/CardScrollList.tsx` | 6 screens | horizontal card list | Partial |
| 16 | `src/components/system/ActionOverlayCard.tsx` | 6 screens | `ActionOverlayCard` | Complete for stack/split action overlay chrome |
| 17 | `src/components/system/StepIndicator.tsx` | 6 screens | `TBStepIndicator`, `StepIndicatorMetrics` | Complete |
| 18 | `src/components/system/CardDetailLabel.tsx` | 5 screens | `CardDetailLabel` | Complete for Analysis use |
| 19 | `src/components/system/ChefAvatar.tsx` | 5 screens | `ChefAvatar` | Complete for current bundled/remote/fallback image path |
| 20 | `src/components/system/StatusChip.tsx` | 5 screens | `StatusChip` | Complete |
| 21 | `src/components/system/BottomSheetShell.tsx` | 5 screens | `BottomSheetShell`, `BottomSheetCloseButton`, `BottomSheetIconButton` | Partial: shell chrome complete and Quick Refinement adopted; existing sheet adoption pass remains |
| 22 | `src/components/measurement/TasteMeasurementMiniCta.tsx` | 5 screens | `TasteMeasurementMiniCta` | Complete for current variants |
| 23 | `src/components/system/InterpretationCard.tsx` | 5 screens | `InterpretationCard` | Complete for current variants |
| 24 | `src/components/system/ProfileConfidenceCard.tsx` | 5 screens | `ProfileConfidenceCard` | Complete |
| 25 | `src/components/search/SearchOverlayShell.tsx` | 5 screens | `SearchOverlayShell` | Complete for current Home search overlay chrome |
| 26 | `src/components/search/TasteWordSearch.tsx` | 5 screens | taste-word search | Pending |
| 27 | `src/components/restaurant/RestaurantBookmarkSheet.tsx` | 4 screens | `RestaurantBookmarkNativeSheet`, `RestaurantBookmarkList`, `RestaurantBookmarkRecord` | Partial: local select/create, cover editor, privacy flag, move/remove, UserDefaults persistence, pending mutation queue, conflict resolver, and sync status UI verified; live Supabase sync remains |
| 28 | `src/components/home/HomeCards.tsx` | 4 screens | home/chef cards | Partial |
| 29 | `src/components/home/HomeUnifiedSearch.tsx` | 4 screens | native unified search | Partial: shared shell/card/action slots, async Kakao/friend repository protocol, fixture loading/error phases, focus card, local/remote merge, duplicate suppression, and bookmark sheet sync queue now ported; live Kakao/Supabase repositories remain |
| 30 | `src/components/system/CompactCard.tsx` | 4 screens | `CompactCard` | Complete for current search-result media/content/actions slot contract |
| 31 | `src/components/profile/DiningFriendActionButton.tsx` | 4 screens | friend action button | Partial |
| 32 | `src/components/profile/DiningFriendProfileCard.tsx` | 4 screens | buddy profile row/card | Partial |
| 33 | `src/components/restaurant/RestaurantInfoCard.tsx` | 4 screens | restaurant info card | Partial |
| 34 | `src/components/restaurant/RestaurantScoreSummaryCard.tsx` | 4 screens | restaurant score summary | Partial |
| 35 | `src/components/system/EmptyState.tsx` | 4 screens | `EmptyState` | Complete for current native contract; Home search empty now uses it |
| 36 | `src/components/home/ChefMatchCard.tsx` | 4 screens | chef match card | Partial |
| 37 | `src/components/restaurant/RestaurantHeroCard.tsx` | 4 screens | restaurant hero card | Partial |
| 38 | `src/components/restaurant/RestaurantInfoSuggestionSheet.tsx` | 4 screens | info suggestion sheet | Partial |
| 39 | `src/components/restaurant/RestaurantMemorableDishCard.tsx` | 4 screens | memorable dish card | Partial |
| 40 | `src/components/restaurant/RestaurantMenuDetailView.tsx` | 4 screens | restaurant menu detail | Partial |
| 41 | `src/components/system/FlowHeaderBlock.tsx` | 3 screens | `TBFlowHeaderBlock` | Complete for shared component contract: custom top slots, title scale, and real flow usage covered |
| 42 | `src/components/system/TasteTintCard.tsx` | 3 screens | `TasteTintCard`, `TasteTintMiniCard` | Complete for current variants |
| 43 | `src/components/dining/DishFeedbackCard.tsx` | 2 screens, critical learning loop | `NativeDishFeedbackCard` | Partial: TBA local slice, SocialDishFeedbackCard mapping, feed phase contract, action callbacks, empty/error adoption, and R2 media lifecycle policy complete; live Supabase/R2 states pending |
| 44 | `src/components/system/HexRadarChart.tsx` | 2 screens | `TasteRadarView` | Complete for current measurement |
| 45 | `src/components/social/TasteMatchFeed.tsx` | Home critical | recommendation/feed section | Partial: mode editor, skeleton/fallback, 132pt metrics, buddy/avatar, restaurant `ImageBox`, chef `ChefAvatar`, fixture cards, and empty/error states ported; live ranking/hydration pending |
| 46 | `src/components/social/SocialDishFeedbackCard.tsx` | Home feed critical | shared dish card wrapper | Partial: `TasteMatchFeedItem -> DiningDishFeedbackItem` native TBA mapping and fixture hydration verified; live Supabase feed source pending |
| 47 | `src/components/social/SocialDishFeedbackCommentFocusScreen.tsx` | comments critical | comments focus view | Partial |
| 48 | `src/components/reservation/DiningFeedbackFlow.tsx` | Dining feedback critical; reservation creation excluded | `DiningFeedbackSheet` | Partial |
| 49 | `src/components/system/TasteInsightSummaryCard.tsx` | Analysis insight | `TasteInsightSummaryCard` | Complete for current cards |
| 50 | `src/components/system/TasteLineChart.tsx` | Analysis insight | `TasteLineChart` | Complete for current cards |

## Implementation Rule

For each component in the order above:

1. Read the React TSX and direct dependencies.
2. Record props, variants, visual tokens, states, and interaction hooks.
3. Implement or refine the SwiftUI component in the shared layer when reusable, or feature layer when truly feature-specific.
4. Add a focused unit/contract test when the component has deterministic geometry, token, state, or data mapping.
5. Add or update a simulator reference screenshot when the component affects visible product parity.
6. Replace one-off screen markup with the SwiftUI component.
7. Update `PARITY_MATRIX.md` only for the states actually verified.

Do not build screens from custom one-off SwiftUI markup when the equivalent React component has not been evaluated. Temporary one-offs must be marked as prototype debt in `PARITY_MATRIX.md`.

## Immediate Next Component Batch

The next native batch should unblock Phase 5 Home while replacing remaining one-off structures with the newly ported core components:

Completed in this batch:

1. `HomeUnifiedSearch.tsx` async states, fixture Kakao/friend repository hooks, focus card, and local/remote result merge
2. `RestaurantBookmarkSheet.tsx` native pending mutation queue, sync status, and local/remote conflict resolver contract
3. `TasteMatchFeed.tsx` recommendation mini-card media wrappers around `ImageBox`, `ChefAvatar`, and `PalateBloomAvatar`
4. `SocialDishFeedbackCard.tsx` native TBA view-model mapping
5. remaining `DishFeedbackCard.tsx` action callbacks, Home empty/error adoption, feed phase contract, and R2 media lifecycle policy

Completed in the live-staging backend batch so far:

1. Supabase Swift package, xcconfig/Info.plist backend configuration, publishable-key guard, client provider, injected session repository, and app-start session restore foundation
2. React `supabase.ts` Auth contract wrapper for anonymous session, email OTP send/verify, link-current-profile, local logout, and `delete-account` Edge Function

Remaining live-staging backend batch should attach repository implementations without changing the visible component structure:

1. Live staging Auth roundtrip verification with local `Secrets.local.xcconfig` values, deep link callback, and account deletion cleanup assertions
2. Kakao place Edge Function repository and profile search RPC repository
3. Bookmark Supabase repository with UUID ownership migration/RLS verification
4. Dining feedback/comment mutation repository and R2 private media Edge Function lifecycle
5. paired React/simulator screenshot comparison for these live states
