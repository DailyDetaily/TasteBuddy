import { motionTint } from "./colors";
import { TASTE_IDS, TASTE_TOKENS } from "../../../src/constants/designTokens";
import { insightFrame, insightIntroDuration } from "../taste-motion";
import type { Frame, Options, SensoryData, State } from "./types";

const statusText: Record<State, string> = {
  valid: "",
  noData: "자료 없음",
  unanswered: "미응답",
  held: "해석 보류",
  unlinked: "연결 미확인",
};

/** Every sensory percentage has its own numerator and the same eligible-meal denominator. */
export function sensorySummary(data: SensoryData) {
  const eligible = new Set(data.validMealIds);
  const state: State =
    data.state !== "valid" ? data.state : eligible.size ? "valid" : "noData";
  const denominator = state === "valid" ? eligible.size : null;
  return {
    state,
    status: statusText[state],
    denominator,
    domainLabel: { taste: "맛", aroma: "향", texture: "식감" }[data.domain],
    senses: data.senses.map((sense) => {
      const count =
        denominator === null
          ? null
          : new Set(sense.mealIds.filter((id) => eligible.has(id))).size;
      const token =
        TASTE_TOKENS[TASTE_IDS[sense.color % TASTE_IDS.length]].palette;
      return {
        ...sense,
        count,
        ratio:
          count === null || denominator === null ? null : count / denominator,
        color: token.main,
        tintColor: motionTint(token),
        intensity: denominator === null ? null : sense.intensity,
      };
    }),
  };
}

const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
export function sensoryFrame(
  data: SensoryData,
  time: number,
  options: Options = {},
): Frame {
  const summary = sensorySummary(data);
  const reduced = options.playback === "reduced";
  const settled = reduced || options.playback === "idle";
  const t = settled ? 1.8 : Math.max(0, time);
  const reveal = smooth((t - 1.3) / 0.5);
  const f: Frame = {
    dots: [],
    lines: [],
    labels: [],
    title: summary.domainLabel,
    value: summary.denominator === null ? "—" : String(summary.denominator),
    unit: "번의 기준 식사",
    state: summary.state,
    summaryOpacity: reveal,
    choices: [],
    selection: [],
    legend: "126개 비율 점 · 진한 점 = 기록 비율 · 틴트 점 = 미기록 비율",
    notes: [
      ...(summary.status ? [summary.status] : []),
      "기준: 유효한 감각을 남긴 식사",
      "한 식사에 여러 감각 기록 가능 · 합계를 100%로 맞추지 않음",
      "기록 빈도와 강도 응답은 별개입니다.",
    ],
  };
  // Freeze the original ring geometry after entry. Each sector has its own denominator.
  const target = insightFrame(insightIntroDuration, true, 1);
  const ordered = target.dots
    .map((dot, index) => ({
      index,
      angle:
        (Math.atan2(dot.y - 320, dot.x - 320) + Math.PI * 2.5) % (Math.PI * 2),
    }))
    .sort((a, b) => a.angle - b.angle);
  const slots = summary.senses.map((_, i) =>
    ordered.slice(
      Math.round((i * 126) / summary.senses.length),
      Math.round(((i + 1) * 126) / summary.senses.length),
    ),
  );
  summary.senses.forEach((sense, i) => {
    const selected = options.selected === sense.id;
    const opacity = options.selected && !selected ? 0.45 : 1;
    const darkCount = Math.round(slots[i].length * (sense.ratio ?? 0));
    const center = slots[i].reduce(
      (p, slot) => ({
        x: p.x + target.dots[slot.index].x / slots[i].length,
        y: p.y + target.dots[slot.index].y / slots[i].length,
      }),
      { x: 0, y: 0 },
    );
    if (sense.ratio !== null)
      slots[i].forEach(({ index }, rank) => {
        const dot = target.dots[index];
        // Each taste grows as a local group; every dark slot precedes its tint slots.
        const start = 0.05 + (i / Math.max(1, summary.senses.length - 1)) * 0.5;
        const localRank =
          rank < darkCount
            ? rank / Math.max(1, darkCount)
            : (rank - darkCount) / Math.max(1, slots[i].length - darkCount);
        const delay =
          rank < darkCount ? localRank * 0.22 : 0.48 + localRank * 0.28;
        const progress = smooth((t - start - delay) / 0.28);
        const spread = smooth((t - start) / 1.1);
        const x = center.x + (dot.x - center.x) * (0.72 + 0.28 * spread);
        const y = center.y + (dot.y - center.y) * (0.72 + 0.28 * spread);
        f.dots.push({
          id: sense.id + ":slot:" + rank,
          x: 320 + (x - 320) * 0.92,
          y: 320 + (y - 320) * 0.92,
          r: dot.radius,
          color: sense.color,
          tintColor: sense.tintColor,
          tint: rank < darkCount ? 0 : 1,
          opacity: progress * opacity,
          group: sense.id,
        });
      });
    f.choices.push({ id: sense.id, label: sense.name });
    if (selected) {
      f.selection = [
        sense.name +
          " " +
          (sense.count === null
            ? summary.status
            : sense.count + "/" + summary.denominator + "번"),
      ];
      if (sense.intensity === null) f.selection.push("강도 응답 자료 없음");
      else {
        const response = sense.intensity;
        f.selection.push(
          response.weak + response.medium + response.strong > 0
            ? "강도 약함 " +
                response.weak +
                " · 중간 " +
                response.medium +
                " · 강함 " +
                response.strong
            : "강도 응답 없음",
        );
        if (response.unanswered)
          f.selection.push("강도 미응답 " + response.unanswered + "회");
        if (sense.count === 0)
          f.selection.push(
            "이 감각을 기록한 식사 없음 · 감각의 부재를 뜻하지 않음",
          );
      }
    }
  });
  const selectedSense = summary.senses.find((s) => s.id === options.selected);
  if (selectedSense) {
    f.title = selectedSense.name;
    f.value =
      selectedSense.count === null
        ? "—"
        : selectedSense.count + "/" + summary.denominator;
    f.unit = "번 기록";
  }
  f.notes.push(
    "점 하나는 기록 한 건이 아닌 비율 칸입니다. 점 수는 반올림하며 정확한 횟수는 선택 시 표시합니다.",
  );
  return f;
}
