import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-mini-line-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original} from './src/components/system/plating/MiniLineChart';
export {MiniLineGraphView} from './brand-launch/src/GraphMotion/MiniLineGraph';
export * from './brand-launch/src/GraphMotion/mini-line-motion';
export {createElement as h} from 'react';
export {renderToStaticMarkup as render} from 'react-dom/server';
export {pointOnRoundedTrack} from './brand-launch/src/GraphMotion/rounded-line-track';
export {tasteLineChartColor} from './src/constants/colorModes';
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
  MiniLineGraphView,
  miniLineGeometry,
  miniLinePose,
  miniLineTiming,
  h,
  render,
  tasteLineChartColor,
  pointOnRoundedTrack,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const base = {
  재생: "진입·유지·퇴장",
  "시작 대기": 0.3,
  "진입 시간": 1.2,
  "행 간 지연": 0.12,
  "유지 시간": 1.6,
  "끝 여백": 0.7,
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
};
const propsFor = (arrays) => ({
  ...base,
  데이터: arrays.map((기록, i) => ({ 미각: i ? "쓴맛" : "감칠맛", 기록 })),
});
const tags = (html, tag) =>
  [...html.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "g"))].map((m) =>
    Object.fromEntries(
      [...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((v) => [v[1], v[2]]),
    ),
  );
const geometry = (html) => ({
  paths: tags(html, "path").map((p) => ({
    d: p.d,
    width: p["stroke-width"],
    cap: p["stroke-linecap"],
    join: p["stroke-linejoin"],
  })),
  circles: tags(html, "circle").map((c) => ({ x: c.cx, y: c.cy, r: c.r })),
  gradients: tags(html, "linearGradient").map((g) => ({
    x1: g.x1,
    x2: g.x2,
    y1: g.y1,
    y2: g.y2,
    units: g.gradientUnits,
  })),
});
const fixtures = [
  [[1.2, 2.1, 2.4, 4.5]],
  [
    [1.2, 2.1, 2.4, 4.5],
    [0.8, -0.6, -1.4, -2.8],
  ],
  [[]],
  [],
  [[5]],
  [[0, 0, 0, 0]],
  [[-10, 10]],
  [
    [900, -500, 0, 1, 2, 3, 4],
    [4, 4, 4, 4],
  ],
  [[-6, -3, -1, 0], [1]],
];

test("settled and static SVG geometry exactly matches the original MiniLineChart render", () => {
  for (const arrays of fixtures) {
    const props = propsFor(arrays);
    const entries = props.데이터.map((row, i) => ({
      id: String(i),
      taste: row.미각,
      values: row.기록,
    }));
    const original = render(
      h(Original, { entries, compact: entries.length > 1 }),
    );
    for (const fps of [30, 60])
      for (const 재생 of ["정지", "진입 후 유지", "진입·유지·퇴장"]) {
        const graph = { ...props, 재생 };
        const frame = 재생 === "정지" ? 0 : miniLineTiming(graph, fps).settle;
        const actual = render(h(MiniLineGraphView, { graph, frame, fps }));
        assert.deepEqual(
          geometry(actual),
          geometry(original),
          JSON.stringify({ arrays, fps, 재생 }),
        );
        assert.doesNotMatch(actual, /NaN|Infinity|undefined/);
        const rows = miniLineGeometry(graph);
        const originalBoxes = tags(original, "svg").map((svg) =>
          Number(svg.viewBox.split(" ")[3]),
        );
        assert.deepEqual(
          rows.map((r) => r.rowHeight),
          originalBoxes,
        );
        rows.forEach((r, i) => assert.equal(r.offsetY, i * (r.rowHeight + 4)));
      }
  }
});

test("line, history and current node use the product's full-width gradient roles", () => {
  const graph = { ...propsFor([[1, 2, 3, 4]]), 재생: "정지" };
  const html = render(h(MiniLineGraphView, { graph, frame: 0, fps: 60 }));
  const paths = tags(html, "path"),
    dots = tags(html, "circle"),
    stops = tags(html, "stop");
  assert.equal(paths[0].stroke, tasteLineChartColor("umami", "track", "light"));
  assert.equal(
    stops[0]["stop-color"],
    tasteLineChartColor("umami", "start", "light"),
  );
  assert.equal(
    stops[1]["stop-color"],
    tasteLineChartColor("umami", "end", "light"),
  );
  dots.slice(0, -1).forEach((dot) => assert.equal(dot.fill, paths[1].stroke));
  const gradients = tags(html, "linearGradient");
  assert.equal(gradients.length, 2);
  assert.equal(dots.at(-1).fill, `url(#${gradients[1].id})`);
  assert.equal(stops[2]["stop-color"], tasteLineChartColor("umami", "nodeStart", "light"));
  assert.equal(stops[3]["stop-color"], tasteLineChartColor("umami", "end", "light"));
  assert.deepEqual(
    dots.map((d) => Number(d.r)),
    [2, 2, 2, 6],
  );
});

test("moving endpoint stays on the fixed rounded path, and exit exactly reverses entry", () => {
  const graph = propsFor([
    [1.2, 2.1, 2.4, 4.5],
    [0.8, -0.6, -1.4, -2.8],
  ]);
  const timing = miniLineTiming(graph);
  for (let frame = 0; frame < timing.durationInFrames; frame++)
    for (let i = 0; i < 2; i++) {
      const pose = miniLinePose(frame, i, graph);
      const expected = pointOnRoundedTrack(
        pose.track,
        pose.track.length * pose.progress,
      );
      assert.ok(
        Math.hypot(pose.endpoint.x - expected.x, pose.endpoint.y - expected.y) <
          1e-8,
      );
      assert.equal(
        pose.track.path,
        miniLinePose(timing.settle, i, graph).track.path,
      );
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      assert.ok(pose.history.length <= 3);
      if (frame === 0 || frame === timing.durationInFrames - 1)
        assert.equal(pose.opacity, 0);
    }
  for (let frame = timing.start; frame <= timing.settle; frame++)
    for (let i = 0; i < 2; i++) {
      const a = miniLinePose(frame, i, graph),
        b = miniLinePose(timing.start + timing.end - frame, i, graph);
      assert.deepEqual(a.visible, b.visible);
      assert.equal(a.opacity, b.opacity);
    }
  assert.equal(
    miniLineTiming(propsFor([[1.2, 2.1, 2.4, 4.5]])).durationInFrames,
    300,
  );
});

test("one observation never travels from an invented history point; zero stays a valid value", () => {
  for (const value of [0, 5, -5]) {
    const graph = propsFor([[value]]);
    for (const frame of [0, 18, 40, 90, 180, 240, 299]) {
      const pose = miniLinePose(frame, 0, graph);
      assert.deepEqual(pose.endpoint, { x: 126, y: 28 });
      assert.deepEqual(pose.history, []);
    }
  }
  const graph = propsFor([[0, 0, 0, 0]]);
  const pose = miniLinePose(miniLineTiming(graph).settle, 0, graph);
  assert.equal(pose.visible.length, 4);
  assert.equal(pose.history.length, 3);
  assert.ok(pose.visible.every((p) => p.y === 28));
});
