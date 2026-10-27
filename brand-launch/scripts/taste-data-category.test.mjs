import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const moduleURL = (name) => {
  const url = new URL(
    "../src/TasteDataCategoryMotion/" + name + ".ts",
    import.meta.url,
  );
  let code = ts.transpileModule(fs.readFileSync(url, "utf8"), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText;
  code = code.replace(/['"]\.\/colors['"]/, () => JSON.stringify(moduleURL("colors")));
  code = code.replace(
    /['"]\.\.\/taste-motion['"]/,
    JSON.stringify(new URL("../src/taste-motion.ts", import.meta.url).href),
  );
  code = code.replace(
    /['"]\.\.\/\.\.\/\.\.\/src\/constants\/designTokens['"]/,
    JSON.stringify(
      new URL("../../src/constants/designTokens.ts", import.meta.url).href,
    ),
  );
  code = code.replace(/['"]\.\/experience['"]/, () =>
    JSON.stringify(moduleURL("experience")),
  );
  code = code.replace(/['"]\.\/experience-physics['"]/, () =>
    JSON.stringify(moduleURL("experience-physics")),
  );
  code = code.replace(/["']\.\/sensory["']/, () =>
    JSON.stringify(moduleURL("sensory")),
  );
  code = code.replace(/["']\.\/context["']/, () =>
    JSON.stringify(moduleURL("context")),
  );
  code = code.replace(/["']\.\/context-entry["']/, () =>
    JSON.stringify(moduleURL("context-entry")),
  );
  code = code.replace(/["']\.\/change["']/, () =>
    JSON.stringify(moduleURL("change")),
  );
  return "data:text/javascript;base64," + Buffer.from(code).toString("base64");
};
const load = async (name) => import(moduleURL(name));
const { fixture } = await load("fixtures"),
  { categoryFrame, categoryIntroDuration, categoryLoopDuration } =
    await load("geometry");
const categories = [
  "experienceCluster",
  "sensoryRays",
  "preferenceFocus",
  "contextLayers",
  "changeRipples",
];
const shape = (f) => ({
  dots: f.dots,
  lines: f.lines
    .filter((l) => l.data !== false)
    .map(({ highlight, ...l }) => l),
});
test("same data/time/input generates identical frames; no random or clock animation", () => {
  for (const kind of categories)
    for (const state of ["standard", "dense", "empty", "held", "unanswered"]) {
      const data = fixture(kind, state);
      for (const t of [0, 0.2, 0.9, 1.8, 4, 13.8])
        assert.deepEqual(categoryFrame(data, t), categoryFrame(data, t));
    }
  const dir = new URL("../src/TasteDataCategoryMotion/", import.meta.url);
  for (const file of fs.readdirSync(dir))
    assert(
      !/Date\.now|Math\.random|@keyframes|animation:/.test(
        fs.readFileSync(new URL(file, dir), "utf8"),
      ),
      file,
    );
});
test("data marks stay outside center text and inside 640 safe bounds after settling", () => {
  for (const kind of categories)
    for (const state of ["standard", "dense", "empty"]) {
      const data = fixture(kind, state);
      for (const t of [0, 0.2, 4, 12].map(
        (offset) => categoryIntroDuration(kind) + offset,
      )) {
        const f = categoryFrame(data, t);
        for (const d of f.dots) {
          assert(
            d.x - d.r >= 24 &&
              d.x + d.r <= 616 &&
              d.y - d.r >= 24 &&
              d.y + d.r <= 616,
            kind + " " + d.id,
          );
          assert(
            f.layout === "bars"
              ? d.y - d.r >= 220
              : Math.hypot(d.x - 320, d.y - 320) - d.r >= 104,
            kind + " center " + d.id,
          );
        }
        for (const l of f.lines)
          for (const p of l.points) {
            assert(
              p.x - l.width / 2 >= 24 &&
                p.x + l.width / 2 <= 616 &&
                p.y - l.width / 2 >= 24 &&
                p.y + l.width / 2 <= 616,
              kind + " line bound",
            );
            assert(
              f.layout === "bars"
                ? p.y - l.width / 2 >= 220
                : Math.hypot(p.x - 320, p.y - 320) - l.width / 2 >= 104,
              kind + " center line",
            );
          }
      }
    }
});
test("all entrance frames have finite geometry and no exterior cropping", () => {
  for (const kind of categories)
    for (const state of ["standard", "dense"])
      for (const data of [fixture(kind, state)])
        for (
          let frame = 0;
          frame <= Math.ceil(categoryIntroDuration(kind) * 30);
          frame++
        ) {
          const f = categoryFrame(data, frame / 30);
          const points = [...f.dots, ...f.lines.flatMap((l) => l.points)];
          for (const p of points)
            assert(
              Number.isFinite(p.x) &&
                Number.isFinite(p.y) &&
                p.x >= 20 &&
                p.y >= 20 &&
                p.x <= 620 &&
                p.y <= 620,
              kind + " " + frame,
            );
        }
});
test("idle geometry never changes data; reduce motion is complete from frame zero", () => {
  for (const kind of categories) {
    const data = fixture(kind),
      a = categoryFrame(data, 0, { playback: "reduced" }),
      b = categoryFrame(data, 50, { playback: "reduced" });
    assert.deepEqual(a, b);
    assert.equal(a.summaryOpacity, 1);
    assert(a.dots.every(d => d.opacity === 1), 'settled points use opaque color roles');
    if (kind === 'preferenceFocus') {
      assert(a.dots.some(d => d.tint === 0) && a.dots.some(d => d.tint === 1));
    }
    const first = categoryFrame(data, 3, { playback: "idle" }),
      later = categoryFrame(data, 9, { playback: "idle" });
    const meaning = (f) =>
      f.dots.map(({ id, r, color, tint, group }) => ({
        id,
        r,
        color,
        tint,
        group,
      }));
    assert.deepEqual(meaning(first), meaning(later));
    const loopA = categoryFrame(data, 2.1, { playback: "idle" }),
      loopB = categoryFrame(data, 2.1 + categoryLoopDuration(kind), {
        playback: "idle",
      });
    const boundaryA = categoryFrame(data, categoryIntroDuration(kind)),
      boundaryB = categoryFrame(
        data,
        categoryIntroDuration(kind) + categoryLoopDuration(kind),
      );
    boundaryA.dots.forEach((d, i) => {
      assert(Math.abs(d.x - boundaryB.dots[i].x) < 1e-8);
      assert(Math.abs(d.y - boundaryB.dots[i].y) < 1e-8);
    });
    const coords = (f) =>
      [...f.dots, ...f.lines.flatMap((l) => l.points)].flatMap((p) => [
        p.x,
        p.y,
      ]);
    coords(loopA).forEach((v, i) =>
      assert(Math.abs(v - coords(loopB)[i]) < 1e-8, kind + " loop"),
    );
  }
});
test("experience keeps record and meal units distinct within 126 occupied ring slots", async () => {
  const data = fixture("experienceCluster"),
    end = categoryIntroDuration("experienceCluster"),
    f = categoryFrame(data, end);
  assert.equal(f.dots.length, 126);
  assert.equal(f.dots.filter((d) => d.role === "record").length, 21);
  assert.equal(f.dots.filter((d) => d.role === "halo").length, 105);
  assert.equal(f.value, "11");
  const menu = f.dots.filter((d) => d.group === "menu:menu-0");
  assert.equal(menu.length, 48);
  assert.equal(menu.filter((d) => d.role === "record").length, 8);
  assert.equal(f.lines.length, 0);
  const added = categoryFrame(fixture("experienceCluster", "added"), end);
  const { experiencePlan } = await load("experience");
  const slots = (data) =>
    experiencePlan(data)
      .marks.map((m) => m.target)
      .sort((a, b) => a.x - b.x || a.y - b.y);
  assert.deepEqual(slots(data), slots(fixture("experienceCluster", "added")));
  assert.equal(added.dots.length, 126);
  assert.equal(added.dots.filter((d) => d.role === "record").length, 22);
});

test("sensory ring has six equal 21-slot sectors with independent 14 and 7 dark dots", () => {
  const data = fixture("sensoryRays"),
    f = categoryFrame(data, 1.8);
  assert.equal(f.dots.length, 126);
  for (const sense of data.senses)
    assert.equal(f.dots.filter((d) => d.group === sense.id).length, 21);
  const dark = (id) =>
    f.dots.filter((d) => d.group === id && d.tint === 0).length;
  assert.equal(dark("taste.salty"), 14);
  assert.equal(dark("taste.sweet"), 7);
  assert.notDeepEqual(f.dots, categoryFrame(data, 8).dots);
  const selected = categoryFrame(data, 8, { selected: "taste.salty" });
  assert.equal(selected.value, "8/12");
  assert.deepEqual(
    categoryFrame(data, 8).dots.map((d) => [d.x, d.y, d.r, d.tint]),
    selected.dots.map((d) => [d.x, d.y, d.r, d.tint]),
  );
  const zero = categoryFrame(fixture("sensoryRays", "zero"), 3);
  assert(
    zero.dots
      .filter((d) => d.group === "taste.sweet")
      .every((d) => d.tint === 1),
  );
});
test("preference 126 proportion dots retain all valid categories; actual n and statuses separate", () => {
  for (const mode of ["liking", "fit", "overall"]) {
    const data = fixture("preferenceFocus", "standard", mode),
      f = categoryFrame(data, 1.8);
    assert.equal(f.dots.length, 126);
    assert.equal(f.value, "24");
    assert.equal(
      f.dots.reduce((n, d) => n + (d.group !== "" ? 1 : 0), 0),
      126,
    );
    assert.equal(
      new Set(f.dots.map((d) => d.group)).size,
      mode === "overall" ? 5 : 3,
    );
  }
  const negative = categoryFrame(fixture("preferenceFocus", "decrease"), 3);
  assert(negative.dots.every((d) => d.group === "2"));
  const empty = categoryFrame(fixture("preferenceFocus", "empty"), 3);
  assert(empty.dots.every((d) => d.group === ""));
  assert.equal(empty.value, "—");
  const data = fixture("preferenceFocus");
  data.responses = data.responses
    .filter((r) => typeof r.response === "number")
    .slice(0, 3);
  data.responses[0].response = 0;
  data.responses[1].response = 0;
  data.responses[2].response = 2;
  const small = categoryFrame(data, 3);
  assert.equal(small.value, "3");
  assert.equal(small.dots.filter((d) => d.group === "0").length, 84);
  assert.equal(small.dots.filter((d) => d.group === "2").length, 42);
});
test("context same ratio 2/3 and 20/30 respects each ring resolution; own denominators and modes preserved", () => {
  const data = fixture("contextLayers"),
    f = categoryFrame(data, 1.8);
  const proportion = (id) => {
    const dots = f.dots.filter((d) => d.id.startsWith(id + ":0:"));
    return dots.filter((d) => d.tint === 0).length / dots.length;
  };
  assert.equal(proportion("condition-0"), 2 / 3);
  assert.equal(proportion("condition-1"), Math.round((16 * 2) / 3) / 16);
  assert(
    Math.abs(proportion("condition-1") - proportion("condition-0")) <= 0.5 / 16,
  );
  assert.equal(f.lines.length, 0);
  data.conditions = data.conditions.slice(0, 1);
  const one = categoryFrame(data, 3);
  assert.equal(one.value, "1");
  assert.equal(one.choices.length, 1);
  assert.equal(
    categoryFrame(fixture("contextLayers", "empty"), 3).lines.length,
    0,
  );
  assert.equal(
    categoryFrame(fixture("contextLayers", "dense"), 3).choices.length,
    4,
  );
  assert.equal(
    categoryFrame(fixture("contextLayers", "dense"), 3, { page: 1 }).choices
      .length,
    2,
  );
});
test("change dot rings retain one shared scale for increase, decrease, equal, zero and unknown", () => {
  for (const scenario of [
    "standard",
    "decrease",
    "equal",
    "zero",
    "unlinked",
  ]) {
    const data = fixture("changeRipples", scenario),
      f = categoryFrame(data, 1.8);
    assert.equal(f.lines.length, 0);
    const periods = [data.previous, data.recent];
    periods.forEach((period, i) => {
      const dots = f.dots.filter((d) => d.group === "period-" + i);
      assert.equal(dots.length, i === 0 ? 36 : 48);
      if (period.state !== "valid") {
        assert(dots.every((d) => d.color === "#dedad5"));
        return;
      }
      assert.equal(
        dots.filter((d) => d.tint === 0).length,
        Math.round((dots.length * period.value) / data.maximum),
      );
    });
    const ratio = (i) => {
      const dots = f.dots.filter((d) => d.group === "period-" + i);
      return dots.filter((d) => d.tint === 0).length / dots.length;
    };
    if (scenario === "equal") assert.equal(ratio(0), ratio(1));
    if (scenario === "decrease") assert(ratio(0) > ratio(1));
    if (scenario === "standard") assert(ratio(0) < ratio(1));
    if (scenario === "zero") {
      assert.equal(ratio(0), 0);
      assert.equal(f.value, "0 → 12");
    }
    if (scenario === "unlinked") {
      assert(f.value.startsWith("—"));
      assert.deepEqual(f.dots, categoryFrame(data, 9).dots);
      assert.equal(f.motionPhase, "비교 대기");
    }
  }
});

test("unavailable data does not display fake zero ratings or intensity responses", () => {
  const sensory = categoryFrame(fixture("sensoryRays", "empty"), 3, {
    selected: "taste.salty",
  });
  assert(sensory.selection.includes("강도 응답 자료 없음"));
  assert(!sensory.selection.some((s) => /강함 5/.test(s)));
  for (const category of ["preferenceFocus", "experienceCluster"]) {
    const frame = categoryFrame(fixture(category, "empty"), 3);
    assert.equal(frame.value, "—");
    assert(!frame.notes.some((s) => /좋음 0|유효 평가 0|0개 요리/.test(s)));
  }
});

test("domain fixtures retain real attributes and explicitly identify the native fat axis", () => {
  const contract = JSON.parse(
    fs.readFileSync(
      new URL(
        "../../ios/TasteBuddy/Resources/TBA/tba-sensory-contract.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const ids = new Set(contract.semantic.attributes.map((a) => a.id));
  for (const domain of ["taste", "aroma", "texture"]) {
    const data = fixture("sensoryRays", "standard", "liking", domain);
    assert(
      data.senses.every(
        (s) =>
          (ids.has(s.id) && s.id.startsWith(domain + ".")) ||
          (domain === "taste" &&
            s.id === "native-axis:fat" &&
            s.name === "지방맛"),
      ),
    );
  }
});

test("experience marbles preserve velocity, collide without overlap, and tint after contact", async () => {
  const { experiencePlan, experienceFrame } = await load("experience");
  for (const scenario of ["standard", "dense", "added"]) {
    const data = fixture("experienceCluster", scenario),
      plan = experiencePlan(data),
      simulation = plan.motion;
    assert.equal(simulation.unresolved, 0, scenario + " missing contacts");
    let previous = experienceFrame(data, 1.9),
      maxStep = 0;
    for (let frame = 58; frame <= 192; frame++) {
      const f = experienceFrame(data, frame / 30);
      for (let a = 0; a < f.dots.length; a++) {
        const d = f.dots[a];
        maxStep = Math.max(
          maxStep,
          Math.hypot(d.x - previous.dots[a].x, d.y - previous.dots[a].y),
        );
        for (let b = a + 1; b < f.dots.length; b++) {
          const e = f.dots[b];
          assert(
            Math.hypot(d.x - e.x, d.y - e.y) >= d.r + e.r - 1e-3,
            scenario + " overlap at " + frame,
          );
        }
      }
      previous = f;
    }
    assert(maxStep < 4.5, scenario + " discontinuity: " + maxStep);
    assert(maxStep > 0.5, scenario + " missing movement");
    const collision = simulation.collisions.some(({ a, b, time }) => {
      const at = experienceFrame(data, time),
        later = experienceFrame(data, time + 0.1);
      const separation = (f) =>
        Math.hypot(f.dots[a].x - f.dots[b].x, f.dots[a].y - f.dots[b].y);
      return separation(later) > separation(at) + 0.5;
    });
    assert(collision, scenario + " missing rebound");
    for (let i = 0; i < plan.marks.length; i++)
      if (plan.marks[i].role === "halo") {
        const contact = simulation.contacts[i];
        assert.equal(experienceFrame(data, contact - 0.02).dots[i].tint, 0);
        assert.equal(experienceFrame(data, contact + 0.26).dots[i].tint, 1);
      }
    const final = experienceFrame(data, 6.4);
    assert.equal(final.dots.length, 126);
    assert(
      final.dots
        .filter((d) => d.role === "record")
        .every((d) => d.r === 10.8 && d.tint === 0),
    );
    assert(
      final.dots
        .filter((d) => d.role === "halo")
        .every((d) => d.r === 9.5 && d.tint === 1),
    );
  }
});

test("experience reserves dark-point clearance, stays smooth, and centres records in their colour groups", async () => {
  const { experiencePlan, experienceFrame } = await load("experience");
  const { TASTE_TOKENS } = await import(
    new URL("../../src/constants/designTokens.ts", import.meta.url).href
  );
  const tokens = new Map(
    Object.values(TASTE_TOKENS).map((t) => [
      t.palette.main,
      t.palette,
    ]),
  );
  for (const scenario of ["standard", "dense", "added"]) {
    const data = fixture("experienceCluster", scenario),
      plan = experiencePlan(data);
    let previous = experienceFrame(data, 6.4 - 1 / 30);
    for (let i = 192; i <= 552; i++) {
      const f = experienceFrame(data, i / 30);
      for (const d of f.dots.filter((d) => d.role === "record"))
        for (const other of f.dots)
          if (d.id !== other.id) {
            const edgeGap =
              Math.hypot(d.x - other.x, d.y - other.y) - d.r - other.r;
            assert(
              edgeGap >= 7 - 1e-3,
              scenario + " protected gap at " + i + ": " + edgeGap,
            );
          }
      assert(
        f.dots.every(
          (d, j) =>
            Math.hypot(d.x - previous.dots[j].x, d.y - previous.dots[j].y) <
            0.5,
        ),
        scenario + " idle discontinuity at " + i,
      );
      previous = f;
    }
    const final = experienceFrame(data, 6.4);
    for (let a = 0; a < final.dots.length; a++)
      for (let b = a + 1; b < final.dots.length; b++)
        assert(
          Math.hypot(
            final.dots[a].x - final.dots[b].x,
            final.dots[a].y - final.dots[b].y,
          ) >=
            final.dots[a].r + final.dots[b].r,
        );
    for (const group of plan.groups) {
      const average = (role) => {
        const marks = final.dots.filter(
          (d) => d.group === group.id && d.role === role,
        );
        return marks.length
          ? marks.reduce(
              (n, d) =>
                n +
                Math.hypot(d.x - group.center.x, d.y - group.center.y) /
                  marks.length,
              0,
            )
          : Infinity;
      };
      assert(
        average("record") < average("halo"),
        scenario + " central records " + group.id,
      );
    }
    const sectors = Array(12).fill(0);
    for (const d of final.dots) {
      sectors[
        Math.floor(
          (((Math.atan2(d.y - 320, d.x - 320) + Math.PI * 2) % (Math.PI * 2)) /
            (Math.PI * 2)) *
            12,
        )
      ]++;
      if (d.role === "halo") {
        const palette = tokens.get(d.color);
        assert(palette);
        assert.equal(d.tintColor.toLowerCase(), palette.tintSurface.toLowerCase());
        assert.equal(d.tint, 1);
      }
    }
    assert(
      sectors.every((n) => n >= 4),
      scenario + " ring coverage",
    );
  }
});

test("experience idle wander is independent, bounded and continuous across its loop", async () => {
  const { experienceIdleOffset } = await load("experience");
  const offsets = [];
  for (let i = 0; i < 126; i++) {
    const id = "record-" + i;
    assert.deepEqual(
      experienceIdleOffset(id, 3.27),
      experienceIdleOffset(id, 3.27),
    );
    for (let f = 0; f <= 360; f++) {
      const p = experienceIdleOffset(id, f / 30),
        next = experienceIdleOffset(id, (f + 1) / 30);
      assert(Math.hypot(p.x, p.y) < 1.87);
      assert(Math.hypot(next.x - p.x, next.y - p.y) < 0.12);
    }
    const epsilon = 0.0001,
      start = experienceIdleOffset(id, epsilon),
      end = experienceIdleOffset(id, 12 - epsilon);
    assert(Math.hypot(start.x + end.x, start.y + end.y) / epsilon < 0.002);
    offsets.push(experienceIdleOffset(id, 6));
  }
  assert(offsets.filter((p) => Math.hypot(p.x, p.y) > 0.1).length > 110);
  assert(
    new Set(offsets.map((p) => p.x.toFixed(5) + ":" + p.y.toFixed(5))).size ===
      126,
  );
});

test("experience idle drift is visible and varies locally instead of rotating the whole ring", async () => {
  const { experienceIdlePosition } = await load("experience");
  const displacements = [],
    angles = [];
  for (let i = 0; i < 126; i++) {
    const angle = (i / 126) * Math.PI * 2,
      rest = { x: 320 + 245 * Math.cos(angle), y: 320 + 245 * Math.sin(angle) };
    const p = experienceIdlePosition(rest, "record-" + i, 1.5);
    displacements.push(Math.hypot(p.x - rest.x, p.y - rest.y));
    const delta = Math.atan2(p.y - 320, p.x - 320) - angle;
    angles.push(Math.atan2(Math.sin(delta), Math.cos(delta)));
    for (const t of [0, 1.5, 6, 11.99]) {
      const a = experienceIdlePosition(rest, "record-" + i, t),
        b = experienceIdlePosition(rest, "record-" + i, t + 12);
      assert(Math.hypot(a.x - b.x, a.y - b.y) < 1e-8);
      assert(Math.hypot(a.x - rest.x, a.y - rest.y) < 10);
    }
  }
  assert(displacements.reduce((a, b) => a + b, 0) / 126 > 0.3);
  assert(Math.max(...angles) - Math.min(...angles) > 0.002);
});

test("sensory ring deduplicates meals and keeps independent proportions in every domain", () => {
  for (const domain of ["taste", "aroma", "texture"]) {
    const data = fixture("sensoryRays", "standard", "liking", domain);
    const original = categoryFrame(data, 1.8);
    data.validMealIds.push(data.validMealIds[0]);
    data.senses[0].mealIds.push(
      data.senses[0].mealIds[0],
      "outside-denominator",
    );
    const f = categoryFrame(data, 1.8);
    assert.equal(f.value, "12");
    assert.equal(f.dots.length, 126);
    assert.equal(
      data.senses.length,
      domain === "taste" ? 6 : domain === "aroma" ? 7 : 8,
    );
    assert.deepEqual(f.dots, original.dots);
    assert.notDeepEqual(f.dots, categoryFrame(data, 7).dots);
    for (const sense of data.senses) {
      const dots = f.dots.filter((d) => d.group === sense.id);
      const numerator = new Set(
        sense.mealIds.filter((id) => data.validMealIds.includes(id)),
      ).size;
      assert.equal(
        dots.filter((d) => d.tint === 0).length,
        Math.round((dots.length * numerator) / 12),
      );
      assert(dots.every((d) => d.r === 9.5 && d.tintColor));
    }
  }
  for (const state of ["empty", "unanswered", "held"]) {
    const f = categoryFrame(fixture("sensoryRays", state), 3, {
      selected: "taste.salty",
    });
    assert.equal(f.value, "—");
    assert.equal(f.dots.length, state === "held" || state === "empty" ? 126 : 0);
    assert.equal(f.lines.filter((l) => l.data).length, 0);
    assert(f.selection.includes("강도 응답 자료 없음"));
  }
  const data = fixture("sensoryRays");
  data.senses[0].intensity = { weak: 0, medium: 0, strong: 0, unanswered: 4 };
  const f = categoryFrame(data, 3, { selected: "taste.sweet" });
  assert(f.selection.includes("강도 미응답 4회"));
  assert(!f.selection.some((s) => s.startsWith("강도 약함")));
});

test("all categories retain bounded periodic idle movement without changing encoded values", async () => {
  const { contextRingScale, CONTEXT_ZIGZAG } = await load("context");
  for (const kind of categories) {
    const data = fixture(kind),
      rest = categoryFrame(data, 0, { playback: "idle" });
    let max = 0;
    for (const t of [0.2, 1, 3, 5, 9, 11.9]) {
      const f = categoryFrame(data, t, { playback: "idle" });
      assert.equal(f.value, rest.value);
      f.dots.forEach((d, i) => {
        max = Math.max(
          max,
          Math.hypot(
            320 +
              (d.x - 320) *
                Math.cos(
                  (kind === "preferenceFocus" || kind === "experienceCluster") ? (-t / 60) * Math.PI * 2 : 0,
                ) -
              (d.y - 320) *
                Math.sin(
                  (kind === "preferenceFocus" || kind === "experienceCluster") ? (-t / 60) * Math.PI * 2 : 0,
                ) -
              rest.dots[i].x,
            320 +
              (d.x - 320) *
                Math.sin(
                  (kind === "preferenceFocus" || kind === "experienceCluster") ? (-t / 60) * Math.PI * 2 : 0,
                ) +
              (d.y - 320) *
                Math.cos(
                  (kind === "preferenceFocus" || kind === "experienceCluster") ? (-t / 60) * Math.PI * 2 : 0,
                ) -
              rest.dots[i].y,
          ),
        );
      });
      if (kind === "contextLayers" || kind === "changeRipples") {
        f.lines
          .filter((l) => l.data !== false)
          .forEach((l) => {
            const original = rest.lines.find((a) => a.id === l.id);
            l.points.forEach((p, i) => {
              max = Math.max(
                max,
                Math.hypot(
                  p.x - original.points[i].x,
                  p.y - original.points[i].y,
                ),
              );
              if (i)
                assert(
                  Math.abs(
                    Math.hypot(p.x - l.points[0].x, p.y - l.points[0].y) -
                      Math.hypot(
                        original.points[i].x - original.points[0].x,
                        original.points[i].y - original.points[0].y,
                      ),
                  ) < 1e-8,
                );
            });
          });
      }
    }
    assert(max > 0.5, kind + " must visibly move");
    const bound = kind === "contextLayers" || kind === "changeRipples"
      ? 2 * CONTEXT_ZIGZAG * contextRingScale(kind === "contextLayers" ? Math.min(data.conditions.length, 4) : 2) + 1
      : kind === "sensoryRays" ? 15 : 12;
    assert(
      max < bound,
      kind + " drift remains bounded",
    );
  }
});

test("sensory groups reveal dark dots before tint dots and preserve final counts", async () => {
  const { sensoryFrame } = await load("sensory");
  const data = fixture("sensoryRays");
  for (let i = 0; i < data.senses.length; i++) {
    const start = 0.05 + (i / 5) * 0.5;
    const early = sensoryFrame(data, start + 0.3).dots.filter(
      (d) => d.group === data.senses[i].id,
    );
    assert(early.some((d) => d.tint === 0 && d.opacity > 0));
    assert(early.filter((d) => d.tint === 1).every((d) => d.opacity === 0));
    const later = sensoryFrame(data, start + 0.9).dots.filter(
      (d) => d.group === data.senses[i].id,
    );
    assert(later.filter((d) => d.tint === 0).every((d) => d.opacity === 1));
    assert(later.some((d) => d.tint === 1 && d.opacity > 0));
  }
  const final = sensoryFrame(data, 1.8);
  assert.equal(final.dots.length, 126);
  assert(final.dots.every((d) => d.opacity === 1 && d.r === 9.5));
});

test("sensory idle has wider independent travel with stable counts and safe bounds", () => {
  const data = fixture("sensoryRays"),
    rest = categoryFrame(data, 0, { playback: "idle" });
  let maximum = 0;
  for (let n = 0; n <= 360; n++) {
    const f = categoryFrame(data, n / 30, { playback: "idle" });
    assert.equal(f.dots.length, 126);
    f.dots.forEach((d, i) => {
      maximum = Math.max(
        maximum,
        Math.hypot(d.x - rest.dots[i].x, d.y - rest.dots[i].y),
      );
      assert(
        d.x - d.r >= 24 &&
          d.x + d.r <= 616 &&
          d.y - d.r >= 24 &&
          d.y + d.r <= 616,
      );
      assert(Math.hypot(d.x - 320, d.y - 320) - d.r > 104);
      assert.equal(d.tint, rest.dots[i].tint);
    });
  }
  assert(maximum > 8 && maximum < 15);
});

test("sensory per-dot speeds are stable and span slow to fast", async () => {
  const { sensoryIdleSpeed } = await load("geometry");
  const f = categoryFrame(fixture("sensoryRays"), 0, { playback: "idle" });
  const speeds = f.dots.map((d) => sensoryIdleSpeed(d.id));
  assert.deepEqual([...new Set(speeds)].sort(), [1, 2, 3, 4]);
  assert.deepEqual(
    speeds,
    f.dots.map((d) => sensoryIdleSpeed(d.id)),
  );
  const rotated = categoryFrame(fixture("sensoryRays"), 0, {
    playback: "idle",
    rotation: Math.PI / 2,
  });
  f.dots.forEach((d, i) => {
    assert(Math.abs(rotated.dots[i].x - (640 - d.y)) < 1e-8);
    assert(Math.abs(rotated.dots[i].y - d.x) < 1e-8);
    assert.equal(rotated.dots[i].tint, d.tint);
  });
});

test("preference rotates clockwise after entry and returns seamlessly after 60 seconds", () => {
  const data = fixture("preferenceFocus");
  const a = categoryFrame(data, 0, { playback: "idle" });
  const b = categoryFrame(data, 15, { playback: "idle" });
  a.dots.forEach((d, i) => {
    assert(Math.hypot(b.dots[i].x - (640 - d.y), b.dots[i].y - d.x) < 2);
    assert.equal(d.color, b.dots[i].color);
    assert.equal(d.opacity, b.dots[i].opacity);
  });
  assert.equal(categoryLoopDuration("preferenceFocus"), 60);
});

test("context enters once and keeps its idle shape indefinitely without timed contraction", async () => {
  const { contextFrame } = await load("context");
  const data = fixture("contextLayers");
  const visible = (f) => f.dots.filter((d) => d.opacity > 0.001);
  const start = contextFrame(data, 0, { playback: "intro" });
  assert.equal(visible(start).length, 1);
  assert.equal(visible(start)[0].id, "context-seed");
  const settled = contextFrame(data, 1.8, { playback: "intro" });
  assert.equal(settled.dots.length, 144);
  assert.equal(settled.motionPhase, "대기");
  assert.equal(settled.summaryOpacity, 1);
  for (const time of [13.8, 14.5, 15.5, 15.6, 27.6, 60, 3600]) {
    const held = contextFrame(data, time, { playback: "intro" });
    assert.equal(held.motionPhase, "대기");
    assert.equal(held.summaryOpacity, 1);
    assert.equal(held.dots.length, settled.dots.length);
    assert(held.dots.every((d) => d.r === 9.5 && d.opacity === 1));
  }
  assert.deepEqual(contextFrame(data, 4.8), contextFrame(data, 12.8));
  assert.equal(categoryLoopDuration("contextLayers"), 8);
  assert.equal(categoryLoopDuration("changeRipples"), 8);
  const maximum = fs.readFileSync(
    new URL("../src/TasteDataCategoryMotion/context.ts", import.meta.url),
    "utf8",
  );
  assert(!maximum.includes("Math.random"));
  for (let step = 0; step < 468; step++) {
    const f = contextFrame(data, step / 30, { playback: "intro" });
    f.dots.forEach((d) => {
      assert(Number.isFinite(d.x) && Number.isFinite(d.y));
      assert(
        d.x - d.r >= 24 &&
          d.x + d.r <= 616 &&
          d.y - d.r >= 24 &&
          d.y + d.r <= 616,
      );
      if (f.summaryOpacity > 0.01 && d.opacity > 0.01)
        assert(Math.hypot(d.x - 320, d.y - 320) - d.r >= 104);
    });
  }
  const reduced = contextFrame(data, 0, { playback: "reduced" });
  assert.equal(reduced.summaryOpacity, 1);
  assert.equal(reduced.dots.length, 144);
  assert.deepEqual(reduced, contextFrame(data, 99, { playback: "reduced" }));
});

test("context dots match the base ring size and retain equal neighbour spacing without lines", async () => {
  const { contextRingScale } = await load("context");
  for (const scenario of ["standard", "dense", "single"]) {
    const data = fixture("contextLayers", scenario);
    const scale = contextRingScale(Math.min(data.conditions.length, 4));
    const rest = categoryFrame(data, 0, {playback: "reduced"});
    const outer = Math.max(...rest.dots.map(d => Math.hypot(d.x - 320, d.y - 320) + d.r));
    assert(Math.abs(outer * 2 * 340 / 640 - 302.8125) < 1e-8);
    for (const time of [0, 1.5, 6, 11.9]) {
      const f = categoryFrame(data, time, { playback: "idle" });
      assert.equal(f.lines.length, 0);
      for (const condition of data.conditions.slice(0, 4)) {
        const dots = f.dots.filter((d) => d.group === condition.id);
        dots.forEach((d, i) => {
          assert.equal(d.r, 9.5);
          const next = dots[(i + 1) % dots.length];
          const first = dots[0],
            second = dots[1];
          const spacing = Math.hypot(first.x - second.x, first.y - second.y);
          assert(spacing >= 19 && spacing <= 26 * scale + 1e-8);
          assert(
            Math.abs(Math.hypot(d.x - next.x, d.y - next.y) - spacing) < 1e-8,
          );
        });
      }
    }
  }
});

test("context zigzag alternates radial offsets without seam gaps or overlapping layers", async () => {
  const { contextRingRadius, contextRingScale, contextIdleZigzag, CONTEXT_ZIGZAG, CONTEXT_IDLE } =
    await load("context");
  const data = fixture("contextLayers", "dense");
  const scale = contextRingScale(4);
  for (const time of [0, 2, 4, 6, CONTEXT_IDLE - 0.1]) {
    const f = categoryFrame(data, time, { playback: "idle" });
    data.conditions.slice(0, 4).forEach((condition, layer) => {
      const dots = f.dots.filter((d) => d.group === condition.id);
      assert.equal(dots.length % 2, 0);
      dots.forEach((d, i) => {
        const radius = Math.hypot(d.x - 320, d.y - 320);
        assert(
          Math.abs(
            radius -
              contextRingRadius(layer) * scale -
              (i % 2 === 0 ? CONTEXT_ZIGZAG : -CONTEXT_ZIGZAG) *
                contextIdleZigzag(time) * scale,
          ) < 1e-8,
        );
      });
    });
    for (let i = 0; i < f.dots.length; i++)
      for (let j = i + 1; j < f.dots.length; j++) {
        const a = f.dots[i],
          b = f.dots[j];
        assert(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r);
      }
  }
});

test("context idle passes through circle and reversed zigzag while retaining identity and reduced motion", async () => {
  const { contextRingRadius, contextRingScale, CONTEXT_ZIGZAG, CONTEXT_IDLE } = await load("context");
  const data = fixture("contextLayers");
  const scale = contextRingScale(data.conditions.length);
  const samples = [0, 2, 4, 6, CONTEXT_IDLE].map((t) =>
    categoryFrame(data, t, { playback: "idle" }),
  );
  for (let k = 0; k < samples.length; k++) {
    const f = samples[k];
    assert.equal(f.dots.length, 144);
    data.conditions.forEach((condition, layer) => {
      const dots = f.dots.filter((d) => d.group === condition.id);
      dots.forEach((d, i) => {
        const expected =
          contextRingRadius(layer) * scale +
          (i % 2 === 0 ? CONTEXT_ZIGZAG : -CONTEXT_ZIGZAG) *
            [1, 0, -1, 0, 1][k] * scale;
        assert(Math.abs(Math.hypot(d.x - 320, d.y - 320) - expected) < 1e-8);
      });
    });
    assert.deepEqual(
      f.dots.map(({ id, color, tint, r }) => ({ id, color, tint, r })),
      samples[0].dots.map(({ id, color, tint, r }) => ({ id, color, tint, r })),
    );
  }
});

test("context entrance grows packed branches before expanding to the unchanged settled layout", async () => {
  const { contextFrame } = await load("context");
  const { contextEntry } = await load("context-entry");
  const data = fixture("contextLayers");
  const visible = (t) =>
    contextFrame(data, t).dots.filter(
      (d) => d.id !== "context-seed" && d.opacity > 0.001,
    );
  assert.equal(visible(0).length, 0);
  assert.equal(visible(0.06).length, 6);
  assert(visible(0.3).length > 6 && visible(0.3).length < 144);
  assert.equal(visible(0.65).length, 144);
  assert(visible(0.7).every((d) => Math.hypot(d.x - 320, d.y - 320) < 80));
  assert(
    visible(1.8).every(
      (d) => Math.hypot(d.x - 320, d.y - 320) > 120 && d.r === 9.5,
    ),
  );
  assert.deepEqual(
    contextFrame(data, 1.8).dots,
    contextFrame(data, 0, { playback: "reduced" }).dots,
  );
  for (const count of [36, 144, 216]) {
    assert.equal(contextEntry(count, 0).expansion, 0);
    assert.equal(contextEntry(count, 0.7).expansion, 0);
    assert.equal(contextEntry(count, 1.9).expansion, 1);
  }
});

test("scroll seeks replay the cached entrance backwards after a long idle", async () => {
  for (const kind of ["contextLayers", "changeRipples"]) {
    for (const scenario of ["standard", "dense", "empty"]) {
      const data = fixture(kind, scenario);
      const entrance = Array.from({length: 55}, (_, frame) => categoryFrame(data, frame / 30, {playback: "intro"}));
      categoryFrame(data, 3600, {playback: "intro"});
      for (let frame = 54; frame >= 0; frame--) {
        assert.deepEqual(categoryFrame(data, frame / 30, {playback: "intro"}), entrance[frame]);
      }
      assert.equal(entrance[0].summaryOpacity, scenario === "empty" ? 1 : 0);
    }
  }
});

test("context idle reversals have continuous velocity and acceleration with purely radial travel", async () => {
  const { contextIdleZigzag, CONTEXT_IDLE } = await load("context");
  const h = 0.001;
  for (const t of [0, CONTEXT_IDLE / 2, CONTEXT_IDLE]) {
    const a = contextIdleZigzag(t - h),
      b = contextIdleZigzag(t),
      c = contextIdleZigzag(t + h);
    assert(Math.abs((c - a) / (2 * h)) < 1e-6);
    assert(Math.abs((c - 2 * b + a) / (h * h)) < 0.001);
  }
  const data = fixture("contextLayers"),
    rest = categoryFrame(data, 0, { playback: "idle" });
  for (let i = 0; i <= 360; i++) {
    const f = categoryFrame(data, i / 30, { playback: "idle" });
    f.dots.forEach((d, j) => {
      const a = rest.dots[j];
      assert(
        Math.abs((d.x - 320) * (a.y - 320) - (d.y - 320) * (a.x - 320)) < 1e-7,
      );
    });
  }
});

test("change and context share the same ring geometry, idle wave and reversed entrance", async () => {
  const { contextFrame } = await load("context");
  const context = fixture("contextLayers");
  context.conditions = context.conditions.slice(0, 2);
  const change = fixture("changeRipples");
  for (const t of [
    0,
    0.3,
    0.6,
    1.2,
    1.8,
    4.8,
    7.8,
    10.8,
    13.8,
    14.5,
    15.5,
    60,
    3600,
  ]) {
    const a = contextFrame(context, t, { playback: "intro" });
    const b = categoryFrame(change, t, { playback: "intro" });
    assert.deepEqual(
      a.dots.map(({ x, y, r, opacity }) => ({ x, y, r, opacity })),
      b.dots.map(({ x, y, r, opacity }) => ({ x, y, r, opacity })),
    );
    assert.equal(a.motionPhase, b.motionPhase);
    assert.equal(a.summaryOpacity, b.summaryOpacity);
  }
  for (const state of ["empty", "held", "unanswered"]) {
    const f = categoryFrame(fixture("changeRipples", state), 5);
    assert.equal(f.dots.length, state === "held" ? 126 : state === "empty" ? 84 : 0);
    assert.equal(f.value, "— → —");
  }
  const f = categoryFrame(change, 0, { playback: "reduced" });
  assert.equal(f.dots.length, 84);
  assert.deepEqual(
    f.dots,
    categoryFrame(change, 123, { playback: "reduced" }).dots,
  );
});


test("empty categories retain their own basic shapes without inventing records or zero values", () => {
  const counts = [126, 126, 126, 144, 84];
  for (const [i, kind] of categories.entries()) {
    const data = fixture(kind, "empty");
    const before = JSON.stringify(data);
    const frame = categoryFrame(data, 0, {playback: "reduced"});
    assert.equal(frame.state, "noData");
    assert(frame.value.includes("—"));
    assert.equal(frame.dots.length, counts[i]);
    assert(frame.dots.every(d => d.color === "#E4E4E4" && d.data === false && !d.group && !d.role && d.opacity === 1));
    assert.equal(frame.lines.length, 0);
    assert.equal(frame.labels.length, 0);
    assert.equal(frame.summaryOpacity, 1);
    assert.match(frame.legend, /기록·평가·조건 수를 나타내지 않음/);
    assert.deepEqual(frame, categoryFrame(data, 60, {playback: "idle", selected: "missing"}));
    assert.equal(JSON.stringify(data), before);
    if (kind !== "experienceCluster") {
      const populated = categoryFrame(fixture(kind), 0, {playback: "reduced"});
      const shape = f => f.dots.map(({x, y, r}) => ({x, y, r})).sort((a,b) => a.x - b.x || a.y - b.y);
      assert.deepEqual(shape(frame), shape(populated), kind + ' retains its own geometry');
    }
  }
  assert.equal(categoryFrame(fixture("experienceCluster", "zero"), 0, {playback: "reduced"}).value, "0");
});

test("held categories use the basic neutral ring colour without presenting decorative dots as data", () => {
  for (const kind of categories) {
    const data = fixture(kind, "held");
    const frame = categoryFrame(data, 0, {playback: "reduced"});
    assert.equal(frame.state, "held");
    assert(frame.value.includes("—"));
    assert.equal(frame.dots.length, 126);
    assert(frame.dots.every(d => d.color === "#E8E8E8" && d.tintColor === "#E8E8E8" && d.data === false && !d.group));
    assert(frame.dots.every(d => d.opacity >= 0 && d.opacity <= 1));
    assert.equal(frame.lines.length, 0);
    assert(frame.notes.includes("해석 보류"));
    assert.deepEqual(frame, categoryFrame(data, 60, {playback: "reduced"}));
  }
});


test("experience settlement retains every simulated endpoint without a position snap", async () => {
  const {experiencePlan, experienceFrame, EXPERIENCE_INTRO} = await load("experience");
  for (const scenario of ["standard", "dense", "added"]) {
    const data = fixture("experienceCluster", scenario);
    const plan = experiencePlan(data);
    const endpoints = plan.motion.samples.at(-1).positions;
    const settled = experienceFrame(data, EXPERIENCE_INTRO);
    const before = experienceFrame(data, EXPERIENCE_INTRO - 0.00001);
    const after = experienceFrame(data, EXPERIENCE_INTRO + 0.00001);
    settled.dots.forEach((dot, i) => {
      assert(Math.hypot(dot.x-endpoints[i].x, dot.y-endpoints[i].y)<1e-8, scenario+' endpoint '+dot.id);
      assert(Math.hypot(dot.x-before.dots[i].x, dot.y-before.dots[i].y)<0.01, scenario+' arrival '+dot.id);
      assert(Math.hypot(dot.x-after.dots[i].x, dot.y-after.dots[i].y)<0.01, scenario+' departure '+dot.id);
    });
  }
});

test("experience rotates clockwise only after settlement and shares ring drag geometry", async () => {
  const {experienceFrame, EXPERIENCE_INTRO} = await load("experience");
  const data = fixture("experienceCluster");
  for(const time of [0, 1.2, 3, EXPERIENCE_INTRO]) {
    const raw = experienceFrame(data,time), shown = categoryFrame(data,time);
    raw.dots.forEach((d,i)=>assert(Math.hypot(d.x-shown.dots[i].x,d.y-shown.dots[i].y)<1e-8));
  }
  const start=categoryFrame(data,0,{playback:"idle"});
  const later=categoryFrame(data,12,{playback:"idle"});
  const angle=2*Math.PI*12/60, c=Math.cos(angle), s=Math.sin(angle);
  start.dots.forEach((d,i)=>{
    const p=later.dots[i];
    assert(Math.abs(p.x-(320+(d.x-320)*c-(d.y-320)*s))<1e-8);
    assert(Math.abs(p.y-(320+(d.x-320)*s+(d.y-320)*c))<1e-8);
    assert.equal(p.r,d.r); assert.equal(p.color,d.color); assert.equal(p.tint,d.tint);
  });
  const dragged=categoryFrame(data,0,{playback:"idle",rotation:Math.PI/2});
  start.dots.forEach((d,i)=>{
    assert(Math.abs(dragged.dots[i].x-(640-d.y))<1e-8);
    assert(Math.abs(dragged.dots[i].y-d.x)<1e-8);
  });
  assert.equal(categoryLoopDuration("experienceCluster"),60);
  assert.deepEqual(categoryFrame(data,0,{playback:"reduced"}),categoryFrame(data,123,{playback:"reduced"}));
  const scrolled=categoryFrame(data,3,{rotationTime:12,rotation:0.25});
  assert(scrolled.dots.every(d=>Number.isFinite(d.x)&&Number.isFinite(d.y)));
});
