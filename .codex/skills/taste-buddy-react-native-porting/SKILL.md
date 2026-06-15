---
name: taste-buddy-react-native-porting
description: Use when porting or reimplementing Taste Buddy React/Vite UI, flows, bottom sheets, overlays, components, nested component trees, component-local logic, or visual fixes into the native SwiftUI app. Prioritizes source-based parity, presentation-mode fidelity, component decomposition, embedded behavior, and low-token iOS build/simulator verification.
---

# Taste Buddy React Native Porting

## Goal

Port React UI into SwiftUI without redesigning it. Match the React source's component tree, presentation mode, copy, tokens, local component logic, and state behavior.

## Efficient Workflow

1. Read only the relevant React source files:
   - route screen in `src/pages/`
   - shared component in `src/components/system/` or `src/components/`
   - primitive component in `src/components/ui/`
   - orchestration in `src/App.tsx` only around the target flow
2. Trace the full source chain before coding:
   - route usage
   - wrapper component
   - list/container component
   - repeated item/card component
   - nested helper/subcomponent
   - primitive component
   - component-local helpers, filters, ranking, fallback, click handlers, and derived labels
   - design tokens / class overrides
   - final effective values after overrides
3. Build a React-to-SwiftUI parity map before coding when the surface contains reusable components:
   - React component name -> SwiftUI component name
   - props/state -> Swift properties/bindings
   - child components -> child views
   - local helper logic -> native helper function/model
   - loading/empty/fallback/error states -> matching native states
   - event handlers/navigation -> matching native actions/routes
4. Classify the React surface before coding:
   - route/full screen
   - `BottomSheetShell`
   - overlay/action sheet
   - reusable component
   - route-level state transition
5. Preserve presentation mode exactly.
   - If React uses `BottomSheetShell`, SwiftUI must use the native bottom-sheet/sheet path, not a full-screen replacement.
   - If React uses an overlay, reuse `ActionOverlayCard` or the closest native overlay component.
6. Reuse native parity components before creating new views:
   - `TasteBuddy/Components/SystemCoreComponents.swift`
   - `TasteBuddy/Components/TBComponents.swift`
   - `TasteBuddy/Features/Auth/AuthEntryView.swift`
   - `TasteBuddy/DesignSystem/TBTheme.swift`
7. Make the smallest native change that restores parity. Avoid screenshots unless the change is visual or the user explicitly asks for visual QA.
8. Lock numeric style parity and fragile component-local logic in tests when the React source exposes concrete values or formulas.
9. Verify with focused iOS build/tests. Use simulator snapshots only to confirm the current surface, not as the design source.

## Low-Token iOS Verification

Default to the lightest verification that matches the risk of the change.

- For explanation-only requests, do not build, launch the simulator, or inspect browser/app state.
- For tiny SwiftUI layout, color, spacing, or copy fixes, read only the touched Swift files and any directly referenced native component.
- Batch related edits before running Xcode. Avoid rebuilding after each small tweak unless the compiler output is needed to continue.
- Prefer one focused build or test run after implementation. Do not relaunch the simulator if a running app can be reused.
- Preserve the current simulator state when possible. Avoid repeating login, search, and navigation flows unless the target screen cannot be reached otherwise.
- Use `batch` for same-screen simulator taps when available.
- Prefer a final screenshot for visual confirmation. Avoid relying on full accessibility-tree dumps after every tap.
- If a simulator snapshot returns a large target list, use it only to identify the next elementRef, then continue with the minimum necessary actions.
- If visual QA is not necessary, stop after build/tests and say that simulator verification was intentionally skipped.
- Summarize only actionable build errors or relevant warnings. Do not paste full Xcode logs.

## Component Decomposition Parity

When React uses components inside components, mirror that boundary in SwiftUI unless the React child is truly trivial and has no styling, state, props, or logic of its own.

- Keep containers separate from repeated items. Example: `CardScrollList` should not absorb `BuddyRecommendationCard`.
- Keep item variants separate when React separates them. Example: buddy, restaurant, chef, ghost, and skeleton cards should be separate SwiftUI views if React defines separate components.
- Preserve child layout semantics, not only the visible result. Example: a React `grow flex-col justify-between` text block should map to a native text-layout view with top metadata and bottom fit label, not just a `VStack` with arbitrary `Spacer`.
- Preserve final token values for color, font, spacing, radius, border, opacity, and truncation. Do not approximate token colors with opacity if React has a dedicated token.
- Preserve accessibility labels and click/tap behavior for each component boundary.

## Component-Local Logic Parity

Before coding, scan the React component body and nearby helpers for behavior hidden inside the UI component.

Treat these as part of the port, not optional implementation detail:

- derived display values: labels, handles, titles, chef names, fallback text
- scoring/ranking/sorting/deduping formulas
- loading, empty, fallback, disabled, and error-state decisions
- event handlers such as `onClick`, `onOpenProfile`, submit, skip, close, back
- feature flags, environment-gated actions, development-only bypasses
- memoized or computed props such as source taste, primary axis, match score, and aria labels

If logic is non-trivial, extract it into a named native helper/model rather than burying it in view layout. Add focused tests for formulas, dedupe, fallback, and route decisions.

## Hard Rules

- React source is the UI source of truth, not captured screenshots.
- Never inspect only the route file. Always include wrapper and primitive files for shared UI.
- Never stop at the first visible component. Search for component definitions inside the file and follow nested helper components before implementing.
- Do not turn a React bottom sheet into a full-screen native screen.
- Use the final cascade/effective value, not the primitive default. If a wrapper overrides a primitive class, mirror the wrapper's final value.
- Do not collapse separate React components into one SwiftUI view when those components have different props, layout, state, accessibility, or logic.
- Do not drop component-local logic just because the visual surface appears simple.
- Do not create a new native component if a parity component already exists.
- Keep token usage low: use `rg`, narrow `sed` ranges, and targeted diffs.
