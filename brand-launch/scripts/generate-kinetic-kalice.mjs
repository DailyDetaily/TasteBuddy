// Build-time only: the Studio loads the committed glyph paths and PNG fields.
// Uses the SAME terminal-led round-brush generator as Logo-Black.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/brand/kinetic-kalice");
const audit = path.join(root, "output/kinetic-statements/kalice-fill");
await fs.mkdir(output, { recursive: true });
await fs.mkdir(path.join(audit, "masks"), { recursive: true });
const python = process.env.WORDMARK_PYTHON ?? "python3";
const run = (script, args) => {
  const child = spawnSync(
    python,
    [path.join(root, "scripts", script), ...args],
    { stdio: "inherit" },
  );
  if (child.status !== 0) throw new Error(`${script} failed: ${child.status}`);
};
const json = path.join(audit, "font.json");
run("kinetic-kalice-glyphs.py", ["outlines", root, json]);
const font = JSON.parse(await fs.readFile(json, "utf8"));
const config = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");
for (const [char, glyph] of Object.entries(font.glyphs)) {
  if (!glyph.d) continue;
  const scale = 4;
  const filename = `${glyph.index}.png`;
  const { x, y, width, height, d } = glyph;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="${x} ${y} ${width} ${height}"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="black"/><path d="${d}" fill="white"/></svg>`;
  const mask = path.join(audit, "masks", filename);
  await sharp(Buffer.from(svg)).greyscale().png().toFile(mask);
  config.push({
    char,
    ...glyph,
    scale,
    mask,
    sourceHash: hash(d),
    destination: path.join(output, filename),
    src: `brand/kinetic-kalice/${filename}`,
  });
}
const configPath = path.join(audit, "propagation-config.json");
await fs.writeFile(configPath, JSON.stringify(config));
run("kinetic-kalice-glyphs.py", ["terminals", configPath, configPath]);
run("wordmark-distance-field.py", [configPath]);
const fields = JSON.parse(
  await fs.readFile(path.join(audit, "propagation-result.json"), "utf8"),
);
for (const item of fields) {
  const {
    src,
    x,
    y,
    width,
    height,
    maxDistance,
    terminalCount,
    sourceHash,
    seedHash,
  } = item;
  font.glyphs[item.char].map = {
    src,
    x,
    y,
    width,
    height,
    maxDistance,
    terminalCount,
    sourceHash,
    seedHash,
    fieldHash: hash(await fs.readFile(item.destination)),
  };
}
const generated = `// Generated from the local Kalice OTF by scripts/generate-kinetic-kalice.mjs.\nimport type { WordmarkFillMap } from '../LogoGrid/wordmarkFillMaps';\nexport type KaliceGlyph = { index: number; name: string; d: string; advance: number; x: number; y: number; width: number; height: number; map?: WordmarkFillMap };\nexport const kaliceFontHash = ${JSON.stringify(font.fontHash)};\nexport const kaliceGlyphs: Record<string, KaliceGlyph> = ${JSON.stringify(font.glyphs, null, 2)};\nexport const kaliceKerning: Record<string, number> = ${JSON.stringify(font.kerning)};\n`;
await fs.writeFile(
  path.join(root, "src/KineticStatements/kalice.generated.ts"),
  generated,
);
console.log(
  `Generated ${fields.length} Kalice round-brush fields, ${Object.keys(font.kerning).length} kerning pairs`,
);
