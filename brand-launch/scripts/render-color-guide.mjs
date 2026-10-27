import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const original = process.argv.includes("--original");
const compositionId = original
  ? "TasteColor-Guide-Original"
  : "TasteColor-Guide";
const out = path.resolve(
  original
    ? "../output/color-guide-20261026/original"
    : "../output/color-guide-20261026/seamless-handoff",
);
await fs.mkdir(out, { recursive: true });
const temporaryBundle = await fs.mkdtemp(
  path.join(os.tmpdir(), "taste-color-guide-"),
);
let browser;
try {
  const serveUrl = await bundle({
    entryPoint: path.resolve("src/index.ts"),
    outDir: temporaryBundle,
    rspack: true,
    symlinkPublicDir: true,
  });
  browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" } });
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
    timeoutInMilliseconds: 120000,
  });
  const guides = compositions.filter(
    (composition) => composition.id === compositionId,
  );
  if (guides.length !== 1)
    throw new Error(
      `${compositionId} must be registered exactly once in Studio`,
    );
  await fs.writeFile(
    path.join(out, "guide-versions.json"),
    JSON.stringify(
      compositions
        .filter(({ id }) => id.startsWith("TasteColor-Guide"))
        .map(({ id, durationInFrames, fps }) => ({
          id,
          durationInFrames,
          fps,
        })),
      null,
      2,
    ),
  );
  const video = process.argv.includes("--video");
  const selectedFrames = process.argv
    .find((arg) => arg.startsWith("--frames="))
    ?.slice(9)
    .split(",")
    .map(Number);
  for (const composition of guides) {
    const sourceFrames = original
      ? [0, 15, 45, 75, 90, 105, 135, 150, 165, 855, 915, 917]
      : [0, 15, 18, 21, 45, 72, 75, 78, 105, 132, 135, 138, 675, 729, 735, 737];
    const speed = composition.defaultProps.속도;
    const frames = selectedFrames ?? [
      ...new Set(
        [...sourceFrames, (composition.durationInFrames - 1) * speed].map(
          (frame) =>
            Math.min(
              composition.durationInFrames - 1,
              Math.ceil(frame / speed),
            ),
        ),
      ),
    ];
    if (video) {
      let previousPercent = -10;
      await renderMedia({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        codec: "h264",
        crf: 18,
        pixelFormat: "yuv420p",
        concurrency: 2,
        outputLocation: path.join(out, `${composition.id}.mp4`),
        onProgress: ({ progress }) => {
          const percent = Math.floor((progress * 100) / 10) * 10;
          if (percent > previousPercent) {
            console.log(`${composition.id}: ${percent}%`);
            previousPercent = percent;
          }
        },
      });
    } else {
      for (const frame of frames) {
        await renderStill({
          serveUrl,
          composition,
          puppeteerInstance: browser,
          frame,
          imageFormat: "png",
          output: path.join(out, `frame-${frame}.png`),
        });
        console.log(`frame-${frame}.png`);
      }
    }
  }
  await fs.writeFile(
    path.join(out, "compositions.json"),
    JSON.stringify(
      guides.map(
        ({ id, width, height, fps, durationInFrames, defaultProps }) => ({
          id,
          width,
          height,
          fps,
          durationInFrames,
          defaultProps,
        }),
      ),
      null,
      2,
    ) + "\n",
  );
} finally {
  if (browser) await browser.close({ silent: true });
  await fs.rm(temporaryBundle, { recursive: true, force: true });
}
