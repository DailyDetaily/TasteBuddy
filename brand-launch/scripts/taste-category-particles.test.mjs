import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "src/TasteDataCategoryMotion");
const modules = new Map();
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const requireLocal = (specifier) => {
    if (!specifier.startsWith(".")) return createRequire(file)(specifier);
    const base = path.resolve(path.dirname(file), specifier);
    const dependency = [base, base + ".ts", base + ".tsx", base + ".js"].find(
      (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
    );
    assert.ok(dependency, specifier);
    return load(dependency);
  };
  new Function("require", "module", "exports", code)(
    requireLocal,
    module,
    module.exports,
  );
  return module.exports;
}
const { fixture } = load(path.join(directory, "fixtures.ts"));
const { categoryFrame } = load(path.join(directory, "geometry.ts"));
const {
  makeParticlePlan,
  sampleParticlePlan,
  particleTransitionAt,
  resolvedParticleDot,
  CATEGORY_TRANSITION_FRAMES,
  particleMotionEase,
} = load(path.join(directory, "particle-morph.ts"));
const categories = [
  "experienceCluster",
  "sensoryRays",
  "preferenceFocus",
  "contextLayers",
  "changeRipples",
];
const options = { playback: "idle", alignment: 0, rotation: 0, page: 0 };
const radius = (p) => Math.hypot(p.x - 320, p.y - 320);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const signature = (dots) =>
  dots
    .filter((p) => p.opacity > 1e-8)
    .map((p) => JSON.stringify([p.x, p.y, p.r, p.color, p.opacity]))
    .sort();
const pairs = categories.slice(0, -1).map((from, i) => {
  const to = categories[i + 1];
  const source = categoryFrame(
    fixture(from),
    i === 0 ? 227 / 30 - 6.4 : 65 / 30,
    options,
  );
  const target = categoryFrame(fixture(to), 0, options);
  const seed = `${from}:${to}`;
  const plan = makeParticlePlan(source, target, seed);
  const samples = Array.from({ length: 93 }, (_, i) =>
    sampleParticlePlan(plan, i / 92),
  );
  return { from, to, source, target, seed, plan, samples };
});

for (const { from, to, source, target, seed, plan, samples } of pairs) {
  const label = `${from} -> ${to}`;
  test(label + ": exact endpoints and unique real particle assignment", () => {
    assert.equal(
      plan.tracks.length,
      Math.max(source.dots.length, target.dots.length),
    );
    assert.equal(
      plan.tracks.filter((t) => t.kind === "matched").length,
      Math.min(source.dots.length, target.dots.length),
    );
    assert.equal(
      new Set(plan.tracks.map((t) => t.id)).size,
      plan.tracks.length,
    );
    assert.equal(
      new Set(
        plan.tracks
          .filter((t) => t.kind !== "appearing")
          .map((t) => t.source.id),
      ).size,
      source.dots.length,
    );
    assert.equal(
      new Set(
        plan.tracks
          .filter((t) => t.kind !== "retiring")
          .map((t) => t.target.id),
      ).size,
      target.dots.length,
    );
    assert.deepEqual(
      signature(samples[0]),
      signature(source.dots.map(resolvedParticleDot)),
    );
    assert.deepEqual(
      signature(samples[92]),
      signature(target.dots.map(resolvedParticleDot)),
    );
    assert.equal(particleTransitionAt(plan, 23, 24).progress, 1);
    assert.equal(particleTransitionAt(plan, 0, 24).progress, 0);
  });

  test(
    label +
      ": opposite-side travel actually crosses the former center exclusion",
    () => {
      const matched = plan.tracks
        .map((track, i) => ({ track, i }))
        .filter(({ track }) => track.kind === "matched");
      const opposite = matched.filter(
        ({ track: t }) =>
          ((t.source.x - 320) * (t.target.x - 320) +
            (t.source.y - 320) * (t.target.y - 320)) /
            (radius(t.source) * radius(t.target)) <
          -0.25,
      );
      assert.ok(
        opposite.length >= matched.length * 0.95,
        "destination must be on the opposite side, not a nearby ring slot",
      );
      const crossing = matched.filter(
        ({ i }) => Math.min(...samples.map((dots) => radius(dots[i]))) < 110,
      );
      assert.ok(
        crossing.length >= matched.length * 0.85,
        "at least 85% of matched dots visibly pass through the central region",
      );
      assert.ok(
        matched.every(
          ({ track: t }) =>
            distance(t.source, t.target) >
            1.5 * Math.min(radius(t.source), radius(t.target)),
        ),
        "travel is comparable to the diameter",
      );
      for (const axis of ["x", "y"]) {
        assert.ok(
          matched.filter(
            ({ track: t }) => t.target[axis] - t.source[axis] > 120,
          ).length >
            matched.length * 0.2,
        );
        assert.ok(
          matched.filter(
            ({ track: t }) => t.target[axis] - t.source[axis] < -120,
          ).length >
            matched.length * 0.2,
        );
      }
    },
  );

  test(
    label +
      ": no collective center collapse, clipping or text behind crossing dots",
    () => {
      const lowerExtent = Math.min(
        Math.max(...source.dots.map(radius)),
        Math.max(...target.dots.map(radius)),
      );
      const upperExtent = Math.max(
        ...source.dots.map(radius),
        ...target.dots.map(radius),
      );
      for (const dots of samples) {
        const visible = dots.filter((p) => p.opacity > 0.1);
        assert.ok(
          Math.max(...visible.map(radius)) >= lowerExtent * 0.9,
          "outer particles stay spread while others cross",
        );
        assert.ok(
          Math.max(...visible.map(radius)) <= upperExtent + 1e-8,
          "no artificial global expansion",
        );
        assert.ok(
          visible.filter((p) => radius(p) < 45).length < dots.length * 0.22,
          "never collect the particle pool at one central point",
        );
        for (const dot of dots) {
          for (const value of [dot.x, dot.y, dot.r, dot.opacity])
            assert.ok(Number.isFinite(value));
          assert.ok(dot.opacity >= -1e-8 && dot.opacity <= 1 + 1e-8);
          assert.ok(dot.x - dot.r >= 20 && dot.x + dot.r <= 620);
          assert.ok(dot.y - dot.r >= 20 && dot.y + dot.r <= 620);
        }
        plan.tracks.forEach((t, i) => {
          if (t.kind === "matched")
            assert.ok(
              dots[i].opacity >=
                Math.min(t.source.opacity, t.target.opacity) - 1e-8,
            );
        });
      }
      for (let f = 0; f < CATEGORY_TRANSITION_FRAMES; f++) {
        const state = particleTransitionAt(plan, f);
        if (state.dots.some((d) => d.opacity > 0.1 && radius(d) - d.r < 110)) {
          assert.equal(state.outgoingText, 0);
          assert.equal(state.incomingText, 0);
        }
        if (f > 0) {
          const previous = particleTransitionAt(plan, f - 1).dots;
          assert.ok(
            state.dots.every((dot, i) => distance(dot, previous[i]) < 120),
            "bounded continuous flight instead of teleporting",
          );
        }
      }
    },
  );

  test(label + ": independent crossing times and deterministic curves", () => {
    assert.ok(new Set(plan.tracks.map((t) => t.delay.toFixed(3))).size > 20);
    assert.ok(new Set(plan.tracks.map((t) => t.finish.toFixed(3))).size > 20);
    const crossingTimes = plan.tracks.map(
      (_, i) =>
        samples.reduce(
          (best, dots, f) =>
            radius(dots[i]) < radius(samples[best][i]) ? f : best,
          0,
        ) / 92,
    );
    assert.ok(
      Math.max(...crossingTimes) - Math.min(...crossingTimes) > 0.3,
      "crossings are staggered, not simultaneous convergence",
    );
    const middle = sampleParticlePlan(plan, 0.5);
    assert.ok(
      Math.max(...middle.map(radius)) - Math.min(...middle.map(radius)) > 140,
      "points occupy the center AND the outside during reassembly",
    );
    assert.deepEqual(makeParticlePlan(source, target, seed), plan);
    assert.deepEqual(
      makeParticlePlan(
        { ...source, dots: [...source.dots].reverse() },
        { ...target, dots: [...target.dots].reverse() },
        seed,
      ),
      plan,
    );
    assert.notDeepEqual(
      sampleParticlePlan(
        makeParticlePlan(source, target, seed + ":alternate"),
        0.5,
      ),
      middle,
    );
    for (const p of [0.9, 0.1, 0.6, 0.43, 0.2])
      assert.deepEqual(
        sampleParticlePlan(plan, p),
        sampleParticlePlan(plan, p),
      );
    const first = sampleParticlePlan(plan, 1e-7),
      last = sampleParticlePlan(plan, 1 - 1e-7);
    assert.ok(first.every((d, i) => distance(d, plan.tracks[i].source) < 1e-6));
    assert.ok(last.every((d, i) => distance(d, plan.tracks[i].target) < 1e-6));
  });
}

test("collection preserves one first intro, four local transitions and one particle pool", () => {
  const source = fs.readFileSync(
    path.join(directory, "TasteCategoryCollection.tsx"),
    "utf8",
  );
  assert.equal(
    (source.match(/<CategoryParticleTransition\b/g) ?? []).length,
    4,
  );
  assert.equal((source.match(/playback="intro"/g) ?? []).length, 1);
  assert.equal((source.match(/playback="idle"/g) ?? []).length, 4);
  const component = fs.readFileSync(
    path.join(directory, "CategoryOrbitalTransition.tsx"),
    "utf8",
  );
  assert.equal((component.match(/state\.dots\.map/g) ?? []).length, 1);
  assert.ok(!/fromDots\.map|toDots\.map|scale\(|rotate\(/.test(component));
  assert.equal(CATEGORY_TRANSITION_FRAMES, 45);
});

test("particle movement uses a pronounced slow-fast-slow timing curve", () => {
  const early = particleMotionEase(0.15) - particleMotionEase(0.05);
  const middle = particleMotionEase(0.55) - particleMotionEase(0.45);
  const late = particleMotionEase(0.95) - particleMotionEase(0.85);
  assert.equal(particleMotionEase(0), 0);
  assert.equal(particleMotionEase(1), 1);
  assert.ok(middle > early * 8, "middle movement must be much faster than takeoff");
  assert.ok(middle > late * 8, "middle movement must be much faster than landing");
  assert.ok(Math.abs(early - late) < 1e-12, "ease must be symmetric");
});

test("no-data endpoints and seek validation remain safe", () => {
  const empty = { ...pairs[0].source, dots: [] };
  assert.deepEqual(makeParticlePlan(empty, empty, "empty").tracks, []);
  for (const [source, target] of [
    [empty, pairs[0].target],
    [pairs[0].source, empty],
  ]) {
    const plan = makeParticlePlan(source, target, "empty-case");
    assert.deepEqual(
      signature(sampleParticlePlan(plan, 0)),
      signature(source.dots.map(resolvedParticleDot)),
    );
    assert.deepEqual(
      signature(sampleParticlePlan(plan, 1)),
      signature(target.dots.map(resolvedParticleDot)),
    );
    assert.deepEqual(sampleParticlePlan(plan, -1), sampleParticlePlan(plan, 0));
    assert.deepEqual(sampleParticlePlan(plan, 2), sampleParticlePlan(plan, 1));
    for (const dot of sampleParticlePlan(plan, 0.5))
      assert.ok(Number.isFinite(dot.x) && Number.isFinite(dot.y));
  }
  assert.throws(() => particleTransitionAt(pairs[0].plan, 0, 1));
  assert.throws(() => particleTransitionAt(pairs[0].plan, NaN));
  assert.throws(() => sampleParticlePlan(pairs[0].plan, NaN));
});
