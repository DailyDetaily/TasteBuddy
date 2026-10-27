import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-heatmap-motion-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original, miniHeatmapColor} from './src/components/system/plating/MiniHeatmap';
export {heatmapExampleValues} from './src/plating/MiniHeatmapExamples';
export {MiniHeatmapGraphView as View} from './brand-launch/src/GraphMotion/MiniHeatmapGraph';
export * from './brand-launch/src/GraphMotion/mini-heatmap-motion';
export {miniHeatmapDefaultProps as base, HEATMAP_WEEKDAYS} from './brand-launch/src/GraphMotion/mini-heatmap-settings';
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
  miniHeatmapColor,
  View,
  base,
  heatmapExampleValues,
  HEATMAP_WEEKDAYS,
  miniHeatmapAxis,
  miniHeatmapStartDay,
  miniHeatmapOrderRanks,
  miniHeatmapPose: pose,
  HEATMAP_DURATION,
  HEATMAP_FPS,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const cells = (html) =>
  [
    ...html.matchAll(
      /<rect\b[^>]*>(?:<title>.*?<\/title>)?<\/rect>|<rect\b[^>]*\/>/g,
    ),
  ].map((m) => m[0]);

test("cells exactly match the original heatmap: geometry, radii, levels, fills, unknown outlines and padding", () => {
  assert.equal(base.기록.length, 31);
  assert.deepEqual(
    [...new Set(base.기록)].sort((a, b) => a - b),
    [0, 1, 2, 3, 4],
  );
  for (const 기록 of [
    base.기록,
    heatmapExampleValues,
    [],
    [0],
    [null],
    [0, null, 1, 2, 3, 4, 99],
    ...[28, 29, 30].map((count) => Array(count).fill(2)),
  ])
    for (const 색상 of ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"])
      for (const 시작요일 of HEATMAP_WEEKDAYS) {
        const graph = { ...base, 기록, 색상, "시작 요일": 시작요일 };
        const original = render(
          h(Original, {
            values: 기록,
            axis: miniHeatmapAxis(graph),
            startDay: miniHeatmapStartDay(graph),
          }),
        );
        const expected = cells(original);
        assert.equal(expected.length, pose(96, graph).length);
        for (const [재생, frame] of [
          ["진입·유지·퇴장", 156],
          ["정지", 0],
          ["진입 후 유지", 299],
        ]) {
          const actual = render(h(View, { graph: { ...graph, 재생 }, frame }));
          assert.deepEqual(cells(actual), expected);
          assert.match(actual, /viewBox="0 0 132 56"/);
          assert.doesNotMatch(
            actual,
            /NaN|Infinity|transform=|clip-path|<mask/,
          );
        }
      }
});

test("random reveal and exit preserve geometry, levels and zero/missing semantics", () => {
  for (const graph of [
    base,
    { ...base, 기록: [0, null, 4, 1, 2], "시작 요일": "일요일" },
  ]) {
    const target = pose(156, graph);
    let previous = pose(0, graph);
    for (let frame = 0; frame < 300; frame++) {
      const marks = pose(frame, graph);
      marks.forEach((cell, index) => {
        const { opacity, colorProgress, ...geometry } = cell;
        assert.ok(colorProgress >= 0 && colorProgress <= 1);
        const {
          opacity: targetOpacity,
          colorProgress: targetColorProgress,
          ...expected
        } = target[index];
        assert.equal(targetColorProgress, 1);
        assert.equal(targetOpacity, 1);
        assert.deepEqual(geometry, expected);
        assert.ok(opacity >= 0 && opacity <= 1);
        if (frame <= 96) assert.ok(opacity >= previous[index].opacity);
        if (frame > 192) assert.ok(opacity <= previous[index].opacity);
      });
      previous = marks;
    }
    for (const frame of [24, 48, 72, 216, 252])
      assert.deepEqual(
        cells(render(h(View, { graph, frame }))).map((cell) =>
          cell.replace(/ fill="[^"]*"/, ""),
        ),
        cells(render(h(View, { graph, frame: 156 }))).map((cell) =>
          cell.replace(/ fill="[^"]*"/, ""),
        ),
      );
  }
  const first = miniHeatmapOrderRanks(pose(19, base).length).indexOf(0);
  assert.notEqual(first, 0);
  assert.ok(pose(19, base)[first].opacity > 0);
  assert.equal(pose(19, base).filter((cell) => cell.opacity > 0).length, 1);
  const firstExit = miniHeatmapOrderRanks(
    pose(193, base).length,
    "exit",
  ).indexOf(0);
  assert.notEqual(firstExit, pose(193, base).length - 1);
  assert.ok(pose(193, base)[firstExit].opacity < 1);
  assert.equal(pose(193, base).filter((cell) => cell.opacity < 1).length, 1);
});

test("reveal and exit use separate repeatable permutations independent of values and frame seeking", () => {
  for (const phase of ["reveal", "exit"]) {
    for (const count of [0, 7, 14, 21, 28, 35, 42]) {
      const ranks = miniHeatmapOrderRanks(count, phase);
      assert.deepEqual(ranks, miniHeatmapOrderRanks(count, phase));
      assert.deepEqual(
        [...ranks].sort((a, b) => a - b),
        Array.from({ length: count }, (_, i) => i),
      );
      if (count > 1)
        assert.notDeepEqual(
          ranks,
          [...ranks].sort((a, b) => a - b),
        );
    }
    const ranks = miniHeatmapOrderRanks(pose(0, base).length, phase);
    const order = ranks
      .map((rank, slot) => ({ rank, slot }))
      .sort((a, b) => a.rank - b.rank);
    const first = order.slice(0, 8).map(({ slot }) => slot);
    assert.ok(first.some((slot) => slot < 7));
    assert.ok(first.some((slot) => slot >= 28));
    assert.ok(first.some((slot) => slot % 7 < 3));
    assert.ok(first.some((slot) => slot % 7 > 3));
    const changedValues = {
      ...base,
      기록: base.기록.map((_, i) => (i % 2 ? null : 0)),
    };
    const frames =
      phase === "reveal" ? [72, 24, 48, 19, 48] : [252, 193, 216, 240, 216];
    for (const frame of frames) {
      const marks = pose(frame, base);
      assert.deepEqual(
        marks.map((cell) => cell.opacity),
        pose(frame, changedValues).map((cell) => cell.opacity),
      );
      const ordered = order.map(({ slot }) => marks[slot].opacity);
      ordered.forEach((opacity, index) => {
        if (index)
          assert.ok(
            phase === "reveal"
              ? ordered[index - 1] >= opacity
              : ordered[index - 1] <= opacity,
          );
      });
    }
  }
  assert.notDeepEqual(
    miniHeatmapOrderRanks(35),
    miniHeatmapOrderRanks(35, "exit"),
  );
});

test("300-frame loop preserves the opacity timing distribution, settled colors and calendar bounds", () => {
  assert.equal(HEATMAP_DURATION, 300);
  assert.equal(HEATMAP_FPS, 60);
  for (const count of [1, 7, 28, 29, 30, 31])
    for (const day of HEATMAP_WEEKDAYS) {
      const graph = { ...base, 기록: Array(count).fill(2), "시작 요일": day };
      assert.deepEqual(pose(0, graph), pose(299, graph));
      assert.ok(pose(0, graph).every((cell) => cell.opacity === 0));
      for (const frame of [18, 24, 48, 72, 96])
        assert.deepEqual(
          pose(frame, graph)
            .map((cell) => cell.opacity)
            .sort((a, b) => a - b),
          pose(288 - frame, graph)
            .map((cell) => cell.opacity)
            .sort((a, b) => a - b),
        );
      for (const frame of [156, 174, 192])
        assert.deepEqual(
          pose(frame, graph),
          pose(0, { ...graph, 재생: "정지" }),
        );
      assert.deepEqual(
        pose(299, { ...graph, 재생: "진입 후 유지" }),
        pose(156, graph),
      );
      for (const cell of pose(96, graph)) {
        assert.ok(
          cell.width > 0 && cell.height > 0 && cell.x >= 0 && cell.y >= 0,
        );
        assert.ok(
          cell.x + cell.width <= 132.000001 &&
            cell.y + cell.height <= 56.000001,
        );
      }
    }
});

test("the existing reveal completes in pale colors before cells deepen to their own levels", () => {
  const graph = { ...base, 기록: [0, 1, 2, 3, 4, null, 9] };
  const axis = miniHeatmapAxis(graph);
  const fill = (markup) => / fill="([^"]*)"/.exec(markup)[1];
  for (const frame of [0, 24, 48, 72, 96, 108]) {
    const marks = pose(frame, graph);
    const svgCells = cells(render(h(View, { graph, frame })));
    marks.forEach((cell, index) => {
      assert.equal(cell.colorProgress, 0);
      assert.equal(
        fill(svgCells[index]),
        cell.padding
          ? miniHeatmapColor(null)
          : cell.level === null
            ? "none"
            : miniHeatmapColor(0, axis),
      );
      if (frame >= 96) assert.equal(cell.opacity, 1);
    });
  }
  let previous = 0;
  for (let frame = 108; frame <= 156; frame++) {
    const marks = pose(frame, graph);
    marks.forEach((cell) => {
      assert.equal(cell.opacity, 1);
      assert.ok(cell.colorProgress >= previous);
    });
    previous = marks[0].colorProgress;
  }
  assert.equal(previous, 1);
  const middle = cells(render(h(View, { graph, frame: 114 })));
  const original = cells(
    render(h(View, { graph: { ...graph, 재생: "정지" }, frame: 0 })),
  );
  pose(114, graph).forEach((cell, index) => {
    if (cell.padding || cell.level === null || cell.level === 0)
      assert.equal(middle[index], original[index]);
    else assert.match(fill(middle[index]), /^color-mix\(in srgb,/);
  });
  for (const frame of [156, 192, 216, 252])
    assert.deepEqual(cells(render(h(View, { graph, frame }))), original);
});

test("all cells share the same 1-to-4 palette steps and stop on their own level", () => {
  for (const 색상 of ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"]) {
    const graph = { ...base, 색상, 기록: [0, 1, 2, 3, 4, null, 99] };
    const axis = miniHeatmapAxis(graph);
    const fillsAt = (frame) =>
      cells(render(h(View, { graph, frame }))).map(
        (markup) => / fill="([^"]*)"/.exec(markup)[1],
      );
    const target = pose(156, graph);
    for (let step = 1; step <= 4; step++) {
      // Shared boundaries stay aligned; only cells already at their target hold.
      const fills = fillsAt(108 + step * 12);
      target.forEach((cell, index) => {
        const expected = cell.padding
          ? miniHeatmapColor(null)
          : cell.level === null
            ? "none"
            : miniHeatmapColor(Math.min(cell.level, step), axis);
        assert.equal(fills[index], expected);
      });
    }
    for (let frame = 109; frame < 156; frame++) {
      const fills = fillsAt(frame);
      const previous = fillsAt(frame - 1);
      const step = Math.ceil((frame - 108) / 12);
      const advancing = target
        .map((cell, index) => ({ cell, fill: fills[index] }))
        .filter(
          ({ cell }) =>
            !cell.padding && cell.level !== null && cell.level >= step,
        );
      assert.ok(advancing.every((mark) => mark.fill === advancing[0].fill));
      target.forEach((cell, index) => {
        if (
          !cell.padding &&
          cell.level !== null &&
          frame <= 108 + cell.level * 12
        )
          assert.notEqual(
            fills[index],
            previous[index],
            `No pause before target at frame ${frame}`,
          );
        if (!cell.padding && cell.level !== null && cell.level < step)
          assert.equal(fills[index], miniHeatmapColor(cell.level, axis));
      });
    }
  }
});
