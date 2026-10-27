import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "tb-bar-motion-"));
const outfile = path.join(dir, "motion.mjs");
await build({
  stdin: {
    contents: `export * from './brand-launch/src/GraphMotion/motion'; export * from './src/components/system/plating/miniChartGeometry';`,
    resolveDir: root,
  },
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  logLevel: "silent",
});
const { barPose, barTiming, miniChartGeometry } = await import(outfile);
after(() => rm(dir, { recursive: true, force: true }));
const base = {
  색상: "감칠맛",
  재생: "진입·유지·퇴장",
  "시작 대기": 0.3,
  "진입 시간": 0.8,
  "막대 간 지연": 0.08,
  "유지 시간": 1.6,
  "끝 여백": 0.5,
  "확대 배율": 6,
  "배경 색": "#FFFFFF",
  데이터: [],
};
const propsFor = (values, overrides = {}) => ({
  ...base,
  ...overrides,
  데이터: values.map((값, i) => ({ 항목: `${i + 1}일`, 값 })),
});
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("settled and static motion match the product geometry at weekly, half-month and monthly densities", () => {
  for (const count of [1, 7, 15, 28, 29, 30, 31]) {
    const values = Array.from(
      { length: count },
      (_, i) => [0, 1, null, 3, 5, 2, 7][i % 7],
    );
    const targets = miniChartGeometry(values);
    for (const 재생 of ["정지", "진입 후 유지", "진입·유지·퇴장"]) {
      const props = propsFor(values, { 재생 });
      for (const fps of [30, 60]) {
        const frame = 재생 === "정지" ? 0 : barTiming(props, fps).settle;
        targets.forEach((target, i) => {
          const pose = barPose(frame, i, props, fps);
          for (const key of ["x", "y", "width", "height"])
            close(pose[key], target[key]);
          assert.equal(pose.endpoint, target.endpoint);
          assert.equal(pose.opacity, target.height > 0 ? 1 : 0);
        });
      }
    }
  }
});

test("every frame keeps the baseline and round caps; zero, one and missing retain their meanings", () => {
  const props = propsFor([0, 1, null, 3, 5, 2, 7]);
  const timing = barTiming(props);
  assert.equal(timing.durationInFrames, 300);
  const targets = miniChartGeometry(props.데이터.map((p) => p.값));
  for (let frame = 0; frame < timing.durationInFrames; frame++) {
    targets.forEach((target, i) => {
      const pose = barPose(frame, i, props);
      close(pose.y + pose.height, 56);
      assert.ok(pose.height >= 0 && pose.height <= target.height + 1e-8);
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      if (i === 0) {
        close(pose.height, pose.width / 2);
        assert.equal(pose.endpoint, false);
      }
      if (i === 1) close(pose.height, pose.width);
      if (i === 2) {
        assert.equal(pose.height, 0);
        assert.equal(pose.opacity, 0);
      }
      if (i > 2) {
        assert.ok(pose.height >= pose.width);
        close(pose.radius, pose.width / 2);
      }
      if (frame === 0 || frame === timing.durationInFrames - 1)
        assert.equal(pose.opacity, 0);
    });
  }
});

test("exit reverses entrance exactly, starts at the right, and holds values without drift", () => {
  const props = propsFor([2, 4, 7]);
  const timing = barTiming(props);
  for (let frame = timing.start; frame <= timing.settle; frame++) {
    for (let i = 0; i < 3; i++) {
      const entering = barPose(frame, i, props);
      const leaving = barPose(timing.start + timing.end - frame, i, props);
      close(entering.height, leaving.height);
      close(entering.opacity, leaving.opacity);
    }
  }
  assert.equal(barPose(timing.exit + 1, 0, props).progress, 1);
  assert.ok(barPose(timing.exit + 1, 2, props).progress < 1);
  for (const frame of [timing.settle, timing.settle + 5, timing.exit]) {
    for (let i = 0; i < 3; i++)
      assert.equal(barPose(frame, i, props).progress, 1);
  }
  const hold = { ...props, 재생: "진입 후 유지" };
  assert.equal(barPose(10000, 2, hold).progress, 1);
});

test("empty, missing and all-zero input never invent a positive endpoint", () => {
  for (const values of [[], [null], [0], [0, 0, 0], [null, null], [5, null]]) {
    const props = propsFor(values);
    const timing = barTiming(props);
    assert.ok(
      Number.isFinite(timing.durationInFrames) && timing.durationInFrames > 0,
    );
    values.forEach((_, i) =>
      assert.equal(barPose(timing.settle, i, props).endpoint, false),
    );
  }
});
