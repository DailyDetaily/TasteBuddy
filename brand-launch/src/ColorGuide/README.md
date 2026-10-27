# Color guide · seamless sequential handoffs

**Color-Guide → TasteColor-Guide** · 1080×1080 · 30 fps. Default speed **0.8×**; 923 frames / about **30.77 seconds**.

The concentric bands, dotted tracks, dots and upright labels are SVG code. Reference images and video are not embedded.

The pre-change version is available separately as **TasteColor-Guide-Original** (38.27 seconds at 0.8×), with the original palette hold and arrival overshoot. See [Original/README.md](Original/README.md).

## One moving point, fixed stations

The inner ring and its deposited tone dots stay fixed. One traveler moves clockwise through **100 → 90 → … → 10 → 100**, with constant angular speed. Every 36° arc takes six source frames (0.25 seconds at the default speed). It does not decelerate, overshoot, or stop at a station.

During the first lap, the traveler leaves each tone dot behind on arrival. The final 10→100 arc closes the lap. The second lap starts immediately at the same position and speed, removing each tone dot on departure. The complete palette has no hold interval. Upright moving numbers fade near station handoffs, and are hidden when that destination already has a fixed number, avoiding duplicate labels.

| Local source frames | Behavior | Duration at 0.8× |
| --- | --- | --- |
| 0–60 | A continuous clockwise lap deposits the tone dots. | 2.5s |
| 60–120 | A second continuous lap clears the tone dots; the outer traveler moves to the next taste. | 2.5s |

The moving point's color blends between adjacent strengths. On the final clearing arc, it blends into the next taste's 100 tone so the next palette begins at the exact same position and color. Deposited tones retain their original taste until removed. There is no whole-ring rotation or simultaneous orbit of all ten points.

## Outer timing and restart

The first outer point fades in from Fatty toward Sweet over the existing 15-source-frame entrance. Later taste points accumulate on arrival. An outer taste-to-taste transfer now spans the full 60-source-frame inner clearing lap and arrives exactly when the next palette starts. Angular travel is clockwise with no positional overshoot.

In the final Fatty clearing lap, accumulated outer dots and labels still leave one at a time, Sweet through Fatty. Each 60° arc takes ten source frames. Their angular travel is linear; fading softens each handoff. The inner traveler fades during its final arc. A three-source-frame clear interval completes the 738-source-frame loop; all dots are invisible before restarting. The neutral-start sphere now follows the Original version's separate clock; this guide retains its seamless-handoff timing.

## Geometry and controls

The square viewBox is `-54.5 -58.25 351 351`. The original inner radius 72, outer radius 108, band width 18, and gap proportions remain intact. Uniform scaling centers the guide at (540, 540) with a **720 px outer ring edge and 180 px margins**, matching the sphere. The inner band outer diameter is about 498.46 px; the visible gap scales proportionally to about 55.38 px. Main colors and 100→10 reference tints are unchanged. These are color specimens, not account data.

Controls: playback (`영상` / `정지`), speed (0.5–2), background. Static mode shows the complete Sweet guide without an extra traveler. Speed scales all phases together.

```sh
cd brand-launch
node scripts/render-color-guide.mjs
node scripts/render-color-guide.mjs --video
```

Current outputs: `output/color-guide-20261026/seamless-handoff/`. Product/backend/Figma behavior is unchanged.
