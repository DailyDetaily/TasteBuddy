import {
  canonical,
  decodeNativeValue,
  encodeNativeValue,
  readNativeRecords,
  DINING_KEY,
  androidArchivePhotoFilenames,
  type NativeRecord,
  type NativeSnapshot,
} from "./nativeRecord";
import {
  readQuestionHistory,
  QUESTION_PROGRESS_KEY,
} from "./nativeJournalPolicy";
export function deleteNativeRecord(
  snapshot: NativeSnapshot,
  expected: NativeRecord,
): NativeSnapshot {
  const current = readNativeRecords(snapshot).find((e) => e.id === expected.id);
  if (!current || canonical(current) !== canonical(expected))
    throw Error(
      "이 기록이 다른 곳에서 바뀌었어요. 다시 확인한 뒤 삭제해 주세요.",
    );
  const rows = decodeNativeValue(snapshot.values[DINING_KEY]) as NativeRecord[];
  const remaining = rows.filter((e) => e.id !== expected.id);
  const history = readQuestionHistory(snapshot);
  const next: NativeSnapshot = {
    ...snapshot,
    values: { ...snapshot.values, [DINING_KEY]: encodeNativeValue(remaining) },
  };
  if (QUESTION_PROGRESS_KEY in snapshot.values)
    next.values[QUESTION_PROGRESS_KEY] = encodeNativeValue(
      Object.fromEntries(
        Object.entries(history).map(([user, items]) => [
          user,
          Object.fromEntries(
            Object.entries(items).filter(
              ([, p]) => p.sourceEntryID !== expected.id,
            ),
          ),
        ]),
      ),
    );
  // Retain photos referenced by another entry or its correction history, including future fields.
  const retained = JSON.stringify(remaining),
    removed = JSON.stringify(current);
  const androidPhotos = new Set(androidArchivePhotoFilenames(snapshot));
  next.photoFilenames = snapshot.photoFilenames.filter(
    (name) =>
      androidPhotos.has(name) ||
      !removed.includes(JSON.stringify(name)) ||
      retained.includes(JSON.stringify(name)),
  );
  return next;
}
