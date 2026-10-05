import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
const root = process.cwd();
const result = await build({
  stdin: {
    contents:
      "export {components, docs, references} from './src/plating/catalog'; export {TASTE_IDS,TASTE_TOKENS,SPACING_TOKENS,RADIUS_TOKENS,COLOR_TOKENS} from './src/constants/designTokens';",
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const data = await import(
  "data:text/javascript;base64," +
    Buffer.from(result.outputFiles[0].text).toString("base64")
);
const sourceOverrides = {
  toast: "ios/TasteBuddy/Components/DesignSystemFullComponents.swift",
};
const registry = {
  components: [],
  docs: data.docs,
  references: data.references,
  tastes: data.TASTE_IDS.map((id) => ({
    id,
    ...data.TASTE_TOKENS[id].palette,
    label: data.TASTE_TOKENS[id].label,
  })),
  spacing: data.SPACING_TOKENS,
  radius: data.RADIUS_TOKENS,
  colors: data.COLOR_TOKENS,
};
for (const item of data.components) {
  const c = {
    ...item,
    source: path.normalize(item.source),
    native: path.normalize(sourceOverrides[item.id] ?? item.native),
  };
  await fs.access(path.join(root, c.source));
  await fs.access(path.join(root, c.native));
  registry.components.push(c);
}
await fs.mkdir("output/plating", { recursive: true });
await fs.writeFile(
  "output/plating/registry.json",
  JSON.stringify(registry, null, 2) + "\n",
);
console.log(
  `${registry.components.length} component families; ${registry.docs.length} documents; all source paths exist.`,
);
