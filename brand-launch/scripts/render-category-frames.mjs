import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { bundle } from "@remotion/bundler";
const out = process.argv.includes("--change")
  ? "output/category-motion/change-dots"
  : process.argv.includes("--context")
    ? "output/category-motion/context-rings"
    : process.argv.includes("--experience")
      ? "output/category-motion/experience-v2"
      : process.argv.includes("--sensory")
        ? "output/category-motion/sensory-ring"
        : "output/category-motion";
console.log("building render bundle");
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  outDir: await fs.mkdtemp(path.join(os.tmpdir(), "taste-category-bundle-")),
  rspack: true,
  symlinkPublicDir: true,
});
console.log("bundle ready");
await fs.mkdir(out, { recursive: true });
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
const results = [];
try {
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
    timeoutInMilliseconds: 120000,
  });
  const tasks = [];
  for (const category of [
    "experienceCluster",
    "sensoryRays",
    "preferenceFocus",
    "contextLayers",
    "changeRipples",
  ]) {
    const id = "TasteData-" + category;
    for (const frame of [6, 27, 54, 180]) tasks.push({ id, frame });
    for (const suffix of ["idle", "reduced", "empty", "dense"])
      tasks.push({ id: id + "-" + suffix, frame: suffix === "dense" ? 54 : 0 });
  }
  for (const suffix of ["decrease", "equal", "zero", "unlinked"])
    tasks.push({ id: "TasteData-changeRipples-" + suffix, frame: 54 });
  for (const id of [
    "TasteData-preferenceFocus-small",
    "TasteData-preferenceFocus-all-negative",
    "TasteData-contextLayers-single",
  ])
    tasks.push({ id, frame: 54 });
  for (const category of [
    "experienceCluster",
    "sensoryRays",
    "preferenceFocus",
    "contextLayers",
    "changeRipples",
  ])
    tasks.push({ id: "TasteData-" + category + "-idle", frame: 359 });
  for (const initialDomain of ["aroma", "texture"])
    tasks.push({
      id: "TasteData-sensoryRays",
      frame: 54,
      props: { initialDomain },
      suffix: initialDomain,
    });
  for (const initialMode of ["fit", "overall"])
    tasks.push({
      id: "TasteData-preferenceFocus",
      frame: 54,
      props: { initialMode },
      suffix: initialMode,
    });
  tasks.push({
    id: "TasteData-contextLayers",
    frame: 54,
    props: { initialMode: "fit" },
    suffix: "fit",
  });
  tasks.push({ id: "TasteMotion-insightRing", frame: 120 });
  const finalPass = process.env.TASTE_RENDER_FINAL === "1";
  const selectedTasks = process.argv.includes("--change")
    ? [
        ...[0, 18, 42, 54, 144, 234, 324, 390, 413].map((frame) => ({
          id: "TasteData-changeRipples",
          frame,
        })),
        ...[
          "idle",
          "reduced",
          "empty",
          "dense",
          "zero",
          "held",
          "unanswered",
          "decrease",
          "equal",
          "unlinked",
        ].map((suffix) => ({
          id: "TasteData-changeRipples-" + suffix,
          frame: ["dense", "zero", "decrease", "equal", "unlinked"].includes(
            suffix,
          )
            ? 54
            : 0,
        })),
      ]
    : process.argv.includes("--context")
      ? [
          ...[0, 9, 18, 30, 42, 54, 180, 300, 390, 413].map(
            (frame) => ({ id: "TasteData-contextLayers", frame }),
          ),
          ...[
            "idle",
            "reduced",
            "empty",
            "dense",
            "zero",
            "held",
            "unanswered",
            "single",
          ].map((suffix) => ({
            id: "TasteData-contextLayers-" + suffix,
            frame: ["dense", "zero", "single"].includes(suffix) ? 54 : 0,
          })),
          { id: "TasteData-contextLayers-idle", frame: 359 },
          {
            id: "TasteData-contextLayers",
            frame: 54,
            props: { initialMode: "fit" },
            suffix: "fit",
          },
        ]
      : process.argv.includes("--sensory")
        ? [
            ...[0, 9, 27, 54, 81].map((frame) => ({
              id: "TasteData-sensoryRays",
              frame,
            })),
            ...[
              "idle",
              "reduced",
              "empty",
              "dense",
              "zero",
              "held",
              "unanswered",
            ].map((suffix) => ({
              id: "TasteData-sensoryRays-" + suffix,
              frame: ["dense", "zero"].includes(suffix) ? 54 : 0,
            })),
            { id: "TasteData-sensoryRays-idle", frame: 359 },
            ...["aroma", "texture"].map((initialDomain) => ({
              id: "TasteData-sensoryRays",
              frame: 54,
              props: { initialDomain },
              suffix: initialDomain,
            })),
          ]
        : process.argv.includes("--experience")
          ? [
              ...[0, 9, 18, 30, 57, 78, 105, 135, 165, 192].map((frame) => ({
                id: "TasteData-experienceCluster",
                frame,
              })),
              ...["idle", "reduced", "empty", "dense", "added"].map(
                (suffix) => ({
                  id: "TasteData-experienceCluster-" + suffix,
                  frame: ["dense", "added"].includes(suffix) ? 192 : 0,
                }),
              ),
              { id: "TasteData-experienceCluster-idle", frame: 359 },
            ]
          : process.argv.includes("--empty-only")
            ? tasks.filter((task) => task.id.endsWith("-empty"))
            : finalPass
              ? tasks.filter(
                  (task) =>
                    task.id.includes("contextLayers") ||
                    (task.frame === 54 &&
                      !task.suffix &&
                      !task.id.includes("-dense") &&
                      !task.id.includes("-empty")),
                )
              : tasks;
  for (const task of selectedTasks) {
    if (process.argv.includes("--idle-only") && !task.id.endsWith("-idle"))
      continue;
    const composition = compositions.find((c) => c.id === task.id);
    if (!composition) throw new Error("Missing " + task.id);
    const output =
      out +
      "/" +
      task.id +
      "-" +
      task.frame +
      (task.suffix ? "-" + task.suffix : "") +
      ".png";
    await renderStill({
      serveUrl,
      composition: task.props
        ? { ...composition, props: { ...composition.props, ...task.props } }
        : composition,
      frame: task.frame,
      output,
      inputProps: task.props
        ? { ...composition.props, ...task.props }
        : undefined,
      puppeteerInstance: browser,
      timeoutInMilliseconds: 120000,
      logLevel: "error",
    });
    results.push({ ...task, output });
    console.log("rendered", task.id, task.frame);
  }
  await fs.writeFile(
    out +
      (process.argv.includes("--idle-only")
        ? "/render-idle-manifest.json"
        : process.argv.includes("--empty-only")
          ? "/render-empty-manifest.json"
          : finalPass
            ? "/render-final-manifest.json"
            : "/render-manifest.json"),
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close({ silent: true });
}
