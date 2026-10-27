import { motionTint } from "./colors";
import { contextEntry } from "./context-entry";
import { insightIntroDuration } from "../taste-motion";
import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import type { ContextData, Frame, Options, Point, State, Dot } from "./types";

export const CONTEXT_DOT_RADIUS = 9.5;
export const CONTEXT_DOT_PITCH = 26;
export const CONTEXT_ZIGZAG = 6;
// Base settled zigzag and radial travel are ±6, before fitting the whole multi-ring layout.
const CONTEXT_LAYOUT_OFFSET = 6;
// Even slot counts close the alternating inward/outward pattern at every seam.
export const contextRingSlots = (layer: number) => 12 + layer * 4;
export const contextRingRadius = (layer: number) => {
  const halfStep = Math.PI / (contextRingSlots(layer) * 3);
  // Adjacent points have different radii: solve their chord length for the mean radius.
  return (
    Math.sqrt(
      CONTEXT_DOT_PITCH ** 2 -
        4 * CONTEXT_LAYOUT_OFFSET ** 2 * Math.cos(halfStep) ** 2,
    ) /
    (2 * Math.sin(halfStep))
  );
};
/** Match the ~303px envelope of the other rings in a 340px view without enlarging dots. */
export const contextRingScale = (layerCount: number) => layerCount > 0
  ? (285 - CONTEXT_DOT_RADIUS) / (contextRingRadius(layerCount - 1) + CONTEXT_ZIGZAG)
  : 1;
export const CONTEXT_INTRO = 1.8;
export const CONTEXT_IDLE = 8;
const TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const t = clamp(v);
  return clamp(t * t * t * (t * (t * 6 - 15) + 10));
};
// Match zero velocity and acceleration at both reversals and the loop seam.
export const contextIdleZigzag = (time: number) => {
  const phase =
    (((time % CONTEXT_IDLE) + CONTEXT_IDLE) % CONTEXT_IDLE) / CONTEXT_IDLE;
  return phase < 0.5
    ? 1 - 2 * ease(phase * 2)
    : -1 + 2 * ease((phase - 0.5) * 2);
};
const polar = (angle: number, radius: number): Point => ({
  x: 320 + Math.cos(angle) * radius,
  y: 320 + Math.sin(angle) * radius,
});
const status: Record<State, string> = {
  valid: "",
  noData: "자료 없음",
  unanswered: "미응답",
  held: "해석 보류",
  unlinked: "연결 미확인",
};

/** Presentation phases never change response counts, sector angles or denominators. */
export function contextPhase(time: number, options: Options = {}) {
  const reduced = options.playback === "reduced";
  const local = Math.max(0, time);
  const settled = reduced || options.playback === "idle";
  return {
    reduced,
    local,
    // Collapse is controlled only by seeking this entrance backwards on scroll.
    entry: settled ? CONTEXT_INTRO : Math.min(CONTEXT_INTRO, local),
    idle: reduced ? 0 : options.playback === "idle" ? local : Math.max(0, local - CONTEXT_INTRO),
    label: reduced ? "완성 형태" : !settled && local < CONTEXT_INTRO ? "진입" : "대기",
  };
}
/** Shared presentation geometry; it knows nothing about responses or periods. */
export function dotRingMotion(
  layerCount: number,
  time: number,
  options: Options = {},
) {
  const phase = contextPhase(time, options);
  const entrance = contextEntry(
    Array.from(
      { length: layerCount },
      (_, i) => contextRingSlots(i) * 3,
    ).reduce((a, b) => a + b, 0),
    (phase.entry / CONTEXT_INTRO) * insightIntroDuration,
  );
  let entryIndex = 0;
  const scale = contextRingScale(layerCount);
  const zigzagPhase = phase.reduced ? 1 : contextIdleZigzag(phase.idle);
  const layers = Array.from({ length: layerCount }, (_, layer) => {
    const count = contextRingSlots(layer) * 3,
      radius = contextRingRadius(layer);
    return Array.from({ length: count }, (_, slot) => {
      const angle = -Math.PI / 2 + (TAU * (slot + 0.5)) / count;
      const target = polar(
        angle,
        (radius + (slot % 2 === 0 ? 1 : -1) * CONTEXT_ZIGZAG * zigzagPhase) * scale,
      );
      const source = entrance.dots[entryIndex++];
      return {
        x: source.x + (target.x - source.x) * entrance.expansion,
        y: source.y + (target.y - source.y) * entrance.expansion,
        r: source.r,
        opacity: source.progress,
      };
    });
  });
  const seedOpacity = 1 - ease(phase.entry / 0.1);
  const seed: Dot | null =
    layerCount && seedOpacity > 0
      ? {
          id: "context-seed",
          x: 320,
          y: 320,
          r: CONTEXT_DOT_RADIUS,
          color: TASTE_TOKENS.salty.palette.main,
          opacity: seedOpacity,
          data: false,
        }
      : null;
  return {
    phase,
    layers,
    seed,
    summaryOpacity: phase.reduced
      ? 1
      : ease((entrance.expansion - 0.94) / 0.06),
  };
}
export function contextFrame(
  data: ContextData,
  time: number,
  options: Options = {},
): Frame {
  const labels =
    data.mode === "liking"
      ? ["좋음", "보통", "아쉬움"]
      : ["부족", "알맞음", "과함"];
  const countPages = Math.max(1, Math.ceil(data.conditions.length / 4));
  const page = Math.max(
    0,
    Math.min(countPages - 1, Math.floor(options.page || 0)),
  );
  const shown =
    data.state === "valid" ? data.conditions.slice(page * 4, page * 4 + 4) : [];
  const state: State =
    data.state === "valid" && !shown.length ? "noData" : data.state;
  const motion = dotRingMotion(shown.length, time, options);
  const phase = motion.phase;
  const reveal = motion.summaryOpacity;
  const f: Frame = {
    dots: [],
    lines: [],
    labels: [],
    title: data.sense + " · " + (data.mode === "liking" ? "호감" : "알맞음"),
    value: state === "valid" ? String(shown.length) : "—",
    unit: "개 조건 비교",
    state,
    summaryOpacity: state !== "valid" ? 1 : reveal,
    motionPhase: phase.label,
    choices: [],
    selection: [],
    legend: "점 링 하나 = 조건 하나 · 진한 점 비율 ≈ 조건별 응답 비율",
    notes: [
      ...(state !== "valid" ? [status[state]] : []),
      "조건: " +
        {
          intensity: "연결된 강도",
          food: "음식 종류",
          target: "느낀 부위",
          phase: "먹는 시점",
        }[data.dimension] +
        " · 동일 감각·척도 비교",
      "층별 n은 합산하지 않음 · 관찰된 연관",
      "점은 평가 건수가 아닌 비율 눈금 · 정확한 횟수는 조건 선택 시 표시",
    ],
  };
  if (data.conditions.length > 4)
    f.notes.push(
      "현재 " +
        shown.length +
        " / " +
        data.conditions.length +
        "개 · 생략 " +
        (data.conditions.length - shown.length) +
        "개",
    );
  f.notes.push(
    "안쪽부터 " +
      (shown.length ? shown.map((c) => c.label).join(" → ") : "조건 자료 없음"),
  );
  shown.forEach((condition, i) => {
    const rows = condition.responses.filter(
      (r) =>
        typeof r.response === "number" && r.response >= 0 && r.response < 3,
    );
    const n = rows.length,
      slots = contextRingSlots(i);
    const emphasis =
      options.selected && options.selected !== condition.id ? 0.35 : 1;
    const colorFor = (c: number) => TASTE_TOKENS[TASTE_IDS[c]].palette;
    labels.forEach((label, c) => {
      const token = colorFor(c),
        hits = rows.filter((r) => r.response === c).length;
      // More slots on larger circumferences preserve the same physical spacing.
      for (let slot = 0; slot < slots; slot++) {
        const id = condition.id + ":" + c + ":" + slot;
        const dot = motion.layers[i][c * slots + slot];
        const active = n > 0 && slot < Math.round((slots * hits) / n);
        f.dots.push({
          id,
          group: condition.id,
          ...dot,
          color: n ? token.main : "#dedad5",
          tintColor: motionTint(token),
          tint: n && !active ? 1 : 0,
          opacity: dot.opacity * emphasis,
          data: false,
        });
      }
    });
    f.choices.push({
      id: condition.id,
      label: i + 1 + ". " + condition.label + " n=" + n,
    });
    const unresolved = ["split", "unanswered", "held"]
      .map(
        (s, j) =>
          ["응답 나뉨", "미응답", "해석 보류"][j] +
          " " +
          condition.responses.filter((r) => r.response === s).length,
      )
      .join(" · ");
    if (options.selected === condition.id)
      f.selection = [
        condition.label + " · n=" + n,
        ...labels.map(
          (label, c) =>
            label + " " + rows.filter((r) => r.response === c).length + "/" + n,
        ),
        unresolved,
      ];
  });
  if (shown.length) {
    if (motion.seed) f.dots.push(motion.seed);
    labels.forEach((label, c) =>
      f.labels.push({
        id: "response:" + c,
        ...polar(-Math.PI / 2 + ((c + 0.5) * TAU) / 3, 308),
        text: label,
        anchor: "middle",
      }),
    );
  }
  return f;
}
