# Nine taste types · vertical scroll

| Composition | Size | Studio |
| --- | --- | --- |
| `TasteBloom-Profile` | 1080 × 1080 (1:1) | `http://localhost:3110/TasteBloom-Profile` |
| `TasteBloom-Profile-Landscape` | 1920 × 1080 (16:9) | `http://localhost:3110/TasteBloom-Profile-Landscape` |

Both compositions share `TasteBloomProfile`, 30 fps and 765 frames (25.5 seconds).
The landscape version uses `elementScale: 1.5`: 144px avatars, 90px type, and a
36px avatar/title gap. Its 192px rows have 160px gaps, preserving the 352px center
spacing, timing and loop. Side circles also grow to 144px and wrap fully outside
the canvas. The main list stays horizontally centered, and the clipped side circles
follow the canvas edges at x=0/1920 instead of x=0/1080. The square version is unchanged.

All nine TBA types form one
continuous vertical list in the order defined by
`ios/TasteBuddy/Resources/TBA/tba-sensory-contract.json`.

| Type | Meaning | Avatar | Visual rationale |
| --- | --- | --- | --- |
| Purist | 본연형 | Aster · 24 | Four simple capsule petals with quiet taupe detail |
| Maximalist | 강렬형 | Carnation · 9 | Orange, eight serrated petals, dense center |
| Alchemist | 발효형 | Gerbera · 23 | Purple, layered petals, seed center |
| Roaster | 고소형 | Marigold · 16 | Taupe, yellow, and orange evoke toasted grains |
| Romantic | 달콤형 | Camellia · 15 | Soft round petals and orange/purple colors |
| Texturalist | 식감형 | Prism · 32 | Diamond petals, dotted rays, faceted center |
| Epicure | 농밀형 | Rosette · 2 | Existing blue Rosette with a layered, dense bloom |
| Refresher | 산뜻형 | Cosmos · 5 | Lime background and open capsule petals |
| Harmonist | 조화형 | Garnet · 30 | Regular eight-way symmetry and balanced color placement |

These are film-specific visual associations, not measured user results or new
TBA classification rules. Original exported SVG shapes and palettes are reused.
`profile-types.ts` holds the ordered assignments.

Each type takes its turn centered at y=540, with neighbors at y=188/892.
Purist begins at the center and returns after Harmonist. Each row is 128px high,
with 224px gaps (352px center spacing), a 96px avatar, and a 24px avatar/title
gap. Titles use Kalice Regular at 60px, line height 1, with a 0.6px text-color
stroke. There are no user names or secondary lines.

Each type rests for 60 frames (2 seconds). An empty row separates Harmonist
and Purist, with no text or avatar. It rests at
the center for 45 frames (1.5 seconds), marking the end of one pass before
Purist returns. Each rest is followed by an 18-frame (0.6-second)
single-row move. The move passes its 352px target by about 13px, then settles
back at the exact center. The ninth move reaches the empty row and the tenth
returns to Purist. The slot is visible below centered Harmonist and above
centered Purist, including the first frame.
Only the settled center avatar unfolds, using the existing opening motion at
2× speed. It fades its interior over the final six resting frames before moving;
the same fade applies before the return move. Moving and off-center rows show only their background
circle, with 55% opacity away from the center. No flower begins during overshoot.
Text interpolates by center proximity between the app's textHint token (#888888)
and textPrimary token (#0F0F0F); at rest only the center title is black.
Seeking computes the same pose as forward playback. `profile-motion.ts` defines
the geometry, overshoot, emphasis, and center-only bloom timing.

The eight pale edge avatars start moving downward 6 frames (0.2 seconds) before
the main list moves upward. Both moves last 18 frames (0.6 seconds), using the
same speed curve and reduced overshoot. The overlapping movement is staggered.
Each side's offscreen strip has ten rows, matching the ten
main steps with a 3520px period. At rest four circles per side are visible;
the other strip rows are clipped. Initial visible centers remain x=0/1080
and y=12/364/716/1068. Wrapping happens outside the visible canvas.
Their size is 96px and group opacity is 55% over
the white canvas. The canvas clips their outer halves, and clips the outermost
rows at the top/bottom. These edge avatars also show only background circles,
so the centered type is the only flower in the frame.

Offscreen copies of the empty row, Purist, and Maximalist give both loop endpoints
the same neighbors. Frames 0 and 764 show Purist centered with a closed flower,
empty space above, and Maximalist below. Edge positions and their color order also
match exactly. The terminal frame uses frame zero's render coordinates to avoid
subpixel SVG rasterization differences. Purist starts opening on the next frame
after replay begins.

Validation: `npm run lint`, `node --test scripts/bloom-profile.test.mjs`,
and Studio/frame-render checks of the first, middle, and final viewport.
