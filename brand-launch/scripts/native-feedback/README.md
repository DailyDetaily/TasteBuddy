# Native feedback UI sync

`TabBar-CameraEntry-Portrait` retains its React/Remotion choreography. Its supported visual values and copy now come from the current native SwiftUI source, rather than manually maintained video snapshots.

## Running

- `npm run studio` or `npm run dev`: synchronize once, then run Studio and the native-feedback watcher together.
- `npm run sync:feedback:watch`: attach synchronization to an already-running Studio.
- `npm run sync:feedback:check`: fail if sources/generated data differ, an extraction is unsupported, or structural review is pending.
- `npm run test:feedback-sync`: isolated source-change, watch, failure and recovery tests.
- `npm run dev:native`: also run the older build/simulator screenshot watcher for the independent `TasteBuddyLaunch` composition. That expensive capture path is optional and is not used by this editable feedback film.

Native edits are coalesced for 250ms; a 1.5-second content poll also catches file replacements. All data publishes as one generated module. Studio checks the revision every two seconds and refreshes the saved current frame when needed (deferred while typing in the Inspector). The watcher attached with `--studio-pid` ends when that Studio process exits.

## Automatic values

- `TBTheme`, `FlowBottomCtaMetrics`, `SelectionCardMetrics`: colors, CTA height/radius/padding, header dimensions, section/card metrics, field height and selection indicator geometry.
- `TBSelectableChip`, `ChipSize`, `DiningFeedbackAddChipButton`: chip font/height/padding/border, taste-axis colors and circular add-chip geometry.
- `TBTextArea`: label, font, height, padding and focused border; the note step uses the current native optional-note field.
- `DiningDishKindGroup` and `dishKindSelectionGroups`: ordered group labels and wrapping metrics. Shared product icon exports (`src/constants/dishKindIcons.ts`, also exported to native SVG assets) supply chip geometry; selected legacy kinds remain visible only when present in the demo selection.
- `TBControlFeedback`: size-dependent press scale and the primary button's pressed surface tint.
- `TBTopChromeBlurMetrics`: maximum blur and fade extension.
- `TasteAxisPalette`: all six taste main/tint/text colors, also used by button/bloom/result backgrounds.
- `TasteExperienceMapEngine` and bubble view: bubble diameters/spacing/relaxation, text size/scale and distance attenuation values.
- Native v2 catalog and fixture: 160 bubble definitions/slots, dish-kind chips, and five detail categories and their food-specific tags. The shared context rules run against the native JSON itself, so a separately generated web JSON cannot hide a native change.
- Known view declarations: plain string copy is tracked by stable literal slots and used through `nativeText`. The demonstration's restaurant, meal photo, menu, selected examples and animation timings remain video-authored inputs; they are not real account data.

`demo.json` supplies the demo menu, dish kinds and iPhone safe-area geometry. Changing those inputs also refreshes category context. Generated data lives in `src/generated/native-feedback.ts`; the old per-feature modules are thin imports of this module. Do not edit generated output. `public/native-feedback-sync.json` is the local Studio revision signal; `.native-feedback-sync/` contains local watcher state.

## Structural changes and unsupported expressions

This is a source adapter, not a general SwiftUI-to-React compiler. Inserting/removing/reordering views, changing unsupported modifiers, changing an unbound inline measurement, or changing an expression outside the supported numeric/color grammar produces a Studio-only review notice with its source file/section. Last usable UI values remain visible on extraction errors. A missing source file becomes an error and recovers automatically after restoration.

Review notices never appear in exported frames. The composition and render preflight reject review/error states; `render-camera-entry.mjs` synchronizes and checks before bundling. Direct Remotion CLI render calls also run the check from `remotion.config.ts`. Arbitrary Node API renderers must call `syncNativeFeedback()` followed by `syncNativeFeedback({check:true})` before bundling.

After intentionally updating the corresponding React adapter and verifying parity, use `node scripts/native-feedback-sync.mjs --accept-structure` to record the reviewed source structure. Never accept a structure change merely to suppress the warning.

No native app build, simulator launch, account write, or MP4 export is performed on each edit. Existing exported videos are immutable; the next export uses synchronized UI.

## Reviewed adapter update · 2026-10-05

The menu uses “음식 종류와 특성”, four groups of icon chips, and the current `noodle` kind in place of the old combined `grain_noodle` demo selection. Its authored scroll fits the full taxonomy inside the existing menu-stage duration. The note uses `TBTextArea` and removes the previous taste heading, meal/source selectors and photo editor. Selection borders use native semantic colors; CTA press feedback follows `TBControlFeedback`. Environment-disabled, profile-field and debug-layout changes have no additional visible effect in the enabled dining demo. The film continues to simulate typing without an OS keyboard.

These new native declarations are included in structural review so subsequent unsupported edits still block export. The camera, result-card choreography and overall composition duration are retained.
