import type { DiningPageExternalFeedbackSubmission } from "../../pages/DiningPage";
import type { hydrateReservationPageData } from "../tasteBuddySupabase";
import { buildDiningPerceptionRecords } from "../tastePerceptionDining";
import { hasDiningDishFeedbackResponse } from "../../constants/diningFeedbackData";
import type { Data, Facet, RecordRow } from "./engine";

export type RemoteDining = Awaited<
  ReturnType<typeof hydrateReservationPageData>
>;
const facets: Record<string, Facet> = {
  sensory_presence: "presence",
  sensory_intensity: "intensity",
  attribute_liking: "liking",
  preference_fit: "fit",
  overall_liking: "overall",
};
/** Legacy completedAt is feedback completion, never a confirmed meal date. */
export function buildGastronomyData(
  local: readonly DiningPageExternalFeedbackSubmission[],
  remote: RemoteDining | null,
): Data {
  local = local.filter(
    (row) =>
      row &&
      typeof row.submissionId === "number" &&
      typeof row.submittedAt === "string" &&
      typeof row.restaurant?.name === "string" &&
      Array.isArray(row.scenario?.dishes) &&
      row.draft?.dishResponses &&
      typeof row.draft.dishResponses === "object",
  );
  const perception = buildDiningPerceptionRecords(local, remote);
  const records: RecordRow[] = [];
  const localRemoteIDs = new Set(local.map((r) => r.remoteId).filter(Boolean));
  const meals = local.map((r) => ({
    mealID: r.remoteId ?? `local:${r.submissionId}`,
    draft: r.draft,
    scenario: r.scenario,
    savedAt: r.submittedAt,
    restaurant: r.restaurant.name,
  }));
  for (const r of remote?.reservations ?? []) {
    if (
      r.status !== "completed" ||
      (r.remoteId && localRemoteIDs.has(r.remoteId))
    )
      continue;
    const draft = remote?.feedbackByReservationId[r.id],
      scenario = remote?.feedbackScenariosByReservationId[r.id];
    if (draft && scenario)
      meals.push({
        mealID: r.remoteId ?? `reservation:${r.id}`,
        draft,
        scenario,
        savedAt: "",
        restaurant: r.restaurant,
      });
  }
  for (const meal of meals) {
    const dishes = new Map(
      [
        ...meal.scenario.dishes,
        ...(Array.isArray(meal.draft.customDishes)
          ? meal.draft.customDishes
          : []),
      ].map((d) => [d.id, d]),
    );
    for (const dish of dishes.values()) {
      const response = meal.draft.dishResponses[dish.id];
      if (!hasDiningDishFeedbackResponse(response)) continue;
      const id = `${meal.mealID}:${dish.id}`;
      records.push({
        id,
        mealID: meal.mealID,
        menu: dish.title,
        restaurant: meal.restaurant,
        foodKinds: [],
        date: null,
        savedAt: meal.savedAt || response.feedbackUpdatedAt || "",
        note: response.reflectionNote ?? "",
        labels:
          perception.sources.find((s) => s.id === id)?.selectedLabels ?? [],
        source: "unknown",
      });
    }
  }
  const ids = new Set(records.map((r) => r.id));
  return {
    records,
    observations: perception.records
      .filter(
        (o) =>
          ids.has(o.sourceRecordID) &&
          o.confirmationStatus === "explicit_user_choice" &&
          facets[o.kind] &&
          !o.attribute?.endsWith(".unspecified"),
      )
      .map((o) => ({
        id: o.observationId,
        entryID: o.sourceRecordID,
        facet: facets[o.kind],
        attribute: o.attribute ?? "",
        label: o.reference ?? attributeLabel(o.attribute),
        value: o.kind === "sensory_presence" ? "present" : o.value,
        target: o.target ?? "unspecified",
        phase: o.phase ?? "unspecified",
        selection: o.selectionEvidence?.selectionInstanceID != null
          ? JSON.stringify([o.selectionEvidence.selectionID, o.selectionEvidence.selectionInstanceID])
          : o.selectionEvidence?.selectionID ?? "",
        reference: o.reference,
      })),
  };
}
function attributeLabel(attribute: string) {
  const names: Record<string, string> = {
    "taste.sweet": "단맛",
    "taste.sour": "신맛",
    "taste.salty": "짠맛",
    "taste.bitter": "쓴맛",
    "taste.umami": "감칠맛",
    "mouthfeel.fatty": "지방감",
    "texture.soft": "부드러움",
    "texture.smooth": "매끄러움",
    "texture.chewy": "쫄깃함",
    "texture.crisp": "바삭함",
    "texture.moist": "수분감",
    "mouthfeel.coating": "입안을 감싸는 느낌",
    "aroma.roasted": "구운 향",
    "aroma.smoky": "훈연 향",
    "aroma.herbal": "허브 향",
    "aroma.fermented": "발효 향",
    "aroma.fruity": "과일 향",
    "aroma.nutty": "견과 향",
    "aroma.marine": "바다 향",
  };
  return names[attribute] ?? "선택한 감각";
}
