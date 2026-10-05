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
if (process.argv.includes("--dynamic"))
  throw new Error("LogoGrid-Dynamic was removed. Use --black for Logo-Black.");
const black = process.argv.includes("--black");
const output = path.join(
  project,
  black ? "output/logo-black" : "output/logo-grid",
);
const compositionId = black ? "Logo-Black" : "LogoGrid";
const video = process.argv.includes("--video");
const hd = process.argv.includes("--hd");
const frameArg = process.argv.find((arg) => arg.startsWith("--frames="));
const frames = frameArg
  ? frameArg.slice(9).split(",").map(Number)
  : black
    ? [0, 18, 24, 33, 43, 56, 72, 83, 120, 220, 228, 243, 258, 299]
    : [0, 18, 24, 30, 36, 45, 60, 90, 120, 222, 228, 234, 246, 270, 299];
if (
  frames.some((frame) => !Number.isInteger(frame) || frame < 0 || frame > 299)
)
  throw new Error("Frames must be integers from 0 through 299.");
await mkdir(path.join(output, "rendered-frames"), { recursive: true });
console.log("Bundling Logo Grid compositions…");
const serveUrl = await bundle({
  entryPoint: path.join(project, "src/index.ts"),
  outDir: await mkdtemp(path.join(os.tmpdir(), "taste-logo-grid-")),
  rspack: true,
  symlinkPublicDir: true,
});
const browser = await openBrowser("chrome", {
  chromiumOptions: { gl: "angle" },
});
try {
  const compositions = await getCompositions(serveUrl, {
    puppeteerInstance: browser,
    timeoutInMilliseconds: 120000,
  });
  const targetId = hd || !video ? `${compositionId}-HD` : compositionId;
  const composition = compositions.find((comp) => comp.id === targetId);
  if (!composition)
    throw new Error(
      `${targetId} is missing. Registered: ${compositions.map((comp) => comp.id).join(", ")}`,
    );
  if (video) {
    let last = -1;
    const destination = path.join(
      output,
      `TasteBuddy-${compositionId}-${hd ? "HD" : "4K"}.mp4`,
    );
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      codec: "h264",
      muted: true,
      enforceAudioTrack: false,
      crf: 16,
      pixelFormat: "yuv420p",
      imageFormat: "png",
      outputLocation: destination,
      concurrency: 2,
      onProgress: ({ progress }) => {
        const step = Math.floor(progress * 10);
        if (step !== last) {
          last = step;
          console.log(`Render ${step * 10}%`);
        }
      },
    });
    console.log(destination);
  } else {
    for (const frame of frames) {
      await renderStill({
        serveUrl,
        composition,
        puppeteerInstance: browser,
        frame,
        imageFormat: "png",
        output: path.join(
          output,
          "rendered-frames",
          `${String(frame).padStart(3, "0")}.png`,
        ),
      });
      console.log(`Verified render at frame ${frame}`);
    }
    await writeFile(
      path.join(output, "render-check.json"),
      JSON.stringify(
        {
          composition: composition.id,
          registeredLogoCompositions: compositions
            .map((comp) => comp.id)
            .filter((id) => id.startsWith("Logo")),
          frames,
          width: composition.width,
          height: composition.height,
          fps: composition.fps,
          durationInFrames: composition.durationInFrames,
        },
        null,
        2,
      ),
    );
  }
} finally {
  await browser.close({ silent: true });
}
