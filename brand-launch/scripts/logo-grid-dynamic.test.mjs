import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Run the actual frame functions, without a browser or duplicated easing math.
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
const url = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const cache = new Map();
const loadTs = async (file) => {
  if (cache.has(file.href)) return cache.get(file.href);
  let source = compile(await readFile(file, "utf8"));
  for (const match of [...source.matchAll(/from "(\.[^"]+)"/g)]) {
    const dependency = await loadTs(new URL(`${match[1]}.ts`, file));
    source = source.replace(match[0], `from ${JSON.stringify(dependency)}`);
  }
  const compiled = url(source);
  cache.set(file.href, compiled);
  return compiled;
};
const motion = await import(
  await loadTs(new URL("../src/LogoGrid/dynamicMotion.ts", import.meta.url))
);
const shorts = await import(
  await loadTs(new URL("../src/LogoGrid/shortsOpening.ts", import.meta.url))
);
const circleGuides = await import(
  await loadTs(new URL("../src/LogoGrid/circleGuideMotion.ts", import.meta.url))
);
const blackMotion = await import(
  await loadTs(new URL("../src/LogoGrid/blackMotion.ts", import.meta.url))
);
const { interpolate, Easing } = await import("remotion");

test("eight chapters cover all 300 frames without gaps or overlap", () => {
  let end = 0;
  for (const chapter of motion.dynamicChapters) {
    assert.equal(chapter.from, end);
    assert.ok(chapter.duration > 0);
    end += chapter.duration;
  }
  assert.equal(motion.dynamicChapters.length, 8);
  assert.equal(end, 300);
});

test("circle chain starts at central 12 and proceeds upward with decelerating growth", () => {
  assert.deepEqual(
    motion.introCircles.map((c) => c.diameter),
    [12, 6, 14, 28, 38],
  );
  for (const [index, circle] of motion.introCircles.entries()) {
    if (index) {
      assert.ok(circle.start > motion.introCircles[index - 1].start);
      assert.ok(circle.bottom < motion.introCircles[index - 1].bottom);
    }
    const samples = Array.from({ length: 15 }, (_, frame) =>
      motion.circleEaseOut(circle.start + frame, circle.start),
    );
    assert.equal(samples[0], 0);
    assert.equal(samples[14], 1);
    const speeds = samples.slice(1).map((value, i) => value - samples[i]);
    assert.ok(speeds.every((speed) => speed > 0));
    assert.ok(speeds.slice(1).every((speed, i) => speed < speeds[i]));
    assert.deepEqual(
      samples,
      Array.from({ length: 15 }, (_, frame) =>
        circleGuides.getClassicCircleScale(circle.start + frame, circle.start),
      ),
      "Classic and Dynamic must share the same entry curve",
    );
  }
  assert.ok(circleGuides.classicStackCircles.at(-1).start >= 32 + 14);
});

test("circle growth and shrink keep each source bottom point fixed", async () => {
  const { logoGridElements } = await import(
    await loadTs(new URL("../src/LogoGrid/geometry.ts", import.meta.url))
  );
  for (const circle of circleGuides.classicStackCircles) {
    const node = logoGridElements[circle.circleIndex];
    const x = node.center[0];
    const bottom = node.center[1] + (circle.diameter - 0.5) / 2;
    assert.equal(circle.bottom, bottom, "Anchor must lie on the source circle");
    for (const frame of [
      circle.start,
      circle.start + 7,
      circle.start + 14,
      264,
      272,
    ]) {
      const scale = circleGuides.getClassicCircleScale(frame, circle.start);
      const transform = circleGuides.bottomAnchoredCircleTransform(
        circle.bottom,
        scale,
      );
      // Apply the emitted SVG operations right-to-left to the actual bottom.
      const operations = [
        ...transform.matchAll(/(translate|scale)\(([^)]+)\)/g),
      ].reverse();
      let point = [x, bottom];
      for (const [, operation, values] of operations) {
        const [a, b = a] = values.split(/\s+/).map(Number);
        point =
          operation === "translate"
            ? [point[0] + a, point[1] + b]
            : [point[0] * a, point[1] * b];
      }
      assert.deepEqual(point, [x, bottom]);
    }
    assert.equal(circleGuides.getClassicCircleScale(257, circle.start), 1);
    assert.ok(circleGuides.getClassicCircleScale(264, circle.start) < 1);
    assert.equal(circleGuides.getClassicCircleScale(272, circle.start), 0);
  }
});

test("black symbol opens at screen centre and settles left before its held pose", () => {
  const start = blackMotion.getBlackSymbolOffset(shorts.CLASSIC_OPEN_START);
  assert.equal(278 + 308 * 1.36 + start.x, 960);
  assert.equal(200 + 249 * 1.36 + start.y, 540);
  assert.deepEqual(
    blackMotion.getBlackSymbolOffset(blackMotion.BLACK_SYMBOL_MOVE_START),
    start,
  );
  let previousX = start.x;
  for (
    let frame = blackMotion.BLACK_SYMBOL_MOVE_START;
    frame <= blackMotion.BLACK_SYMBOL_MOVE_END;
    frame++
  ) {
    const { x, y } = blackMotion.getBlackSymbolOffset(frame);
    assert.ok(x <= previousX && x >= 0);
    assert.ok(y <= start.y && y >= 0);
    previousX = x;
  }
  for (let frame = shorts.CLASSIC_OPEN_END; frame < 300; frame++)
    assert.deepEqual(blackMotion.getBlackSymbolOffset(frame), { x: 0, y: 0 });
});

test("black wordmark fill accelerates towards completion within its existing window", async () => {
  const { getWordmarkEntryStart, WORDMARK_FILL_FRAMES } = await import(
    await loadTs(new URL("../src/LogoGrid/wordmarkMotion.ts", import.meta.url))
  );
  for (let index = 2; index <= 11; index++) {
    const start = getWordmarkEntryStart(index, "classic");
    const samples = Array.from(
      { length: WORDMARK_FILL_FRAMES + 1 },
      (_, offset) =>
        blackMotion.getBlackWordmarkFillProgress(start + offset, index),
    );
    assert.equal(blackMotion.getBlackWordmarkFillProgress(start - 1, index), 0);
    assert.equal(samples[0], 0);
    assert.equal(samples.at(-1), 1);
    const speeds = samples.slice(1).map((value, i) => value - samples[i]);
    assert.ok(speeds.every((speed) => speed > 0));
    assert.ok(speeds.slice(1).every((speed, i) => speed > speeds[i]));
    assert.equal(blackMotion.getBlackWordmarkFillProgress(120, index), 1);
  }
});

test("camera stays upright throughout the film and comes to a full stop", () => {
  for (let frame = 0; frame < 300; frame++)
    assert.equal(motion.getDynamicCamera(frame).roll, 0);
  assert.equal(motion.getDynamicCamera(0).y, 249);
  assert.deepEqual(motion.getDynamicCamera(225), motion.getDynamicCamera(299));
});

test("grid opening matches the actual Shorts X keyframes without scale, fade, or stagger", async () => {
  const source = await readFile(
    new URL("../src/PetalLogo/PetalLogo.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /rotationX=\{interpolate\(frame, \[0, 30\], \[90, 0\]/);
  const easing = source.match(
    /rotationX=\{interpolate\(frame, \[0, 30\], \[90, 0\],[\s\S]*?easing: Easing.bezier\(([^)]+)\)/,
  );
  assert.ok(easing, "The reference must expose its actual opening easing");
  assert.deepEqual(easing[1].split(",").map(Number), [1 / 3, 0, 2 / 3, 1]);
  assert.equal(motion.introVisibility(motion.BLOOM_START), 1);
  for (let offset = 0; offset <= 30; offset++) {
    const reference = interpolate(offset, [0, 30], [90, 0], {
      easing: Easing.bezier(1 / 3, 0, 2 / 3, 1),
    });
    const pose = motion.getPetalPose3D(motion.BLOOM_START + offset);
    assert.ok(Math.abs(pose.foldDegrees - reference) < 0.00001);
    assert.equal(pose.size, 1);
    assert.equal(pose.opacity, 1);
    assert.equal(pose.shade, 0);
    const classic = shorts.getClassicPetalStage(
      shorts.CLASSIC_OPEN_START + offset,
    );
    assert.deepEqual(shorts.getShortsOpeningPose(classic.openingFrame), pose);
  }
});

test("both endings replay the same 30-frame opening in exact reverse", () => {
  for (let offset = 0; offset <= 30; offset++) {
    const expected = shorts.getShortsOpeningPose(30 - offset);
    assert.deepEqual(
      motion.getPetalPose3D(motion.DYNAMIC_FOLD_START + offset),
      expected,
    );
    const classic = shorts.getClassicPetalStage(
      shorts.CLASSIC_FOLD_START + offset,
    );
    assert.deepEqual(
      shorts.getShortsOpeningPose(classic.openingFrame),
      expected,
    );
  }
  assert.equal(shorts.getClassicPetalStage(17).mode, "hidden");
  assert.equal(shorts.getClassicPetalStage(48).mode, "held");
  assert.equal(shorts.getClassicPetalStage(258).mode, "hidden");
  assert.equal(motion.getPetalPose3D(299).foldDegrees, 90);
});

test("early guides survive opening and central 12 stays until final guide exit", () => {
  for (
    let frame = shorts.CLASSIC_OPEN_START;
    frame < shorts.CLASSIC_OPEN_END;
    frame++
  ) {
    for (const index of [23, 24, 25, 35, 44, 45, 46, 47, 48, 49, 50, 80])
      assert.equal(shorts.isClassicStackGuideVisible(frame, index), true);
  }
  for (let frame = motion.BLOOM_START; frame <= motion.BLOOM_END; frame++) {
    for (const index of [24, 25, 35, 44, 45, 46, 47, 48, 49, 50])
      assert.equal(motion.introVisibility(frame, index), 1);
  }
  assert.equal(motion.introVisibility(motion.INTRO_GUIDE_HANDOFF_END, 25), 1);
  for (const index of [24, 44, 45, 46, 47, 48, 50])
    assert.equal(
      motion.introVisibility(motion.INTRO_GUIDE_HANDOFF_END, index),
      0,
    );
  for (const index of [35, 49]) {
    for (let frame = 1; frame < 272; frame++) {
      assert.equal(shorts.isClassicStackGuideVisible(frame, index), true);
      assert.ok(circleGuides.getClassicCircleScale(frame, 0) > 0);
    }
    for (let frame = 1; frame < 246; frame++) {
      assert.equal(motion.introVisibility(frame, index), 1);
      assert.ok(motion.guideExit(frame) > 0);
    }
  }
  assert.equal(circleGuides.getClassicCircleScale(272, 0), 0);
  assert.equal(motion.guideExit(246), 0);
  // Preserve the other guides' existing closing treatment.
  for (const index of [23, 24, 25, 44, 45, 46, 47, 48, 50, 80])
    assert.equal(
      shorts.isClassicStackGuideVisible(shorts.CLASSIC_FOLD_START, index),
      false,
    );
});

test("functional timeline groups cover every active SVG element exactly once", async () => {
  const geometry = await import(
    await loadTs(new URL("../src/LogoGrid/geometry.ts", import.meta.url))
  );
  const { getGridLayerWindow } = await import(
    await loadTs(new URL("../src/LogoGrid/layerTiming.ts", import.meta.url))
  );
  for (const variant of ["Classic", "Dynamic", "Black"]) {
    const source = await readFile(
      new URL(
        `../src/LogoGrid/${variant === "Black" ? "LogoBlack" : `${variant}Layers`}.tsx`,
        import.meta.url,
      ),
      "utf8",
    );
    const ast = ts.createSourceFile(
      `${variant}Layers.tsx`,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const layers = [];
    const visit = (node) => {
      if (
        ts.isJsxSelfClosingElement(node) &&
        ["GridLayer", "SerifGuideLayer"].includes(node.tagName.getText(ast))
      ) {
        const indices = node.attributes.properties.find(
          (p) =>
            ts.isJsxAttribute(p) && p.name.getText(ast) === "elementIndices",
        );
        assert.ok(
          indices &&
            ts.isJsxExpression(indices.initializer) &&
            ts.isArrayLiteralExpression(indices.initializer.expression),
        );
        for (const index of indices.initializer.expression.elements) {
          assert.ok(ts.isNumericLiteral(index));
          layers.push(Number(index.text));
          if (node.tagName.getText(ast) === "GridLayer") {
            const numberProp = (name) =>
              Number(
                node.attributes.properties
                  .find(
                    (p) => ts.isJsxAttribute(p) && p.name.getText(ast) === name,
                  )
                  .initializer.expression.getText(ast),
              );
            const from = numberProp("from");
            const end = from + numberProp("durationInFrames");
            const window = getGridLayerWindow(
              Number(index.text),
              variant === "Dynamic" ? "dynamic" : "classic",
            );
            assert.ok(
              from <= window.from && end >= window.end,
              `${variant} source ${index.text}: timeline must cover its complete visible window`,
            );
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    const expected = geometry.logoGridElements
      .filter((n) => variant !== "Black" || n.role.startsWith("logo."))
      // The two original serif diameter labels are intentionally omitted.
      .filter((n) => ![51, 73].includes(n.index))
      .filter((n) => variant === "Classic" || ![23, 80].includes(n.index))
      .map((n) => n.index);
    assert.equal(new Set(layers).size, layers.length);
    assert.deepEqual(
      [...layers].sort((a, b) => a - b),
      expected,
    );
    assert.ok(
      layers
        .slice(-6)
        .every((i) => geometry.logoGridElements[i].role === "logo.symbol"),
    );
  }
});

test("all six symbol layers remain below every non-symbol element", async () => {
  const { gridLayerZIndex } = await import(
    await loadTs(new URL("../src/LogoGrid/layerTiming.ts", import.meta.url))
  );
  const { logoGridElements } = await import(
    await loadTs(new URL("../src/LogoGrid/geometry.ts", import.meta.url))
  );
  const petals = logoGridElements.filter((n) => n.role === "logo.symbol");
  const others = logoGridElements.filter((n) => n.role !== "logo.symbol");
  assert.equal(petals.length, 6);
  assert.ok(
    Math.max(...petals.map((n) => gridLayerZIndex(n.index))) <
      Math.min(...others.map((n) => gridLayerZIndex(n.index))),
  );
  assert.ok(
    others
      .slice(1)
      .every(
        (n, i) => gridLayerZIndex(n.index) > gridLayerZIndex(others[i].index),
      ),
  );
});
