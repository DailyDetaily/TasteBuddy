import { useEffect, useMemo, useState } from "react";
import { Trophy, CircleCheck, Bookmark, Sparkles } from "lucide-react";
import { useNativeJournal } from "../../lib/gastronomy/useNativeJournal";
import { useNativeAnalysis } from "../../lib/gastronomy/useNativeAnalysis";
import {
  nativeProfileActivity,
  readNativeProfileBookmarks,
} from "../../lib/gastronomy/nativeProfile";
import {
  loadRestaurantBookmarks,
  RESTAURANT_BOOKMARKS_CHANGED_EVENT,
} from "../restaurant/RestaurantBookmarkSheet";
import SummaryMetricCard from "../system/SummaryMetricCard";
import PageSection from "../system/PageSection";

export default function NativeProfileActivity({
  owner,
  active = true,
  onOpenSavedList,
}: {
  owner: string;
  active?: boolean;
  onOpenSavedList?: () => void;
}) {
  const journal = useNativeJournal(owner, active);
  const analysis = useNativeAnalysis(
    journal.entries,
    owner,
    active && !!journal.archive && journal.canEdit,
  );
  const stats = useMemo(
    () => (journal.canEdit && analysis.snapshot ? nativeProfileActivity(analysis.snapshot) : null),
    [analysis.snapshot, journal.canEdit],
  );
  const [legacyCount, setLegacyCount] = useState(
    () => new Set(loadRestaurantBookmarks().map((b) => b.restaurantId)).size,
  );
  useEffect(() => {
    const update = () =>
      setLegacyCount(
        new Set(loadRestaurantBookmarks().map((b) => b.restaurantId)).size,
      );
    update();
    window.addEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, [owner]);
  let savedCount: number | null = null,
    bookmarkError: string | null = null;
  if (journal.archive)
    try {
      const saved = readNativeProfileBookmarks(journal.archive.snapshot);
      savedCount = saved.present ? saved.ids.length : legacyCount;
    } catch (e) {
      bookmarkError =
        e instanceof Error ? e.message : "저장 식당을 확인하지 못했어요.";
    }
  const number = (n: number | undefined | null, unit: string) =>
    n == null ? "—" : `${n}${unit}`;
  const metrics = [
    {
      label: "근거 기록",
      value: number(stats?.sourceExperienceCount, "개"),
      icon: Trophy,
    },
    {
      label: "다이닝 리뷰",
      value: number(stats?.completedExperienceCount, "건"),
      icon: CircleCheck,
    },
    {
      label: "테이스트 리스트",
      value: number(savedCount, "개"),
      icon: Bookmark,
      onClick: onOpenSavedList,
    },
    {
      label: "현재 인사이트",
      value: number(stats?.insightCount, "개"),
      icon: Sparkles,
    },
  ];
  const error = journal.error ?? analysis.error ?? bookmarkError;
  return (
    <PageSection title="활동 요약" titleSize="md">
      <div
        aria-label="활동 요약 지표"
        aria-busy={!stats && !error}
        className="grid grid-cols-2 gap-3"
      >
        {metrics.map((metric) => (
          <SummaryMetricCard
            key={metric.label}
            {...metric}
            color="var(--tb-color-text-secondary)"
            className="border-0"
          />
        ))}
      </div>
      {error ? (
        <div
          role="alert"
          className="mt-3 text-[12px] text-[var(--tb-color-text-secondary)]"
        >
          {error}
          <button
            className="ml-2 min-h-11 underline"
            onClick={() => {
              journal.retry();
              analysis.retry();
            }}
          >
            다시 시도
          </button>
        </div>
      ) : !stats ? (
        <p
          role="status"
          className="mt-3 text-[12px] text-[var(--tb-color-text-hint)]"
        >
          현재 기록에서 활동을 확인하고 있어요.
        </p>
      ) : null}
    </PageSection>
  );
}
