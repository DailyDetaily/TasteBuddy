import assert from "node:assert/strict";
import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const output = path.join(project, "output/taste-bloom-split");
await mkdir(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(project, "src/index.ts"),
  outDir: await mkdtemp(path.join(os.tmpdir(), "taste-bloom-split-")),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
try {
  const compositions = (
    await getCompositions(serveUrl, { puppeteerInstance: browser })
  ).filter((item) => item.id.startsWith("TasteBloom-"));
  assert.deepEqual(
    compositions.map((item) => item.id).sort(),
    [
      "TasteBloom-9",
      "TasteBloom-Wave",
      "TasteBloom-Controls-Demo",
      "TasteBloom-Profile",
      "TasteBloom-Profile-Landscape",
    ].sort(),
  );
  const manifest = compositions.map(
    ({ id, width, height, fps, durationInFrames }) => ({
      id,
      width,
      height,
      fps,
      durationInFrames,
    }),
  );
  await writeFile(
    path.join(output, "compositions.json"),
    JSON.stringify(manifest, null, 2),
  );
  console.log(
    "Verified five Taste Bloom compositions",
    JSON.stringify(manifest),
  );

  for (const spec of [
    { id: "TasteBloom-9", duration: 840, frames: [80, 290, 500, 710, 839] },
    {
      id: "TasteBloom-Wave",
      duration: 642,
      frames: [0, 40, 112, 113, 153, 300, 641],
    },
  ]) {
    const composition = compositions.find((item) => item.id === spec.id);
    assert.equal(composition?.durationInFrames, spec.duration);
    assert.equal(composition.fps, 30);
    for (const frame of spec.frames) {
      await renderStill({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        frame,
        imageFormat: "png",
        output: path.join(output, `${spec.id}-${frame}.png`),
      });
      console.log(`${spec.id} preview frame ${frame}`);
    }
    if (process.argv.includes("--stills")) continue;
    let previous = -1;
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      codec: "h264",
      concurrency: 2,
      crf: 18,
      outputLocation: path.join(output, `${spec.id}.mp4`),
      onProgress: ({ progress }) => {
        const step = Math.floor(progress * 10);
        if (step !== previous) {
          previous = step;
          console.log(`${spec.id} ${step * 10}%`);
        }
      },
    });
    console.log(`Ready: ${path.join(output, `${spec.id}.mp4`)}`);
  }
} finally {
  await browser.close({ silent: true });
}
