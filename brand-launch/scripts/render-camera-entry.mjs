import { syncNativeFeedback } from "./native-feedback-sync.mjs";
import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderMedia,
  renderStill,
} from "@remotion/renderer";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

await syncNativeFeedback();
await syncNativeFeedback({ check: true });

const output = path.resolve("output/tabbar-camera-entry");
await fs.mkdir(output, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  outDir: await fs.mkdtemp(path.join(output, "bundle-")),
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
    (c) => c.id === "TabBar-CameraEntry-Portrait",
  );
  if (!composition) throw new Error("Portrait composition missing");
  const click = Math.round(composition.props["클릭 전 대기"] * composition.fps);
  const launch =
    click + Math.round(composition.props["누름 시간"] * composition.fps);
  const camera =
    launch +
    Math.ceil(
      (1.2586192857687966 * composition.fps) / composition.props["진입 속도"],
    ) -
    Math.round((0.3 * composition.fps) / composition.props["진입 속도"]);
  const timingCode = ts.transpileModule(
    await fs.readFile("src/TabBarCameraEntry/feedback-timing.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.ES2022 } },
  ).outputText;
  const { feedbackTiming } = await import(
    `data:text/javascript;base64,${Buffer.from(timingCode).toString("base64")}`
  );
  const flow = feedbackTiming(composition.fps);
  const flowStart = composition.durationInFrames - flow.durationInFrames;
  const frames =
    process.env.FLOW_STILLS === "1"
      ? flow.stages.map(
          (stage) =>
            flowStart +
            stage.from +
            Math.round(Math.min(stage.seconds - 0.5, 2.3) * composition.fps),
        )
      : [
          0,
          click + 3,
          launch + 8,
          launch + 16,
          launch + 28,
          camera + 4,
          camera + 12,
          camera + 64,
          composition.durationInFrames - 1,
        ];
  if (process.env.BUBBLE_INTRO_STILLS === "1") {
    const start = flowStart + flow.stages.find((s) => s.id === "bubbles").from;
    frames.push(
      ...[0.15, 0.35, 0.65, 1.6, 4.1].map(
        (seconds) => start + Math.round(seconds * composition.fps),
      ),
    );
  }
  for (const frame of frames) {
    await renderStill({
      serveUrl,
      composition,
      frame,
      puppeteerInstance: browser,
      output: path.join(output, `frame-${frame}.png`),
    });
    console.log(`Rendered frame ${frame}`);
  }
  let previous = -1;
  if (process.env.STILLS_ONLY !== "1")
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      codec: "h264",
      crf: 18,
      x264Preset: "fast",
      concurrency: Math.min(
        4,
        Math.max(1, Number(process.env.RENDER_CONCURRENCY) || 2),
      ),
      outputLocation: path.join(output, "TabBar-CameraEntry-Portrait.mp4"),
      onProgress: ({ progress }) => {
        const percent = Math.floor(progress * 10) * 10;
        if (percent !== previous) {
          previous = percent;
          console.log(`Video ${percent}%`);
        }
      },
    });
  await fs.writeFile(
    path.join(output, "render-check.json"),
    JSON.stringify(
      {
        id: composition.id,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        frames,
        video: "TabBar-CameraEntry-Portrait.mp4",
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close({ silent: true });
}
