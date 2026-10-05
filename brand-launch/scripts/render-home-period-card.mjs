import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  openBrowser,
  renderStill,
  renderMedia,
} from "@remotion/renderer";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const out = path.resolve("output/home-period-insight-card");
await fs.mkdir(out, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  outDir: await fs.mkdtemp(path.join(os.tmpdir(), "home-period-card-")),
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
    (item) => item.id === "HomePeriodInsightCard",
  );
  if (!composition)
    throw new Error("HomePeriodInsightCard composition missing");
  const emptyOnly = process.argv.includes("--empty");
  for (const frame of emptyOnly ? [] : [0, 5, 11, 15, 20, 26, 48, 60, 72, 89]) {
    await renderStill({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      frame,
      output: path.join(out, `frame-${frame}.png`),
    });
    console.log(`Rendered frame ${frame}`);
  }
  const emptyProps = {
    ...composition.props,
    재생: "정지",
    카드: [
      {
        종류: "newExperiences",
        제목: "새로운 경험을 기다리는 중",
        설명: "기록이 쌓이면 이전 경험과 비교해 보여드려요.",
        기록: [],
        섹션명: "",
        미각: "기본",
      },
    ],
  };
  await renderStill({
    serveUrl,
    composition: { ...composition, props: emptyProps },
    puppeteerInstance: browser,
    frame: 0,
    inputProps: emptyProps,
    output: path.join(out, "empty.png"),
  });
  if (!emptyOnly)
    await renderMedia({
      serveUrl,
      composition,
      puppeteerInstance: browser,
      codec: "h264",
      concurrency: 2,
      outputLocation: path.join(out, "HomePeriodInsightCard.mp4"),
    });
  console.log(
    `Rendered ${emptyOnly ? "empty card" : `${composition.durationInFrames} frames at ${composition.fps}fps`}: ${out}`,
  );
} finally {
  await browser.close({ silent: true });
}
