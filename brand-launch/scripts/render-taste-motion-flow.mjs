import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderMedia, renderStill } from "@remotion/renderer";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const out = path.resolve("../output/taste-motion-flow-720-20261026/matched-1080");
await fs.mkdir(out, { recursive: true });
const temporaryBundle = await fs.mkdtemp(path.join(os.tmpdir(), "taste-motion-flow-"));
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
  const composition = compositions.find(({ id }) => id === "TasteMotion-completeFlow");
  if (!composition) throw new Error("TasteMotion-completeFlow is not registered");
  if (composition.width !== 1080 || composition.height !== 1080 || composition.defaultProps.motionDiameter !== 720)
    throw new Error("Expected a 1080px canvas with a 720px motion diameter");
  const references = ["TasteColor-Guide-Original", "TasteColor-GradientCircle"].map(id => compositions.find(c => c.id === id));
  if (references.some(c => !c || c.width !== composition.width || c.height !== composition.height))
    throw new Error("Flow, original color guide, and gradient circle canvases must match");
  for (const frame of [0, 120, 180, 330, 390, 510, 545]) {
    await renderStill({ serveUrl, composition, puppeteerInstance: browser, frame,
      imageFormat: "png", output: path.join(out, `frame-${frame}.png`) });
    console.log(`frame-${frame}.png`);
  }
  if (process.argv.includes("--video")) {
    let previousPercent = -10;
    await renderMedia({
      serveUrl, composition, puppeteerInstance: browser,
      codec: "h264", crf: 18, pixelFormat: "yuv420p", concurrency: 2,
      outputLocation: path.join(out, `${composition.id}.mp4`),
      onProgress: ({ progress }) => {
        const percent = Math.floor(progress * 10) * 10;
        if (percent > previousPercent) { console.log(`${composition.id}: ${percent}%`); previousPercent = percent; }
      },
    });
  }
  const { id, width, height, fps, durationInFrames, defaultProps } = composition;
  await fs.writeFile(path.join(out, "composition.json"), JSON.stringify({ id, width, height, fps, durationInFrames, defaultProps }, null, 2) + "\n");
} finally {
  if (browser) await browser.close({ silent: true });
  await fs.rm(temporaryBundle, { recursive: true, force: true });
}
