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

const out = path.resolve("../output/color-circle-20261026");
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
    (composition) => composition.id === "TasteColor-GradientCircle",
  );
  if (guides.length !== 1)
    throw new Error("The gradient circle must be registered in Studio");
  const guide = compositions.find((c) => c.id === "TasteColor-Guide-Original");
  const circle = guides[0];
  if (
    !guide ||
    guide.durationInFrames !== circle.durationInFrames ||
    guide.fps !== circle.fps ||
    guide.defaultProps.속도 !== circle.defaultProps.속도
  )
    throw new Error("Original guide and circle timing must match");
  await fs.writeFile(
    path.join(out, "sync.json"),
    JSON.stringify(
      {
        guide: guide.id,
        circle: circle.id,
        frames: circle.durationInFrames,
        fps: circle.fps,
        speed: circle.defaultProps.속도,
        metadataMatched: true,
      },
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
    const sourceFrames = [
      0, 7.5, 15, 75, 105, 134, 142.5, 150, 157.5, 165, 300, 450, 600, 750, 765,
      917,
    ];
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
