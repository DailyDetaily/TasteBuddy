import preferenceIntakeCatalog from "../constants/preferenceIntakeCatalog.json";

const dietaryRestrictions = preferenceIntakeCatalog.questions.find((question) => question.id === "dietaryRestrictions")!;
const explorationStyle = preferenceIntakeCatalog.questions.find((question) => question.id === "explorationStyle")!;

/** Product copy used by the documentation previews and their code examples.
 * Primitive examples reuse the wording, not the complete product screen. */
export const componentExampleContent = {
  // DiningFeedbackFlow's custom-menu SelectionCard.
  selectionCard: {
    title: "직접 입력",
    description: "코스 목록에 없는 메뉴도 미각 기록으로 남길 수 있어요.",
  },
  checkbox: dietaryRestrictions.options.find((option) => option.id === "no-pork")!.label,
  // NativeBookmarkSheet and RestaurantBookmarkSheet.
  switch: "비밀 리스트로 설정하기",
  radio: {
    label: explorationStyle.title,
    options: explorationStyle.options.map(({ id, label }) => ({ value: id, label })),
  },
};
