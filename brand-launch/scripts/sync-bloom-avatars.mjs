// Export the actual app component, retaining its SVG paths, layering and sizing.
// The small module loader lets the standalone Remotion project use its own React.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repo = path.resolve(project, "..");
const require = createRequire(import.meta.url);
const cache = new Map();
const sourcePath = path.join(
  repo,
  "src/components/system/PalateBloomAvatar.tsx",
);
const cssPath = path.join(repo, "src/styles/design-system.css");

function loadSource(file) {
  if (cache.has(file)) return cache.get(file);
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: file,
  });
  const module = { exports: {} };
  cache.set(file, module.exports);
  const localRequire = (specifier) => {
    if (specifier.endsWith(".css")) return {};
    // No conditional or conflicting utility classes are used by this SVG export.
    // Class merging has no effect on the geometry, and the wrapper is discarded.
    if (specifier === "../ui/utils")
      return { cn: (...values) => values.filter(Boolean).join(" ") };
    if (!specifier.startsWith(".")) return require(specifier);
    const base = path.resolve(path.dirname(file), specifier);
    const resolved = [base, `${base}.ts`, `${base}.tsx`].find(
      (candidate) =>
        fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    );
    if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${file}`);
    return loadSource(resolved);
  };
  new Function("require", "module", "exports", outputText)(
    localRequire,
    module,
    module.exports,
  );
  cache.set(file, module.exports);
  return module.exports;
}

const Avatar = loadSource(sourcePath).default;
const { bloomForms: bloomVariants } = loadSource(
  path.join(project, "src/TasteBloomAvatars/forms.ts"),
);
const baseForms = new Set(
  bloomVariants.map(
    ({ petalShape, stamenShape, pistilShape }) =>
      `${petalShape}/${stamenShape}/${pistilShape}`,
  ),
);
if (bloomVariants.length !== 36 || baseForms.size !== 36) {
  throw new Error(
    "The gallery must contain all 36 unique base forms exactly once",
  );
}
if (new Set(bloomVariants.map((variant) => variant.name)).size !== 36) {
  throw new Error("Each base form must have a unique gallery name");
}
const css = fs.readFileSync(cssPath, "utf8");
const output = path.join(project, "public/brand/taste-bloom");
fs.mkdirSync(output, { recursive: true });

// Split only the trusted, generated SVG element stream. Keep every source path,
// attribute and nested group intact so the fully opened frame matches the source.
function splitElements(fragment) {
  const elements = [];
  let depth = 0;
  let start = 0;
  for (const match of fragment.matchAll(/<\/?[\w:-]+\b[^>]*>/g)) {
    const tag = match[0];
    if (depth === 0) start = match.index;
    if (tag.startsWith("</")) depth--;
    else if (!tag.endsWith("/>")) depth++;
    if (depth < 0) throw new Error("Unexpected closing SVG tag");
    if (depth === 0)
      elements.push(fragment.slice(start, match.index + tag.length));
  }
  if (depth !== 0) throw new Error("Unclosed SVG element");
  return elements;
}

const animatedLayers = {};
const bloomTasteColors = {};

for (const variant of bloomVariants) {
  const markup = renderToStaticMarkup(
    React.createElement(Avatar, {
      ...variant,
      size: 300,
      showFrame: false,
      shapeSeed: variant.id,
    }),
  );
  let svg = markup.match(/<svg[\s\S]*?<\/svg>/)?.[0];
  if (!svg) throw new Error(`Missing SVG for ${variant.id}`);
  svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  svg = svg.replace(
    /color-mix\(in srgb, var\(--tb-taste-(\w+)-main\) 85%, white 15%\)/g,
    (_, taste) => {
      const hex = css.match(
        new RegExp(`--tb-taste-${taste}-main:\\s*#([a-fA-F0-9]{6})`),
      )?.[1];
      if (!hex) throw new Error(`Missing taste token: ${taste}`);
      const color =
        "#" +
        hex
          .match(/../g)
          .map((channel) =>
            Math.round(parseInt(channel, 16) * 0.85 + 255 * 0.15)
              .toString(16)
              .padStart(2, "0"),
          )
          .join("");
      bloomTasteColors[taste] = color;
      return color;
    },
  );
  if (svg.includes("var("))
    throw new Error(`Unresolved color in ${variant.id}`);
  fs.writeFileSync(path.join(output, `${variant.id}.svg`), svg + "\n");

  const content = svg.match(/<g clip-path="[^"]+">([\s\S]*)<\/g><\/svg>$/)?.[1];
  if (!content) throw new Error(`Missing clipped layers for ${variant.id}`);
  const layers = splitElements(content);
  if (layers.length !== 6)
    throw new Error(`Expected six source layers for ${variant.id}`);
  const petals = (group) =>
    splitElements(group.replace(/^<g>/, "").replace(/<\/g>$/, ""));
  const outerPetals = petals(layers[1]);
  const innerPetals = petals(layers[2]);
  if (
    [outerPetals, innerPetals].some(
      (items) => items.length !== variant.shapeCountOverride,
    )
  ) {
    throw new Error(`Petal count mismatch for ${variant.id}`);
  }
  animatedLayers[variant.id] = {
    background: layers[0],
    backgroundColor: layers[0].match(/fill="([^"]+)"/)[1],
    outerPetals,
    innerPetals,
    outerStamens: layers[3],
    innerStamens: layers[4],
    pistil: layers[5],
  };
}

fs.writeFileSync(
  path.join(project, "src/TasteBloomAvatars/generated.ts"),
  "// Generated by scripts/sync-bloom-avatars.mjs. Do not edit SVG geometry here.\n" +
    "export const bloomTasteColors = " +
    JSON.stringify(bloomTasteColors, null, 2) +
    " as const;\n" +
    "export type BloomSvgLayers = { background: string; backgroundColor: string; outerPetals: readonly string[]; innerPetals: readonly string[]; outerStamens: string; innerStamens: string; pistil: string };\n" +
    "export const bloomSvgLayers: Record<string, BloomSvgLayers> = " +
    JSON.stringify(animatedLayers, null, 2) +
    ";\n",
);

fs.writeFileSync(
  path.join(output, "manifest.json"),
  JSON.stringify(
    {
      source: path.relative(repo, sourcePath),
      sourceSha256: createHash("sha256")
        .update(fs.readFileSync(sourcePath))
        .digest("hex"),
      colorSource: path.relative(repo, cssPath),
      colorSha256: createHash("sha256").update(css).digest("hex"),
      variants: bloomVariants,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Exported ${bloomVariants.length} source-faithful Taste Bloom SVGs.`,
);
