import { buildPersonalTasteModel } from "../../../scripts/tba-engine/personal-taste-model.mjs";
import { nativeEvidenceID } from "./nativeEvidenceIdentity";
export { nativeEvidenceID } from "./nativeEvidenceIdentity";
import {
  parseByRules,
  LEXICON_VERSION,
  SEMANTIC_CONTRACT,
} from "../../../scripts/tba-platform-pilot/rules.mjs";
import {
  DINING_SELECTION_CATALOG,
  parseStructuredSelections,
} from "../../../scripts/tba-platform-pilot/dining-selections.mjs";
import { parseOverallEvaluation } from "../../../scripts/tba-platform-pilot/dining-overall-evaluation.mjs";
import {
  canonical,
  effectiveSelections,
  type NativeRecord,
} from "./nativeRecord";
import { swiftDate } from "./nativeArchive";
import { selectionKnownAt } from "./nativePerception";
import { QUESTION_CHOICES, nativeQuestionChoices } from "./nativeQuestions";

export interface AnalysisObservation {
  observationId: string;
  experienceId: string;
  mealId: string;
  userId: string;
  sourceField: string;
  kind: string;
  attribute: string | null;
  attributeLabel: string;
  reference: string | null;
  value: any;
  scale: string;
  target: string;
  phase: string;
  phrase: string;
  sourceSpans: any[];
  selectionEvidence: any;
  knownAt: string | null;
  observedAt: string | null;
  dishKindIDs: string[];
  foodName: string;
  [key: string]: any;
}
export interface AnalysisPending {
  id: string;
  experienceId: string;
  sourceField: string;
  phrase: string;
  reason: string;
  selectionEvidence: any;
  [key: string]: any;
}
const unique = (rows: string[]) => [...new Set(rows)].sort();
const json = (value: unknown) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
// JSONEncoder's evidence structs omit nil properties and escape slashes by default.
const swiftJSON = (value: unknown) => json(value).replace(/\//g, "\\/");
const evidenceIdentity = (e: any) =>
  swiftJSON(
    e
      ? Object.fromEntries(Object.entries(e).filter(([, v]) => v != null))
      : null,
  );
const evidenceValue = (value: any) =>
  typeof value === "boolean" ? (value ? "있음" : "없음") : String(value);
export function sourceKnownAt(
  entry: NativeRecord,
  field: string,
  atom: any,
): string | null {
  if (field.startsWith("sensorySelections:"))
    return selectionKnownAt(entry, atom);
  const key = field.startsWith("overallEvaluation:")
    ? "overallEvaluation"
    : field;
  const projection = (value: any) => {
    if (key !== "note" || typeof value !== "string" || !atom.phrase)
      return value;
    const phrase = atom.phrase.trim().replace(/^[.!?\s]+|[.!?\s]+$/g, "");
    const contexts = value
      .split(/[.!?\n]/)
      .map((v) => v.trim())
      .filter((v) => v && phrase && v.includes(phrase))
      .sort();
    return contexts.length ? contexts : value;
  };
  for (const c of [...(entry.memoryCorrections ?? [])].reverse())
    if (
      (key in c.before || key in c.after) &&
      canonical(projection(c.before[key])) !==
        canonical(projection(c.after[key]))
    )
      return swiftDate(c.changedAt);
  return swiftDate(
    entry.memoryCorrections == null
      ? (entry.updatedAt ?? entry.savedAt)
      : entry.savedAt,
  );
}
function conditionSources(row: AnalysisObservation, entry: NativeRecord) {
  const result: any[] = row.dishKindIDs.map((value) => ({
    dimension: "dishKind",
    value,
    sourceField: `dishKindIDs:${value}`,
    labelSnapshot: null,
  }));
  for (const dimension of ["target", "phase"]) {
    const value = row[dimension];
    if (value === "unspecified") continue;
    let sourceField = row.sourceField,
      labelSnapshot = row.phrase;
    if (row.selectionEvidence) {
      const e = row.selectionEvidence,
        selected = entry.sensorySelections?.find(
          (s) => s.id === e.selectionID && s.type === e.type && (!e.selectionInstanceID || s.selectionInstanceID === e.selectionInstanceID),
        ),
        parent = entry.sensorySelections?.find(
          (s) => s.type === "bubble" && s.id === e.relatedBubbleID,
        );
      const choice =
        selected?.[dimension] === value
          ? selected
          : parent?.[dimension] === value
            ? parent
            : null;
      sourceField = choice
        ? `sensorySelections:${choice.type}:${choice.id}:${dimension}`
        : `sensorySelections:${e.type}:${e.selectionID}:selection`;
      labelSnapshot = choice
        ? (QUESTION_CHOICES[dimension]?.[value] ?? value)
        : e.labelSnapshot;
    }
    result.push({ dimension, value, sourceField, labelSnapshot });
  }
  if (row.kind === "sensory_intensity")
    result.push({
      dimension: "intensity",
      value: row.value,
      sourceField: row.sourceField,
      labelSnapshot: row.selectionEvidence?.labelValue ?? row.phrase,
    });
  return result;
}
function legacySummary(note: string) {
  const suffix = "으로 기억에 남은 식후 피드백입니다.";
  if (!note.endsWith(suffix)) return false;
  const labels = new Set(
    DINING_SELECTION_CATALOG.filter((c) => c.type === "bubble").map(
      (c) => c.label,
    ),
  );
  return note
    .slice(0, -suffix.length)
    .split(", ")
    .every((text, i) => {
      const prefix = i === 0 ? "메인 미각 " : "보조 미각 ";
      return text.startsWith(prefix) && labels.has(text.slice(prefix.length));
    });
}
export function nativeAnalysisSources(entries: NativeRecord[], owner: string) {
  const groups = new Map<string, NativeRecord[]>();
  for (const e of entries)
    groups.set(e.id.toLowerCase(), [
      ...(groups.get(e.id.toLowerCase()) ?? []),
      e,
    ]);
  const completed = [...groups.values()]
    .filter(
      (rows) =>
        (rows[0].feedbackStatus ?? "completed") === "completed" &&
        rows.every((e) => canonical(e) === canonical(rows[0])),
    )
    .map((rows) => rows[0])
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const observations: AnalysisObservation[] = [],
    unresolved: AnalysisPending[] = [];
  const labels = new Map(
    SEMANTIC_CONTRACT.attributes.map((a) => [a.id, a.label ?? a.meaning]),
  );
  for (const entry of completed) {
    const sources: { field: string; original: string; result: any }[] = [];
    if (entry.overallEvaluation)
      sources.push({
        field: "overallEvaluation:liking",
        original: entry.overallEvaluation.responseLabelSnapshot,
        result: parseOverallEvaluation(entry.overallEvaluation),
      });
    const choices = parseStructuredSelections(effectiveSelections(entry));
    const field = (item: any) =>
      `sensorySelections:${item.selectionEvidence?.type ?? ""}:${item.selectionEvidence?.selectionID ?? ""}:${item.selectionEvidence?.facet ?? "selection"}`;
    for (const atom of choices.observations)
      sources.push({
        field: field(atom),
        original: String(atom.phrase ?? ""),
        result: { observations: [atom] },
      });
    for (const pending of choices.unresolved as any[])
      sources.push({
        field: field(pending),
        original: pending.phrase,
        result: { unresolved: [pending], needsAI: false },
      });
    if (entry.note.trim() && !legacySummary(entry.note))
      sources.push({
        field: "note",
        original: entry.note,
        result: parseByRules({
          question: "free_text",
          questionVersion: "2",
          choiceVersion: LEXICON_VERSION,
          value: entry.note,
        }),
      });
    for (const { field, original, result } of sources) {
      const common = {
        experienceId: entry.id.toLowerCase(),
        mealId: (entry.mealID ?? entry.id).toLowerCase(),
        userId: owner,
        foodName: entry.menu,
        restaurantName: entry.restaurant,
        sourceField: field,
        observedAt: swiftDate(entry.observedAt ?? entry.date),
      };
      for (const atom of result.observations ?? []) {
        const spans = atom.sourceSpans;
        if (
          typeof atom.phrase !== "string" ||
          !Array.isArray(spans) ||
          !spans.every(
            (s: any) =>
              s.start >= 0 &&
              s.end > s.start &&
              s.end <= original.length &&
              original.slice(s.start, s.end) === s.quote,
          )
        )
          continue;
        const observationId = nativeEvidenceID([
          entry.id.toUpperCase(),
          field,
          atom.kind,
          atom.attribute ?? "",
          evidenceValue(atom.value),
          atom.target ?? "whole_dish",
          atom.phase ?? "unspecified",
          atom.phrase,
          String(spans[0]?.start ?? 0),
          evidenceIdentity(atom.selectionEvidence),
        ]);
        const row: AnalysisObservation = {
          ...atom,
          ...common,
          sourceSpans: spans.map((s: any) => ({
            start: s.start,
            end: s.end,
            quote: s.quote,
          })),
          observationId,
          attribute: atom.attribute ?? null,
          attributeLabel:
            atom.reference ??
            labels.get(atom.attribute) ??
            atom.selectionEvidence?.labelSnapshot ??
            (atom.kind === "part_liking" ? "부분 평가" : "음식 전체"),
          reference: atom.reference ?? null,
          target: atom.target ?? "whole_dish",
          phase: atom.phase ?? "unspecified",
          selectionEvidence: atom.selectionEvidence ?? null,
          knownAt: sourceKnownAt(entry, field, atom),
          dishKindIDs: entry.dishKindIDs ?? [],
          confirmationStatus: atom.selectionEvidence
            ? "explicit_user_choice"
            : "rule_extracted_statement",
        };
        row.conditionSources = conditionSources(row, entry);
        observations.push(row);
      }
      for (const pending of result.unresolved ?? [])
        unresolved.push({
          ...pending,
          ...common,
          id: nativeEvidenceID([
            entry.id.toUpperCase(),
            field,
            pending.reason,
            pending.phrase,
            String(pending.sourceSpans?.[0]?.start ?? 0),
            evidenceIdentity(pending.selectionEvidence),
          ]),
          knownAt: sourceKnownAt(entry, field, pending),
          needsMeaningReview: result.needsAI || !!pending.selectionEvidence,
        });
    }
  }
  return {
    completed,
    observations: [
      ...new Map(observations.map((o) => [o.observationId, o])).values(),
    ],
    unresolved: [...new Map(unresolved.map((o) => [o.id, o])).values()],
  };
}
const styles = [
  ["purist", "퓨어리스트", "본연형", ["flavor.ingredient_character"]],
  ["maximalist", "맥시멀리스트", "강렬형", []],
  [
    "alchemist",
    "알키미스트",
    "발효형",
    ["aroma.fermented", "flavor.fermented"],
  ],
  [
    "roaster",
    "로스터",
    "고소형",
    [
      "aroma.roasted",
      "aroma.smoky",
      "aroma.nutty",
      "flavor.nutty_savory",
      "flavor.cereal_savory",
    ],
  ],
  ["romantic", "로맨틱", "달콤형", ["taste.sweet"]],
  ["texturalist", "텍스처리스트", "식감형", []],
  [
    "epicure",
    "에피큐어",
    "농밀형",
    ["taste.umami", "mouthfeel.fatty", "flavor.rich"],
  ],
  [
    "refresher",
    "리프레셔",
    "산뜻형",
    ["taste.sour", "trigeminal.fizzy", "flavor.fresh"],
  ],
  ["harmonist", "하모니스트", "조화형", ["flavor.balance"]],
] as const;
function scope(row: AnalysisObservation) {
  const s = row.selectionEvidence;
  if (s && (!s.type || !s.selectionID || !s.catalogVersion))
    return json(["unlinked", row.observationId]);
  return json([
    row.experienceId,
    row.attribute,
    row.reference,
    row.target,
    row.phase,
    ...(s
      ? [
          "selection",
          s.type,
          s.selectionID,
          s.catalogVersion,
          s.relatedBubbleID ?? null,
          ...(s.selectionInstanceID != null ? [s.selectionInstanceID] : []),
        ]
      : ["statement", row.sourceField]),
  ]);
}
export function nativeMainWing(records: AnalysisObservation[]) {
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
  const candidates = styles.map(([id, name, label, attributes]) => {
    const relevant = (
      id === "harmonist"
        ? [...direct, ...records.filter((r) => r.kind === "combination_liking")]
        : direct
    ).filter((r) => {
      if (id === "harmonist" && r.kind === "combination_liking") return true;
      if (id === "texturalist") return r.attribute?.startsWith("texture.");
      if (id === "maximalist")
        return (
          ["taste", "aroma", "trigeminal"].includes(
            r.attribute?.split(".")[0] ?? "",
          ) &&
          json(
            unique(
              records
                .filter(
                  (o) =>
                    o.kind === "sensory_intensity" && scope(o) === scope(r),
                )
                .map((o) => o.value),
            ),
          ) === '["strong"]'
        );
      return (attributes as readonly string[]).includes(r.attribute ?? "");
    });
    const support = relevant.filter((r) => r.value === "positive"),
      counter = relevant.filter((r) => r.value === "negative"),
      positive = unique(support.map((r) => r.mealId)).length,
      negative = unique(counter.map((r) => r.mealId)).length;
    return {
      id,
      name,
      label,
      status:
        positive && negative
          ? "mixed"
          : positive >= 2
            ? "repeated_support"
            : positive
              ? "first_signal"
              : negative
                ? "scoped_dislike"
                : "unknown",
      supportEvidenceIDs: support.map((r) => r.observationId),
      counterEvidenceIDs: counter.map((r) => r.observationId),
      supportExperienceCount: positive,
      counterExperienceCount: negative,
      eligible: positive >= 2 && positive > negative,
    };
  });
  const strength = (a: any, b: any) =>
    b.supportExperienceCount -
      b.counterExperienceCount -
      (a.supportExperienceCount - a.counterExperienceCount) ||
    b.supportExperienceCount - a.supportExperienceCount;
  const leader = (rows: typeof candidates) => {
    const ordered = [...rows].sort(strength);
    return ordered.length &&
      ordered.filter((r) => strength(r, ordered[0]) === 0).length === 1
      ? ordered[0]
      : null;
  };
  const eligible = candidates.filter((c) => c.eligible),
    main = leader(eligible),
    wing = main
      ? leader(
          eligible.filter(
            (c) =>
              c.id !== main.id &&
              unique(
                records
                  .filter(
                    (r) =>
                      c.supportEvidenceIDs.includes(r.observationId) &&
                      !main.supportEvidenceIDs.includes(r.observationId),
                  )
                  .map((r) => r.mealId),
              ).length >= 2,
          ),
        )
      : null;
  return {
    candidates,
    main,
    wing,
    status: main
      ? "provisional_profile"
      : eligible.length
        ? "ambiguous_main"
        : "learning",
    label: main
      ? `${main.name}${wing ? ` · ${wing.name} 윙` : ""}`
      : eligible.length
        ? "여러 취향이 함께 보여요"
        : "입맛을 알아가는 중이에요",
  };
}
export function buildNativeAnalysis(entries: NativeRecord[], owner: string) {
  const source = nativeAnalysisSources(entries, owner),
    byID = new Map(source.completed.map((e) => [e.id.toLowerCase(), e]));
  const answerCache = new Map<string, string[]>();
  const model = buildPersonalTasteModel(
    { userId: owner, records: source.observations },
    {
      individualQuestions: true,
      nativeAnswerOptions: (record, facet) => {
        const entry = byID.get(record.experienceId);
        if (!entry || !record.selectionEvidence) return [];
        const key = json([
          effectiveSelections(entry),
          record.selectionEvidence.type,
          record.selectionEvidence.selectionID,
          record.selectionEvidence.selectionInstanceID ?? null,
          record.selectionEvidence.catalogVersion,
          record.selectionEvidence.labelSnapshot,
          record.selectionEvidence.relatedBubbleID ?? null,
          record.attribute,
          record.reference,
          record.target,
          record.phase,
          facet,
        ]);
        if (!answerCache.has(key))
          answerCache.set(
            key,
            nativeQuestionChoices(entry, record, facet).map(
              (c) =>
                (
                  ({
                    liked: "positive",
                    disliked: "negative",
                    light: "weak",
                  }) as Record<string, string>
                )[c.id] ?? c.id,
            ),
          );
        return answerCache.get(key)!;
      },
    },
  );
  const mainWing = nativeMainWing(source.observations);
  return { ...source, model, mainWing };
}
export type NativeAnalysisSnapshot = ReturnType<typeof buildNativeAnalysis>;
