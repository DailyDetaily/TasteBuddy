import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import { mkdir, mkdtemp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import "./sync-bloom-workbench.mjs";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const output = path.join(project, "output/bloom-workbench");
await mkdir(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(project, "src/index.ts"),
  outDir: await mkdtemp(path.join(os.tmpdir(), "bloom-controls-render-")),
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
    (item) => item.id === "TasteBloom-Controls-Demo",
  );
  if (!composition) throw new Error("Bloom controls demo is not registered");
  for (const frame of [0, 100, 165, 230, 360, 425, 560, 650, 690]) {
    await renderStill({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      frame,
      imageFormat: "png",
      output: path.join(output, `frame-${frame}.png`),
    });
    console.log(`Preview frame ${frame}`);
  }
  if (!process.argv.includes("--stills")) {
    let previous = -1;
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      codec: "h264",
      concurrency: 2,
      crf: 18,
      outputLocation: path.join(output, "TasteBloom-Controls-Demo.mp4"),
      onProgress: ({ progress }) => {
        const milestone = Math.floor(progress * 10);
        if (milestone !== previous) {
          previous = milestone;
          console.log(`Video ${milestone * 10}%`);
        }
      },
    });
    console.log(
      `Video ready: ${path.join(output, "TasteBloom-Controls-Demo.mp4")}`,
    );
  }
} finally {
  await browser.close({ silent: true });
}
