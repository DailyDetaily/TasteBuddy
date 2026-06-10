# Taste Buddy Native Parity Matrix

This document is the working contract for moving the existing React/Vite Taste Buddy guest app into a full native SwiftUI app.

The goal is not a visual approximation or a new iOS redesign. The React app and its reference screenshots are the visible UI source of truth. The native app must preserve the same layout, design system, information hierarchy, component structure, product loop, visible sections, card semantics, and empty/loading/error states while expressing the internal implementation through Swift models and SwiftUI views.

Reservation booking and Tastick connectivity remain outside the first native scope unless the product scope changes.

## Phase 0 Reference Baseline

The first reproducible web baseline was captured on June 5, 2026 at a `393 x 852` viewport. The manifest and state gaps are tracked in [`Reference/README.md`](./Reference/README.md) and [`Reference/reference-manifest.json`](./Reference/reference-manifest.json).

| Baseline area | Artifact | Status |
| --- | --- | --- |
| Onboarding, intake, calibration entry and first question | `Reference/Web/01` through `07` | Partial |
| Home and global search | `Reference/Web/08`, `14`, `15` | Partial |
| Analysis populated state | `Reference/Web/09` | Partial |
| Dining loading, populated, and guided editor entry states | `Reference/Web/10`, `11`, `18`, `19` | Partial |
| Profile and saved list populated states | `Reference/Web/12`, `13` | Partial |
| Restaurant detail and bookmark sheet | `Reference/Web/16`, `17` | Partial |
| Auth, notification, error and remaining empty/detail states | Not captured | Pending |
| React-generated contract fixtures | `TasteBuddy/Resources/Fixtures` | Partial |
| Native simulator before-state | `Reference/Native/01-onboarding-prototype-368x800.jpg` | Complete |
| Native calibration intro, question, result, and intake | `Reference/Native/02` through `05` | Complete |
| Native design-system preview | `Reference/Native/06`, `Reference/Native/37`, `Reference/Native/54`, `Reference/Native/55` | Complete |
| Native app shell preview | `Reference/Native/07-app-shell-home-368x800.jpg` | Complete |
| Native restaurant detail focus route | `Reference/Native/08-restaurant-detail-route-368x800.jpg` | Complete |
| Native splash and auto-onboarding transition | `Reference/Native/09`, `Reference/Native/10` | Complete |
| Native global search default, results, and empty | `Reference/Native/11` through `13` | Complete |
| Native Home recommendation loading and fallback | `Reference/Native/14`, `Reference/Native/15` | Complete |
| Native Home comment focus read state | `Reference/Native/16` | Complete |
| Native Home uploaded-media guard and local comment store | `Reference/Native/44-home-following-dish-no-uploaded-media-368x800.jpg`, `Reference/Native/45-comments-focus-comment-store-368x800.jpg` | Complete for native no-upload fixture state |
| Native Home/Dining `DishFeedbackCard.tsx` view-model contract | `Reference/Native/46-home-dish-card-contract-368x800.jpg`, `Reference/Native/47-dining-dish-card-contract-368x800.jpg` | Complete for fixture author line, no-upload media guard, taste bubble label chips, detail tags, note preview, and action row |
| Native Home/Dining detail tag metadata and fit row | `Reference/Native/48-home-dish-detail-tags-contract-368x800.jpg`, `Reference/Native/49-dining-dish-detail-tags-contract-368x800.jpg` | Complete for local fixtures: `id`, `label`, `title` metadata and width-fit `+N` row |
| Native Home/Dining TBA dining note and snapshot | `Reference/Native/50-home-native-tba-dish-card-368x800.jpg`, `Reference/Native/51-dining-native-tba-dish-card-368x800.jpg`, `tba-dining-analysis-golden.json` | Complete for local Home/Dining fixture inputs: native `TasteBuddyAgent` matches React `buildDiningNote` and `buildDiningAnalysisSnapshot` golden output |
| Native search overlay and compact result cards | `Reference/Native/52-search-overlay-compact-card-parity-368x800.jpg` | Complete for current Home search result state: `SearchOverlayShell.tsx` chrome and `CompactCard.tsx` media/content/actions slot metrics |
| Native system core component batch | `Reference/Native/53-system-core-components-parity-368x800.jpg` | Complete for `SectionTitle`, `ImageBox`, `ChefAvatar`, `StatusChip`, `EmptyState`, `ActionOverlayCard`, and `BottomSheetShell` preview state |
| Native full design-system inventory and file previews | `Reference/Native/54-design-system-full-inventory-parity-368x800.jpg`, `Reference/Native/55-design-system-file-preview-registry-parity-368x800.jpg` | Complete for React `/design-system` inventory counts: 59 architecture components, 52 file previews, 30 style specs, 20 generic primitives |
| Native backend session foundation smoke | `Reference/Native/59-backend-session-foundation-home-smoke-368x800.jpg` | Complete for app launch smoke after Supabase Swift package/config/session repository wiring; live auth/session data restoration remains tracked in backend rows |
| Native auth entry sheet email/code states | `src/pages/AuthEntryScreen.tsx`, `src/components/system/BottomSheetShell.tsx`, `src/App.tsx`, `src/lib/supabase.ts`; `Reference/Native/60-auth-entry-sheet-email-parity-368x800.jpg`, `Reference/Native/61-auth-entry-sheet-code-parity-368x800.jpg` | Partial: React `AuthEntryForm` email/code layout, bottom-sheet chrome, email `h-auto max-h-[72vh]`, code 95vh stage, sheet footer labels, cancel/options overlays, OTP intent switching, and repository call contract are native/tested; live staging OTP roundtrip and full profile setup/edit flow remain |
| Native onboarding, intake, and calibration React-parity pass | `Reference/Native/17` through `19` | Complete |
| Native Home, Analysis, Dining, and Profile populated-frame parity pass | `Reference/Native/20` through `23` | Partial |
| Native dining feedback menu and taste-word parity pass | `Reference/Native/24`, `Reference/Native/25` | Partial |
| Native restaurant detail and saved-list populated-frame parity pass | `Reference/Native/26`, `Reference/Native/27` | Partial |
| Native secondary routes and global presentation parity pass | `Reference/Native/28` through `36` | Partial |
| Native shared app chrome TSX-parity pass | `Reference/Native/39`, `Reference/Native/40` | Complete |
| Native Analysis radar TSX-parity pass | `Reference/Native/41` | Complete |
| Native Analysis signature and measurement CTA TSX-parity pass | `Reference/Native/42` | Complete |
| Native Analysis insight-summary cards TSX-parity pass | `Reference/Native/43` | Complete |
| Backend staging classification and baseline | `Reference/BACKEND_BASELINE.md` | Blocked |

Phase 0 remains Partial until every in-scope matrix row has the required default, loading, empty, error, and detail references plus deterministic fixture data.

### Native UI Parity Rework Evidence

The `17` through `36` captures are the current React-parity pass. Earlier native captures remain useful implementation history, but they are not substitutes for the paired React-vs-SwiftUI comparison below.

| Surface and state | React reference | Native reference | Visual parity result |
| --- | --- | --- | --- |
| Onboarding first page | `Reference/Web/01-onboarding-default-393x852.png` | `Reference/Native/17-onboarding-parity-368x800.jpg` | Complete for the captured state |
| Preference intake first question | `Reference/Web/03-intake-safety-default-393x852.png` | `Reference/Native/18-preference-intake-parity-368x800.jpg` | Complete for the captured state |
| Calibration first question | `Reference/Web/07-calibration-question-default-393x852.png` | `Reference/Native/19-calibration-question-parity-368x800.jpg` | Complete for the captured state |
| Home populated frame | `Reference/Web/08-home-populated-393x852.png` | `Reference/Native/20-home-parity-368x800.jpg` | Partial: layout and component hierarchy aligned; fixture content and remaining states still differ |
| Analysis populated first viewport | `Reference/Web/09-analysis-populated-393x852.png` | `Reference/Native/42-analysis-signature-parity-368x800.jpg` | Partial: TSX-derived signature, chef-guide, and confidence components align; remaining analysis sections and states are not complete |
| Analysis radar current measurement | `src/components/system/HexRadarChart.tsx`, `src/pages/AnalysisPage.tsx` | `Reference/Native/41-analysis-radar-parity-368x800.jpg` | Complete for current-measurement rendering: geometry, grid, reference path, taste spokes, nodes, labels, comparison footer, disabled navigation, and motion match the TSX contract; historical measurement data remains pending |
| Dining populated frame | `Reference/Web/11-dining-populated-393x852.png` | `Reference/Native/22-dining-parity-368x800.jpg` | Partial: shell and card hierarchy aligned; full feed fixtures and secondary states remain |
| Profile populated frame | `Reference/Web/12-profile-populated-393x852.png` | `Reference/Native/23-profile-parity-368x800.jpg` | Partial: identity and activity hierarchy aligned; fixture values, connections, and edit states remain |
| Dining feedback menu selection | `Reference/Web/18-dining-feedback-menu-select-393x852.png` | `Reference/Native/24-dining-feedback-menu-parity-368x800.jpg` | Complete for the captured editor state |
| Dining feedback taste words | `Reference/Web/19-dining-feedback-taste-words-393x852.png` | `Reference/Native/25-dining-feedback-taste-words-parity-368x800.jpg` | Complete for the captured editor state |
| Restaurant detail populated frame | `Reference/Web/16-restaurant-detail-populated-393x852.png` | `Reference/Native/26-restaurant-detail-parity-368x800.jpg` | Partial: hero and information hierarchy aligned; menu, feedback, and error states remain |
| Saved list populated frame | `Reference/Web/13-saved-list-populated-393x852.png` | `Reference/Native/27-saved-list-parity-368x800.jpg` | Complete for the captured populated state |
| Comments focus | `src/components/social/SocialDishFeedbackCommentFocusScreen.tsx`, `src/pages/DiningPage.tsx` | `Reference/Native/28-comments-focus-parity-368x800.jpg`, `Reference/Native/45-comments-focus-comment-store-368x800.jpg` | Partial: focus layout, composer, local submission state, and local persistence aligned; Supabase mutation sync and paired web capture remain |
| Connection list | `src/pages/ProfilePage.tsx`, `src/components/profile/DiningFriendProfileCard.tsx` | `Reference/Native/29-connection-list-parity-368x800.jpg` | Partial: card and follow-control hierarchy aligned; repository states and paired web capture remain |
| Public profile | `src/pages/ProfilePage.tsx` | `Reference/Native/30-public-profile-parity-368x800.jpg` | Partial: identity and activity hierarchy aligned; live social state and paired web capture remain |
| Taste change | `src/pages/TasteChangePage.tsx`, `src/pages/AnalysisPage.tsx` | `Reference/Native/31-taste-change-parity-368x800.jpg` | Partial: range, taste selector, chart, metrics, and interpretation hierarchy aligned; historical data and gesture parity remain |
| Bookmark sheet | `src/components/restaurant/RestaurantBookmarkSheet.tsx` | `Reference/Native/32-bookmark-sheet-parity-368x800.jpg`, `Reference/Native/57-restaurant-bookmark-local-persistence-368x800.jpg` | Partial: local list-selection, create, cover editor, privacy, move/remove, UserDefaults persistence, pending sync queue, conflict resolver, and sync status row verified; live Supabase sync remains |
| Notifications panel | `src/components/NotificationPanel.tsx` | `Reference/Native/33-notifications-parity-368x800.jpg` | Partial: compact list and unread actions aligned; server events and paired web capture remain |
| App menu | `src/components/AppMenuDrawer.tsx` | `Reference/Native/34-menu-parity-368x800.jpg` | Partial: profile summary, sections, compact rows, and footer aligned; support/auth actions remain |
| Profile identity sheet | `src/components/ProfileIdentitySheetContent.tsx` | `Reference/Native/35-profile-summary-parity-368x800.jpg` | Partial: identity, reference summary, and account-link hierarchy aligned; edit/auth flows remain |
| Quick refinement sheet | `src/pages/QuickTasteCalibrationScreen.tsx` | `Reference/Native/36-quick-refinement-parity-368x800.jpg` | Partial: entry hierarchy aligned; full refinement progression reuses the calibration flow |

## Source Of Truth

| Area | Web source | Native target |
| --- | --- | --- |
| App shell | `src/App.tsx`, `src/components/TopAppBar.tsx`, `src/components/BottomTabBar.tsx` | `TasteBuddy/App`, `TasteBuddy/Features/Main` |
| Design tokens | `src/styles/design-system.css`, `src/constants/designTokens.ts` | `TasteBuddy/DesignSystem/TBTheme.swift` |
| Product components | `src/components/system` | `TasteBuddy/Components` |
| Home | `src/pages/HomePage.tsx`, `src/components/home/HomeUnifiedSearch.tsx`, `src/components/social/TasteMatchFeed.tsx` | `TasteBuddy/Features/Home` |
| Analysis | `src/pages/AnalysisPage.tsx`, `src/components/analysis`, `src/components/system/ProfileConfidenceCard.tsx` | `TasteBuddy/Features/Analysis` |
| Dining | `src/pages/DiningPage.tsx`, `src/components/dining/DishFeedbackCard.tsx`, `src/components/reservation/DiningFeedbackFlow.tsx` | `TasteBuddy/Features/Dining` |
| Profile | `src/pages/ProfilePage.tsx`, `src/components/profile`, `src/components/system/PalateBloomAvatar.tsx` | `TasteBuddy/Features/Profile` |
| Restaurant detail | `src/pages/RestaurantDetailPage.tsx`, `src/components/restaurant` | `TasteBuddy/Components/Shell/AppRouteDestinations.swift` |
| Saved list | `src/pages/SavedRestaurantListPage.tsx`, `src/components/restaurant/RestaurantBookmarkSheet.tsx` | `TasteBuddy/Components/Shell/AppRouteDestinations.swift` |
| Calibration | `src/pages/TasteSurvey*`, `src/pages/QuickTasteCalibrationScreen.tsx`, `src/pages/TasteMeasurementScreen.tsx` | `TasteBuddy/Features/Calibration` |

## UI Layout And Design Parity

This is a completion gate for every screen and state. "SwiftUI-native" refers to state ownership, navigation, lifecycle, accessibility, keyboard, touch, haptics, and presentation mechanics. It does not permit a new layout, a different component hierarchy, or a new visual style.

| Check | Required parity | Evidence required for Complete |
| --- | --- | --- |
| Screen frame and layout | Major regions, content width, section order, scrolling structure, and shell visibility match the React screen | React reference and simulator screenshot from the same fixture/state and corresponding viewport |
| Information hierarchy | Titles, body copy, supporting metadata, interpretation, and actions keep the same priority and placement | Side-by-side review shows no reordered or newly emphasized product information |
| Component structure | Cards, rows, chips, buttons, search, overlays, and sheets preserve the React grouping and semantic role | Component map and rendered screenshot identify the same visible structure |
| Visual design | Typography, colors, spacing, radius, border, shadow, icon scale, media ratio, and density follow the existing Taste Buddy tokens | Token mapping plus screenshot comparison |
| State layout | Loading, empty, error, populated, editor, and detail states preserve the intended frame and do not replace the React hierarchy with a generic native pattern | State-specific React and simulator references |
| Platform differences | Only safe area, keyboard/focus, native sheet mechanics, touch targets, haptics, system gestures, and accessibility adaptations may differ | The difference and rationale are recorded; product hierarchy and design remain unchanged |
| Screenshot comparison | The native frame is reviewed against the React reference as the same product screen, not merely a functionally equivalent screen | Documented visual comparison with no unexplained product-level layout or design difference |

A row cannot be marked Complete when the native screen is only functionally equivalent, uses a default SwiftUI appearance that changes the product design, or has not been compared with the corresponding React reference screenshot.

## App Shell Parity

| Web behavior | Required native behavior | Status |
| --- | --- | --- |
| Splash, onboarding, preference/taste calibration, main shell | Native app should preserve the same progression, with hardware optional | Partial: local `splash -> onboarding -> preferenceIntake -> calibration -> main` phase resolver is tested; Supabase session/Auth repository foundation is wired and unit-tested, while real auth-backed phase/data restoration remains pending |
| Top app bar with profile/back modes, centered title, notification, measurement/search, menu, and right actions | Native top shell should expose equivalent actions where in native scope | Complete |
| Bottom tabs: Home, Analysis, Dining, Profile | Native shell must keep same tab order and labels | Complete |
| Focus/detail surfaces hide main chrome where appropriate | Native route stack should hide top/bottom shell for detail flows | Partial |
| Global search available outside Home | Native search entry should be available from app shell, not only Home | Complete |
| Notifications, menu drawer, profile sheets | Native equivalents required before full parity | Partial |

## Component Map

### Design System Checkpoints

| Checkpoint | Native artifact | Status |
| --- | --- | --- |
| Foundation tokens: neutral colors, disabled/overlay surfaces, spacing, radius, size, typography, shadows, motion, data-viz, icon, and 18pt font cap | `TasteBuddy/DesignSystem/TBTheme.swift` | Complete |
| Launchable SwiftUI preview catalog | `TasteBuddy/Features/DesignSystem/DesignSystemPreviewView.swift`, `--design-system-preview` | Complete |
| Simulator verification for preview catalog | `Reference/Native/06-design-system-preview-368x800.jpg`, `Reference/Native/37-system-components-parity-368x800.jpg`, `Reference/Native/54-design-system-full-inventory-parity-368x800.jpg`, `Reference/Native/55-design-system-file-preview-registry-parity-368x800.jpg`; runtime snapshot includes Foundation, Taste Palette, Core Controls, full inventory, generic primitives, file-only previews, Product Cards, State Recipes | Complete |
| Full web design-system inventory coverage | Native inventory mirrors React `/design-system`: 7 architecture groups, 59 named components, 52 file-preview entries, 30 style specs, and 20 generic primitives | Complete for design-system catalog; feature screens still have separate backend/state parity rows |

| Web component | Native component | Parity requirements | Status |
| --- | --- | --- | --- |
| `PageSection` | `TBPageSection` | 16/18pt title sizes, optional subtitle, 12pt card-stack spacing | Complete |
| `SectionTitle` | `SectionTitle` | 16/18pt title sizes, bold primary text | Complete |
| `SectionCard` | `SectionCard` | 20px radius, 12px padding, white surface, subtle border | Complete |
| `PrimaryButton` | `PrimaryButton` | 48pt height, 10pt radius, dark enabled state, disabled state, button shadow | Complete |
| `FlowBottomCta`, `FlowStepCta` | `TBFlowBottomCTA`, `TBFlowStepCTA` | 140pt bottom fade shell, 20pt horizontal padding, 12pt safe bottom padding, 8pt secondary action gap, optional helper, indicator/topSlot, stepLabel, compact/default CTA size, and primary/secondary visual-disabled variants | Complete for shared component contract; feature-screen adoption continues under each screen row |
| `FlowHeaderBlock`, `CalibrationQuestionHeader`, `StepBadge` | `TBFlowHeaderBlock`, `CalibrationQuestionHeader`, `StepBadge` | top badge row, title/description stack, custom top-left/top-right slots, title scale, question progress badge | Complete for shared component contract and quick-refinement/intake flow usage |
| `OutlineBadge` | `OutlineBadge` | 6pt radius, compact padding, tertiary text, subtle outline | Complete |
| `TCSBadge`, `TCSHintCard` | `TCSBadge`, `TCSHintCard` | gradient TCS badge, nested/standalone hint card, TokenBox icon | Complete for file-preview catalog |
| `Chip` | `Chip`, `NeutralChip` | `xs`/`sm`/`md` geometry, four tones, `soft`/`outline`/`solid`/`text`, leading/trailing symbols | Complete |
| `TasteChip` | `TasteChip` | Taste color mapping, value label, label-only signal color, neutral meta mode | Complete |
| `SelectionCard` | `TBSelectionCard` | 20pt card radius, 16pt padding, 12pt gap, 18pt radio/checkbox indicator, 8pt radio dot, selected shadow, enabled state, trailing slot | Complete for shared component contract; trailing slot verified in Preference Intake and Dining direct-input cards |
| `ImageBox` | `ImageBox`, `TokenBox` | 32/40/48pt media box, 8pt radius, bundled/remote image path, chef/restaurant/menu/person/generic fallback icons | Complete for current native scope |
| `ChefAvatar` | `ChefAvatar` | wraps `ImageBox` chef kind, taste fallback, bundled chef image resolver | Complete for current native scope |
| `StatusChip` | `StatusChip` | 6pt radius, 2x6pt padding, 10pt semibold label, injected foreground/background colors | Complete |
| `EmptyState` | `EmptyState` | centered 48x24pt padding block, optional 32pt icon container, 16pt title, 13pt description, compact CTA | Complete; Home search no-result state now uses it |
| `HospitalityEmptyState` | `HospitalityEmptyState` | momentum-oriented empty state with interpretation icon and optional CTA | Complete for file-preview catalog |
| `TasteProfileAvatar`, `PalateSignatureAvatar`, `PalateOrbAvatar` | same SwiftUI names | profile gradient avatar, halo signature, segmented orb avatar | Complete for design-system catalog |
| `PalateBloomAvatar` | `PalateBloomAvatar` | React-equivalent FNV-1a profile fallback, shape-seeded petals/stars/core, image fallback, 32pt and 64pt simulator verification | Complete |
| `TopAppBar` | `TopAppBar` | 32pt bloom/back mode, optional centered title, 40pt actions, unread badge, measurement/search switch, typed right actions | Complete |
| `BottomTabBar` | `BottomTabBar` | four-tab order, custom Home/Analysis paths, Lucide 24pt icons, 10pt labels, selected semantics | Complete |
| `ProfileConfidenceCard` | `ProfileConfidenceCard` | three stages and copy, measurement age/count, strongest/weakest axis, stale state | Complete |
| `InterpretationCard` | `InterpretationCard` | eyebrow, detail label, 8pt indicator/gradient, description, supporting text, detail action | Complete |
| `TasteTintCard` | `TasteTintCard`, `TasteTintMiniCard` | exact 132x132 shell, 48pt leading box, taste surface/text colors, optional detail and action | Complete |
| `TasteTintCardList`, `CardScrollList`, `TasteAxisMeter`, `ReservationCard`, `InterpretationDetailDrawer` | same SwiftUI names | grid wrapper, horizontal card strip, progress meter, reservation shell, bottom-sheet interpretation drawer | Complete for file-preview catalog |
| `HexRadarChart` | `TasteRadarView` | 320x310 coordinate system, four grid levels, average path, taste spokes, adaptive rounded profile outline, nodes, labels, center mask, reduced-motion-aware 1s animation | Complete |
| `PalateSignatureHeroCard` | `PalateSignatureHeroCard` | six signature rules, delta priority, label/subtitle/description, Current Focus chips, Updated measurement label | Complete |
| `TasteMeasurementMiniCta` | `TasteMeasurementMiniCta` | neutral/alert tones, compact/default padding, bottom/right action placement, 40pt compact action, meta copy | Complete |
| Measurement panels | `TasteMeasurementChecklistPanel`, `TasteMeasurementIntroPanel`, `TasteMeasurementPreparationPanel`, `TasteMeasurementActivePanel`, `TasteMeasurementCompletedPanel` | checklist, intro, preparation, active meter, completed confidence panel | Complete for file-preview catalog |
| Generic `ui/*` primitives | `TBUICard`, `TBUIButton`, `TBUIBadge`, `TBUIInput`, `TBUITextarea`, `TBUISelectTrigger`, `TBUICheckbox`, `TBUIRadioGroup`, `TBUISwitch`, `TBUITabs`, `TBUIAlert`, `TBUIProgress`, `TBUISkeleton`, `TBUISliderPreview`, `TBUIDialogContent`, `TBUISheetContent`, `TBUIPopoverContent`, `TBUITooltipContent`, `TBUIDrawerContent`, `ToastSurface` | native equivalents for the 20 defined-but-unused generic primitives in React design-system inventory | Complete for design-system catalog |
| `TasteInsightSummaryCard` | `TasteInsightSummaryCard` | 16pt taste indicator, increase/decrease summary selection, 18pt arrow box, mini line chart, taste keyword chips, detail action | Complete |
| `ActionOverlayCard` | `ActionOverlayCard` | black 35% backdrop, 320pt max card, 20pt radius, stack/split actions, destructive tone | Complete for current native scope |
| `BottomSheetShell` | `BottomSheetShell`, `BottomSheetCloseButton`, `BottomSheetIconButton` | 95vh stage, 40x6pt handle, 40pt header slots, 32pt icon buttons, footer padding | Partial: shell chrome complete and Quick Refinement adopted; remaining existing sheets still need adoption pass |
| `SearchOverlayShell` | `SearchOverlayShell` | 44pt search field/action, clear button, cancel action, header/body padding, scroll body | Complete for Home search overlay chrome |
| `CompactCard` | `CompactCard` | 20pt radius, 12pt padding/gap, 40pt media slot, independent actions slot | Complete for Home search result rows |
| `HomeUnifiedSearch` | native unified search feature | search trigger, overlay, recent searches, grouped results, bookmark action | Partial: shared overlay shell, compact card action slots, async Kakao/friend repository protocol, fixture loading/error phases, focus card, local/remote merge, duplicate suppression, and local bookmark sheet sync queue aligned; live Kakao Edge Function, Supabase profile RPC, and remote bookmark repository remain |
| `TasteMatchFeed` | `HomeRecommendationSection` + following cards | recommendation mode editor, 132px cards, following dish feed | Partial: mode editor, skeleton, fallback buddy, 132pt metrics, buddy/avatar, restaurant `ImageBox`, chef `ChefAvatar`, and empty/error card states are native; live feed ranking/hydration remains |
| `DishFeedbackCard` | `NativeDishFeedbackCard` | author line, optional user-uploaded media rail, `tasteBubbles` label/color metadata, `detailTags` id/label/title metadata with width-fit `+N` row, TBA-generated note preview, action bar, card action sheet | Partial: Home/Dining fixture card contract, native TBA dining note/snapshot, SocialDishFeedbackCard mapping, feed phase contract, action callbacks, and R2 media policy aligned; live Supabase/R2 lifecycle remains |
| `DiningFeedbackFlow` | `DiningFeedbackSheet` | per-dish feedback, tags, reaction words, reflection note/photo | Partial |
| `DiningFriendProfileCard` | `BuddyProfileRow`, `PublicProfileView` | profile avatar, follow/unfollow, stats, selected profile | Partial |
| `SummaryMetricCard` | `SummaryMetricCard` | 40pt tinted icon block, label/value hierarchy, optional click target | Complete |
| `StatusRow` | `StatusRow` | neutral, success, warning row recipes with compact icon block | Complete |
| `RestaurantHeroCard` and detail cards | `RestaurantDetailView`, `SavedRestaurantListView` | hero, score summary, memorable dishes, menu detail, bookmark sheet | Partial: bookmark sheet create/select/cover/privacy/remove, UserDefaults persistence, pending mutation queue, conflict resolver, and sync status row are verified; saved-list page and live Supabase sync remain |

## Main Tab Matrix

### Calibration

| Web element or behavior | Native requirement | Status |
| --- | --- | --- |
| Survey intro with three interpretation steps | Same progression and calm explanatory copy | Complete |
| Optional context: birth date, sex context, smoking status | Native date and selection controls; answers remain optional | Complete |
| Questions intro and profile intro | Same active-step progression around the question set | Complete |
| Twelve salience/overload questions | Same order, anchors, seven-point labels, and uncertain response | Complete |
| Question response gating | Next action remains disabled until a value or uncertain is selected | Complete |
| Review list with edit action | All 12 responses and their labels are reviewable and editable | Complete |
| Survey scoring and restaurant-ready guidance | Swift output matches neutral and uncertain React golden fixtures | Complete |
| Starter result | Confidence, top axes, caution axis, evidence, and evolving-profile framing | Complete |
| Local profile save and app-shell restoration | Saving persists the profile and restores it on relaunch | Complete |
| Loading and bundled-contract error states | Native loading and retry surfaces | Complete |
| Preference intake before calibration | Seven questions, selection limits, none exclusivity, and draft restore | Complete |
| Supabase measurement persistence and session restoration | Repository-backed write/read with auth session | Partial: Supabase Swift client, backend config, publishable-key guard, and injected session restore are wired/tested; measurement read/write repository is pending |

### Home

| Web element | Native requirement | Status |
| --- | --- | --- |
| Unified search trigger: "레스토랑, 메뉴, 셰프, 버디 검색" + round search button | Same visual trigger and searchable domains | Complete |
| Search overlay shell | Native overlay with query, recent searches, grouped sections | Complete |
| Recent searches | Persist locally, max 5 | Complete |
| Results grouped by restaurant, chef, menu, friends | Same groups and actions | Complete: result rows now use native `CompactCard` media/content/actions slot with record and bookmark actions |
| Bookmark sheet from search results | Native saved-list/bookmark flow | Partial: search result bookmark action opens the shared native bookmark sheet; create/select, cover/privacy, move/remove, local persistence, pending sync queue, and conflict resolver are verified; live Supabase sync remains |
| Taste Match recommendation section | Same section title and `편집` toggle | Complete |
| Recommendation modes: `버디 추천`, `레스토랑 추천`, `셰프 추천` | Same modes and 132px cards | Complete |
| Recommendation skeleton state | Native skeleton cards while loading | Complete |
| Fallback buddy profiles | Native ghost buddy cards | Complete |
| Following dish cards | Native dish card list under `팔로잉 디시 카드` | Partial: list, card route, uploaded-media guard, native TBA note/snapshot, SocialDishFeedbackCard mapping, fixture feed hydration phase, empty/error states, read comments, and local comment count updates are native; Supabase/R2 sync pending |
| Comment focus screen | Native comment detail/focus flow | Partial: focus route, read state, local submission, and local persistence verified; Supabase sync pending |

### Analysis

| Web element | Native requirement | Status |
| --- | --- | --- |
| Section `나의 미각` | Same top section | Partial |
| `PalateSignatureHeroCard` with type label, subtitle, description, Current Focus, Updated | Native card must expose all five elements | Complete |
| Chef translation `InterpretationCard` | Same copy structure, taste gradient indicator, and detail affordance | Complete |
| `ProfileConfidenceCard` | Stage, measurement count, measurement age, strongest/weakest axes, stale refresh state | Complete |
| Radar period selector | Previous/next measurement controls and period label | Partial: 32pt controls, disabled bounds, and `최근 측정` state match; historical measurement repository data is not connected yet |
| Radar chart + "나의 반응 → 기준 반응" comparison | Same comparison labels | Complete for the current-measurement state |
| Measurement mini CTA | Stale/current tone, action label, meta date | Complete |
| Legacy taste profile card | Same summary/detail action | Complete for the summary card and taste-change navigation |
| Legacy special note card | Same summary/detail action | Partial: summary card matches and opens detail; dedicated legacy detail layout is not yet ported |
| Section `세부 분석` horizontal `TasteTintCard` list | Same 132px cards, 48px leading box, taste surface hierarchy for six tastes | Complete |
| Section `인사이트` | Expandable interpretation cards and detail drawer | Partial |
| Taste change page | Native detail view for trend/change chart | Partial: visual structure and local interaction verified; historical repository data and full gestures pending |

### Dining

| Web element | Native requirement | Status |
| --- | --- | --- |
| Section `나의 디시` | Same title and card list | Partial |
| `DishFeedbackCard` author line | Same "author님이 subject의 후기를..." structure | Partial |
| Image rail | Native rail renders only user feedback media with a local feedback asset or remote upload URL, matching React `DishFeedbackImageRail` filtering by `imageSrc` | Complete for no-upload guard and remote URL rendering path; R2 lifecycle pending |
| Taste bubbles | Same `tasteBubbles` label chip row from `DishFeedbackCardViewModel`, preserving `id`, `label`, `title`, and `colorTaste` metadata | Complete for local fixtures, SocialDishFeedbackCard mapping, fixture feed hydration, and React golden fixture; live Supabase hydration pending |
| Detail tag row | Same single-line detail chip row from `DishFeedbackCardViewModel.detailTags`, preserving `id`, `label`, and optional `title`; native chooses the widest fitting row and shows `+N` when needed | Complete for local fixtures, SocialDishFeedbackCard mapping, fixture feed hydration, and React golden fixture; live Supabase hydration pending |
| Dining note preview | Same synthesis summary block | Complete for local fixtures generated by native TBA and React golden fixture; Supabase-backed saved feedback notes pending |
| Action row: like, comment, share, date | Same controls and states | Partial: local like toggle, comment route, share callback, and date label are wired; remote mutation sync pending |
| Card option sheet: delete, edit, share | Native action sheet | Partial: delete/edit/share callbacks and destructive confirmation are wired; backend edit/delete mutation sync pending |
| Dish detail focus screen | Native detail screen with main taste, short record, category tags | Partial |
| Comments focus screen | Native comments flow | Partial: React-style focus layout, comments, composer, and local persistence verified; Supabase sync pending |
| Feedback editor | Native per-dish guided feedback flow, not a generic form | Partial: menu selection and taste-word states match the React references; later tags, reflection media, persistence, and completion states remain |
| Empty state | Same hospitality empty state with measurement CTA | Pending |

### Profile

| Web element | Native requirement | Status |
| --- | --- | --- |
| Profile identity card | Avatar, display name, nickname, settings, followers/following, buddy find | Partial |
| Palate bloom avatar | React profile ranking, dominance geometry, seeded variants, frame, image support, and compact/identity sizes verified | Complete |
| Followers/following views | Native connection list and selected friend profile | Partial: default populated fixtures verified; loading/empty/error/repository states pending |
| Follow/unfollow action button | Same states: follow, following, adding, canceling | Partial: local follow/following states exist; async states and sync pending |
| Section `활동 요약` | Same metric grid | Partial |
| Metrics: 미각 기록, 다이닝 리뷰, 테이스트 리스트, 평균 만족도 | Same labels and values | Partial |
| Saved restaurant list | Native saved-list page | Partial |
| Profile settings/edit/setup sheets | Native sheets with same fields and validation | Partial: identity/account-link sheet matches the React hierarchy; edit/setup validation remains |

## Detail And Overlay Matrix

| Web flow | Native target | Status |
| --- | --- | --- |
| Restaurant detail: detail/feedback/menu detail views | Native `RestaurantDetailView` | Partial |
| Restaurant bookmark sheet and list assignment | Native bookmark sheet | Partial: React-style list selection verified; create/edit and persistence states remain |
| Saved restaurant list page | Native saved list feature | Partial |
| Notification panel | Native notification list/sheet | Partial: compact list, unread badge, mark-all-read, and feedback entry verified; server sync pending |
| App menu drawer and support panels | Native menu/settings/support sheets | Partial: menu hierarchy verified; support destinations remain |
| Auth entry/profile setup/edit/identity sheets | Native auth/profile flow | Partial: `AuthEntryScreen.tsx`, `BottomSheetShell.tsx`, and `App.tsx` sheet flow is now native for email input, 6-digit OTP code step, compact email bottom sheet, full-height code sheet, resend/options overlay, cancel confirmation, dev bypass, `start-with-email` to `link-current-profile` anonymous fallback, and profile account-link launch; live staging OTP roundtrip and profile setup/edit validation remain |
| Search overlay | Native search overlay | Partial: Home `SearchOverlayShell` chrome is ported; async search sources and global repository states remain |
| Interpretation detail drawer | Native interpretation detail sheet | Partial |

## Data And Contract Matrix

| Contract | Web source | Native requirement | Status |
| --- | --- | --- | --- |
| Taste axis IDs and labels | `src/constants/designTokens.ts`, `src/constants/tasteColors.ts` | `TasteAxis` must use same IDs, labels, colors | Partial |
| Measurement snapshot | `src/constants/tasteMeasurementData.ts` | Swift model with measuredAt, profile kind, entries, age/stale helpers | Partial |
| Restaurant-ready guidance | `src/constants/quickTasteCalibrationData.ts` | Swift model for chef-facing guidance | Partial |
| Taste survey catalog and scoring | `src/constants/tasteSurvey*`, `src/lib/tasteSurveyScoring.ts` | Swift Codable catalog and deterministic scoring | Complete |
| Preference intake catalog and selection rules | `src/constants/preferenceIntakeData.ts` | Swift Codable catalog, profile sanitizer, and draft restore | Complete |
| Taste Buddy Agent profile/feed | `src/types/tasteBuddyAgent.ts`, `src/lib/tasteBuddyAgent.ts` | Swift models and deterministic local fixture generation | Partial: native dining note/snapshot slice covers identity/source, local dining analysis input, core lexicon/evidence mapping, dish-kind inference, SocialDishFeedbackCard mapping, fixture feed hydration, and React golden fixture parity; full profile/feed generation, similarity, confidence learning, 6800-entry food knowledge runtime, and live Supabase hydration remain |
| Dining feedback scenario | `src/constants/diningFeedbackData.ts` | Swift course, dish, choice, tag, and dish-kind DTOs | Complete |
| Dining feedback draft and mutation payload | `src/components/reservation/DiningFeedbackFlow.tsx` | Swift per-dish draft and submission contract | Pending |
| Dining detail tags | `src/constants/diningDetailTags.ts` | Swift tag catalog | Partial |
| Reservation catalog | `src/constants/reservationCatalog.ts` | Native read-only catalog only if reservation scope returns | Deferred |
| Supabase Auth/session | `src/lib/supabase.ts` | anonymous session, email OTP linking, restore, logout, deletion | Partial: Supabase Swift package, xcconfig/Info.plist config, `BackendConfiguration`, `SupabaseClientProvider`, `BackendSessionRepository`, `BackendAuthRepository`, and native `AuthEntryModel` are implemented/tested for restore, anonymous session, email OTP request/verify intent mapping, anonymous `start-with-email` fallback to `link-current-profile`, local logout, and `delete-account` function contract; live staging roundtrip remains pending |
| Supabase hydration/persistence | `src/lib/tasteBuddySupabase.ts`, `src/lib/supabase.ts` | Swift repository layer integrated per vertical slice | Pending |
| Database schema and RLS | `supabase/migrations` | DTO parity, ownership policies, positive/negative RLS tests | Pending |
| Social graph and profile RPC | `src/lib/supabase.ts`, `src/lib/tasteBuddyAgentSupabase.ts` | profile search, follow state, connections, visibility | Pending |
| Bookmark sync | `src/lib/restaurantBookmarksSupabase.ts` | UUID-owned list/item mutation without full replace | Partial: native bookmark state, pending mutation queue, conflict resolver, and sync status UI are implemented; Supabase Swift repository, UUID ownership migration, and RLS verification pending |
| Notifications | `src/lib/notificationsSupabase.ts` | server-generated events, unread/read state | Pending |
| R2 public media | `src/lib/mediaAssets.ts`, `upload-profile-avatar` | object-key URL resolution, upload, replace, delete | Pending |
| R2 private reflection media | `upload-feedback-reflection-photo` | private bucket, signed read, ownership, cleanup | Partial: native lifecycle operation and policy contract cover upload/read/replace/delete/account cleanup, private object key, 6MB limit, 1600px target, and JPEG/PNG/WebP types; live Edge Function/R2 verification pending |
| Edge Functions | `supabase/functions` | typed client, auth, validation, rate limit, failure mapping | Pending |
| Place provider integration | Kakao/Google Edge Functions | live details, TTL cache, DB fallback | Pending |
| Offline synchronization | web local fallback behavior | idempotent mutation queue and conflict policy | Pending |
| Backend operations | migrations, seeds, function deploy | staging/prod separation, reproducible deploy and monitoring | Pending |

## Verification Requirements

Every parity slice should pass all relevant checks before being marked complete.

| Check | Requirement |
| --- | --- |
| Build | `xcodebuild`/XcodeBuildMCP build succeeds with no warnings caused by the slice |
| Snapshot | Simulator screenshot or browser stream frame shows the expected screen |
| UI snapshot | Runtime UI snapshot includes the expected Korean labels and controls |
| Web comparison | The same fixture/state is rendered in React and SwiftUI at corresponding viewports; screenshots are compared for layout, design, information hierarchy, and component structure |
| State coverage | Default, loading, empty, populated, and detail states are covered where applicable |
| Copy review | Copy stays calm, premium, interpretation-first, and chef-respectful |

## Migration Order

1. Freeze this parity matrix as the migration checklist.
2. Complete the Swift design/component map before adding more screens.
3. Port Home visible structure: search overlay, recommendation editor, following dish cards.
4. Port Dining visible structure: full `DishFeedbackCard`, detail screen, comments, guided feedback.
5. Port Analysis visible structure: palate signature, confidence, trend/change detail, insight drawer.
6. Port Profile visible structure: identity, metrics, connections, saved list, profile sheets.
7. Port Restaurant detail and saved list flows.
8. Implement backend contracts and repositories incrementally using [`BACKEND_INTEGRATION_PLAN.md`](./BACKEND_INTEGRATION_PLAN.md).
9. Complete RLS, R2 privacy, offline sync, and production hardening.
10. Run web-vs-native visual and UI snapshot regression checks for each screen state.

## Completion Rule

A screen is not considered "ported" when it merely has a native or functionally equivalent screen. It is complete only when every row for that screen is marked complete, its state coverage is verified, and the simulator screenshot has been compared with the corresponding React reference screenshot without unexplained product-level differences in layout, design, information hierarchy, or component structure. Safe area, keyboard, native sheet mechanics, touch/haptic behavior, and accessibility adaptations are allowed only when they preserve the existing Taste Buddy design system and are documented.
