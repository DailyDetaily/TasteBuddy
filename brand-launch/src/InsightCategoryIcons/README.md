# Insight category icon transition

`InsightCategoryIcons-Transition`: 1080 × 1080, 60 fps, 645 frames (10.75 seconds).

The product's category order is experience → sensation → preference → context → change → experience. The shared `src/components/system/InsightCategoryIcon.tsx` supplies the current Globe, Speech, outline Heart, Orbit, and RefreshCw glyphs. The original 24 × 24 geometry and strokes are preserved, including Heart's 2.2px stroke.

Each original icon holds for 1.5 seconds, then its strokes morph into the next icon for 0.65 seconds. The transition reuses `FoodIcons/capture-transition-pose.ts` and the contour matching in `transition-shapes.ts`, with the same easing and icon size as `FoodIcons-Transition`. The default background is `#F3F3F3`. Category-specific interpolation uses 192 equal arc-length intervals per contour, aligns the direction and starting point to minimize travel, and eases unmatched details out before new ones become prominent. Original SVG geometry is displayed at both endpoints. The final transition returns to the first icon for a continuous loop.

Stroke colors follow 단맛 → 신맛 → 쓴맛 → 짠맛 → 감칠맛, using `TASTE_TOKENS[axis].palette.main` directly: experience/sweet, sensation/sour, preference/bitter, context/salty, change/umami. Color interpolates with the same eased progress as the shape, including umami → sweet at the loop boundary. This pairing is specific to this composition and does not redefine product category colors.

Studio controls: background color, icon size, hold duration, transition duration, and loop/still playback. Still playback displays the original experience icon in the sweet main color. There are no visible labels or captions.

This is a standalone icon motion composition; it does not represent account data or modify the product's category visuals.
