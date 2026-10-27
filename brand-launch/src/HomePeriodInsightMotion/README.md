# HomePeriodInsightCard

Studio: http://localhost:3110/HomePeriodInsightCard · 1920×1080 / 30fps.

## Native layout contract

The three motion examples use native source geometry, not the GIF layout:

- Taste change: the horizontal-graph variant of `TasteInsightSummaryCard` in `ios/TasteBuddy/Components/SystemParityComponents.swift`.
- Record flow and experience breadth: `HomePeriodInsightCard` / `HomePeriodInsightSparkBars` in `ios/TasteBuddy/Features/Home/HomePeriodInsightComponents.swift`.
- Shared tokens: `TBTheme.swift`, `LucideIcon.swift`, `TasteGradientIndicator.swift`.

| Element | Native values used in Remotion |
| --- | --- |
| Card | White surface, padding 12, radius 20, content-driven height |
| Header | 16pt icon/indicator, gap 6, bold 14pt label, 12pt spacing below |
| Action | Medium 11pt, #666666, gap 2, 14pt chevron |
| Period detail | Title bold 16pt, detail regular 12pt/#888888, gap 4; graph gap 16 |
| Spark bars | 132×32, horizontal inset 2, gap 4, last bar endpoint |
| Change rows | Top aligned; row 24, row gap 4; arrow-to-label gap 8, label-to-value gap 6 |
| Change text | Medium 14pt/#3F3F3F label, semibold 12pt/taste-color value |
| Change graph | Width 132, rows 24+4, track 12, core 2, node diameter 12, original domain |
| Arrow | 18pt box/radius 4, centered 9pt Lucide canvas, 24-unit native path/stroke 1.8 |
| Header icon | 16pt native category icon; first graph taste/main supplies the color. Taste change uses RefreshCw. |
| Keyword chips | Native sm: 11pt, padding 10×6, gap 6, inset border 1 |

`native.tsx` shares the card and detail label styles. Line boxes use the bundled Pretendard CoreText ascent+descent ratio 1.193359375, measured locally at 11/12/14/16pt. Native line spacing adds 2pt between title lines and 3pt between detail lines, without adding spacing before/after a one-line label.

The 3× graph amplification was removed from these cards. The former standalone reference composition was removed from Graph-Motion; these cards retain the shared line renderer and geometry. Card width 362 and video scale 1.8 are presentation choices, not hardcoded native screen dimensions.

## Motion and examples

The supplied GIF supplies entrance timing: 0.48s unfold, 0.16s card stagger, graph start 0.36s and growth 1.04s. Once every card's graph is complete, Studio's `정지 시간` holds the full stack for 1.5s by default before exit; each card then folds away in 0.32s. The default composition lasts 120 frames / 4s at 30fps. Frame-driven animation has no whole-card opacity fade. Per the latest motion direction, bars grow from one full diameter rather than being revealed by a mask. A positive bar starts circular (height = thickness) and extends upward from the fixed baseline; radius and endpoint diameter remain constant. Final height is the larger of its original proportional height and one diameter. Actual zero values remain empty. Bar thickness is capped at the 32pt plot height so sparse datasets also fit. Horizontal lines grow along their original polyline without a mask, with a fixed-size endpoint moving at the leading tip. A one-observation waiting track keeps its real observation node fixed. The GIF timing curve remains in use. The bar growth is an explicit user-directed departure from the native mask animation.

The gray indicator uses a fixed circular boundary: soft color fronts spread inward from its upper/lower edges and blend into the native weighted gradient. No expanding color circles are used. Arrows fill from tail to head, and both signed values count from 0.0 to their sample values. Static mode shows completed visuals. These animations are requested motion treatments, not claims about native app animation. Sample +15.2/-10.7 values and record arrays remain synthetic; no app data is connected. GIF causal copy/date were replaced by native summary copy and the detail label.

`showsDetailAction` lets the video show the native tappable-card appearance without connecting navigation. For app-like interactive reuse, supply `onTap` instead. Missing graph data remains absent. Optional `controls`, `balancedFooter`, `iconOverride`, and `graphContent` slots remain supported.

```tsx
<HomePeriodInsightCard
  kind="recordFlow"
  title="4번 기록"
  detail="이전 7일보다 2번 더 기록했어요."
  chartValues={[0, 1, 0, 1, 0, 1, 1]}
  graphProgress={1}
  showsDetailAction
/>
```

Run `node scripts/render-home-period-card.mjs` for keyframes, an empty example and MP4 in `output/home-period-insight-card/`. Validation covers native source values, TypeScript/ESLint, and Remotion rendering. Browser text/radius rasterization is not guaranteed pixel-identical to SwiftUI continuous corners or iOS text rendering; an iOS screenshot overlay comparison has not been performed. This is a port of the selected native components, not an assertion that the current analysis screen uses this historical summary-card data path.
