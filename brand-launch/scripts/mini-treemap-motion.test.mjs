import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-treemap-motion-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original} from './src/components/system/plating/MiniTreemapChart';
export {MINI_TREEMAP_ITEMS} from './src/plating/MiniTreemapChartExamples';
export {MiniTreemapGraphView as View} from './brand-launch/src/GraphMotion/MiniTreemapGraph';
export * from './brand-launch/src/GraphMotion/mini-treemap-motion';
export {miniTreemapDefaultProps as base} from './brand-launch/src/GraphMotion/mini-treemap-settings';
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
  loader: { ".css": "empty" },
  alias: {
    react: path.join(root, "node_modules/react"),
    "react-dom": path.join(root, "node_modules/react-dom"),
  },
});
const {
  Original,
  View,
  base,
  miniTreemapItems,
  miniTreemapPose: pose,
  TREEMAP_DURATION,
  TREEMAP_FPS,
  MINI_TREEMAP_ITEMS,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const svg = (html) =>
  html.slice(html.indexOf("<svg"), html.lastIndexOf("</svg>") + 6);
const input = (values) =>
  values.map((값, index) => ({ 항목: `항목${index}`, 색상: "감칠맛", 값 }));
const samples = [
  base.데이터,
  [],
  input([10]),
  input([0, null, 4, 1, 1000000]),
  input([0, null, -1, Infinity, NaN]),
  input([1e-300, 1e300]),
  input(Array.from({ length: 12 }, (_, index) => index + 1)),
];
const visualOrder = (cells) =>
  [...cells].sort(
    (a, b) =>
      a.x + a.width / 2 - (b.x + b.width / 2) ||
      a.y + a.height / 2 - (b.y + b.height / 2) ||
      a.index - b.index,
  );

test("all source SVG geometry, rounded areas, colors and labels remain identical", () => {
  assert.deepEqual(
    miniTreemapItems(base).map(({ id, ...item }) => item),
    MINI_TREEMAP_ITEMS.map(({ id, ...item }) => item),
  );
  for (const 데이터 of samples) {
    const graph = { ...base, 데이터 };
    const expected = render(h(Original, { items: miniTreemapItems(graph) }));
    for (const [재생, frame] of [
      ["진입·유지·퇴장", 44],
      ["진입·유지·퇴장", 90],
      ["정지", 0],
      ["진입 후 유지", 299],
    ]) {
      const actual = render(h(View, { graph: { ...graph, 재생 }, frame }));
      assert.equal(svg(actual), expected);
      assert.doesNotMatch(actual, /NaN|Infinity/);
    }
  }
});

test("cells keep their final bounds and centers through left-to-right growth and reversed exit", () => {
  for (const 데이터 of samples) {
    const graph = { ...base, 데이터 };
    const target = pose(90, graph).map(({ progress, ...cell }) => cell);
    let previous = pose(0, graph);
    for (let frame = 0; frame < 300; frame++) {
      const current = pose(frame, graph);
      current.forEach(({ progress, ...cell }, index) => {
        assert.deepEqual(cell, target[index]);
        assert.ok(progress >= 0 && progress <= 1);
        assert.ok(cell.x >= 0 && cell.x + cell.width <= 132 + 1e-8);
        assert.ok(cell.y >= 0 && cell.y + cell.height <= 56 + 1e-8);
        if (frame <= 90) assert.ok(progress >= previous[index].progress);
        if (frame >= 210) assert.ok(progress <= previous[index].progress);
      });
      const ordered = visualOrder(current);
      if (frame >= 210)
        ordered.forEach((cell, index) => {
          if (index) assert.ok(ordered[index - 1].progress >= cell.progress);
        });
      previous = current;
    }
  }
  const early = visualOrder(pose(24, base));
  assert.ok(early[0].progress > 0);
  assert.ok(early.slice(1).every((cell) => cell.progress === 0));
  const exit = visualOrder(pose(216, base));
  assert.ok(exit.at(-1).progress < 1);
  assert.ok(exit.slice(0, -1).every((cell) => cell.progress === 1));
  const html = render(h(View, { graph: base, frame: 44 }));
  pose(44, base).forEach((cell, index) => {
    assert.ok(html.includes(`g:nth-of-type(${index + 1})`));
    assert.ok(
      html.includes(
        `transform-origin: ${cell.x + cell.width / 2}px ${cell.y + cell.height / 2}px; transform: scale(${cell.progress})`,
      ),
    );
  });
});

test("300 frames preserve full held/static/entry-only states and blank endpoints", () => {
  assert.equal(TREEMAP_DURATION, 300);
  assert.equal(TREEMAP_FPS, 60);
  for (const 데이터 of samples) {
    const graph = { ...base, 데이터 };
    assert.deepEqual(pose(0, graph), pose(299, graph));
    assert.ok(pose(0, graph).every((cell) => cell.progress === 0));
    assert.deepEqual(pose(90, graph), pose(210, graph));
    assert.deepEqual(pose(90, graph), pose(0, { ...graph, 재생: "정지" }));
    assert.deepEqual(
      pose(90, graph),
      pose(299, { ...graph, 재생: "진입 후 유지" }),
    );
  }
});

test("cells grow smoothly to exactly 100 percent without rebound", () => {
  for (const 재생 of ["진입·유지·퇴장", "진입 후 유지"]) {
    const graph = { ...base, 재생 };
    for (let rank = 0; rank < 6; rank++) {
      const start = 18 + rank * 6;
      const progressAt = (offset) =>
        visualOrder(pose(start + offset, graph))[rank].progress;
      assert.equal(progressAt(0), 0);
      assert.ok(progressAt(1) > 0 && progressAt(1) < 0.001);
      assert.equal(progressAt(21), 0.5);
      assert.ok(progressAt(30) < 1);
      assert.ok(progressAt(41) < 1 && 1 - progressAt(41) < 0.001);
      assert.equal(progressAt(42), 1);
      assert.equal(progressAt(48), 1);
      const exitStart = 210 + (5 - rank) * 6;
      if (재생 === "진입·유지·퇴장") {
        assert.ok(
          1 - visualOrder(pose(exitStart + 1, graph))[rank].progress < 0.001,
        );
        assert.ok(
          visualOrder(pose(exitStart + 41, graph))[rank].progress < 0.001,
        );
        assert.equal(
          visualOrder(pose(exitStart + 42, graph))[rank].progress,
          0,
        );
      }
    }
  }
});
