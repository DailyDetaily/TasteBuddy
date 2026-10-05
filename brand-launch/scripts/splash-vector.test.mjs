import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const load = async (file) => {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
};
const bytes = await readFile(new URL("../../src/components/graphics/splashLogoVector.json", import.meta.url));
const vector = JSON.parse(bytes);
const { logoGridElements } = await load("../src/LogoGrid/geometry.ts");
const { splashPetalMatrix } = await load("../../src/components/graphics/splashLogoMotion.ts");

test("web and native use the exact six petals and ten wordmark Bezier paths", async () => {
  assert.equal(vector.symbol.leaves.length, 6);
  assert.equal(vector.glyphs.length, 10);
  for (const node of [...vector.symbol.leaves, ...vector.glyphs])
    assert.equal(node.d, logoGridElements[node.index].props.d);
  for (const glyph of vector.glyphs) {
    assert.equal(glyph.masks.length, 49);
    assert.equal(glyph.masks[0], "");
    assert.equal(glyph.masks[48], "");
    assert.ok(glyph.masks[24].startsWith("M"));
  }
  assert.deepEqual(bytes, await readFile(new URL("../../ios/TasteBuddy/Resources/LogoSplash/SplashLogoVector.json", import.meta.url)));
});

test("direct vector projection matches the original nested CSS 3D transforms", () => {
  const d = vector.symbol.perspective;
  for (const leaf of vector.symbol.leaves) for (const fold of [0, 0.2, Math.PI / 4, Math.PI / 2]) {
    const a = leaf.angle * Math.PI / 180, m = splashPetalMatrix(leaf.angle, fold, d);
    for (const [x, y] of [[0, -92], [-18, -73], [18, -73], [2, -7]]) {
      // Reference: rotateZ(-angle), rotateX(fold), perspective, rotateZ(angle).
      const u = Math.cos(a) * x + Math.sin(a) * y;
      const v = -Math.sin(a) * x + Math.cos(a) * y;
      const depth = 1 - v * Math.sin(fold) / d;
      const expected = [
        (Math.cos(a) * u - Math.sin(a) * v * Math.cos(fold)) / depth,
        (Math.sin(a) * u + Math.cos(a) * v * Math.cos(fold)) / depth,
      ];
      const w = m[3] * x + m[7] * y + m[15];
      const actual = [(m[0] * x + m[4] * y + m[12]) / w, (m[1] * x + m[5] * y + m[13]) / w];
      assert.ok(actual.every((value, i) => Math.abs(value - expected[i]) < 1e-9));
    }
  }
});
