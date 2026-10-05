# Taste Bloom · Gallery and A/B comparison

Part names are petal (꽃잎), stamen (수술), and pistil (암술).
See the [terminology and compatibility contract](../../../docs/design/taste-bloom-avatar-terminology.md).

The gallery and comparison are two independent 1080 × 1080, 30fps compositions:

| Composition     | Preview                               | Frames | Duration     |
| --------------- | ------------------------------------- | ------ | ------------ |
| TasteBloom-9    | http://localhost:3110/TasteBloom-9    | 840    | 28 seconds   |
| TasteBloom-Wave | http://localhost:3110/TasteBloom-Wave | 642    | 21.4 seconds |

Each composition begins at its own frame zero. TasteBloom-Wave contains two named
Sequence layers: A from frames 0–112, followed by B from frames 113–641.
The Taste-Bloom folder contains five compositions: TasteBloom-9,
TasteBloom-Wave, TasteBloom-Profile, TasteBloom-Profile-Landscape and TasteBloom-Controls-Demo.
The two profile compositions share the same taste-type motion at 1:1 and 16:9.
Render the two gallery/comparison MP4s with `node scripts/render-bloom-split.mjs` (or `--stills` for
preview frames only). Outputs are in `output/taste-bloom-split/`.

In TasteBloom-9, nine avatars appear in a fixed 3 × 3 grid for 28 seconds.
Avatars use a 120 × 120 canvas. The gallery has no top title, subtitle, divider, or footer.
Four groups cover every combination of 4 petal shapes × 3 stamens × 3 pistils once.
The first group preserves the original nine avatars. Each position keeps its leaf
count, and rotates all six taste colors on each group change.
In the 3 × 3 scenes, outer circles stay at their full size and fixed position.
Within each circle, the pistil appears first. Both petal rings use the same local
3D X-axis opening as `TasteBuddy-Petal-Shorts`: 90° → 0° in one second with AE Easy
Ease, a shared center pivot, and perspective scaled to the avatar canvas. Petals
within each ring open together; the inner ring starts 330ms after the outer ring.
Petals have no animated scale or opacity. The two stamen layers grow from the center.
Each 7-second cycle opens for 2.7 seconds, holds until 4.4 seconds, then reverses
the same motion until fully folded at 6.4 seconds. Only then does the form change.
During the 3 × 3 hold, the fully opened flower stays still until folding begins.
There is no breathing, idle scaling, or idle petal rotation.
The fixed background circle blends to the next color over 0.5 seconds while the
inner shapes are closed. The next cycle opens with the new form and color order.
The fourth group folds without switching back to the first group, then the gallery ends.
The comparison composition's A and B layers each reveal 36 forms in a 6 × 6 grid at 60 × 60px.
Both layers have no visible text: no title, numbers, names, or shape descriptions.
Both comparisons use the same forms, 60px maximum size, and six background colors.
A overlaps successive colors over 3.77 seconds. B passes one color through the grid
at a time over 17.63 seconds, holds two radial steps, and retains 12px miniatures;
different wave background colors never overlap on screen.

The overview follows this exact five-band layout (4 / 8 / 12 / 8 / 4 avatars):

```text
5 4 3 3 4 5
4 3 2 2 3 4
3 2 1 1 2 3
3 2 1 1 2 3
4 3 2 2 3 4
5 4 3 3 4 5
```

Only the center four avatars begin appearing initially, in orange. In A, each wave
travels outward with a 10-frame (about 0.33-second) offset per band. A new color leaves
the center every 12 frames (0.4 seconds), independently of the outer bands.
Yellow starts at the center while orange is opening in band two. By the time orange
reaches band five at frame 40, blue has started at the center, with lime and yellow
following outward. The center never waits for a color to finish crossing the grid.
This continuous stagger follows the feedback motion's traveling ripple rhythm;
there is no global stage boundary that waits for every flower to finish.
The unequal travel and emission intervals keep neighboring bands at different
points in expansion and contraction, instead of pulsing at the same phase.

Reference: `play_sf_1772825842_3847059682690704496_4744982874.mp4`
(720 × 900, 30 fps, 451 frames). Frame samples show successive expanding and
contracting pulses crossing a dot grid, with later pulses already active behind
earlier ones. This overview adopts that overlap and moving size crest while
retaining the specified center-outward origin, 6 × 6 layout, and six taste colors.

The six waves are orange, yellow, lime, blue, purple, and taupe. Each color reaches
all five bands. Unrevealed bands are initially absent, including their circles; explicit grid
positions keep the active avatars in their places. In A, background circles grow
to the full 60px canvas over the 12-frame opening with cubic ease-out while petals
unfold. In B, background growth finishes before any interior element opens.
The original interior motion runs at 6× speed in these overviews only.

In A, a flower reaches its full pose at age 12 frames and immediately contracts to
zero over 6 frames. The next colored background grows behind it at the same time.
Older pulses stay above newer ones during this overlap, with no opacity fade.
The next band begins while the preceding band is still unfolding, so opening,
shrinking, and the next color's arrival continually overlap across the grid.
In A, the sixth wave remains open as it reaches the outermost band; that layer ends
when all 36 avatars finish that final bloom.
Comparison A (`individual`) preserves the original per-avatar interior combinations.
Each wave shares its background color, while seeded sampling without replacement
assigns different interior palettes within each band. The original
`bloom-interior-v2` seeds keep the existing combinations stable.

Comparison B (`wave`) shares a background and interior color set per wave, then
randomizes the assignment to outer petals, inner petals, outer stamen, inner stamen,
and pistil independently for each avatar. Sampling without replacement across all
36 avatars ensures a different interior combination for every form. The next
wave carries a new set of combinations. Fixed wave/avatar seeds keep the random
colors stable during opening, contraction, seeking, and rendering.

B uses the `single-color` timing mode at 0.75× speed. Its whole motion clock is
slowed uniformly, preserving the relative timing of every stage. A and the 3 × 3
gallery keep their original speed. Each color starts at the center and travels
through all five bands. The middle three bands stagger their cells over six motion
frames (about 0.27 seconds), using radius and a small angular offset for timing.
This creates overlapping subgroups instead of switching every cell in a band at
once. The exact five-band layout, center-four start, and final corner timing stay
the same. No avatar position or palette assignment changes.

Each avatar opens in two consecutive phases: the background
alone expands for 8 motion frames (about 0.36 seconds), then the interior flower
unfolds for 12 motion frames (about 0.53 seconds). Petals, stamens, and the pistil are not rendered during
background growth, so even the edge-on 3D petals cannot appear early. The flower
starts from its closed pose only when the background reaches full size. Background
expansion uses smooth acceleration/deceleration, avoiding a sudden launch from
the waiting dot. During contraction, the interior fades smoothly to zero instead
of disappearing abruptly on the last frame.

Shrinking starts two radial steps after a band's opening
begins: band 1 stays full as band 2 opens, then starts shrinking when band 3 begins.
The same local timing applies to every staggered cell.
This is age 20 motion frames (about 0.89 seconds), once both opening phases have
finished, followed by a 6-motion-frame contraction (about 0.27 seconds) to scale 0.2 (12px).
Revealed avatars remain at that minimum instead of disappearing. At 12px, only
the background circle is rendered; petals, stamens, and the pistil are removed.

A B pass lasts 88 timeline frames (about 2.93 seconds), corresponding to 66 motion
frames: 40 frames of radial travel plus 20 before shrinking and 6 of contraction.
When every band has returned to its minimum, all
miniatures switch to the next wave's palette together. They wait as background-only
12px dots until the
new wave reaches their band, then grow again from that visible minimum. Only the
first pass hides bands that have not appeared yet. The final frame retains all 36
background-only dots. At any frame there is at most one wave background color; interior
palettes remain randomized independently per avatar and wave.
`overview-layout.ts` defines the arrangement and timing. `palette.ts` changes only
SVG fill/stroke colors; the earlier 3 × 3 scenes keep their original colors.

`Presentation.tsx` exports the gallery with four named Sequence layers: 01–09
(0–7s), 10–18 (7–14s), 19–27 (14–21s), and 28–36 (21–28s).
Its comparison export contains `A · Overlapping Color Waves` (0–3.77s) and
`B · One Color Wave at a Time` (3.77–21.4s) as separate named timeline layers.

All 36 forms have short, unique English form/flower names defined in `names.ts`,
following the original naming style. The first nine are Round, Rosette, Daisy,
Capsule, Cosmos, Diamond, Lily, Crown, and Carnation. The other 27 use names such
as Marguerite, Clover, Lotus, Prism, and Fringe. Names stay tied to shape when
colors change. See `NAMES.md` for the full list.

Names and their numbers use Kalice Regular at 14px. The local font file is bundled
as `public/fonts/Kalice-Trial-Regular.otf` and loaded by `fonts.ts` for preview and
rendering. Korean shape descriptions keep Pretendard at 12px.

The SVGs are exported from the actual React `PalateBloomAvatar` component using
`node scripts/sync-bloom-avatars.mjs` from `brand-launch`. Rerun that command after
changing the source component, taste color tokens, `variants.ts`, `forms.ts`, or `names.ts`.
`public/brand/taste-bloom/manifest.json` records the source hashes and fixtures.
The same export also produces `generated.ts`, preserving the six SVG layers and
each original petal element for frame-driven animation. Completed 3D planes are
replaced by the untouched source SVG elements, so the open flower retains its geometry.

The names and numeric profiles are gallery examples, not official taste categories
or user measurements. Shape geometry, layering, rank-based sizing, and the 85% main
color / 15% white mix come from the existing app. The preview has no photo or frame.

Validation: `npm run lint` (ESLint + TypeScript), plus Remotion Studio visual check.
