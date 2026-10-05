# TabBar-CameraEntry-Portrait

1920 × 1280, 60 fps presentation with three aligned iPhone portrait screens. The existing composition ID is retained. `TabBar-PlusButton` stays square and unchanged.

Default sequence: 1.2s idle → 0.24s pressed button → native spring bloom → camera controls appear → 5s camera hold, followed by capture and the complete feedback sequence (2597 frames / approximately 43.28s total). The inner scene uses iPhone 16 Pro dimensions: 1206 × 2622 pixels (402 × 874 points @3x), with a 144px button centered 192px above its bottom. Each screen is displayed at 450.76 × 980, with 74px gaps, on the sampled reference background `#FFFFFF`. The 62pt display corner radius is read from the installed Apple device profile; its SwiftUI continuous rounded path is exported into `iphone-screen.ts`, so the displayed radius scales proportionally (69.52px at the default height). The 150px top/bottom margins and flat, borderless presentation follow the supplied reference. A status bar shows 9:41, cellular signal, Wi-Fi and battery, switching from dark icons on the initial white screen to light icons for the camera. Three distinct roles are shown: capture, feedback entry, and a progressively assembled result card. No device hardware or borrowed reference branding is added.

In Studio, click the plus button to seek to the press and start playback. The same sequence runs automatically when playing or rendering, so scrubbing and exports remain deterministic. The Inspector exposes canvas color, screen height, timing, entry speed, button size, bottom offset, color-change interval, random seed, glass strength, and background color. Use the timeline to replay from the beginning.

Default video colors are blue (`#7299FF`) and purple (`#B372B4`) from the dish-result palette, with the blue tint surface (`#E3EBFF`). Both button and expanding fill use this pair. `컬러 모드` also retains `블루 · 옐로우` and `6색 랜덤`; interval and seed controls apply to that mode. The native app is unaffected by this video color selection.

## Sources and rendering boundary

- `ios/TasteBuddy/Components/Shell/AppShellView.swift`: 128-point wavy radial path, outer expansion and inner camera reveal, edge glow and feather widths. Both native and video omit the protected-center cutout so the camera reveal is solid, with no isolated color fragment at the button origin.
- `ios/TasteBuddy/DesignSystem/TasteBloomMotion.swift`: spring duration 0.72 / bounce 0.18. SwiftUI's actual mass, stiffness, damping and 1.2586192858s settling duration were queried locally; the exported curve uses those physical parameters. The feedback spring settles in 0.3597168735s.
- `ios/TasteBuddy/Features/Dining/DiningView.swift`: camera close/flash, library/shutter/camera-switch arrangement; controls appear after the bloom clock finishes.
- `TabBarPlusButton/PlusButton.tsx`: shared original button renderer, including the one-physical-pixel inset.
- `DiningFeedbackMotion/colors.ts` and `Background.tsx`: the exact shared six-color main/tint palette and dish-result gradient renderer.

The button and entry gradient share one continuously advancing color clock. In the optional six-color mode, orange, yellow, green, blue, purple and brown are shuffled into pairs; every three pairs use all six colors, and a bag boundary never repeats the same pair. Pairs blend smoothly every 0.75s by default, including after the camera transition starts. A seeded, frame-addressable shuffle makes seeking and parallel video rendering reproducible. Change `랜덤 시드` for a different order or `색 전환 간격` for a different pace. The separate square composition keeps its original controls and motion.

The expanding fill renders the dish-result `FeedbackBackground` directly inside the entrance mask. Main and secondary colors come from the button's ongoing color state; the third field repeats the secondary color so tapping never introduces an unrelated hue. The background uses the corresponding main tint. There is no extra saturation/hue correction or glass coat on the entry gradient. Radial geometry and entry timing are unchanged; the glass-strength control applies only to the button.

The native counterpart passes a `TasteBeamLaunchState` value from `BottomTabCenterButton` through `BottomTabBar`, `AppShellView` and `DiningFeedbackSheet`. It captures the button's random sequence and elapsed time at the tap, then continues that same clock. `TasteBeamPalette` reads `TasteAxis.mainColor` / `tintColor`, also used by the native result card, and the entry reuses `DiningFeedbackResultBackground`.

SVG approximates native glass/material compositing. The camera preview uses `images/camera-entry/generated-pasta-reference.png`, newly generated with the built-in image tool from the user-provided pasta reference. Generation prompt and provenance are stored alongside it in `provenance.json`. Frame-driven translation, rotation and focus breathing simulate handheld framing: a blurred feed appears first, then autofocus resolves the food while framing motion settles into gentle residual movement. It is a generated image-based preview, not live camera footage. The viewfinder stays black during the entrance bloom, then follows three distinct stages relative to the controls appearing: black through 0.08s, then a fully opaque blurred image through 0.42s, then focus resolving from 0.42–1.04s. No crossfade or partial image opacity mixes the food with black. Controls and feed activation start 0.3 seconds earlier than the previous spring-completion timing (scaled by entry speed), reducing the empty black wait. Top and bottom shading keeps the recreated camera controls legible; all five controls fade in together. The video does not request camera permissions.

## Focused verification

`node --test scripts/camera-entry.test.mjs` checks six-color shuffle coverage, seek stability, click/entry palette continuity, source palette values, SwiftUI spring sample parity, button/reveal origin and timing, and Studio prop editability. `node scripts/render-camera-entry.mjs` exports nine representative frames (including autofocus stages) plus an H.264 MP4 into `output/tabbar-camera-entry`. Studio playback and direct button-click behavior are checked separately in the browser.

## Post-meal feedback continuation

The original entrance and camera segment is preserved through frame 484 in the left screen, then held. The center screen advances through the input phases and holds its final note state. The right screen assembles only fields already entered, then shows the save-ready result stage. A shutter press/flash leads to the native phase order: restaurant candidate selection (저저; user-provided address 합정 잔다리로 65 을지로 퇴계로 41길 31; display distance 근처 5m), menu selection, overall evaluation, taste bubbles, detail tags, optional note and save-ready result card. `feedback-timing.ts` defines the seven stage lengths. The record uses clearly marked example data and the AI-generated photo; no location lookup, account write or real save occurs.

`native-ui.ts` imports automatically synchronized logical-point metrics from `TBTheme.swift`, `PrimaryButton`, `TBFlowTopBar`, `TBSelectionCard`, `TBTextInput` and `FlowBottomCtaMetrics`: CTA height 48/radius 10, header 32/title 15, section padding 12, selection padding 16/radio 18/dot 8, input height 44/radius 10. The detail hero is 176pt, and the result uses the shared card at 302pt with the native 4:5 photo and 50pt side margins. The original result-video compositions retain their default 290pt width.

The menu's “음식 종류와 특성” panel follows native ingredient/form/method/attribute groups with the shared 16pt food icons. It scrolls after showing the selected seafood and noodle chips. The note step uses the native `TBTextArea` label, 156pt editor plus 10pt padding and placeholder. At the user's direction, its border remains 1pt in the default border color throughout typing, without focus styling. Typing remains authored video motion without an OS keyboard. Native `TBControlFeedback` supplies the CTA's size-dependent pressed scale and surface tint.

`feedback-catalog.ts` imports the automatically synchronized catalog of all 160 current native v2 bubble labels, descriptions and hex slots from `ios/TasteBuddy/Resources/TBA/dining-sensory-v2.json`. The UI and copy follow `DiningView.swift`, `DiningOverallEvaluationStepView.swift` and the shared native components. `FLOW_STILLS=1 STILLS_ONLY=1 node scripts/render-camera-entry.mjs` renders one verification image per feedback stage.

The three panel labels highlight the active step. `feedback-layout.ts` ports native nearest-selected-anchor displacement and 12 relaxation passes, preventing overlap when selected bubbles enlarge.

### Bloom Frame · 블룸 프레임

System name: **Bloom Frame / 블룸 프레임** (`bloom-frame`). See the [motion system](../../../docs/design/motion-system.md) for the shared naming and current motion inventory.

The right-hand screen first inherits the camera-entry colors, then the white six-petal Taste Buddy symbol appears at its center. `result-card-geometry.ts` reads the original six paths from `LogoGrid/geometry.ts`; each five-cubic path morphs into one sixth of a continuous white ring. The center remains a real transparent opening.

Bloom Frame's petal merge takes 0.22 seconds, and each frame expansion takes 0.3 seconds. At 0.64 seconds the outside of the O starts expanding into the rounded card. Its inner opening follows just 0.06 seconds later, reducing the moment dominated by the white card surface, and grows into the inset 4:5 photo frame. After both shapes settle, the entire photo appears blurred at 1.02 seconds and sharpens from 14pt to 0pt blur over 0.34 seconds. Text fill retains 0.28 seconds per region. The complete entrance ends at 1.66 seconds. The reference `/Users/sinjunho/Desktop/download.mp4` (4.733s, supplied 2026-09-30) informed the outline-to-surface order; the later user revision replaces the image wipe with a blur-to-sharp reveal. The card stays centered and faces forward throughout.

The demo menu name is shown from the card's first appearance; other fields populate the preview as they are entered in the middle screen. As tastes are selected, the background blends from the captured button colors to those tastes. At the final result boundary the card stays fully formed, the background clock continues, and share/save controls appear at 0.5–0.8 seconds. The motion and original reference diagnostics are in `output/tabbar-camera-entry/result-card-bloom-20260930/`. This is a Remotion draft for review before native implementation.

Restaurant name, address and 5m distance are user-specified video content, not live location lookup results.

### Sauce Splatter · 소스 스플래터

System name: **Sauce Splatter / 소스 스플래터** (`sauce-splatter`), confirmed 2026-09-30. The implementation keeps the technical name `MetaballChipRow`; Sauce Spread and Sauce Drizzle were naming candidates. See the [motion system](../../../docs/design/motion-system.md) for the motion contract and timing.

The result card's reaction and detail rows use `MetaballChipRow`. Each chip begins as a circle, stretches into its measured native capsule width, overshoots, and briefly compresses to 86% of its height. Before that overshoot, the next circle buds from its right edge. A curved neck thins and detaches before the new circle expands. Shapes and their borders share one silhouette so there are no overlapping outlines inside the connection. Text keeps its normal proportions.

The two selected taste chips enter together at 23.183s, and the selected detail chips enter together at 32.633s in the default film. Each row waits until both choices are available, then completes its chain in 1.3 seconds. At rest it renders the original native-style chip component, including the detail overflow count. All motion is derived from elapsed seconds and remains stable when scrubbing.

`FeedbackCard` accepts `chipEntrance={{ reactions: secondsSinceTasteRowReady, details: secondsSinceDetailRowReady }}`. Omit it for static chips. Pure timing and geometry checks: `node --test scripts/chip-metaball.test.mjs`.


## Automatic native UI synchronization

`npm run studio` / `npm run dev` now start the source watcher. Native tokens, recognized copy, bubble/dish/detail catalogs and supported geometry update this composition automatically while preserving its authored motion. Unsupported UI structure or unbound-value edits show a Studio review notice and fail export preflight. See `scripts/native-feedback/README.md` for scope, verification and structure-review workflow. The older simulator screenshot pipeline remains opt-in for `TasteBuddyLaunch`.
