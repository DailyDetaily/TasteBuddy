import type {
  Category,
  Data,
  Dish,
  Evaluation,
  Mode,
  Scenario,
  State,
} from "./types";
const meals = (n: number) => Array.from({ length: n }, (_, i) => "meal-" + i);
const responses = (n: number, levels = 3): Evaluation[] =>
  Array.from({ length: n }, (_, i) => ({
    id: "response-" + i,
    unitId: "meal-" + i,
    response: i % levels,
  }));
export function fixture(
  kind: Category,
  scenario: Scenario = "standard",
  mode: Mode = "liking",
  domain: "taste" | "aroma" | "texture" = "taste",
): Data {
  const state: State =
    scenario === "empty"
      ? "noData"
      : scenario === "held"
        ? "held"
        : scenario === "unanswered"
          ? "unanswered"
          : "valid";
  const dense = scenario === "dense";
  if (kind === "experienceCluster") {
    const counts = dense ? [24, 18, 14, 11, 8, 6, 4, 3] : [8, 5, 3, 2, 1, 2];
    const names = [
      "된장국",
      "비빔밥",
      "메밀국수",
      "집에서 만든 카레",
      "오믈렛",
      "확인 필요",
      "토마토 파스타",
      "생선구이",
    ];
    const records: Dish[] = counts.flatMap((n, g) =>
      Array.from({ length: n }, (_, i) => ({
        id: "dish-" + g + "-" + String(i).padStart(3, "0"),
        mealId: "meal-" + (g * 3 + Math.floor(i / 2)),
        identity:
          g === 5
            ? null
            : {
                kind: g === 3 ? ("home" as const) : ("menu" as const),
                id: "menu-" + g,
                name: names[g],
              },
      })),
    );
    if (scenario === "added")
      records.push({
        id: "dish-0-999",
        mealId: "meal-new",
        identity: { kind: "menu", id: "menu-0", name: names[0] },
      });
    return {
      kind,
      state,
      records: state === "valid" && scenario !== "zero" ? records : [],
    };
  }
  if (kind === "sensoryRays") {
    // Production sensory IDs plus the existing native TasteAxis.fat preview axis.
    // native-axis:fat is not a TBA semantic attribute or production schema addition.
    const attributes =
      domain === "taste"
        ? [
            ["taste.sweet", "단맛"],
            ["taste.sour", "산미"],
            ["taste.bitter", "쓴맛"],
            ["taste.salty", "짠맛"],
            ["taste.umami", "감칠맛"],
            ["native-axis:fat", "지방맛"],
          ]
        : domain === "aroma"
          ? [
              ["aroma.roasted", "구운 향"],
              ["aroma.fruity", "과일향"],
              ["aroma.herbal", "허브향"],
              ["aroma.fermented", "발효향"],
              ["aroma.dairy", "우유·버터 향"],
              ["aroma.smoky", "불향"],
              ["aroma.floral", "꽃향"],
            ]
          : [
              ["texture.crisp", "바삭함"],
              ["texture.soft", "부드러움"],
              ["texture.chewy", "쫄깃함"],
              ["texture.crunchy", "아삭함"],
              ["texture.thick", "꾸덕함"],
              ["texture.moist", "촉촉함"],
              ["texture.crumbly", "부서짐"],
              ["texture.grainy", "알갱이"],
            ];
    const n = dense ? 48 : 12;
    return {
      kind,
      state,
      domain,
      validMealIds: state === "valid" ? meals(n) : [],
      senses: attributes.map(([id, name], i) => {
        const count =
          scenario === "zero" && i === 0
            ? 0
            : Math.round(
                n *
                  [
                    4 / 12,
                    5 / 12,
                    2 / 12,
                    8 / 12,
                    9 / 12,
                    3 / 12,
                    7 / 12,
                    6 / 12,
                  ][i],
              );
        return {
          id,
          name,
          color: i % 6,
          mealIds: state === "valid" ? meals(count) : [],
          intensity:
            i === 3 && !dense
              ? { weak: 1, medium: 2, strong: 5, unanswered: 0 }
              : {
                  weak: 0,
                  medium: Math.floor(count / 3),
                  strong: Math.floor(count / 3),
                  unanswered: count - 2 * Math.floor(count / 3),
                },
        };
      }),
    };
  }
  if (kind === "preferenceFocus") {
    const rows = responses(
      scenario === "small" ? 3 : dense ? 60 : 24,
      mode === "overall" ? 5 : 3,
    ).map((r) => ({
      ...r,
      unitId: (mode === "overall" ? "dish-" : "meal-") + r.id,
    }));
    if (scenario === "small")
      rows.forEach((r, i) => (r.response = i === 2 ? 2 : 0));
    if (scenario === "decrease")
      rows.forEach((r) => (r.response = mode === "overall" ? 4 : 2));
    return {
      kind,
      state,
      mode,
      responses:
        scenario === "zero"
          ? []
          : state === "valid"
            ? [
                ...rows,
                ...(["split", "unanswered", "held"] as const).map(
                  (response, i) => ({
                    id: "status-" + i,
                    unitId: "status-" + i,
                    response,
                  }),
                ),
              ]
            : state === "noData"
              ? []
              : [
                  {
                    id: "status",
                    unitId: "status",
                    response: state === "held" ? "held" : "unanswered",
                  },
                ],
    };
  }
  if (kind === "contextLayers") {
    const sizes =
      scenario === "zero"
        ? [0]
        : scenario === "single"
          ? [3]
          : dense
            ? [3, 30, 18, 12, 8, 6]
            : [3, 30, 12];
    return {
      kind,
      state,
      mode: mode === "fit" ? "fit" : "liking",
      dimension: dense ? "food" : "intensity",
      sense: "짠맛",
      conditions:
        state === "valid"
          ? sizes.map((n, i) => ({
              id: "condition-" + i,
              label: (dense
                ? ["밥", "면", "국물", "구이", "찜", "간식"]
                : ["약함", "중간", "강함"])[i],
              responses: responses(n).map((r, j) => ({
                ...r,
                id: "c" + i + "-" + j,
                unitId: "meal-" + j,
                response:
                  i < 2
                    ? j < (n * 2) / 3
                      ? 0
                      : 2
                    : j < n / 4
                      ? 0
                      : j < n / 2
                        ? 1
                        : 2,
              })),
            }))
          : [],
    };
  }
  const previousValue =
    scenario === "zero" ? 0 : scenario === "decrease" ? 18 : 12;
  const recentValue =
    scenario === "decrease" || scenario === "equal" ? 12 : dense ? 48 : 18;
  const previousState: State = scenario === "unlinked" ? "unlinked" : state;
  return {
    kind,
    state,
    metric: "식사 수",
    unit: "번",
    maximum: dense ? 60 : 24,
    previous: {
      label: "이전",
      start: "2026.08.18",
      end: "2026.08.31",
      state: previousState,
      value: previousState === "valid" ? previousValue : null,
    },
    recent: {
      label: "최근",
      start: "2026.09.01",
      end: "2026.09.14",
      state,
      value:
        state === "valid" ? (scenario === "zero" ? 12 : recentValue) : null,
    },
  };
}
