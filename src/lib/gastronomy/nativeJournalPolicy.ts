import {
  canonical,
  decodeNativeValue,
  encodeNativeValue,
  swiftTime,
  type NativeSnapshot,
  type NativeRecord,
} from "./nativeRecord";
export const QUESTION_PROGRESS_KEY =
  "tastebuddy.ios.personal-taste-question-progress.v1";
// AppModel computes within an account-scoped archive with this model ID on every device.
export const NATIVE_MODEL_OWNER = "local-owner";
export interface QuestionProgress {
  questionID: string;
  firstExposedAt: number;
  status: string;
  statusChangedAt?: number | null;
  suppressedUntil?: number | null;
  sourceEntryID?: string | null;
  [key: string]: unknown;
}
export type QuestionHistory = Record<string, Record<string, QuestionProgress>>;
const object = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function readQuestionHistory(snapshot: NativeSnapshot): QuestionHistory {
  const encoded = snapshot.values[QUESTION_PROGRESS_KEY];
  if (encoded === undefined) return {};
  let value: unknown;
  try {
    value = decodeNativeValue(encoded);
  } catch {
    throw new Error(
      "질문 이력을 읽지 못했어요. 기존 이력은 그대로 보관했어요.",
    );
  }
  if (
    !object(value) ||
    Object.values(value).some(
      (rows) =>
        !object(rows) ||
        Object.entries(rows).some(
          ([id, p]) =>
            !object(p) ||
            p.questionID !== id ||
            typeof p.status !== "string" ||
            (p.sourceEntryID != null &&
              (typeof p.sourceEntryID !== "string" ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  p.sourceEntryID,
                ))) ||
            !Number.isFinite(p.firstExposedAt) ||
            ["statusChangedAt", "suppressedUntil"].some(
              (key) => p[key] != null && !Number.isFinite(p[key]),
            ),
        ),
    )
  )
    throw new Error(
      "질문 이력 형식을 확인해야 해요. 기존 이력은 그대로 보관했어요.",
    );
  return value as QuestionHistory;
}
export function shouldPresentQuestion(
  progress: QuestionProgress | undefined,
  now = new Date(),
): boolean {
  if (!progress) return true;
  const time = swiftTime(now);
  switch (progress.status) {
    case "active":
    case "deferred":
    case "cannotRecall":
      return (progress.suppressedUntil ?? -Infinity) <= time;
    case "resolved":
      return (progress.statusChangedAt ?? -Infinity) + 86400 <= time;
    default:
      return false;
  }
}
export function updateQuestionHistory(
  snapshot: NativeSnapshot,
  question: any,
  status:
    | "exposed"
    | "active"
    | "resolved"
    | "dismissed"
    | "deferred"
    | "cannotRecall",
  now = new Date(),
  owner = NATIVE_MODEL_OWNER,
): NativeSnapshot {
  const history = readQuestionHistory(snapshot),
    rows = history[owner] ?? {},
    old = rows[question.id];
  if (status === "exposed" && old) return snapshot;
  const time = swiftTime(now),
    next: QuestionProgress = {
      ...old,
      questionID: question.id,
      firstExposedAt: old?.firstExposedAt ?? time,
      status: status === "exposed" ? "active" : status,
      statusChangedAt: status === "exposed" ? null : time,
      sourceEntryID:
        old?.sourceEntryID ??
        question.sourceExperienceID?.toUpperCase() ??
        null,
    };
  delete next.suppressedUntil;
  if (status === "deferred" || status === "cannotRecall")
    next.suppressedUntil = time + (status === "deferred" ? 86400 : 30 * 86400);
  return {
    ...snapshot,
    values: {
      ...snapshot.values,
      [QUESTION_PROGRESS_KEY]: encodeNativeValue({
        ...history,
        [owner]: { ...rows, [question.id]: next },
      }),
    },
  };
}
export function migrateQuestionHistory(
  snapshot: NativeSnapshot,
  selections: any[],
  observations: any[],
  entries: NativeRecord[],
  now = new Date(),
  owner = NATIVE_MODEL_OWNER,
): NativeSnapshot {
  const history = readQuestionHistory(snapshot),
    rows = { ...history[owner] },
    time = swiftTime(now);
  let changed = false;
  for (const q of selections) {
    const current = rows[q.id];
    if (current?.status === "resolved") {
      rows[q.id] = {
        ...current,
        status: "active",
        suppressedUntil: (current.statusChangedAt ?? time) + 86400,
      };
      changed = true;
    }
    if (rows[q.id] || !q.familyID || q.familyID === q.id) continue;
    const legacy = rows[q.familyID],
      entry = entries.find(
        (e) => e.id.toLowerCase() === q.sourceExperienceID?.toLowerCase(),
      );
    if (!legacy || legacy.status === "active" || !entry) continue;
    const source = observations.find(
        (o) => o.observationId === q.responseSourceID,
      ),
      known = source?.knownAt
        ? swiftTime(new Date(source.knownAt))
        : entry.savedAt;
    if (
      known != null &&
      known > (legacy.statusChangedAt ?? legacy.firstExposedAt)
    )
      continue;
    rows[q.id] = {
      questionID: q.id,
      firstExposedAt: legacy.firstExposedAt,
      status: "deferred",
      statusChangedAt: time,
      suppressedUntil: time + 7 * 86400,
      sourceEntryID: entry.id.toUpperCase(),
    };
    changed = true;
  }
  return changed
    ? {
        ...snapshot,
        values: {
          ...snapshot.values,
          [QUESTION_PROGRESS_KEY]: encodeNativeValue({
            ...history,
            [owner]: rows,
          }),
        },
      }
    : snapshot;
}
export interface DiscoveryIdentity {
  id: string;
  revisionKey: string;
  meaningKey: string;
  subjectID: string;
  kind: string;
  relevance: number;
  sortDate: number;
}
export type DiscoveryHistory = Record<string, number>;
export const DISCOVERY_HISTORY_PREFIX =
  "tastebuddy-web.home-discovery-history.v2:";
const day = 86400000;
export function rankDiscoveries<T extends DiscoveryIdentity>(
  cards: T[],
  now = new Date(),
): T[] {
  const score = (c: T) =>
    c.relevance +
    (Math.max(0, +now - c.sortDate) / day <= 14
      ? 20
      : Math.max(0, +now - c.sortDate) / day <= 90
        ? 10
        : 0);
  return [...cards].sort(
    (a, b) =>
      score(b) - score(a) ||
      b.sortDate - a.sortDate ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
export function visibleDiscoveries<T extends DiscoveryIdentity>(
  cards: T[],
  history: DiscoveryHistory,
  now = new Date(),
  limit = 12,
): T[] {
  if (limit <= 0) return [];
  const eligible = rankDiscoveries(cards, now).filter((c) =>
      [
        c.revisionKey,
        `read:${c.meaningKey || c.id}`,
        `snooze:${c.id}`,
        `subject:${c.subjectID}`,
      ].every((key) => (history[key] ?? -Infinity) <= +now),
    ),
    result: T[] = [];
  const subjects = new Set(),
    kinds = new Set(),
    meanings = new Set();
  for (let pass = 0; pass < 3; pass++)
    for (const c of eligible) {
      const meaning = c.meaningKey || c.id;
      if (
        result.length >= limit ||
        meanings.has(meaning) ||
        (pass < 2 && subjects.has(c.subjectID)) ||
        (pass === 0 && kinds.has(c.kind))
      )
        continue;
      result.push(c);
      subjects.add(c.subjectID);
      kinds.add(c.kind);
      meanings.add(meaning);
    }
  return result;
}
export function updateDiscoveryHistory(
  history: DiscoveryHistory,
  card: DiscoveryIdentity,
  action: "read" | "snooze",
  now = new Date(),
): DiscoveryHistory {
  const next = Object.fromEntries(
    Object.entries(history).filter(([, until]) => until > +now),
  );
  if (action === "read") {
    next[`read:${card.meaningKey || card.id}`] = Date.UTC(4001, 0, 1);
    next[`subject:${card.subjectID}`] = +now + day;
  } else next[`snooze:${card.id}`] = +now + 7 * day;
  const controls = (key: string) =>
    key.startsWith("snooze:") || key.startsWith("subject:");
  return Object.fromEntries(
    Object.entries(next)
      .sort(
        ([a, x], [b, y]) =>
          Number(controls(b)) - Number(controls(a)) ||
          y - x ||
          (a < b ? -1 : 1),
      )
      .slice(0, 2048),
  );
}
export type JournalItem<
  Q = any,
  D extends DiscoveryIdentity = DiscoveryIdentity,
> =
  | { id: string; type: "question"; question: Q }
  | { id: string; type: "discovery"; discovery: D };
export function mergeJournal<
  Q extends { id: string },
  D extends DiscoveryIdentity,
>(questions: Q[], discoveries: D[]): JournalItem<Q, D>[] {
  const items: JournalItem<Q, D>[] = [];
  for (let i = 0; i < Math.max(questions.length, discoveries.length); i++) {
    if (discoveries[i])
      items.push({
        id: `discovery:${discoveries[i].revisionKey}`,
        type: "discovery",
        discovery: discoveries[i],
      });
    if (questions[i])
      items.push({
        id: `question:${questions[i].id}`,
        type: "question",
        question: questions[i],
      });
  }
  return items;
}
export function previewJournal<T extends JournalItem>(
  items: T[],
  limit: number,
): T[] {
  const subjects = new Set(),
    result: T[] = [];
  if (limit <= 0) return result;
  for (const item of items) {
    if (item.type === "discovery") {
      if (subjects.has(item.discovery.subjectID)) continue;
      subjects.add(item.discovery.subjectID);
    }
    result.push(item);
    if (result.length === limit) break;
  }
  return result;
}
