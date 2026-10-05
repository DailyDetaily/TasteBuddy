import React, { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNativeJournal } from "../../lib/gastronomy/useNativeJournal";
import { useNativeAnalysis } from "../../lib/gastronomy/useNativeAnalysis";
import {
  useQuestionPresentation,
  useDiscoveryPresentation,
  usePresentationClock,
} from "../../lib/gastronomy/useJournalPresentation";
import {
  mergeJournal,
  previewJournal,
  visibleDiscoveries,
  type JournalItem,
} from "../../lib/gastronomy/nativeJournalPolicy";
import {
  buildNativeHomeDiscoveries,
  homeDiscoveryLabels,
  type NativeHomeDiscovery,
} from "../../lib/gastronomy/nativeHomeDiscoveries";
import { DINING_KEY } from "../../lib/gastronomy/nativeRecord";
import JournalStackCard, { journalButton } from "./JournalStackCard";
import NativeQuestionCard, {
  QuestionUndo,
  QuestionMedia,
} from "./NativeQuestionCard";
import NativeDiscoveryDetail from "./NativeDiscoveryDetail";
const NativeDiningCapture = React.lazy(
  () => import("../dining-native/NativeDiningCapture"),
);
export default function HomeJournalStack({ owner }: { owner: string }) {
  const journal = useNativeJournal(owner),
    analysis = useNativeAnalysis(
      journal.entries,
      owner,
      !!journal.archive && journal.canEdit,
    ),
    snapshot = analysis.snapshot,
    now = usePresentationClock();
  const questions = useQuestionPresentation(journal, snapshot, owner, now),
    visibility = useDiscoveryPresentation(owner);
  const cards = useMemo(
    () =>
      snapshot
        ? buildNativeHomeDiscoveries(journal.entries, snapshot, now)
        : [],
    [snapshot, journal.archive?.snapshot.values[DINING_KEY], now],
  );
  const discoveries = visibility.ready
    ? visibleDiscoveries(cards, visibility.history, now)
    : [];
  const items = mergeJournal(
    questions.candidates.map((item: any) => ({
      ...item,
      id: item.question.id,
    })),
    discoveries,
  );
  const [expanded, setExpanded] = useState(false),
    [all, setAll] = useState(false),
    [limit, setLimit] = useState(24),
    [selected, setSelected] = useState<string | null>(null),
    [editID, setEditID] = useState<string | null>(null),
    [actionError, setActionError] = useState<string | null>(null);
  useEffect(() => {
    setExpanded(false);
    setAll(false);
    setSelected(null);
    setEditID(null);
    setActionError(null);
  }, [owner]);
  const preview = previewJournal(items, expanded ? 3 : 1);
  const edit = (id: string) => {
    setSelected(null);
    setAll(false);
    setEditID(id);
  };
  const open = (card: NativeHomeDiscovery) => {
    setSelected(card.id);
    void visibility
      .update(card, "read")
      .catch((e) => setActionError(e.message));
  };
  function render(
    item: (typeof items)[number],
    index: number,
    insideList = false,
  ) {
    const stack = {
      showsStack: !insideList && !expanded && items.length > 1,
      expandedStack: expanded,
      onToggleStack:
        !insideList && index === 0 && items.length > 1
          ? () => setExpanded((v) => !v)
          : undefined,
    };
    if (item.type === "question")
      return (
        <NativeQuestionCard
          key={item.id}
          item={item.question}
          presentation={questions}
          owner={owner}
          onEdit={edit}
          {...stack}
        />
      );
    const card = item.discovery,
      photo = card.photoFilename
        ? journal.entries.find(
            (e) => e.reflectionPhotoFilename === card.photoFilename,
          )
        : undefined;
    return (
      <JournalStackCard
        identity={card.id}
        key={item.id}
        title={card.title}
        subtitle={card.detail}
        label={`발견 · ${homeDiscoveryLabels[card.kind]}`}
        onOpen={() => open(card)}
        media={
          photo ? (
            <QuestionMedia entry={photo} owner={owner} seed={card.id} />
          ) : undefined
        }
        {...stack}
      />
    );
  }
  const error =
    questions.error ??
    visibility.error ??
    actionError ??
    analysis.error ??
    (!snapshot ? journal.error : null);
  const loading = !snapshot && (analysis.updating || journal.loading);
  return (
    <div className="mt-3" role="region" aria-label="질문과 발견 카드 영역">
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-[20px] bg-white p-4 text-[13px]"
        >
          {error}
        </p>
      )}
      {loading ? (
        <p
          role="status"
          className="rounded-[20px] bg-white p-5 text-center text-[13px]"
        >
          기록을 다시 읽고 있어요
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {preview.map((item, index) => render(item, index))}
          {expanded && items.length > preview.length && (
            <button
              className={journalButton}
              onClick={() => {
                setLimit(24);
                setAll(true);
              }}
            >
              카드 전체보기 · {items.length}개
            </button>
          )}
        </div>
      )}
      <Dialog.Root open={all} onOpenChange={setAll}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/25" />
          <Dialog.Content
            aria-label="질문과 발견 카드"
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 top-6 z-[81] flex flex-col rounded-t-[24px] bg-[var(--tb-color-bg-page)] sm:left-1/2 sm:right-auto sm:top-5 sm:w-[640px] sm:-translate-x-1/2"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 px-5 py-2">
              <Dialog.Title className="text-[16px] font-semibold">
                질문과 발견 카드
              </Dialog.Title>
              <Dialog.Close className={journalButton}>닫기</Dialog.Close>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
              <div className="flex flex-col gap-3">
                {items
                  .slice(0, limit)
                  .map((item, index) => render(item, index, true))}
                {items.length > limit && (
                  <button
                    className={journalButton}
                    onClick={() => setLimit((n) => n + 24)}
                  >
                    카드 더 보기
                  </button>
                )}
                {!items.length && (
                  <p className="py-8 text-[14px]">
                    지금 확인할 질문이나 새로운 발견이 없어요.
                  </p>
                )}
              </div>
            </div>
            {!selected && <QuestionUndo presentation={questions} />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <NativeDiscoveryDetail
        card={cards.find((c) => c.id === selected)}
        open={!!selected}
        entries={journal.entries}
        owner={owner}
        onClose={() => setSelected(null)}
        onEdit={edit}
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
      {!all && !selected && <QuestionUndo presentation={questions} />}
    </div>
  );
}
