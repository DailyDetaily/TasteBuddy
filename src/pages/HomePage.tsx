import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Search,
  Globe,
  Sparkles,
  Heart,
  SlidersHorizontal,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
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
  dimensionRows,
  mealCount,
  buildCards,
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
const HomeJournalStack = lazy(() => import('../components/home-native/HomeJournalStack'));
const EMPTY: readonly DiningPageExternalFeedbackSubmission[] = [];
const icons = [Globe, Sparkles, Heart, SlidersHorizontal, TrendingUp];

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
  onStartMeasurement,
}: HomePageProps) {
  const { data, loading, error, retry } = useGastronomyData(
    feedbackSubmissions,
    ownerID,
    !disableHydration,
  );
  const [category, setCategory] = useState<Category | null>(null),
    [detail, setDetail] = useState<Card | null>(null);
  const [searching, setSearching] = useState(false),
    [query, setQuery] = useState("");
  const state = useMemo(() => prepare(data), [data]);
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
  if (detail)
    return (
      <MeasurementDetail
        card={detail}
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
            className="min-h-11 w-full rounded-full border bg-white px-4 text-[13px]"
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
  const menus = dimensionRows(state.selected, "menu"),
    restaurants = dimensionRows(state.selected, "restaurant");
  const overall = buildCards(state, "preference")[0];
  const metrics: Card[] = [
    {
      id: "meals",
      title: "기록한 식사",
      meaning: "전체 기간 · 식사와 요리 기록을 구분해요",
      rows: [
        {
          id: "meals",
          title: "식사",
          value: `${mealCount(state.selected)}번의 식사`,
          detail: `요리 기록 ${state.selected.length}개 · 식사일 미확인 ${state.unknown.length}개`,
          entryIDs: state.selected.map((r) => r.id),
        },
      ],
    },
    {
      id: "menus",
      title: "경험한 메뉴",
      meaning: "전체 기간 · 식당별로 구분",
      rows: menus,
    },
    {
      id: "restaurants",
      title: "기록한 식당",
      meaning: "전체 기간",
      rows: restaurants,
    },
    { ...overall, title: "음식 전체 평가" },
  ];
  return (
    <main
      className="h-full w-full overflow-y-auto bg-[var(--tb-color-bg-page)]"
      aria-label="홈 콘텐츠"
    >
      <div className="flex flex-col gap-6 px-5 pb-8 pt-1">
        <HomeSearchTrigger onOpen={onOpenGlobalSearch ?? (() => setSearching(true))} />
        {error && (
          <div role="alert" className="rounded-[20px] bg-white p-4 text-[13px]">
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
        <section>
          <h2 className="mb-3 text-[16px] font-bold">인사이트 요약</h2>
          <CardScrollList snapsToCards contentClassName="gap-3">
            {categories.map((c, i) => {
              const Icon = icons[i];
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className="flex h-[132px] w-[132px] shrink-0 flex-col gap-3 rounded-[20px] border p-3 text-left"
                  style={{
                    background: `${c.color}14`,
                    borderColor: `${c.color}2e`,
                  }}
                >
                  <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-white">
                    <Icon size={18} style={{ color: c.color }} />
                  </span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: c.color }}
                  >
                    {c.title}
                  </span>
                  <span className="-mt-2 w-full truncate text-[14px] font-semibold leading-5">
                    {c.subtitle}
                  </span>
                  <span className="mt-auto text-[10px] text-[var(--tb-color-text-hint)]">
                    미식 데이터 보기
                  </span>
                </button>
              );
            })}
          </CardScrollList>
          {!disableHydration && <Suspense fallback={<p role="status" className="mt-3 text-[12px]">기록을 다시 읽고 있어요</p>}><HomeJournalStack key={ownerID} owner={ownerID}/></Suspense>}
          {loading && (
            <p
              role="status"
              className="mt-3 text-[12px] text-[var(--tb-color-text-hint)]"
            >
              현재 기록에서 집계하고 있어요
            </p>
          )}
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[18px] font-bold">아카이브</h2>
            <button
              type="button"
              className="flex min-h-8 items-center gap-1 text-[12px] text-[var(--tb-color-text-muted)]"
              onClick={() => setSearching(true)}
            >
              <Search size={14} aria-hidden="true" />내 기록 검색
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {metrics.map((card, i) => (
              <PeriodCard
                key={card.id}
                label={card.title}
                title={
                  i === 1
                    ? `${menus.length}가지`
                    : i === 2
                      ? `${restaurants.length}곳`
                      : (card.rows[0]?.value ?? "아직 평가 없음")
                }
                detail={
                  i === 1 || i === 2
                    ? card.rows.length
                      ? `${card.rows.length}개의 기록 대상 · 전체 기간`
                      : "첫 기록을 남겨보세요"
                    : (card.rows[0]?.detail ??
                      "음식 전체에 남긴 평가가 여기에 모여요")
                }
                color={i === 0 ? "#B372B4" : i === 3 ? "#FBC02D" : "#95867A"}
                onOpen={() => setDetail(card)}
              />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-[18px] font-bold">최근 기록</h2>
          {state.selected.length ? (
            <PeriodCard
              label="기록 흐름"
              title={`${state.selected.length}개의 미식 기록`}
              detail={`최근 메뉴 ${[...state.selected].sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0].menu}`}
              color="#B372B4"
              onOpen={() =>
                setDetail({
                  id: "recent",
                  title: "최근 기록",
                  meaning: "현재 계정의 저장 원본",
                  rows: [
                    {
                      id: "recent",
                      title: "미식 기록",
                      value: `${state.selected.length}개`,
                      detail: "확인된 식사일과 저장일을 구분해요",
                      entryIDs: [...state.selected]
                        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
                        .map((r) => r.id),
                    },
                  ],
                })
              }
            />
          ) : (
            <div className="flex flex-col items-center rounded-[20px] bg-white px-5 py-8 text-center">
              <h3 className="text-[14px] font-semibold">
                첫 미식 기록을 기다리고 있어요
              </h3>
              <p className="mt-2 text-[12px] leading-5 text-[var(--tb-color-text-hint)]">
                아래 가운데 기록 버튼으로 오늘의 메뉴와 기억에 남은 미각을
                남겨보세요.
              </p>
              <button
                type="button"
                className="mt-4 min-h-11 rounded-full bg-[var(--tb-color-text-primary)] px-5 text-[13px] text-white"
                onClick={onStartMeasurement}
              >
                미식 기록 남기기
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
