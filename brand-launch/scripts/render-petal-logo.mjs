import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const output = path.join(project, "output/petal-logo");
const video = process.argv.includes("--video");
await mkdir(path.join(output, "frames"), { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(project, "src/index.ts"),
  outDir: await mkdtemp(path.join(os.tmpdir(), "taste-petal-logo-")),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
try {
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
  });
  const composition = compositions.find(
    (c) => c.id === "TasteBuddy-Petal-Shorts",
  );
  if (!composition) throw new Error("Petal logo composition missing");
  const frames = [
    ...new Set([
      0,
      15,
      30,
      65,
      69,
      75,
      79,
      80,
      81,
      83,
      85,
      87,
      89,
      90,
      99,
      100,
      115,
      130,
      155,
      175,
      189,
      190,
      191,
      205,
      220,
      235,
      250,
      265,
      278,
      279,
      280,
      281,
      295,
      310,
      325,
      340,
      355,
      369,
      370,
      330,
      331,
      360,
      390,
      420,
      421,
      450,
      480,
      510,
      511,
      436,
      446,
      456,
      471,
      472,
      482,
      491,
      492,
      496,
      501,
      502,
      506,
      512,
      527,
      541,
      542,
      composition.durationInFrames - 1,
    ]),
  ]
    .filter((frame) => frame < composition.durationInFrames)
    .sort((a, b) => a - b);
  for (const frame of frames) {
    await renderStill({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      frame,
      imageFormat: "png",
      scale: 0.5,
      output: path.join(
        output,
        "frames",
        `${String(frame).padStart(3, "0")}.png`,
      ),
    });
    console.log(`Frame ${frame} rendered`);
  }
  if (video) {
    let last = -1;
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      outputLocation: path.join(
        output,
        "TasteBuddy-Petal-Shorts-1080x1920.mp4",
      ),
      codec: "h264",
      crf: 16,
      pixelFormat: "yuv420p",
      imageFormat: "png",
      muted: true,
      enforceAudioTrack: false,
      concurrency: 2,
      onProgress: ({ progress }) => {
        const step = Math.floor(progress * 10);
        if (step !== last) {
          last = step;
          console.log(`Video ${step * 10}%`);
        }
      },
    });
  }
  await writeFile(
    path.join(output, "render-check.json"),
    JSON.stringify(
      {
        composition: composition.id,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        frames: composition.durationInFrames,
        checkedFrames: frames,
        videoRendered: video,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close({ silent: true });
}
