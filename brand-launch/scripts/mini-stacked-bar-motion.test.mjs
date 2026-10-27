import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-stacked-motion-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original} from './src/components/system/plating/MiniStackedBarChart';
export {MiniStackedBarGraphView as View} from './brand-launch/src/GraphMotion/MiniStackedBarGraph';
export * from './brand-launch/src/GraphMotion/mini-stacked-bar-motion';
export {miniStackedBarDefaultProps as base} from './brand-launch/src/GraphMotion/mini-stacked-bar-settings';
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
  miniStackedBarSeries,
  miniStackedBarPose: pose,
  STACKED_BAR_DURATION,
  STACKED_BAR_FPS,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const rects = (html) => [...html.matchAll(/<rect\b[^>]*>/g)].map((m) => m[0]);

test("completed motion exactly matches product SVG capsules, color, order, zeros and unknown slots", () => {
  const datasets = [
    base.데이터,
    [],
    base.데이터.map((s) => ({ ...s, 기록: [] })),
    [base.데이터[0]],
    base.데이터.map((s, i) => ({
      ...s,
      기록: i === 0 ? [0, 1, null, 3, 4] : [0, 0, 2, null],
    })),
    ...[1, 15, 31].map((count) =>
      base.데이터.map((s, i) => ({
        ...s,
        기록: Array.from({ length: count }, (_, k) => (k + i) % 5),
      })),
    ),
  ];
  for (const 데이터 of datasets) {
    const graph = { ...base, 데이터 };
    const original = rects(
      render(h(Original, { series: miniStackedBarSeries(graph) })),
    );
    for (const 재생 of ["진입·유지·퇴장", "진입 후 유지", "정지"])
      for (const frame of 재생 === "정지" ? [0, 299] : [96, 144, 192]) {
        const html = render(h(View, { graph: { ...graph, 재생 }, frame }));
        assert.deepEqual(rects(html), original);
        assert.match(html, /viewBox="0 0 132 56"/);
        assert.doesNotMatch(html, /NaN|Infinity|clip-path|<mask|scaleY/);
      }
  }
});

test("all frames keep baselines, widths, circular ends and layer order while columns enter left to right", () => {
  const target = pose(96, base);
  let previous = pose(0, base);
  for (let frame = 0; frame < 300; frame++) {
    const bars = pose(frame, base);
    bars.forEach((bar, i) => {
      assert.equal(bar.x, target[i].x);
      assert.equal(bar.width, target[i].width);
      assert.ok(bar.opacity >= 0 && bar.opacity <= 1);
      if (i) assert.ok(bars[i - 1].progress >= bar.progress);
      bar.layers.forEach((layer, j) => {
        assert.ok(Math.abs(layer.y + layer.height - 56) < 1e-9);
        assert.equal(layer.radius, Math.min(bar.width, layer.height) / 2);
        assert.ok(layer.height <= target[i].layers[j].height + 1e-9);
        if (j) assert.ok(bar.layers[j - 1].height >= layer.height);
        if (frame <= 96)
          assert.ok(layer.height >= previous[i].layers[j].height - 1e-9);
        if (frame > 192)
          assert.ok(layer.height <= previous[i].layers[j].height + 1e-9);
      });
    });
    previous = bars;
  }
  assert.ok(pose(19, base)[0].progress > 0);
  assert.equal(pose(19, base)[1].progress, 0);
  assert.ok(pose(193, base)[6].layers[0].progress < 1);
  assert.equal(pose(193, base)[5].layers[0].progress, 1);
});

test("300-frame loop has exact reverse exit and settled hold for every supported density", () => {
  assert.equal(STACKED_BAR_DURATION, 300);
  assert.equal(STACKED_BAR_FPS, 60);
  for (const count of [1, 7, 15, 31]) {
    const graph = {
      ...base,
      데이터: base.데이터.map((s) => ({ ...s, 기록: Array(count).fill(2) })),
    };
    assert.deepEqual(pose(0, graph), pose(299, graph));
    assert.ok(pose(0, graph).every((b) => b.opacity === 0));
    for (let frame = 18; frame <= 96; frame++)
      assert.deepEqual(pose(frame, graph), pose(288 - frame, graph));
    assert.deepEqual(pose(96, graph), pose(144, graph));
    assert.deepEqual(pose(96, graph), pose(192, graph));
    assert.deepEqual(pose(0, { ...graph, 재생: "정지" }), pose(96, graph));
    assert.deepEqual(
      pose(299, { ...graph, 재생: "진입 후 유지" }),
      pose(96, graph),
    );
  }
});

test("whole category groups accumulate bottom to top without overlapping, including a missing layer", () => {
  const groups = ["series-0", "series-1", "series-2"];
  const layersAt = (frame, id) =>
    pose(frame, base).flatMap((bar) =>
      bar.layers.filter((layer) => layer.id === id),
    );
  for (const [index, id] of groups.entries()) {
    const start = 18 + index * 26;
    assert.ok(layersAt(start, id).every((layer) => layer.opacity === 0));
    assert.ok(layersAt(start + 1, id)[0].progress > 0);
    assert.ok(
      layersAt(start + 26, id).every(
        (layer) => layer.progress === 1 && layer.opacity === 1,
      ),
    );
    for (const previous of groups.slice(0, index))
      assert.ok(
        layersAt(start + 1, previous).every((layer) => layer.progress === 1),
      );
    for (const future of groups.slice(index + 1))
      assert.ok(
        layersAt(start + 1, future).every(
          (layer) => layer.opacity === 0 && layer.progress === 0,
        ),
      );
  }
  // Day two has no green layer, but its orange still waits for the orange group.
  assert.equal(pose(30, base)[1].layers[0].id, "series-1");
  assert.equal(pose(30, base)[1].layers[0].opacity, 0);
  for (let frame = 0; frame < 300; frame++) {
    const moving = new Set();
    for (const bar of pose(frame, base))
      for (const layer of bar.layers) {
        if (layer.progress > 0 && layer.progress < 1) moving.add(layer.id);
        if (layer.progress === 0) assert.equal(layer.opacity, 0);
      }
    assert.ok(
      moving.size <= 1,
      `Different category groups overlap at frame ${frame}`,
    );
    for (const id of groups) {
      const layers = layersAt(frame, id);
      assert.ok(
        layers.every(
          (layer, i) => !i || layers[i - 1].progress >= layer.progress,
        ),
      );
    }
  }
});

test("each added layer grows from the completed subtotal even when category value rankings change", () => {
  const graph = {
    ...base,
    데이터: base.데이터.map((series, index) => ({
      ...series,
      기록: [
        [6, 2, 0, 3],
        [3, 3, 2, 0],
        [1, 5, 4, 2],
      ][index],
    })),
  };
  const completed = pose(96, graph);
  for (const [group, start] of [
    [1, 44],
    [2, 70],
  ]) {
    const atStart = pose(start, graph);
    const growing = pose(start + 10, graph);
    completed.forEach((bar, column) => {
      const index = bar.layers.findIndex(
        (layer) => layer.id === `series-${group}`,
      );
      if (index < 0) return;
      const lower = bar.layers[index + 1];
      if (!lower) return;
      assert.equal(atStart[column].layers[index].height, lower.height);
      assert.equal(atStart[column].layers[index].opacity, 0);
      assert.ok(growing[column].layers[index].height > lower.height);
      assert.equal(growing[column].layers[index + 1].height, lower.height);
      assert.equal(growing[column].layers[index + 1].progress, 1);
    });
  }
  // The second category is zero in column four: green continues directly
  // from purple, without inventing an orange segment or changing its phase.
  assert.deepEqual(
    completed[3].layers.map((layer) => layer.id),
    ["series-2", "series-0"],
  );
  assert.equal(
    pose(70, graph)[3].layers[0].height,
    completed[3].layers[1].height,
  );
});
