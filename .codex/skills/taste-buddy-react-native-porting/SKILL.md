---
name: taste-buddy-react-native-porting
description: Use when porting or reimplementing Taste Buddy React/Vite UI, flows, bottom sheets, overlays, or components into the native SwiftUI app. Prioritizes source-based parity, presentation-mode fidelity, and low-token workflow.
---

# Taste Buddy React Native Porting

## Goal

Port React UI into SwiftUI without redesigning it. Match the React source's component structure, presentation mode, copy, tokens, and state behavior.

## Efficient Workflow

1. Read only the relevant React source files:
   - route screen in `src/pages/`
   - shared component in `src/components/system/` or `src/components/`
   - primitive component in `src/components/ui/`
   - orchestration in `src/App.tsx` only around the target flow
2. Trace the full source chain before coding:
   - route usage
   - wrapper component
   - primitive component
   - design tokens / class overrides
   - final effective values after overrides
3. Classify the React surface before coding:
   - route/full screen
   - `BottomSheetShell`
   - overlay/action sheet
   - reusable component
   - route-level state transition
4. Preserve presentation mode exactly.
   - If React uses `BottomSheetShell`, SwiftUI must use the native bottom-sheet/sheet path, not a full-screen replacement.
   - If React uses an overlay, reuse `ActionOverlayCard` or the closest native overlay component.
5. Reuse native parity components before creating new views:
   - `TasteBuddy/Components/SystemCoreComponents.swift`
   - `TasteBuddy/Components/TBComponents.swift`
   - `TasteBuddy/Features/Auth/AuthEntryView.swift`
   - `TasteBuddy/DesignSystem/TBTheme.swift`
6. Make the smallest native change that restores parity. Avoid screenshots unless the user explicitly asks for visual QA.
7. Lock numeric style parity in tests when the React source exposes concrete values.
8. Verify with focused iOS build/tests. Use simulator snapshots only to confirm the current surface, not as the design source.

## Hard Rules

- React source is the UI source of truth, not captured screenshots.
- Never inspect only the route file. Always include wrapper and primitive files for shared UI.
- Do not turn a React bottom sheet into a full-screen native screen.
- Use the final cascade/effective value, not the primitive default. If a wrapper overrides a primitive class, mirror the wrapper's final value.
- Do not create a new native component if a parity component already exists.
- Keep token usage low: use `rg`, narrow `sed` ranges, and targeted diffs.
