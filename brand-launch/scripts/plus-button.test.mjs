import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/TabBarPlusButton/motion.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const motion = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const native = await readFile(
  new URL(
    "../../ios/TasteBuddy/Components/Shell/BottomTabCenterButton.swift",
    import.meta.url,
  ),
  "utf8",
);

test("the eight moving gradient blobs retain native geometry and paint order", () => {
  const pattern =
    /\.init\(color: \.(first|second), radiusX: ([\d.]+), radiusY: ([\d.]+), x: ([\d.]+), y: ([\d.]+), motionGroup: (\d), xSign: (-?\d), ySign: (-?\d)(, usesGlowHeight: true)?\)/g;
  const expected = [...native.matchAll(pattern)].map((m) => ({
    color: m[1] === "first" ? 0 : 1,
    radiusX: +m[2],
    radiusY: +m[3],
    x: +m[4],
    y: +m[5],
    group: +m[6],
    xSign: +m[7],
    ySign: +m[8],
    glow: Boolean(m[9]),
  }));
  assert.equal(expected.length, 8);
  assert.deepEqual(motion.blobSpecs, expected);
  assert.equal(
    motion.CYCLE_SECONDS,
    Number(
      native.match(/static let motionDuration: TimeInterval = ([\d.]+)/)[1],
    ),
  );
});

test("the first and last frame are identical at every Studio speed and palette offset", () => {
  for (const speed of [0.25, 1, 1.35, 3]) {
    const last = motion.buttonTiming(speed).durationInFrames - 1;
    for (let pair = 0; pair < 6; pair++) {
      assert.deepEqual(
        motion.beamState(0, 60, speed, pair),
        motion.beamState(last, 60, speed, pair),
      );
    }
  }
});

test("color and blob positions remain continuous across every pair boundary", () => {
  const { cycleFrames } = motion.buttonTiming(1);
  for (let index = 1; index <= 6; index++) {
    const before = motion.beamState(index * cycleFrames - 1e-6, 60, 1);
    const after = motion.beamState(index * cycleFrames + 1e-6, 60, 1);
    for (const name of ["first", "second"]) {
      before[name].forEach((v, i) =>
        assert.ok(Math.abs(v - after[name][i]) < 1e-6),
      );
    }
    const a = motion.blobGeometry(before.phase);
    const b = motion.blobGeometry(after.phase);
    a.forEach((blob, i) =>
      ["cx", "cy", "rx", "ry"].forEach((key) =>
        assert.ok(Math.abs(blob[key] - b[i][key]) < 1e-4),
      ),
    );
  }
});

test("seeking is deterministic and the still mode freezes both colors and geometry", () => {
  const first = motion.beamState(137, 60, 1);
  motion.beamState(900, 60, 1);
  assert.deepEqual(motion.beamState(137, 60, 1), first);
  assert.deepEqual(
    motion.beamState(999, 60, 1, 2, true),
    motion.beamState(0, 60, 1, 2, true),
  );
  assert.notDeepEqual(first, motion.beamState(300, 60, 1));
});
