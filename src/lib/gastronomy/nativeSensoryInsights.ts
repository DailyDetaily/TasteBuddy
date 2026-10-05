import type { AnalysisObservation } from "./nativeAnalysis";
import { nativeEvidenceID } from "./nativeEvidenceIdentity";
const unique = (v: string[]) => [...new Set(v)].sort();
const grouped = (
  rows: AnalysisObservation[],
  key: (r: AnalysisObservation) => string,
) => {
  const map = new Map<string, AnalysisObservation[]>();
  for (const row of rows)
    map.set(key(row), [...(map.get(key(row)) ?? []), row]);
  return [...map].sort(([a], [b]) => (a < b ? -1 : 1));
};
const scope = (r: AnalysisObservation) =>
  JSON.stringify([
    r.experienceId.toUpperCase(),
    r.attribute,
    r.reference,
    r.target,
    r.phase,
    ...(r.selectionEvidence
      ? [
          "selection",
          r.selectionEvidence.type,
          r.selectionEvidence.selectionID,
          r.selectionEvidence.catalogVersion,
          r.selectionEvidence.relatedBubbleID ?? null,
          ...(r.selectionEvidence.selectionInstanceID ? [r.selectionEvidence.selectionInstanceID] : []),
        ]
      : ["statement", r.sourceField]),
  ]).replace(/\//g, "\\/");
const evidenceText = (r: AnalysisObservation) =>
  r.selectionEvidence
    ? `선택 ‘${r.selectionEvidence.labelSnapshot}’ · 응답 ‘${r.selectionEvidence.labelValue}’`
    : `“${r.phrase}”`;
export function nativeSensoryInsights(records: AnalysisObservation[]) {
  const absent = new Set(
    records
      .filter((r) => r.kind === "sensory_presence" && r.value === false)
      .map(scope),
  );
  const direct = records.filter(
    (r) =>
      r.kind === "attribute_liking" &&
      !r.attribute?.endsWith(".unspecified") &&
      !absent.has(scope(r)),
  );
  const findings: {
    id: string;
    kind: string;
    title: string;
    body: string;
    evidenceIDs: string[];
    mealIDs: string[];
    experienceIDs: string[];
  }[] = [];
  const add = (
    idParts: string[],
    kind: string,
    title: string,
    body: string,
    rows: AnalysisObservation[],
  ) =>
    findings.push({
      id: nativeEvidenceID(idParts),
      kind,
      title,
      body,
      evidenceIDs: rows.map((r) => r.observationId),
      experienceIDs: unique(rows.map((r) => r.experienceId)),
      mealIDs: unique(rows.map((r) => r.mealId)),
    });
  for (const [key, items] of grouped(
    direct,
    (r) => `${r.attribute ?? ""}|${r.reference ?? ""}`,
  )) {
    const first = items[0],
      positive = items.filter((r) => r.value === "positive"),
      negative = items.filter((r) => r.value === "negative");
    if (!positive.length && !negative.length) continue;
    const meals = unique(items.map((r) => r.mealId)).length,
      experiences = unique(items.map((r) => r.experienceId)).length;
    let kind, title, body;
    if (positive.length && negative.length) {
      kind =
        new Set(items.map((r) => [r.foodName, r.target, r.phase].join("|")))
          .size > 1
          ? "contextual_preference"
          : "variable_preference";
      title = `${first.attributeLabel}, 달랐던 반응`;
      body = `${positive[0].foodName}에서는 ${evidenceText(positive[0])}, ${negative[0].foodName}에서는 ${evidenceText(negative[0])}라고 남겼어요.`;
    } else {
      kind = meals > 1 ? "repeated_preference" : "scoped_preference";
      title = positive.length
        ? `${first.attributeLabel}에서 찾은 즐거움`
        : `${first.attributeLabel}이 아쉬웠던 기록`;
      body =
        experiences > 1
          ? `${meals}번의 식사에 남긴 ${experiences}개 기록에서 ${positive.length ? "호감" : "아쉬움"}을 직접 남겼어요. ${evidenceText(first)}`
          : `${first.foodName}에서 ${evidenceText(first)}라고 남겼어요.`;
    }
    add(
      ["insight", key, kind, ...items.map((r) => r.observationId).sort()],
      kind,
      title,
      body,
      items,
    );
  }
  for (const r of records) {
    if (
      r.kind === "attribute_liking" &&
      r.attribute?.endsWith(".unspecified") &&
      r.selectionEvidence
    )
      add(
        ["selected_descriptor", r.observationId],
        "selected_descriptor_preference",
        `${r.selectionEvidence.labelSnapshot}에 남긴 평가`,
        `선택한 표현 ‘${r.selectionEvidence.labelSnapshot}’에 ‘${r.selectionEvidence.labelValue}’라고 응답했어요.`,
        [r],
      );
    if (["combination_liking", "preference_fit"].includes(r.kind))
      add(
        ["scoped", r.observationId],
        r.kind,
        r.kind === "combination_liking"
          ? "함께 먹을 때 남긴 느낌"
          : "이 음식에서 느낀 알맞은 정도",
        `${r.foodName}: ${evidenceText(r)}`,
        [r],
      );
    if (r.kind === "attribute_liking" && absent.has(scope(r)))
      add(
        ["qualified", r.observationId],
        "qualified_preference",
        "감각이 없었던 경험의 평가",
        `${r.foodName}에서 ${evidenceText(r)}라고 남겼어요. 감각의 부재를 포함한 이 경험의 평가예요.`,
        [
          r,
          ...records.filter(
            (o) =>
              o.kind === "sensory_presence" &&
              o.value === false &&
              scope(o) === scope(r),
          ),
        ],
      );
  }
  for (const [key, liking] of grouped(direct, scope)) {
    const first = liking[0],
      intensity = records.filter(
        (r) => r.kind === "sensory_intensity" && scope(r) === key,
      );
    if (
      !intensity.length ||
      new Set(intensity.map((r) => r.value)).size !== 1 ||
      new Set(liking.map((r) => r.value)).size !== 1
    )
      continue;
    const evidence = [...liking, ...intensity];
    add(
      ["intensity_liking", key, ...evidence.map((r) => r.observationId).sort()],
      "intensity_and_liking",
      `${first.attributeLabel}, 함께 남긴 강도와 평가`,
      `${first.foodName}에서 ${evidenceText(intensity[0])}, ${evidenceText(first)}라고 남겼어요. 같은 대상과 시점에 남긴 표현이에요.`,
      evidence,
    );
  }
  const phase: Record<string, string> = {
      first_bite: "첫입",
      early_meal: "초반",
      during_meal: "먹는 동안",
      late_meal: "나중",
      after_swallow: "삼킨 뒤",
      after_meal: "식사 후",
    },
    target: Record<string, string> = {
      surface: "겉",
      inside: "속",
      sauce: "소스",
      coating: "튀김옷",
      skin: "껍질",
      broth: "국물",
      noodles: "면",
      meat: "고기",
      filling: "소",
      flesh: "속살",
      cream: "크림",
    };
  for (const dimension of ["phase", "target"])
    for (const [key, rows] of grouped(direct, (r) =>
      [
        r.experienceId.toUpperCase(),
        r.attribute ?? "",
        r.reference ?? "",
        dimension === "phase" ? r.target : r.phase,
      ].join("|"),
    )) {
      const labels = dimension === "phase" ? phase : target,
        items = rows.filter((r) => labels[r[dimension]]);
      if (
        !items.length ||
        new Set(items.map((r) => r[dimension])).size < 2 ||
        new Set(items.map((r) => r.value)).size < 2
      )
        continue;
      const kind =
        dimension === "phase"
          ? "within_meal_difference"
          : "target_preference_difference";
      add(
        [kind, key, ...items.map((r) => r.observationId).sort()],
        kind,
        `${items[0].attributeLabel}, ${dimension === "phase" ? "시점" : "부위"}에 따라 달랐던 평가`,
        items
          .map((r) => `${labels[r[dimension]]}에는 ${evidenceText(r)}`)
          .join(" / "),
        items,
      );
    }
  const priorities: Record<string, number> = {
    within_meal_difference: 6,
    target_preference_difference: 6,
    contextual_preference: 5,
    qualified_preference: 4,
    intensity_and_liking: 3,
  };
  return findings.sort(
    (a, b) =>
      (priorities[b.kind] ?? 0) - (priorities[a.kind] ?? 0) ||
      b.experienceIDs.length - a.experienceIDs.length ||
      (a.id < b.id ? -1 : 1),
  );
}
