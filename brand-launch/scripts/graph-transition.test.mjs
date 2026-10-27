import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-graph-transition-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {GraphTransitionView as View} from './brand-launch/src/GraphMotion/GraphTransition';
export {MiniLineGraphView as Line} from './brand-launch/src/GraphMotion/MiniLineGraph';
export {default as Bar} from './src/components/system/plating/MiniChart';
export * from './brand-launch/src/GraphMotion/graph-transition-motion';
export * from './brand-launch/src/GraphMotion/comparison-area-transition';
export * from './brand-launch/src/GraphMotion/area-heatmap-transition';
export * from './brand-launch/src/GraphMotion/heatmap-treemap-transition';
export * from './brand-launch/src/GraphMotion/treemap-bubble-transition';
export * from './brand-launch/src/GraphMotion/bubble-pie-transition';
export {GraphTreemapBubbleView as BubbleView} from './brand-launch/src/GraphMotion/GraphTreemapBubble';
export {symbolDonutGeometry} from './src/components/system/plating/symbolDonutGeometry';
export {miniPieDefaultProps} from './brand-launch/src/GraphMotion/mini-pie-settings';
export {MiniPieGraphView as PieView} from './brand-launch/src/GraphMotion/MiniPieGraph';
export {PIE_TIMING} from './brand-launch/src/GraphMotion/mini-pie-motion';
export {miniLineTiming} from './brand-launch/src/GraphMotion/mini-line-motion';
export {miniBubblePose, BUBBLE_TIMING, BUBBLE_PEAK_PROGRESS} from './brand-launch/src/GraphMotion/mini-bubble-motion';
export {miniBubbleGeometry} from './src/components/system/plating/miniBubbleGeometry';
export {default as Treemap} from './src/components/system/plating/MiniTreemapChart';
export {miniTreemapItems} from './brand-launch/src/GraphMotion/mini-treemap-motion';
export {miniTreemapDefaultProps} from './brand-launch/src/GraphMotion/mini-treemap-settings';
export {miniHeatmapGeometry} from './src/components/system/plating/miniHeatmapGeometry';
export {miniHeatmapColor} from './src/components/system/plating/MiniHeatmap';
export {miniHeatmapDefaultProps, HEATMAP_WEEKDAYS} from './brand-launch/src/GraphMotion/mini-heatmap-settings';
export {roundedLineCorners} from './src/components/system/roundedLinePath';
export {pointOnRoundedTrack} from './brand-launch/src/GraphMotion/rounded-line-track';
export * from './brand-launch/src/GraphMotion/graph-transition-settings';
export {TASTE_TOKENS, TASTE_TINTS} from './src/constants/designTokens';
export {createElement as h} from 'react';
export {renderToStaticMarkup as render} from 'react-dom/server';
`,
    resolveDir: root,
    loader: "tsx",
  },
  outfile,
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  logLevel: "silent",
  alias: {
    react: path.join(root, "node_modules/react"),
    "react-dom": path.join(root, "node_modules/react-dom"),
  },
});
const {
  View,
  Line,
  Bar,
  graphTransitionPose: pose,
  comparisonAreaTransitionPose: areaPose,
  comparisonAreaTargets: areaTargets,
  comparisonAreaHeight: areaHeight,
  COMPARISON_TIMING: areaTiming,
  COMPARISON_CAPSULE_DELAY,
  COMPARISON_CORNER_FRAMES,
  AREA_HEATMAP_TIMING: heatmapTiming,
  areaHeatmapTransitionPose: heatmapPose,
  heatmapTreemapTransitionPose: treemapPose,
  HEATMAP_TREEMAP_TIMING: treemapTiming,
  TREEMAP_BUBBLE_TIMING: bubbleTransitionTiming,
  treemapBubbleTransitionPose: bubbleTransitionPose,
  transitionBubbleItems,
  transitionBubbleOffsetX,
  BUBBLE_PIE_TIMING: pieTransitionTiming,
  bubblePieTransitionPose: pieTransitionPose,
  transitionPieSegments,
  transitionPieTargets,
  BubbleView,
  symbolDonutGeometry,
  miniPieDefaultProps,
  PieView,
  PIE_TIMING,
  miniBubblePose,
  BUBBLE_TIMING,
  BUBBLE_PEAK_PROGRESS,
  miniBubbleGeometry,
  Treemap,
  miniTreemapItems,
  miniTreemapDefaultProps,
  miniHeatmapGeometry,
  miniHeatmapColor,
  miniHeatmapDefaultProps,
  HEATMAP_WEEKDAYS,
  roundedLineCorners,
  pointOnRoundedTrack,
  TRANSITION_TIMING: timing,
  graphTransitionDefaultProps: base,
  graphTransitionLineProps: lineProps,
  graphTransitionSchema: schema,
  GRAPH_TRANSITION_DURATION,
  GRAPH_TRANSITION_HOLD_FRAMES,
  miniLineTiming,
  TASTE_TOKENS,
  TASTE_TINTS,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));

const tags = (html) =>
  [...html.matchAll(/<(?:path|circle|rect)\b[^>]*>/g)].map(([tag]) =>
    Object.fromEntries(
      [...tag.matchAll(/([\w-]+)="([^"]*)"/g)]
        .filter(([, key]) =>
          [
            "d",
            "x",
            "y",
            "cx",
            "cy",
            "r",
            "rx",
            "width",
            "height",
            "fill",
            "stroke",
            "stroke-width",
            "stroke-dasharray",
            "stroke-dashoffset",
          ].includes(key),
        )
        .map(([, key, value]) => [
          key,
          value
            .replace(/url\(#[^)]*\)/g, "gradient")
            .replace(
              "var(--tb-mini-chart-track)",
              TASTE_TOKENS.umami.palette.chartTrack,
            )
            .replace(/var\(--tb-taste-umami-main,\s*(#[\da-fA-F]+)\)/g, "$1")
            .replace(
              /var\(--tb-taste-umami-chart-main,\s*(#[\da-fA-F]+)\)/g,
              "$1",
            ),
        ]),
    ),
  );
const samples = [
  base,
  { ...base, 데이터: [{ 미각: "감칠맛", 기록: [0, 0, 0, 0] }] },
  {
    ...base,
    데이터: [{ 미각: "감칠맛", 기록: [4, 1, -2, -5] }],
    "막대 기록": [2, 8, 1, 4, 0, 3, 6],
  },
];
const near = (a, b, message) =>
  assert.ok(Math.abs(a - b) < 1e-7, message ?? `${a} != ${b}`);

test("the four source values and fixed rounded entrance stay continuous at the handoff", () => {
  assert.equal(GRAPH_TRANSITION_DURATION, 1566);
  assert.deepEqual(base.데이터[0].기록, [1.2, 2.1, 2.4, 4.5]);
  for (const graph of samples) {
    assert.ok(schema.safeParse(graph).success);
    assert.equal(pose(timing.gatherStart, graph).line.points.length, 4);
    for (const frame of [
      0,
      21,
      51,
      87,
      timing.gatherStart - 1,
      timing.gatherStart,
    ]) {
      const expected = render(
        h(Line, {
          graph: lineProps(graph),
          frame,
          fps: 60,
          roundTrackJoins: true,
          currentNodeRadius: 6,
        }),
      );
      const actual = render(h(View, { graph, frame }));
      assert.deepEqual(tags(actual), tags(expected));
      assert.match(actual, /stroke-linejoin="round"/);
    }
  }
});

test("the complete path never deforms while the node reveals its fixed trail", () => {
  for (const graph of [
    ...samples,
    { ...base, 데이터: [{ 미각: "감칠맛", 기록: [0, 5, 0, 5] }] },
  ]) {
    const track = pose(timing.gatherStart, graph).track;
    let previousReveal = 0;
    for (let frame = 15; frame < timing.gatherEnd; frame++) {
      const marks = tags(render(h(View, { graph, frame })));
      const paths = marks.filter((mark) => mark.d);
      paths.forEach((mark) => assert.equal(mark.d, track.path));
      const backdrop = paths[0];
      const revealed = Number(backdrop["stroke-dasharray"].split(" ")[0]);
      assert.ok(revealed >= previousReveal);
      assert.ok(revealed <= track.length);
      previousReveal = revealed;
      if (frame < timing.gatherStart) {
        const node = marks.at(-1);
        const endpoint = pointOnRoundedTrack(track, revealed);
        near(Number(node.cx), endpoint.x);
        near(Number(node.cy), endpoint.y);
        assert.equal(node.r, "6");
        assert.equal(backdrop["stroke-width"], "12");
      }
    }
    for (let frame = timing.gatherEnd; frame < timing.dropStart; frame++) {
      const paths = tags(render(h(View, { graph, frame }))).filter(
        (mark) => mark.d,
      );
      assert.equal(paths.length, 6);
      paths.forEach((mark) => assert.equal(mark.d, track.path));
    }
  }
});

test("thin line and history converge to the surviving right node before six backdrop seeds split", () => {
  for (const graph of samples) {
    const source = pose(timing.gatherStart, graph).track;
    let previous = source.distances
      .slice(0, -1)
      .map((distance) => pointOnRoundedTrack(source, distance));
    for (let frame = timing.gatherStart; frame <= timing.dropStart; frame++) {
      const current = pose(frame, graph);
      assert.equal(current.chunks.length, 6);
      assert.equal(current.seeds.length, 7);
      assert.equal(current.history.length, 3);
      current.historyDistances.forEach((distance, index) => {
        near(
          distance - source.distances[index],
          source.length * current.gather,
        );
        if (index)
          near(
            distance - current.historyDistances[index - 1],
            source.distances[index] - source.distances[index - 1],
          );
      });
      near(current.seeds[6].cx, source.points.at(-1).x);
      near(current.seeds[6].cy, source.points.at(-1).y);
      assert.equal(current.seeds[6].radius, 6);
      current.history.forEach((point, i) =>
        assert.ok(point.x >= previous[i].x - 1e-8),
      );
      previous = current.history;
      const html = render(h(View, { graph, frame }));
      assert.equal((html.match(/data-mark="current"/g) ?? []).length, 1);
      if (frame >= timing.gatherEnd) {
        assert.doesNotMatch(html, /data-mark="line"|data-mark="history"/);
        assert.equal(
          (html.match(/data-seed-origin="background"/g) ?? []).length,
          6,
        );
      }
    }
    const joined = pose(timing.gatherEnd, graph);
    joined.history.forEach((point) =>
      assert.deepEqual(point, source.points.at(-1)),
    );
    joined.chunks.forEach((chunk, i) => {
      if (i) near(joined.chunks[i - 1].to, chunk.from);
    });
    const split = pose(timing.dropStart, graph);
    split.chunks.forEach((chunk, i) =>
      [chunk.from, chunk.to].forEach((distance) => {
        const point = pointOnRoundedTrack(split.track, distance);
        near(point.x, split.seeds[i].origin.x);
        near(point.y, split.seeds[i].origin.y);
      }),
    );
  }
});

test("seven seeds fall without crossing the floor, bounce once and settle before bottom-anchored growth", () => {
  for (const graph of samples) {
    const initial = pose(timing.dropStart, graph);
    initial.seeds.forEach((seed) => {
      near(seed.cx, seed.origin.x);
      near(seed.cy, seed.origin.y);
      assert.ok(seed.landingFrame + timing.bounceFrames < timing.growStart);
      const contact = pose(seed.landingFrame, graph).seeds[seed.index];
      near(contact.y + contact.height, 56);
      const bounce = pose(seed.landingFrame + timing.bounceFrames / 2, graph)
        .seeds[seed.index];
      assert.ok(bounce.y + bounce.height < 56);
      near(56 - bounce.y - bounce.height, seed.bounceHeight);
      assert.ok(seed.bounceHeight <= timing.maximumBounceHeight);
      const rest = pose(seed.landingFrame + timing.bounceFrames, graph).seeds[
        seed.index
      ];
      near(rest.y + rest.height, 56);
    });
    const byHeight = [...initial.seeds].sort((a, b) => b.origin.y - a.origin.y);
    for (let i = 1; i < byHeight.length; i++) {
      assert.ok(byHeight[i].bounceHeight >= byHeight[i - 1].bounceHeight);
    }
    for (let frame = timing.dropStart; frame < areaTiming.roundStart; frame++) {
      const current = pose(frame, graph);
      current.seeds.forEach((seed) => {
        assert.ok(seed.x >= -1e-8 && seed.x + seed.width <= 132 + 1e-8);
        assert.ok(seed.y >= -1e-8 && seed.y + seed.height <= 56 + 1e-8);
        assert.ok(seed.grow >= 0 && seed.grow <= 1);
        if (frame >= timing.growStart + seed.index * timing.growStagger)
          near(seed.y + seed.height, 56);
      });
      assert.equal(current.seeds[6].radius, 6);
      assert.doesNotMatch(render(h(View, { graph, frame })), /NaN|Infinity/);
    }
  }
});

test("the final bars preserve source geometry except the requested 48px final specimen bar", () => {
  for (const graph of samples) {
    const expected = tags(
      render(h(Bar, { values: graph["막대 기록"], axis: "umami" })),
    );
    if (graph["막대 기록"].at(-1) > 1) {
      expected.at(-2).height = "48";
      expected.at(-2).y = "8";
      expected.at(-1).cy = "14";
    }
    for (const frame of [timing.settled, areaTiming.roundStart - 1]) {
      const actual = render(h(View, { graph, frame }));
      assert.deepEqual(tags(actual), expected);
      assert.equal(
        (actual.match(/data-seed-origin="background"/g) ?? []).length,
        6,
      );
      assert.equal((actual.match(/data-mark="current"/g) ?? []).length, 1);
    }
    assert.deepEqual(
      pose(timing.settled, graph),
      pose(areaTiming.roundStart - 1, graph),
    );
  }
  const empty = { ...base, 데이터: [] };
  for (const frame of [0, 120, 178, 228, 299]) {
    assert.equal(pose(frame, empty), null);
    assert.equal(tags(render(h(View, { graph: empty, frame }))).length, 0);
  }
});

test("seven bars become equal circles around the same floor while the dark node waits", () => {
  for (const graph of [base, { ...base, "막대 기록": [1, 7, 0, 2, 6, 3, 4] }]) {
    const bars = pose(299, graph).bars;
    near(bars[0].x, 0);
    near(bars.at(-1).x + bars.at(-1).width, 132);
    let previous = bars.map((b) => b.height);
    for (
      let frame = areaTiming.roundStart;
      frame <= areaTiming.nodeDropStart;
      frame++
    ) {
      const p = areaPose(frame, graph, bars);
      p.circles.forEach((circle, i) => {
        near(circle.y + circle.height, 56);
        near(circle.x, bars[i].x);
        near(circle.width, 12);
        assert.ok(
          Math.abs(circle.height - 12) <= Math.abs(previous[i] - 12) + 1e-8,
        );
        if (frame >= areaTiming.roundEnd) near(circle.height, 12);
        previous[i] = circle.height;
      });
      near(p.node.cx, 126);
      near(p.node.cy, bars.at(-1).y + 6);
    }
    const start = areaPose(areaTiming.roundStart, graph, bars);
    start.circles.forEach((b, i) => near(b.height, bars[i].height));
  }
  const bars = pose(299, base).bars;
  assert.ok(
    areaPose(areaTiming.roundStart + 18, base, bars).circles[0].height >
      bars[0].height,
  );
  const line = pose(90, base).line;
  near(line.points[0].x - 6, 0);
  near(line.current.x + 6, 132);
});

test("the dark node drops for 0.41 seconds while bars finish rounding, with one small bounce", () => {
  const bars = pose(299, base).bars;
  const p = areaPose(areaTiming.nodeDropStart, base, bars),
    y = p.node.cy;
  assert.equal(areaTiming.nodeDropStart, areaTiming.roundEnd - 12);
  near(
    areaPose(areaTiming.nodeDropStart + 10, base, bars).node.cy,
    y + (50 - y) * (10 / timing.currentNodeFallFrames) ** 2,
  );
  const landing = p.node.landingFrame;
  near(areaPose(landing, base, bars).node.cy, 50);
  near(
    areaPose(landing + timing.bounceFrames / 2, base, bars).node.cy,
    50 - p.node.bounceHeight,
  );
  near(areaPose(landing + timing.bounceFrames, base, bars).node.cy, 50);
  assert.ok(landing + timing.bounceFrames < areaTiming.connectStart);
  for (
    let frame = areaTiming.nodeDropStart;
    frame <= areaTiming.spreadStart;
    frame++
  )
    assert.ok(areaPose(frame, base, bars).node.cy + 6 <= 56 + 1e-8);
  const landed = areaPose(areaTiming.spreadStart, base, bars);
  near(landed.small.top[0].x, landed.node.cx - 6);
  near(landed.small.top.at(-1).x, landed.node.cx + 6);
  assert.ok(
    landed.small.corners.every((c) => c && Math.abs(c.radius - 6) < 1e-8),
  );
});

test("both dark-node drops retain their starting positions and share a 36px, 0.41-second fall", () => {
  const firstStart = timing.dropStart + 6 * timing.dropStagger;
  const first = pose(firstStart, base).seeds[6];
  const bars = pose(299, base).bars;
  const second = areaPose(areaTiming.nodeDropStart, base, bars).node;
  near(bars.at(-1).height, 48);
  near(first.origin.y, 14);
  near(first.cy, second.cy);
  near(50 - first.cy, 36);
  near(50 - second.cy, 36);
  near((first.landingFrame - firstStart) / 60, 0.41);
  near((second.landingFrame - areaTiming.nodeDropStart) / 60, 0.41);
  for (
    let elapsed = 0;
    elapsed <= timing.currentNodeFallFrames + timing.bounceFrames;
    elapsed += 0.5
  ) {
    const a = pose(firstStart + elapsed, base).seeds[6];
    const b = areaPose(areaTiming.nodeDropStart + elapsed, base, bars).node;
    near(a.cy, b.cy);
    near(a.bounceHeight, b.bounceHeight);
  }
});

test("circles rebuild a fixed horizontal track and the dark capsule waits until the fourth large corner finishes", () => {
  const bars = pose(299, base).bars;
  assert.equal(
    areaTiming.spreadStart - areaTiming.connectStart,
    COMPARISON_CAPSULE_DELAY,
  );
  assert.equal(
    areaTiming.spreadEnd - areaTiming.connectEnd,
    COMPARISON_CAPSULE_DELAY,
  );
  const fourthCornerEnd =
    areaTiming.largeShapeStart + 4 * COMPARISON_CORNER_FRAMES;
  assert.equal(areaTiming.spreadStart, fourthCornerEnd);
  for (let frame = areaTiming.connectStart; frame <= fourthCornerEnd; frame++) {
    const p = areaPose(frame, base, bars);
    near(p.spread, 0);
    near(p.small.top.at(-1).x - p.small.top[0].x, 12);
  }
  const growing = areaPose(fourthCornerEnd + 1, base, bars);
  assert.ok(growing.spread > 0);
  assert.deepEqual(growing.largeCornerProgress, [1, 1, 1, 1]);
  assert.equal(growing.phase, "small-capsule-extend");
  const first = areaPose(areaTiming.connectStart, base, bars);
  first.segments.forEach((segment, i) => {
    near(segment.from, bars[i].x + 6);
    near(segment.to, segment.from);
  });
  for (
    let frame = areaTiming.connectStart;
    frame <= areaTiming.connectEnd;
    frame++
  ) {
    const p = areaPose(frame, base, bars),
      follower = areaPose(frame + COMPARISON_CAPSULE_DELAY, base, bars);
    near(p.connection, follower.spread);
    near(p.track.from - 6, 0);
    near(p.track.to + 6, 132);
    near(p.track.y + 6, 56);
    p.segments.forEach((segment, i) => {
      assert.ok(segment.from <= bars[i].x + 6 && segment.to >= bars[i].x + 6);
      assert.ok(segment.from >= 6 && segment.to <= 126);
    });
    near(p.largeShape, 0);
    near(follower.smallShape, 0);
    follower.small.top.forEach((point) => near(point.y, 44));
    near(follower.small.top.at(-1).x, 132);
    near(follower.small.floor, 56);
  }
  const last = areaPose(areaTiming.connectEnd, base, bars);
  last.segments
    .slice(1)
    .forEach((segment, i) => near(segment.from, last.segments[i].to));
  near(last.large.top[0].x, 0);
  near(last.large.top.at(-1).x, 132);
  last.large.top.forEach((point) => near(point.y, 44));
  const html = render(
    h(View, { graph: base, frame: areaTiming.connectStart + 15 }),
  );
  assert.equal((html.match(/data-mark="joining-segment"/g) || []).length, 7);
  assert.equal((html.match(/stroke-linecap="round"/g) || []).length, 7);
  assert.doesNotMatch(html, /metaball|<filter|<mask/);
});

test("both areas adjust height in order while retaining the floor and rounded bends", () => {
  const bars = pose(299, base).bars;
  assert.equal(
    areaTiming.spreadStart,
    areaTiming.largeShapeStart + 4 * COMPARISON_CORNER_FRAMES,
  );
  assert.equal(areaTiming.smallShapeStart, areaTiming.spreadEnd);
  assert.ok(areaTiming.smallShapeStart >= areaTiming.largeShapeEnd);
  assert.equal(
    areaTiming.settled - areaTiming.smallShapeStart,
    areaTiming.largeShapeEnd - areaTiming.largeShapeStart,
  );
  for (
    let frame = areaTiming.largeShapeStart;
    frame <= areaTiming.largeShapeEnd;
    frame++
  ) {
    const p = areaPose(frame, base, bars),
      follower = areaPose(
        frame + areaTiming.smallShapeStart - areaTiming.largeShapeStart,
        base,
        bars,
      );
    near(p.smallShape, 0);
    near(follower.largeShape, 1);
    near(p.largeShape, follower.smallShape);
    for (const surface of [p.large, follower.small]) {
      near(surface.floor, 56);
      near(surface.top[0].x, 0);
      near(surface.top.at(-1).x, 132);
      assert.ok(surface.top.every((point) => point.y >= 0 && point.y <= 56));
      assert.doesNotMatch(surface.path, /NaN|Infinity/);
    }
  }
  for (const frame of [306, 348, 400, 435, 500, 659])
    assert.equal(
      tags(render(h(View, { graph: { ...base, 데이터: [] }, frame }))).length,
      0,
    );
  assert.ok(
    !schema.safeParse({ ...base, "작은 영역 값": [20, 3, 4, 6] }).success,
  );
});

test("both comparison surfaces match the bars' actual width and use the line's R12 bends", () => {
  for (const graph of [
    base,
    { ...base, "큰 영역 값": [10, 8, 5, 4], "작은 영역 값": [6, 4, 3, 2] },
    { ...base, "큰 영역 값": [4, 10, 6, 8], "작은 영역 값": [2, 5, 3, 4] },
    { ...base, "큰 영역 값": [6, 6, 6, 6], "작은 영역 값": [3, 3, 3, 3] },
  ]) {
    assert.ok(schema.safeParse(graph).success);
    const bars = pose(299, graph).bars,
      target = areaTargets(graph, bars);
    near(target.bounds.left, bars[0].x);
    near(target.bounds.right, bars.at(-1).x + bars.at(-1).width);
    for (const surface of [target.large, target.small]) {
      near(surface.top[0].x, target.bounds.left);
      near(surface.top.at(-1).x, target.bounds.right);
      const line = roundedLineCorners(surface.top, 12);
      for (let i = 1; i < surface.top.length - 1; i++)
        assert.deepEqual(surface.corners[i], line[i]);
      for (const i of [
        0,
        surface.top.length - 1,
        surface.top.length,
        surface.top.length + 1,
      ]) {
        if (surface.corners[i])
          assert.ok(surface.corners[i].radius <= 6 + 1e-8);
      }
    }
    const final = areaPose(areaTiming.settled, graph, bars);
    assert.deepEqual(final.small.top, target.small.top);
    assert.equal(final.largePath, target.large.path);
    assert.equal(final.small.path, target.small.path);
    const holdFrame = areaTiming.settled + 17;
    const html = render(h(View, { graph, frame: holdFrame }));
    assert.equal((html.match(/<path /g) || []).length, 2);
    assert.doesNotMatch(html, /<circle|<rect|<filter|opacity=/);
    assert.equal(
      html,
      render(h(View, { graph, frame: areaTiming.settled })).replace(
        `data-frame="${areaTiming.settled}"`,
        `data-frame="${holdFrame}"`,
      ),
    );
  }
});

test("the falling node changes from main to tint/20 and keeps tint/20 from landing onward", () => {
  for (const [axis, taste] of Object.entries(TASTE_TOKENS)) {
    const graph = {
      ...base,
      데이터: [{ ...base.데이터[0], 미각: taste.label }],
    };
    const bars = pose(299, graph).bars;
    const landing = areaPose(areaTiming.nodeDropStart, graph, bars).node
      .landingFrame;
    const fillAt = (frame) =>
      render(h(View, { graph, frame })).match(
        /<(?:circle|path)\b[^>]*data-mark="(?:current|comparison-small)"[^>]*fill="([^"]*)"/,
      )?.[1];
    for (const frame of [
      areaTiming.nodeDropStart - 1,
      areaTiming.nodeDropStart,
    ]) {
      assert.equal(fillAt(frame), taste.palette.main);
      near(areaPose(frame, graph, bars).node.colorProgress, 0);
    }
    const mid = (areaTiming.nodeDropStart + landing) / 2;
    near(areaPose(mid, graph, bars).node.colorProgress, 0.5);
    assert.notEqual(fillAt(mid), taste.palette.main);
    assert.notEqual(fillAt(mid), TASTE_TINTS[axis][20]);
    for (const frame of [
      landing,
      landing + 7,
      areaTiming.connectStart + 9,
      areaTiming.connectEnd + 12,
      areaTiming.largeShapeEnd - 12,
      areaTiming.smallShapeStart,
      areaTiming.settled + 17,
    ]) {
      assert.equal(fillAt(frame), TASTE_TINTS[axis][20]);
      near(areaPose(frame, graph, bars).node.colorProgress, 1);
    }
  }
  const flat = { ...base, "막대 기록": [1, 1, 1, 1, 1, 1, 1] };
  const bars = pose(299, flat).bars;
  near(areaPose(areaTiming.nodeDropStart, flat, bars).node.colorProgress, 1);
});

test("area corners follow the individual Area specimen one at a time, with a varied dark contour", () => {
  const bars = pose(299, base).bars;
  assert.equal(COMPARISON_CAPSULE_DELAY, 144);
  assert.equal(COMPARISON_CORNER_FRAMES, 18);
  for (const [start, key, surfaceKey] of [
    [areaTiming.largeShapeStart, "largeCornerProgress", "large"],
    [areaTiming.smallShapeStart, "smallCornerProgress", "small"],
  ]) {
    for (let corner = 0; corner < 4; corner++) {
      const p = areaPose(start + corner * 18 + 9, base, bars);
      p[key].forEach((v, i) =>
        near(v, i < corner ? 1 : i === corner ? 0.875 : 0),
      );
      p[surfaceKey].top.forEach((point, i) =>
        near(point.y, 44 + (p.target[surfaceKey].top[i].y - 44) * p[key][i]),
      );
      near(p[surfaceKey].floor, 56);
      near(p[surfaceKey].top[0].x, 0);
      near(p[surfaceKey].top.at(-1).x, 132);
    }
  }
  const target = areaTargets(base, bars);
  let previousFirstHeight = 12;
  for (
    let frame = areaTiming.smallShapeStart;
    frame <= areaTiming.smallShapeStart + COMPARISON_CORNER_FRAMES;
    frame++
  ) {
    const current = areaPose(frame, base, bars).small;
    const firstHeight = current.floor - current.top[0].y;
    assert.ok(firstHeight >= previousFirstHeight - 1e-8);
    assert.ok(firstHeight >= 12);
    current.top.slice(1).forEach((point) => near(current.floor - point.y, 12));
    previousFirstHeight = firstHeight;
  }
  near(target.small.top[0].y, 39.111111111111114);
  near(target.small.top[1].y, 36.66666666666667);
  near(target.small.top[2].y, 29.333333333333336);
  near(target.small.top[3].y, 17.111111111111107);
  assert.ok(target.small.top[1].y < target.small.top[0].y);
  assert.ok(target.small.top[2].y < target.small.top[1].y);
  assert.ok(target.small.top[3].y < target.small.top[2].y);
  target.small.top.forEach((p, i) => assert.ok(p.y >= target.large.top[i].y));
});

test("area value one matches the 12px bar circle on a shared scale without lifting zero", () => {
  for (const maximum of [1, 2, 10, 1000000]) {
    near(areaHeight(0, maximum), 0);
    near(areaHeight(0.5, maximum), 6);
    near(areaHeight(1, maximum), 12);
    if (maximum > 1) near(areaHeight(maximum, maximum), 56);
  }
  const graph = {
    ...base,
    "큰 영역 값": [1, 4, 7, 10],
    "작은 영역 값": [1, 2, 4, 6.5],
  };
  const bars = pose(299, graph).bars;
  const target = areaTargets(graph, bars);
  near(target.large.floor - target.large.top[0].y, bars[1].height);
  near(target.small.floor - target.small.top[0].y, 12);
  near(target.large.top[0].y, target.small.top[0].y);
  const ones = areaTargets(
    { ...base, "큰 영역 값": [1, 1, 1, 1], "작은 영역 값": [1, 1, 1, 1] },
    bars,
  );
  for (const layer of [ones.large, ones.small]) {
    layer.top.forEach((point) => near(layer.floor - point.y, 12));
    assert.doesNotMatch(layer.path, /NaN|Infinity/);
  }
});

test("the large area fills point 3 then 2 then 1 while the fourth point stays anchored", () => {
  const bars = pose(299, base).bars;
  const source = areaPose(areaTiming.settled, base, bars);
  const start = heatmapPose(heatmapTiming.start, base, bars);
  assert.equal(start.large.path, source.large.path);
  assert.equal(start.small.path, source.small.path);
  assert.equal(heatmapTiming.start, 773);
  assert.equal(heatmapTiming.end, treemapTiming.start);
  for (let step = 0; step < 3; step++) {
    const p = heatmapPose(heatmapTiming.start + step * 24 + 12, base, bars);
    p.pointProgress.forEach((v, i) =>
      near(v, i === 3 ? 0 : i > 2 - step ? 1 : i === 2 - step ? 0.875 : 0),
    );
  }
  for (
    let frame = heatmapTiming.start;
    frame <= heatmapTiming.fillEnd;
    frame++
  ) {
    const p = heatmapPose(frame, base, bars);
    near(p.large.top[3].y, source.large.top[3].y);
    near(p.large.floor, 56);
    p.large.top.forEach((point, i) => {
      near(point.x, source.large.top[i].x);
      assert.ok(point.y >= 0 && point.y <= source.large.top[i].y);
    });
    assert.doesNotMatch(p.large.path, /NaN|Infinity/);
  }
  heatmapPose(heatmapTiming.fillEnd, base, bars).large.top.forEach((point) =>
    near(point.y, 0),
  );
});

test("the small area exactly reverses its height and capsule motion before disappearing at the right node", () => {
  const bars = pose(299, base).bars;
  for (
    let frame = heatmapTiming.start;
    frame <= heatmapTiming.collapseEnd;
    frame++
  ) {
    const p = heatmapPose(frame, base, bars);
    const reverse = areaPose(
      areaTiming.settled - (frame - heatmapTiming.start),
      base,
      bars,
    );
    assert.equal(p.small.path, reverse.small.path);
    near(p.small.floor, 56);
    near(p.small.top.at(-1).x, 132);
  }
  const collapsed = heatmapPose(heatmapTiming.collapseEnd, base, bars);
  near(collapsed.small.top[0].x, 120);
  near(collapsed.node.cx, 126);
  near(collapsed.node.cy, 50);
  near(collapsed.node.radius, 6);
  near(collapsed.outerRadius, 6);
  for (
    let frame = heatmapTiming.collapseEnd;
    frame < heatmapTiming.nodeExitEnd;
    frame++
  ) {
    const p = heatmapPose(frame, base, bars);
    near(p.node.cx, 126);
    near(p.node.cy, 50);
    assert.ok(p.node.radius > 0 && p.node.radius <= 6);
    near(p.outerRadius, 2 + (4 * p.node.radius) / 6);
    const corners = p.large.corners.filter(Boolean);
    assert.equal(corners.length, 4);
    corners.forEach((corner) => near(corner.radius, p.outerRadius));
  }
  const vanished = heatmapPose(heatmapTiming.nodeExitEnd, base, bars);
  near(vanished.outerRadius, 2);
  vanished.large.corners
    .filter(Boolean)
    .forEach((corner) => near(corner.radius, 2));
  assert.doesNotMatch(
    render(h(View, { graph: base, frame: heatmapTiming.nodeExitEnd })),
    /reversing-small-area|disappearing-node/,
  );
  assert.ok(heatmapTiming.splitStart > heatmapTiming.nodeExitEnd);
});

test("a filled panel divides continuously into the original heatmap's 35 cells, 2px gaps and R2 corners", () => {
  const bars = pose(299, base).bars;
  const target = miniHeatmapGeometry(
    miniHeatmapDefaultProps.기록,
    HEATMAP_WEEKDAYS.indexOf(miniHeatmapDefaultProps["시작 요일"]),
  );
  const start = heatmapPose(heatmapTiming.splitStart, base, bars);
  assert.equal(start.cells.length, 35);
  near(
    start.cells.reduce((sum, cell) => sum + cell.width * cell.height, 0),
    132 * 56,
  );
  near(start.outerRadius, 2);
  start.cells.forEach((cell) => near(cell.radius, 0));
  for (
    let frame = heatmapTiming.splitStart;
    frame <= heatmapTiming.splitEnd;
    frame++
  ) {
    const p = heatmapPose(frame, base, bars);
    near(p.outerRadius, 2);
    p.cells.forEach((cell, index) => {
      assert.ok(cell.width > 0 && cell.height > 0);
      assert.ok(cell.x >= 0 && cell.y >= 0);
      assert.ok(cell.x + cell.width <= 132 + 1e-8);
      assert.ok(cell.y + cell.height <= 56 + 1e-8);
      near(cell.radius, 2 * p.split);
      if (index % 7 !== 6)
        near(p.cells[index + 1].x - cell.x - cell.width, 2 * p.split);
      if (index < 28)
        near(p.cells[index + 7].y - cell.y - cell.height, 2 * p.split);
    });
  }
  const final = heatmapPose(heatmapTiming.splitEnd, base, bars);
  final.cells.forEach((cell, index) => {
    for (const key of ["x", "y", "width", "height"])
      near(cell[key], target[index][key]);
    near(cell.radius, 2);
  });
  const html = render(h(View, { graph: base, frame: heatmapTiming.end - 1 }));
  assert.equal((html.match(/data-mark="heatmap-cell"/g) || []).length, 35);
  assert.doesNotMatch(
    html,
    /reversing-small-area|disappearing-node|<filter|opacity=/,
  );
  assert.equal(
    tags(
      render(
        h(View, {
          graph: { ...base, 데이터: [] },
          frame: GRAPH_TRANSITION_DURATION - 1,
        }),
      ),
    ).length,
    0,
  );
});

test("heatmap color steps share each palette level, stop at each cell's target and leave geometry fixed", () => {
  const bars = pose(299, base).bars;
  assert.equal(heatmapTiming.colorStart, 971);
  assert.equal(heatmapTiming.colorSettle, 1019);
  assert.equal(heatmapTiming.end, treemapTiming.start);
  const initial = heatmapPose(heatmapTiming.splitEnd, base, bars);
  near(initial.colorProgress, 0);
  near(initial.calendarProgress, 0);
  const cellTags = (graph, frame) =>
    [
      ...render(h(View, { graph, frame })).matchAll(
        /<rect\b[^>]*data-mark="heatmap-cell"[^>]*>/g,
      ),
    ].map(([tag]) =>
      Object.fromEntries(
        [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]),
      ),
    );
  for (const [axis, taste] of Object.entries(TASTE_TOKENS)) {
    const graph = {
      ...base,
      데이터: [{ ...base.데이터[0], 미각: taste.label }],
    };
    const before = cellTags(graph, heatmapTiming.splitEnd);
    before.forEach((cell) => assert.equal(cell.fill, TASTE_TINTS[axis][80]));
    for (let level = 1; level <= 4; level++) {
      const frame = heatmapTiming.colorStart + level * 12;
      const p = heatmapPose(frame, graph, bars);
      assert.deepEqual(p.cells, initial.cells);
      const rendered = cellTags(graph, frame);
      rendered.forEach((cell, i) =>
        assert.equal(
          cell.fill,
          initial.cells[i].padding
            ? miniHeatmapColor(null, axis)
            : miniHeatmapColor(Math.min(level, initial.cells[i].level), axis),
        ),
      );
      // Still-advancing cells keep changing across the former four-frame hold.
      for (let current = frame - 4; current <= frame; current++) {
        const now = cellTags(graph, current),
          previous = cellTags(graph, current - 1);
        now.forEach((cell, i) => {
          if (!initial.cells[i].padding && initial.cells[i].level >= level)
            assert.notEqual(cell.fill, previous[i].fill);
          else assert.equal(cell.fill, previous[i].fill);
          assert.equal(cell.opacity, undefined);
        });
      }
    }
    assert.deepEqual(
      cellTags(graph, heatmapTiming.colorSettle),
      cellTags(graph, heatmapTiming.end - 1),
    );
  }
  assert.equal(
    initial.cells.filter((cell) => cell.level === 4 && !cell.padding).length,
    3,
  );
});

test("heatmap-to-treemap merges R2 cells directly into the final rounded blocks", () => {
  const bars = pose(299, base).bars;
  const start = treemapPose(treemapTiming.start, base, bars);
  assert.equal(treemapTiming.start, 1079);
  assert.equal(treemapTiming.end, bubbleTransitionTiming.start);
  assert.deepEqual(
    start.groups.map((group) => group.count),
    [2, 6, 12, 8, 4, 3],
  );
  assert.equal(new Set(start.tiles.map((tile) => tile.slot)).size, 35);
  const initial = render(h(View, { graph: base, frame: treemapTiming.start }));
  assert.equal((initial.match(/data-mark="merging-cell"/g) || []).length, 35);
  assert.ok(tags(initial).every((tag) => tag.rx === "2"));
  const neutral = render(
    h(View, { graph: base, frame: treemapTiming.start + 12 }),
  );
  assert.ok(tags(neutral).every((tag) => tag.fill === miniHeatmapColor(null)));
  const middle = render(
    h(View, { graph: base, frame: treemapTiming.start + 30 }),
  );
  assert.equal((middle.match(/data-mark="merging-region"/g) || []).length, 6);
  assert.ok(tags(middle).every((tag) => tag.fill === miniHeatmapColor(null)));
  assert.doesNotMatch(
    middle,
    /gap-bridge|settling-outline|merging-cell|NaN|Infinity/,
  );
  const packed = treemapPose(treemapTiming.packEnd, base, bars);
  packed.groups.forEach((group) => {
    assert.equal(group.progress, 1);
    assert.equal(group.radius, Math.min(group.width, group.height) / 2);
  });
  // The former contour-filter release inflated small blocks by up to 8% in
  // one late frame. Measure the densely sampled outline to catch that recoil.
  const outlineArea = (path) => {
    const points = [
      ...path.matchAll(/Q\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/g),
    ].map((match) => [Number(match[3]), Number(match[4])]);
    assert.ok(points.length > 3);
    return Math.abs(
      points.reduce((area, point, i) => {
        const next = points[(i + 1) % points.length];
        return area + point[0] * next[1] - point[1] * next[0];
      }, 0) / 2,
    );
  };
  const targetAreas = packed.groups.map(
    (group) => group.width * group.height - (4 - Math.PI) * group.radius ** 2,
  );
  let previousAreas, previousSteps;
  for (
    let frame = treemapTiming.packEnd - 12;
    frame < treemapTiming.packEnd;
    frame++
  ) {
    const areas = treemapPose(frame, base, bars).groups.map((group) =>
      outlineArea(group.path),
    );
    if (previousAreas) {
      const steps = areas.map((area, i) => Math.abs(area - previousAreas[i]));
      steps.forEach((step, i) => {
        assert.ok(
          step < targetAreas[i] * 0.02,
          `late area jump: frame ${frame}, block ${i}`,
        );
        if (previousSteps)
          assert.ok(
            step <= previousSteps[i] + targetAreas[i] * 0.0002,
            `late acceleration: frame ${frame}, block ${i}`,
          );
      });
      previousSteps = steps;
    }
    previousAreas = areas;
  }
  previousAreas.forEach((area, i) =>
    assert.ok(
      Math.abs(area - targetAreas[i]) < targetAreas[i] * 0.002,
      `shape handoff: block ${i}`,
    ),
  );
  const merged = render(h(View, { graph: base, frame: treemapTiming.packEnd }));
  assert.equal((merged.match(/data-mark="merged-block"/g) || []).length, 6);
  assert.doesNotMatch(merged, /<text|<filter/);
  const original = render(
    h(Treemap, { items: miniTreemapItems(miniTreemapDefaultProps) }),
  );
  for (const frame of [treemapTiming.settled, treemapTiming.end]) {
    const final = render(h(View, { graph: base, frame }));
    assert.deepEqual(tags(final), tags(original));
    assert.equal((final.match(/<text\b/g) || []).length, 6);
    assert.equal(
      tags(render(h(View, { graph: { ...base, 데이터: [] }, frame }))).length,
      0,
    );
  }
});

test("treemap-to-bubble keeps three tastes, shares bubble growth and uses static original food icons", () => {
  const t = bubbleTransitionTiming;
  assert.equal(t.start, 1229);
  assert.equal(t.settled, 1311);
  assert.equal(t.end, pieTransitionTiming.start);
  assert.deepEqual(
    transitionBubbleItems.map((item) => [
      item.axis,
      item.value,
      item.dishKindId,
    ]),
    [
      ["bitter", 3, "stir_fried_wok"],
      ["sweet", 8, "dessert"],
      ["umami", 18, "beverage_pairing"],
    ],
  );
  const original = render(
    h(Treemap, { items: miniTreemapItems(miniTreemapDefaultProps) }),
  );
  assert.deepEqual(
    tags(render(h(View, { graph: base, frame: t.start }))),
    tags(original),
  );
  const source = bubbleTransitionPose(t.start);
  const fadingNumbers = bubbleTransitionPose(t.start + 5);
  assert.ok(
    fadingNumbers.every(
      (cell) => cell.numberOpacity > 0 && cell.numberOpacity < 1,
    ),
  );
  fadingNumbers.forEach((cell) =>
    near(cell.numberOpacity, fadingNumbers[0].numberOpacity),
  );
  assert.ok(
    bubbleTransitionPose(t.start + 10).every(
      (cell) => cell.numberOpacity === 0,
    ),
  );
  const bubbleGraph = {
    재생: "진입 후 유지",
    표시: "음식 아이콘",
    "확대 배율": 6,
    "배경 색": "#FFFFFF",
    데이터: transitionBubbleItems.map((item) => ({
      항목: item.label,
      색상: TASTE_TOKENS[item.axis].label,
      값: item.value,
    })),
  };
  for (let frame = t.start; frame <= t.roundEnd; frame++) {
    const shrinking = bubbleTransitionPose(frame).filter(
      (cell) => cell.selected,
    );
    shrinking.forEach((cell) => {
      const original = source[cell.index];
      if (cell.item.axis === "bitter")
        near(cell.cx - cell.width / 2, original.cx - original.width / 2);
      if (cell.item.axis === "sweet" && frame <= t.sweetRollStart)
        near(cell.cx + cell.width / 2, original.cx + original.width / 2);
      if (cell.item.axis === "sweet") {
        near(cell.cy, original.cy);
        near(cell.height, original.height);
        near(cell.rotation, 0);
      }
      if (cell.item.axis === "umami")
        near(cell.cy - cell.height / 2, original.cy - original.height / 2);
      assert.ok(
        cell.width <= original.width + 1e-7 &&
          cell.height <= original.height + 1e-7,
      );
    });
    bubbleTransitionPose(frame)
      .filter((cell) => !cell.selected)
      .forEach((cell) => {
        const original = source[cell.index];
        near(cell.cx, original.cx);
        near(cell.cy, original.cy);
        near(cell.rotation, 0);
        if (cell.item.axis === "fat") near(cell.height, original.height);
        else near(cell.width, original.width);
      });
  }
  let previousHiddenRadii;
  for (let frame = t.roundEnd; frame <= t.disappear; frame++) {
    const shrinkingCircles = bubbleTransitionPose(frame).filter(
      (cell) => !cell.selected,
    );
    shrinkingCircles.forEach((cell, i) => {
      near(cell.width, cell.height);
      near(cell.cx, source[cell.index].cx);
      near(cell.cy, source[cell.index].cy);
      if (frame === t.roundEnd) near(cell.radius, source[cell.index].radius);
      if (previousHiddenRadii)
        assert.ok(cell.radius <= previousHiddenRadii[i] + 1e-7);
      assert.equal(cell.visible, frame < t.disappear);
    });
    previousHiddenRadii = shrinkingCircles.map((cell) => cell.radius);
  }
  const rounded = bubbleTransitionPose(t.roundEnd).filter(
    (cell) => cell.selected,
  );
  rounded.forEach((cell) => {
    near(cell.width, cell.height);
    near(cell.radius, source[cell.index].radius);
  });
  for (let frame = t.roundEnd; frame <= t.dropEnd; frame++) {
    bubbleTransitionPose(frame)
      .filter((cell) => cell.selected)
      .forEach((cell, i) => {
        if (cell.item.axis === "sweet") return;
        near(cell.cx, rounded[i].cx);
        near(cell.radius, rounded[i].radius);
        assert.ok(
          cell.cy >= rounded[i].cy - 1e-7 && cell.cy + cell.radius <= 56 + 1e-7,
        );
      });
  }
  bubbleTransitionPose(t.dropEnd)
    .filter((cell) => cell.selected && cell.item.axis !== "sweet")
    .forEach((cell) => near(cell.cy + cell.radius, 56));
  assert.equal(
    bubbleTransitionPose(t.disappear).filter((cell) => cell.visible).length,
    3,
  );
  const target = miniBubbleGeometry([3, 8, 18]);
  transitionBubbleItems.forEach((item, i) => {
    for (let elapsed = 0; elapsed <= BUBBLE_TIMING.grow; elapsed++) {
      const cell = bubbleTransitionPose(t.growStart[item.axis] + elapsed).find(
        (cell) => cell.item.id === item.id,
      );
      const standalone = miniBubblePose(
        BUBBLE_TIMING.start + i * BUBBLE_TIMING.stagger + elapsed,
        bubbleGraph,
      )[i];
      near(cell.growth, standalone.progress);
      assert.ok(cell.visible);
    }
  });
  const cellAt = (axis, frame) =>
    bubbleTransitionPose(frame).find((cell) => cell.item.axis === axis);
  const overlapFrame = t.roundEnd + 4;
  assert.equal(cellAt("bitter", overlapFrame).phase, "drop");
  assert.equal(cellAt("sweet", overlapFrame).phase, "roll");
  assert.ok(cellAt("sweet", t.sweetRollStart + 3).rotation > 0);
  const sweetTargetX = target[1].cx + transitionBubbleOffsetX;
  let previousSweetX = cellAt("sweet", t.sweetRollStart).cx;
  for (let frame = t.sweetRollStart; frame <= t.settled; frame++) {
    const sweet = cellAt("sweet", frame);
    assert.ok(
      sweet.cx >= previousSweetX - 1e-7 && sweet.cx <= sweetTargetX + 1e-7,
    );
    if (frame >= t.sweetRollEnd) near(sweet.cx, sweetTargetX);
    previousSweetX = sweet.cx;
  }
  near(cellAt("sweet", t.sweetRollEnd).cx, sweetTargetX);
  near(
    cellAt("sweet", t.sweetRollEnd).cy + cellAt("sweet", t.sweetRollEnd).radius,
    56,
  );
  const bounceMiddle = cellAt("bitter", (t.dropEnd + t.bitterBounceEnd) / 2);
  near(bounceMiddle.cx, rounded[0].cx);
  near(bounceMiddle.radius, rounded[0].radius);
  assert.ok(bounceMiddle.cy + bounceMiddle.radius < 55);
  near(cellAt("bitter", t.bitterBounceEnd).cy + rounded[0].radius, 56);
  assert.equal(cellAt("bitter", t.bitterBounceEnd + 1).phase, "ground-settle");
  assert.equal(cellAt("sweet", t.dropEnd + 3).phase, "grow-and-rise");
  assert.equal(cellAt("bitter", t.dropEnd + 3).phase, "ground-bounce");
  bubbleTransitionPose(t.settled)
    .filter((cell) => !cell.selected)
    .forEach((cell) => {
      assert.equal(cell.visible, false);
      near(cell.cx, source[cell.index].cx);
      near(cell.cy, source[cell.index].cy);
    });
  target.forEach((circle, i) => {
    const peak = bubbleTransitionPose(
      t.growStart[transitionBubbleItems[i].axis] +
        BUBBLE_TIMING.grow * BUBBLE_PEAK_PROGRESS,
    ).filter((cell) => cell.selected)[i];
    near(peak.width, circle.radius * 2 * 1.04);
    near(peak.height, peak.width);
    near(peak.radius, circle.radius * 1.04);
    assert.ok(peak.cy < circle.cy, "bubble rebounds above its final center");
    const final = bubbleTransitionPose(t.settled).filter(
      (cell) => cell.selected,
    )[i];
    near(final.cx, circle.cx + transitionBubbleOffsetX);
    near(final.cy, circle.cy);
    near(final.radius, circle.radius);
  });
  const finished = render(h(View, { graph: base, frame: t.settled }));
  assert.equal((finished.match(/data-mark="settled-bubble"/g) || []).length, 3);
  assert.equal((finished.match(/data-food-icon=/g) || []).length, 3);
  assert.doesNotMatch(
    finished,
    /<text|mushroom|vegetable_herb|disappearing-treemap-cell|NaN|Infinity/,
  );
  for (const id of ["stir_fried_wok", "dessert", "beverage_pairing"])
    assert.ok(finished.includes(`data-food-icon="${id}"`));
  const earlyIcons = render(h(View, { graph: base, frame: t.settled }));
  const heldIcons = render(h(View, { graph: base, frame: t.end - 1 }));
  const withoutFrame = (markup) => markup.replace(/data-frame="\d+"/g, "");
  assert.equal(withoutFrame(earlyIcons), withoutFrame(heldIcons));
  assert.doesNotMatch(heldIcons, /data-dessert-eaten|data-wine-fill/);
  for (const id of ["stir_fried_wok", "dessert", "beverage_pairing"])
    assert.ok(heldIcons.includes(`data-icon-part="${id}-`));
  assert.equal(
    tags(render(h(View, { graph: { ...base, 데이터: [] }, frame: t.end - 1 })))
      .length,
    0,
  );
});

test("bubble-to-pie preserves angular shrink, bounds the inner arc and moves vertically from the start", () => {
  const t = pieTransitionTiming;
  assert.equal(t.start, bubbleTransitionTiming.end);
  assert.equal(t.settled - t.start, 66);
  assert.equal(t.end, GRAPH_TRANSITION_DURATION);
  assert.deepEqual(
    tags(render(h(View, { graph: base, frame: t.start }))),
    tags(render(h(BubbleView, { frame: t.start }))),
  );
  assert.deepEqual(
    transitionPieSegments.map(({ axis, value }) => [axis, value]),
    [
      ["umami", 18],
      ["sweet", 12],
      ["bitter", 6],
    ],
  );
  assert.deepEqual(
    transitionPieTargets,
    symbolDonutGeometry(miniPieDefaultProps.데이터.map((item) => item.값)),
  );
  const source = bubbleTransitionPose(t.start).filter((cell) => cell.selected);
  const initial = pieTransitionPose(t.start);
  initial.forEach((piece, i) => {
    near(piece.cx, source[i].cx);
    near(piece.cy, source[i].cy);
    near(piece.radius, source[i].radius);
    near(piece.endAngle - piece.startAngle, Math.PI * 2);
  });
  const innerCurvePoints = (path) => {
    const points = [];
    let cursor = { x: 0, y: 0 },
      inner = false;
    for (const match of path.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
      const command = match[1],
        v = match[2].trim().split(/\s+/).map(Number);
      if (command === "M" || command === "L") {
        if (command === "L" && inner) break;
        if (command === "L") inner = true;
        cursor = { x: v[0], y: v[1] };
        if (inner) points.push(cursor);
      } else if (command === "C") {
        if (inner)
          for (let j = 1; j <= 24; j++) {
            const k = j / 24,
              u = 1 - k;
            points.push({
              x:
                u ** 3 * cursor.x +
                3 * u * u * k * v[0] +
                3 * u * k * k * v[2] +
                k ** 3 * v[4],
              y:
                u ** 3 * cursor.y +
                3 * u * u * k * v[1] +
                3 * u * k * k * v[3] +
                k ** 3 * v[5],
            });
          }
        cursor = { x: v[4], y: v[5] };
      }
    }
    return points;
  };
  let previous = initial;
  for (let frame = t.start; frame <= t.settled; frame++) {
    const pieces = pieTransitionPose(frame);
    pieces.forEach((piece, i) => {
      const span = piece.endAngle - piece.startAngle;
      const lastSpan = previous[i].endAngle - previous[i].startAngle;
      assert.ok(span <= lastSpan + 1e-7);
      assert.ok(
        piece.radius ** 2 * span <= previous[i].radius ** 2 * lastSpan + 1e-7,
      );
      assert.ok(
        piece.cx >= Math.min(source[i].cx, 66) - 1e-7 &&
          piece.cx <= Math.max(source[i].cx, 66) + 1e-7,
      );
      if (piece.axis === "bitter") assert.ok(piece.cy <= 28 + 1e-7);
      else if (piece.axis === "sweet") assert.ok(piece.cy >= 28 - 1e-7);
      else near(piece.cy, 28);
      if (piece.axis === "umami") {
        near(piece.startAngle, 0);
        assert.ok(piece.endAngle <= previous[i].endAngle + 1e-7);
      } else {
        near(
          (piece.startAngle + piece.endAngle) / 2,
          piece.axis === "sweet" ? (Math.PI * 4) / 3 : (Math.PI * 11) / 6,
        );
        assert.ok(piece.startAngle >= previous[i].startAngle - 1e-7);
        assert.ok(piece.endAngle <= previous[i].endAngle + 1e-7);
      }
      near(
        piece.pathRotation,
        piece.progress === 1 ? 0 : (piece.startAngle * 180) / Math.PI,
      );
      if (span > Math.PI && piece.progress > 0 && piece.progress < 1) {
        const n = { x: -Math.sin(span / 2), y: Math.cos(span / 2) };
        for (const point of innerCurvePoints(piece.path)) {
          const inset = (point.x - 92) * n.x + (point.y - 92) * n.y;
          assert.ok(
            inset >= -184 / 64 - 0.001,
            `inner corner crossed the center allowance at frame ${frame}: ${inset}`,
          );
        }
      }
      assert.doesNotMatch(piece.path, /NaN|Infinity/);
      if (frame >= t.iconFadeEnd) near(piece.iconOpacity, 0);
    });
    previous = pieces;
  }
  const early = pieTransitionPose(t.start + 4);
  assert.ok(early.find((piece) => piece.axis === "sweet").cy > 28);
  assert.ok(early.find((piece) => piece.axis === "bitter").cy < 28);
  early.forEach((piece) => {
    assert.ok(piece.progress > 0 && piece.verticalMove > 0);
  });
  for (const frame of [
    t.start + 17,
    t.start + 32,
    t.settled,
    t.exitStart - 1,
  ]) {
    const markup = render(h(View, { graph: base, frame }));
    assert.equal(
      (markup.match(/data-mark="(?:narrowing-bubble|settled-pie)"/g) || [])
        .length,
      3,
    );
    assert.equal(
      (markup.match(/<path\b/g) || []).length,
      3,
      "one path per color, no added R layer",
    );
    assert.doesNotMatch(
      markup,
      /<circle|<mask|<clipPath|data-food-icon=|NaN|Infinity/,
    );
  }
  for (const frame of [t.settled, t.exitStart - 1]) {
    pieTransitionPose(frame).forEach((piece) => {
      const index = transitionPieSegments.findIndex(
        (item) => item.axis === piece.axis,
      );
      assert.equal(piece.path, transitionPieTargets[index].path);
      near(piece.radius, 28);
      near(piece.cx, 66);
      near(piece.cy, 28);
      near(piece.pathRotation, 0);
    });
  }
  assert.equal(
    tags(render(h(View, { graph: { ...base, 데이터: [] }, frame: t.end - 1 })))
      .length,
    0,
  );
});

test("all seven completed graphs hold still for the same full second", () => {
  const ranges = [
    ["line", miniLineTiming(lineProps(base)).settle, timing.gatherStart],
    ["bar", timing.settled, areaTiming.roundStart],
    ["area", areaTiming.settled, heatmapTiming.start],
    ["heatmap", heatmapTiming.colorSettle, treemapTiming.start],
    ["treemap", treemapTiming.settled, bubbleTransitionTiming.start],
    ["bubble", bubbleTransitionTiming.settled, pieTransitionTiming.start],
    ["pie", pieTransitionTiming.settled, pieTransitionTiming.exitStart],
  ];
  assert.equal(miniLineTiming(lineProps(base)).start, 15);
  assert.equal(GRAPH_TRANSITION_HOLD_FRAMES, 60);
  for (const [name, start, end] of ranges) {
    assert.equal(end - start, GRAPH_TRANSITION_HOLD_FRAMES, name);
    assert.equal((end - start) / 60, 1, name);
    assert.deepEqual(
      tags(render(h(View, { graph: base, frame: start }))),
      tags(render(h(View, { graph: base, frame: end - 1 }))),
      `${name} is static during hold`,
    );
  }
});

test("the final pie hands off to the standalone shrink and its blank ending", () => {
  const t = pieTransitionTiming;
  assert.equal(t.exitStart, 1497);
  assert.equal(t.exitEnd - t.exitStart, 54);
  assert.equal(t.end - t.exitEnd, 15);
  const painted = (markup) =>
    tags(markup)
      .filter((tag) => tag.fill)
      .sort((a, b) => a.fill.localeCompare(b.fill));
  assert.deepEqual(
    painted(render(h(View, { graph: base, frame: t.exitStart - 1 }))),
    painted(render(h(View, { graph: base, frame: t.exitStart }))),
    "same full paths and colors at the handoff",
  );
  for (let frame = t.exitStart; frame < t.end; frame++) {
    const actual = render(h(View, { graph: base, frame }));
    const expected = render(
      h(PieView, {
        graph: miniPieDefaultProps,
        frame: PIE_TIMING.exit + frame - t.exitStart,
      }),
    );
    assert.deepEqual(tags(actual), tags(expected));
    assert.doesNotMatch(actual, /data-food-icon=|NaN|Infinity/);
    if (frame >= t.exitEnd) {
      assert.equal(painted(actual).length, 0);
      assert.match(actual, /data-phase="pie-ended"/);
    } else assert.match(actual, /data-phase="pie-exit"/);
  }
});
