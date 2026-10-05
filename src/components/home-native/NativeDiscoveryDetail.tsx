import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft } from "lucide-react";
import type { NativeHomeDiscovery } from "../../lib/gastronomy/nativeHomeDiscoveries";
import {
  homeDiscoveryLabels,
  nativeDiscoveryIsCurrent,
} from "../../lib/gastronomy/nativeHomeDiscoveries";
import {
  effectiveSelections,
  type NativeRecord,
} from "../../lib/gastronomy/nativeRecord";
import { swiftDate } from "../../lib/gastronomy/nativeArchive";
import { QUESTION_CHOICES } from "../../lib/gastronomy/nativeQuestions";
import { NativeRecordPhoto } from "../dining-native/NativeDiningHome";
import { journalButton } from "./JournalStackCard";
const responseLabel = (value: unknown, labels: Record<string, string>) =>
  typeof value === "string"
    ? (labels[value] ?? "응답 확인 필요")
    : "응답 확인 필요";
export default function NativeDiscoveryDetail({
  card,
  open,
  entries,
  owner,
  onClose,
  onEdit,
  onSnooze,
}: {
  card: NativeHomeDiscovery | undefined;
  open: boolean;
  entries: NativeRecord[];
  owner: string;
  onClose: () => void;
  onEdit: (id: string) => void;
  onSnooze: (card: NativeHomeDiscovery) => Promise<void>;
}) {
  const [tab, setTab] = useState<"summary" | "records">("summary"),
    [groupLabel, setGroupLabel] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null),
    [pending, setPending] = useState(false);
  useEffect(() => {
    setTab("summary");
    setGroupLabel(null);
    setError(null);
  }, [card?.id, open]);
  const valid = card && nativeDiscoveryIsCurrent(card, entries),
    related = valid
      ? entries.filter((e) => card.entryIDs.includes(e.id.toUpperCase()))
      : [];
  const meals = (ids: string[]) =>
    new Set(
      related
        .filter((e) => ids.includes(e.id.toUpperCase()))
        .map((e) => e.mealID ?? e.id),
    ).size;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/25" />
        <Dialog.Content
          aria-label="발견"
          aria-describedby={undefined}
          className="fixed inset-0 z-[111] flex flex-col bg-[var(--tb-color-bg-page)] text-[var(--tb-color-text-primary)] sm:inset-y-5 sm:left-1/2 sm:right-auto sm:w-[640px] sm:-translate-x-1/2 sm:rounded-[24px]"
        >
          <header className="flex shrink-0 items-center gap-2 px-4 py-2">
            <Dialog.Close
              className="flex size-11 items-center justify-center"
              aria-label="발견 닫기"
            >
              <ArrowLeft size={20} />
            </Dialog.Close>
            <Dialog.Title className="text-[16px] font-semibold">
              발견
            </Dialog.Title>
          </header>
          {valid ? (
            <>
              <div
                className="mx-5 mb-4 grid grid-cols-2 rounded-full bg-[var(--tb-color-surface-muted)] p-1"
                role="group"
                aria-label="발견 상세 보기"
              >
                {(["summary", "records"] as const).map((value) => (
                  <button
                    key={value}
                    className={`${journalButton} ${tab === value ? "bg-white shadow-sm" : ""}`}
                    aria-pressed={tab === value}
                    onClick={() => {
                      setTab(value);
                      setGroupLabel(null);
                    }}
                  >
                    {value === "summary" ? "발견" : "기록"}
                  </button>
                ))}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
                {tab === "summary" ? (
                  <div className="flex flex-col gap-4">
                    <section className="rounded-[20px] bg-white p-4">
                      <p className="text-[11px] text-[var(--tb-color-text-hint)]">
                        {homeDiscoveryLabels[card.kind]}
                      </p>
                      <h2 className="mt-2 whitespace-pre-line text-[18px] font-bold">
                        {card.title}
                      </h2>
                      <p className="mt-3 whitespace-pre-line text-[13px]">
                        {card.detail}
                      </p>
                      <p className="mt-3 text-[11px] text-[var(--tb-color-text-hint)]">
                        {card.scopeLabel}
                      </p>
                    </section>
                    <section className="rounded-[20px] bg-white p-4 text-[13px]">
                      <p>관련 식사 · {meals(card.entryIDs)}회</p>
                      <p className="mt-3">요리 기록 · {related.length}개</p>
                      <p className="mt-3">
                        해당 근거 · 식사 {meals(card.numeratorIDs)}회
                      </p>
                      <p className="mt-3">
                        기준 표본 · 식사 {meals(card.denominatorIDs)}회
                      </p>
                    </section>
                    {card.evidenceSummary && (
                      <section className="rounded-[20px] bg-white p-4 text-[13px] whitespace-pre-line">
                        {card.evidenceSummary}
                      </section>
                    )}
                    {card.evidenceGroups && (
                      <section
                        aria-label="비교 근거 묶음"
                        className="rounded-[20px] bg-white p-4"
                      >
                        <h3 className="text-[14px] font-semibold">
                          비교에 사용한 근거
                        </h3>
                        <ul className="mt-3 flex flex-col gap-3">
                          {card.evidenceGroups.map((group) => (
                            <li key={group.label} className="text-[12px]">
                              <button
                                className="min-h-11 w-full text-left"
                                aria-label={`${group.label} 근거 보기`}
                                onClick={() => {
                                  setGroupLabel(group.label);
                                  setTab("records");
                                }}
                              >
                                <span className="block">{group.label}</span>
                                <span className="mt-1 block text-[var(--tb-color-text-hint)]">
                                  식사 {group.mealIDs.length}번 · 요리{" "}
                                  {group.entryIDs.length}개 · 직접 응답{" "}
                                  {group.observationIDs.length}개
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                    <details className="rounded-[20px] bg-white p-4">
                      <summary className="min-h-11 cursor-pointer py-3 text-[13px]">
                        발견의 근거와 범위
                      </summary>
                      <p className="text-[13px] leading-relaxed">
                        {card.explanation}
                      </p>
                      {card.limitations.map((text) => (
                        <p
                          key={text}
                          className="mt-3 text-[12px] text-[var(--tb-color-text-hint)]"
                        >
                          {text}
                        </p>
                      ))}
                    </details>
                    <button
                      className={journalButton}
                      disabled={pending}
                      onClick={() => {
                        setPending(true);
                        void onSnooze(card)
                          .then(onClose)
                          .catch((e) => setError(e.message))
                          .finally(() => setPending(false));
                      }}
                    >
                      이 발견 7일간 보지 않기
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {groupLabel && (
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <p>{groupLabel}</p>
                        <button
                          className={journalButton}
                          onClick={() => setGroupLabel(null)}
                        >
                          모든 관련 기록 보기
                        </button>
                      </div>
                    )}
                    {related
                      .filter(
                        (entry) =>
                          !groupLabel ||
                          card.evidenceGroups
                            ?.find((g) => g.label === groupLabel)
                            ?.entryIDs.includes(entry.id.toUpperCase()),
                      )
                      .map((entry) => (
                        <section
                          key={entry.id}
                          className="rounded-[20px] bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[11px] text-[var(--tb-color-text-hint)]">
                                {entry.restaurant || "식당 미기록"}
                              </p>
                              <h3 className="mt-1 text-[16px] font-semibold">
                                {entry.menu}
                              </h3>
                            </div>
                            <button
                              className={journalButton}
                              onClick={() => onEdit(entry.id)}
                            >
                              원본 수정
                            </button>
                          </div>
                          <div className="mt-3">
                            <NativeRecordPhoto owner={owner} entry={entry} />
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-[13px]">
                            {entry.note}
                          </p>
                          <p className="mt-2 text-[11px] text-[var(--tb-color-text-hint)]">
                            {entry.mealTime?.source === "user_confirmed" &&
                            swiftDate(entry.mealTime.start)
                              ? new Date(
                                  swiftDate(entry.mealTime.start)!,
                                ).toLocaleDateString("ko-KR")
                              : "식사일 미확인"}
                          </p>
                          {typeof entry.overallEvaluation
                            ?.responseLabelSnapshot === "string" && (
                            <p className="mt-3 text-[13px]">
                              음식 전체 ·{" "}
                              {entry.overallEvaluation.responseLabelSnapshot}
                            </p>
                          )}
                          <ul className="mt-3 flex flex-col gap-2">
                            {effectiveSelections(entry).map((choice, index) => (
                              <li
                                key={`${choice.type}:${choice.id}:${index}`}
                                className="text-[12px]"
                              >
                                <p>{choice.labelSnapshot}</p>
                                <p className="mt-1 text-[var(--tb-color-text-hint)]">
                                  {[
                                    choice.liking
                                      ? `호감 · ${responseLabel(choice.liking, QUESTION_CHOICES.liking)}`
                                      : null,
                                    choice.intensity
                                      ? `강도 · ${responseLabel(choice.intensity, QUESTION_CHOICES.intensity)}`
                                      : null,
                                    choice.preferenceFit
                                      ? `알맞음 · ${responseLabel(choice.preferenceFit, { tooWeak: "조금 부족했어요", justRight: "알맞았어요", tooStrong: "조금 과했어요" })}`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" / ") ||
                                    "선택한 표현 · 추가 평가 미응답"}
                                </p>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-[11px] text-[var(--tb-color-text-hint)]">
                            {card.evidenceGroups
                              ? card.evidenceGroups
                                  .filter((g) =>
                                    g.entryIDs.includes(entry.id.toUpperCase()),
                                  )
                                  .map((g) => g.label)
                                  .join(" · ") || "맥락 기록"
                              : card.numeratorIDs.includes(
                                    entry.id.toUpperCase(),
                                  )
                                ? "해당 근거"
                                : card.denominatorIDs.includes(
                                      entry.id.toUpperCase(),
                                    )
                                  ? "기준 표본"
                                  : "맥락 기록"}
                          </p>
                        </section>
                      ))}
                  </div>
                )}
                {error && (
                  <p role="alert" className="mt-3 text-[13px]">
                    {error}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p role="status" className="p-5 text-[14px]">
              원본이 바뀌어 이 발견을 다시 확인해야 해요. 현재 카드 목록에서
              확인해 주세요.
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
