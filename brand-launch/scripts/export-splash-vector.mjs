import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const project = fileURLToPath(new URL("../", import.meta.url));
const root = path.resolve(project, "..");
const load = async (name) => {
  const code = ts.transpileModule(fs.readFileSync(path.join(project, "src/LogoGrid", name), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
};
const { logoGridElements } = await load("geometry.ts");
const { wordmarkFillMaps } = await load("wordmarkFillMaps.ts");
const { petalAngles } = await load("motion.ts");
const data = {
  version: 1,
  viewport: { width: 800, height: 360, cropX: 560, cropY: 360, displayWidth: 220, displayHeight: 99 },
  fps: 30, durationFrames: 84, maskSteps: 48,
  placement: { x: 278, y: 200, scale: 1.36 },
  symbol: { cx: 308, cy: 249, initialX: 960, initialY: 540, perspective: 1400 * 92 / (627.2727272727 * 0.53),
    openFrames: 30, moveStart: 6, moveEnd: 30,
    leaves: logoGridElements.filter(n => n.role === "logo.symbol").map(n => ({ index: n.index, angle: petalAngles[n.index], d: n.props.d })) },
  glyphs: logoGridElements.filter(n => n.role === "logo.wordmark").map(n => ({
    index: n.index, d: n.props.d, start: (n.index < 7 ? 25 + (n.index - 2) * 2 : 33 + (n.index - 7) * 2), duration: 24,
    map: { ...wordmarkFillMaps[n.index], file: path.join(project, "public", wordmarkFillMaps[n.index].src) },
  })),
};
for (const n of [...data.symbol.leaves, ...data.glyphs])
  if ([...n.d.matchAll(/[a-zA-Z]/g)].some(m => !"MCLHVZ".includes(m[0]))) throw new Error(`Unsupported path command in ${n.index}`);
const out = path.join(project, "output/logo-splash/vector-source.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data));
execFileSync("/Users/sinjunho/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3", [
  path.join(project, "scripts/splash-vector-contours.py"), out,
  path.join(root, "src/components/graphics/splashLogoVector.json"),
  path.join(root, "ios/TasteBuddy/Resources/LogoSplash/SplashLogoVector.json"),
], { stdio: "inherit" });
