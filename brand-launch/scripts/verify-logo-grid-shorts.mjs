import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const before = process.argv.includes("--before");
const directory = path.join(
  root,
  "output/logo-grid-shorts-opening-20260922",
  before ? "before" : "after",
);
await mkdir(directory, { recursive: true });
const url = await bundle({
  entryPoint: path.join(root, "src/index.ts"),
  outDir: await mkdtemp(path.join(os.tmpdir(), "logo-shorts-check-")),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
try {
  const comps = await getCompositions(url, { puppeteerInstance: browser });
  const tasks = before
    ? {
        "LogoGrid-HD": [17, 120, 228, 299],
        "LogoGrid-Dynamic-HD": [36, 87, 120, 246, 299],
        "TasteBuddy-Petal-Shorts": [0, 5, 10, 15, 20, 25, 30],
      }
    : {
        "LogoGrid-HD": [
          0, 17, 18, 23, 28, 33, 38, 43, 47, 48, 120, 228, 233, 238, 243, 248,
          253, 257, 258, 299,
        ],
        "LogoGrid-Dynamic-HD": [
          36, 53, 54, 59, 64, 69, 74, 79, 83, 84, 86, 87, 120, 246, 269, 274,
          279, 284, 289, 294, 298, 299,
        ],
      };
  for (const [id, frames] of Object.entries(tasks)) {
    const composition = comps.find((c) => c.id === id);
    if (!composition) throw new Error(`Missing composition ${id}`);
    for (const frame of frames) {
      await renderStill({
        serveUrl: url,
        composition,
        puppeteerInstance: browser,
        frame,
        imageFormat: "png",
        output: path.join(
          directory,
          `${id}-${String(frame).padStart(3, "0")}.png`,
        ),
      });
    }
    console.log(`${id}: ${frames.length} frames rendered`);
  }
  await writeFile(
    path.join(directory, "frames.json"),
    JSON.stringify(tasks, null, 2),
  );
} finally {
  await browser.close({ silent: true });
}
