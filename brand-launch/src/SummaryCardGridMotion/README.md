# Summary card mini-graph grid

Studio: http://localhost:3110/SummaryCard-MiniGraphs-Grid, under `Card-Motion`.
1920×1080 / 60fps. Nine cards in a 3×3 grid.

Reuses `HomePeriodInsightMotion/HomePeriodInsightCard` with its graph slot and shared `SummaryCardFooter` / `SummaryCardLegend`: white surface, 20px radius, 12px padding, native text/icon/detail-action styling. Footer: 0.5px semantic subtle divider, 12px above/below it, 8px item gap, 4px dot-to-label gap, 5px dot, Medium 10/14 caption. Graphs are the existing `GraphMotion` bar, grouped bar, stacked bar, line, area, bubble, pie, treemap and heatmap renderers. Their current 132×56 geometry and entry motions remain linked to their source. The pie occupies a 56×56 circle inside that slot. Each card is 352×148 to accommodate its legend.

Header icons follow the native `HomePeriodInsightCardData.insightCategory` → `TDCategoryIcon` mapping and reuse the web `InsightCategoryIcon`: experience = standard Lucide Globe, sensation = Speech, preference = outline Heart, context = Orbit, change = RefreshCw. Icons are 16px with 2px stroke (preference 2.2px). Their color uses the primary graph's `taste/{axis}/main`, supplied by the card's `accentAxis`; all nine current specimens use umami. The three-icon bubble explicitly fixes its header icon to umami, independently of its item colors. The grouped period-comparison card explicitly uses change; record/source/cuisine/frequency cards use experience, the area taste-clue card uses sensation, and the taste-change line uses change. Category metadata determines the shape and graph presentation determines the color.

Cards unfold in row-major order using the existing card-motion easing. Each graph retains its own entry timing; all remain complete through the shared hold. The hold begins only after the last graph has settled, including the heatmap's color transition. Cards then fold away with the same stagger. Studio exposes playback (full / enter and hold / static), gap, scale, stagger, hold duration and background. Scale is capped to keep the grid inside the canvas. Default hold is 2 seconds.

## Specimen data contract

This is a Remotion design/motion specimen. Its synthetic scope is documented here and in its accessibility label; the video footer caption was removed at the user's request. `catalog.ts` defines the sample records and derives the displayed counts from the same inputs.

- Bar / grouped / stacked / bubble / pie / treemap / heatmap units are **dish records**, not meals or liking. Source categories are synthetic home-cooked, restaurant and unknown records; categories are explicitly supplied, never inferred. The treemap specimen uses all six mutually exclusive cuisine categories: 한식, 양식, 중식, 일식, 분식, 기타 (51 dish records total).
- Bar and stacked use seven ordered sample days; grouped compares two four-day samples; heatmap uses 31 sample days starting Thursday. These are relative sample slots, not the current month or account history. No save dates or real meal dates are substituted; no real time zone is applied. Undated category samples have no invented period.
- Line and area reuse the existing four dimensionless synthetic observations. They do not assert percentages, record counts or validated taste outcomes.
- Pie denominator is the sum of its three positive category counts. Stacked counts and pie categories are disjoint. The food-kind bubble reuses `transitionBubbleItems` from the transition video: wok / dessert / beverage-pairing icons with values 3 / 8 / 18, total 29. Bubble fills and legend dots retain the original bitter / sweet / umami colors for wok / dessert / beverage-pairing. The header icon is independently fixed to umami. Card labels come from the shared food-icon catalog. These are explicitly assigned illustrative food-kind labels for this card, not classifications inferred from the transition's cuisine records. The existing static icon SVGs and the bubble entry motion are reused. Treemap values are mutually exclusive within this specimen.
- Arrays represent pre-aggregated, unique synthetic records. No account cache, repository reads or persistence are involved. Current fixtures contain known zeroes and no future/missing slots. Original graph zero/null rules are retained; unavailable reads are never fabricated as these examples.
- Production backend, web/native product callers, account isolation and loading/error/offline flows are outside this Studio-only addition. Product contracts remain in `docs/design/data-component-contract.md`.

Example: open the composition, choose `정지` for the complete board, or increase `정지 시간` to hold all nine finished graphs longer. Existing standalone graph compositions and `HomePeriodInsightCard` remain separately available.

## Verification

Local verification: TypeScript and scoped ESLint passed; the nine existing graph suites passed 41 checks. All 27 combinations of playback, stagger (0/0.1/0.3s) and hold (0/2/10s) preserved completed-card holds and correct end states. Default timing is 403 frames: every graph is settled at frame 204, with exit beginning at 324. Rendered frames 204 and 264 are byte-identical, as are blank endpoints 0 and 402. Studio inspection found no legend clipping across the nine cards. Six PNG keyframes and timing metadata are under `brand-launch/output/summary-card-grid/`. These checks cover the local Remotion specimen only.
