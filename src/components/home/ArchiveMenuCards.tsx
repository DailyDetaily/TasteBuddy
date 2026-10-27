import MiniBubbleChart, { miniBubbleColor } from "../system/plating/MiniBubbleChart";
import MiniChart from "../system/plating/MiniChart";
import PieDonutChart, { pieDonutColor, pieDonutRemainderColor } from "../system/plating/PieDonutChart";
import PeriodCard from "../gastronomy/PeriodCard";
import { TASTE_TOKENS } from "../../constants/uiColorTokens";
import type { SummaryCardLegendItem } from "../system/SummaryCardLegend";
import type { ArchiveMenuGroup, ArchiveMenuInsights } from "../../lib/gastronomy/archiveMenuInsights";
import type { Card, Row } from "../../lib/gastronomy/engine";
import { DetailBubbleChart, DetailDonutChart, DetailHorizontalBars } from '../system/DetailCharts';

export type ArchiveMenuMetricID = "menu-exploration" | "repeat-menu" | "new-menu-satisfaction";
export interface ArchiveMenuCard {
  id: ArchiveMenuMetricID;
  label: string;
  title: string;
  detail: string;
  legend: SummaryCardLegendItem[];
  card: Card;
}
function groupRow(id: string, title: string, groups: ArchiveMenuGroup[], firstOnly = false): Row {
  return { id, title, value: groups.length + "가지", detail: groups.map(group => group.label).join(" · "),
    entryIDs: [...new Set(groups.flatMap(group => firstOnly ? group.firstEntryIDs : group.entryIDs))] };
}

export function archiveMenuCards(data: ArchiveMenuInsights): ArchiveMenuCard[] {
  const rated = data.satisfiedMenus.length + data.belowThresholdMenus.length;
  const partial = data.unknownDateCount > 0 || data.unlinkedMenuCount > 0 || data.uncertainMenus.length > 0;
  const coverage: SummaryCardLegendItem[] = [
    ...(data.uncertainMenus.length ? [{ id: "uncertain", label: "첫 기록 여부 미확인 " + data.uncertainMenus.length + "가지" }] : []),
    ...(data.unknownDateCount ? [{ id: "undated", label: "식사일 미확인 " + data.unknownDateCount + "개" }] : []),
    ...(data.unlinkedMenuCount ? [{ id: "unlinked", label: "메뉴 연결 미확인 " + data.unlinkedMenuCount + "개" }] : []),
  ];
  const excludedRows: Row[] = [
    ...(data.unknownDateCount ? [{ id: "undated", title: "식사일 미확인", value: data.unknownDateCount + "개", detail: "기간 집계에서 제외한 요리 기록", entryIDs: data.unknownDateEntryIDs }] : []),
    ...(data.unlinkedMenuCount ? [{ id: "unlinked", title: "메뉴 연결 미확인", value: data.unlinkedMenuCount + "개", detail: "메뉴 식별 전까지 집계하지 않아요", entryIDs: data.unlinkedMenuEntryIDs }] : []),
  ];
  const first = data.repeatedMenus[0];
  const definitions: Omit<ArchiveMenuCard, "card">[] = [
    {
      id: "menu-exploration", label: "새로운 메뉴 탐험",
      title: !data.newMenus.length && !data.familiarMenus.length && partial ? "첫 기록 확인 필요" : "첫 기록 " + data.newMenus.length + "가지",
      detail: "기존 메뉴 " + data.familiarMenus.length + "가지\n최근 30일 · 앱 기록 기준",
      legend: [
        { id: "new", label: "첫 기록 " + data.newMenus.length + "가지", color: miniBubbleColor("sweet") },
        { id: "familiar", label: "기존 " + data.familiarMenus.length + "가지", color: miniBubbleColor("umami") },
        ...coverage,
      ],
    },
    {
      id: "repeat-menu", label: "다시 찾은 한 접시",
      title: first ? first.label.split(" · ")[0] : data.unlinkedMenuCount ? "메뉴 연결 확인 필요" : "아직 반복 메뉴 없음",
      detail: first ? "서로 다른 식사 " + first.mealCount + "번\n전체 기간 · 상위 3개" : "같은 메뉴를 다시 기록하면 보여요\n전체 기간 · 상위 3개",
      legend: [
        ...data.repeatedMenus.map((menu, index) => ({ id: menu.id, label: (index + 1) + ". " + menu.label + " · " + menu.mealCount + "번", color: miniBubbleColor("salty") })),
        ...(data.unlinkedMenuCount ? [{ id: "unlinked", label: "메뉴 연결 미확인 " + data.unlinkedMenuCount + "개" }] : []),
      ],
    },
    {
      id: "new-menu-satisfaction", label: "새 메뉴 만족도",
      title: rated ? rated + "가지 중 " + data.satisfiedMenus.length + "가지"
        : data.ambiguousRatingMenus.length ? "첫 평가 확인 필요" : "아직 별점 없음",
      detail: rated ? "첫 식사에서 4점 이상\n최근 30일" : "새 메뉴의 첫 별점을 기다려요\n최근 30일 · 첫 식사 기준",
      legend: [
        ...(rated ? [
          { id: "satisfied", label: "4점 이상 " + data.satisfiedMenus.length + "가지", color: pieDonutColor("sour") },
          { id: "below", label: "4점 미만 " + data.belowThresholdMenus.length + "가지", color: pieDonutRemainderColor },
        ] : []),
        ...(data.unratedMenus.length ? [{ id: "unrated", label: "첫 별점 없음 " + data.unratedMenus.length + "가지" }] : []),
        ...(data.ambiguousRatingMenus.length ? [{ id: "ambiguous", label: "첫 평가 확인 필요 " + data.ambiguousRatingMenus.length + "가지" }] : []),
        ...coverage,
      ],
    },
  ];
  const rows: Record<ArchiveMenuMetricID, Row[]> = {
    "menu-exploration": [
      groupRow("new", "처음 기록한 메뉴", data.newMenus),
      groupRow("familiar", "이전부터 기록한 메뉴", data.familiarMenus),
      ...(data.uncertainMenus.length ? [groupRow("uncertain", "첫 기록 여부 미확인", data.uncertainMenus)] : []),
      ...excludedRows,
    ],
    "repeat-menu": [
      ...data.repeatedMenus.map(menu => ({ id: menu.id, title: menu.label, value: menu.mealCount + "번의 식사", detail: "전체 기간 · 같은 식사의 여러 요리는 한 번만 세요", entryIDs: menu.entryIDs })),
      ...excludedRows.filter(row => row.id === "unlinked"),
    ],
    "new-menu-satisfaction": [
      groupRow("satisfied", "첫 식사에서 4점 이상", data.satisfiedMenus, true),
      groupRow("below", "첫 식사에서 4점 미만", data.belowThresholdMenus, true),
      ...(data.unratedMenus.length ? [groupRow("unrated", "첫 별점 없음", data.unratedMenus, true)] : []),
      ...(data.ambiguousRatingMenus.length ? [groupRow("ambiguous", "첫 평가 확인 필요", data.ambiguousRatingMenus, true)] : []),
      ...(data.uncertainMenus.length ? [groupRow("uncertain", "첫 기록 여부 미확인", data.uncertainMenus)] : []),
      ...excludedRows,
    ],
  };
  const meanings: Record<ArchiveMenuMetricID, string> = {
    "menu-exploration": "오늘 포함 최근 30일 · 확인된 식사일과 현지 시간 기준. 같은 식당의 같은 메뉴를 한 번만 세요. 처음 먹었다는 뜻이 아닌 앱의 첫 기록이에요. 이전 기록의 날짜가 불명확하면 첫 기록으로 확정하지 않아요.",
    "repeat-menu": "전체 기간 · 같은 식당의 같은 메뉴를 기록한 서로 다른 식사 수 TOP 3. 식사일 미확인 기록도 포함해요. 같은 식사의 여러 요리는 반복을 늘리지 않으며, 횟수를 호감으로 해석하지 않아요.",
    "new-menu-satisfaction": "최근 30일에 처음 기록한 메뉴의 첫 식사 별점만 비교해요. 유효한 0.5~5점 별점이 있는 메뉴가 분모, 4점 이상이 분자예요. 첫날 여러 식사의 순서나 별점이 불명확하면 제외해요. 미평가·이전 5단계 평가는 별점으로 바꾸지 않아요.",
  };
  return definitions.map(item => ({ ...item, card: { id: item.id, title: item.label, meaning: meanings[item.id], rows: rows[item.id] } }));
}

export function ArchiveMenuMiniGraph({ id, data }: { id: ArchiveMenuMetricID; data: ArchiveMenuInsights }) {
  if (id === "menu-exploration") return data.newMenus.length + data.familiarMenus.length ? (
    <MiniBubbleChart items={[
      { id: "new", label: "첫 기록 메뉴", value: data.newMenus.length, axis: "sweet" },
      { id: "familiar", label: "기존 메뉴", value: data.familiarMenus.length, axis: "umami" },
    ]} />
  ) : null;
  if (id === "repeat-menu") return data.repeatedMenus.length ? (
    <MiniChart values={data.repeatedMenus.map(menu => menu.mealCount)} axis="salty" highlightsEachValue
      label={data.repeatedMenus.map(menu => menu.label + " " + menu.mealCount + "번의 식사").join(", ")} />
  ) : null;
  const rated = data.satisfiedMenus.length + data.belowThresholdMenus.length;
  return rated ? <PieDonutChart mode="absolute" segments={[
    { id: "satisfied", label: "4점 이상", value: data.satisfiedMenus.length / rated * 100, axis: "sour" },
  ]} label={"첫 별점 " + rated + "가지 중 4점 이상 " + data.satisfiedMenus.length + "가지. 나머지는 4점 미만."} /> : null;
}

/** Uses the same validated menu groups as the summary: distinct restaurant/menu
 * identities over 30 local-calendar days, independent mealIDs for all-time repeat
 * ranking, and first-meal direct-star-rated menus as satisfaction denominator.
 * Unknown dates/identity/rating remain separately described, with no inferred
 * dates, ratings or source classifications. The owner-scoped loader is upstream. */
export function ArchiveMenuDetailGraph({ id, data }: { id: ArchiveMenuMetricID; data: ArchiveMenuInsights }) {
  const card = archiveMenuCards(data).find(item => item.id === id)!;
  const rated = data.satisfiedMenus.length + data.belowThresholdMenus.length;
  return <section className="tb-taste-detail-panel" aria-label={`${card.label} 상세 그래프`}>
    <p className="tb-taste-detail-scope text-center">{id === 'repeat-menu' ? '전체 기간 · 서로 다른 식사 수' : id === 'menu-exploration' ? '최근 30일 · 같은 식당의 같은 메뉴 기준' : '최근 30일 · 새 메뉴의 첫 식사 별점'}</p>
    {id === 'menu-exploration' ? <DetailBubbleChart items={[
      { id: 'new', label: '처음 기록한 메뉴', value: data.newMenus.length, color: miniBubbleColor('sweet') },
      { id: 'familiar', label: '이전부터 기록한 메뉴', value: data.familiarMenus.length, color: miniBubbleColor('umami') },
    ]} unit="가지" label="새 메뉴와 기존 메뉴 수. 원의 면적은 메뉴 수에 비례해요" />
      : id === 'repeat-menu' ? <DetailHorizontalBars items={data.repeatedMenus.map(menu => ({ id: menu.id, label: menu.label, value: menu.mealCount, axis: 'salty' as const, color: TASTE_TOKENS.salty.palette.main }))} unit="번" label="다시 기록한 메뉴 상위 3개 · 서로 다른 식사 수" />
        : <DetailDonutChart items={[
          { id: 'satisfied', label: '첫 식사에서 4점 이상', value: data.satisfiedMenus.length, color: pieDonutColor('sour') },
          { id: 'below', label: '첫 식사에서 4점 미만', value: data.belowThresholdMenus.length, color: pieDonutRemainderColor },
        ]} unit="가지" label="첫 별점이 있는 새 메뉴 중 4점 이상 메뉴의 비율" />}
    <p className="tb-taste-detail-scope">{id === 'menu-exploration' ? '앱에 처음 기록했다는 뜻이에요. 처음 먹은 메뉴인지는 판단하지 않아요.'
      : id === 'repeat-menu' ? '같은 식사의 여러 요리는 한 번만 세요. 기록 횟수를 호감으로 해석하지 않아요.'
        : rated ? `첫 별점이 확인된 ${rated}가지가 분모예요. 이후 식사의 별점과 이전 5단계 평가는 포함하지 않아요.` : '첫 별점이 확인된 메뉴가 없어 비율을 계산하지 않아요.'}</p>
    {card.legend.filter(item => item.id && ['uncertain', 'undated', 'unlinked', 'unrated', 'ambiguous'].includes(item.id)).map(item => <p className="tb-taste-detail-scope" key={item.id}>{item.label} · 해당 집계에서 제외</p>)}
  </section>;
}

export default function ArchiveMenuCards({ data, onOpen }: { data: ArchiveMenuInsights; onOpen: (id: ArchiveMenuMetricID) => void }) {
  return <>{archiveMenuCards(data).map(card => <PeriodCard key={card.id}
    category={card.id === "new-menu-satisfaction" ? "preference" : "experience"}
    label={card.label} title={card.title} detail={card.detail}
    color={TASTE_TOKENS[card.id === "repeat-menu" ? "salty" : card.id === "menu-exploration" ? "sweet" : "sour"].palette.main}
    onOpen={() => onOpen(card.id)} legend={card.legend}
    visualization={<ArchiveMenuMiniGraph id={card.id} data={data} />}
  />)}</>;
}
