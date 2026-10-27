# Large taste tint sphere

**Color-Guide → TasteColor-GradientCircle** · 1080×1080 · 30 fps · default 0.8× · 1,148 frames / about 38.27 seconds.

One fixed sphere is centered at (540, 540), with a 720 px diameter and 180 px margins. Its edge matches both guides' outer ring edge: `(108 + 18 / 2) × 1080 / 351` gives a 360 px radius. The original two-ring proportions are retained; the inner ring is not independently enlarged. It has no ring outlines, small dots, raster assets or texture. Both `TasteColor-Guide` and `TasteColor-Guide-Original` remain separate selectable videos.

The current taste name appears above the sphere (18.46 px Pretendard Medium); its uppercase main HEX color appears below (18.46 px Pretendard Regular). Both use the guide's 6-unit SVG text size, equivalent to about 18.46 px after the guide's uniform scaling on the shared 1080 px canvas. They sit halfway through the upper and lower 180 px margins, at y=90 and y=990. Both texts use the current taste's main color: for example, Sweet and `#FF9900` appear in `#FF9900`. The code identifies the source main color, not a shaded pixel. Name and code fade out and back in together during the shared taste-transfer progress, switching identity at the midpoint without overlapping text. Font loading completes before rendering.

`GradientCircle.tsx` imports the exact `cyclePose` from `Original/motion.ts` and uses `originalColorGuideDuration` in the composition registration. The sphere is synchronized to **TasteColor-Guide-Original**, with 918 source frames, 150-frame taste phases, a 30-frame palette hold, and 30-frame ordinary color transfers. The current seamless-handoff guide keeps its own shorter clock. No original timing table is duplicated. The shared original intro timing fades in Sweet over the neutral circle; the requested neutral intro/outro appearance is retained.

The surface uses all ten guide tints (100, 90, …, 10) in a radial gradient. The saturated 100 core drifts continuously along a smooth, irregular path; the edge stays at the bright 10 tint. The original soft shading is retained with a modest core expansion: 90 at 20%, 80 at 39%, and 70 at 54% of the gradient (originally 18%, 36%, and 51%). The middle tones blend gradually through 60 at 66%, 50 at 76%, 40 at 84.5%, and 30 at 91.5%, followed by 20 at 96.5% and 10 at the edge. There is no flat 100-color plateau, compressed midtone band, specular reflection, or separate highlight. This preserves the spherical volume and luminous rim using the original taste colors.

`sphereMotion.ts` combines four waves with seeded random directions and phases. Their frequencies are 2, 4, 5, and 10 per composition loop; the quicker secondary waves raise average core speed by about 16% over the earlier 2/3/5/8 motion, without changing taste-transfer timing. The path is deterministic for Studio scrubbing and rendering, with matching position and velocity at the loop boundary. Both color palettes share one moving focus, including during holds and transfers. The path amplitude is 1.6× the original, conservatively bounded to 52% of the radius (the seeded path reaches about 36.6%), keeping the surface spherical and the bright circular edge fixed. Playback speed follows the composition duration. Static mode freezes the focus slightly below/right of center.

A broad backlit shade stays centered on the sphere while the taste-color focus moves independently. The neutral black overlay spans 95% of the sphere radius: 12% opacity at the center, 8.5% at 45% of its span, 3% at 80%, then fully transparent. This deepens and slightly widens the shade across the body instead of bunching a dark spot on the moving color core. The outer 5% of the radius keeps its original bright tint. Both transition palettes share the same light field, so lighting does not jump during taste changes. This is local animation shading; the guide's source colors and tint rules are unchanged.

During a taste transfer, the next sphere's full tint palette enters from its position on the reference color wheel through a soft moving gradient mask. Both palettes keep their radial shading throughout the transition. At rest the sphere retains its tonal surface. Default taste transfers last 1.25 seconds, matching the original guide's moving point. The initial transfer uses the guide's shorter entrance timing.

The sphere keeps its size and position throughout. The first frame shows a filled light neutral circle with no text, using `COLOR_TOKENS.background.page` (`#F3F3F3`) on the white default background. During the 15-source-frame intro, the normal Sweet sphere and both labels fade from opacity 0 to 1 while the neutral base fades away. The Sweet base colors, radial tints, and backlit shade are already in their normal state; there is no pale-Sweet interpolation. During the final 30-source-frame Fatty transfer window, the sphere and labels fade out while the neutral circle returns. Reset frames hold that neutral circle without text, matching the first frame for a clean loop. Static mode displays the fully visible shaded Sweet sphere.

Studio controls are shared: playback, speed and background. Match speed settings between the sphere and TasteColor-Guide-Original when comparing them.

```sh
cd brand-launch
node scripts/render-color-circle.mjs
node scripts/render-color-circle.mjs --video
```

Output: `output/color-circle-20261026/`. This is a brand animation; no account data, backend or product UI is changed.
