import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const code = ts.transpileModule(
  await fs.readFile("src/DiningFeedbackMotion/chip-motion.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.ES2022 } },
).outputText;
const { chipStart, chipPeak, chipRowDuration, chipRowPoses, chipBridge } =
  await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
const widths = [86.4, 82.2, 57.6];
const height = 19.93359375;

test("each circle starts inside its parent before the parent overshoots", () => {
  for (let index = 1; index < widths.length; index++) {
    const at = chipStart(index);
    const poses = chipRowPoses(at, widths, height);
    const parent = poses[index - 1],
      child = poses[index];
    assert.ok(at < chipPeak(index - 1));
    assert.ok(parent.width < widths[index - 1]);
    assert.equal(child.width, child.height);
    assert.ok(child.x + child.width <= parent.x + parent.width + 1e-8);
  }
});
test("overshoot widens and squashes the body, then restores native dimensions", () => {
  for (let index = 0; index < widths.length; index++) {
    const pose = chipRowPoses(chipPeak(index), widths, height)[index];
    assert.ok(pose.width > widths[index]);
    assert.ok(pose.height < height * 0.9);
  }
  const settled = chipRowPoses(chipRowDuration(widths.length), widths, height);
  let left = 0;
  settled.forEach((pose, i) => {
    assert.equal(pose.x, left);
    assert.equal(pose.width, widths[i]);
    assert.equal(pose.height, height);
    assert.equal(pose.textOpacity, 1);
    left += widths[i] + 6;
  });
});
test("the connecting neck exists during budding and disappears before expansion", () => {
  const connected = chipRowPoses(chipStart(1) + 0.17, widths, height);
  assert.ok(chipBridge(connected[0], connected[1], height).startsWith("M"));
  const detached = chipRowPoses(chipStart(1) + 0.23, widths, height);
  assert.equal(chipBridge(detached[0], detached[1], height), "");
});
test("short and long labels remain finite when seeking in any order", () => {
  for (const row of [[28, 120], [150, 30, 65], widths]) {
    for (let frame = -12; frame <= 150; frame++) {
      const poses = chipRowPoses(frame / 60, row, height);
      for (const pose of poses) {
        for (const value of [pose.x, pose.width, pose.height, pose.textOpacity])
          assert.ok(Number.isFinite(value));
        assert.ok(pose.width > 0 && pose.height > 0);
      }
      for (let i = 1; i < poses.length; i++)
        assert.ok(
          !/NaN|Infinity/.test(chipBridge(poses[i - 1], poses[i], height)),
        );
    }
  }
});
