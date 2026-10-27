import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const line = process.argv.includes("--line");
const area = process.argv.includes("--area");
const stacked = process.argv.includes("--stacked");
const grouped = process.argv.includes("--grouped");
const heatmap = process.argv.includes("--heatmap");
const pie = process.argv.includes("--pie");
const bubble = process.argv.includes("--bubble");
const treemap = process.argv.includes("--treemap");
const transition = process.argv.includes("--transition");
const id = transition
  ? "TasteGraph-Transition"
  : treemap
    ? "TasteGraph-Treemap"
    : bubble
      ? "TasteGraph-Bubble"
      : pie
        ? "TasteGraph-Pie"
        : heatmap
          ? "TasteGraph-Heatmap"
          : grouped
            ? "TasteGraph-GroupedBar"
            : stacked
              ? "TasteGraph-StackedBar"
              : area
                ? "TasteGraph-Area"
                : line
                  ? "TasteGraph-Line"
                  : "TasteGraph-Bar";
const out = path.resolve(
  `output/graph-motion/${transition ? "transition" : treemap ? "mini-treemap" : bubble ? "mini-bubble" : pie ? "mini-pie" : heatmap ? "mini-heatmap" : grouped ? "mini-grouped-bar" : stacked ? "mini-stacked-bar" : area ? "mini-area" : line ? "mini-line" : "mini-bar"}`,
);
await fs.mkdir(out, { recursive: true });
const bundleDir = await fs.mkdtemp(path.join(os.tmpdir(), "taste-mini-bar-"));
let browser;
try {
  const serveUrl = await bundle({
    entryPoint: path.resolve("src/index.ts"),
    outDir: bundleDir,
    rspack: true,
    symlinkPublicDir: true,
  });
  browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
    timeoutInMilliseconds: 120000,
  });
  const graphs = compositions.filter((c) => c.id.startsWith("TasteGraph-"));
  if (
    graphs.length !== 10 ||
    !graphs.some((c) => c.id === "TasteGraph-Bar") ||
    !graphs.some((c) => c.id === "TasteGraph-Line") ||
    !graphs.some((c) => c.id === "TasteGraph-Area") ||
    !graphs.some((c) => c.id === "TasteGraph-StackedBar") ||
    !graphs.some((c) => c.id === "TasteGraph-GroupedBar") ||
    !graphs.some((c) => c.id === "TasteGraph-Heatmap") ||
    !graphs.some((c) => c.id === "TasteGraph-Pie") ||
    !graphs.some((c) => c.id === "TasteGraph-Bubble") ||
    !graphs.some((c) => c.id === "TasteGraph-Treemap") ||
    !graphs.some((c) => c.id === "TasteGraph-Transition")
  )
    throw new Error(
      "Expected nine graph specimens and the transition composition",
    );
  const composition = graphs.find((c) => c.id === id);
  if (
    composition.durationInFrames !== (transition ? 1176 : 300) ||
    composition.fps !== 60
  )
    throw new Error(`Expected ${transition ? 1176 : 300} frames at 60fps`);
  let tasks = treemap
    ? [
        ...[0, 24, 38, 50, 72, 90, 210, 246, 270, 299].map((frame) => ({
          name: `frame-${frame}`,
          frame,
        })),
        { name: "static", frame: 0, overrides: { 재생: "정지" } },
        {
          name: "missing-and-zero",
          frame: 0,
          overrides: {
            재생: "정지",
            데이터: [0, null, 3, 8, 18].map((값, i) => ({
              항목: `항목${i}`,
              색상: "감칠맛",
              값,
            })),
          },
        },
        {
          name: "twelve",
          frame: 0,
          overrides: {
            재생: "정지",
            데이터: Array.from({ length: 12 }, (_, i) => ({
              항목: `항목${i}`,
              색상: "감칠맛",
              값: i + 1,
            })),
          },
        },
        { name: "empty", frame: 0, overrides: { 재생: "정지", 데이터: [] } },
      ]
    : bubble
      ? [
          ...[0, 24, 36, 48, 60, 240, 252, 270, 299].map((frame) => ({
            name: `frame-${frame}`,
            frame,
          })),
          { name: "static", frame: 0, overrides: { 재생: "정지" } },
          {
            name: "three",
            frame: 0,
            overrides: {
              재생: "정지",
              데이터: [
                { 항목: "한식", 색상: "감칠맛", 값: 3 },
                { 항목: "양식", 색상: "단맛", 값: 8 },
                { 항목: "중식", 색상: "쓴맛", 값: 18 },
              ],
            },
          },
          {
            name: "icons",
            frame: 0,
            overrides: {
              재생: "정지",
              표시: "음식 아이콘",
              데이터: [
                { 항목: "해산물", 색상: "짠맛", 값: 9, "음식 종류": "seafood" },
                { 항목: "육류", 색상: "감칠맛", 값: 16, "음식 종류": "meat" },
                { 항목: "면류", 색상: "단맛", 값: 6, "음식 종류": "noodle" },
              ],
            },
          },
          { name: "empty", frame: 0, overrides: { 재생: "정지", 데이터: [] } },
        ]
      : pie
        ? [
            ...[0, 24, 36, 48, 60, 72, 228, 246, 270, 299].map((frame) => ({
              name: `frame-${frame}`,
              frame,
            })),
            { name: "static", frame: 0, overrides: { 재생: "정지" } },
            {
              name: "absolute",
              frame: 0,
              overrides: {
                재생: "정지",
                "값 기준": "절대 백분율",
                데이터: [
                  { 항목: "집밥", 색상: "감칠맛", 값: 10 },
                  { 항목: "외식", 색상: "단맛", 값: 30 },
                  { 항목: "배달", 색상: "쓴맛", 값: 20 },
                ],
              },
            },
            {
              name: "empty",
              frame: 0,
              overrides: { 재생: "정지", 데이터: [] },
            },
          ]
        : heatmap
          ? [
              ...[
                0, 24, 48, 72, 96, 120, 132, 144, 156, 192, 216, 252, 299,
              ].map((frame) => ({
                name: `frame-${frame}`,
                frame,
              })),
              { name: "static", frame: 0, overrides: { 재생: "정지" } },
              {
                name: "missing-and-zero",
                frame: 0,
                overrides: {
                  재생: "정지",
                  기록: Array.from({ length: 31 }, (_, index) =>
                    index > 20 || index % 6 === 2 ? null : index % 7,
                  ),
                },
              },
              {
                name: "six-weeks",
                frame: 0,
                overrides: { 재생: "정지", "시작 요일": "일요일" },
              },
              {
                name: "empty",
                frame: 0,
                overrides: { 재생: "정지", 기록: [] },
              },
            ]
          : grouped
            ? [
                ...[0, 24, 48, 96, 192, 216, 252, 299].map((frame) => ({
                  name: `frame-${frame}`,
                  frame,
                })),
                { name: "static", frame: 0, overrides: { 재생: "정지" } },
                {
                  name: "missing-and-zero",
                  frame: 0,
                  overrides: {
                    재생: "정지",
                    "이전 기록": [0, 2, null, 4, 1],
                    "현재 기록": [1, null, 0, 2],
                  },
                },
                {
                  name: "month",
                  frame: 0,
                  overrides: {
                    재생: "정지",
                    "이전 기록": Array.from(
                      { length: 31 },
                      (_, index) => (index + 3) % 8,
                    ),
                    "현재 기록": Array.from(
                      { length: 31 },
                      (_, index) => index % 7,
                    ),
                  },
                },
                {
                  name: "empty",
                  frame: 0,
                  overrides: { 재생: "정지", "이전 기록": [], "현재 기록": [] },
                },
              ]
            : stacked
              ? [
                  ...[0, 24, 44, 58, 70, 84, 96, 192, 216, 252, 299].map(
                    (frame) => ({
                      name: `frame-${frame}`,
                      frame,
                    }),
                  ),
                  { name: "static", frame: 0, overrides: { 재생: "정지" } },
                  {
                    name: "missing-and-zero",
                    frame: 0,
                    overrides: {
                      재생: "정지",
                      데이터: [
                        {
                          항목: "집밥",
                          색상: "감칠맛",
                          기록: [0, 2, null, 4, 3, 4, 5],
                        },
                        {
                          항목: "외식",
                          색상: "단맛",
                          기록: [0, 0, 1, 1, null, 2],
                        },
                        {
                          항목: "배달",
                          색상: "쓴맛",
                          기록: [0, 1, 1, 2, 1, 1, 2],
                        },
                      ],
                    },
                  },
                  {
                    name: "fortnight",
                    frame: 0,
                    overrides: {
                      재생: "정지",
                      데이터: [
                        {
                          항목: "집밥",
                          색상: "감칠맛",
                          기록: [2, 3, 2, 4, 3, 4, 5, 2, 3, 4, 2, 3, 4, 5, 4],
                        },
                        {
                          항목: "외식",
                          색상: "단맛",
                          기록: [1, 2, 2, 1, 3, 2, 3, 2, 1, 2, 3, 1, 2, 3, 2],
                        },
                        {
                          항목: "배달",
                          색상: "쓴맛",
                          기록: [1, 0, 1, 2, 1, 1, 2, 0, 1, 2, 1, 2, 1, 1, 2],
                        },
                      ],
                    },
                  },
                ]
              : area
                ? [
                    ...[0, 24, 54, 90, 186, 216, 246, 299].map((frame) => ({
                      name: `frame-${frame}`,
                      frame,
                    })),
                    { name: "static", frame: 0, overrides: { 재생: "정지" } },
                    {
                      name: "falling",
                      frame: 0,
                      overrides: { 재생: "정지", 기록: [4.5, 2.4, 2.1, 1.2] },
                    },
                    {
                      name: "empty",
                      frame: 0,
                      overrides: { 재생: "정지", 기록: [] },
                    },
                  ]
                : line
                  ? [
                      ...[0, 24, 54, 90, 186, 216, 246, 299].map((frame) => ({
                        name: `frame-${frame}`,
                        frame,
                      })),
                      { name: "static", frame: 0, overrides: { 재생: "정지" } },
                      {
                        name: "pair",
                        frame: 0,
                        overrides: {
                          재생: "정지",
                          데이터: [
                            { 미각: "감칠맛", 기록: [1.2, 2.1, 2.4, 4.5] },
                            { 미각: "쓴맛", 기록: [0.8, -0.6, -1.4, -2.8] },
                          ],
                        },
                      },
                      {
                        name: "single-point",
                        frame: 0,
                        overrides: {
                          재생: "정지",
                          데이터: [{ 미각: "감칠맛", 기록: [0] }],
                        },
                      },
                    ]
                  : [
                      ...[0, 24, 48, 96, 192, 216, 252, 299].map((frame) => ({
                        name: `frame-${frame}`,
                        frame,
                      })),
                      { name: "static", frame: 0, overrides: { 재생: "정지" } },
                      {
                        name: "missing-and-zero",
                        frame: 0,
                        overrides: {
                          재생: "정지",
                          데이터: [0, 1, null, 3, 5, 2, null].map((값, i) => ({
                            항목: `${i + 1}일`,
                            값,
                          })),
                        },
                      },
                      {
                        name: "month",
                        frame: 0,
                        overrides: {
                          재생: "정지",
                          데이터: Array.from({ length: 31 }, (_, i) => ({
                            항목: `${i + 1}일`,
                            값: i % 8,
                          })),
                        },
                      },
                    ];
  if (transition) {
    tasks = [
      ...[
        0, 24, 39, 40, 41, 90, 120, 134, 148, 160, 172, 178, 192, 207, 221, 228,
        250, 282, 299, 306, 327, 348, 359, 360, 374, 387, 394, 404, 414, 432,
        443, 444, 455, 456, 465, 485, 486, 498, 510, 522, 534, 546, 558, 570,
        581, 582, 594, 606, 618, 630, 642, 654, 666, 678, 696, 719, 720, 743, 744, 756, 780, 804, 816, 840, 861, 882, 888, 894, 906, 921, 936, 951, 966, 978, 990, 1002, 1014, 1026, 1043, 1044, 1062, 1080, 1092, 1107, 1122, 1134, 1175,
      ].map((frame) => ({
        name: `frame-${frame}`,
        frame,
      })),
      { name: "empty", frame: 1175, overrides: { 데이터: [] } },
      {
        name: "descending",
        frame: 299,
        overrides: {
          데이터: [{ 미각: "감칠맛", 기록: [4, 1, -2, -5] }],
        },
      },
    ];
  }
  // Re-render a focused range after a timing/value adjustment without repeating unrelated frames.
  const selected = process.argv.find(arg => arg.startsWith("--frames="));
  if (selected) {
    const frames = selected.slice("--frames=".length).split(",").map(Number);
    if (!frames.length || frames.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= composition.durationInFrames))
      throw new Error("--frames expects comma-separated frame numbers within the composition");
    tasks = [...new Set(frames)].map(frame => ({ name: `frame-${frame}`, frame }));
  }
  for (const task of tasks) {
    const inputProps = { ...composition.defaultProps, ...task.overrides };
    const resolved = task.overrides
      ? await selectComposition({
          serveUrl,
          id: composition.id,
          inputProps,
          puppeteerInstance: browser,
        })
      : composition;
    await renderStill({
      serveUrl,
      composition: resolved,
      puppeteerInstance: browser,
      frame: task.frame,
      inputProps,
      output: path.join(out, `${task.name}.png`),
      imageFormat: "png",
    });
    console.log(`${task.name}.png`);
  }
  await fs.writeFile(
    path.join(out, selected ? "frames-selected.json" : "frames.json"),
    JSON.stringify(
      {
        id: composition.id,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        tasks,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  if (browser) await browser.close({ silent: true });
  await fs.rm(bundleDir, { recursive: true, force: true });
}
