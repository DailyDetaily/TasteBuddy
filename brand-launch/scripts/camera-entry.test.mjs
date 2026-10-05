import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const moduleUrl = async (file, replacements = {}) => {
  let code = ts.transpileModule(await fs.readFile(file, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  if (
    file !== "src/generated/native-feedback.ts" &&
    code.includes('"../generated/native-feedback"')
  ) {
    replacements = {
      "../generated/native-feedback": await moduleUrl(
        "src/generated/native-feedback.ts",
      ),
      ...replacements,
    };
  }
  if (
    file !== "src/TabBarCameraEntry/native-ui.ts" &&
    code.includes('"./native-ui"')
  ) {
    replacements = {
      "./native-ui": await moduleUrl("src/TabBarCameraEntry/native-ui.ts"),
      ...replacements,
    };
  }
  for (const [name, url] of Object.entries(replacements)) {
    code = code.replace(JSON.stringify(name), JSON.stringify(url));
  }
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
};
const plus = await moduleUrl("src/TabBarPlusButton/motion.ts");
const feedbackColors = await moduleUrl("src/DiningFeedbackMotion/colors.ts");
const motionURL = await moduleUrl("src/TabBarCameraEntry/motion.ts", {
  "../TabBarPlusButton/motion": plus,
  "../DiningFeedbackMotion/colors": feedbackColors,
});
const motion = await import(motionURL);
const detailTiming = await import(
  await moduleUrl("src/TabBarCameraEntry/feedback-timing.ts", {
    "./motion": motionURL,
  })
);

test("detail gestures scroll one target at a time and stop before selecting", () => {
  const { detailScrollState, DETAIL_SELECTION_SECONDS, feedbackStages } =
    detailTiming;
  const duration = feedbackStages.find(
    (stage) => stage.id === "details",
  ).seconds;
  const movingTargets = new Set();
  for (let frame = 1; frame <= duration * 60; frame++) {
    const before = detailScrollState((frame - 1) / 60);
    const after = detailScrollState(frame / 60);
    const moving = Object.keys(after).filter(
      (key) => Math.abs(after[key] - before[key]) > 1e-9,
    );
    moving.forEach((key) => movingTargets.add(key));
    assert.ok(
      moving.length <= 1,
      `Simultaneous scroll at frame ${frame}: ${moving}`,
    );
  }
  assert.deepEqual([...movingTargets].sort(), [
    "aroma",
    "balance",
    "composition",
    "flow",
    "page",
    "texture",
  ]);
  for (const at of Object.values(DETAIL_SELECTION_SECONDS)) {
    const settled = detailScrollState(at);
    for (let offset = -18; offset <= 36; offset++) {
      assert.deepEqual(
        detailScrollState(at + offset / 60),
        settled,
        `Scroll during selection at ${at}s`,
      );
    }
  }
});

test("random color bags cover all six colors without repeating the adjacent pair", () => {
  for (let seed = 0; seed < 32; seed++) {
    for (let bag = 0; bag < 8; bag++) {
      const pairs = [0, 1, 2].map((i) =>
        motion.colorPairForCycle(bag * 3 + i, seed),
      );
      assert.deepEqual(pairs.flat().sort(), [0, 1, 2, 3, 4, 5]);
      if (bag > 0) {
        assert.notDeepEqual(
          [...motion.colorPairForCycle(bag * 3 - 1, seed)].sort(),
          [...pairs[0]].sort(),
        );
      }
    }
  }
  assert.notDeepEqual(
    Array.from({ length: 12 }, (_, i) => motion.colorPairForCycle(i, 29)),
    Array.from({ length: 12 }, (_, i) => motion.colorPairForCycle(i, 30)),
  );
});

test("color motion continues through entry and is stable when seeking out of order", () => {
  const frames = [0, 24, 45, 75, 85, 86, 94, 102, 114, 150];
  const states = frames.map((frame) =>
    motion.randomBeamState(frame, 60, 0.75, 29),
  );
  for (const i of [8, 2, 6, 0, 5, 9, 3, 7, 1, 4]) {
    assert.deepEqual(
      motion.randomBeamState(frames[i], 60, 0.75, 29),
      states[i],
    );
  }
  assert.notDeepEqual(states[6].first, states[7].first);
  assert.notDeepEqual(states[7].second, states[8].second);
  for (const frame of [45, 90, 135, 180]) {
    const before = motion.randomBeamState(frame - 1, 60, 0.75, 29);
    const after = motion.randomBeamState(frame, 60, 0.75, 29);
    for (const key of ["first", "second", "tertiary", "background"]) {
      before[key].forEach((value, channel) =>
        assert.ok(Math.abs(value - after[key][channel]) < 1e-12),
      );
    }
  }
});

test("entry uses the dish-result palette and only the colors currently in the button", async () => {
  const { palette, tasteAxes } = await import(feedbackColors);
  for (let cycle = 0; cycle < 12; cycle++) {
    const pair = motion.colorPairForCycle(cycle, 29);
    const state = motion.randomBeamState(cycle * 45, 60, 0.75, 29);
    const colors = motion.resultBackgroundColors(state);
    assert.equal(colors.main.toUpperCase(), palette[tasteAxes[pair[0]]].main);
    assert.equal(
      colors.background.toUpperCase(),
      palette[tasteAxes[pair[0]]].tint,
    );
    assert.equal(
      colors.secondary.toUpperCase(),
      palette[tasteAxes[pair[1]]].main,
    );
    assert.equal(colors.tertiary, colors.secondary);
    assert.deepEqual(motion.bloomState(0, state).colors, [
      state.first,
      state.second,
    ]);
  }
});

test("bloom matches sampled SwiftUI spring values rather than a generic easing", () => {
  const samples = [
    0, 0.32906542293785845, 0.7241093319227725, 0.929430338175056,
    0.9991629939836165, 1.0110998270771758,
  ];
  samples.forEach((expected, i) => {
    const actual = motion.springValue(
      (motion.nativeSpring.bloom.duration * i) / 10,
    );
    assert.ok(
      Math.abs(expected - actual) < 1e-12,
      `${i}: ${actual} != ${expected}`,
    );
  });
});

test("button and bloom share an origin, with a held camera frame after every supported speed", () => {
  for (const size of [96, 144, 240]) {
    const layout = motion.entryLayout(1080, 1920, 192, size);
    assert.ok(Math.abs(layout.origin.y * layout.scale - 1728) < 1e-9);
    assert.ok(Math.abs(layout.sourceRadius * layout.scale * 2 - size) < 1e-9);
    assert.equal(
      motion.bloomGeometry(layout.size, layout.origin, 0, layout.sourceRadius)
        .radius,
      layout.sourceRadius,
    );
  }
  for (const speed of [0.25, 1, 2]) {
    const t = motion.entryTiming({
      "클릭 전 대기": 1.2,
      "누름 시간": 0.24,
      "진입 속도": speed,
      "카메라 유지 시간": 1.5,
    });
    assert.equal(t.durationInFrames - t.clearFrame, 91);
    assert.ok(
      t.clickFrame < t.launchFrame &&
        t.launchFrame < t.cameraFrame &&
        t.cameraFrame < t.clearFrame,
    );
  }
});

test("square and portrait remain independently editable Studio compositions", async () => {
  const { computeCanUpdateDefaultPropsFromContent } = createRequire(
    import.meta.url,
  )("@remotion/studio-codemods");
  const source = await fs.readFile("src/Root.tsx", "utf8");
  for (const id of ["TabBar-PlusButton", "TabBar-CameraEntry-Portrait"]) {
    assert.equal(
      computeCanUpdateDefaultPropsFromContent(source, id).canUpdate,
      true,
    );
  }
});

test("native focus rings attenuate fill without fading labels or selected tastes", async () => {
  const { nativeBubbleOpacity } = await import(
    await moduleUrl("src/TabBarCameraEntry/bubble-appearance.ts")
  );
  assert.deepEqual(nativeBubbleOpacity(false), {
    fillOpacity: 0.56,
    textOpacity: 0.74,
  });
  for (const [distance, fill, text] of [
    [0, 0.8, 0.98],
    [136, 0.8, 0.98],
    [203.9, 0.8, 0.98],
    [204, 0.6, 0.78],
    [408, 0.4, 0.58],
    [544, 0.2, 0.54],
    [1600, 0.2, 0.54],
  ]) {
    const actual = nativeBubbleOpacity(false, distance);
    assert.ok(Math.abs(actual.fillOpacity - fill) < 1e-10);
    assert.ok(Math.abs(actual.textOpacity - text) < 1e-10);
    assert.deepEqual(nativeBubbleOpacity(true, distance), {
      fillOpacity: 1,
      textOpacity: 1,
    });
  }
});

test("bubble entry follows native six-primary then radial ordering and settles before focus", async () => {
  const catalogUrl = await moduleUrl(
    "src/TabBarCameraEntry/feedback-catalog.ts",
  );
  const springUrl = await moduleUrl(
    "src/TasteBubbleMapMotion/native-spring.ts",
  );
  const { default: catalog } = await import(catalogUrl);
  const { bubbleIntroDelays, bubbleEntry, nativeVeilOpacity } = await import(
    await moduleUrl("src/TabBarCameraEntry/bubble-entry.ts", {
      "./feedback-catalog": catalogUrl,
      "../TasteBubbleMapMotion/native-spring": springUrl,
    })
  );
  const { BUBBLE_INTRO_SECONDS, feedbackTiming } = detailTiming;
  const primary = [...new Set(catalog.bubbles.map((b) => b.axis))].map((axis) =>
    catalog.bubbles.find((b) => b.axis === axis),
  );
  assert.equal(primary.length, 6);
  primary.forEach((b, i) =>
    assert.equal(bubbleIntroDelays[b.id], 0.18 + i * 0.06),
  );
  assert.equal(Object.keys(bubbleIntroDelays).length, 160);
  const outer = catalog.bubbles
    .filter((b) => !primary.includes(b))
    .sort(
      (a, b) =>
        Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y) ||
        Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x),
    );
  assert.equal(bubbleIntroDelays[outer[0].id], 0.5);
  assert.equal(bubbleIntroDelays[outer.at(-1).id], 0.8);
  for (let i = 1; i < outer.length; i++)
    assert.ok(
      bubbleIntroDelays[outer[i].id] > bubbleIntroDelays[outer[i - 1].id],
    );
  for (const b of catalog.bubbles) {
    assert.deepEqual(bubbleEntry(b.id, 0), { opacity: 0, scale: 0.72 });
    assert.deepEqual(bubbleEntry(b.id, BUBBLE_INTRO_SECONDS), {
      opacity: 1,
      scale: 1,
    });
    assert.ok(bubbleEntry(b.id, bubbleIntroDelays[b.id] + 0.44).scale > 1);
  }
  assert.equal(nativeVeilOpacity(0.18), 1);
  assert.equal(nativeVeilOpacity(1), 0);
  assert.equal(
    feedbackTiming(60).stages.find((stage) => stage.id === "bubbles").duration,
    408,
  );
});

test("frame 1319 preserves the old focus opacity until the camera actually moves", async () => {
  const catalogUrl = await moduleUrl(
    "src/TabBarCameraEntry/feedback-catalog.ts",
  );
  const { feedbackBubbleLayout } = await import(
    await moduleUrl("src/TabBarCameraEntry/feedback-layout.ts", {
      "./feedback-catalog": catalogUrl,
    })
  );
  const { nativeBubbleOpacity, blendBubbleOpacity } = await import(
    await moduleUrl("src/TabBarCameraEntry/bubble-appearance.ts")
  );
  const firstID = "v2.bubble.umami.shrimp-like",
    secondID = "v2.bubble.fat.butter-like";
  const layouts = [
    feedbackBubbleLayout([firstID]),
    feedbackBubbleLayout([firstID, secondID]),
  ];
  const endpoints = layouts.map((positions, index) => {
    const center = positions.find((b) => b.id === (index ? secondID : firstID));
    return positions.map((b) =>
      nativeBubbleOpacity(
        b.id === firstID || b.id === center.id,
        Math.hypot(b.x - center.x, b.y - center.y),
      ),
    );
  });
  const state = (frame, index) =>
    blendBubbleOpacity(
      endpoints[0][index],
      endpoints[1][index],
      motion.smoothStep((frame - 1319) / 42),
    );
  let largestStep = 0;
  layouts[0].forEach((b, index) => {
    assert.deepEqual(state(1319, index), state(1318, index));
    for (let frame = 1320; frame <= 1361; frame++) {
      largestStep = Math.max(
        largestStep,
        Math.abs(
          state(frame, index).fillOpacity - state(frame - 1, index).fillOpacity,
        ),
      );
    }
    assert.ok(
      Math.abs(
        state(1361, index).fillOpacity - endpoints[1][index].fillOpacity,
      ) < 1e-12,
    );
    if (b.id === firstID) assert.equal(state(1340, index).fillOpacity, 1);
  });
  assert.ok(largestStep < 0.03, `Unexpected opacity jump: ${largestStep}`);
});
