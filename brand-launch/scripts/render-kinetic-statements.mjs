import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const output = path.join(project, "output/kinetic-statements/white-centered");
await mkdir(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.join(project, "src/index.ts"),
  outDir: await mkdtemp(path.join(os.tmpdir(), "taste-kinetic-")),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
try {
  const all = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
    timeoutInMilliseconds: 120000,
  });
  const compositions = all.filter(({ id }) =>
    id.startsWith("Kinetic-Statements"),
  );
  if (compositions.length !== 3)
    throw new Error("Expected all three Kinetic Statements formats.");
  const checked = [];
  for (const composition of compositions) {
    const fractions =
      composition.id === "Kinetic-Statements"
        ? [0, 0.1, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92, 1]
        : [0.18, 0.45, 0.72, 1];
    const frames = [
      ...new Set(
        fractions.map((fraction) =>
          Math.min(
            composition.durationInFrames - 1,
            Math.round((composition.durationInFrames - 1) * fraction),
          ),
        ),
      ),
    ];
    const directory = path.join(output, composition.id);
    await mkdir(directory, { recursive: true });
    for (const frame of frames) {
      await renderStill({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        frame,
        imageFormat: "png",
        output: path.join(directory, `${String(frame).padStart(3, "0")}.png`),
      });
      console.log(`${composition.id} · frame ${frame}`);
    }
    const { id, width, height, fps, durationInFrames } = composition;
    checked.push({ id, width, height, fps, durationInFrames, frames });
  }
  const logo = all.find(({ id }) => id === "Logo-Black-HD");
  if (!logo) throw new Error("Logo-Black-HD is missing.");
  const logoDirectory = path.join(
    project,
    "output/logo-black-dish/rendered-frames",
  );
  await mkdir(logoDirectory, { recursive: true });
  for (const frame of [0, 33, 64, 120, 243, 299]) {
    await renderStill({
      serveUrl,
      composition: logo,
      puppeteerInstance: browser,
      frame,
      imageFormat: "png",
      output: path.join(logoDirectory, `${String(frame).padStart(3, "0")}.png`),
    });
    console.log(`Logo-Black-HD · dish background · frame ${frame}`);
  }
  await writeFile(
    path.join(output, "render-check.json"),
    JSON.stringify({ compositions: checked }, null, 2) + "\n",
  );
} finally {
  await browser.close({ silent: true });
}
