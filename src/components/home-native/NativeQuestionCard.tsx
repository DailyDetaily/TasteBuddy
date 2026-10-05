import { useEffect, useState } from "react";
import JournalStackCard, { journalButton } from "./JournalStackCard";
import PalateBloomAvatar, {
  createPalateBloomFallbackProfile,
} from "../system/PalateBloomAvatar";
import { NativeRecordPhoto } from "../dining-native/NativeDiningHome";
import { conditionLabels } from "../../lib/gastronomy/engine";
import type { useQuestionPresentation } from "../../lib/gastronomy/useJournalPresentation";
import { swiftDate } from "../../lib/gastronomy/nativeArchive";
import type { NativeRecord } from "../../lib/gastronomy/nativeRecord";
type Presentation = ReturnType<typeof useQuestionPresentation>;
export default function NativeQuestionCard({
  item,
  presentation,
  owner,
  onEdit,
  showsStack,
  expandedStack,
  onToggleStack,
}: {
  item: Presentation["candidates"][number];
  presentation: Presentation;
  owner: string;
  onEdit: (id: string) => void;
  showsStack?: boolean;
  expandedStack?: boolean;
  onToggleStack?: () => void;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  const { entry, question, source, choices } = item;
  const time =
    entry.mealTime?.source === "user_confirmed"
      ? swiftDate(entry.mealTime.start)
      : null;
  const context = [
    conditionLabels[source.phase],
    conditionLabels[source.target],
  ]
    .filter(Boolean)
    .join(" · ");
  const title = [
    [entry.restaurant, entry.menu].filter(Boolean).join(" · "),
    context,
    question.question,
  ]
    .filter(Boolean)
    .join("\n");
  const subtitle = [
    time ? new Date(time).toLocaleDateString("ko-KR") : "식사일 미확인",
    `“${source.selectionEvidence?.labelSnapshot ?? source.phrase}”`,
    "이 경험에 아직 남기지 않은 응답을 보완해요.",
  ].join("\n");
  async function run(action: () => Promise<unknown>) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "응답을 저장하지 못했어요.");
    } finally {
      setPending(false);
    }
  }
  return (
    <JournalStackCard
      identity={question.id}
      title={title}
      subtitle={subtitle}
      showsStack={showsStack}
      expandedStack={expandedStack}
      onToggleStack={onToggleStack}
      onExpose={() => presentation.expose(question)}
      media={<QuestionMedia owner={owner} entry={entry} seed={question.id} />}
    >
      <div
        role="group"
        aria-label={question.question}
        className={`flex gap-2 ${choices.length <= 3 ? "" : "flex-col"}`}
      >
        {choices.map((choice: any) => (
          <button
            key={choice.id}
            type="button"
            disabled={pending}
            className="min-h-12 min-w-0 flex-1 rounded-full border border-[var(--tb-color-border-subtle)] bg-[var(--tb-color-surface-muted)] px-3 py-2 text-[12px] disabled:opacity-40"
            onClick={() => void run(() => presentation.answer(item, choice.id))}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <details className="mt-3">
        <summary className="min-h-11 cursor-pointer py-3 text-[12px] text-[var(--tb-color-text-hint)]">
          질문 옵션
        </summary>
        <div className="flex flex-wrap gap-1">
          <button
            className={journalButton}
            disabled={pending}
            onClick={() =>
              void run(() => presentation.status(question, "deferred"))
            }
          >
            나중에 답하기
          </button>
          <button
            className={journalButton}
            disabled={pending}
            onClick={() =>
              void run(() => presentation.status(question, "cannotRecall"))
            }
          >
            기억나지 않아요
          </button>
          <button
            className={journalButton}
            disabled={pending}
            onClick={() => onEdit(entry.id)}
          >
            원본 수정
          </button>
        </div>
      </details>
      {pending && (
        <p role="status" className="text-[12px]">
          기기에 저장하고 있어요
        </p>
      )}
      {error && (
        <p role="alert" className="text-[12px]">
          {error}
        </p>
      )}
    </JournalStackCard>
  );
}
export function QuestionMedia({
  owner,
  entry,
  seed,
}: {
  owner: string;
  entry: NativeRecord;
  seed: string;
}) {
  const fallback = (
    <div className="flex size-full items-center justify-center">
      <PalateBloomAvatar
        profile={createPalateBloomFallbackProfile(seed)}
        size={48}
        shapeSeed={seed}
        showFrame={false}
      />
    </div>
  );
  return (
    <div
      aria-hidden="true"
      className="size-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
    >
      <NativeRecordPhoto owner={owner} entry={entry} fallback={fallback} />
    </div>
  );
}
export function QuestionUndo({ presentation }: { presentation: Presentation }) {
  const [error, setError] = useState<string | null>(null),
    [pending, setPending] = useState(false);
  useEffect(() => {
    setError(null);
    setPending(false);
  }, [presentation.canUndo]);
  if (!presentation.canUndo) return null;
  return (
    <div
      className="fixed bottom-24 left-1/2 z-[95] flex w-[calc(100%-40px)] max-w-md -translate-x-1/2 flex-wrap items-center gap-2 rounded-[20px] bg-[var(--tb-color-text-primary)] px-4 py-2 text-white shadow-lg"
      role="status"
    >
      <span className="flex-1 text-[13px]">답변을 기록했어요</span>
      <button
        className={journalButton}
        disabled={pending}
        onClick={() => {
          setPending(true);
          void presentation
            .undoAnswer()
            .catch((e) => setError(e.message))
            .finally(() => setPending(false));
        }}
      >
        되돌리기
      </button>
      <button className={journalButton} onClick={presentation.clearUndo}>
        닫기
      </button>
      {error && (
        <p role="alert" className="w-full text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}
