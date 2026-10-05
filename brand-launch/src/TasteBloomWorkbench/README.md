# Bloom Studio

Part names follow the [Bloom terminology contract](../../../docs/design/taste-bloom-avatar-terminology.md): 꽃잎, 수술, 암술.

Open http://localhost:3111/ after running `node scripts/bloom-workbench.mjs`.
The panel contains six label–slider rows (0–100) without visible numeric labels,
petal/stamen/pistil button groups, a shared 4–8 repetition-count stepper (− / number / +),
and reset. Taste, shape and count controls occupy three rounded cards under
the titles “미각”, “형태”, and “개수”. Slider tracks and shape button groups share the same width
and horizontal alignment, extending to the card's right padding. Every shape option is visible without opening a menu.
Scores are preview inputs, not a taste diagnosis or a saved user profile.

The source is the app's `src/components/system/PalateBloomAvatar.tsx`.
Run `node scripts/sync-bloom-workbench.mjs` after changing that source; it bundles the
actual SVG component into `source-avatar.generated.js`, including the original ranking,
colour, dominance, radius and layer calculations. No sizing formula is reimplemented.
The wrapper class merger is adapted for static SVG classes; React stays external.
The app's original avatar CSS and design-system CSS are imported directly.

The preview contains only the avatar, with no header, legend, explanatory text or
demo caption. It fills the viewport, with a floating control panel above it. The controls
use `TasteLineChart.tsx`'s graph styling: 12px taste-tinted track (18% opacity),
2px line fading from transparent to the taste colour, and a 12px circular node.
The line starts 6px inside the 12px track, at the centre of its left rounded cap;
the native thumb follows the same inset domain so its centre meets the line endpoint.
Native accessible range inputs retain pointer and keyboard interaction. Initial
values are the playground defaults times ten.
The playground's four-fold round-petal/thin-stamen/solid-pistil defaults are applied.
The count stepper changes the original component's shared shape-count override;
both petal rings and both stamen layers use the chosen count. Reset restores four.
Changing scores preserves the selected shapes so score effects can be compared.
The selectors expose all 4 × 3 × 3 shape combinations.

`WorkbenchView` is shared by the interactive editor and the frame-based demo.
`TasteBloom-Controls-Demo` is 1600 × 1000, 30fps, 720 frames / 24 seconds.
It demonstrates six score changes, three shape selections, and a count change from four to eight.
This is a scripted interaction demonstration, not a screen recording.
Render using `node scripts/render-bloom-workbench.mjs`; `--stills` renders stills only.

Example usage: `<WorkbenchView profile={defaultProfile} />`.
Validation: source SVG parity, rank/geometry checks, lint/build, browser control
interaction, demo still inspection and full MP4 decode.
