import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const lineOnly = process.argv.includes("--line");
const heightOnly = process.argv.includes("--height");
const referenceOnly = process.argv.includes("--reference") || heightOnly;
const out = path.resolve(
  heightOnly
    ? "output/graph-motion/reference-scroll/dynamic-height"
    : referenceOnly
      ? "output/graph-motion/reference-scroll/rightward-exit"
      : lineOnly
        ? "output/graph-motion/taste-change"
        : "output/graph-motion",
);
await fs.mkdir(out, { recursive: true });
console.log("Bundling graph compositions");
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  outDir: await fs.mkdtemp(path.join(os.tmpdir(), "taste-graph-bundle-")),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
try {
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
    timeoutInMilliseconds: 120000,
  });
  const graphCompositions = compositions.filter((composition) =>
    referenceOnly
      ? ["TasteGraph-TasteChange-Reference", "TasteGraph-TasteChange"].includes(
          composition.id,
        )
      : lineOnly
        ? composition.id === "TasteGraph-TasteChange"
        : composition.id.startsWith("TasteGraph-Bar"),
  );
  if (graphCompositions.length !== (referenceOnly ? 2 : lineOnly ? 1 : 3))
    throw new Error("Missing graph compositions");
  const tasks = heightOnly
    ? [
        ...[11, 26, 42, 82, 98, 99].map((frame) => ({
          id: "TasteGraph-TasteChange-Reference",
          frame,
        })),
        {
          id: "TasteGraph-TasteChange-Reference",
          frame: 42,
          suffix: "height-1",
          overrides: { "높낮이 배율": 1 },
        },
        {
          id: "TasteGraph-TasteChange-Reference",
          frame: 42,
          suffix: "height-6",
          overrides: { "높낮이 배율": 6 },
        },
        {
          id: "TasteGraph-TasteChange",
          frame: 52,
          suffix: "original-preserved",
        },
      ]
    : referenceOnly
      ? [
          ...[0, 10, 11, 18, 26, 42, 60, 67, 74, 82, 90, 97, 98, 99, 111].map(
            (frame) => ({ id: "TasteGraph-TasteChange-Reference", frame }),
          ),
          {
            id: "TasteGraph-TasteChange-Reference",
            frame: 0,
            suffix: "static",
            overrides: { 재생: "정지" },
          },
          {
            id: "TasteGraph-TasteChange-Reference",
            frame: 42,
            suffix: "pending",
            overrides: {
              데이터: [
                { 미각: "단맛", 기록: [15.2] },
                { 미각: "감칠맛", 기록: [-10.7] },
              ],
            },
          },
          {
            id: "TasteGraph-TasteChange",
            frame: 52,
            suffix: "original-preserved",
          },
        ]
      : lineOnly
        ? [
            ...[0, 18, 36, 52, 120, 160, 180, 194].map((frame) => ({
              id: "TasteGraph-TasteChange",
              frame,
            })),
            {
              id: "TasteGraph-TasteChange",
              frame: 0,
              suffix: "static",
              overrides: { 재생: "정지" },
            },
            {
              id: "TasteGraph-TasteChange",
              frame: 52,
              suffix: "empty",
              overrides: {
                "라벨 표시": true,
                데이터: [
                  { 미각: "단맛", 기록: [] },
                  { 미각: "짠맛", 기록: [] },
                ],
              },
            },
            {
              id: "TasteGraph-TasteChange",
              frame: 52,
              suffix: "pending",
              overrides: {
                "라벨 표시": true,
                데이터: [
                  { 미각: "단맛", 기록: [12] },
                  { 미각: "짠맛", 기록: [-8] },
                ],
              },
            },
            {
              id: "TasteGraph-TasteChange",
              frame: 52,
              suffix: "zero-and-short",
              overrides: {
                "라벨 표시": true,
                데이터: [
                  { 미각: "단맛", 기록: [0, 0, 0, 0, 0, 0, 0] },
                  { 미각: "짠맛", 기록: [0, 0] },
                ],
              },
            },
          ]
        : [
            ...[0, 18, 36, 60, 120, 168, 192, 210].map((frame) => ({
              id: "TasteGraph-Bar",
              frame,
            })),
            { id: "TasteGraph-Bar-Home", frame: 60 },
            { id: "TasteGraph-Bar-Distribution", frame: 60 },
            {
              id: "TasteGraph-Bar",
              frame: 60,
              suffix: "zero-missing-small",
              overrides: {
                "수치와 라벨": true,
                끝점: "모든 막대",
                데이터: [
                  { 항목: "미확인", 값: null },
                  { 항목: "0회", 값: 0 },
                  { 항목: "1회", 값: 1 },
                  { 항목: "1000회", 값: 1000 },
                ],
              },
            },
            {
              id: "TasteGraph-Bar",
              frame: 0,
              suffix: "static",
              overrides: { 재생: "정지" },
            },
          ];
  const rendered = [];
  for (const task of tasks) {
    const composition = graphCompositions.find(
      (candidate) => candidate.id === task.id,
    );
    const props = { ...composition.props, ...task.overrides };
    const output = path.join(
      out,
      `${task.id}-${task.frame}${task.suffix ? `-${task.suffix}` : ""}.png`,
    );
    await renderStill({
      serveUrl,
      composition: { ...composition, props },
      inputProps: props,
      frame: task.frame,
      output,
      puppeteerInstance: browser,
      timeoutInMilliseconds: 120000,
      logLevel: "error",
    });
    rendered.push({ ...task, output });
    console.log("Rendered", path.basename(output));
  }
  await fs.writeFile(
    path.join(out, "frames.json"),
    JSON.stringify(
      {
        compositions: graphCompositions.map(
          ({ id, width, height, fps, durationInFrames }) => ({
            id,
            width,
            height,
            fps,
            durationInFrames,
          }),
        ),
        rendered,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close({ silent: true });
}
