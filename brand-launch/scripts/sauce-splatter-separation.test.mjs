import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const dir = await mkdtemp(path.join(os.tmpdir(), "sauce-separation-"));
after(() => rm(dir, { recursive: true, force: true }));
await build({
  stdin: {
    contents: `export * from './src/DiningFeedbackMotion/chip-motion';
      export {SAUCE_SPLASH_SEPARATION} from './src/SauceSplatter/motion';`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  outfile: path.join(dir, "current.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
});
await build({
  stdin: {
    contents: execFileSync("git", ["show", "HEAD:brand-launch/src/DiningFeedbackMotion/chip-motion.ts"], { encoding: "utf8" }),
    loader: "ts",
  },
  outfile: path.join(dir, "original.cjs"),
  platform: "node",
  format: "cjs",
});
const require = createRequire(import.meta.url);
const current = require(path.join(dir, "current.cjs"));
const original = require(path.join(dir, "original.cjs"));
const profile = current.SAUCE_SPLASH_SEPARATION;
const widths = [77, 67, 92, 81, 67];

test("other callers retain the original poses and connecting shapes", () => {
  for (let frame = -1; frame <= 240; frame++) {
    const time = frame / 120;
    const next = current.chipRowPoses(time, widths, 36, 8);
    const old = original.chipRowPoses(time, widths, 36, 8);
    assert.deepEqual(next, old);
    for (let i = 1; i < next.length; i++)
      assert.equal(current.chipBridge(next[i - 1], next[i], 36), original.chipBridge(old[i - 1], old[i], 36));
  }
});

test("splash pulls the emerging circle out sooner without changing growth or settling", () => {
  let sawFasterTravel = false;
  for (let frame = 0; frame <= 240; frame++) {
    const time = frame / 60;
    const next = current.chipRowPoses(time, widths, 36, 8, profile);
    const old = original.chipRowPoses(time, widths, 36, 8);
    next.forEach((pose, i) => {
      for (const key of ["width", "height", "textOpacity", "visible", "age"])
        assert.equal(pose[key], old[i][key]);
      if (pose.age >= 0.22 || i === 0) assert.equal(pose.x, old[i].x);
      if (i > 0 && pose.age > 0.05 && pose.age < 0.12 && pose.x > old[i].x)
        sawFasterTravel = true;
    });
  }
  assert.ok(sawFasterTravel);
  assert.equal(current.chipRowDuration(5), original.chipRowDuration(5));
});

test("the neck stays connected while stretching, then breaks cleanly in the short release", () => {
  const parent = { x: 0, width: 77, height: 36, age: 1, visible: true, textOpacity: 1 };
  const child = { x: 85, width: 36, height: 36, age: 0.15, visible: true, textOpacity: 0 };
  const shape = (age, style) => current.chipBridge(parent, { ...child, age }, 36, style);
  assert.equal(shape(0.12, profile), shape(0.16, profile));
  assert.notEqual(shape(0.16, profile), shape(0.20, profile));
  assert.notEqual(shape(0.21, profile), "");
  assert.equal(shape(0.216, profile), "");
  assert.notEqual(shape(0.216), "");
});
