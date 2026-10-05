import { DINING_SELECTION_CATALOG } from "../../../scripts/tba-platform-pilot/dining-selections.mjs";
import { sha256 } from "../../../scripts/tba-engine/sha256.mjs";
import { canonical, type NativeRecord } from "./nativeRecord";
import { swiftDate } from "./nativeArchive";
import type {
  NativeAnalysisSnapshot,
  AnalysisObservation,
} from "./nativeAnalysis";
import { nativeAnalysisSources } from "./nativeAnalysis";
import { rankDiscoveries, type DiscoveryIdentity } from "./nativeJournalPolicy";
import { periodWindow, type Category, type Period } from "./engine";
import { DISH_KIND_OPTIONS } from "../../constants/dishKindTags";
import {
  buildDiscoveryRelations,
  type DiscoveryRelation,
  type DiscoveryProofGroup,
} from "./nativeDiscoveryRelations";
export const tdKey = (parts: string[]) =>
  parts.map((s) => `${new TextEncoder().encode(s).length}:${s}`).join("");
const unique = (rows: string[]) => [...new Set(rows)].sort();
const group = <T>(rows: T[], key: (r: T) => string) => {
  const map = new Map<string, T[]>();
  for (const row of rows)
    map.set(key(row), [...(map.get(key(row)) ?? []), row]);
  return map;
};
const clean = (value: unknown) =>
  typeof value === "string" ? value.trim().normalize("NFC") : "";
const date = (value: number | undefined | null) => {
  const iso = swiftDate(value);
  return iso ? +new Date(iso) : null;
};
const day = (value: number) => {
  const d = new Date(value);
  return +new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const meal = (e: NativeRecord) => (e.mealID ?? e.id).toUpperCase();
const count = (entries: NativeRecord[]) => new Set(entries.map(meal)).size;
export const homeDiscoveryLabels: Record<string, string> = {
  restaurantCollection: "한 식당, 여러 메뉴",
  repeatedGoodEvaluation: "반복된 만족",
  timeGap: "기억 연결",
  lastYear: "기억 연결",
  menuCooccurrence: "함께 기록한 메뉴",
  foodKindAcrossRestaurants: "여러 식당의 음식 종류",
  newMenuAtKnownRestaurant: "익숙한 식당의 새 메뉴",
  sensoryCooccurrence: "함께 느낀 감각",
  commonPreference: "공통 취향",
  preferredIntensity: "강도와 알맞음",
  conditionalContrast: "조건별 차이",
  patternException: "다른 한 번의 경험",
  overallContrast: "전체와 부분의 차이",
  revisitComparison: "두 기록 비교",
  periodChange: "기간별 평가 차이",
  familiarTasteInNewMenu: "새 메뉴와 익숙한 취향",
  sensoryPeriodChange: "감각 기록 비중의 차이",
  fitPeriodChange: "기간별 알맞음 차이",
};
export interface NativeHomeDiscovery extends DiscoveryIdentity {
  category: Category;
  title: string;
  detail: string;
  explanation: string;
  evidenceIDs: string[];
  entryIDs: string[];
  numeratorIDs: string[];
  denominatorIDs: string[];
  contextIDs: string[];
  sourceRevisions: Record<string, number>;
  fingerprints: Record<string, string>;
  limitations: string[];
  scopeLabel: string;
  photoFilename?: string | null;
  evidenceSummary?: string;
  evidenceGroups?: DiscoveryProofGroup[];
}
export function nativeDiscoveryIsCurrent(
  card: NativeHomeDiscovery,
  entries: NativeRecord[],
) {
  const byID = new Map(entries.map((e) => [e.id.toUpperCase(), canonical(e)]));
  return Object.entries(card.fingerprints).every(
    ([id, value]) => byID.get(id) === value,
  );
}
export function buildNativeHomeDiscoveries(
  originals: NativeRecord[],
  snapshot: NativeAnalysisSnapshot,
  now = new Date(),
  options: { period?: Period; source?: string } = {},
): NativeHomeDiscovery[] {
  const period = options.period ?? "all",
    source = options.source ?? "all",
    window = periodWindow(period, now),
    sourceLabel: Record<string, string> = {
      all: "전체",
      restaurant: "식당 음식",
      homeCooked: "직접 만든 요리",
      unknown: "출처 미확인",
    },
    today = day(+now);
  const dates = new Map<string, number>(),
    invalidMeals = new Set<string>(),
    byID = group(originals, (e) => e.id.toUpperCase());
  for (const rows of byID.values())
    if (rows.some((e) => canonical(e) !== canonical(rows[0])))
      rows.forEach((e) => invalidMeals.add(meal(e)));
  let all = [...byID.values()]
    .map((rows) => rows[0])
    .filter(
      (e) =>
        !invalidMeals.has(meal(e)) &&
        (date(e.observedAt ?? e.date) ?? Infinity) <= +now,
    )
    .sort(
      (a, b) =>
        (date(b.observedAt ?? b.date) ?? 0) -
          (date(a.observedAt ?? a.date) ?? 0) ||
        (a.id.toUpperCase() < b.id.toUpperCase()
          ? -1
          : a.id.toUpperCase() > b.id.toUpperCase()
            ? 1
            : 0),
    );
  for (const [id, rows] of group(all, meal)) {
    const values = rows.map((e) =>
      e.mealTime?.source === "user_confirmed" &&
      (date(e.mealTime.confirmedAt) ?? -Infinity) <= +now
        ? date(e.mealTime.start)
        : null,
    );
    if (values.some((v) => v !== null && day(v) > today)) {
      invalidMeals.add(id);
      continue;
    }
    const days = unique(
      values.map((v) => (v === null ? "unknown" : String(day(v)))),
    );
    if (days.length === 1 && days[0] !== "unknown")
      dates.set(id, Number(days[0]));
  }
  all = all.filter((e) => !invalidMeals.has(meal(e)));
  const selected = all.filter(
    (e) =>
      (source === "all" || (e.foodSource?.kind ?? "unknown") === source) &&
      (!window ||
        (dates.has(meal(e)) &&
          dates.get(meal(e))! >= window.start &&
          dates.get(meal(e))! < window.end)),
  );
  const originalsByID = new Map(all.map((e) => [e.id.toLowerCase(), e]));
  const menuKey = (e: NativeRecord) => {
    if (e.foodSource?.kind === "homeCooked")
      return clean(e.foodSource.homeCookingID)
        ? tdKey(["homeCooked", clean(e.foodSource.homeCookingID)])
        : null;
    const r = restaurantKey(e),
      token = clean(e.menuItemID)
        ? tdKey(["id", clean(e.menuItemID)])
        : clean(e.menu)
          ? tdKey(["name", clean(e.menu)])
          : null;
    return r && token ? tdKey([r, token]) : null;
  };
  const restaurantKey = (e: NativeRecord) =>
    e.foodSource?.kind === "homeCooked" || !clean(e.restaurantID)
      ? null
      : tdKey([
          clean(e.foodSource?.restaurantNamespace) || "tastebuddy.restaurant",
          clean(e.restaurantID),
        ]);
  const menuLabel = (e: NativeRecord) =>
    e.foodSource?.kind === "homeCooked"
      ? `${clean(e.menu) || "직접 만든 요리"} · 직접 만든 요리`
      : `${clean(e.menu) || "이름 미확인 메뉴"} · ${clean(e.restaurant) || "이름 미확인 식당"}`;
  const menus = group(
      selected.filter((e) => menuKey(e)),
      (e) => menuKey(e)!,
    ),
    allMenus = group(
      all.filter((e) => menuKey(e)),
      (e) => menuKey(e)!,
    );
  const validSources = new Set(
    snapshot.completed
      .filter(
        (e) =>
          originalsByID.has(e.id.toLowerCase()) &&
          canonical(originalsByID.get(e.id.toLowerCase())) === canonical(e),
      )
      .map((e) => e.id.toLowerCase()),
  );
  const facets: Record<string, string> = {
    sensory_presence: "presence",
    sensory_intensity: "intensity",
    attribute_liking: "liking",
    preference_fit: "fit",
    overall_liking: "overall",
  };
  const current = nativeAnalysisSources(all, "discovery-validation");
  const signature = (o: AnalysisObservation) =>
    canonical([
      o.experienceId,
      o.mealId,
      o.kind,
      o.attribute,
      o.reference,
      o.scale,
      o.value,
      o.target,
      o.phase,
      o.selectionEvidence,
    ]);
  const currentByID = new Map(
    current.observations
      .filter((o) => o.selectionEvidence)
      .map((o) => [o.observationId, signature(o)]),
  );
  const groupedObservations = group(
    snapshot.observations,
    (o) => o.observationId,
  );
  const direct = [...groupedObservations.values()].flatMap((rows) => {
    const o = rows[0];
    return validSources.has(o.experienceId) &&
      currentByID.get(o.observationId) === signature(o) &&
      rows.every((r) => canonical(r) === canonical(o))
      ? [o]
      : [];
  });
  const matched = new Set(direct.map((o) => o.observationId));
  const missing = current.observations.filter(
    (o) => o.selectionEvidence && !matched.has(o.observationId),
  );
  const issues = [...current.unresolved, ...missing]
    .filter((p) => originalsByID.has(p.experienceId) && p.selectionEvidence)
    .map((p) => {
      const evidence = p.selectionEvidence,
        definition: any = DINING_SELECTION_CATALOG.find(
          (c) => c.id === evidence.selectionID && c.type === evidence.type,
        );
      return {
        entryID: p.experienceId,
        selection: JSON.stringify([
          evidence.type,
          evidence.selectionID,
          evidence.catalogVersion,
          evidence.relatedBubbleID ?? "",
          ...(evidence.selectionInstanceID != null ? [evidence.selectionInstanceID] : []),
        ]),
        meal: meal(originalsByID.get(p.experienceId)!),
        facet:
          "kind" in p && facets[String(p.kind)]
            ? facets[String(p.kind)]
            : evidence.type === "overallEvaluation"
              ? "overall"
              : ((
                  {
                    intensity: "intensity",
                    liking: "liking",
                    preferenceFit: "fit",
                  } as Record<string, string>
                )[evidence.facet] ?? null),
        attribute: definition?.attribute ?? null,
        reference: definition?.reference ? definition.label : null,
      };
    });
  const tdObservations = direct.filter(
    (o) =>
      validSources.has(o.experienceId) &&
      (o.kind === "overall_liking" ||
        (!!o.attribute && !o.attribute.endsWith(".unspecified"))) &&
      o.selectionEvidence &&
      o.selectionEvidence.resolution === "resolved" &&
      (o.knownAt
        ? Date.parse(o.knownAt)
        : date(originalsByID.get(o.experienceId)!.date)!) <= +now,
  );
  const observations = tdObservations.filter(
    (o) =>
      !issues.some(
        (issue) =>
          issue.meal === o.mealId.toUpperCase() &&
          (!issue.facet || issue.facet === facets[o.kind]) &&
          (!issue.attribute ||
            (issue.attribute === o.attribute &&
              (issue.reference ?? null) === (o.reference ?? null))),
      ),
  );
  const windowScope = () => {
    if (!window)
      return source === "all"
        ? "wholeArchive"
        : tdKey(["period", tdKey(["", ""])]);
    if (period === "month")
      return tdKey([
        "period",
        tdKey([
          "이번 달",
          new Date(window.start).toISOString().replace(".000Z", "Z"),
        ]),
      ]);
    const label =
      period === "thirty"
        ? "최근 30일"
        : period === "ninety"
          ? "최근 90일"
          : null;
    return tdKey([
      "period",
      label ??
        tdKey([
          new Date(window.start).toISOString().replace(".000Z", "Z"),
          new Date(window.end).toISOString().replace(".000Z", "Z"),
        ]),
    ]);
  };
  const scope = windowScope(),
    scopeLabel = window
      ? `${new Date(window.start).toLocaleDateString("ko-KR")} – ${new Date(window.end - 1).toLocaleDateString("ko-KR")}`
      : "전체 기록에서 발견";
  const output: NativeHomeDiscovery[] = [];
  const metadata = (
    rows: NativeRecord[],
    evidence: AnalysisObservation[] = [],
  ) => {
    const records = [
      ...new Map(rows.map((e) => [e.id.toUpperCase(), e])).values(),
    ];
    return {
      entryIDs: records.map((e) => e.id.toUpperCase()).sort(),
      evidenceIDs: unique(evidence.map((o) => o.observationId)),
      sourceRevisions: Object.fromEntries(
        records.map((e) => [e.id.toUpperCase(), e.memoryRevision ?? 0]),
      ),
      fingerprints: Object.fromEntries(
        records.map((e) => [e.id.toUpperCase(), canonical(e)]),
      ),
      photoFilename: records
        .sort(
          (a, b) =>
            (date(b.observedAt) ?? 0) - (date(a.observedAt) ?? 0) ||
            (a.id < b.id ? -1 : 1),
        )
        .find((e) => e.reflectionPhotoFilename)?.reflectionPhotoFilename,
    };
  };
  const add = (
    kind: string,
    subject: string,
    title: string,
    detail: string,
    rows: NativeRecord[],
    meaning: string,
    category: Category,
    opts: {
      td?: boolean;
      evidence?: AnalysisObservation[];
      numerator?: NativeRecord[];
      denominator?: NativeRecord[];
      context?: NativeRecord[];
      explanation?: string;
      temporal?: boolean;
      relation?: DiscoveryRelation;
    } = {},
  ) => {
    if (!rows.length) return;
    const meta = metadata(rows, opts.evidence),
      cardScope = opts.relation?.td
        ? opts.relation.scope
        : opts.temporal
          ? "wholeArchive"
          : scope;
    let id = opts.td
      ? sha256(
          tdKey([
            "gastronomy-relations/2",
            kind,
            subject,
            cardScope,
            sourceLabel[source] ?? source,
          ]),
        )
      : opts.relation
        ? sha256(
            JSON.stringify([
              "home-discovery/2",
              kind,
              subject,
              opts.relation.scope,
            ]),
          )
        : sha256(`home-discovery/2|${kind}|${subject}`);
    let meaningKey = opts.td
      ? sha256(
          tdKey([
            kind,
            subject,
            cardScope,
            sourceLabel[source] ?? source,
            meaning,
          ]),
        )
      : opts.relation
        ? sha256(JSON.stringify([id, meaning]))
        : sha256(`${id}|${meaning}`);
    if (!opts.td && !opts.temporal && (window || source !== "all")) {
      const key = tdKey([cardScope, sourceLabel[source] ?? source]);
      id = sha256(tdKey([id, key]));
      meaningKey = sha256(meaningKey + key);
    }
    const revisionKey = sha256(
      tdKey([
        id,
        title,
        detail,
        ...Object.entries(meta.fingerprints).map(([id, fp]) => tdKey([id, fp])),
        ...meta.evidenceIDs,
      ]),
    );
    output.push({
      ...meta,
      id,
      revisionKey,
      meaningKey,
      kind,
      subjectID: subject,
      title,
      detail,
      category,
      scopeLabel:
        opts.relation?.scopeLabel ??
        (opts.temporal ? "전체 기록에서 발견" : scopeLabel),
      explanation:
        opts.explanation ??
        "현재 유효한 원본의 관계를 확인했어요. 미응답과 정체성·날짜 미확인을 임의로 채우지 않아요.",
      limitations: opts.relation?.limits ?? [
        "기록한 식사의 범위이며 실제 모든 식사나 고정된 취향을 뜻하지 않아요.",
      ],
      evidenceSummary: opts.relation?.summary,
      evidenceGroups: opts.relation?.groups,
      relevance:
        opts.relation?.strength ??
        (opts.td ? 55 : kind === "repeatedGoodEvaluation" ? 35 : 10),
      sortDate: Math.max(
        ...rows.map((e) =>
          opts.td
            ? (dates.get(meal(e)) ?? -62135769600000)
            : opts.relation
              ? (dates.get(meal(e)) ?? date(e.observedAt ?? e.date) ?? 0)
              : (date(e.observedAt ?? e.date) ?? 0),
        ),
      ),
      numeratorIDs: unique(
        (opts.numerator ?? rows).map((e) => e.id.toUpperCase()),
      ),
      denominatorIDs: unique(
        (opts.denominator ?? rows).map((e) => e.id.toUpperCase()),
      ),
      contextIDs: unique((opts.context ?? []).map((e) => e.id.toUpperCase())),
    });
  };
  const milestone = (n: number) =>
    [3, 5, 10, 20, 50, 100].filter((v) => n >= v).pop() ?? 0;
  for (const [id, rows] of group(
    selected.filter((e) => restaurantKey(e)),
    (e) => restaurantKey(e)!,
  )) {
    const named = rows.filter((e) => menuKey(e)),
      n = new Set(named.map(menuKey)).size;
    if (n >= 3 && count(named) >= 2 && named[0]?.restaurant.trim())
      add(
        "restaurantCollection",
        `restaurant:${id}`,
        `${named[0].restaurant}\n${n}가지 메뉴가 쌓였어요`,
        `${count(named)}번의 식사에 남긴 메뉴 기록`,
        named,
        `milestone:${milestone(n)}`,
        "experience",
        {
          explanation:
            "이 식당에 연결된 서로 다른 메뉴를 셌어요. 메뉴 ID가 없을 때는 식당과 메뉴명을 함께 구분해요.",
        },
      );
  }
  for (const [id, rows] of menus) {
    const ratings = observations.filter(
      (o) =>
        o.kind === "overall_liking" &&
        o.scale === "overall-five-category-v1" &&
        o.selectionEvidence.type === "overallEvaluation" &&
        rows.some((e) => e.id.toLowerCase() === o.experienceId),
    );
    const byMeal = group(ratings, (o) => o.mealId.toUpperCase()),
      good = [...byMeal.values()].filter((r) =>
        r.every((o) => ["positive", "very_positive"].includes(o.value)),
      ),
      positiveIDs = new Set(good.flat().map((o) => o.experienceId));
    if (good.length >= 3 && good.length / byMeal.size >= 0.75)
      add(
        "repeatedGoodEvaluation",
        `menu:${id}`,
        `${rows[0].menu}\n좋은 평가를 남긴 식사 ${good.length}번`,
        `${rows[0].restaurant} · 직접 평가가 있는 식사 ${byMeal.size}번`,
        rows,
        `positive|counter:${ratings
          .filter((o) => !["positive", "very_positive"].includes(o.value))
          .map((o) => o.mealId.toUpperCase())
          .sort()
          .join(",")}`,
        "preference",
        {
          evidence: ratings,
          numerator: rows.filter((e) => positiveIDs.has(e.id.toLowerCase())),
          denominator: rows.filter((e) =>
            ratings.some((o) => o.experienceId === e.id.toLowerCase()),
          ),
          explanation:
            "좋다고 직접 평가한 서로 다른 식사만 셌어요. 미응답과 별점은 사용하지 않고, 다른 평가와 미응답 기록도 원본에 함께 남겨요.",
        },
      );
  }
  const format = (value: number) =>
    new Date(value)
      .toLocaleDateString("ko-KR")
      .replace(/\.\s*/g, ".")
      .replace(/\.$/, "");
  for (const [id, rows] of allMenus) {
    const dated = [...group(rows, meal)]
      .flatMap(([mealID]) =>
        dates.has(mealID) ? [{ mealID, date: dates.get(mealID)! }] : [],
      )
      .sort((a, b) => a.date - b.date || (a.mealID < b.mealID ? -1 : 1));
    if (dated.length >= 2) {
      const [a, b] = dated.slice(-2),
        gap = Math.round((b.date - a.date) / 86400000),
        age = Math.round((today - b.date) / 86400000);
      if (gap >= 60 && age >= 0 && age <= 90)
        add(
          "timeGap",
          `menu:${id}`,
          `${rows[0].menu}\n두 식사 기록 사이 ${gap}일`,
          `${format(a.date)} · ${format(b.date)}`,
          rows.filter((e) => [a.mealID, b.mealID].includes(meal(e))),
          "initial",
          "change",
          {
            temporal: true,
            explanation:
              "같은 메뉴의 확인된 식사일 두 개를 비교했어요. 그 사이에 이 음식을 먹지 않았다는 뜻은 아니에요.",
          },
        );
    }
  }
  const anniversary = new Date(today);
  anniversary.setFullYear(anniversary.getFullYear() - 1);
  for (const [id, rows] of group(all, meal))
    if (
      dates.has(id) &&
      Math.abs(dates.get(id)! - +anniversary) <= 7 * 86400000
    )
      add(
        "lastYear",
        `meal:${id}`,
        "지난해 이맘때의 식사 기록",
        [
          format(dates.get(id)!),
          rows[0].restaurant,
          rows.length === 1 ? rows[0].menu : `메뉴 기록 ${rows.length}개`,
        ]
          .filter(Boolean)
          .join(" · "),
        rows,
        "initial",
        "change",
        {
          temporal: true,
          explanation:
            "지난해 오늘 전후 7일에 해당하는, 식사일이 확인된 기록이에요.",
        },
      );
  const pairs = new Map<string, { a: string; b: string; meals: Set<string> }>();
  for (const [id, rows] of group(selected, meal)) {
    const keys = unique(rows.map(menuKey).filter((v): v is string => !!v));
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) {
        const key = tdKey([keys[i], keys[j]]),
          pair = pairs.get(key) ?? { a: keys[i], b: keys[j], meals: new Set() };
        pair.meals.add(id);
        pairs.set(key, pair);
      }
  }
  for (const [id, pair] of pairs) {
    if (pair.meals.size < 3) continue;
    const a = menus.get(pair.a)!,
      b = menus.get(pair.b)!,
      together = [...a, ...b].filter((e) => pair.meals.has(meal(e))),
      other = [...a, ...b].filter((e) => !pair.meals.has(meal(e)));
    add(
      "menuCooccurrence",
      `menu-pair:${id}`,
      "함께 기록한 메뉴",
      `${menuLabel(a[0])}을 기록한 ${count(a)}번 중 ${pair.meals.size}번에 ${menuLabel(b[0])}도 함께 남겼어요.`,
      [...a, ...b],
      tdKey([
        "cooccurrence",
        ...unique(a.filter((e) => !pair.meals.has(meal(e))).map(meal)),
      ]),
      "experience",
      { td: true, numerator: together, denominator: a, context: other },
    );
  }
  for (const kind of DISH_KIND_OPTIONS) {
    const rows = selected.filter((e) =>
        (e.dishKindIDs ?? []).includes(kind.id),
      ),
      restaurants = unique(
        rows.map(restaurantKey).filter((v): v is string => !!v),
      );
    if (restaurants.length >= 3)
      add(
        "foodKindAcrossRestaurants",
        `foodKind:${kind.id}`,
        "여러 식당에서 만난 음식 종류",
        `${kind.label} 분류를 서로 다른 식당 ${restaurants.length}곳에서 기록했어요.`,
        rows,
        "across-restaurants",
        "experience",
        {
          td: true,
          numerator: rows.filter((e) => restaurantKey(e)),
          denominator: rows,
        },
      );
  }
  for (const [id, rows] of allMenus) {
    if (rows.some((e) => !dates.has(meal(e)))) continue;
    const firstDate = Math.min(...rows.map((e) => dates.get(meal(e))!)),
      first = rows.find((e) => dates.get(meal(e)) === firstDate)!,
      restaurant = restaurantKey(first);
    if (!restaurant) continue;
    const prior = all.filter(
        (e) =>
          restaurantKey(e) === restaurant &&
          (dates.get(meal(e)) ?? Infinity) < firstDate,
      ),
      current = selected.filter(
        (e) => menuKey(e) === id && dates.get(meal(e)) === firstDate,
      );
    if (prior.length && current.length)
      add(
        "newMenuAtKnownRestaurant",
        `menu:${id}`,
        "익숙한 식당의 새로운 메뉴",
        `이전에 기록한 ${first.restaurant}에서 ${menuLabel(first)}를 처음 확인했어요.`,
        [...current, ...prior],
        `first:${new Date(firstDate).toISOString().replace(".000Z", "Z")}`,
        "experience",
        { td: true, numerator: current, denominator: current, context: prior },
      );
  }
  const selectedIDs = new Set(selected.map((e) => e.id.toLowerCase())),
    presence = observations.filter(
      (o) =>
        selectedIDs.has(o.experienceId) &&
        o.kind === "sensory_presence" &&
        o.value === true,
    );
  const sensoryPairs = new Map<
    string,
    { title: string; entries: Set<string>; observations: AnalysisObservation[] }
  >();
  for (const [entryID, rows] of group(presence, (o) => o.experienceId)) {
    const senses = group(rows, (o) =>
        tdKey([o.attribute ?? "", o.reference ?? ""]),
      ),
      keys = [...senses.keys()].sort();
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) {
        const a = senses.get(keys[i])!,
          b = senses.get(keys[j])!,
          id = tdKey([keys[i], keys[j]]),
          pair = sensoryPairs.get(id) ?? {
            title: `${a[0].attributeLabel} + ${b[0].attributeLabel}`,
            entries: new Set(),
            observations: [],
          };
        pair.entries.add(entryID);
        pair.observations.push(...a, ...b);
        sensoryPairs.set(id, pair);
      }
  }
  for (const [id, pair] of sensoryPairs) {
    const rows = selected.filter((e) => pair.entries.has(e.id.toLowerCase()));
    if (count(rows) >= 3)
      add(
        "sensoryCooccurrence",
        `sensory-pair:${id}`,
        "함께 느낀 감각",
        `${pair.title}을 같은 요리에서 함께 남긴 식사가 ${count(rows)}번 있어요.`,
        rows,
        "together",
        "sensation",
        { td: true, evidence: pair.observations },
      );
  }
  for (const relation of buildDiscoveryRelations({
    all,
    selected,
    observations,
    tdObservations,
    issues,
    dates,
    menuKey,
    now,
    period,
    source,
    tdKey,
  }))
    add(
      relation.kind,
      relation.subject,
      relation.title,
      relation.detail,
      relation.rows,
      relation.meaning,
      relation.category,
      {
        relation,
        td: relation.td,
        temporal: relation.temporal,
        evidence: relation.evidence,
        numerator: relation.numerator,
        denominator: relation.denominator,
        context: relation.context,
        explanation: relation.explanation,
      },
    );
  return rankDiscoveries(
    [...new Map(output.map((card) => [card.id, card])).values()],
    now,
  );
}
