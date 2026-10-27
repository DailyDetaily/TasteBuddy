import RecordChartsPanel from "../components/gastronomy/RecordChartsPanel";
import MiniHeatmap, { miniHeatmapColor } from "../components/system/plating/MiniHeatmap";
import { buildRecordChartData } from "../lib/gastronomy/recordChartData";
import { buildArchiveMenuInsights } from "../lib/gastronomy/archiveMenuInsights";
import ArchiveMenuCards, { archiveMenuCards, ArchiveMenuDetailGraph } from "../components/home/ArchiveMenuCards";
import { useChartReferenceDate } from "../lib/gastronomy/useChartReferenceDate";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  SquarePen,
} from "lucide-react";
import { ICON_TOKENS } from "../constants/designTokens";
import { TASTE_TOKENS } from "../constants/uiColorTokens";
import type { HomeChefMatchCardData } from "../components/home/HomeCards";
import { HomeSearchTrigger, type HomeSearchResult } from "../components/home/HomeUnifiedSearch";
import type { TasteMeasurementSnapshot } from "../constants/tasteMeasurementData";
import type { RestaurantReadyGuidance } from "../constants/quickTasteCalibrationData";
import type { DiningFriendProfile } from "../lib/supabase";
import type { TasteProfile as PalateBloomTasteProfile } from "../components/system/PalateBloomAvatar";
import type { DiningPageExternalFeedbackSubmission } from "./DiningPage";
import { useGastronomyData } from "../lib/gastronomy/useGastronomyData";
import {
  categories,
  prepare,
  mealCount,
  type Category,
  type Card,
} from "../lib/gastronomy/engine";
import TasteDataPage, {
  DetailHeader,
  MeasurementDetail,
  RecordEvidence,
} from "../components/gastronomy/TasteDataPage";
import PeriodCard from "../components/gastronomy/PeriodCard";
import CardScrollList from "../components/system/CardScrollList";
import InsightCategoryIcon from "../components/system/InsightCategoryIcon";
import PageSection from "../components/system/PageSection";
import EmptyState from "../components/system/EmptyState";
const HomeJournalStack = lazy(() => import('../components/home-native/HomeJournalStack'));
const EMPTY: readonly DiningPageExternalFeedbackSubmission[] = [];
// The same category → taste-axis mapping used by CompactSummaryCard on iOS.
const CATEGORY_AXES = {
  experience: "fat", sensation: "sour", preference: "sweet", context: "sour", change: "bitter",
} as const;

interface HomePageProps {
  disableHydration?: boolean;
  feedbackSubmissions?: readonly DiningPageExternalFeedbackSubmission[];
  ownerID?: string;
  onEditRecord?: (id: string) => void;
  onOpenJournal?: () => void;
  onOpenGlobalSearch?: () => void;
  hasMeasurementData: boolean;
  measurementSnapshot: TasteMeasurementSnapshot | null;
  starterGuidance?: RestaurantReadyGuidance | null;
  onStartMeasurement: () => void;
  onStartRemeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onRootViewChange?: (isRootView: boolean) => void;
  onOpenRestaurantDetail?: (chef: HomeChefMatchCardData) => void;
  onOpenRestaurantDetailFromSearch?: (result: HomeSearchResult) => void;
  onStartDiningFeedbackFromSearch?: (result: HomeSearchResult) => void;
  onOpenTasteBuddyProfile?: (profile: DiningFriendProfile) => void;
  onAddFriend?: (
    friend: DiningFriendProfile,
  ) => Promise<{ ok: boolean; message: string }>;
  onRemoveFriend?: (
    friend: DiningFriendProfile,
  ) => Promise<{ ok: boolean; message: string }>;
  onSearchFriends?: (query: string) => Promise<{
    ok: boolean;
    friends: DiningFriendProfile[];
    message: string;
  }>;
  hasUnreadNotifications?: boolean;
  userAvatarImageSrc?: string | null;
  userNickname?: string | null;
  userPalateBloomProfile?: PalateBloomTasteProfile;
  userPalateBloomShapeSeed?: string;
}

export default function HomePage({
  feedbackSubmissions = EMPTY,
  ownerID = "guest",
  disableHydration = false,
  onRootViewChange,
  onOpenJournal,
  onEditRecord,
  onOpenGlobalSearch,
}: HomePageProps) {
  const { data, loading, error, retry } = useGastronomyData(
    feedbackSubmissions,
    ownerID,
    !disableHydration,
  );
  const [category, setCategory] = useState<Category | null>(null),
    [detail, setDetail] = useState<string | null>(null);
  const [searching, setSearching] = useState(false),
    [query, setQuery] = useState("");
  const chartReferenceDate = useChartReferenceDate(data);
  const state = useMemo(() => prepare(data, "all", "all", chartReferenceDate), [data, chartReferenceDate]);
  const recordChart = useMemo(() => buildRecordChartData(data, chartReferenceDate), [data, chartReferenceDate]);
  const menuInsights = useMemo(() => buildArchiveMenuInsights(data, chartReferenceDate), [data, chartReferenceDate]);
  const menuCards = archiveMenuCards(menuInsights);
  const mealCard: Card = { id: "meals", title: "날짜별 기록 빈도",
    meaning: "확인된 식사일 기준 · 식사와 요리 기록 수를 구분해요",
    rows: [{ id: "meals", title: "전체 기록", value: mealCount(state.records) + "번의 식사",
      detail: "요리 기록 " + state.records.length + "개", entryIDs: state.records.map(row => row.id) }] };
  const selectedMenuCard = menuCards.find(card => card.id === detail);
  const currentDetail = selectedMenuCard?.card ?? mealCard;
  const isRoot = !category && !detail && !searching;
  useEffect(() => {
    if (!disableHydration) onRootViewChange?.(isRoot);
    return () => onRootViewChange?.(true);
  }, [isRoot, onRootViewChange, disableHydration]);
  useEffect(() => {
    setCategory(null);
    setDetail(null);
    setSearching(false);
    setQuery("");
  }, [ownerID]);
  if ((detail || category) && (loading || error)) return <main className="h-full overflow-y-auto bg-[var(--tb-color-bg-page)]">
    <DetailHeader title={detail ? currentDetail.title : categories.find(item => item.id === category)?.title ?? '기록 상세'} onBack={() => { setDetail(null); setCategory(null); }} />
    <div className="p-5" role={error ? "alert" : "status"}>
      {loading ? "현재 계정의 기록을 불러오고 있어요" : "기록을 모두 확인하지 못했어요. " + error}
      {error && <button type="button" onClick={retry} className="block min-h-11 underline">다시 시도</button>}
    </div>
  </main>;
  if (detail)
    return (
      <MeasurementDetail
        key={ownerID + ":" + detail}
        card={currentDetail}
        chartContent={detail === "meals" ? <RecordChartsPanel data={data} now={chartReferenceDate} loading={loading} error={error} onRetry={retry} variant="detail" />
          : selectedMenuCard ? <ArchiveMenuDetailGraph id={selectedMenuCard.id} data={menuInsights} /> : undefined}
        data={data}
        color="#B372B4"
        onEditRecord={onEditRecord}
        onBack={() => setDetail(null)}
      />
    );
  if (category)
    return (
      <TasteDataPage
        category={category}
        data={data}
        ownerID={ownerID}
        onEditRecord={onEditRecord}
        onBack={() => setCategory(null)}
      />
    );
  if (searching) {
    const words = query
      .trim()
      .normalize("NFKC")
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const results = data.records.filter((r) =>
      words.every((w) =>
        [r.menu, r.restaurant, r.note, ...r.labels]
          .join(" ")
          .normalize("NFKC")
          .toLocaleLowerCase()
          .includes(w),
      ),
    );
    return (
      <main className="flex h-full flex-col bg-[var(--tb-color-bg-page)]">
        <DetailHeader title="내 기록" onBack={() => setSearching(false)} />
        <div className="flex-1 overflow-y-auto p-5">
          <input
            autoFocus
            type="search"
            aria-label="내 기록 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="메뉴, 식당, 남긴 표현 검색"
            className="min-h-11 w-full rounded-full border bg-[var(--tb-color-surface-base)] px-4 text-[13px]"
          />
          <p className="my-4 text-[12px] leading-5 text-[var(--tb-color-text-hint)]">
            현재 계정의 기록에서 찾아요. 검색어는 이 기기에서만 사용해요.
          </p>
          <p className="mb-4 text-[12px]">
            전체 {data.records.length}개 조회 · 일치 {results.length}개
          </p>
          <RecordEvidence records={results} onEditRecord={onEditRecord} />
          <button
            type="button"
            className="mt-5 min-h-11 text-[13px]"
            onClick={() => {
              setSearching(false);
              onOpenGlobalSearch?.();
            }}
          >
            공개 장소·버디 검색 <ChevronRight className="inline" size={14} />
          </button>
        </div>
      </main>
    );
  }
  return (
    <main
      className="h-full w-full overflow-y-auto bg-[var(--tb-color-bg-page)]"
      aria-label="홈 콘텐츠"
    >
      <div className="tb-section-stack px-5 pb-[72px] pt-2">
        <HomeSearchTrigger onOpen={onOpenGlobalSearch ?? (() => setSearching(true))} />
        {error && (
          <div role="alert" className="rounded-[20px] bg-[var(--tb-color-surface-base)] p-4 text-[13px]">
            {error}
            <button
              type="button"
              className="ml-2 min-h-11 underline"
              onClick={retry}
            >
              다시 시도
            </button>
          </div>
        )}
        <PageSection title="인사이트 요약" titleAs="h2" titleSize="md">
          <CardScrollList snapsToCards contentClassName="gap-3">
            {categories.map((c) => {
              const palette = TASTE_TOKENS[CATEGORY_AXES[c.id]].palette;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  aria-label={`${c.title}, ${c.subtitle}, 미식 데이터 보기`}
                  className="flex h-[132px] w-[132px] shrink-0 flex-col gap-3 rounded-[20px] p-3 text-left ring-1 ring-inset"
                  style={{
                    background: palette.tintSurface,
                    '--tw-ring-color': palette.borderDefault,
                  }}
                >
                  <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-[var(--tb-color-surface-base)]">
                    <InsightCategoryIcon category={c.id} color={palette.main} size={ICON_TOKENS.size.lg} strokeWidth={ICON_TOKENS.strokeWidth.strong} />
                  </span>
                  <span className="flex h-[54px] w-full min-w-0 flex-col" style={{ color: palette.tintSurfaceText }}>
                    <span className="truncate text-[14px] font-bold leading-[17px]">{c.title}</span>
                    <span className="mt-[2px] truncate text-[14px] font-semibold leading-[17px]" style={{ color: palette.tintSurfaceSubText }}>
                      {c.subtitle}
                    </span>
                    <span className="mt-auto truncate text-[10px] leading-3">미식 데이터 보기</span>
                  </span>
                </button>
              );
            })}
          </CardScrollList>
          {!disableHydration && !loading && !error && <Suspense fallback={<p role="status" className="mt-3 text-[12px]">기록을 다시 읽고 있어요</p>}><HomeJournalStack key={ownerID} owner={ownerID} repeatedMenuEntryIDs={menuInsights.repeatedMenus.flatMap(menu => menu.entryIDs)}/></Suspense>}
          {loading && (
            <p
              role="status"
              className="mt-3 text-[12px] text-[var(--tb-color-text-hint)]"
            >
              현재 기록에서 집계하고 있어요
            </p>
          )}
        </PageSection>
        <PageSection title="아카이브" titleAs="h2">
          {loading ? <p role="status" className="py-4 text-[13px]">현재 계정의 기록을 불러오고 있어요</p>
            : error ? <p className="py-4 text-[13px]">기록을 모두 확인한 뒤 아카이브를 표시해요.</p>
            : <>
              <p className="mb-3 text-[12px] text-[var(--tb-color-text-hint)]">
                전체 식사 {menuInsights.mealCount}번 · 연결된 메뉴 {menuInsights.menuCount}가지 · 식당 {menuInsights.restaurantCount}곳
              </p>
              <div className="flex flex-col gap-3">
                <ArchiveMenuCards data={menuInsights} onOpen={setDetail} />
                <PeriodCard category="experience" label="날짜별 기록 빈도"
                  title={"기록한 날 " + recordChart.month.filter(day => (day.count ?? 0) > 0).length + "일"}
                  detail={"요리 기록 " + recordChart.total + "개\n" + recordChart.monthLabel}
                  color={TASTE_TOKENS.umami.palette.main} onOpen={() => setDetail("meals")}
                  legend={[
                    ...[0, 1, 2, 3, 4].map(level => ({ id: String(level), label: level === 4 ? "4개 이상" : level + "개", color: miniHeatmapColor(level) })),
                    ...(recordChart.unknownDateCount ? [{ id: "undated", label: "식사일 미확인 " + recordChart.unknownDateCount + "개 제외" }] : []),
                  ]}
                  visualization={<MiniHeatmap values={recordChart.month.map(day => day.count)} startDay={recordChart.startDay} />}
                />
              </div>
            </>}
        </PageSection>
        {!loading && !error && <PageSection title="최근 기록" titleAs="h2">
          {state.records.length ? <div className="tb-card-stack">
            {[...state.records]
              .sort((a, b) => b.savedAt.localeCompare(a.savedAt) || a.id.localeCompare(b.id))
              .slice(0, 3)
              .map(record => {
                const canOpen = record.id.startsWith("native:") && Boolean(onEditRecord);
                const content = <>
                  <span className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="text-[14px] font-semibold leading-[17px] text-[var(--tb-color-text-primary)]">{record.menu || "메뉴 미기록"}</span>
                    <span className="text-[12px] leading-[15px] text-[var(--tb-color-text-hint)]">{record.restaurant || "식당 미기록"}</span>
                    <span className="text-[12px] leading-[15px] text-[var(--tb-color-text-hint)]">
                      {record.date ? `식사일 ${new Date(record.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}` : "식사일 미확인"}
                    </span>
                  </span>
                  {canOpen && <ChevronRight size={16} className="shrink-0 text-[var(--tb-color-text-hint)]" aria-hidden="true" />}
                </>;
                const className = "flex w-full items-center gap-3 rounded-[20px] border border-[var(--tb-color-border-faint)] bg-[var(--tb-color-surface-base)] p-3 text-left";
                return canOpen
                  ? <button key={record.id} type="button" className={className} onClick={() => onEditRecord?.(record.id.slice(7))}>{content}</button>
                  : <article key={record.id} className={className}>{content}</article>;
              })}
            <button type="button" onClick={onOpenJournal ?? (() => setSearching(true))} className="min-h-11 w-full text-[12px] text-[var(--tb-color-text-primary)]">기록 전체보기</button>
          </div> : <EmptyState
            title="첫 미식 기록을 기다리고 있어요"
            description="아래 가운데 기록 버튼으로 오늘의 메뉴와 기억에 남은 미각을 남겨보세요."
            icon={<SquarePen size={24} strokeWidth={1.8} />}
          />}
        </PageSection>}

      </div>
    </main>
  );
}
