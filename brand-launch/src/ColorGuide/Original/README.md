# Original color guide

**Color-Guide → TasteColor-Guide-Original** · 1080×1080 · 30 fps · default 0.8× · 1,148 frames / 38.27 seconds.

This separate composition preserves the timing before the seamless-handoff change. `TasteColor-GradientCircle` now follows this original clock. Both guide versions retain the original two-ring proportions and are scaled uniformly so the outer ring edge is 720 px across, matching the sphere. The outer margin is 180 px; the inner band outer diameter is about 498.46 px.

The component and motion functions come from the saved pre-change source. Geometry, taste colors, fonts, and controls are shared; this version owns its timing module and duration calculation so later changes to the current guide cannot retime it.

Each taste has 60 source frames of sequential inner entry, 30 frames of palette hold, and 60 frames of sequential exit. Inner arrivals have the original small overshoot. The outer traveler moves during the final 30 frames of the exit. The final outer points leave one at a time before the clear/reset interval.

```sh
cd brand-launch
node scripts/render-color-guide.mjs --original
node scripts/render-color-guide.mjs --original --video
```

Output: `output/color-guide-20261026/original/`.
