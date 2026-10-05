import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const forms = [
  "round-four",
  "round-six",
  "round-eight",
  "capsule-five",
  "capsule-seven",
  "diamond-four",
  "diamond-six",
  "serrated-five",
  "serrated-eight",
];
const destination = path.join(root, "public/plating/bloom-forms");
await fs.mkdir(destination, { recursive: true });
const provenance = [];
for (const id of forms) {
  const source = `brand-launch/public/brand/taste-bloom/${id}.svg`;
  const original = await fs.readFile(path.join(root, source), "utf8");
  // Preserve the source geometry and colors, removing only its background disk.
  const background = /<circle\b[^>]*\br="48\.5"[^>]*(?:\/>|><\/circle>)/;
  if (!background.test(original))
    throw new Error(`Expected background disk: ${source}`);
  await fs.writeFile(
    path.join(destination, `${id}.svg`),
    original.replace(background, ""),
  );
  provenance.push({
    id,
    source,
    sourceSha256: createHash("sha256").update(original).digest("hex"),
    derivation:
      "Removed background circle only for the decorative home strip; original preserved.",
  });
}
await fs.writeFile(
  path.join(destination, "provenance.json"),
  JSON.stringify(provenance, null, 2) + "\n",
);
console.log(`Synced ${forms.length} source-derived Bloom vectors.`);
