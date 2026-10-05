import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const cache = new Map();
const compile = async (file) => {
  if (cache.has(file.href)) return cache.get(file.href);
  let source = ts.transpileModule(await readFile(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  for (const match of [...source.matchAll(/from "(\.[^"]+)"/g)])
    source = source.replace(
      match[0],
      `from ${JSON.stringify(await compile(new URL(`${match[1]}.ts`, file)))}`,
    );
  const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  cache.set(file.href, url);
  return url;
};
const load = async (name) =>
  import(await compile(new URL(`../src/LogoGrid/${name}.ts`, import.meta.url)));
const { logoGridElements } = await load("geometry");
const { wordmarkFillMaps } = await load("wordmarkFillMaps");
const { wordmarkTerminals } = await load("wordmarkTerminals");
const {
  serifGuides,
  getSerifGuideStart,
  getSerifGuideOpacity,
  getSerifGuideLabel,
  serifGuideLabelIds,
} = await load("serifGuides");
const { getWordmarkEntryStart, getWordmarkFillProgress, WORDMARK_FILL_FRAMES } =
  await load("wordmarkMotion");
const letters = logoGridElements.filter(
  (node) => node.role === "logo.wordmark",
);
const hash = (value) => createHash("sha256").update(value).digest("hex");

test("every glyph uses a field generated from its current exact path and terminal positions", () => {
  assert.deepEqual(
    Object.keys(wordmarkFillMaps).map(Number),
    letters.map((n) => n.index),
  );
  assert.equal(
    Object.values(wordmarkFillMaps).reduce(
      (sum, m) => sum + m.terminalCount,
      0,
    ),
    28,
  );
  for (const node of letters) {
    const map = wordmarkFillMaps[node.index];
    assert.equal(
      map.sourceHash,
      hash(node.props.d),
      `${node.name}: regenerate after geometry changes`,
    );
    assert.equal(
      map.seedHash,
      hash(JSON.stringify(wordmarkTerminals[node.index])),
    );
    assert.equal(map.terminalCount, wordmarkTerminals[node.index].length);
  }
});

test("T and t have distinct portable assets, each at eight samples per SVG unit", async () => {
  const files = Object.values(wordmarkFillMaps).map((m) => m.src.toLowerCase());
  assert.equal(new Set(files).size, 10);
  for (const map of Object.values(wordmarkFillMaps)) {
    const png = await readFile(
      new URL(`../public/${map.src}`, import.meta.url),
    );
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), map.width * 8);
    assert.equal(png.readUInt32BE(20), map.height * 8);
    assert.equal(
      map.fieldHash,
      hash(png),
      "Studio reloads revised brush fields",
    );
    assert.equal(
      png[25],
      0,
      "field is grayscale, not a replacement logo image",
    );
  }
});

test("both versions fill monotonically from zero to one within the entry, retaining the held logo", () => {
  for (const variant of ["classic", "dynamic"]) {
    for (const node of letters) {
      const start = getWordmarkEntryStart(node.index, variant);
      assert.equal(getWordmarkFillProgress(start, node.index, variant), 0);
      assert.equal(
        getWordmarkFillProgress(
          start + WORDMARK_FILL_FRAMES,
          node.index,
          variant,
        ),
        1,
      );
      const samples = Array.from({ length: WORDMARK_FILL_FRAMES + 1 }, (_, i) =>
        getWordmarkFillProgress(start + i, node.index, variant),
      );
      assert.ok(samples.slice(1).every((value, i) => value > samples[i]));
      assert.equal(
        getWordmarkFillProgress(
          variant === "classic" ? 90 : 183,
          node.index,
          variant,
        ),
        1,
      );
    }
  }
});

test("each rounded terminal has one fitted circle, reusing the four source guides", () => {
  const expected = Object.entries(wordmarkTerminals).flatMap(
    ([glyph, points]) => points.map((_, index) => `${glyph}-${index}`),
  );
  assert.deepEqual(serifGuides.map((g) => g.id).sort(), expected.sort());
  assert.equal(new Set(serifGuides.map((g) => g.id)).size, 28);
  for (const guide of serifGuides) {
    const [x, y] = wordmarkTerminals[guide.glyphIndex][guide.terminalIndex];
    assert.ok(Math.hypot(x - guide.cx, y - guide.cy) < guide.r);
    if (guide.sourceCircleIndex !== undefined) {
      const original = logoGridElements[guide.sourceCircleIndex];
      assert.deepEqual(
        [guide.cx, guide.cy, guide.r],
        [original.props.cx, original.props.cy, original.props.r].map(Number),
      );
    }
  }
  assert.deepEqual(
    serifGuides.flatMap((g) => g.sourceCircleIndex ?? []).sort((a, b) => a - b),
    [1, 52, 53, 54],
  );
});

test("all 28 serif guides share their glyph fill timing and preserve guide exit", () => {
  for (const variant of ["classic", "dynamic"]) {
    for (const guide of serifGuides) {
      const start = getWordmarkEntryStart(guide.glyphIndex, variant);
      assert.equal(getSerifGuideStart(guide, variant), start);
      for (let frame = 0; frame <= start + WORDMARK_FILL_FRAMES; frame++) {
        assert.equal(
          getSerifGuideOpacity(frame, guide, variant),
          getWordmarkFillProgress(frame, guide.glyphIndex, variant),
        );
      }
      assert.equal(getSerifGuideOpacity(start, guide, variant), 0);
      assert.ok(getSerifGuideOpacity(start + 1, guide, variant) > 0);
      assert.equal(
        getSerifGuideOpacity(start + WORDMARK_FILL_FRAMES, guide, variant),
        1,
      );
      assert.equal(
        getSerifGuideOpacity(variant === "classic" ? 272 : 246, guide, variant),
        0,
      );
    }
  }
});

test("each size is labeled once on its leftmost circle across both words", () => {
  const labeled = serifGuides.filter((guide) =>
    serifGuideLabelIds.has(guide.id),
  );
  assert.equal(labeled.length, 6);
  assert.deepEqual(
    labeled.map((g) => getSerifGuideLabel(g.r).diameter).sort((a, b) => a - b),
    [5, 6, 7, 8, 11, 12],
  );
  for (const guide of labeled) {
    const size = getSerifGuideLabel(guide.r).diameter;
    const peers = serifGuides.filter(
      (g) => getSerifGuideLabel(g.r).diameter === size,
    );
    assert.equal(guide.cx, Math.min(...peers.map((g) => g.cx)));
    assert.equal(peers.filter((g) => serifGuideLabelIds.has(g.id)).length, 1);
    assert.ok(getSerifGuideLabel(guide.r).fontSize < guide.r * 2);
  }
  assert.equal(getSerifGuideLabel(2.75).text, "6");
});
