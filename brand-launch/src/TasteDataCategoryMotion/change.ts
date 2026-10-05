import { motionTint } from "./colors";
import { TASTE_TOKENS } from "../../../src/constants/designTokens";
import { dotRingMotion } from "./context";
import type { ChangeData, Frame, Options, State } from "./types";
const statuses: Record<State, string> = {
  valid: "",
  noData: "자료 없음",
  unanswered: "미응답",
  held: "해석 보류",
  unlinked: "연결 미확인",
};
export function changeFrame(
  data: ChangeData,
  time: number,
  options: Options = {},
): Frame {
  const periods = [data.previous, data.recent];
  const values = periods.map((p) =>
    data.state === "valid" &&
    p.state === "valid" &&
    p.value !== null &&
    Number.isFinite(p.value) &&
    p.value >= 0
      ? p.value
      : null,
  );
  const comparable = values.every((v) => v !== null);
  const hasData = values.some((v) => v !== null);
  const maximum = Math.max(
    1,
    Number.isFinite(data.maximum) ? data.maximum : 1,
    ...values.map((v) => v ?? 0),
  );
  const unknown = periods.find((_, i) => values[i] === null);
  const state: State =
    data.state !== "valid"
      ? data.state
      : comparable
        ? "valid"
        : unknown?.state === "valid"
          ? "noData"
          : (unknown?.state ?? "noData");
  // Unavailable comparisons remain still and neutral instead of implying a change.
  const motion = dotRingMotion(
    hasData ? 2 : 0,
    time,
    comparable ? options : { ...options, playback: "reduced" },
  );
  const f: Frame = {
    dots: [],
    lines: [],
    labels: [],
    title: data.metric,
    value: values.map((v) => (v === null ? "—" : String(v))).join(" → "),
    unit: data.unit,
    state,
    motionPhase: comparable ? motion.phase.label : "비교 대기",
    summaryOpacity: comparable ? motion.summaryOpacity : 1,
    choices: [],
    selection: [],
    legend:
      "안쪽 이전 · 바깥쪽 최근 · 공통 0–" +
      maximum +
      " " +
      data.unit +
      " · 진한 점 비율 ≈ 수치 / 공통 상한",
    notes: [
      ...(comparable ? [] : [statuses[state] + " · 비교 대기"]),
      ...periods.map((p) => p.label + " " + p.start + "–" + p.end),
      "점 하나는 기록 한 건이 아닌 비율 눈금 · 색은 기간 구분이며 좋고 나쁨을 뜻하지 않음",
    ],
  };
  periods.forEach((period, i) => {
    const value = values[i],
      token = (i === 0 ? TASTE_TOKENS.fat : TASTE_TOKENS.salty).palette;
    const id = "period-" + i;
    const dots = motion.layers[i] || [];
    const active =
      value === null ? 0 : Math.round((dots.length * value) / maximum);
    const emphasis = options.selected && options.selected !== id ? 0.35 : 1;
    dots.forEach((dot, slot) =>
      f.dots.push({
        ...dot,
        id: id + ":" + slot,
        group: id,
        color: value === null ? "#dedad5" : token.main,
        tintColor: motionTint(token),
        tint: value === null ? 0 : slot < active ? 0 : 1,
        opacity: dot.opacity * emphasis,
        data: false,
      }),
    );
    const text =
      value === null
        ? "— · " +
          (period.state === "valid" ? "자료 없음" : statuses[period.state])
        : value + " " + data.unit;
    f.choices.push({ id, label: period.label + " " + text });
    if (options.selected === id)
      f.selection = [
        period.label + " " + period.start + "–" + period.end,
        text,
        "공통 척도 0–" + maximum + " " + data.unit,
      ];
  });
  if (comparable && motion.seed)
    f.dots.push({ ...motion.seed, id: "change-seed" });
  return f;
}
