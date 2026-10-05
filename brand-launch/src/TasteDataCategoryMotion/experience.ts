import { motionTint } from "./colors";
import { insightFrame, insightIntroDuration, palette } from "../taste-motion";
import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import type { ExperienceData, Frame, Options, Point } from "./types";
import {
  simulateExperience,
  simulationSample,
  type ExperienceSimulation,
} from "./experience-physics";

export const EXPERIENCE_INTRO = 6.4;
export const EXPERIENCE_DOTS = 126;
const TAU = Math.PI * 2;
const DOT_RADIUS = 9.5;
const CORE_GROWTH = 1.3;
const CLEARANCE = 7;
const IDLE_ROOM = 4;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const seed = (id: string) => {
  let n = 42;
  for (const c of id) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
// Independent seeded paths share a seamless 12s period, but no shared pause or breathing envelope.
// Each offset stays within 1.87 units, inside the 4-unit pairwise clearance reserve.
export function experienceIdleOffset(id: string, time: number): Point {
  const phase = ((Math.max(0, time) % 12) / 12) * TAU;
  const axis = (name: string) =>
    [2, 3, 5].reduce((sum, frequency, i) => {
      const offset = seed(id + ":idle:" + name + ":" + i) * TAU;
      return (
        sum +
        [0.52, 0.3, 0.18][i] *
          (Math.sin(phase * frequency + offset) - Math.sin(offset))
      );
    }, 0) * 0.66;
  return { x: axis("x"), y: axis("y") };
}
export function experienceIdlePosition(
  rest: Point,
  id: string,
  time: number,
): Point {
  const individual = experienceIdleOffset(id, time);
  return { x: rest.x + individual.x, y: rest.y + individual.y };
}
const polar = (a: number, r: number): Point => ({
  x: 320 + Math.cos(a) * r,
  y: 320 + Math.sin(a) * r,
});
const scaled = (p: Point): Point => ({
  x: 320 + (p.x - 320) * 0.92,
  y: 320 + (p.y - 320) * 0.92,
});
const around = (p: Point, a: number, r: number): Point => ({
  x: p.x + Math.cos(a) * r,
  y: p.y + Math.sin(a) * r,
});
export function distributeDots(
  weights: number[],
  total = EXPERIENCE_DOTS,
): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const raw = weights.map((n) => (n / sum) * total),
    counts = raw.map(Math.floor);
  const order = raw
    .map((_, i) => i)
    .sort((a, b) => raw[b] - counts[b] - (raw[a] - counts[a]) || a - b);
  for (const i of order.slice(0, total - counts.reduce((a, b) => a + b, 0)))
    counts[i]++;
  return counts;
}
type Group = {
  id: string;
  name: string;
  color: string;
  tintColor: string;
  records: ExperienceData["records"];
  center: Point;
  quota: number;
  cores: number;
  angle: number;
};
type Mark = {
  id: string;
  group: Group;
  role: "record" | "halo";
  source: number;
  target: Point;
  core: number;
  rank: number;
  at: number;
};
type Plan = {
  groups: Group[];
  marks: Mark[];
  compressed: boolean;
  recordCount: number;
  rest: Point[];
  motion: ExperienceSimulation;
};
const plans = new WeakMap<ExperienceData, Plan>();
const scatterFrame = insightFrame(insightIntroDuration);
const scatter = scatterFrame.dots.map(scaled);

const bound = (p: Point, inset = 0): Point =>
  polar(
    Math.atan2(p.y - 320, p.x - 320),
    Math.max(
      207 + inset,
      Math.min(284 - inset, Math.hypot(p.x - 320, p.y - 320)),
    ),
  );

// Solve all participating pairs together, so a point cannot jump between isolated pockets.
// Idle anchors reserve room for independent motion; no constraint projection runs during idle.
function separate(
  positions: Point[],
  marks: Mark[],
  radii: number[],
  shields: number[],
  room = 0,
) {
  const inset = room ? 2 : 0;
  // Pair constraints do not change while the positions are being relaxed.
  const pairs: {a: number; b: number; minimum: number}[] = [];
  for (let a = 0; a < marks.length; a++)
    for (let b = a + 1; b < marks.length; b++) {
      const strength = Math.max(shields[a], shields[b]);
      if (strength === 0 && !room) continue;
      const bothHalos = marks[a].role === "halo" && marks[b].role === "halo";
      if (bothHalos && !room) continue;
      pairs.push({a, b, minimum: radii[a] + radii[b] + (bothHalos ? 1 + room : CLEARANCE * strength + room)});
    }
  for (let pass = 0; pass < (room ? 700 : 100); pass++) {
    let overlap = 0;
    for (const {a, b, minimum} of pairs) {
        const pa = positions[a], pb = positions[b];
        const dx = pb.x - pa.x, dy = pb.y - pa.y;
        if (dx >= minimum || dx <= -minimum || dy >= minimum || dy <= -minimum) continue;
        const d = distance(pa, pb);
        if (d >= minimum) continue;
        overlap = Math.max(overlap, minimum - d);
        const amount = (minimum - d + 0.0001) / 2;
        const angle =
          d > 0.001
            ? Math.atan2(pb.y - pa.y, pb.x - pa.x)
            : seed(marks[a].id) * TAU;
        positions[a] = bound(around(pa, angle + Math.PI, amount), inset);
        positions[b] = bound(around(pb, angle, amount), inset);
      }
    if (overlap < 0.0005) break;
  }
}

export function experiencePlan(data: ExperienceData): Plan {
  const cached = plans.get(data);
  if (cached) return cached;
  const byMenu = new Map<string, ExperienceData["records"]>();
  for (const record of [...data.records].sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    const key = record.identity
      ? record.identity.kind + ":" + record.identity.id
      : "unconfirmed";
    byMenu.set(key, [...(byMenu.get(key) || []), record]);
  }
  const entries = [...byMenu.entries()].sort(([a], [b]) => a.localeCompare(b));
  const weights = entries.map(([, records]) => records.length),
    quotas = distributeDots(weights);
  const compressed = data.records.length > EXPERIENCE_DOTS;
  // Over the fixed point budget, use an explicitly labelled ratio summary rather than invented record counts.
  const coreCounts = compressed
    ? distributeDots(weights, 63).map((n, i) =>
        Math.min(quotas[i], Math.max(n, quotas[i] > 0 ? 1 : 0)),
      )
    : weights;
  const groups: Group[] = entries.map(([id, records], i) => {
    const angle = -Math.PI / 2 + (i * TAU) / Math.max(1, entries.length);
    return {
      id,
      records,
      name: records[0].identity?.name || "확인 필요",
      color: id === "unconfirmed" ? "#95867A" : palette[i % 5],
      tintColor: motionTint(TASTE_TOKENS[id === "unconfirmed" ? "fat" : TASTE_IDS[i % 5]].palette),
      center: polar(angle, 200 + (seed(id) - 0.5) * 10),
      quota: quotas[i],
      cores: coreCounts[i],
      angle,
    };
  });
  const marks: Mark[] = [];
  for (const group of groups) {
    const spacing = Math.min(22, 62 / Math.sqrt(Math.max(1, group.cores - 1)));
    const haloCounts = distributeDots(
      Array.from({ length: group.cores }, () => 1),
      group.quota - group.cores,
    );
    for (let index = 0; index < group.cores; index++) {
      const angle = index * 2.3999632297 + seed(group.id) * TAU,
        rad = spacing * Math.sqrt(index);
      const core = marks.length,
        target = around(group.center, angle, rad);
      marks.push({
        id: compressed
          ? "ratio:" + group.id + ":" + index
          : group.records[index].id,
        group,
        role: "record",
        source: -1,
        target,
        core,
        rank: 0,
        at: 0,
      });
      for (let rank = 0; rank < haloCounts[index]; rank++) {
        const offsetAngle = seed(marks[core].id + ":" + rank) * TAU;
        const offsetRadius =
          10 + seed(group.id + ":" + index + ":" + rank) * 20;
        marks.push({
          id: marks[core].id + ":halo:" + rank,
          group,
          role: "halo",
          source: -1,
          target: around(target, offsetAngle, offsetRadius),
          core,
          rank,
          at:
            2.9 +
            seed(marks[core].id) * 0.3 +
            (haloCounts[index] > 1
              ? (rank / (haloCounts[index] - 1)) * 2.3
              : 0),
        });
      }
    }
  }
  // Each menu owns one contiguous set of ring slots, proportional to its records.
  // This prevents a large colour group from spilling into unrelated gaps around the ring.
  const angleOf = (p: Point) =>
    (Math.atan2(p.y - 320, p.x - 320) + Math.PI / 2 + TAU) % TAU;
  const orderedSlots = scatter
    .map((_, i) => i)
    .sort((a, b) => angleOf(scatter[a]) - angleOf(scatter[b]) || a - b);
  let slotOffset = 0;
  for (const group of groups) {
    const slots = orderedSlots.slice(slotOffset, slotOffset + group.quota);
    slotOffset += group.quota;
    const candidates = marks.flatMap((mark, m) =>
      mark.group === group
        ? slots.map((s) => ({
            m,
            s,
            cost:
              distance(scatter[s], mark.target) + seed(mark.id + ":" + s) * 30,
          }))
        : [],
    );
    candidates.sort((a, b) => a.cost - b.cost || a.m - b.m || a.s - b.s);
    const assigned = new Set<number>();
    for (const c of candidates)
      if (marks[c.m].source < 0 && !assigned.has(c.s)) {
        marks[c.m].source = c.s;
        assigned.add(c.s);
      }
  }
  for (const mark of marks) mark.target = scatter[mark.source];
  const rest = marks.map((mark) => bound(scatter[mark.source], 2));
  // Keep the same 126 occupied ring slots. Within each colour's own area, assign
  // its central slots to records and the surrounding slots to tint companions.
  for (const group of groups) {
    const members = marks
      .map((mark, i) => ({ mark, i }))
      .filter(({ mark }) => mark.group === group);
    const centroid = members.reduce(
      (p, { mark }) => ({
        x: p.x + scatter[mark.source].x / members.length,
        y: p.y + scatter[mark.source].y / members.length,
      }),
      { x: 0, y: 0 },
    );
    const radius = members.reduce(
      (r, { mark }) =>
        r + distance(scatter[mark.source], { x: 320, y: 320 }) / members.length,
      0,
    );
    group.center = polar(
      Math.atan2(centroid.y - 320, centroid.x - 320),
      radius,
    );
    group.angle = Math.atan2(centroid.y - 320, centroid.x - 320);
    const slots = members
      .map(({ mark }) => mark.source)
      .sort(
        (a, b) =>
          distance(scatter[a], group.center) -
            distance(scatter[b], group.center) || a - b,
      );
    for (const role of ["record", "halo"] as const) {
      const roleSlots =
        role === "record"
          ? slots.slice(0, group.cores)
          : slots.slice(group.cores);
      const assignments = members
        .filter(({ mark }) => mark.role === role)
        .flatMap(({ mark, i }) =>
          roleSlots.map((slot) => ({
            i,
            slot,
            cost: distance(scatter[mark.source], scatter[slot]),
          })),
        );
      assignments.sort(
        (a, b) => a.cost - b.cost || a.i - b.i || a.slot - b.slot,
      );
      const usedMarks = new Set<number>(),
        usedSlots = new Set<number>();
      for (const { i, slot } of assignments)
        if (!usedMarks.has(i) && !usedSlots.has(slot)) {
          rest[i] = bound(scatter[slot], 2);
          marks[i].source = slot;
          usedMarks.add(i);
          usedSlots.add(slot);
        }
    }
  }
  // Reassign nearby same-menu pairs with balanced capacity. There are no orbital target slots.
  for (const group of groups) {
    const coreIndices = marks
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.group.id === group.id && m.role === "record")
      .map(({ i }) => i);
    const halos = marks
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.group.id === group.id && m.role === "halo");
    const capacities = distributeDots(
      coreIndices.map(() => 1),
      halos.length,
    );
    const pairs = halos.flatMap(({ m, i }) =>
      coreIndices.map((c, rank) => {
        const gap = distance(scatter[m.source], scatter[marks[c].source]);
        return { i, c, rank, cost: gap + (gap < 24 ? 64 : 0) };
      }),
    );
    pairs.sort((a, b) => a.cost - b.cost || a.i - b.i || a.c - b.c);
    const assigned = new Set<number>();
    for (const pair of pairs)
      if (!assigned.has(pair.i) && capacities[pair.rank] > 0) {
        marks[pair.i].core = pair.c;
        capacities[pair.rank]--;
        assigned.add(pair.i);
      }
  }
  for (const [coreIndex, core] of marks.entries())
    if (core.role === "record") {
      const followers = marks
        .filter((m) => m.role === "halo" && m.core === coreIndex)
        .sort((a, b) => {
          const gapA = distance(scatter[a.source], scatter[core.source]);
          const gapB = distance(scatter[b.source], scatter[core.source]);
          return (
            gapA + (gapA < 24 ? 64 : 0) - gapB - (gapB < 24 ? 64 : 0) ||
            a.rank - b.rank
          );
        });
      followers.forEach(
        (mark, rank) =>
          (mark.at =
            2.65 +
            seed(core.id) * 0.2 +
            (followers.length > 1
              ? (rank / (followers.length - 1)) * 2.15
              : 0)),
      );
    }
  separate(
    rest,
    marks,
    marks.map(
      (mark) => DOT_RADIUS + (mark.role === "record" ? CORE_GROWTH : 0),
    ),
    marks.map((mark) => (mark.role === "record" ? 1 : 0)),
    IDLE_ROOM,
  );
  const motion = simulateExperience(
    marks.map((mark, i) => ({
      id: mark.id,
      group: mark.group.id,
      record: mark.role === "record",
      partner: mark.core,
      at: mark.at,
      start: scatter[mark.source],
      goal: rest[i],
    })),
    insightIntroDuration,
    EXPERIENCE_INTRO,
  );
  const plan = {
    motion,
    groups,
    marks,
    compressed,
    recordCount: data.records.length,
    // Idle starts at the actual collision endpoint, never at the separately calculated target.
    rest: motion.samples[motion.samples.length - 1].positions.map((point) => ({ ...point })),
  };
  plans.set(data, plan);
  return plan;
}

export function experienceFrame(
  data: ExperienceData,
  time: number,
  options: Options = {},
): Frame {
  const plan = experiencePlan(data),
    reduced = options.playback === "reduced";
  const settled = reduced || options.playback === "idle",
    t = settled ? EXPERIENCE_INTRO : Math.max(0, time);
  const ambient = reduced
    ? 0
    : options.playback === "idle"
      ? Math.max(0, time)
      : Math.max(0, time - EXPERIENCE_INTRO);
  const f: Frame = {
    dots: [],
    lines: [],
    bridges: [],
    labels: [],
    title: "경험",
    value:
      data.state === "valid"
        ? String(new Set(data.records.map((r) => r.mealId)).size)
        : "—",
    unit: "번의 식사",
    notes: [],
    legend:
      "미각 팔레트 색 = 메뉴 구분 · 진한 점 = 기록 · 연한 점 = 충돌한 주변 표현점",
    summaryOpacity: ease((t - 5.9) / 0.5),
    choices: [],
    selection: [],
    state: data.state,
  };
  if (!plan.recordCount) {
    f.notes = [
      data.state === "valid"
        ? "0개 요리 기록"
        : {
            noData: "자료 없음",
            unanswered: "미응답",
            held: "해석 보류",
            unlinked: "연결 미확인",
          }[data.state] || "자료 없음",
    ];
    return f;
  }
  const ring = insightFrame(Math.min(t, insightIntroDuration));
  const sample = simulationSample(plan.motion, t - insightIntroDuration);
  const finished = t >= EXPERIENCE_INTRO;
  const positions = finished
    ? plan.rest.map((p, i) =>
        experienceIdlePosition(p, plan.marks[i].id, ambient),
      )
    : sample.positions;
  const growths = plan.marks.map((mark, i) =>
    mark.role === "record" ? (finished ? 1 : sample.growth[i]) : 0,
  );
  const tints = plan.marks.map((mark, i) =>
    mark.role === "halo" ? (finished ? 1 : sample.tint[i]) : 0,
  );
  const radii = growths.map((growth) => DOT_RADIUS + CORE_GROWTH * growth);
  plan.marks.forEach((mark, index) => {
    const original = ring.dots[mark.source];
    let point = scaled(original),
      radius = original.radius,
      opacity = original.opacity;
    if (t > 1.6 && t <= insightIntroDuration) {
      const handoff = ease((t - 1.6) / (insightIntroDuration - 1.6));
      point = {
        x: mix(point.x, plan.motion.start[index].x, handoff),
        y: mix(point.y, plan.motion.start[index].y, handoff),
      };
    }
    if (t > insightIntroDuration) {
      const p = positions[index],
        a = Math.atan2(p.y - 320, p.x - 320),
        r = Math.hypot(p.x - 320, p.y - 320);
      point = polar(a, Math.max(207, Math.min(284, r)));
      radius = radii[index];
      const base = mix(
        scatterFrame.dots[mark.source].opacity,
        0.58,
        ease((t - insightIntroDuration) / 0.4),
      );
      if (mark.role === "record") {
        opacity = mix(base, 0.98, growths[index]);
      } else opacity = mix(base, 1, tints[index]);
    }
    f.dots.push({
      ...point,
      id: mark.id,
      r: radius,
      color: mark.group.color,
      tintColor: mark.group.tintColor,
      opacity:
        opacity *
        (options.selected && options.selected !== mark.group.id ? 0.3 : 1),
      group: mark.group.id,
      role: mark.role,
      tint: tints[index],
    });
  });
  if (t < insightIntroDuration) {
    const owner = new Map(plan.marks.map((mark, i) => [mark.source, i]));
    for (const bridge of ring.bridges) {
      const pi = owner.get(bridge.parent),
        ci = owner.get(bridge.child);
      if (pi === undefined || ci === undefined) continue;
      const parent = plan.marks[pi],
        child = plan.marks[ci];
      if (parent.group.id !== child.group.id) continue;
      f.bridges!.push({
        id: "entry:" + bridge.child,
        points: bridge.points.map(scaled),
        color: child.group.color,
        opacity: Math.min(f.dots[pi].opacity, f.dots[ci].opacity),
      });
    }
  }
  for (const group of plan.groups) {
    const denseLabels = plan.groups.length > 6;
    f.choices.push({
      id: group.id,
      label:
        group.name + (denseLabels ? " · " + group.records.length + "개" : ""),
    });
    const label = polar(group.angle, 168);
    // The dense fixture keeps counts in the selection list to prevent small sectors' labels overlapping.
    if (!denseLabels || options.selected === group.id)
      f.labels.push({
        ...label,
        id: group.id,
        text: group.name,
        sub: group.records.length + "개 기록",
        group: group.id,
        anchor: "middle",
      });
    if (options.selected === group.id)
      f.selection = [
        group.name,
        new Set(group.records.map((r) => r.mealId)).size +
          "번 식사 · " +
          group.records.length +
          "개 요리 기록",
        group.quota +
          "개 점 = 진한 " +
          group.cores +
          " + 연한 " +
          (group.quota - group.cores),
        group.id === "unconfirmed" ? "정체성 확인 필요" : "같은 메뉴의 기록",
      ];
  }
  f.notes = [
    plan.recordCount + "개 요리 기록 · 전체 126개 표현점",
    plan.marks.filter((m) => m.role === "record").length +
      "개 진한 점 · " +
      plan.marks.filter((m) => m.role === "halo").length +
      "개 연한 점",
    plan.compressed
      ? "126건 초과: 진한 점도 비율로 축약"
      : "진한 점 1개 = 기록 1개 · 충돌 후 조금 커지고 주변 간격 유지",
    "가까운 점끼리 끌림 → 구슬처럼 충돌 · 관성을 유지하며 부드럽게 움직임",
  ];
  return f;
}
