import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-pie-motion-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original} from './src/components/system/plating/PieDonutChart';
export {MiniPieGraphView as View} from './brand-launch/src/GraphMotion/MiniPieGraph';
export * from './brand-launch/src/GraphMotion/mini-pie-motion';
export {miniPieDefaultProps as base} from './brand-launch/src/GraphMotion/mini-pie-settings';
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
  miniPieSegments,
  miniPieMode,
  miniPiePose: pose,
  pieEaseInOut,
  PIE_CENTER,
  PIE_DURATION,
  PIE_FPS,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const shapes = (html) =>
  [...html.matchAll(/<(?:path|circle)\b[^>]*>/g)].map(([tag]) =>
    Object.fromEntries(
      [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [
        key,
        value,
      ]),
    ),
  );
const samples = [
  base.데이터,
  [],
  [{ 항목: "없음", 색상: "감칠맛", 값: 0 }],
  [{ 항목: "하나", 색상: "감칠맛", 값: 1 }],
  ...[
    [0, 30, 20],
    [10, 30, 20],
    [70, 20, 10],
    [80, 30, 10],
    [0.1, 0.1, 99.8],
  ].map((values) =>
    base.데이터.map((item, index) => ({ ...item, 값: values[index] })),
  ),
];

test("settled pie retains the original paths, shares, colors, zero and remainder rules", () => {
  for (const 데이터 of samples)
    for (const 값기준 of ["구성비", "절대 백분율"]) {
      const graph = { ...base, 데이터, "값 기준": 값기준 };
      const expected = shapes(
        render(
          h(Original, {
            segments: miniPieSegments(graph),
            mode: miniPieMode(graph),
          }),
        ),
      );
      for (const [재생, frame] of [
        ["진입·유지·퇴장", 78],
        ["정지", 0],
        ["진입 후 유지", 299],
      ]) {
        const actual = render(h(View, { graph: { ...graph, 재생 }, frame }));
        assert.deepEqual(shapes(actual), expected);
        assert.match(actual, /width:132px;height:56px/);
        assert.match(actual, /viewBox="0 0 184 184"/);
        assert.doesNotMatch(actual, /NaN|Infinity/);
        assert.match(actual, /justify-content:flex-end/);
        assert.doesNotMatch(actual, /rotate|perspective|preserve-3d|matrix3d/);
      }
    }
});

const geometry = (pieces) =>
  pieces.map(({ fillProgress, fillRadius, filledPath, ...piece }) => piece);

test("clockwise stagger preserves centered radial geometry without a backdrop", () => {
  assert.deepEqual(PIE_CENTER, { x: 104, y: 28 });
  const target = geometry(pose(72, base).pieces);
  for (let frame = 0; frame < 300; frame++) {
    const actual = pose(frame, base);
    assert.deepEqual(geometry(actual.pieces), target);
    actual.pieces.forEach((piece, index) => {
      assert.equal(piece.fillRadius, 92 * piece.fillProgress);
      if (frame <= 72)
        assert.equal(
          piece.fillProgress,
          pieEaseInOut((frame - 18 - index * 6) / 42),
        );
      if (frame >= 228)
        assert.equal(
          piece.fillProgress,
          1 - pieEaseInOut((frame - 228 - (2 - index) * 6) / 42),
        );
    });
    const markup = render(h(View, { graph: base, frame }));
    assert.doesNotMatch(
      markup,
      /NaN|Infinity|rotate|perspective|data-layer="track"/,
    );
    assert.match(markup, /width:56px;height:56px;position:relative/);
    assert.match(markup, /scale\(1\) translateX\(-76px\)/);
  }
  assert.ok(pose(24, base).pieces[0].fillProgress > 0);
  assert.equal(pose(24, base).pieces[1].fillProgress, 0);
  assert.ok(pose(30, base).pieces[1].fillProgress > 0);
  assert.equal(pose(30, base).pieces[2].fillProgress, 0);
  assert.ok(pose(234, base).pieces[2].fillProgress < 1);
  assert.equal(pose(234, base).pieces[1].fillProgress, 1);
  assert.equal(pose(234, base).pieces[0].fillProgress, 1);
  assert.ok(pose(240, base).pieces[1].fillProgress < 1);
  assert.equal(pose(240, base).pieces[0].fillProgress, 1);
});

test("moving fronts preserve fixed centers and round corners across the input modes", () => {
  for (const frame of [42, 48, 54]) {
    for (const piece of pose(frame, base).pieces) {
      const [, x, y] = piece.filledPath.match(/^M(-?[\d.]+) (-?[\d.]+)/);
      assert.ok(
        Math.abs(
          Math.hypot(Number(x) - 92, Number(y) - 92) - piece.fillRadius,
        ) < 1e-4,
      );
      assert.ok((piece.filledPath.match(/C/g) ?? []).length >= 4);
    }
  }
  for (const 데이터 of [
    ...samples,
    Array.from({ length: 12 }, (_, index) => ({
      ...base.데이터[index % 3],
      값: index + 1,
    })),
  ])
    for (const 값기준 of ["구성비", "절대 백분율"]) {
      const graph = { ...base, 데이터, "값 기준": 값기준 };
      const target = geometry(pose(72, graph).pieces);
      for (const frame of [0, 24, 36, 48, 72, 228, 240, 270, 282, 299]) {
        assert.deepEqual(geometry(pose(frame, graph).pieces), target);
        assert.doesNotMatch(render(h(View, { graph, frame })), /NaN|Infinity/);
      }
      assert.ok(
        pose(72, graph).pieces.every(
          (piece) => piece.filledPath === piece.path,
        ),
      );
      assert.ok(
        pose(282, graph).pieces.every((piece) => piece.fillProgress === 0),
      );
    }
});

test("300 frames retain gentle endpoints and counterclockwise exit", () => {
  assert.equal(PIE_DURATION, 300);
  assert.equal(PIE_FPS, 60);
  assert.deepEqual(pose(0, base), pose(299, base));
  for (let step = 0; step <= 42; step++)
    for (let index = 0; index < 3; index++) {
      const leaving = pose(228 + (2 - index) * 6 + step, base).pieces[index];
      assert.equal(leaving.fillProgress, 1 - pieEaseInOut(step / 42));
    }
  for (const frame of [72, 120, 180, 228])
    assert.deepEqual(pose(frame, base), pose(0, { ...base, 재생: "정지" }));
  assert.deepEqual(
    pose(299, { ...base, 재생: "진입 후 유지" }),
    pose(72, base),
  );
});

test("each slice grows smoothly to its exact radius with no overshoot or rebound", () => {
  for (const 재생 of ["진입·유지·퇴장", "진입 후 유지"]) {
    const graph = { ...base, 재생 };
    let previous = pose(0, graph);
    for (let frame = 0; frame < 300; frame++) {
      const current = pose(frame, graph);
      current.pieces.forEach((piece, index) => {
        assert.ok(piece.fillProgress >= 0 && piece.fillProgress <= 1);
        assert.ok(piece.fillRadius >= 0 && piece.fillRadius <= 92);
        if (frame <= 72)
          assert.ok(piece.fillProgress >= previous.pieces[index].fillProgress);
        if (frame >= 228)
          assert.ok(piece.fillProgress <= previous.pieces[index].fillProgress);
      });
      previous = current;
    }
    for (let index = 0; index < 3; index++) {
      const start = 18 + index * 6;
      const progressAt = (offset) =>
        pose(start + offset, graph).pieces[index].fillProgress;
      assert.equal(progressAt(0), 0);
      assert.ok(progressAt(1) > 0 && progressAt(1) < 0.001);
      assert.equal(progressAt(21), 0.5);
      assert.ok(progressAt(30) < 1);
      assert.ok(progressAt(41) < 1 && 1 - progressAt(41) < 0.001);
      assert.equal(progressAt(42), 1);
      assert.equal(progressAt(48), 1);
    }
  }
  const html = render(h(View, { graph: base, frame: 54 }));
  const groups = [
    ...html.matchAll(
      /<g([^>]*)>(<path[^>]*data-layer="fill"[^>]*>)(?:<\/path>)?<\/g>/g,
    ),
  ];
  assert.equal(groups.length, 3);
  assert.ok(groups.every((group) => /clip-path/.test(group[1])));
});
