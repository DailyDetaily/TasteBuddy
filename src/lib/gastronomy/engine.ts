/** Web port of TDDataEngine: records, meals, direct sensory evidence and dates stay separate. */
import { TASTE_TOKENS } from '../../constants/designTokens';
export type Category =
  | "experience"
  | "sensation"
  | "preference"
  | "context"
  | "change";
export type Facet = "presence" | "intensity" | "liking" | "fit" | "overall";
export type Period = "all" | "month" | "lastMonth" | "thirty" | "ninety";
export interface RecordRow {
  id: string;
  mealID: string;
  menu: string;
  restaurant: string;
  foodKinds: string[];
  foodKindIDs?: string[];
  menuKey?: string | null;
  restaurantKey?: string | null;
  date: string | null;
  savedAt: string;
  note: string;
  labels: string[];
  source: string;
  fingerprint?: string;
}
export interface Observation {
  id: string;
  entryID: string;
  facet: Facet;
  attribute: string;
  label: string;
  value: string;
  target: string;
  phase: string;
  selection: string;
  reference?: string;
}
export interface OverallStar {
  id: string;
  entryID: string;
  value: number;
}
export interface Data {
  sourceRecordCount?: number;
  records: RecordRow[];
  observations: Observation[];
  /** Direct half-step star answers, separate from the legacy five-category scale. */
  overallStars?: OverallStar[];
}
export interface Segment {
  key: string;
  label: string;
  count: number;
  entryIDs: string[];
  sampleIDs: string[];
}
export interface Row {
  id: string;
  title: string;
  value: string;
  detail: string;
  entryIDs: string[];
  segments?: Segment[];
}
export interface Card {
  id: string;
  title: string;
  meaning: string;
  rows: Row[];
}
export const categories: {
  id: Category;
  title: string;
  subtitle: string;
  color: string;
}[] = [
  {
    id: "experience",
    title: "경험",
    subtitle: "식사·메뉴·식당·음식 종류",
    color: "#95867A",
  },
  {
    id: "sensation",
    title: "감각",
    subtitle: "느낀 맛·향·식감과 강도",
    color: TASTE_TOKENS.sour.palette.main,
  },
  {
    id: "preference",
    title: "취향",
    subtitle: "음식 전체·감각 호감·알맞음",
    color: "#FF9900",
  },
  {
    id: "context",
    title: "맥락",
    subtitle: "조건에 따라 남긴 반응",
    color: TASTE_TOKENS.sour.palette.main,
  },
  {
    id: "change",
    title: "변화",
    subtitle: "기간별 경험·감각·평가",
    color: "#95C900",
  },
];
export const periodLabels: Record<Period, string> = {
  all: "전체",
  month: "이번 달",
  lastMonth: "지난달",
  thirty: "최근 30일",
  ninety: "최근 90일",
};
export const facetLabels: Record<Facet, string> = {
  presence: "감각 기록",
  intensity: "느낀 강도",
  liking: "감각별 호감",
  fit: "강도의 알맞음",
  overall: "음식 전체 평가",
};
const values: Record<Facet, string[]> = {
  presence: ["present"],
  intensity: ["weak", "medium", "strong"],
  liking: ["positive", "neutral", "negative"],
  fit: ["below_preferred", "just_right", "above_preferred"],
  overall: [
    "very_positive",
    "positive",
    "neutral",
    "negative",
    "very_negative",
  ],
};
const labels: Record<string, string> = {
  present: "기록함",
  weak: "약함",
  medium: "중간",
  strong: "강함",
  positive: "좋음",
  neutral: "보통",
  negative: "아쉬움",
  below_preferred: "부족",
  just_right: "알맞음",
  above_preferred: "과함",
  very_positive: "매우 좋음",
  very_negative: "많이 아쉬움",
  mixed: "응답 나뉨",
  missing: "미응답",
};
const unique = <T>(items: T[]) => [...new Set(items)];
const group = <T>(items: T[], key: (item: T) => string) => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
};
const normalized = (s: string) =>
  s.trim().normalize("NFKC").toLocaleLowerCase();
export const senseKey = (o: Observation) =>
  JSON.stringify([o.attribute, o.reference ?? ""]);
export const domainOf = (o: Observation) =>
  o.attribute.startsWith("taste.")
    ? "맛"
    : o.attribute.startsWith("aroma.")
      ? "향"
      : /^(texture|mouthfeel)\./.test(o.attribute)
        ? "식감"
        : "기타";
export const mealCount = (records: RecordRow[]) =>
  unique(records.map((r) => r.mealID)).length;
export function periodWindow(
  period: Period,
  now = new Date(),
): { start: number; end: number } | null {
  if (period === "all") return null;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "lastMonth") {
    end.setFullYear(now.getFullYear(), now.getMonth(), 1);
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  if (period === "thirty" || period === "ninety")
    start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1 - (period === "thirty" ? 30 : 90),
    );
  return { start: +start, end: +end };
}
export function prepare(
  data: Data,
  period: Period = "all",
  source = "all",
  now = new Date(),
) {
  // Conflicting duplicate identities are excluded, never arbitrarily chosen.
  const originals = group(data.records, (r) => r.id);
  const conflictingMeals = new Set(
    [...originals.values()]
      .filter((rows) =>
        rows.some((r) => JSON.stringify(r) !== JSON.stringify(rows[0])),
      )
      .flatMap((rows) => rows.map((r) => r.mealID)),
  );
  const records = [...originals.values()]
    .filter((rows) =>
      rows.every((r) => JSON.stringify(r) === JSON.stringify(rows[0])),
    )
    .map((rows) => rows[0])
    .filter((r) => !conflictingMeals.has(r.mealID))
    .filter(
      (r) =>
        !r.savedAt ||
        (Number.isFinite(Date.parse(r.savedAt)) &&
          Date.parse(r.savedAt) <= +now),
    )
    .filter((r) => source === "all" || r.source === source);
  const valid: RecordRow[] = [];
  const unknown: RecordRow[] = [];
  const future: RecordRow[] = [];
  for (const rows of group(records, (r) => r.mealID).values()) {
    const day = (value: string | null) => {
      if (!value || !Number.isFinite(Date.parse(value))) return null;
      const d = new Date(value);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    };
    const days = unique(rows.map((r) => day(r.date)));
    // One confirmed future dish excludes the whole meal, even with undated siblings.
    if (days.some(value => value !== null && Date.parse(value) > +now)) {
      future.push(...rows);
      continue;
    }
    if (
      days.length !== 1 ||
      !days[0] ||
      !Number.isFinite(Date.parse(days[0]))
    ) {
      unknown.push(...rows);
      valid.push(...rows.map((r) => ({ ...r, date: null })));
    } else if (Date.parse(days[0]) > +now) future.push(...rows);
    else valid.push(...rows.map((r) => ({ ...r, date: days[0] })));
  }
  const window = periodWindow(period, now);
  const selected = valid.filter(
    (r) =>
      !window ||
      (r.date &&
        Date.parse(r.date) >= window.start &&
        Date.parse(r.date) < window.end),
  );
  const ids = new Set(selected.map((r) => r.id));
  const validIDs = new Set(valid.map((r) => r.id));
  const allObservations = [...group(data.observations, (o) => o.id).values()]
    .filter((rows) =>
      rows.every((o) => JSON.stringify(o) === JSON.stringify(rows[0])),
    )
    .map((rows) => rows[0])
    .filter(
      (o) => validIDs.has(o.entryID) && values[o.facet]?.includes(o.value),
    );
  const observations = allObservations.filter((o) => ids.has(o.entryID));
  return {
    records: valid,
    selected,
    observations,
    allObservations,
    unknown,
    future,
    window,
    now,
  };
}
export type State = ReturnType<typeof prepare>;
function dimensionKeys(r: RecordRow, dimension: string): [string, string][] {
  if (dimension === "restaurant" && r.restaurantKey === null) return [];
  if (dimension === "menu" && r.menuKey === null) return [];
  if (dimension === "restaurant")
    return r.restaurant.trim()
      ? [[r.restaurantKey ?? normalized(r.restaurant), r.restaurant]]
      : [];
  if (dimension === "foodKind")
    return r.foodKinds.map((k) => [normalized(k), k]);
  return r.menu.trim()
    ? [
        [
          r.menuKey ??
            JSON.stringify([normalized(r.restaurant), normalized(r.menu)]),
          r.menu,
        ],
      ]
    : [];
}
export function dimensionRows(records: RecordRow[], dimension: string): Row[] {
  const groups = new Map<string, { label: string; records: RecordRow[] }>();
  for (const r of records)
    for (const [id, label] of dimensionKeys(r, dimension)) {
      const v = groups.get(id) ?? { label, records: [] };
      v.records.push(r);
      groups.set(id, v);
    }
  return [...groups]
    .map(([id, v]) => ({
      id,
      title: v.label,
      value: `${mealCount(v.records)}번의 식사`,
      detail: `요리 기록 ${v.records.length}개`,
      entryIDs: v.records.map((r) => r.id),
    }))
    .sort(
      (a, b) =>
        b.entryIDs.length - a.entryIDs.length ||
        a.title.localeCompare(b.title, "ko"),
    );
}
function distribution(
  state: State,
  facet: Facet,
  observations: Observation[],
  base: RecordRow[],
) {
  const recordMap = new Map(base.map((r) => [r.id, r]));
  const key = (r: RecordRow) => (facet === "overall" ? r.id : r.mealID);
  const grouped = group(
    observations.filter((o) => recordMap.has(o.entryID)),
    (o) => key(recordMap.get(o.entryID)!),
  );
  return [...values[facet], "mixed", "missing"].map((value) => {
    const entryIDs: string[] = [];
    const sampleIDs: string[] = [];
    for (const [sample, rows] of group(base, key)) {
      const answers = unique((grouped.get(sample) ?? []).map((o) => o.value));
      const resolved =
        answers.length === 0
          ? "missing"
          : answers.length === 1
            ? answers[0]
            : "mixed";
      if (resolved === value) {
        sampleIDs.push(sample);
        entryIDs.push(...rows.map((r) => r.id));
      }
    }
    return {
      key: value,
      label: labels[value],
      count: sampleIDs.length,
      entryIDs: unique(entryIDs),
      sampleIDs,
    };
  });
}
function sensoryRows(
  state: State,
  facet: Facet,
  domain?: string,
  attribute = "",
): Row[] {
  const obs = state.observations.filter(
    (o) =>
      o.facet !== "overall" &&
      (!domain || domainOf(o) === domain) &&
      (!attribute || senseKey(o) === attribute),
  );
  return [...group(obs, senseKey)].map(([id, rows]) => {
    const presenceIDs = new Set(
      rows
        .filter((o) => o.facet === "presence" || o.facet === facet)
        .map((o) => o.entryID),
    );
    const base = state.selected.filter((r) => presenceIDs.has(r.id));
    const segments = distribution(
      state,
      facet,
      rows.filter((o) => o.facet === facet),
      base,
    );
    return {
      id,
      title: rows[0].label,
      value: `${mealCount(base)}번의 식사`,
      detail: segments
        .filter((s) => s.count)
        .map((s) => `${s.label} ${s.count}`)
        .join(" · "),
      entryIDs: base.map((r) => r.id),
      segments,
    };
  });
}
export function buildCards(
  state: State,
  category: Category,
  options: { domain?: string; attribute?: string; facet?: Facet } = {},
): Card[] {
  const { domain = "맛", attribute = "", facet = "liking" } = options;
  const card = (
    id: string,
    title: string,
    meaning: string,
    rows: Row[],
  ): Card => ({ id, title, meaning, rows });
  if (category === "experience") {
    const cards = [
      card("meals", "기록한 식사", "식사와 요리 기록을 구분해요", [
        {
          id: "meals",
          title: "식사",
          value: `${mealCount(state.selected)}번`,
          detail: `요리 기록 ${state.selected.length}개`,
          entryIDs: state.selected.map((r) => r.id),
        },
      ]),
    ];
    for (const [dim, title] of [
      ["menu", "메뉴"],
      ["restaurant", "식당"],
      ["foodKind", "음식 종류"],
    ])
      cards.push(
        card(
          dim,
          `기록한 ${title}`,
          "동일한 식사 안의 중복은 한 번으로 세어요",
          dimensionRows(state.selected, dim),
        ),
      );
    return cards;
  }
  if (category === "sensation")
    return [
      card(
        "presence",
        "기록한 맛·향·식감",
        domain,
        sensoryRows(state, "presence", domain, attribute),
      ),
      card(
        "intensity",
        "어느 정도로 느꼈나요",
        "느낀 강도",
        sensoryRows(state, "intensity", domain, attribute),
      ),
    ];
  if (category === "preference") {
    const segments = distribution(
      state,
      "overall",
      state.observations.filter((o) => o.facet === "overall"),
      state.selected,
    );
    return [
      card("overall", "음식 전체는 어땠나요", "음식 전체 · 요리별 5단계 평가", [
        {
          id: "overall",
          title: "음식 전체",
          value: `요리 ${segments.filter((s) => s.key !== "missing").reduce((n, s) => n + s.count, 0)}개 평가`,
          detail: "미응답은 보통으로 간주하지 않아요",
          entryIDs: state.selected.map((r) => r.id),
          segments,
        },
      ]),
      card(
        "liking",
        "감각별 호감",
        "좋음·보통·아쉬움",
        sensoryRows(state, "liking", undefined, attribute),
      ),
      card(
        "fit",
        "나에게 맞는 정도",
        "부족·알맞음·과함",
        sensoryRows(state, "fit", undefined, attribute),
      ),
    ];
  }
  if (category === "context") {
    const available = state.observations.filter(
      (o) => o.facet === facet && (!attribute || senseKey(o) === attribute),
    );
    const chosen = attribute || (available[0] && senseKey(available[0]));
    const obs = available.filter((o) => senseKey(o) === chosen);
    const recordMap = new Map(state.selected.map((r) => [r.id, r]));
    return [
      ["foodKind", "음식 종류에 따라"],
      ["target", "음식의 부위에 따라"],
      ["phase", "먹는 시점에 따라"],
      ["intensity", "느낀 강도에 따라"],
    ].map(([dim, title]) => {
      const grouped = new Map<string, Observation[]>();
      for (const o of obs) {
        let keys =
          dim === "foodKind"
            ? (recordMap.get(o.entryID)?.foodKinds ?? [])
            : dim === "target"
              ? [o.target]
              : dim === "phase"
                ? [o.phase]
                : [];
        if (dim === "intensity") {
          const linked = state.observations.filter(
            (i) =>
              i.entryID === o.entryID &&
              senseKey(i) === senseKey(o) &&
              i.facet === "intensity" &&
              i.selection === o.selection &&
              !!i.selection &&
              i.target === o.target &&
              i.phase === o.phase,
          );
          keys = unique(linked.map((i) => i.value));
          if (keys.length !== 1) keys = [];
        }
        for (const key of keys.filter((k) => k && k !== "unspecified"))
          grouped.set(key, [...(grouped.get(key) ?? []), o]);
      }
      const rows = [...grouped].map(([id, answers]) => {
        const ids = new Set(answers.map((o) => o.entryID));
        const base = state.selected.filter((r) => ids.has(r.id));
        return {
          id,
          title: labels[id] ?? conditionLabels[id] ?? id,
          value: `평가한 식사 ${mealCount(base)}번`,
          detail: obs[0]?.label ?? "",
          entryIDs: [...ids],
          segments: distribution(state, facet, answers, base),
        };
      });
      return card(
        `context-${dim}`,
        title,
        `${obs[0]?.label ?? "감각 응답 없음"} · ${facetLabels[facet]}`,
        rows,
      );
    });
  }
  const w = state.window ?? periodWindow("ninety", state.now)!;
  const startDate = new Date(w.start),
    endDate = new Date(w.end);
  const daySpan = Math.round(
    (Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) -
      Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      )) /
      86400000,
  );
  const previousStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate() - daySpan,
  ).getTime();
  const before = state.records.filter(
    (r) =>
      r.date &&
      Date.parse(r.date) >= previousStart &&
      Date.parse(r.date) < w.start,
  );
  const after = state.selected.filter(
    (r) =>
      r.date && Date.parse(r.date) >= w.start && Date.parse(r.date) < w.end,
  );
  const rows = [
    ["meal", "기록한 식사"],
    ["menu", "메뉴"],
    ["restaurant", "식당"],
    ["foodKind", "음식 종류"],
  ].map(([dim, title]) => ({
    id: dim,
    title,
    value: `${dim === "meal" ? mealCount(before) : dimensionRows(before, dim).length} → ${dim === "meal" ? mealCount(after) : dimensionRows(after, dim).length}`,
    detail: "같은 길이의 이전 기간과 최근 기간",
    entryIDs: [...before, ...after].map((r) => r.id),
  }));
  const changeCards = [
    card("change-experience", "경험 범위의 변화", "확인된 식사일 기준", rows),
  ];
  const scope = (records: RecordRow[]) => {
    const ids = new Set(records.map((r) => r.id));
    return {
      ...state,
      selected: records,
      observations: state.allObservations.filter((o) => ids.has(o.entryID)),
    };
  };
  const left = scope(before),
    right = scope(after);
  for (const [f, title] of [
    ["presence", "감각 기록의 변화"],
    ["liking", "호감 평가의 변화"],
    ["fit", "알맞음 응답의 변화"],
  ] as const) {
    const l = sensoryRows(left, f, undefined, attribute),
      r = sensoryRows(right, f, undefined, attribute);
    const keys = unique([...l, ...r].map((row) => row.id));
    const changes: Row[] = keys.flatMap((id) => {
      const a = l.find((row) => row.id === id),
        b = r.find((row) => row.id === id);
      if (f === "presence")
        return [
          {
            id,
            title: (b ?? a)!.title,
            value: `${a?.value ?? "기록 없음"} → ${b?.value ?? "기록 없음"}`,
            detail: "이전·최근 기간에 직접 남긴 감각",
            entryIDs: unique([...(a?.entryIDs ?? []), ...(b?.entryIDs ?? [])]),
          },
        ];
      return [
        ["before", a],
        ["after", b],
      ].map(([side, row]) => ({
        id: `${id}:${side}`,
        title: `${(b ?? a)!.title} · ${side === "before" ? "이전" : "최근"}`,
        value: (row as Row | undefined)?.value ?? "기록 없음",
        detail: (row as Row | undefined)?.detail ?? "직접 응답이 없어요",
        entryIDs: (row as Row | undefined)?.entryIDs ?? [],
        segments: (row as Row | undefined)?.segments,
      }));
    });
    changeCards.push(
      card(
        `change-${f}`,
        title,
        "확인된 식사일 · 같은 길이의 이전·최근 기간",
        changes,
      ),
    );
  }
  return changeCards;
}
export const conditionLabels: Record<string, string> = {
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
  first_bite: "첫입",
  early_meal: "초반",
  during_meal: "먹는 동안",
  late_meal: "나중",
  after_swallow: "삼킨 뒤",
  after_meal: "식사 후",
};
export function eventRows(
  state: State,
  dimension: string,
  first: boolean,
): Row[] {
  return dimensionRows(state.records, dimension).flatMap((row) => {
    const all = state.records.filter((r) => row.entryIDs.includes(r.id));
    if (all.some((r) => !r.date)) return [];
    const meals = [...group(all, (r) => r.mealID).values()].sort(
      (a, b) => Date.parse(a[0].date!) - Date.parse(b[0].date!),
    );
    const eligible = (first ? meals.slice(0, 1) : meals.slice(1))
      .flat()
      .filter((r) => state.selected.some((s) => s.id === r.id));
    return eligible.length
      ? [
          {
            ...row,
            value: `${mealCount(eligible)}번의 식사`,
            entryIDs: eligible.map((r) => r.id),
          },
        ]
      : [];
  });
}
export const discoveryLabels: Record<Category, string[]> = {
  experience: [
    "한 식당, 여러 메뉴",
    "함께 기록한 메뉴",
    "여러 식당의 음식 종류",
    "익숙한 식당의 새 메뉴",
  ],
  sensation: ["함께 느낀 감각"],
  preference: [
    "공통 취향",
    "반복된 만족",
    "전체와 부분의 차이",
    "새 메뉴와 익숙한 취향",
    "다른 한 번의 경험",
  ],
  context: ["강도와 알맞음", "조건별 차이"],
  change: [
    "기억 연결",
    "기억 연결",
    "두 기록 비교",
    "기간별 평가 차이",
    "기간별 알맞음 차이",
    "감각 기록 비중의 차이",
  ],
};
export interface Discovery extends Card {
  category: Category;
  detail: string;
  meaningKey: string;
}
/** Native thresholds from HomeDiscoveryEngine and TDDiscoveryBuilder. Each discovery keeps denominator records. */
export function buildDiscoveries(state: State): Discovery[] {
  const result: Discovery[] = [];
  const add = (
    category: Category,
    kind: string,
    subject: string,
    title: string,
    detail: string,
    rows: RecordRow[],
    meaning: string,
  ) => {
    const id = JSON.stringify([kind, subject, state.window]);
    result.push({
      id,
      category,
      title,
      detail,
      meaning:
        "현재 유효한 기록의 관계이며 실제 모든 식사나 인과 관계를 뜻하지 않아요.",
      meaningKey: JSON.stringify([id, meaning]),
      rows: [
        {
          id,
          title: "근거가 된 기록",
          value: `${mealCount(rows)}번의 식사`,
          detail,
          entryIDs: unique(rows.map((r) => r.id)),
        },
      ],
    });
  };
  for (const restaurant of dimensionRows(state.selected, "restaurant")) {
    const rows = state.selected.filter((r) =>
      restaurant.entryIDs.includes(r.id),
    );
    const menus = dimensionRows(rows, "menu");
    if (menus.length >= 3 && mealCount(rows) >= 2)
      add(
        "experience",
        "restaurantCollection",
        restaurant.id,
        "한 식당, 여러 메뉴",
        `${restaurant.title}에 ${menus.length}가지 메뉴가 쌓였어요. ${mealCount(rows)}번의 식사에 남긴 기록이에요.`,
        rows,
        `milestone:${Math.floor(menus.length / 3)}`,
      );
  }
  const menuPairs = new Map<string, { a: Row; b: Row; meals: Set<string> }>();
  for (const [meal, records] of group(state.selected, (r) => r.mealID)) {
    const menus = dimensionRows(records, "menu").sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    for (let i = 0; i < menus.length; i++)
      for (let j = i + 1; j < menus.length; j++) {
        const id = JSON.stringify([menus[i].id, menus[j].id]);
        const pair = menuPairs.get(id) ?? {
          a: menus[i],
          b: menus[j],
          meals: new Set<string>(),
        };
        pair.meals.add(meal);
        menuPairs.set(id, pair);
      }
  }
  const allMenus = dimensionRows(state.selected, "menu");
  for (const [id, pair] of menuPairs) {
    if (pair.meals.size < 3) continue;
    const aIDs = new Set(allMenus.find((r) => r.id === pair.a.id)!.entryIDs),
      bIDs = new Set(allMenus.find((r) => r.id === pair.b.id)!.entryIDs);
    const a = state.selected.filter((r) => aIDs.has(r.id)),
      b = state.selected.filter((r) => bIDs.has(r.id));
    add(
      "experience",
      "menuCooccurrence",
      id,
      "함께 기록한 메뉴",
      `${pair.a.title}을 기록한 ${mealCount(a)}번 중 ${pair.meals.size}번에 ${pair.b.title}도 함께 남겼어요.`,
      [...a, ...b],
      JSON.stringify(
        a
          .filter((r) => !pair.meals.has(r.mealID))
          .map((r) => r.mealID)
          .sort(),
      ),
    );
  }
  for (const menu of allMenus) {
    const entries = state.selected.filter((r) => menu.entryIDs.includes(r.id));
    const rated = [...group(entries, (r) => r.mealID).values()]
      .map((records) => {
        const ids = new Set(records.map((r) => r.id));
        return unique(
          state.observations
            .filter((o) => ids.has(o.entryID) && o.facet === "overall")
            .map((o) => o.value),
        );
      })
      .filter((v) => v.length);
    const positive = rated.filter((values) =>
      values.every((v) => ["positive", "very_positive"].includes(v)),
    ).length;
    if (positive >= 3 && positive / rated.length >= 0.75)
      add(
        "preference",
        "repeatedGoodEvaluation",
        menu.id,
        "반복된 만족",
        `${menu.title}에 좋은 평가를 남긴 식사 ${positive}번 · 직접 평가가 있는 식사 ${rated.length}번`,
        entries,
        JSON.stringify(
          state.observations
            .filter(
              (o) =>
                menu.entryIDs.includes(o.entryID) &&
                o.facet === "overall" &&
                !["positive", "very_positive"].includes(o.value),
            )
            .map((o) => o.entryID)
            .sort(),
        ),
      );
  }
  const pairs = new Map<string, { title: string; ids: Set<string> }>();
  for (const [entry, observations] of group(
    state.observations.filter((o) => o.facet === "presence"),
    (o) => o.entryID,
  )) {
    const senses = [...group(observations, senseKey)].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    for (let i = 0; i < senses.length; i++)
      for (let j = i + 1; j < senses.length; j++) {
        const id = JSON.stringify([senses[i][0], senses[j][0]]),
          pair = pairs.get(id) ?? {
            title: `${senses[i][1][0].label} + ${senses[j][1][0].label}`,
            ids: new Set<string>(),
          };
        pair.ids.add(entry);
        pairs.set(id, pair);
      }
  }
  for (const [id, pair] of pairs) {
    const rows = state.selected.filter((r) => pair.ids.has(r.id));
    if (mealCount(rows) >= 3)
      add(
        "sensation",
        "sensoryCooccurrence",
        id,
        "함께 느낀 감각",
        `${pair.title}을 같은 요리에서 함께 남긴 식사가 ${mealCount(rows)}번 있어요.`,
        rows,
        "together",
      );
  }
  return result.sort((a, b) => a.id.localeCompare(b.id));
}
