import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const dir = await mkdtemp(path.join(os.tmpdir(), "sauce-camera-test-"));
after(() => rm(dir, { recursive: true, force: true }));
await build({
  stdin: {
    contents: `export * from './src/SauceSplatter/camera';
      export * from './src/SauceSplatter/motion';
      export {chipRowDuration} from './src/DiningFeedbackMotion/chip-motion';`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  outfile: path.join(dir, "camera.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
});
const { createSauceCameraTrack, sauceCameraOffset, chipRowDuration, sauceSplatterTiming } = createRequire(
  import.meta.url,
)(path.join(dir, "camera.cjs"));
const rows = [
  [77, 67, 92, 81, 67],
  [67, 67, 92, 77, 67],
  [81, 56, 67, 102, 77],
  [67, 67, 81, 112, 81],
  [81, 77, 102, 102],
];
const options = {
  rows,
  scale: 936 / 212,
  viewportWidth: 1080,
  padding: 80,
  gap: 8,
};
const track = createSauceCameraTrack(options);

test("camera holds the left margin until the third row's leading chip has appeared", () => {
  assert.equal(sauceCameraOffset(-1, track), 0);
  assert.equal(sauceCameraOffset(0.35, track), 0);
  assert.equal(options.padding - sauceCameraOffset(0.35, track), 80);
  for (let frame = 0; frame / 60 <= track.startSeconds; frame++) {
    assert.equal(sauceCameraOffset(frame / 60, track), 0);
  }
  assert.ok(track.startSeconds > 1.3 && track.startSeconds < 1.8);
});

test("camera advances smoothly without following the chip spring backwards", () => {
  let previous = 0;
  let maxStep = 0;
  let previousStep = 0;
  let maxStepChange = 0;
  for (let frame = 0; frame <= 600; frame++) {
    const offset = sauceCameraOffset(frame / 60, track);
    assert.ok(Number.isFinite(offset));
    assert.ok(offset >= previous - 1e-8);
    assert.ok(offset <= track.endX);
    const step = offset - previous;
    maxStep = Math.max(maxStep, step);
    maxStepChange = Math.max(maxStepChange, Math.abs(step - previousStep));
    previousStep = step;
    previous = offset;
  }
  assert.ok(maxStep < 18, `camera jumped ${maxStep}px in a frame`);
  assert.ok(maxStepChange < 0.6, `camera speed changed by ${maxStepChange}px/frame`);
  assert.ok(sauceCameraOffset(2.1, track) > 0);
});

test("the final widest row ends at the right margin and the camera holds", () => {
  const worldWidth = Math.max(
    ...rows.map(
      (row) =>
        row.reduce((sum, width) => sum + width, 0) +
        (row.length - 1) * options.gap,
    ),
  );
  const screenRight =
    options.padding + worldWidth * options.scale -
    sauceCameraOffset(track.endSeconds, track);
  assert.ok(
    Math.abs(screenRight - (options.viewportWidth - options.padding)) < 1e-8,
  );
  assert.equal(sauceCameraOffset(track.endSeconds + 10, track), track.endX);
  assert.ok(
    track.endX - sauceCameraOffset(track.endSeconds - 1 / 60, track) < 2,
  );
});

test("short rows that fit the viewport never pan", () => {
  const short = createSauceCameraTrack({
    ...options,
    rows: [[70, 80]],
    scale: 2,
  });
  assert.equal(short.endX, 0);
  for (let frame = 0; frame <= 600; frame++)
    assert.equal(sauceCameraOffset(frame / 60, short), 0);
});

test("camera arrives before the last chip finishes and remains still through the hold", () => {
  const timing = sauceSplatterTiming({
    칩: rows.flat().map(() => ({ 문구: "칩" })),
    "줄 수": 5,
    "시작 대기": 0.4,
    "유지 시간": 1.5,
    속도: 1,
  });
  const chipEnd = Math.max(...rows.map((row, i) => i * 0.65 + chipRowDuration(row.length)));
  assert.ok(Math.abs(chipEnd - track.endSeconds - 0.35) < 1e-8);
  assert.equal(timing.cameraEndSeconds, track.endSeconds);
  assert.equal(timing.durationInFrames, 395);
  for (const t of [track.endSeconds, chipEnd, chipEnd + 1.5])
    assert.equal(sauceCameraOffset(t, track), track.endX);
});

test("the pan has one acceleration and one deceleration, without a late second move", () => {
  // A much wider late row used to make the camera pause and then catch up.
  for (const widths of [rows, [...rows.slice(0, 4), [200, 180, 190, 200]]]) {
    const pan = createSauceCameraTrack({ ...options, rows: widths });
    const steps = 200;
    const positions = Array.from({ length: steps + 1 }, (_, i) =>
      sauceCameraOffset(
        pan.startSeconds + (pan.endSeconds - pan.startSeconds) * i / steps,
        pan,
      ),
    );
    const velocities = positions.slice(1).map((x, i) => x - positions[i]);
    assert.ok(velocities.every((v) => v > 0));
    for (let i = 1; i < velocities.length; i++) {
      if (i < steps / 2) assert.ok(velocities[i] >= velocities[i - 1] - 1e-8);
      else assert.ok(velocities[i] <= velocities[i - 1] + 1e-8);
    }
    assert.equal(sauceCameraOffset(pan.endSeconds + 0.01, pan), pan.endX);
    assert.equal(sauceCameraOffset(pan.endSeconds + 1, pan), pan.endX);
  }
});

test("seeking in any order produces the same camera position", () => {
  const times = [4.1, 0.2, 2.3, 1.6, 5.4, -1, 3.2];
  const other = createSauceCameraTrack(options);
  for (const time of times)
    assert.equal(
      sauceCameraOffset(time, track),
      sauceCameraOffset(time, other),
    );
});
