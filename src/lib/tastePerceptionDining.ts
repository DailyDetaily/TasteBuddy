import type { DiningFeedbackDraft, DiningFeedbackScenario } from '../constants/diningFeedbackData';
import type { ReservationRecord } from '../constants/reservationCatalog';
import type { DiningPageExternalFeedbackSubmission } from '../pages/DiningPage';
import { getDiningDetailTagMetadata } from '../constants/diningDetailTags';
import { DINING_SELECTION_CATALOG, DINING_SELECTION_VERSION, parseStructuredSelections } from '../../scripts/tba-platform-pilot/dining-selections.mjs';
import { LEXICON_VERSION, parseByRules } from '../../scripts/tba-platform-pilot/rules.mjs';

export interface PerceptionDiningSource {
  id: string;
  mealID: string;
  foodName: string;
  restaurantName: string;
  observedAt: string;
  note: string;
  selectedLabels: string[];
}
type HydratedDining = {
  reservations: ReservationRecord[];
  feedbackByReservationId: Record<number, DiningFeedbackDraft>;
  feedbackScenariosByReservationId: Record<number, DiningFeedbackScenario>;
};

/** 현재 소유자의 완료된 원응답만 읽는다. 생성된 TBA 요약·벡터·별점은 입력하지 않는다. */
export function buildDiningPerceptionRecords(local: readonly DiningPageExternalFeedbackSubmission[], remote?: HydratedDining | null) {
  const sources: PerceptionDiningSource[] = [];
  const records: any[] = [];
  const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  const validLocal = local.filter(row => row && Number.isFinite(row.submissionId)
    && typeof row.submittedAt === 'string' && typeof row.restaurant?.name === 'string'
    && Array.isArray(row.scenario?.dishes) && typeof row.scenario.completedAt === 'string'
    && row.draft?.dishResponses && typeof row.draft.dishResponses === 'object');
  const localRemoteIDs = new Set(validLocal.map(row => row.remoteId).filter(Boolean));
  const meals = validLocal.map(submission => ({
    mealID: submission.remoteId ?? `local:${submission.submissionId}`, draft: submission.draft,
    scenario: submission.scenario, observedAt: submission.scenario.completedAt,
    knownAt: submission.submittedAt, restaurantName: submission.restaurant.name,
  }));
  for (const reservation of remote?.reservations ?? []) {
    if (reservation.status !== 'completed' || reservation.remoteId && localRemoteIDs.has(reservation.remoteId)) continue;
    const draft = remote?.feedbackByReservationId[reservation.id];
    const scenario = remote?.feedbackScenariosByReservationId[reservation.id];
    if (!draft || !scenario) continue;
    meals.push({ mealID: reservation.remoteId ?? `reservation:${reservation.id}`, draft, scenario,
      observedAt: scenario.completedAt, knownAt: '', restaurantName: reservation.restaurant });
  }
  for (const meal of meals) {
    // 임시 메뉴 식별자는 식사마다 달라진다. 비교 대상은 기록된 식당·메뉴 이름으로 묶는다.
    const dishes = new Map([...meal.scenario.dishes, ...(Array.isArray(meal.draft.customDishes) ? meal.draft.customDishes : [])]
      .filter(dish => dish && typeof dish.id === 'string' && typeof dish.title === 'string').map(dish => [dish.id, dish]));
    for (const dish of dishes.values()) {
      const response = meal.draft.dishResponses[dish.id];
      if (!response) continue;
      const id = `${meal.mealID}:${dish.id}`;
      const selections = [...new Set([...strings(response.selectedExperienceIds), ...strings([response.selectedExperienceId])])].map(selectionID => {
        const entry = DINING_SELECTION_CATALOG.find(row => row.id === selectionID && row.type === 'bubble');
        return entry ? { id: entry.id, type: entry.type, catalogVersion: DINING_SELECTION_VERSION, labelSnapshot: entry.label } : null;
      }).filter(Boolean);
      for (const tagID of strings(response.selectedDetailTagIds)) {
        const metadata = getDiningDetailTagMetadata(tagID);
        const entry = DINING_SELECTION_CATALOG.find(row => row.id === tagID && row.type === 'detailTag');
        if (entry && metadata?.label === entry.label) selections.push({ id: entry.id, type: entry.type, catalogVersion: DINING_SELECTION_VERSION, labelSnapshot: entry.label });
      }
      const note = typeof response.reflectionNote === 'string' ? response.reflectionNote : '';
      const source: PerceptionDiningSource = { id, mealID: meal.mealID, foodName: dish.title, restaurantName: meal.restaurantName,
        observedAt: meal.observedAt, note, selectedLabels: selections.map(row => row!.labelSnapshot) };
      sources.push(source);
      const selected = parseStructuredSelections(selections).observations;
      // 기존 자유 메모 정제기를 그대로 사용하고, 해석하지 못한 문구도 원본에 남긴다.
      const written = note.trim() ? parseByRules({ question: 'free_text', questionVersion: '2', choiceVersion: LEXICON_VERSION, value: note }).observations : [];
      for (const [field, atoms] of [['selection', selected], ['note', written]] as const) {
        for (const [index, atom] of atoms.entries()) {
          records.push({ ...atom, observationId: `${id}:${field}:${index}`, userId: 'current-owner', experienceId: id, mealId: meal.mealID,
            feedbackCompleted: true, confirmationStatus: field === 'selection' ? 'explicit_user_choice' : 'rule_extracted_statement',
            observedAt: meal.observedAt, knownAt: response.feedbackUpdatedAt || meal.knownAt || null,
            foodName: dish.title, restaurantName: meal.restaurantName, restaurantID: null, menuItemID: null,
            dishKindIDs: strings(response.selectedDishKindIds), sourceRecordID: id });
        }
      }
    }
  }
  return { records, sources: [...new Map(sources.map(source => [source.id, source])).values()] };
}
