import React, { useMemo, useState } from "react";
import { useNativeJournal } from "../../lib/gastronomy/useNativeJournal";
import { useNativeAnalysis } from "../../lib/gastronomy/useNativeAnalysis";
import {
  useDiscoveryPresentation,
  usePresentationClock,
} from "../../lib/gastronomy/useJournalPresentation";
import {
  buildNativeHomeDiscoveries,
  homeDiscoveryLabels,
  type NativeHomeDiscovery,
} from "../../lib/gastronomy/nativeHomeDiscoveries";
import { DINING_KEY } from "../../lib/gastronomy/nativeRecord";
import {
  discoveryLabels,
  type Category,
  type Period,
} from "../../lib/gastronomy/engine";
import CardScrollList from "../system/CardScrollList";
import PeriodCard from "../gastronomy/PeriodCard";
import NativeDiscoveryDetail from "./NativeDiscoveryDetail";
const NativeDiningCapture = React.lazy(
  () => import("../dining-native/NativeDiningCapture"),
);
export default function NativeDiscoverySection({
  owner,
  category,
  color,
  period = "all",
  source = "all",
}: {
  owner: string;
  category: Category;
  color: string;
  period?: Period;
  source?: string;
}) {
  const journal = useNativeJournal(owner),
    analysis = useNativeAnalysis(
      journal.entries,
      owner,
      !!journal.archive && journal.canEdit,
    ),
    now = usePresentationClock(),
    visibility = useDiscoveryPresentation(owner);
  const [selected, setSelected] = useState<string | null>(null),
    [editID, setEditID] = useState<string | null>(null),
    [limit, setLimit] = useState(3),
    [failure, setFailure] = useState<string | null>(null);
  const cards = useMemo(
    () =>
      analysis.snapshot
        ? buildNativeHomeDiscoveries(journal.entries, analysis.snapshot, now, {
            period,
            source,
          }).filter((c) => c.category === category)
        : [],
    [
      analysis.snapshot,
      journal.archive?.snapshot.values[DINING_KEY],
      now,
      period,
      source,
      category,
    ],
  );
  const eligible = cards.filter(
      (c) => (visibility.history[`snooze:${c.id}`] ?? 0) <= +now,
    ),
    isRead = (c: NativeHomeDiscovery) =>
      (visibility.history[`read:${c.meaningKey}`] ?? 0) > +now;
  const unread = eligible.filter((c) => !isRead(c)),
    read = eligible.filter(isRead);
  const open = (card: NativeHomeDiscovery) => {
    setSelected(card.id);
    void visibility.update(card, "read").catch((e) => setFailure(e.message));
  };
  const rail = (items: NativeHomeDiscovery[]) => (
    <CardScrollList snapsToCards contentClassName="items-stretch gap-3">
      {items.map((c) => (
        <div
          key={c.id}
          className="flex w-[calc(100vw-72px)] min-w-[240px] max-w-[360px] shrink-0 flex-col gap-1"
        >
          <PeriodCard
            category={c.category}
            label={homeDiscoveryLabels[c.kind]}
            title={c.title}
            detail={c.detail}
            color={color}
            onOpen={() => open(c)}
            footer={c.scopeLabel}
          />
          <button
            className="min-h-11 text-[11px] text-[var(--tb-color-text-hint)]"
            onClick={() =>
              void visibility
                .update(c, "snooze")
                .catch((e) => setFailure(e.message))
            }
          >
            나중에 보기
          </button>
        </div>
      ))}
    </CardScrollList>
  );
  const error = failure ?? visibility.error ?? analysis.error ?? journal.error;
  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold">발견</h2>
      {error && (
        <p role="alert" className="mb-3 text-[13px]">
          {error}
        </p>
      )}
      {!analysis.snapshot || !visibility.ready ? (
        <p role="status" className="py-4 text-[13px]">
          현재 기록에서 발견을 확인하고 있어요
        </p>
      ) : unread.length ? (
        rail(unread.slice(0, limit))
      ) : (
        <CardScrollList snapsToCards contentClassName="items-stretch gap-3">
          {discoveryLabels[category].map((label) => (
            <div
              key={label}
              className="flex w-[calc(100vw-72px)] min-w-[240px] max-w-[360px] shrink-0"
            >
              <PeriodCard
                category={category}
                label={label}
                title="다음 단서를 모으고 있어요"
                detail="같은 감각의 직접 평가나 다른 상황의 기록이 쌓이면 비교할 수 있는 해석을 보여드려요."
                color={color}
                footer="확인할 근거가 더 필요해요"
              />
            </div>
          ))}
        </CardScrollList>
      )}
      {unread.length > limit && (
        <button
          className="min-h-11 text-[12px]"
          onClick={() => setLimit((n) => n + 30)}
        >
          발견 더 보기 · {limit}/{unread.length}개
        </button>
      )}
      {read.length > 0 && (
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-[13px]">
            확인한 발견 {read.length}개
          </summary>
          {rail(read)}
        </details>
      )}
      <NativeDiscoveryDetail
        card={cards.find((c) => c.id === selected)}
        open={!!selected}
        owner={owner}
        entries={journal.entries}
        onClose={() => setSelected(null)}
        onEdit={(id) => {
          setSelected(null);
          setEditID(id);
        }}
        onSnooze={(card) => visibility.update(card, "snooze")}
      />
      {editID && (
        <React.Suspense fallback={<p role="status">기록을 준비하고 있어요</p>}>
          <NativeDiningCapture
            owner={owner}
            request={{ entryID: editID }}
            onClose={() => setEditID(null)}
            onSaved={() => setEditID(null)}
          />
        </React.Suspense>
      )}
    </section>
  );
}
