import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const loadSource = async (name) => {
  const source = await readFile(
    new URL(`../src/TasteBloomAvatars/${name}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
};
const motion = await loadSource("profile-motion");
const { profileTasteTypes, profileDisplayRows } =
  await loadSource("profile-types");
const contract = JSON.parse(
  await readFile(
    new URL(
      "../../ios/TasteBuddy/Resources/TBA/tba-sensory-contract.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const manifest = JSON.parse(
  await readFile(
    new URL("../public/brand/taste-bloom/manifest.json", import.meta.url),
    "utf8",
  ),
);

test("all nine TBA types retain contract order and use distinct existing avatars", () => {
  assert.deepEqual(
    profileTasteTypes.map((p) => p.id),
    contract.styles.map((s) => s.id),
  );
  assert.deepEqual(
    profileTasteTypes.map((p) => p.label),
    contract.styles.map((s) => s.label),
  );
  assert.equal(profileTasteTypes.length, motion.PROFILE_TYPE_COUNT);
  assert.equal(new Set(profileTasteTypes.map((p) => p.avatarForm)).size, 9);
  for (const p of profileTasteTypes)
    assert.ok(manifest.variants.some((v) => v.formNumber === p.avatarForm));
});

test("each type lands at the center in order before returning to Purist", () => {
  for (let index = 0; index < 9; index++) {
    const arrival = index * motion.PROFILE_STEP_FRAMES;
    for (const local of [0, 30, motion.PROFILE_HOLD_FRAMES - 1]) {
      const state = motion.profilePlaybackAt(arrival + local);
      assert.equal(state.centerIndex, index);
      assert.equal(state.moving, false);
      const center =
        motion.profileListTop(1080) +
        index * motion.PROFILE_ROW_PITCH +
        motion.PROFILE_ROW_HEIGHT / 2 -
        state.offset;
      assert.equal(center, 540);
      assert.equal(motion.profileRowAt(index, arrival + local).focus, 1);
    }
  }
  assert.equal(
    motion.profilePlaybackAt(motion.PROFILE_DURATION_FRAMES - 1).centerIndex,
    9,
  );
  assert.equal(
    motion.profileScrollAt(motion.PROFILE_DURATION_FRAMES - 1),
    10 * 352,
  );
});

test("every single-row move overshoots by 10–16px and returns to the exact landing", () => {
  for (let index = 0; index < motion.PROFILE_SLOT_COUNT; index++) {
    const start = motion.profileMoveStart(index);
    const target = (index + 1) * motion.PROFILE_ROW_PITCH;
    const offsets = Array.from({ length: motion.PROFILE_MOVE_FRAMES }, (_, f) =>
      motion.profileScrollAt(start + f),
    );
    assert.equal(offsets[0], index * 352);
    assert.equal(offsets.at(-1), target);
    const overshoot = Math.max(...offsets) - target;
    assert.ok(overshoot > 10 && overshoot < 16, `Overshoot ${overshoot}`);
    assert.ok(offsets.some((value, f) => f > 0 && value < offsets[f - 1]));
    assert.equal(
      motion.profileScrollAt(start + motion.PROFILE_MOVE_FRAMES),
      target,
    );
  }
});

test("only the settled center flowers, while upper/lower rows remain pale circles", () => {
  for (let frame = 0; frame < motion.PROFILE_DURATION_FRAMES; frame++) {
    const state = motion.profilePlaybackAt(frame);
    const rows = Array.from({ length: 9 }, (_, index) =>
      motion.profileRowAt(index, frame),
    );
    const flowering = rows.flatMap((row, index) =>
      row.interiorVisible ? [index] : [],
    );
    assert.ok(flowering.length <= 1);
    if (state.moving) assert.equal(flowering.length, 0);
    else
      for (let index = 0; index < 9; index++) {
        if (index === state.centerIndex) continue;
        assert.equal(rows[index].interiorVisible, false);
        assert.equal(rows[index].avatarOpacity, 0.55);
        assert.equal(rows[index].focus, 0);
      }
  }
  for (let index = 0; index < 9; index++) {
    const start = index * motion.PROFILE_STEP_FRAMES;
    const first = motion.profileRowAt(index, start);
    const full = motion.profileRowAt(index, start + 45);
    assert.equal(first.motionTime, 0);
    assert.equal(full.motionTime, 2.7);
    assert.equal(full.interiorOpacity, 1);
    assert.equal(full.avatarOpacity, 1);
  }
  const final = motion.profileRowAt(8, motion.PROFILE_DURATION_FRAMES - 1);
  assert.equal(final.interiorOpacity, 0);
  assert.equal(final.motionTime, 0);
});

test("edge movement leads the main movement by six frames", () => {
  const bases = Array.from(
    { length: motion.PROFILE_SLOT_COUNT },
    (_, i) => 12 + i * motion.PROFILE_ROW_PITCH,
  );
  const period = motion.PROFILE_SLOT_COUNT * motion.PROFILE_ROW_PITCH;
  assert.equal(motion.PROFILE_EDGE_LEAD_FRAMES, 6);
  for (let index = 0; index < motion.PROFILE_SLOT_COUNT; index++) {
    const start = motion.profileMoveStart(index);
    const lead = start - motion.PROFILE_EDGE_LEAD_FRAMES;
    assert.equal(motion.profileScrollAt(lead + 3), index * 352);
    assert.ok(motion.profileEdgeScrollAt(lead + 3) > index * 352);
    assert.ok(motion.profileScrollAt(start + 3) > index * 352);
    assert.equal(
      motion.profileEdgeScrollAt(lead + motion.PROFILE_MOVE_FRAMES - 1),
      (index + 1) * 352,
    );
  }
  for (let frame = 0; frame < motion.PROFILE_DURATION_FRAMES; frame++) {
    assert.equal(
      motion.profileEdgeScrollAt(frame),
      motion.profileScrollAt(frame + motion.PROFILE_EDGE_LEAD_FRAMES),
    );
    for (const base of bases) {
      const y = motion.profileEdgeCenterAt(base, frame, 1080);
      const raw = base + motion.profileEdgeScrollAt(frame);
      assert.ok(y >= 1080 + 48 - period && y < 1080 + 48);
      assert.ok(
        Math.abs((raw - y) / period - Math.round((raw - y) / period)) < 1e-9,
      );
    }
  }
  for (let index = 0; index < motion.PROFILE_SLOT_COUNT; index++) {
    const positions = bases
      .map((base) =>
        motion.profileEdgeCenterAt(
          base,
          index * motion.PROFILE_STEP_FRAMES,
          1080,
        ),
      )
      .filter((y) => y >= -48 && y <= 1128)
      .sort((a, b) => a - b);
    assert.deepEqual(positions, [12, 364, 716, 1068]);
  }
});

test("first and final frames have identical visible types, emphasis, circles, and colors", () => {
  const visibleRows = (frame) =>
    profileDisplayRows
      .map((p) => {
        const appearance = motion.profileRowAt(p.rowIndex, frame);
        const y =
          motion.profileListTop(1080) +
          p.rowIndex * motion.PROFILE_ROW_PITCH +
          64 -
          motion.profileScrollAt(frame);
        return {
          id: p.id,
          avatar: p.avatarForm,
          y,
          focus: appearance.focus,
          opacity: appearance.avatarOpacity,
          interior: appearance.interiorVisible,
        };
      })
      .filter((p) => p.y > -64 && p.y < 1144);
  const last = motion.PROFILE_DURATION_FRAMES - 1;
  assert.deepEqual(visibleRows(last), visibleRows(0));
  for (let i = 0; i < motion.PROFILE_SLOT_COUNT; i++) {
    const base = 12 + i * motion.PROFILE_ROW_PITCH;
    assert.equal(
      motion.profileEdgeCenterAt(base, last, 1080),
      motion.profileEdgeCenterAt(base, 0, 1080),
    );
  }
  assert.equal(motion.profileRowAt(0, 0).interiorVisible, false);
  assert.equal(motion.profileRowAt(0, 1).interiorVisible, true);
});

test("staggered moves overlap while preserving the same speed curve and loop seam", () => {
  for (let index = 0; index < motion.PROFILE_SLOT_COUNT; index++) {
    const mainStart = motion.profileMoveStart(index);
    const sideStart = mainStart - motion.PROFILE_EDGE_LEAD_FRAMES;
    for (let f = 0; f < motion.PROFILE_MOVE_FRAMES; f++) {
      if (f <= motion.PROFILE_EDGE_LEAD_FRAMES) {
        assert.equal(
          motion.profileScrollAt(sideStart + f),
          index * motion.PROFILE_ROW_PITCH,
        );
      }
      assert.equal(
        motion.profileEdgeScrollAt(sideStart + f),
        motion.profileScrollAt(mainStart + f),
      );
    }
    assert.notEqual(
      motion.profileScrollAt(mainStart + 2),
      motion.profileScrollAt(mainStart + 3),
    );
    assert.notEqual(
      motion.profileEdgeScrollAt(mainStart + 2),
      motion.profileEdgeScrollAt(mainStart + 3),
    );
  }
  assert.equal(motion.profileLoopFrame(0), 0);
  assert.equal(motion.profileLoopFrame(motion.PROFILE_DURATION_FRAMES - 1), 0);
});

test("the empty row separates Harmonist and Purist and pauses for 1.5 seconds", () => {
  for (const row of profileDisplayRows.filter((p) => p.id === "loop-gap")) {
    assert.equal(row.title, "");
    assert.equal(row.avatarForm, 0);
  }
  assert.equal(motion.PROFILE_END_PAUSE_FRAMES, 45);
  assert.equal(motion.PROFILE_DURATION_FRAMES, 765);
  for (let index = 0; index < 9; index++)
    assert.equal(motion.profileHoldFrames(index), 60);
  assert.equal(motion.profileHoldFrames(9), 45);
  assert.deepEqual(
    profileDisplayRows
      .filter((p) => p.id === "loop-gap")
      .map((p) => p.rowIndex),
    [-1, 9],
  );
  assert.equal(
    profileDisplayRows.find((p) => p.rowIndex === 8).id,
    "harmonist",
  );
  assert.equal(profileDisplayRows.find((p) => p.rowIndex === 10).id, "purist");
  for (
    let frame = 9 * motion.PROFILE_STEP_FRAMES;
    frame < motion.profileMoveStart(9);
    frame++
  ) {
    assert.equal(motion.profileScrollAt(frame), 9 * motion.PROFILE_ROW_PITCH);
    for (let index = -1; index <= 11; index++)
      assert.equal(motion.profileRowAt(index, frame).interiorVisible, false);
  }
});
