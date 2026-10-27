import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-bubble-motion-"));
const outfile = path.join(dir, "test.cjs");
await build({
  stdin: {
    contents: `
export {default as Original} from './src/components/system/plating/MiniBubbleChart';
export {MINI_BUBBLE_EXAMPLES, MINI_BUBBLE_ICON_EXAMPLE} from './src/plating/MiniBubbleChartExamples';
export {MiniBubbleGraphView as View} from './brand-launch/src/GraphMotion/MiniBubbleGraph';
export * from './brand-launch/src/GraphMotion/mini-bubble-motion';
export {miniBubbleDefaultProps as base} from './brand-launch/src/GraphMotion/mini-bubble-settings';

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
  miniBubbleItems,
  miniBubbleContent,
  miniBubblePose: pose,
  BUBBLE_DURATION,
  BUBBLE_FPS,
  MINI_BUBBLE_EXAMPLES,
  MINI_BUBBLE_ICON_EXAMPLE,
  h,
  render,
} = createRequire(import.meta.url)(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const svg = (html) =>
  html.slice(html.indexOf("<svg"), html.lastIndexOf("</svg>") + 6);
const labels = {
  umami: "감칠맛",
  sweet: "단맛",
  bitter: "쓴맛",
  salty: "짠맛",
  sour: "신맛",
  fat: "지방맛",
};
const input = (items) =>
  items.map((item) => ({
    항목: item.label,
    색상: labels[item.axis],
    값: item.value,
    "음식 종류": item.dishKindId,
  }));
const samples = [
  base.데이터,
  input(MINI_BUBBLE_EXAMPLES[1].items),
  input(MINI_BUBBLE_ICON_EXAMPLE),
  [],
  [{ 항목: "하나", 색상: "감칠맛", 값: 10 }],
  [0, null, 4, 1, 1000000].map((값, index) => ({
    항목: `항목${index}`,
    색상: "감칠맛",
    값,
  })),
  Array.from({ length: 12 }, (_, index) => ({
    항목: `항목${index}`,
    색상: "단맛",
    값: index + 1,
  })),
];

test("source SVG remains identical for numeric, icon, zero, missing and empty specimens", () => {
  assert.deepEqual(
    miniBubbleItems(base).map(({ id, ...item }) => item),
    MINI_BUBBLE_EXAMPLES[0].items.map(({ id, ...item }) => ({
      ...item,
      dishKindId: undefined,
    })),
  );
  for (const 데이터 of samples)
    for (const 표시 of ["숫자", "음식 아이콘"]) {
      const graph = { ...base, 데이터, 표시 };
      const expected = render(
        h(Original, {
          items: miniBubbleItems(graph),
          content: miniBubbleContent(graph),
        }),
      );
      for (const [재생, frame] of [
        ["진입·유지·퇴장", 36],
        ["진입·유지·퇴장", 60],
        ["정지", 0],
        ["진입 후 유지", 299],
      ]) {
        const actual = render(h(View, { graph: { ...graph, 재생 }, frame }));
        assert.equal(svg(actual), expected);
        assert.doesNotMatch(actual, /NaN|Infinity/);
      }
    }
});

test("left-to-right growth and reversed exit never move centers or change source values", () => {
  for (const 데이터 of samples) {
    const graph = { ...base, 데이터 };
    const target = pose(60, graph).map(({ progress, ...circle }) => circle);
    let previous = pose(0, graph);
    for (let frame = 0; frame < 300; frame++) {
      const current = pose(frame, graph);
      current.forEach((circle, index) => {
        const { progress, ...geometry } = circle;
        assert.deepEqual(geometry, target[index]);
        assert.ok(progress >= 0 && progress <= 1.04);
        if (index && frame >= 240)
          assert.ok(current[index - 1].progress >= progress);
        if (frame >= 240) assert.ok(progress <= previous[index].progress);
        assert.ok(
          circle.cx - circle.radius >= -1e-8 &&
            circle.cx + circle.radius <= 132 + 1e-8,
        );
        assert.ok(
          circle.cy - circle.radius >= -1e-8 &&
            circle.cy + circle.radius <= 56 + 1e-8,
        );
      });
      previous = current;
    }
  }
  assert.ok(pose(24, base)[0].progress > 0);
  assert.equal(pose(24, base)[1].progress, 0);
  assert.ok(pose(246, base)[1].progress < 1);
  assert.equal(pose(246, base)[0].progress, 1);
  const html = render(h(View, { graph: base, frame: 36 }));
  pose(36, base).forEach((circle, index) => {
    assert.ok(html.includes(`g:nth-of-type(${index + 1})`));
    assert.ok(
      html.includes(
        `transform-origin: ${circle.cx}px ${circle.cy}px; transform: scale(${circle.progress})`,
      ),
    );
  });
});

test("300 frames retain exact held shapes, static mode, entry-only mode and blank endpoints", () => {
  assert.equal(BUBBLE_DURATION, 300);
  assert.equal(BUBBLE_FPS, 60);
  for (const 데이터 of samples) {
    const graph = { ...base, 데이터 };
    assert.deepEqual(pose(0, graph), pose(299, graph));
    assert.ok(pose(0, graph).every((circle) => circle.progress === 0));
    assert.deepEqual(pose(60, graph), pose(240, graph));
    assert.deepEqual(pose(60, graph), pose(0, { ...graph, 재생: "정지" }));
    assert.deepEqual(
      pose(60, graph),
      pose(299, { ...graph, 재생: "진입 후 유지" }),
    );
  }
});

test("entry overshoots by four percent without being clamped or clipped, then settles exactly", () => {
  for (const 재생 of ["진입·유지·퇴장", "진입 후 유지"]) {
    const graph = { ...base, 재생 };
    for (let index = 0; index < 2; index++) {
      const start = 18 + index * 6;
      const peak = pose(start + 19.5, graph)[index];
      assert.equal(peak.progress, 1.04);
      assert.ok(pose(start + 18, graph)[index].progress > 1);
      assert.ok(pose(start + 24, graph)[index].progress > 1);
      assert.equal(pose(start + 30, graph)[index].progress, 1);
    }
  }
  const html = render(h(View, { graph: base, frame: 44 }));
  assert.ok(html.includes("svg { overflow: visible; }"));
  assert.ok(pose(44, base)[1].progress > 1.039);
  for (let frame = 240; frame < 300; frame++)
    assert.ok(pose(frame, base).every((circle) => circle.progress <= 1));
});
