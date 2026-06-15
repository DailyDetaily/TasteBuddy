# Native Reference Baseline

Goal objective:

> 기존 React 웹앱의 제품 경험과 backend contract를 기준으로 Taste Buddy SwiftUI iOS 앱을 완성한다. 예약 기능과 Tastick 연결은 제외하며, 모든 대상 화면·상태·Supabase·DB·R2 연동이 검증되고 parity matrix가 완료될 때만 Goal을 complete로 처리한다.

## Capture Contract

- Captured: 2026-06-05 KST
- Web source: `http://127.0.0.1:3001`
- Viewport: `393 x 852`
- Git branch: `codex/taste-agent-social-network`
- Data state: existing authenticated local browser session; backend environment not verified
- Excluded scope: reservation creation, reservation confirmation, Tastick connection
- Required learning loop: calibration, profile interpretation, post-dining feedback, profile refinement

The images are implementation references, not approval that the native prototype has parity. Account-specific copy, timestamps, counts, and media must be represented by fixtures before a native row can become Complete.

## Captured Screens

| File | Surface | State | Primary React source |
| --- | --- | --- | --- |
| `01-onboarding-default-393x852.png` | Onboarding | First page | `src/App.tsx` onboarding flow |
| `02-onboarding-learning-loop-393x852.png` | Onboarding | Final page | `src/App.tsx` onboarding flow |
| `03-intake-safety-default-393x852.png` | Preference intake | Default, unanswered | `src/constants/preferenceIntakeData.ts` |
| `04-calibration-intro-393x852.png` | Calibration | Intro | `src/pages/TasteSurveyIntroScreen.tsx` |
| `05-calibration-context-birthdate-393x852.png` | Calibration | Context | `src/pages/TasteSurveyContextScreen.tsx` |
| `06-calibration-questions-intro-393x852.png` | Calibration | Questions intro | `src/App.tsx` survey progression |
| `07-calibration-question-default-393x852.png` | Calibration | First question | `src/pages/TasteSurveyScreen.tsx` |
| `08-home-populated-393x852.png` | Home | Populated | `src/pages/HomePage.tsx` |
| `09-analysis-populated-393x852.png` | Analysis | Populated | `src/pages/AnalysisPage.tsx` |
| `10-dining-loading-393x852.png` | Dining | Loading | `src/pages/DiningPage.tsx` |
| `11-dining-populated-393x852.png` | Dining | Populated | `src/pages/DiningPage.tsx` |
| `12-profile-populated-393x852.png` | Profile | Populated | `src/pages/ProfilePage.tsx` |
| `13-saved-list-populated-393x852.png` | Saved list | Populated | `src/pages/SavedRestaurantListPage.tsx` |
| `14-global-search-default-393x852.png` | Global search | Default | `src/components/home/HomeUnifiedSearch.tsx` |
| `15-global-search-results-393x852.png` | Global search | Grouped result | `src/components/home/HomeUnifiedSearch.tsx` |
| `16-restaurant-detail-populated-393x852.png` | Restaurant detail | Populated | `src/pages/RestaurantDetailPage.tsx` |
| `17-bookmark-sheet-393x852.png` | Bookmark | Saved/list assignment | `src/components/restaurant/RestaurantBookmarkSheet.tsx` |
| `18-dining-feedback-menu-select-393x852.png` | Dining feedback | Menu and dish-kind selection | `src/components/reservation/DiningFeedbackFlow.tsx` |
| `19-dining-feedback-taste-words-393x852.png` | Dining feedback | Taste-word reflection | `src/components/reservation/DiningFeedbackFlow.tsx` |

## Native Implementation Baseline

| File | Surface | Verification |
| --- | --- | --- |
| `Native/01-onboarding-prototype-368x800.jpg` | Native onboarding prototype | iPhone 17 simulator, build succeeded, Korean title and `다음` action confirmed through accessibility snapshot |
| `Native/02-calibration-intro-368x800.jpg` | Native calibration intro | Three-step survey progression and bottom CTA verified |
| `Native/03-calibration-question-368x800.jpg` | Native first survey question | Seven-point response set, uncertain action, disabled CTA verified |
| `Native/04-calibration-result-368x800.jpg` | Native survey result | Starter confidence, top axes, caution axis, and save CTA verified |
| `Native/05-preference-intake-368x800.jpg` | Native preference intake | Required selection gating and exclusive none option verified |
| `Native/06-design-system-preview-368x800.jpg` | Native design-system preview | `--design-system-preview` launch arg verified; Foundation, Taste Palette, Core Controls, Product Cards, and State Recipes confirmed by runtime snapshot |
| `Native/07-app-shell-home-368x800.jpg` | Native app shell home | `--shell-preview` launch arg verified; custom top shell, bottom tab order, current-tab accessibility tree, and global search sheet confirmed |
| `Native/08-restaurant-detail-route-368x800.jpg` | Native restaurant detail focus route | Profile saved-list route, hidden main shell, restaurant detail content, and bookmark sheet action verified |
| `Native/09-splash-368x800.jpg` | Native splash | `--splash-preview` launch arg verified; quiet neutral surface and Taste Buddy logo lockup captured |
| `Native/10-launch-auto-onboarding-368x800.jpg` | Native launch transition | `--reset-app-state` launch verified; splash delay completed and onboarding first page restored as the next phase |
| `Native/11-global-search-default-368x800.jpg` | Native global search | `--search-preview` launch arg verified; empty query shows recommended exploration chips |
| `Native/12-global-search-results-368x800.jpg` | Native global search results | `--search-results-preview` launch arg verified; grouped restaurant, chef, and menu results captured |
| `Native/13-global-search-empty-368x800.jpg` | Native global search empty | `--search-empty-preview` launch arg verified; no-results hospitality empty state captured |
| `Native/14-home-recommendation-loading-368x800.jpg` | Native Home recommendation loading | `--recommendation-loading-preview` launch arg verified; 132pt recommendation skeleton and following feed skeleton captured |
| `Native/15-home-recommendation-fallback-368x800.jpg` | Native Home recommendation fallback | `--recommendation-fallback-preview` launch arg verified; ghost buddy recommendation cards captured |
| `Native/16-home-comment-focus-368x800.jpg` | Native Home comment focus | `--comments-preview` launch arg verified; focus chrome hides main shell and shows comment context |

The first native image is a before-state. The calibration images are verified implementation checkpoints, but they do not make the full launch and intake flow complete.

## Native React-Parity Captures

These captures are paired with the corresponding React references for layout, design, information hierarchy, and component-structure review. A successful captured state does not automatically complete the feature's loading, empty, error, backend, or authorization rows.

| File | Paired React reference | Verification |
| --- | --- | --- |
| `Native/17-onboarding-parity-368x800.jpg` | `01-onboarding-default-393x852.png` | Exact onboarding render, copy, indicator, spacing, and bottom CTA hierarchy |
| `Native/18-preference-intake-parity-368x800.jpg` | `03-intake-safety-default-393x852.png` | Shared flow top bar, question hierarchy, selection-card layout, and fade CTA |
| `Native/19-calibration-question-parity-368x800.jpg` | `07-calibration-question-default-393x852.png` | Question frame, response-card hierarchy, uncertain action, and taste-colored progress |
| `Native/20-home-parity-368x800.jpg` | `08-home-populated-393x852.png` | Search, recommendation header/cards, and following-card hierarchy; fixture content still differs |
| `Native/21-analysis-parity-368x800.jpg` | `09-analysis-populated-393x852.png` | Palate signature and building-confidence first viewport aligned |
| `Native/22-dining-parity-368x800.jpg` | `11-dining-populated-393x852.png` | Dining shell and feedback-card structure aligned; full feed-state coverage remains |
| `Native/23-profile-parity-368x800.jpg` | `12-profile-populated-393x852.png` | Identity and activity-summary frame aligned; dynamic values and secondary flows remain |
| `Native/24-dining-feedback-menu-parity-368x800.jpg` | `18-dining-feedback-menu-select-393x852.png` | Guided menu selection replaces the prior generic native form |
| `Native/25-dining-feedback-taste-words-parity-368x800.jpg` | `19-dining-feedback-taste-words-393x852.png` | Taste-word bubble hierarchy, selected state, navigation, and CTA aligned |
| `Native/26-restaurant-detail-parity-368x800.jpg` | `16-restaurant-detail-populated-393x852.png` | Chef media, metadata, tags, and summary-metric hierarchy aligned |
| `Native/27-saved-list-parity-368x800.jpg` | `13-saved-list-populated-393x852.png` | Category tabs and populated saved-list card aligned |
| `Native/28-comments-focus-parity-368x800.jpg` | `src/components/social/SocialDishFeedbackCommentFocusScreen.tsx`, `src/pages/DiningPage.tsx` | Unframed dish card, comments, and fixed composer aligned; paired web capture pending |
| `Native/29-connection-list-parity-368x800.jpg` | `src/pages/ProfilePage.tsx`, `src/components/profile/DiningFriendProfileCard.tsx` | 64pt buddy cards and follow controls aligned; paired web capture pending |
| `Native/30-public-profile-parity-368x800.jpg` | `src/pages/ProfilePage.tsx` | Identity, social counts, action, and activity grid aligned; paired web capture pending |
| `Native/31-taste-change-parity-368x800.jpg` | `src/pages/TasteChangePage.tsx`, `src/pages/AnalysisPage.tsx` | Range tabs, period navigation, taste selector, chart, metrics, and interpretation rows aligned |
| `Native/32-bookmark-sheet-parity-368x800.jpg` | `src/components/restaurant/RestaurantBookmarkSheet.tsx` | List heading, list thumbnails, visibility labels, and add-state controls aligned |
| `Native/33-notifications-parity-368x800.jpg` | `src/components/NotificationPanel.tsx` | Unread badge, mark-all-read, compact notification cards, and type color coding aligned |
| `Native/34-menu-parity-368x800.jpg` | `src/components/AppMenuDrawer.tsx` | Compact profile summary, section labels, menu rows, and footer action aligned |
| `Native/35-profile-summary-parity-368x800.jpg` | `src/components/ProfileIdentitySheetContent.tsx` | Identity, reference summary, and account-link card hierarchy aligned |
| `Native/36-quick-refinement-parity-368x800.jpg` | `src/pages/QuickTasteCalibrationScreen.tsx` | Interpretation-first header, refinement summary, and primary action aligned |
| `Native/37-system-components-parity-368x800.jpg` | `src/components/system/Chip.tsx`, `TasteChip.tsx`, `TasteTintCard.tsx`, `InterpretationCard.tsx`, `ProfileConfidenceCard.tsx` | TSX-derived chip variants, exact 132pt taste cards, compact interpretation card, and three-stage confidence card verified in the native catalog |
| `Native/38-analysis-system-components-parity-368x800.jpg` | `09-analysis-populated-393x852.png` | Shared TSX-derived chef guide and profile confidence components verified in the real Analysis first viewport |
| `Native/39-app-chrome-home-parity-368x800.jpg` | `08-home-populated-393x852.png`, `src/components/TopAppBar.tsx`, `src/components/BottomTabBar.tsx` | Shared 32pt profile bloom, 40pt top actions, unread badge, custom tab icons, labels, and selected state verified |
| `Native/40-app-chrome-detail-parity-368x800.jpg` | `16-restaurant-detail-populated-393x852.png`, `src/components/TopAppBar.tsx` | Same shared top bar verified in back/title/right-actions detail mode while main bottom chrome remains hidden |
| `Native/41-analysis-radar-parity-368x800.jpg` | `src/components/system/HexRadarChart.tsx`, `src/pages/AnalysisPage.tsx` | TSX-derived 320x310 geometry, grid, average path, taste spokes, adaptive outline, nodes, labels, comparison footer, and current-measurement navigation state verified |
| `Native/42-analysis-signature-parity-368x800.jpg` | `09-analysis-populated-393x852.png`, `src/components/analysis/PalateSignatureHeroCard.tsx` | Delta-derived signature label/copy, Current Focus chips, Updated label, chef guide, and confidence hierarchy verified; measurement CTA action also opens quick refinement |
| `Native/43-analysis-insight-summary-parity-368x800.jpg` | `src/components/system/TasteInsightSummaryCard.tsx`, `TastePointArrowBox.tsx`, `TasteLineChart.tsx` | Shared taste-change and special-note cards now use the React indicator, signal rows, chart, keyword chips, and detail affordance structure |
| `Native/44-home-following-dish-no-uploaded-media-368x800.jpg` | `src/components/dining/DishFeedbackCard.tsx` | Following dish card media rail renders only user feedback media and excludes chef/restaurant portrait placeholders |
| `Native/45-comments-focus-comment-store-368x800.jpg` | `src/components/social/SocialDishFeedbackCommentFocusScreen.tsx`, `src/pages/DiningPage.tsx` | Comment focus composer submission persists locally and updates the source card comment count |
| `Native/46-home-dish-card-contract-368x800.jpg` | `src/components/dining/DishFeedbackCard.tsx`, `src/components/social/SocialDishFeedbackCard.tsx` | Home card author line, taste bubble label chips, detail tags, note preview, and action row verified |
| `Native/47-dining-dish-card-contract-368x800.jpg` | `src/components/dining/DishFeedbackCard.tsx` | Dining card view-model contract verified with the same shared native card component |
| `Native/48-home-dish-detail-tags-contract-368x800.jpg` | `src/components/dining/DishFeedbackCard.tsx` | Home card detail tag metadata and width-fit `+N` row verified |
| `Native/49-dining-dish-detail-tags-contract-368x800.jpg` | `src/components/dining/DishFeedbackCard.tsx` | Dining card detail tag metadata and width-fit `+N` row verified |
| `Native/50-home-native-tba-dish-card-368x800.jpg` | `src/lib/tasteBuddyAgent.ts`, `src/components/dining/DishFeedbackCard.tsx` | Home following dish card now renders native TBA-generated dining note, taste bubbles, and detail tags from React golden fixture parity |
| `Native/51-dining-native-tba-dish-card-368x800.jpg` | `src/lib/tasteBuddyAgent.ts`, `src/pages/DiningPage.tsx`, `src/components/dining/DishFeedbackCard.tsx` | Dining card now renders native TBA-generated dining note, taste bubbles, and detail tags from React golden fixture parity |
| `Native/52-search-overlay-compact-card-parity-368x800.jpg` | `src/components/search/SearchOverlayShell.tsx`, `src/components/system/CompactCard.tsx`, `src/components/home/HomeUnifiedSearch.tsx` | Home search results now render with native shared search overlay chrome and compact card media/content/actions slots |
| `Native/53-system-core-components-parity-368x800.jpg` | `src/components/system/SectionTitle.tsx`, `ImageBox.tsx`, `ChefAvatar.tsx`, `StatusChip.tsx`, `EmptyState.tsx`, `ActionOverlayCard.tsx`, `BottomSheetShell.tsx` | Native design-system catalog now renders the next shared system component batch with React-derived metrics and sheet/overlay chrome |
| `Native/54-design-system-full-inventory-parity-368x800.jpg` | `http://127.0.0.1:3001/design-system`, `src/pages/DesignSystemPage.tsx`, `src/components/design-system/inventory.ts` | Native catalog now mirrors the full React design-system inventory counts: 59 architecture components, 52 file previews, 30 style specs, and 20 generic primitives |
| `Native/55-design-system-file-preview-registry-parity-368x800.jpg` | `src/components/design-system/filePreviewRegistry.tsx` | Native catalog includes file-only preview entries, measurement panels, reservation panel, and design-system component file chips |
| `Native/56-flow-bottom-selection-sheet-adoption-368x800.jpg` | `src/components/system/FlowBottomCta.tsx`, `FlowStepCta.tsx`, `SelectionCard.tsx`, `BottomSheetShell.tsx`, `FlowHeaderBlock.tsx` | Quick refinement sheet now uses native BottomSheetShell, header slots, FlowHeaderBlock top slots/status chip, fixed footer CTA, and the expanded shared Flow/Selection component contract |
| `Native/57-restaurant-bookmark-local-persistence-368x800.jpg` | `src/components/restaurant/RestaurantBookmarkSheet.tsx`, `src/pages/SavedRestaurantListPage.tsx` | Bookmark sheet now restores a locally persisted created list, select mode, saved state, list visibility copy, and remove/add affordance from the native bookmark record contract |
| `Native/62-dining-feedback-taste-map-parity-368x800.jpg` | `src/components/reservation/DiningFeedbackFlow.tsx` | Current 72-word map verified with deterministic placement, entrance motion, centered focus, ordered main/secondary selection, pan/zoom/snap interaction, and candidate card progression |
| `Native/63-dining-feedback-detail-tags-parity-368x800.jpg` | `src/components/reservation/DiningFeedbackFlow.tsx`, `src/constants/diningDetailTags.ts` | Detail editor verified with active taste hero, recommended/selected tags, custom entry, reflection actions, PhotosPicker launch, and fixed completion CTA |
| `Native/64-dining-feedback-result-card-parity-368x800.jpg` | `src/components/reservation/DiningFeedbackFlow.tsx` | Local result card verified with taste mesh, photo placeholder, ordered taste chips, generated note, and save CTA |

## State Coverage Baseline

| Feature | Default | Loading | Empty | Error | Detail or editor | Phase 0 result |
| --- | --- | --- | --- | --- | --- | --- |
| Splash, onboarding and intake | Captured and simulator verified | Verified | N/A | Retry implemented | Auto launch transition and seven-question editor verified | Partial |
| Calibration and profile result | Captured and simulator verified | Verified | N/A | Retry implemented | Review and result verified | Partial |
| Home and unified search | Captured and simulator verified | Recommendation loading verified | Search empty verified | Pending | Search default, grouped result, recommendation fallback, shared search overlay/card, comment focus, and native TBA dish-card snapshot verified | Partial |
| Analysis | React-parity first viewport and current-measurement radar verified | Pending | No measurement pending | Pending | Historical radar navigation, insight, and trend remain | Partial |
| Dining feedback | Menu, 72-word map, detail tags, reflection, PhotosPicker, and result-card states verified | Captured | Pending | Photo loading error handled | Ordered tastes/tags/note/local photo persist and render in the feed; remote Supabase/R2 submission remains | Partial |
| Profile and connections | React-parity profile, connection-list, and public-profile frames verified | Pending | Pending | Pending | Follow sync and edit/setup pending | Partial |
| Saved list and bookmark | React-parity saved-list and bookmark-selection frames verified | Pending | Pending | Pending | Create/edit/list persistence pending | Partial |
| Restaurant detail | React-parity populated frame verified | Pending | Pending | Pending | Menu/feedback pending | Partial |
| Auth, notifications, global menu | Notification, menu, identity, and refinement presentations verified | Pending | Pending | Pending | Supabase Auth, support destinations, and account lifecycle pending | Partial |

## Reproducible Fixtures

Run from the repository root:

```bash
node ios/Tools/generate-contract-fixtures.mjs
```

Generated resources:

- `TasteBuddy/Resources/Fixtures/quick-calibration-golden.json`
- `TasteBuddy/Resources/Fixtures/taste-survey-golden.json`
- `TasteBuddy/Resources/Fixtures/preference-intake.json`
- `TasteBuddy/Resources/Fixtures/dining-feedback-scenario.json`
- `TasteBuddy/Resources/Fixtures/tba-dining-analysis-golden.json`

These files are generated from the current React contracts. Swift golden tests must fail when the deterministic contract drifts.

## Remaining Phase 0 Captures

- Web splash and web profile result
- Home comment submission, paired comment-focus web capture, and full repository-backed loading states
- Analysis no-measurement, stale, insight detail, and paired taste-change web capture
- Dining empty, error, dish detail, paired comments web capture, and remote feedback save result
- Profile connection/public-profile paired web captures, async follow state, edit/setup, and avatar
- Restaurant menu detail, feedback detail, information suggestion
- Auth, paired notification/menu web captures, support destinations, logout, and account deletion

Phase 0 is complete only when every in-scope parity row has a reproducible fixture and required state reference. The current baseline is intentionally marked Partial.

Backend environment findings and the staging safety gate are recorded in [`BACKEND_BASELINE.md`](./BACKEND_BASELINE.md).
