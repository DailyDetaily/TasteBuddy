import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-mini-area-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original} from './src/components/system/plating/MiniAreaChart';
export {MiniAreaGraphView} from './brand-launch/src/GraphMotion/MiniAreaGraph';
export * from './brand-launch/src/GraphMotion/mini-area-motion';
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
  MiniAreaGraphView,
  AREA_DURATION,
  AREA_FPS,
  AREA_TIMING,
  miniAreaProgress,
  miniAreaGeometry,
  miniAreaPose,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const base = {
  재생: "진입·유지·퇴장",
  미각: "감칠맛",
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  기록: [1.2, 2.1, 2.4, 4.5],
};
const paths = (html) => [...html.matchAll(/<path\b[^>]*>/g)].map((m) => m[0]);

test("settled area preserves the original outer corners, dimensions and colors", () => {
  for (const 미각 of ["단맛", "신맛", "쓴맛", "짠맛", "감칠맛", "지방맛"])
    for (const 기록 of [
      [1.2, 2.1, 2.4, 4.5],
      [4.5, 2.4, 2.1, 1.2],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [1],
      [-4, -2, 1, 3],
      [5],
      [],
      [900, -700, 1, 2, 3, 4],
    ]) {
      const graph = { ...base, 미각, 기록 };
      const original = render(
        h(Original, {
          entries: [{ id: "area-specimen", taste: 미각, values: 기록 }],
        }),
      );
      for (const frame of [90, 120, 186]) {
        const actual = render(h(MiniAreaGraphView, { graph, frame }));
        const actualPaths = paths(actual),
          originalPaths = paths(original);
        assert.deepEqual(actualPaths, originalPaths);
        actualPaths.forEach((path, index) => {
          const d = (tag) => / d="([^"]*)"/.exec(tag)[1];
          const segments = (value) => value.replace(/ Z$/, "").split(/ (?=L )/);
          const a = segments(d(path)),
            b = segments(d(originalPaths[index]));
          assert.equal(a.length, b.length);
          const vertices = miniAreaGeometry(기록).points;
          a.forEach((segment, corner) => {
            const p = vertices[corner];
            if (!p || p.x === 0 || p.x === 132)
              assert.equal(segment, b[corner]);
          });
          assert.match(path, /fill="var\(--tb-mini-chart-track\)"/);
        });
        assert.doesNotMatch(actual, /<circle|NaN|Infinity/);
        assert.match(actual, /viewBox="0 0 132 56"/);
      }
    }
});

test("fixed 300 frames at 60fps; entry and reverse exit meet exactly at the hold", () => {
  assert.equal(AREA_DURATION, 300);
  assert.equal(AREA_FPS, 60);
  assert.equal(miniAreaProgress(0, base.재생), 0);
  assert.equal(miniAreaProgress(299, base.재생), 0);
  for (let frame = 0; frame < 300; frame++) {
    const p = miniAreaProgress(frame, base.재생);
    assert.ok(Number.isFinite(p) && p >= 0 && p <= 1);
    if (frame >= AREA_TIMING.settle && frame <= AREA_TIMING.exit)
      assert.equal(p, 1);
  }
  for (let frame = AREA_TIMING.start; frame <= AREA_TIMING.settle; frame++)
    assert.equal(
      miniAreaProgress(frame, base.재생),
      miniAreaProgress(AREA_TIMING.start + AREA_TIMING.end - frame, base.재생),
    );
});

test("static and entrance-only modes preserve the completed shape and do not change the duration", () => {
  for (const frame of [0, 18, 90, 186, 258, 299])
    assert.equal(miniAreaProgress(frame, "정지"), 1);
  for (const frame of [90, 186, 258, 299])
    assert.equal(miniAreaProgress(frame, "진입 후 유지"), 1);
  const html = render(
    h(MiniAreaGraphView, { graph: { ...base, 재생: "정지" }, frame: 0 }),
  );
  assert.doesNotMatch(html, /clip-path|<mask|scaleY/);
  assert.equal(AREA_DURATION, 300);
});

test("base is a rounded rectangle at the left face height; each upper vertex rises without moving horizontally", () => {
  const geometry = miniAreaGeometry(base.기록);
  assert.ok(Math.abs(geometry.minimumHeight - (12 + 0.2 / 3.5 * 44)) < 1e-9);
  assert.ok(Math.abs(geometry.leftY - (56 - geometry.minimumHeight)) < 1e-9);
  const initial = miniAreaPose(0, base);
  const last = miniAreaPose(299, base);
  assert.equal(initial.path, last.path);
  assert.ok(initial.path.length > 0);
  assert.ok(initial.points.every((p) => p.y === geometry.leftY));
  let previous = initial;
  for (let frame = 0; frame <= AREA_TIMING.settle; frame++) {
    const pose = miniAreaPose(frame, base);
    pose.points.forEach((p, i) => {
      assert.equal(p.x, geometry.points[i].x);
      assert.ok(p.y <= previous.points[i].y + 1e-9);
      assert.ok(p.y >= geometry.points[i].y - 1e-9);
      assert.ok(geometry.height - p.y >= geometry.minimumHeight);
    });
    assert.equal(pose.points[0].y, geometry.leftY);
    previous = pose;
  }
  assert.deepEqual(previous.points, geometry.points);
  for (const frame of [0, 36, 90, 186, 222, 299]) {
    const html = render(h(MiniAreaGraphView, { graph: base, frame }));
    assert.doesNotMatch(html, /clip-path|<mask|scaleY/);
    assert.equal(paths(html).length, 1);
  }
});

test("corners rise one at a time from left to right, then return right to left", () => {
  const target = miniAreaGeometry(base.기록);
  const expectedStarts = [19, 43, 67];
  expectedStarts.forEach((frame, rank) => {
    const pose = miniAreaPose(frame, base);
    for (let i = 1; i < target.points.length; i++) {
      if (i < rank + 1) assert.equal(pose.points[i].y, target.points[i].y);
      else if (i === rank + 1) assert.ok(pose.points[i].y < target.leftY);
      else assert.equal(pose.points[i].y, target.leftY);
    }
  });
  for (let frame = 0; frame < AREA_DURATION; frame++) {
    const pose = miniAreaPose(frame, base);
    const moving = pose.cornerProgress.slice(1).filter((p) => p > 0 && p < 1);
    assert.ok(moving.length <= 1);
  }
  for (let frame = AREA_TIMING.start; frame <= AREA_TIMING.settle; frame++) {
    const entering = miniAreaPose(frame, base);
    const leaving = miniAreaPose(
      AREA_TIMING.start + AREA_TIMING.end - frame,
      base,
    );
    assert.deepEqual(entering.points, leaving.points);
    assert.equal(entering.path, leaving.path);
  }
});

test("interior corners round over the same visible span as the outer R6 corners", () => {
  for (const frame of [30, 54, 90, 216, 246]) {
    const pose = miniAreaPose(frame, base);
    const segments = pose.path.replace(/ Z$/, "").split(/ (?=L )/);
    for (let i = 1; i < pose.points.length - 1; i++) {
      const segment = segments[i];
      if (!segment.includes(" C ")) continue;
      const coords = segment.match(/-?\d+(?:\.\d+)?/g).map(Number);
      const p = pose.points[i];
      const startDistance = Math.hypot(coords[0] - p.x, coords[1] - p.y);
      const endDistance = Math.hypot(coords.at(-2) - p.x, coords.at(-1) - p.y);
      assert.ok(startDistance >= 6 - 0.001);
      assert.ok(endDistance >= 6 - 0.001);
    }
    assert.doesNotMatch(pose.path, /NaN|Infinity/);
  }
});
