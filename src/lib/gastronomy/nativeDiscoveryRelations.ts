/** Current HomeDiscoveryRelations + TDDiscoveryBuilder policies, shared by Home and categories. */
import {
  buildPersonalTasteModel,
  PERSONAL_TASTE_POLICY,
} from "../../../scripts/tba-engine/personal-taste-model.mjs";
import {
  buildFitPatterns,
  buildOverallPatterns,
} from "../../../scripts/tba-engine/personal-taste-insights.mjs";
import type { AnalysisObservation as Observation } from "./nativeAnalysis";
import type { NativeRecord } from "./nativeRecord";
import {
  periodWindow,
  periodLabels,
  type Category,
  type Period,
} from "./engine";
import { QUESTION_CHOICES } from "./nativeQuestions";

const key = JSON.stringify;
const unique = (values: string[]) => [...new Set(values)].sort();
const group = <T>(rows: T[], identity: (row: T) => string) => {
  const result = new Map<string, T[]>();
  for (const row of rows) {
    const id = identity(row);
    result.set(id, [...(result.get(id) ?? []), row]);
  }
  return new Map([...result].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
};
const meal = (e: NativeRecord) => (e.mealID ?? e.id).toLowerCase();
const context = (r: {
  attribute: string | null;
  reference: string | null;
  target: string;
  phase: string;
}) => key([r.attribute ?? "", r.reference ?? "", r.target, r.phase]);
const sense = (r: { attribute: string | null; reference: string | null }) =>
  key([r.attribute ?? "", r.reference ?? ""]);
const directionLabel = (v: string) =>
  ({ positive: "좋았어요", negative: "아쉬웠어요", neutral: "보통이에요" })[
    v
  ] ?? "다른 응답";
const overallLabel = (v: string) =>
  ({ very_positive: "정말 좋았어요", very_negative: "많이 아쉬웠어요" })[v] ??
  directionLabel(v);
const intensityLabel = (v: string | null) =>
  ({ weak: "약한 강도", medium: "중간 강도", strong: "강한 강도" })[v ?? ""] ??
  "미지정";
const fitLabel = (v: string) =>
  ({
    below_preferred: "부족함",
    just_right: "알맞음",
    above_preferred: "과함",
  })[v] ?? "미확인";
const scopeLabel = (r: { target: string; phase: string }) =>
  `${QUESTION_CHOICES.target[r.target] ?? "대상 미지정"} · ${QUESTION_CHOICES.phase[r.phase] ?? "시점 미지정"}`;
const dateText = (value: number) => {
  const d = new Date(value);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};
const addDays = (value: number, days: number) => {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return +d;
};
const dayNumber = (value: number) => {
  const d = new Date(value);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
};
type Unit = {
  mealID: string;
  experienceIDs: string[];
  attribute: string;
  reference: string | null;
  label: string;
  target: string;
  phase: string;
  intensity: string | null;
  intensityConflict: boolean;
  liking: string;
  evidenceIDs: string[];
};
const ids = (units: Unit[]) => unique(units.flatMap((u) => u.evidenceIDs));

export interface DiscoveryProofGroup {
  label: string;
  observationIDs: string[];
  entryIDs: string[];
  mealIDs: string[];
}
export interface DiscoveryRelation {
  kind: string;
  subject: string;
  scope: string;
  title: string;
  detail: string;
  explanation: string;
  rows: NativeRecord[];
  evidence: Observation[];
  numerator: NativeRecord[];
  denominator: NativeRecord[];
  context: NativeRecord[];
  groups: DiscoveryProofGroup[];
  summary: string;
  limits: string[];
  meaning: string;
  strength: number;
  category: Category;
  temporal: boolean;
  td?: boolean;
  scopeLabel?: string;
}
export interface DiscoveryRelationInput {
  all: NativeRecord[];
  selected: NativeRecord[];
  observations: Observation[];
  dates: Map<string, number>;
  tdObservations: Observation[];
  issues: DiscoveryIssue[];
  menuKey: (e: NativeRecord) => string | null;
  now: Date;
  period: Period;
  source: string;
  tdKey: (parts: string[]) => string;
}
export interface DiscoveryIssue {
  entryID: string;
  facet: string | null;
  attribute: string | null;
  reference: string | null;
  selection: string;
}

// Same selection or a current, matching parent/child only. A sibling never supplies intensity.
export function validatedDiscoveryIntensityLinks(
  records: Observation[],
  issues: DiscoveryIssue[] = [],
): Record<string, string[]> {
  const selection = (r: Observation) => {
    const e = r.selectionEvidence;
    return key([
      e.type,
      e.selectionID,
      e.catalogVersion,
      e.relatedBubbleID ?? "",
      ...(e.selectionInstanceID != null ? [e.selectionInstanceID] : []),
    ]);
  };
  const scope = (r: Observation) => key([r.experienceId, context(r)]);
  const parent = new Map<string, string>();
  for (const r of records) {
    const e = r.selectionEvidence;
    if (!e?.relatedBubbleID) continue;
    const choices = unique(
      records
        .filter(
          (p) =>
            p.kind === "sensory_presence" &&
            p.value === true &&
            p.selectionEvidence?.type === "bubble" &&
            p.selectionEvidence.selectionID === e.relatedBubbleID &&
            p.selectionEvidence.catalogVersion === e.catalogVersion &&
            scope(p) === scope(r),
        )
        .map(selection),
    );
    if (choices.length === 1) parent.set(r.observationId, choices[0]);
  }
  const result: Record<string, string[]> = {};
  for (const r of records.filter((r) =>
    ["attribute_liking", "preference_fit"].includes(r.kind),
  )) {
    const matches = records.filter(
      (i) =>
        i.kind === "sensory_intensity" &&
        i.scale === "expression-strength-v1" &&
        scope(i) === scope(r) &&
        (selection(i) === selection(r) ||
          parent.get(i.observationId) === selection(r) ||
          parent.get(r.observationId) === selection(i)),
    );
    const selections = new Set([
      selection(r),
      ...matches.map(selection),
      ...(parent.has(r.observationId) ? [parent.get(r.observationId)!] : []),
    ]);
    const unresolved = issues.some(
      (i) =>
        i.entryID === r.experienceId &&
        (!i.facet || i.facet === "intensity") &&
        (!i.attribute ||
          (i.attribute === r.attribute && i.reference === r.reference)) &&
        (!i.selection || selections.has(i.selection)),
    );
    result[r.observationId] =
      !unresolved && unique(matches.map((i) => String(i.value))).length === 1
        ? matches.map((i) => i.observationId).sort()
        : [];
  }
  return result;
}
function votes(units: Unit[]) {
  const values = new Map(
    [...group(units, (u) => u.mealID)].map(([id, rows]) => {
      const v = unique(rows.map((r) => r.liking));
      return [id, v.length === 1 ? v[0] : "mixed"];
    }),
  );
  const count = (value: string) =>
    [...values.values()].filter((v) => v === value).length;
  const total = values.size,
    positiveShare = total ? count("positive") / total : 0;
  const repeated = (minimum: number) => {
    if (total < minimum) return null;
    for (const direction of ["positive", "negative"]) {
      if (count(direction) / total < 0.75) continue;
      if (
        [...values.values()].every((removed) =>
          ["positive", "neutral", "negative", "mixed"]
            .filter((v) => v !== direction)
            .every(
              (v) =>
                count(direction) - Number(removed === direction) >
                count(v) - Number(removed === v),
            ),
        )
      )
        return direction;
    }
    return null;
  };
  return {
    values,
    total,
    count,
    positiveShare,
    repeated,
    counter: (direction: string) =>
      [...values]
        .filter(([, v]) => v !== direction && v !== "neutral")
        .map(([id]) => id)
        .sort()
        .join(","),
    summary: `호감 ${count("positive")} · 보통 ${count("neutral")} · 아쉬움 ${count("negative")} · 한 식사 내 다른 응답 ${count("mixed")}`,
  };
}

export function buildDiscoveryRelations(
  input: DiscoveryRelationInput,
): DiscoveryRelation[] {
  const { all, selected, observations, menuKey, now, period, source, tdKey } =
    input;
  const dates = new Map(
    [...input.dates].map(([id, date]) => [id.toLowerCase(), date]),
  );
  const byID = new Map(all.map((e) => [e.id.toLowerCase(), e]));
  const menus = group(
    all.filter((e) => menuKey(e)),
    (e) => menuKey(e)!,
  );
  const selectedIDs = new Set(selected.map((e) => e.id.toLowerCase()));
  const records = observations
    .map((o) => ({
      ...o,
      userId: "home-discovery-owner",
      confirmationStatus: "explicit_user_choice",
    }))
    .sort((a, b) => (a.observationId < b.observationId ? -1 : 1));
  const recordMap = new Map(
    input.tdObservations.map((r) => [r.observationId, r]),
  );
  const links = validatedDiscoveryIntensityLinks(
    input.tdObservations,
    input.issues,
  );
  const units: Unit[] = buildPersonalTasteModel(
    { userId: "home-discovery-owner", records },
    { _assessQuestions: false, validatedIntensityLinks: links },
  ).units;
  // Period sources rebuild units: an unselected dish must not affect a selected meal's vote.
  const localRecords = records.filter((r) => selectedIDs.has(r.experienceId));
  const localUnits: Unit[] =
    selected.length === all.length
      ? units
      : buildPersonalTasteModel(
          { userId: "home-discovery-owner", records: localRecords },
          { _assessQuestions: false, validatedIntensityLinks: links },
        ).units;
  const result: DiscoveryRelation[] = [];
  const rows = (units: Unit[]) =>
    unique(units.flatMap((u) => u.experienceIDs)).flatMap((id) =>
      byID.has(id) ? [byID.get(id)!] : [],
    );
  const entriesFor = (evidenceIDs: string[]) =>
    unique(
      evidenceIDs.flatMap((id) => recordMap.get(id)?.experienceId ?? []),
    ).flatMap((id) => (byID.has(id) ? [byID.get(id)!] : []));
  const menuKeys = (u: Unit) =>
    unique(
      u.experienceIDs.flatMap((id) => {
        const e = byID.get(id);
        return e && menuKey(e) ? [menuKey(e)!] : [];
      }),
    );
  const namedMenu = (id: string) => {
    const e = menus.get(id)?.[0];
    return e ? [e.restaurant, e.menu].filter(Boolean).join(" · ") : "메뉴";
  };
  const recent = (date: number) =>
    dayNumber(+now) - dayNumber(date) >= 0 &&
    dayNumber(+now) - dayNumber(date) <= 90;
  const overall = new Map(
    [
      ...group(
        records.filter(
          (r) =>
            r.kind === "overall_liking" &&
            r.scale === "overall-five-category-v1" &&
            r.selectionEvidence.type === "overallEvaluation",
        ),
        (r) => r.experienceId,
      ),
    ].flatMap(([id, rows]) =>
      unique(rows.map((r) => String(r.value))).length === 1
        ? [[id, rows[0]] as const]
        : [],
    ),
  );
  const proofGroup = (
    label: string,
    evidenceIDs: string[],
  ): DiscoveryProofGroup => ({
    label,
    observationIDs: unique(evidenceIDs),
    entryIDs: entriesFor(evidenceIDs)
      .map((e) => e.id.toUpperCase())
      .sort(),
    mealIDs: unique(entriesFor(evidenceIDs).map((e) => meal(e).toUpperCase())),
  });
  type Add = Omit<
    DiscoveryRelation,
    | "evidence"
    | "numerator"
    | "denominator"
    | "context"
    | "groups"
    | "limits"
    | "temporal"
  > & {
    evidenceIDs: string[];
    numeratorIDs: string[];
    denominatorIDs: string[];
    groupIDs?: Record<string, string[]>;
    limits?: string[];
    temporal?: boolean;
  };
  const add = (v: Add) => {
    if (!v.rows.length || !v.evidenceIDs.length) return;
    const groups = Object.entries(v.groupIDs ?? {}).map(([label, ids]) =>
      proofGroup(label, ids),
    );
    const referenced = new Set(
      entriesFor([
        ...v.numeratorIDs,
        ...v.denominatorIDs,
        ...groups.flatMap((g) => g.observationIDs),
      ]).map((e) => e.id),
    );
    const contextRows = v.rows.filter((e) => !referenced.has(e.id));
    result.push({
      ...v,
      temporal: v.temporal ?? false,
      evidence: unique(v.evidenceIDs).flatMap((id) =>
        recordMap.has(id) ? [recordMap.get(id)!] : [],
      ),
      numerator: entriesFor(v.numeratorIDs),
      denominator: entriesFor(v.denominatorIDs),
      context: contextRows,
      groups: [
        proofGroup("해당 근거", v.numeratorIDs),
        proofGroup("기준 표본", v.denominatorIDs),
        ...groups,
      ],
      limits: [
        ...(v.limits ?? []),
        "기록하고 직접 평가한 범위만 설명해요. 미응답은 호감·중립·불호로 바꾸지 않아요.",
        "식사별 반복을 센 초기 표시 정책이며 통계적 유의성이나 미래 예측 확률이 아니에요.",
      ],
    });
  };
  // Non-temporal relations follow the selected period, temporal relations use the full archive.
  for (const [scope, items] of group(localUnits, context)) {
    const first = items[0],
      v = votes(items),
      subject = "sense:" + sense(first);
    const positive = items.filter((u) => v.values.get(u.mealID) === "positive"),
      positiveMenus = unique(positive.flatMap(menuKeys));
    if (
      v.total >= 3 &&
      v.count("positive") >= 3 &&
      v.positiveShare >= 0.75 &&
      positiveMenus.length >= 2
    ) {
      const menuIDs = unique(items.flatMap(menuKeys));
      add({
        kind: "commonPreference",
        category: "preference",
        subject,
        scope,
        title: `메뉴는 달라도\n${first.label}에 호감을 남겼어요`,
        detail: `직접 평가한 식사 ${v.total}번 중 호감 ${v.count("positive")}번 · 호감 메뉴 ${positiveMenus.length}가지`,
        explanation: `${scopeLabel(first)} 범위에서 감각 자체에 남긴 직접 호감을 식사별로 묶었어요. 감각 태그의 등장이나 음식 전체 평가로 호감을 추정하지 않아요.`,
        rows: selected.filter((e) => menuIDs.includes(menuKey(e) ?? "")),
        evidenceIDs: ids(items),
        numeratorIDs: ids(positive),
        denominatorIDs: ids(items),
        meaning: "positive|counter:" + v.counter("positive"),
        strength: 55 + Math.min(v.count("positive"), 10),
        summary: v.summary,
      });
    }
    const byMenu = new Map<string, Unit[]>();
    for (const u of items)
      for (const menu of menuKeys(u))
        byMenu.set(menu, [...(byMenu.get(menu) ?? []), u]);
    const keys = [...byMenu.keys()]
      .filter((id) => votes(byMenu.get(id)!).total >= 3)
      .sort();
    for (let i = 0; i < keys.length; i++)
      for (let j = i + 1; j < keys.length; j++) {
        const a = byMenu.get(keys[i])!,
          b = byMenu.get(keys[j])!,
          shared = new Set(
            a
              .filter((u) => b.some((v) => v.mealID === u.mealID))
              .map((u) => u.mealID),
          );
        const left = a.filter((u) => !shared.has(u.mealID)),
          right = b.filter((u) => !shared.has(u.mealID)),
          x = votes(left),
          y = votes(right),
          dx = x.repeated(3),
          dy = y.repeated(3);
        if (!dx || !dy || dx === dy) continue;
        add({
          kind: "conditionalContrast",
          category: "context",
          subject,
          scope: key([scope, keys[i], keys[j]]),
          title: `같은 ${first.label}에도\n메뉴별로 다른 평가를 남겼어요`,
          detail: `${namedMenu(keys[i])}: ${directionLabel(dx)} ${x.count(dx)}/${x.total}번\n${namedMenu(keys[j])}: ${directionLabel(dy)} ${y.count(dy)}/${y.total}번`,
          explanation: `${scopeLabel(first)}에서 서로 다른 메뉴의 직접 평가를 비교했어요. 각 메뉴에 식사 3번 이상, 같은 방향 75% 이상이며 식사 하나를 제외해도 방향이 유지되는 후보예요.`,
          rows: rows([...a, ...b]),
          evidenceIDs: ids([...a, ...b]),
          numeratorIDs: ids([
            ...left.filter((u) => x.values.get(u.mealID) === dx),
            ...right.filter((u) => y.values.get(u.mealID) === dy),
          ]),
          denominatorIDs: ids([...left, ...right]),
          groupIDs: {
            ["조건 A 기준 · " + namedMenu(keys[i])]: ids(left),
            ["조건 B 기준 · " + namedMenu(keys[j])]: ids(right),
            "독립 비교에서 제외한 공통 식사": ids(
              [...a, ...b].filter((u) => shared.has(u.mealID)),
            ),
          },
          meaning: key([dx, dy, x.counter(dx), y.counter(dy)]),
          strength: 68 + Math.min(x.total + y.total, 12),
          summary: `왼쪽: ${x.summary}\n오른쪽: ${y.summary}`,
          limits: [
            `양쪽 메뉴를 함께 기록한 식사 ${shared.size}번은 독립 집단 비교에서 제외했어요.`,
            "강도·조리 상태 등 다른 조건도 달랐을 수 있어요. 메뉴가 평가 차이의 원인이라는 뜻은 아니에요.",
          ],
        });
      }
  }
  for (const [scope, items] of group(units, context)) {
    const dated = items.filter((u) => dates.has(u.mealID));
    if (!dated.length) continue;
    const latestDate = Math.max(...dated.map((u) => dates.get(u.mealID)!));
    if (!recent(latestDate)) continue;
    const latest = dated.filter((u) => dates.get(u.mealID) === latestDate),
      previous = dated.filter((u) => dates.get(u.mealID)! < latestDate);
    const current = votes(latest),
      baseline = votes(previous),
      direction = baseline.repeated(4),
      currentDirection = [...current.values.values()][0],
      first = latest[0];
    if (
      current.total === 1 &&
      ["positive", "negative"].includes(currentDirection) &&
      direction &&
      direction !== currentDirection
    ) {
      add({
        kind: "patternException",
        category: "preference",
        subject: "sense:" + sense(first),
        scope,
        temporal: true,
        title: `최근 식사의 ${first.label},\n앞선 기록과 다른 반응이었어요`,
        detail: `앞선 ${baseline.total}번 중 ${directionLabel(direction)} ${baseline.count(direction)}번 · 최근 식사: ${directionLabel(currentDirection)}`,
        explanation: `${scopeLabel(first)}에서 확인된 식사일을 기준으로 이전 기록과 가장 최근 한 식사를 분리했어요. 최근 식사는 이전 경향 계산에 넣지 않았어요.`,
        rows: rows(items),
        evidenceIDs: ids(dated),
        numeratorIDs: ids(latest),
        denominatorIDs: ids(previous),
        groupIDs: {
          "앞선 반복 평가": ids(previous),
          "최근 한 식사": ids(latest),
        },
        meaning: key([
          direction,
          currentDirection,
          ...[...current.values.keys()].sort(),
        ]),
        strength: 75,
        summary: `이전: ${baseline.summary}\n최근: ${current.summary}`,
        limits: [
          "한 번의 다른 경험이며 취향 변화나 새로운 반복 취향의 확정이 아니에요.",
          "현재 유효한 원본으로 과거 식사를 비교했어요. 당시 알고 있던 모델 상태를 복원한 것은 아니에요.",
          "식사일 미확인 근거는 선후 비교에서 제외했어요. 음식·강도 등 다른 조건도 달랐을 수 있어요.",
        ],
      });
    }
    const allVotes = votes(items),
      seen = new Set<string>();
    for (const u of latest.filter(
      (u) => allVotes.values.get(u.mealID) === "positive",
    ))
      for (const entry of rows([u])) {
        const menu = menuKey(entry),
          rating = overall.get(entry.id.toLowerCase());
        if (!menu || seen.has(menu)) continue;
        seen.add(menu);
        const menuRows = menus.get(menu)!;
        if (
          !rating ||
          !["positive", "very_positive"].includes(rating.value) ||
          menuRows.some((e) => !dates.has(meal(e))) ||
          Math.min(...menuRows.map((e) => dates.get(meal(e))!)) !== latestDate
        )
          continue;
        const firstMeals = unique(
          menuRows.filter((e) => dates.get(meal(e)) === latestDate).map(meal),
        );
        if (firstMeals.length !== 1 || firstMeals[0] !== meal(entry)) continue;
        const prior = previous.filter((u) => !menuKeys(u).includes(menu)),
          v = votes(prior);
        if (v.count("positive") < 3 || v.positiveShare < 0.75) continue;
        add({
          kind: "familiarTasteInNewMenu",
          category: "preference",
          subject: "menu:" + menu,
          scope,
          temporal: true,
          title: `${entry.menu}에서도\n익숙한 ${u.label} 취향을 만났어요`,
          detail: `처음 기록한 메뉴 · 이전 다른 메뉴의 평가 ${v.total}번 중 호감 ${v.count("positive")}번`,
          explanation: `이번 메뉴의 전체 평가와 ${u.label} 자체의 평가가 모두 긍정이에요. 이전 다른 메뉴의 같은 대상·시점 범위에서도 감각 자체에 호감을 남겼어요.`,
          rows: [...rows(prior), entry],
          evidenceIDs: [...ids([...prior, u]), rating.observationId],
          numeratorIDs: [...u.evidenceIDs, rating.observationId],
          denominatorIDs: ids(prior),
          meaning: key([meal(entry), v.counter("positive")]),
          strength: 65,
          summary: `${scopeLabel(u)}\n이전: ${v.summary}\n이번: 직접 호감 1번`,
          limits: [
            "아카이브에서 확인 가능한 첫 기록이며 처음 먹은 음식이라는 뜻은 아니에요.",
            "이 감각 때문에 음식 전체가 좋았다는 인과 해석은 하지 않아요.",
          ],
        });
      }
  }
  for (const [scope, records] of group(
    localRecords.filter((r) => r.attribute),
    (r) => key([context(r), menuKey(byID.get(r.experienceId)!) ?? ""]),
  )) {
    const first = records.find((r) => r.kind === "preference_fit");
    if (!first || !menuKey(byID.get(first.experienceId)!)) continue;
    const patterns = buildFitPatterns(
      records,
      "home-discovery-owner",
      PERSONAL_TASTE_POLICY,
      { validatedIntensityLinks: links },
    )
      .filter(
        (p) =>
          p.conditions.length === 1 &&
          p.conditions[0].dimension === "intensity" &&
          p.status === "repeated_fit",
      )
      .sort((a, b) => (a.conditions[0].value < b.conditions[0].value ? -1 : 1));
    if (!patterns.length) continue;
    const preferred =
      patterns.find((p) => p.repeatedValue === "just_right") ?? patterns[0];
    const comparison = patterns.find(
      (p) =>
        p.id !== preferred.id &&
        p.repeatedValue !== preferred.repeatedValue &&
        p.mealIDs.every((id) => !preferred.mealIDs.includes(id)),
    );
    const chosen = [preferred, ...(comparison ? [comparison] : [])],
      detail = chosen
        .map(
          (p) =>
            `${intensityLabel(p.conditions[0].value)}: ${fitLabel(p.repeatedValue!)} ${p.distribution.mealCount}번`,
        )
        .join("\n");
    const selectedEvidence = unique(chosen.flatMap((p) => p.evidenceIDs));
    add({
      kind: "preferredIntensity",
      category: "context",
      subject: "sense:" + sense(first),
      scope,
      title: `${byID.get(first.experienceId)!.menu}의 ${first.reference ?? first.attributeLabel}\n${preferred.repeatedValue === "just_right" ? "알맞았던 강도가 보여요" : `이 강도는 ‘${fitLabel(preferred.repeatedValue!)}’으로 남겼어요`}`,
      detail,
      explanation: `${scopeLabel(first)}에서 같은 선택 또는 검증된 부모 선택의 강도와 알맞음을 연결했어요. 선택한 각 강도에서 같은 응답이 서로 다른 식사 3번 이상 반복됐어요.`,
      rows: entriesFor(records.map((r) => r.observationId)),
      evidenceIDs: records.map((r) => r.observationId),
      numeratorIDs: selectedEvidence,
      denominatorIDs: selectedEvidence,
      groupIDs: {
        ...Object.fromEntries(
          chosen.map((p) => [
            intensityLabel(p.conditions[0].value) +
              " · " +
              fitLabel(p.repeatedValue!),
            p.evidenceIDs,
          ]),
        ),
        "그 밖의 직접 응답": records
          .map((r) => r.observationId)
          .filter((id) => !selectedEvidence.includes(id)),
      },
      meaning: key(
        chosen.map((p) => p.conditions[0].value + ":" + p.repeatedValue),
      ),
      strength: comparison ? 68 : 50,
      summary: detail,
      limits: [
        "알맞음·과함·부족함은 호감과 별개예요. 물리적인 최적 강도나 음식 자체의 호불호로 해석하지 않아요.",
        "비교 강도는 겹치지 않는 식사로 구성했으며, 응답이 다른 다른 강도의 기록도 아래 원본에 남겨요.",
      ],
    });
  }
  for (const [scope, individual] of group(
    localRecords.filter((r) => r.kind === "attribute_liking"),
    context,
  )) {
    const first = individual[0],
      entryIDs = new Set(individual.map((r) => r.experienceId));
    const pattern = buildOverallPatterns(
      [
        ...individual,
        ...localRecords.filter(
          (r) => r.kind === "overall_liking" && entryIDs.has(r.experienceId),
        ),
      ],
      "home-discovery-owner",
    ).find((p) => !p.conditions.length);
    if (!pattern) continue;
    const cell = pattern.cells
      .filter(
        (c) =>
          (["positive", "very_positive"].includes(c.overallValue) &&
            c.attributeValue === "negative") ||
          (["negative", "very_negative"].includes(c.overallValue) &&
            c.attributeValue === "positive"),
      )
      .sort(
        (a, b) =>
          b.mealIDs.length - a.mealIDs.length ||
          (key([a.overallValue, a.attributeValue]) <
          key([b.overallValue, b.attributeValue])
            ? -1
            : 1),
      )[0];
    if (!cell) continue;
    const n = cell.mealIDs.length;
    add({
      kind: "overallContrast",
      category: "preference",
      subject: "sense:" + sense(first),
      scope,
      title: `${first.reference ?? first.attributeLabel}에는 ‘${directionLabel(cell.attributeValue)}’\n음식 전체에는 ‘${overallLabel(cell.overallValue)}’`,
      detail: `두 평가가 있는 식사 ${pattern.mealIDs.length}번 중 이 조합 ${n}번 · ${n >= 3 ? "반복 관찰" : "개별 경험"}`,
      explanation: `${scopeLabel(first)}의 감각 평가와 같은 음식 경험의 전체 평가만 짝지었어요. 다른 메뉴의 평가를 서로 붙이지 않아요.`,
      rows: [...entryIDs].map((id) => byID.get(id)!),
      evidenceIDs: pattern.evidenceIDs,
      numeratorIDs: cell.evidenceIDs,
      denominatorIDs: pattern.evidenceIDs,
      groupIDs: Object.fromEntries(
        pattern.cells.map((c) => [
          "전체 " +
            overallLabel(c.overallValue) +
            " · 감각 " +
            directionLabel(c.attributeValue),
          c.evidenceIDs,
        ]),
      ),
      meaning: key([
        cell.overallValue,
        cell.attributeValue,
        n >= 3 ? "repeated" : "example",
      ]),
      strength: n >= 3 ? 73 : 42,
      summary:
        pattern.cells
          .map(
            (c) =>
              `전체 ${overallLabel(c.overallValue)} / 감각 ${directionLabel(c.attributeValue)}: ${c.mealIDs.length}번`,
          )
          .join("\n") +
        `\n한 식사 내 서로 다른 평가 쌍: ${pattern.mixedMealIDs.length}번`,
      limits: [
        "두 평가가 함께 있었다는 뜻이며 다른 감각이 아쉬움을 보완했다는 원인 해석은 아니에요.",
        "3회 미만은 반복 취향이 아니라 개별 경험으로 표시해요.",
      ],
    });
  }
  for (const [identity, menuRows] of menus) {
    const meals = group(menuRows, meal),
      dated = [...meals.keys()]
        .filter((id) => dates.has(id))
        .sort((a, b) => dates.get(a)! - dates.get(b)! || (a < b ? -1 : 1));
    if (dated.length < 2) continue;
    const [a, b] = dated.slice(-2),
      da = dates.get(a)!,
      db = dates.get(b)!;
    if (da >= db || !recent(db)) continue;
    const response = (id: string) => {
      const v = unique(
        meals
          .get(id)!
          .flatMap((e) => overall.get(e.id.toLowerCase())?.value ?? []),
      );
      return v.length === 1 ? v[0] : null;
    };
    const va = response(a),
      vb = response(b);
    if (!va || !vb || va === vb) continue;
    const getIDs = (id: string) =>
        meals
          .get(id)!
          .flatMap((e) => overall.get(e.id.toLowerCase())?.observationId ?? []),
      evidenceIDs = [...getIDs(a), ...getIDs(b)];
    add({
      kind: "revisitComparison",
      category: "change",
      subject: "menu:" + identity,
      scope: "overall",
      temporal: true,
      title: `${menuRows[0].menu}\n두 식사의 평가는 달랐어요`,
      detail: `${dateText(da)}: ${overallLabel(va)}\n${dateText(db)}: ${overallLabel(vb)}`,
      explanation:
        "같은 식당의 같은 메뉴에 남긴 최근 두 식사의 직접 전체 평가를 비교했어요. 두 기록은 확인된 서로 다른 식사일에 해당해요.",
      rows: [...meals.get(a)!, ...meals.get(b)!],
      evidenceIDs,
      numeratorIDs: evidenceIDs,
      denominatorIDs: evidenceIDs,
      groupIDs: { [dateText(da)]: getIDs(a), [dateText(db)]: getIDs(b) },
      meaning: key([a, b, va, vb]),
      strength: 63,
      summary: "직접 전체 평가가 있는 식사 2번",
      limits: [
        "두 기록의 차이이며 메뉴 품질이나 입맛이 변했다는 확정이 아니에요.",
        ...(menuRows.some((e) => !dates.has(meal(e)))
          ? ["식사일 미확인 기록이 있어 확인된 두 기록의 비교로 한정해요."]
          : []),
      ],
    });
  }
  const window = periodWindow(period === "all" ? "ninety" : period, now)!;
  const days = dayNumber(window.end) - dayNumber(window.start),
    previousStart = addDays(window.start, -days);
  const inBefore = (id: string) =>
    dates.has(id) &&
    dates.get(id)! >= previousStart &&
    dates.get(id)! < window.start;
  const inAfter = (id: string) =>
    dates.has(id) &&
    dates.get(id)! >= window.start &&
    dates.get(id)! < window.end;
  const rangeLabel = `${dateText(previousStart)}–${dateText(addDays(window.start, -1))} ↔ ${dateText(window.start)}–${dateText(addDays(window.end, -1))}`;
  const confirmed = (r: Observation) =>
    r.target !== "unspecified" &&
    !!r.target &&
    r.phase !== "unspecified" &&
    !!r.phase &&
    !!links[r.observationId]?.length;
  const stableDelta = (
    a: ReturnType<typeof votes>,
    b: ReturnType<typeof votes>,
    delta: number,
  ) =>
    [...a.values.values()].every(
      (v) =>
        (b.positiveShare -
          (a.count("positive") - Number(v === "positive")) / (a.total - 1)) *
          delta >
        0,
    ) &&
    [...b.values.values()].every(
      (v) =>
        ((b.count("positive") - Number(v === "positive")) / (b.total - 1) -
          a.positiveShare) *
          delta >
        0,
    );
  const periods = new Map<string, { menu: string; units: Unit[] }>();
  for (const u of units.filter((u) => !u.intensityConflict))
    for (const menu of menuKeys(u)) {
      const scope = key([menu, context(u), u.intensity ?? "unspecified"]),
        item = periods.get(scope) ?? { menu, units: [] };
      item.units.push(u);
      periods.set(scope, item);
    }
  for (const [scope, { menu, units }] of periods) {
    const before = units.filter((u) => inBefore(u.mealID)),
      after = units.filter((u) => inAfter(u.mealID)),
      a = votes(before),
      b = votes(after),
      delta = b.positiveShare - a.positiveShare;
    if (
      a.total < 5 ||
      b.total < 5 ||
      new Set(before.map((u) => dates.get(u.mealID))).size < 2 ||
      new Set(after.map((u) => dates.get(u.mealID))).size < 2 ||
      Math.abs(delta) < 0.4 - 0.000001 ||
      !stableDelta(a, b, delta)
    )
      continue;
    const evidenceIDs = ids([...before, ...after]),
      liking = evidenceIDs.flatMap((id) => {
        const r = recordMap.get(id);
        return r?.kind === "attribute_liking" ? [r] : [];
      });
    if (!liking.length || !liking.every(confirmed)) continue;
    const first = units[0];
    add({
      kind: "periodChange",
      category: "change",
      subject: "menu:" + menu,
      scope: period === "all" ? scope : key([scope, periodLabels[period]]),
      temporal: true,
      scopeLabel: rangeLabel,
      title: `${menus.get(menu)?.[0].menu ?? "같은 메뉴"}의 ${first.label}\n두 기간의 긍정 평가가 달랐어요`,
      detail: `이전 ${days}일: 호감 ${a.count("positive")}/${a.total}번\n최근 ${days}일: 호감 ${b.count("positive")}/${b.total}번`,
      explanation: `같은 식당·메뉴·감각·대상·시점·기록된 강도 범위에서 비교했어요. ${rangeLabel}. 각 5회 이상, 40퍼센트포인트 이상 차이가 있고 식사 하나를 제외해도 차이의 방향이 유지돼요.`,
      rows: rows(units),
      evidenceIDs,
      numeratorIDs: ids(
        after.filter((u) => b.values.get(u.mealID) === "positive"),
      ),
      denominatorIDs: ids(after),
      groupIDs: {
        "이전 기간 긍정 근거": ids(
          before.filter((u) => a.values.get(u.mealID) === "positive"),
        ),
        "이전 기간 전체 기준": ids(before),
        "최근 기간 전체 기준": ids(after),
      },
      meaning: delta > 0 ? "positive-increase" : "positive-decrease",
      strength: 78,
      summary: `${scopeLabel(first)} · 강도 ${intensityLabel(first.intensity)}\n이전: ${a.summary}\n최근: ${b.summary}`,
      limits: [
        "확인된 식사일만 사용했어요. 날짜 미확인·기간 밖 기록은 분모에서 제외하고 원본에는 남겨요.",
        "서로 다른 메뉴 구성을 합쳐 전체 입맛의 변화로 해석하지 않아요. 알려지지 않은 조리 상태 등은 다를 수 있어요.",
        "현재 수정본의 비교이며 당시 알고 있던 응답 상태의 완전한 재현은 아니에요.",
      ],
    });
  }
  const iso = (v: number) => new Date(v).toISOString().replace(".000Z", "Z");
  const windowKey =
    period === "all" || period === "ninety"
      ? "최근 90일"
      : period === "thirty"
        ? "최근 30일"
        : period === "month"
          ? tdKey(["이번 달", iso(window.start)])
          : tdKey([iso(window.start), iso(window.end)]);
  const comparisonScope = tdKey(["comparison", windowKey]);
  const sourceMatches = (r: Observation) =>
    source === "all" ||
    (byID.get(r.experienceId)?.foodSource?.kind ?? "unknown") === source;
  const presence = input.tdObservations.filter(
    (r) =>
      sourceMatches(r) &&
      r.kind === "sensory_presence" &&
      r.value === true &&
      (inBefore(r.mealId) || inAfter(r.mealId)),
  );
  const baseB = presence.filter((r) => inBefore(r.mealId)),
    baseA = presence.filter((r) => inAfter(r.mealId)),
    nB = new Set(baseB.map((r) => r.mealId)).size,
    nA = new Set(baseA.map((r) => r.mealId)).size;
  const catalogsB = unique(
      baseB.map((r) => r.selectionEvidence.catalogVersion),
    ),
    catalogsA = unique(baseA.map((r) => r.selectionEvidence.catalogVersion));
  if (
    nB >= 5 &&
    nA >= 5 &&
    catalogsB.length === 1 &&
    !!catalogsB[0] &&
    key(catalogsB) === key(catalogsA)
  )
    for (const [id, items] of group(presence, (r) =>
      tdKey([r.attribute!, r.reference ?? ""]),
    )) {
      const before = items.filter((r) => inBefore(r.mealId)),
        after = items.filter((r) => inAfter(r.mealId)),
        b = new Set(before.map((r) => r.mealId)).size,
        a = new Set(after.map((r) => r.mealId)).size,
        delta = (a / nA) * 100 - (b / nB) * 100;
      if (Math.abs(delta) < 20 - 0.0000001) continue;
      const evidenceIDs = [...baseA, ...baseB].map((r) => r.observationId);
      add({
        kind: "sensoryPeriodChange",
        category: "change",
        subject: "sense:" + id,
        scope: comparisonScope,
        td: true,
        temporal: true,
        scopeLabel: rangeLabel,
        title: "감각 기록 비중의 차이",
        detail: `${items[0].reference ?? items[0].attributeLabel}을 남긴 식사 비중: ${b}/${nB}번 → ${a}/${nA}번 · ${((b / nB) * 100).toFixed(1)}% → ${((a / nA) * 100).toFixed(1)}% (${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%p)`,
        explanation:
          "각 기간에 유효한 감각을 남긴 식사가 분모예요. 같은 카탈로그의 감각 기록을 비교하며 호감이나 강도의 변화를 뜻하지 않아요.",
        rows: entriesFor(evidenceIDs),
        evidenceIDs,
        numeratorIDs: after.map((r) => r.observationId),
        denominatorIDs: baseA.map((r) => r.observationId),
        groupIDs: {
          "이전 기간 해당 근거": before.map((r) => r.observationId),
          "이전 기간 전체 기준": baseB.map((r) => r.observationId),
        },
        meaning: delta > 0 ? "presence-increase" : "presence-decrease",
        strength: 65,
        summary: `이전 ${b}/${nB}번 · 최근 ${a}/${nA}번`,
      });
    }
  const fitRows = input.tdObservations.filter(
    (r) =>
      sourceMatches(r) &&
      r.kind === "preference_fit" &&
      r.scale === "preference-fit-v1" &&
      ["below_preferred", "just_right", "above_preferred"].includes(r.value) &&
      confirmed(r) &&
      menuKey(byID.get(r.experienceId)!) &&
      (inBefore(r.mealId) || inAfter(r.mealId)),
  );
  for (const [scope, items] of group(fitRows, (r) =>
    tdKey([
      menuKey(byID.get(r.experienceId)!)!,
      r.attribute!,
      r.reference ?? "",
      r.scale,
      r.target,
      r.phase,
      String(recordMap.get(links[r.observationId][0])!.value),
    ]),
  )) {
    if (
      input.issues.some((i) =>
        items.some(
          (r) =>
            i.entryID === r.experienceId &&
            (!i.facet || i.facet === "fit") &&
            (!i.attribute ||
              (i.attribute === r.attribute && i.reference === r.reference)),
        ),
      )
    )
      continue;
    const toUnits = (rs: Observation[]): Unit[] =>
      rs.map((r) => ({
        mealID: r.mealId,
        experienceIDs: [r.experienceId],
        attribute: r.attribute!,
        reference: r.reference,
        label: r.attributeLabel,
        target: r.target,
        phase: r.phase,
        intensity: null,
        intensityConflict: false,
        liking: r.value === "just_right" ? "positive" : r.value,
        evidenceIDs: [r.observationId, ...links[r.observationId]],
      }));
    const before = toUnits(items.filter((r) => inBefore(r.mealId))),
      after = toUnits(items.filter((r) => inAfter(r.mealId))),
      a = votes(before),
      b = votes(after),
      delta = b.positiveShare - a.positiveShare;
    if (
      a.total < 5 ||
      b.total < 5 ||
      new Set(before.map((u) => dates.get(u.mealID))).size < 2 ||
      new Set(after.map((u) => dates.get(u.mealID))).size < 2 ||
      Math.abs(delta) < 0.4 - 0.0000001 ||
      !stableDelta(a, b, delta)
    )
      continue;
    const evidenceIDs = ids([...before, ...after]);
    add({
      kind: "fitPeriodChange",
      category: "change",
      subject: "fit-scope:" + scope,
      scope: comparisonScope,
      td: true,
      temporal: true,
      scopeLabel: rangeLabel,
      title: "같은 범위에서 달라진 알맞음",
      detail: `${items[0].reference ?? items[0].attributeLabel} · 알맞음 응답 ${a.count("positive")}/${a.total}번 → ${b.count("positive")}/${b.total}번`,
      explanation:
        "동일 메뉴·감각·척도·대상·시점·연결 강도에서 각 5회 이상, 서로 다른 날짜 2일 이상을 비교했어요. 40퍼센트포인트 이상 차이가 있고 식사 하나를 제외해도 차이의 방향이 유지돼요.",
      rows: entriesFor(evidenceIDs),
      evidenceIDs,
      numeratorIDs: ids(after),
      denominatorIDs: items
        .filter((r) => inAfter(r.mealId))
        .map((r) => r.observationId),
      groupIDs: {
        "이전 기간 해당 근거": ids(before),
        "이전 기간 전체 기준": items
          .filter((r) => inBefore(r.mealId))
          .map((r) => r.observationId),
      },
      meaning: delta > 0 ? "just-right-increase" : "just-right-decrease",
      strength: 78,
      summary: `이전 알맞음 ${a.count("positive")}/${a.total}번 · 최근 알맞음 ${b.count("positive")}/${b.total}번`,
      limits: [
        "알맞음의 차이이며 호감이나 실제 조리 강도가 달라졌다는 뜻은 아니에요.",
      ],
    });
  }
  return result;
}
