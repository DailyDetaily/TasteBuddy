import { nativeSensoryInsights } from "./nativeSensoryInsights";
import type { NativeAnalysisSnapshot } from "./nativeAnalysis";
import { conditionLabels } from "./engine";
import { ALL_DISH_KIND_OPTIONS } from "../../constants/dishKindTags";
export interface AnalysisGroup {
  id: string;
  kind: "candidate" | "fit" | "overall";
  title: string;
  body: string;
  eyebrow: string;
  mealIDs: string[];
  evidenceIDs: string[];
  rows: { id: string; condition: string; summary: string; counts: string[] }[];
}
const unique = (values: string[]) => [...new Set(values)].sort();
const grouped = (values: any[], key: (v: any) => string) => {
  const result = new Map<string, any[]>();
  for (const v of values)
    result.set(key(v), [...(result.get(key(v)) ?? []), v]);
  return [...result].sort(([a], [b]) => (a < b ? -1 : 1));
};
const liking: Record<string, string> = {
  positive: "좋았어요",
  neutral: "보통이에요",
  negative: "아쉬웠어요",
};
const fit: Record<string, string> = {
  below_preferred: "조금 부족했어요",
  just_right: "알맞았어요",
  above_preferred: "조금 과했어요",
};
const overall: Record<string, string> = {
  very_positive: "정말 좋았어요",
  positive: "좋았어요",
  neutral: "보통이었어요",
  negative: "아쉬웠어요",
  very_negative: "많이 아쉬웠어요",
};
export function analysisCondition(
  conditions: any[],
  empty = "기록한 조건 전체",
): string {
  return conditions.length
    ? conditions
        .map((c) =>
          c.dimension === "intensity"
            ? ((
                {
                  weak: "은은하게 느낀",
                  medium: "중간 강도로 느낀",
                  strong: "강하게 느낀",
                } as Record<string, string>
              )[c.value] ?? "선택한 강도")
            : c.dimension === "dishKind"
              ? (ALL_DISH_KIND_OPTIONS.find((d) => d.id === c.value)?.label ??
                "선택한 음식 종류")
              : ((
                  {
                    surface: "겉면",
                    filling: "속재료",
                    early_meal: "식사 초반",
                    late_meal: "식사 후반",
                  } as Record<string, string>
                )[c.value] ??
                conditionLabels[c.value] ??
                "기록한 조건"),
        )
        .join(" · ")
    : empty;
}
const compareCandidates = (a: any, b: any) => {
  const priority: Record<string, number> = {
    repeated_direction: 0,
    mixed: 1,
    unstable: 2,
    first_signal: 3,
    insufficient_context: 4,
  };
  return (
    (priority[a.status] ?? 5) - (priority[b.status] ?? 5) ||
    (a.conditions.length === 0 ? 1 : 0) - (b.conditions.length === 0 ? 1 : 0) ||
    a.conditions.length - b.conditions.length ||
    b.distribution.mealCount - a.distribution.mealCount ||
    (a.id < b.id ? -1 : 1)
  );
};
function candidateSummary(c: any, label: string) {
  const subject = c.conditions.length
      ? `${analysisCondition(c.conditions)} ${label}`
      : label,
    n = c.distribution.mealCount;
  if (c.direction) {
    const responseCount = c.distribution[c.direction];
    const coverage = responseCount === n ? `${n}번의 식사에서` : `${n}번의 식사 중 ${responseCount}번에서`;
    return `${subject}는 ${coverage} ${({ positive: "호감", neutral: "보통", negative: "아쉬움" } as Record<string, string>)[c.direction]}을 남겼어요.`;
  }
  const responses = Object.entries({
    positive: "호감",
    neutral: "중립",
    negative: "아쉬움",
    mixed: "한 식사 안의 다른 평가",
  })
    .filter(([k]) => c.distribution[k] > 0)
    .map(([, v]) => v);
  if (responses.length > 1)
    return `${subject}에는 ${responses.slice(0, -1).join(", ")}과 ${responses[responses.length - 1]}이 함께 있었어요.`;
  return responses.length
    ? `${subject}는 ${n}번의 식사에서 ${responses[0]}을 남겼고 더 확인하고 있어요.`
    : `${subject}는 아직 방향을 정할 평가가 부족해요.`;
}
function candidateGroups(candidates: any[]): AnalysisGroup[] {
  return grouped(
    candidates.filter((c) => c.distribution.mealCount > 0),
    (c) => `${c.attribute}|${c.reference ?? ""}`,
  )
    .map(([id, values]) => {
      const ordered = [...values].sort(compareCandidates),
        first = ordered[0],
        label = first.label,
        positive = ordered.find((c) => c.direction === "positive"),
        negative = ordered.find((c) => c.direction === "negative"),
        anchor = positive ?? negative;
      const mixed = ordered
        .filter((c) => c.status === "mixed")
        .sort((a, b) => {
          const different = (c: any) =>
            !!anchor &&
            c.conditions.some((x: any) =>
              anchor.conditions.some(
                (y: any) => x.dimension === y.dimension && x.value !== y.value,
              ),
            );
          return (
            Number(different(b)) - Number(different(a)) ||
            compareCandidates(a, b)
          );
        })[0];
      const selected =
        positive && negative
          ? [positive, negative]
          : anchor && mixed
            ? [anchor, mixed]
            : [first];
      const mealIDs = unique(
        values.flatMap((c) => c.evidence.map((e: any) => e.mealID)),
      );
      const title =
        positive && negative
          ? `${label}, 조건에 따라 달랐던 반응`
          : values.some((c) => c.status === "mixed")
            ? `${label}, 평가가 나뉘었어요`
            : first.conditions.length
              ? `${label}, ${analysisCondition(first.conditions)}에서 남긴 평가`
              : `${label}에 남긴 평가`;
      return {
        id,
        kind: "candidate" as const,
        title,
        body: selected.map((c) => candidateSummary(c, label)).join(" "),
        mealIDs,
        evidenceIDs: unique(values.flatMap((c) => c.evidenceIDs)),
        eyebrow: values.some(
          (c) => c.counterMealIDs.length || c.status === "mixed",
        )
          ? `${mealIDs.length}번의 식사 · 조건과 다른 기록 포함`
          : mealIDs.length > 1
            ? `${mealIDs.length}번의 식사에서 조건 비교`
            : "첫 단서 · 1번의 식사",
        rows: ordered.map((c) => ({
          id: c.id,
          condition: analysisCondition(c.conditions, "기록한 식사"),
          summary: candidateSummary(c, label),
          counts: Object.entries({
            positive: "호감",
            neutral: "중립",
            negative: "아쉬움",
            mixed: "한 식사 안의 다른 평가",
          })
            .filter(([key]) => c.distribution[key] > 0)
            .map(([key, text]) => `${text} · ${c.distribution[key]}번의 식사`),
        })),
      };
    })
    .sort(
      (a, b) => b.mealIDs.length - a.mealIDs.length || (a.id < b.id ? -1 : 1),
    );
}
function prefer(a: any, b: any) {
  const rank = (c: any[]) =>
    c.reduce(
      (n, v) =>
        n +
        (
          { intensity: 8, target: 4, dishKind: 2, phase: 1 } as Record<
            string,
            number
          >
        )[v.dimension],
      0,
    );
  return rank(b.conditions) - rank(a.conditions) || (a.id < b.id ? -1 : 1);
}
function distinct(values: any[], signature: (v: any) => string) {
  const seen = new Set();
  return values.filter((v) => {
    const s = signature(v);
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  });
}
export function nativeAnalysisGroups(
  snapshot: NativeAnalysisSnapshot,
): AnalysisGroup[] {
  const { model } = snapshot,
    result = candidateGroups(model.candidates);
  if (!result.length)
    for (const finding of nativeSensoryInsights(snapshot.observations))
      result.push({
        id: finding.id,
        kind: "candidate",
        title: finding.title,
        body: finding.body,
        eyebrow:
          finding.experienceIDs.length > 1
            ? `${finding.experienceIDs.length}개 기록`
            : "현재 기록의 해석",
        mealIDs: finding.mealIDs,
        evidenceIDs: finding.evidenceIDs,
        rows: [],
      });
  for (const [key, patterns] of grouped(model.fitPatterns, (p) =>
    JSON.stringify([p.attribute, p.reference ?? null]),
  )) {
    const baseline = patterns.find((p) => !p.conditions.length);
    if (!baseline) continue;
    const rows = distinct(
      [...patterns].sort(
        (a, b) =>
          Number(!!b.repeatedValue) - Number(!!a.repeatedValue) || prefer(a, b),
      ),
      (p) => `${p.mealIDs.join("|")}:${JSON.stringify(p.distribution)}`,
    ).map((p) => {
      const counts = Object.entries({
        belowPreferred: "조금 부족했어요",
        justRight: "알맞았어요",
        abovePreferred: "조금 과했어요",
        mixed: "한 식사에서 응답이 나뉨",
      })
        .filter(([k]) => p.distribution[k] > 0)
        .map(([k, label]) => `${label} · ${p.distribution[k]}번의 식사`);
      return {
        id: p.id,
        condition: analysisCondition(p.conditions),
        counts,
        summary: p.repeatedValue
          ? `‘${fit[p.repeatedValue]}’가 ${p.distribution.mealCount}번의 식사에서 반복됐어요.`
          : p.status === "mixed_fit"
            ? `응답이 나뉘었어요. ${counts.join(" · ")}.`
            : `${counts.join(" · ")}. 아직 반복 경향으로 정하지 않아요.`,
      };
    });
    const repeated = patterns.map((p) => p.repeatedValue);
    result.push({
      id: `fit:${baseline.id}`,
      kind: "fit",
      title:
        repeated.includes("just_right") && repeated.includes("above_preferred")
          ? `${baseline.label}, 알맞았던 때와 과했던 때`
          : `${baseline.label}의 알맞은 수준을 살펴봤어요`,
      body: rows
        .slice(0, 2)
        .map((r) => `${r.condition}: ${r.summary}`)
        .join("\n"),
      eyebrow: `${baseline.mealIDs.length}번의 식사 · 알맞음의 기록`,
      mealIDs: baseline.mealIDs,
      evidenceIDs: baseline.evidenceIDs,
      rows,
    });
  }
  for (const [, patterns] of grouped(model.overallPatterns, (p) =>
    JSON.stringify([p.attribute, p.reference ?? null]),
  )) {
    const baseline = patterns.find((p) => !p.conditions.length);
    if (!baseline) continue;
    const rank = (cells: any[]) =>
      [...cells].sort(
        (a, b) =>
          b.mealIDs.length - a.mealIDs.length ||
          (`${a.overallValue}:${a.attributeValue}` <
          `${b.overallValue}:${b.attributeValue}`
            ? -1
            : 1),
      );
    const max = (p: any) =>
      Math.max(0, ...p.cells.map((c: any) => c.mealIDs.length));
    const rows = distinct(
      [...patterns].sort((a, b) => max(b) - max(a) || prefer(a, b)),
      (p) =>
        p.cells
          .map(
            (c: any) =>
              `${c.overallValue}:${c.attributeValue}:${c.mealIDs.join("|")}`,
          )
          .join(";") + p.mixedMealIDs.join("|"),
    ).map((p) => {
      const cell = rank(p.cells)[0],
        minimum = p.conditions.length
          ? model.policy.minConditionMeals
          : model.policy.minMeals;
      const counts = p.cells.map(
        (c: any) =>
          `전체 ‘${overall[c.overallValue]}’ · ${p.label} ‘${liking[c.attributeValue]}’ — ${c.mealIDs.length}번의 식사`,
      );
      if (p.mixedMealIDs.length)
        counts.push(
          `한 식사에서 서로 다른 평가 쌍 · ${p.mixedMealIDs.length}번의 식사`,
        );
      const pair = cell
        ? `전체 평가 ‘${overall[cell.overallValue]}’와 ${p.label} 평가 ‘${liking[cell.attributeValue]}’`
        : "";
      const summary = cell
        ? `${pair}가 ${cell.mealIDs.length}번${cell.mealIDs.length >= minimum ? "의 식사에서 함께 나왔어요." : " 있었어요. 반복 경향은 더 살펴봐요."}${p.cells.length > 1 || p.mixedMealIDs.length ? " 다른 평가 쌍도 함께 남아 있어요." : ""}`
        : "같은 식사 안에 서로 다른 평가 쌍이 있어 한쪽으로 묶지 않았어요.";
      return {
        id: p.id,
        condition: analysisCondition(p.conditions),
        counts,
        summary,
      };
    });
    const cell = rank(baseline.cells)[0];
    const body = cell
      ? `전체 ‘${overall[cell.overallValue]}’ · ${baseline.label} ‘${liking[cell.attributeValue]}’: ${cell.mealIDs.length}번의 식사.${cell.mealIDs.length < model.policy.minMeals ? " 반복 경향은 더 살펴봐요." : baseline.cells.length > 1 || baseline.mixedMealIDs.length ? " 다른 평가도 함께 있어요." : ""}`
      : (rows[0]?.summary ?? "");
    result.push({
      id: `overall:${baseline.id}`,
      kind: "overall",
      title: `음식 전체와 ${baseline.label}의 평가는 어떻게 이어졌을까요`,
      body,
      eyebrow: `${baseline.mealIDs.length}번의 식사 · 전체 평가와 감각 평가`,
      mealIDs: baseline.mealIDs,
      evidenceIDs: baseline.evidenceIDs,
      rows,
    });
  }
  return result;
}
