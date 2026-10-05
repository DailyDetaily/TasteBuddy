import { parseStructuredSelections } from "../../../scripts/tba-platform-pilot/dining-selections.mjs";
import {
  canonical,
  effectiveSelections,
  type NativeRecord,
} from "./nativeRecord";
import { swiftDate } from "./nativeArchive";
import type { PerceptionDiningSource } from "../tastePerceptionDining";
/** Same facet-specific knownAt rule as DiningEntry.knownAt; editing a note does not re-date an intensity response. */
export function selectionKnownAt(
  entry: NativeRecord,
  atom: any,
): string | null {
  const evidence = atom.selectionEvidence;
  const facet = evidence?.facet ?? "selection";
  const project = (raw: unknown, bubbles: string[], tags: string[]) => {
    const choices = Array.isArray(raw)
      ? raw
      : raw == null
        ? effectiveSelections({
            ...entry,
            sensorySelections: null,
            tasteExperienceIDs: bubbles,
            detailTagIDs: tags,
          })
        : [];
    const choice = choices.find(
      (s) => s.type === evidence?.type && s.id === evidence?.selectionID &&
        (s.selectionInstanceID ?? null) === (evidence?.selectionInstanceID ?? null),
    );
    if (!choice) return null;
    return facet === "selection"
      ? Object.fromEntries(
          Object.entries(choice).filter(
            ([k]) => !["liking", "intensity", "preferenceFit"].includes(k),
          ),
        )
      : {
          response: choice[facet] ?? null,
          target: choice.target ?? null,
          phase: choice.phase ?? null,
        };
  };
  let bubbles = entry.tasteExperienceIDs ?? [],
    tags = entry.detailTagIDs ?? [];
  for (const c of [...(entry.memoryCorrections ?? [])].reverse()) {
    const beforeBubbles = Array.isArray(c.before.tasteExperienceIDs)
        ? c.before.tasteExperienceIDs
        : bubbles,
      beforeTags = Array.isArray(c.before.detailTagIDs)
        ? c.before.detailTagIDs
        : tags;
    if ("sensorySelections" in c.before || "sensorySelections" in c.after) {
      if (
        canonical(
          project(c.before.sensorySelections, beforeBubbles, beforeTags),
        ) !== canonical(project(c.after.sensorySelections, bubbles, tags))
      )
        return swiftDate(c.changedAt);
    }
    bubbles = beforeBubbles;
    tags = beforeTags;
  }
  return swiftDate(
    entry.memoryCorrections == null
      ? (entry.updatedAt ?? entry.savedAt)
      : entry.savedAt,
  );
}
export function buildNativePerceptionRecords(entries: NativeRecord[]) {
  const records: any[] = [],
    sources: PerceptionDiningSource[] = [];
  for (const entry of entries) {
    if ((entry.feedbackStatus ?? "completed") !== "completed") continue;
    const selections = effectiveSelections(entry),
      parsed = parseStructuredSelections(selections),
      id = `native:${entry.id}`,
      mealID = `native:${entry.mealID ?? entry.id}`;
    // Period comparison requires a confirmed meal date. Undated originals remain in the journal.
    const observedAt =
      entry.mealTime?.source === "user_confirmed"
        ? swiftDate(entry.mealTime.start)
        : null;
    sources.push({
      id,
      mealID,
      foodName: entry.menu,
      restaurantName: entry.restaurant,
      observedAt: observedAt ?? "",
      note: entry.note,
      selectedLabels: selections.map((s) => s.labelSnapshot),
    });
    for (const [i, atom] of parsed.observations.entries())
      records.push({
        ...atom,
        observationId: `${id}:${i}`,
        sourceRecordID: id,
        userId: "current-owner",
        experienceId: id,
        mealId: mealID,
        feedbackCompleted: true,
        confirmationStatus: "explicit_user_choice",
        observedAt,
        knownAt: selectionKnownAt(entry, atom),
        foodName: entry.menu,
        restaurantName: entry.restaurant,
        restaurantID: entry.restaurantID ?? null,
        menuItemID: entry.menuItemID ?? null,
        dishKindIDs: entry.dishKindIDs ?? [],
      });
  }
  return { records, sources };
}
