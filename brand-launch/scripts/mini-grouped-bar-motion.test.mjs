import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-grouped-motion-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original} from './src/components/system/plating/MiniChart';
export {MiniGroupedBarGraphView as View} from './brand-launch/src/GraphMotion/MiniGroupedBarGraph';
export * from './brand-launch/src/GraphMotion/mini-grouped-bar-motion';
export {miniGroupedBarDefaultProps as base} from './brand-launch/src/GraphMotion/mini-grouped-bar-settings';
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
  Original,
  View,
  base,
  miniGroupedBarAxis,
  miniGroupedBarPose: pose,
  GROUPED_BAR_DURATION,
  GROUPED_BAR_FPS,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const marks = (html) =>
  [...html.matchAll(/<(?:rect|circle)\b[^>]*>/g)].map((m) => m[0]);
const track = (html) => /--tb-mini-chart-track:([^;\"]+)/.exec(html)?.[1];

test("completed paired bars match the actual MiniChart SVG, including colors, endpoints, shared scale and missing values", () => {
  const cases = [
    [base["이전 기록"], base["현재 기록"]],
    [[], []],
    [
      [0, 0],
      [0, 0],
    ],
    [[1], [1]],
    [
      [0, 2, null, 4, 1],
      [1, null, 0, 2],
    ],
    [
      [2, 1],
      [8, 1, 5],
    ],
    [
      [9, 5, null],
      [2, 9, 0],
    ],
    [
      [100, 1, 3],
      [1, 2, 3],
    ],
    [[], [1, 6]],
    [[3, 5], []],
    ...[15, 31].map((count) => [
      Array.from({ length: count }, (_, i) => i % 8),
      Array.from({ length: count }, (_, i) => (i + 3) % 9),
    ]),
  ];
  for (const [previous, current] of cases)
    for (const 색상 of ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]) {
      const graph = {
        ...base,
        색상,
        "이전 기록": previous,
        "현재 기록": current,
      };
      const expected = render(
        h(Original, {
          values: current,
          comparisonValues: previous,
          axis: miniGroupedBarAxis(graph),
        }),
      );
      for (const [재생, frame] of [
        ["진입·유지·퇴장", 96],
        ["진입·유지·퇴장", 192],
        ["정지", 0],
        ["진입 후 유지", 299],
      ]) {
        const actual = render(h(View, { graph: { ...graph, 재생 }, frame }));
        assert.deepEqual(marks(actual), marks(expected));
        assert.equal(track(actual), track(expected));
        assert.match(actual, /viewBox="0 0 132 56"/);
        assert.doesNotMatch(actual, /NaN|Infinity|clip-path|<mask|scaleY/);
      }
    }
});

test("pairs grow together from a fixed baseline, preserving left/right positions, rank and round caps", () => {
  const target = pose(96, base);
  let previous = pose(0, base);
  for (let frame = 0; frame < 300; frame++) {
    const bars = pose(frame, base);
    for (let index = 0; index < bars.length; index += 2) {
      const old = bars[index],
        current = bars[index + 1];
      assert.equal(old.progress, current.progress);
      assert.equal(old.opacity, current.opacity);
      assert.equal(old.comparison, true);
      assert.equal(current.comparison, false);
      assert.ok(old.x + old.width < current.x);
      const direction = Math.sign(
        target[index].height - target[index + 1].height,
      );
      assert.ok((old.height - current.height) * direction >= -1e-9);
      if (index) assert.ok(bars[index - 2].progress >= old.progress);
    }
    bars.forEach((bar, index) => {
      assert.equal(bar.x, target[index].x);
      assert.equal(bar.width, target[index].width);
      assert.ok(Math.abs(bar.y + bar.height - 56) < 1e-9);
      assert.equal(bar.radius, Math.min(bar.width, bar.height) / 2);
      assert.ok(bar.height <= target[index].height + 1e-9);
      if (frame <= 96) assert.ok(bar.height >= previous[index].height - 1e-9);
      if (frame > 192) assert.ok(bar.height <= previous[index].height + 1e-9);
    });
    previous = bars;
  }
  assert.ok(pose(19, base)[0].progress > 0);
  assert.equal(pose(19, base)[2].progress, 0);
  assert.ok(pose(193, base).at(-1).progress < 1);
  assert.equal(pose(193, base)[0].progress, 1);
});

test("300 frames at 60fps with exact reverse exit, stable hold and bounded dense pairs", () => {
  assert.equal(GROUPED_BAR_DURATION, 300);
  assert.equal(GROUPED_BAR_FPS, 60);
  for (const count of [1, 4, 7, 15, 31]) {
    const graph = {
      ...base,
      "이전 기록": Array(count).fill(4),
      "현재 기록": Array(count).fill(2),
    };
    assert.deepEqual(pose(0, graph), pose(299, graph));
    assert.ok(pose(0, graph).every((bar) => bar.opacity === 0));
    for (let frame = 18; frame <= 96; frame++)
      assert.deepEqual(pose(frame, graph), pose(288 - frame, graph));
    for (const frame of [96, 144, 192])
      assert.deepEqual(pose(frame, graph), pose(0, { ...graph, 재생: "정지" }));
    assert.deepEqual(
      pose(299, { ...graph, 재생: "진입 후 유지" }),
      pose(96, graph),
    );
    for (const bar of pose(96, graph))
      assert.ok(bar.width > 0 && bar.x >= 0 && bar.x + bar.width <= 132.000001);
  }
});
