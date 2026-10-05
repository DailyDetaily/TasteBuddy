import { COLOR_TOKENS } from "../../../src/constants/designTokens";
import { changeFrame } from "./change";
import { contextFrame, CONTEXT_IDLE } from "./context";
import { sensoryFrame } from "./sensory";
import {
  experienceFrame,
  experienceIdlePosition,
  experienceIdleOffset,
  EXPERIENCE_INTRO,
} from "./experience";
import { insightFrame, insightIntroDuration, palette } from "../taste-motion";
import type {
  Data,
  Category,
  Frame,
  Options,
  Point,
  Evaluation,
  Mode,
} from "./types";
export const COLORS = palette;
export const INTRO = 1.8,
  LOOP = 12;
export const stateText = {
  valid: "",
  noData: "자료 없음",
  unanswered: "미응답",
  held: "해석 보류",
  unlinked: "연결 미확인",
};
const TAU = Math.PI * 2;
const smooth = (x: number) => {
  const v = Math.max(0, Math.min(1, x));
  return v * v * (3 - 2 * v);
};
export const polar = (a: number, r: number): Point => ({
  x: 320 + Math.cos(a) * r,
  y: 320 + Math.sin(a) * r,
});
export const responseLabels = (mode: Mode) =>
  mode === "liking"
    ? ["좋음", "보통", "아쉬움"]
    : mode === "fit"
      ? ["부족", "알맞음", "과함"]
      : ["매우 좋음", "좋음", "보통", "아쉬움", "매우 아쉬움"];
const valid = (rows: Evaluation[]) =>
  rows.filter((r) => typeof r.response === "number");
function baseCategoryFrame(
  data: Data,
  time: number,
  options: Options = {},
): Frame {
  if (data.kind === "experienceCluster")
    return experienceFrame(data, time, options);
  if (data.kind === "sensoryRays") return sensoryFrame(data, time, options);
  if (data.kind === "contextLayers") return contextFrame(data, time, options);
  if (data.kind === "changeRipples") return changeFrame(data, time, options);
  const settled = options.playback === "idle" || options.playback === "reduced";
  const t = settled ? INTRO : Math.max(0, time),
    idle =
      options.playback === "reduced"
        ? 0
        : Math.max(0, options.playback === "idle" ? time : time - INTRO);
  const reveal = smooth((t - 1.4) / 0.4);
  const f: Frame = {
    dots: [],
    lines: [],
    labels: [],
    title: "",
    value: "—",
    unit: "",
    notes: [],
    legend: "",
    summaryOpacity: reveal,
    choices: [],
    selection: [],
    state: data.state,
  };
  if (data.kind === "preferenceFocus") {
    const labels = responseLabels(data.mode),
      rows = valid(data.responses);
    f.title =
      data.mode === "overall"
        ? "음식 전체 평가"
        : data.mode === "fit"
          ? "알맞음"
          : "감각별 호감";
    f.value = data.state === "valid" ? String(rows.length) : "—";
    f.unit = data.mode === "overall" ? "개 요리 평가" : "개 식사 응답";
    const counts = labels.map(
      (_, i) => rows.filter((r) => r.response === i).length,
    );
    const quotas = counts.map((n) =>
        rows.length ? (n / rows.length) * 126 : 0,
      ),
      allocated = quotas.map(Math.floor);
    const order = quotas
      .map((_, i) => i)
      .sort(
        (a, b) =>
          quotas[b] - allocated[b] - (quotas[a] - allocated[a]) || a - b,
      );
    if (rows.length)
      for (const i of order.slice(
        0,
        126 - allocated.reduce((a, b) => a + b, 0),
      ))
        allocated[i]++;
    const colors = allocated.flatMap((n, i) =>
      Array.from({ length: n }, () => i),
    );
    // Reuse the original packed-dot expansion, alignment and drag rotation geometry.
    // Freeze free-motion time at the end of the entrance; the data distribution never drifts.
    const ring = insightFrame(
      Math.min(t / INTRO, 1) * insightIntroDuration,
      settled,
      options.alignment || 0,
      0,
      (options.rotation || 0) + (idle / 60) * TAU,
    );
    ring.dots.forEach((dot, i) => {
      const category = colors[(i % 6) * 21 + Math.floor(i / 6)],
        key = category === undefined ? "" : String(category);
      f.dots.push({
        id: "proportion-" + i,
        x: 320 + (dot.x - 320) * 0.84,
        y: 320 + (dot.y - 320) * 0.84,
        r: dot.radius * 0.84,
        color: category === undefined ? "#e4e0da" : COLORS[category],
        // Stable decorative tone levels remain visibly distinct at the preview scale.
        opacity:
          dot.progress *
          [1, 0.84, 0.68, 0.52][(i * 7 + Math.floor(i / 6)) % 4] *
          (options.selected && options.selected !== key ? 0.35 : 1),
        group: key,
      });
    });
    labels.forEach((label, i) => {
      f.choices.push({ id: String(i), label: label + " " + counts[i] });
      if (options.selected === String(i))
        f.selection = [
          label,
          counts[i] +
            " / " +
            rows.length +
            (data.mode === "overall" ? "개 요리 평가" : "개 식사 응답"),
          rows.length
            ? ((counts[i] / rows.length) * 100).toFixed(1) +
              "% · 실제 평가 비율"
            : "유효 평가 없음",
        ];
    });
    f.notes = [
      labels.map((label, i) => label + " " + counts[i]).join(" · "),
      ["split", "unanswered", "held"]
        .map(
          (status, i) =>
            ["응답 나뉨", "미응답", "해석 보류"][i] +
            " " +
            data.responses.filter((r) => r.response === status).length,
        )
        .join(" · "),
      rows.length > 0 && rows.length < 5
        ? "아직 적은 기록 · 실제 평가 " + rows.length + "개"
        : "유효 평가 " + rows.length + "개",
      "점은 126개 비율 표현용 · 점 하나가 평가 한 건은 아님",
    ];
    f.legend = "색 = " + labels.join(" / ") + " · 점 색 비율 ≈ 유효 평가 비율";
  }
  if (f.state !== "valid") {
    if (data.kind === "preferenceFocus") {
      const labels = responseLabels(data.mode);
      f.choices = labels.map((label, i) => ({ id: String(i), label }));
      f.notes = [
        "유효 평가: " + stateText[f.state],
        data.responses.length ? f.notes[1] : "응답 상태: 자료 없음",
        f.notes[3],
      ];
      if (f.selection.length)
        f.selection = [f.selection[0], stateText[f.state]];
    }
    f.notes = [stateText[f.state], ...f.notes];
  }
  return f;
}

export const categoryLoopDuration = (kind: Category) =>
  kind === "preferenceFocus" || kind === "experienceCluster"
    ? 60
    : kind === "contextLayers" || kind === "changeRipples"
      ? CONTEXT_IDLE
      : LOOP;

export const categoryIntroDuration = (kind: Category) =>
  kind === "experienceCluster" ? EXPERIENCE_INTRO : INTRO;

export const sensoryIdleSpeed = (id: string) => {
  let hash = 2166136261;
  for (const char of id)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return [1, 2, 3, 4][hash % 4];
};

/** Presentation drift is separate from the encoded data coordinates. */
export function categoryFrame(
  data: Data,
  time: number,
  options: Options = {},
): Frame {
  const frame = baseCategoryFrame(data, time, options);
  if (frame.state === "held") {
    const neutral = COLOR_TOKENS.border.subtle;
    // A missing data shape gets a decorative neutral ring, never synthetic records.
    if (!frame.dots.length) {
      const settled = options.playback === "idle" || options.playback === "reduced";
      const t = Math.min(Math.max(0, time) / categoryIntroDuration(data.kind), 1) * insightIntroDuration;
      const ring = insightFrame(t, settled);
      frame.summaryOpacity = settled ? 1 : smooth((t / insightIntroDuration - 0.78) / 0.22);
      frame.dots = ring.dots.map((dot, i) => ({
        id: "held-placeholder-" + i,
        x: 320 + (dot.x - 320) * 0.84,
        y: 320 + (dot.y - 320) * 0.84,
        r: dot.radius * 0.84,
        color: neutral,
        opacity: dot.opacity,
        data: false,
      }));
    }
    frame.dots = frame.dots.map((dot) => ({
      ...dot, color: neutral, tintColor: neutral, tint: 0, data: false,
      group: undefined, role: undefined,
    }));
    frame.bridges = frame.bridges?.map((bridge) => ({...bridge, color: neutral}));
    frame.lines = [];
    frame.legend = "뉴트럴 점은 해석 보류 상태 표시용이며 기록·평가 수를 나타내지 않음";
    frame.notes = [stateText.held, ...frame.notes.filter((note) => note !== stateText.held)];
  }
  if (data.kind === "experienceCluster") {
    const idle = options.playback === "reduced" ? 0 : Math.max(0,
      options.rotationTime ?? (options.playback === "idle" ? time : time - EXPERIENCE_INTRO));
    const angle = (idle / 60) * TAU + (options.rotation || 0);
    const c = Math.cos(angle), s = Math.sin(angle);
    const turn = <T extends Point>(p: T): T => ({...p,
      x: 320 + (p.x - 320) * c - (p.y - 320) * s,
      y: 320 + (p.x - 320) * s + (p.y - 320) * c});
    frame.dots = frame.dots.map(turn);
    frame.labels = frame.labels.map(turn);
    frame.bridges = frame.bridges?.map(bridge => ({...bridge, points: bridge.points.map(turn)}));
  }
  if (data.kind === "sensoryRays" && options.rotation) {
    const c = Math.cos(options.rotation),
      s = Math.sin(options.rotation);
    frame.dots = frame.dots.map((d) => ({
      ...d,
      x: 320 + (d.x - 320) * c - (d.y - 320) * s,
      y: 320 + (d.x - 320) * s + (d.y - 320) * c,
    }));
  }

  if (
    data.kind === "experienceCluster" ||
    data.kind === "contextLayers" ||
    data.kind === "changeRipples" ||
    options.playback === "reduced"
  )
    return frame;
  const idle = Math.max(0, options.playback === "idle" ? time : time - INTRO);
  if (!idle) return frame;
  if (data.kind === "sensoryRays" || data.kind === "preferenceFocus") {
    frame.dots = frame.dots.map((dot) => {
      if (data.kind !== "sensoryRays")
        return { ...dot, ...experienceIdlePosition(dot, dot.id, idle) };
      // Independent paths, with greater tangential travel than radial travel.
      // Per-ID integer speeds retain the shared 12-second loop boundary.
      const offset = experienceIdleOffset(
        dot.id,
        idle * sensoryIdleSpeed(dot.id),
      );
      const radius = Math.hypot(dot.x - 320, dot.y - 320);
      const angle = Math.atan2(dot.y - 320, dot.x - 320);
      const radialRoom = Math.max(0, Math.min(6, 286 - radius, radius - 130));
      const r = radius + (offset.y / 1.32) * radialRoom;
      const a = angle + ((offset.x / 1.32) * 12) / radius;
      return { ...dot, x: 320 + Math.cos(a) * r, y: 320 + Math.sin(a) * r };
    });
  }
  return frame;
}

export const categoryPlaybackDuration = (
  kind: Category,
  playback: import("./types").Playback,
) =>
  categoryLoopDuration(kind) + (playback === "intro" ? categoryIntroDuration(kind) : 0);
