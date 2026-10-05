import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const output = path.resolve("output/tabbar-plus-button");
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
  const composition = compositions.find((c) => c.id === "TabBar-PlusButton");
  if (!composition) throw new Error("TabBar-PlusButton is missing");
  const last = composition.durationInFrames - 1;
  for (const frame of [0, 54, 432, last]) {
    await renderStill({
      serveUrl,
      composition,
      frame,
      puppeteerInstance: browser,
      output: path.join(output, `frame-${frame}.png`),
    });
    console.log(`Rendered ${frame}`);
  }
  for (const [name, overrides] of [
    ["native-scale", { 재생: "정지", "버튼 크기": 144 }],
    ["pressed", { 상태: "누름" }],
  ]) {
    const inputProps = { ...composition.props, ...overrides };
    await renderStill({
      serveUrl,
      composition: { ...composition, props: inputProps },
      inputProps,
      frame: 0,
      puppeteerInstance: browser,
      output: path.join(output, `${name}.png`),
    });
  }
  const hash = async (frame) =>
    createHash("sha256")
      .update(await fs.readFile(path.join(output, `frame-${frame}.png`)))
      .digest("hex");
  if ((await hash(0)) !== (await hash(last)))
    throw new Error("Loop endpoint images differ");
  await fs.writeFile(
    path.join(output, "render-check.json"),
    JSON.stringify(
      {
        id: composition.id,
        width: composition.width,
        height: composition.height,
        fps: composition.fps,
        durationInFrames: composition.durationInFrames,
        loopEndpointImagesEqual: true,
      },
      null,
      2,
    ),
  );
  console.log("Loop endpoint images match");
} finally {
  await browser.close({ silent: true });
}
