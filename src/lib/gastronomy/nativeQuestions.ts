import { parseStructuredSelections } from "../../../scripts/tba-platform-pilot/dining-selections.mjs";
import { effectiveSelections, type NativeRecord } from "./nativeRecord";

export const QUESTION_CHOICES: Record<string, Record<string, string>> = {
  liking: { liked: "좋았어요", neutral: "보통이에요", disliked: "아쉬웠어요" },
  intensity: { light: "약하게", medium: "중간 정도", strong: "강하게" },
  target: {
    whole_dish: "음식 전체",
    sauce: "소스",
    surface: "겉",
    inside: "속",
    coating: "튀김옷",
    skin: "껍질",
    broth: "국물",
    noodles: "면",
    meat: "고기",
    filling: "소",
    flesh: "속살",
    cream: "크림",
  },
  phase: {
    first_bite: "첫입",
    early_meal: "초반",
    during_meal: "먹는 동안",
    late_meal: "나중",
    after_swallow: "삼킨 뒤",
    after_meal: "식사 후",
  },
};
/** Native PersonalTasteInlineAnswer: only one matching original and only an unanswered facet. */
export function applyNativeQuestion(
  entry: NativeRecord,
  source: any,
  facet: string,
  answer: string,
): NativeRecord | null {
  if (
    (entry.feedbackStatus ?? "completed") !== "completed" ||
    entry.id.toLowerCase() !== source.experienceId ||
    !QUESTION_CHOICES[facet]?.[answer]
  )
    return null;
  const evidence = source.selectionEvidence;
  if (!evidence || evidence.type === "overallEvaluation") return null;
  const selections = effectiveSelections(entry).map((s) => ({ ...s }));
  const indices = selections.flatMap((s, i) =>
    s.id === evidence.selectionID &&
    s.type === evidence.type &&
    s.catalogVersion === evidence.catalogVersion &&
    (!evidence.selectionInstanceID || s.selectionInstanceID === evidence.selectionInstanceID) &&
    s.labelSnapshot === evidence.labelSnapshot &&
    (s.relatedBubbleID ?? null) === (evidence.relatedBubbleID ?? null) &&
    s.unparsedPayload == null
      ? [i]
      : [],
  );
  if (indices.length !== 1) return null;
  const related = (e: any) =>
    e?.selectionID === evidence.selectionID &&
    e?.type === evidence.type &&
    e?.catalogVersion === evidence.catalogVersion &&
    (!evidence.selectionInstanceID || e?.selectionInstanceID === evidence.selectionInstanceID) &&
    (e?.relatedBubbleID ?? null) === (evidence.relatedBubbleID ?? null);
  const parsed = parseStructuredSelections(selections);
  if (parsed.unresolved.some((u: any) => related(u.selectionEvidence)))
    return null;
  const effective = parsed.observations.find(
    (o) =>
      related(o.selectionEvidence) &&
      o.attribute === source.attribute &&
      (o.reference ?? null) === (source.reference ?? null),
  );
  if (
    !effective ||
    effective.target !== source.target ||
    effective.phase !== source.phase
  )
    return null;
  const kind =
    facet === "liking"
      ? "attribute_liking"
      : facet === "intensity"
        ? "sensory_intensity"
        : null;
  if (
    kind &&
    parsed.observations.some(
      (o) =>
        related(o.selectionEvidence) &&
        o.kind === kind &&
        o.attribute === source.attribute,
    )
  )
    return null;
  const selected = selections[indices[0]];
  if (
    ["target", "phase"].includes(facet)
      ? effective[facet] !== "unspecified" || selected[facet] !== "unspecified"
      : selected[facet] != null
  )
    return null;
  selected[facet] = answer;
  if (
    parseStructuredSelections(selections).unresolved.some((u: any) =>
      related(u.selectionEvidence),
    )
  )
    return null;
  return { ...entry, sensorySelections: selections };
}
export function nativeQuestionChoices(
  entry: NativeRecord | undefined,
  source: any,
  facet: string,
) {
  return entry && source
    ? Object.entries(QUESTION_CHOICES[facet] ?? {})
        .filter(
          ([id]) => applyNativeQuestion(entry, source, facet, id) !== null,
        )
        .map(([id, label]) => ({ id, label }))
    : [];
}
