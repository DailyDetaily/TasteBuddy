import React, { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft } from "lucide-react";
import SectionCard from "../SectionCard";
import PageSection from "../system/PageSection";
import InterpretationCard from "../system/InterpretationCard";
import { useNativeJournal } from "../../lib/gastronomy/useNativeJournal";
import { useNativeAnalysis } from "../../lib/gastronomy/useNativeAnalysis";
import {
  nativeAnalysisGroups,
  type AnalysisGroup,
} from "../../lib/gastronomy/nativeAnalysisPresentation";
import type {
  NativeAnalysisSnapshot,
  AnalysisObservation,
} from "../../lib/gastronomy/nativeAnalysis";
import type { NativeRecord } from "../../lib/gastronomy/nativeRecord";
import { NativeRecordPhoto } from "../dining-native/NativeDiningHome";
const NativeDiningCapture = React.lazy(
  () => import("../dining-native/NativeDiningCapture"),
);
const button =
  "min-h-11 rounded-full px-4 py-2 text-[13px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
function heroEvidence(snapshot: NativeAnalysisSnapshot) {
  const { main, wing, candidates } = snapshot.mainWing,
    selected = [main, wing].filter(Boolean);
  const ids = new Set(
    (selected.length ? selected : candidates).flatMap((c) => [
      ...c!.supportEvidenceIDs,
      ...c!.counterEvidenceIDs,
    ]),
  );
  return snapshot.observations.filter((o) => ids.has(o.observationId));
}
function heroDescription(snapshot: NativeAnalysisSnapshot) {
  const { status, main, wing } = snapshot.mainWing;
  if (status === "provisional_profile") {
    if (!main)
      return "현재 식사 기록의 호감을 묶은 잠정적인 타입이에요.";
    const supportIDs = new Set([...main.supportEvidenceIDs, ...(wing?.supportEvidenceIDs ?? [])]);
    const topics = [...new Set(snapshot.observations.filter(o => supportIDs.has(o.observationId))
      .map(o => o.kind === "combination_liking" ? "맛의 조합" : o.attributeLabel))].sort();
    const topicText = topics.slice(0, 2).join(", ") + (topics.length > 2 ? " 등" : "");
    const description = topics.length ? `${topicText}에 남긴 호감을 묶은 잠정 타입이에요.` : "현재 식사 기록의 호감을 묶은 잠정적인 타입이에요.";
    return main.counterExperienceCount > 0 || (wing?.counterExperienceCount ?? 0) > 0
      ? `${description} 아쉬웠던 기록도 있어 더 확인하고 있어요.`
      : description;
  }
  return status === "ambiguous_main"
    ? "서로 다른 취향이 함께 나타나고 있어요. 기록을 더 모으며 두드러지는 성향을 살펴보고 있어요."
    : "식사 기록을 모으며 어떤 맛과 식감을 좋아하는지 알아가고 있어요.";
}
function EvidenceRecords({
  observations,
  pending,
  entries,
  owner,
  onEdit,
}: {
  observations: AnalysisObservation[];
  pending: NativeAnalysisSnapshot["unresolved"];
  entries: NativeRecord[];
  owner: string;
  onEdit: (id: string) => void;
}) {
  const ids = new Set([
    ...observations.map((o) => o.experienceId),
    ...pending.map((o) => o.experienceId),
  ]);
  const selected = entries.filter((e) => ids.has(e.id.toLowerCase()));
  return (
    <div className="flex flex-col gap-4">
      {selected.length === 0 ? (
        <SectionCard style={{ display: "block" }}>
          <p className="text-[13px]">연결된 기록이 아직 없어요.</p>
        </SectionCard>
      ) : (
        selected.map((entry) => {
          const rows = observations.filter(
              (o) => o.experienceId === entry.id.toLowerCase(),
            ),
            unresolved = pending.filter(
              (o) => o.experienceId === entry.id.toLowerCase(),
            );
          return (
            <SectionCard key={entry.id} style={{ display: "block" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] text-[var(--tb-color-text-hint)]">
                    {entry.restaurant || "식당 미기록"}
                  </p>
                  <h3 className="mt-1 text-[16px] font-semibold">
                    {entry.menu}
                  </h3>
                </div>
                <button className={button} onClick={() => onEdit(entry.id)}>
                  원본 수정
                </button>
              </div>
              <div className="mt-3">
                <NativeRecordPhoto owner={owner} entry={entry} />
              </div>
              {entry.note && (
                <p className="my-3 whitespace-pre-wrap text-[13px] leading-relaxed">
                  {entry.note}
                </p>
              )}
              <ul className="mt-3 flex flex-col gap-3">
                {rows.map((row) => (
                  <li
                    key={row.observationId}
                    className="border-t border-[var(--tb-color-border-subtle)] pt-3 text-[13px]"
                  >
                    <p>
                      {row.selectionEvidence
                        ? `선택 ‘${row.selectionEvidence.labelSnapshot}’ · 응답 ‘${row.selectionEvidence.labelValue}’`
                        : `“${row.phrase}”`}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--tb-color-text-hint)]">
                      {(
                        {
                          sensory_presence: "느낀 감각",
                          sensory_intensity: "느낀 강도",
                          attribute_liking: "감각에 대한 호감",
                          preference_fit: "알맞은 정도",
                          overall_liking: "음식 전체 평가",
                          sensory_detail: "감각 표현",
                        } as Record<string, string>
                      )[row.kind] ?? "원문에서 확인한 표현"}
                    </p>
                  </li>
                ))}
              </ul>
              {unresolved.map((row) => (
                <div
                  key={row.id}
                  className="mt-3 rounded-xl bg-[var(--tb-color-surface-muted)] p-3 text-[13px]"
                >
                  <p>“{row.phrase}”</p>
                  <p className="mt-1 text-[12px] text-[var(--tb-color-text-hint)]">
                    뜻을 확인 중이에요. 원문은 그대로 보관해요.
                  </p>
                </div>
              ))}
            </SectionCard>
          );
        })
      )}
    </div>
  );
}
export default function NativeAnalysisOverview({
  owner,
  active = true,
}: {
  owner: string;
  active?: boolean;
}) {
  const journal = useNativeJournal(owner, active),
    analysis = useNativeAnalysis(
      journal.entries,
      owner,
      !!journal.archive && journal.canEdit,
    ),
    snapshot = analysis.snapshot;
  const groups = useMemo(
    () => (snapshot ? nativeAnalysisGroups(snapshot) : []),
    [snapshot],
  );
  const [detail, setDetail] = useState<
      "evidence" | "hero" | AnalysisGroup | null
    >(null),
    [section, setSection] = useState<"overview" | "records">("overview"),
    [editID, setEditID] = useState<string | null>(null);
  useEffect(() => {
    setDetail(null);
    setEditID(null);
  }, [owner]);
  useEffect(() => {
    setDetail(null);
  }, [snapshot]);
  const open = (target: typeof detail) => {
    setSection(target === "evidence" ? "records" : "overview");
    setDetail(target);
  };
  const edit = (id: string) => {
    setDetail(null);
    setEditID(id);
  };
  const error =
    analysis.error ??
    (!snapshot ? journal.error : null);
  const waiting = analysis.updating || (!snapshot && journal.loading);
  const rows =
    detail === "hero" && snapshot
      ? heroEvidence(snapshot)
      : typeof detail === "object" && detail
        ? (snapshot?.observations.filter((o) =>
            detail.evidenceIDs.includes(o.observationId),
          ) ?? [])
        : (snapshot?.observations ?? []);
  const title =
    detail === "hero"
      ? "나의 미각 타입"
      : detail === "evidence"
        ? "기록에서 확인한 근거"
        : detail?.kind === "candidate"
          ? "입맛 해석"
          : detail?.kind === "fit"
            ? "알맞았던 조건"
            : "전체와 감각의 평가";
  const group = detail && typeof detail === "object" ? detail : null;
  return (
    <>
      <PageSection title="나의 입맛" contentClassName="flex flex-col gap-3">
        {error ? (
          <SectionCard style={{ display: "block" }}>
            <p className="font-semibold">분석을 불러오지 못했어요</p>
            <p role="alert" className="mt-2 text-[13px]">
              {error}
            </p>
            <button
              className={button}
              onClick={() => {
                journal.retry();
                analysis.retry();
              }}
            >
              다시 시도
            </button>
          </SectionCard>
        ) : waiting ? (
          <SectionCard style={{ display: "block" }}>
            <p role="status" className="py-5 text-center text-[14px]">
              기록을 다시 읽고 있어요
            </p>
          </SectionCard>
        ) : !snapshot ||
          (!snapshot.observations.length &&
            !snapshot.unresolved.length &&
            !snapshot.completed.length) ? (
          <SectionCard style={{ display: "block" }}>
            <p className="font-semibold">아직 해석할 식사 기록이 없어요</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
              아래 가운데 기록 버튼에서 식사 피드백을 완료하면 감각의 세부
              표현과 상황을 함께 모아 보여드려요.
            </p>
          </SectionCard>
        ) : (
          <>
            <SectionCard style={{ display: "block" }}>
              <p className="text-[12px] text-[var(--tb-color-text-hint)]">
                나의 미각 타입
              </p>
              <h2 className="text-[18px] font-semibold tracking-[-0.24px]">
                {snapshot.mainWing.label}
              </h2>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--tb-color-text-secondary)]">
                {heroDescription(snapshot)}
              </p>
            </SectionCard>
            {!!snapshot.unresolved.length && (
              <InterpretationCard
                supportingTextLines={2}
                description="아직 뜻을 확인 중인 표현이 있어요"
                eyebrow="선택 확인"
                supportingText="원문은 보존하고, 의미가 분명해지기 전에는 입맛 사실로 확정하지 않아요."
                detailLabel="표현 보기"
                onExpand={() => open("evidence")}
              />
            )}
          </>
        )}
      </PageSection>
      {snapshot &&
        !waiting &&
        (snapshot.completed.length > 0 ||
          snapshot.observations.length > 0 ||
          snapshot.unresolved.length > 0) && (
          <>
            {(["candidate", "fit", "overall"] as const).map((kind) => {
              const items = groups.filter((g) => g.kind === kind);
              if (!items.length && kind !== "candidate") return null;
              return (
                <PageSection
                  key={kind}
                  title={
                    kind === "candidate"
                      ? "인사이트"
                      : kind === "fit"
                        ? "알맞았던 조건"
                        : "음식 전체와 감각"
                  }
                  contentClassName="flex flex-col gap-3"
                >
                  {items.length ? (
                    items.map((g) => (
                      <InterpretationCard
                        supportingTextLines={2}
                        key={g.id}
                        description={g.title}
                        supportingText={g.body}
                        eyebrow={g.eyebrow}
                        detailLabel="근거 보기"
                        onExpand={() => open(g)}
                      />
                    ))
                  ) : (
                    <SectionCard style={{ display: "block" }}>
                      <p className="text-[14px] font-semibold">
                        다음 단서를 모으고 있어요
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-hint)]">
                        같은 감각의 직접 평가나 다른 상황의 기록이 쌓이면 비교할
                        수 있는 해석을 보여드려요.
                      </p>
                    </SectionCard>
                  )}
                </PageSection>
              );
            })}
          </>
        )}
      <Dialog.Root
        open={!!detail}
        onOpenChange={(v) => {
          if (!v) setDetail(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/25" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[81] flex flex-col bg-[var(--tb-color-bg-page)] text-[var(--tb-color-text-primary)] sm:inset-y-5 sm:left-1/2 sm:right-auto sm:w-[640px] sm:-translate-x-1/2 sm:rounded-[24px]"
          >
            <header className="flex shrink-0 items-center gap-2 px-4 py-2">
              <Dialog.Close
                className="flex size-11 items-center justify-center rounded-full"
                aria-label="분석으로 돌아가기"
              >
                <ArrowLeft size={20} />
              </Dialog.Close>
              <Dialog.Title className="text-[16px] font-semibold">
                {title}
              </Dialog.Title>
            </header>
            {detail !== "evidence" && (
              <div
                className="mx-5 mb-4 grid shrink-0 grid-cols-2 rounded-full bg-[var(--tb-color-surface-muted)] p-1"
                role="group"
                aria-label="상세 보기"
              >
                {(["overview", "records"] as const).map((s) => (
                  <button
                    key={s}
                    className={`${button} ${section === s ? "bg-white shadow-sm" : ""}`}
                    aria-pressed={section === s}
                    onClick={() => setSection(s)}
                  >
                    {s === "overview" ? "비교" : "기록"}
                  </button>
                ))}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10">
              {section === "overview" ? (
                <div className="flex flex-col gap-4">
                  <SectionCard style={{ display: "block" }}>
                    <h2 className="text-[18px] font-semibold">
                      {group?.title ?? snapshot?.mainWing.label}
                    </h2>
                    <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed">
                      {group?.body ??
                        (snapshot ? heroDescription(snapshot) : "")}
                    </p>
                    {group && (
                      <p className="mt-3 text-[11px] text-[var(--tb-color-text-hint)]">
                        식사 {group.mealIDs.length}회
                      </p>
                    )}
                  </SectionCard>
                  {group?.rows.map((row) => (
                    <SectionCard key={row.id} style={{ display: "block" }}>
                      <h3 className="text-[14px] font-semibold">
                        {row.condition}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed">
                        {row.summary}
                      </p>
                      {row.counts.map((count) => (
                        <p
                          key={count}
                          className="mt-2 text-[12px] text-[var(--tb-color-text-muted)]"
                        >
                          {count}
                        </p>
                      ))}
                    </SectionCard>
                  ))}
                  {snapshot?.model.limits.map((limit: string) => (
                    <p
                      key={limit}
                      className="text-[12px] leading-relaxed text-[var(--tb-color-text-hint)]"
                    >
                      {limit}
                    </p>
                  ))}
                </div>
              ) : (
                <EvidenceRecords
                  owner={owner}
                  entries={journal.entries}
                  observations={rows}
                  pending={
                    detail === "evidence" ? (snapshot?.unresolved ?? []) : []
                  }
                  onEdit={edit}
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {editID && (
        <React.Suspense fallback={<p role="status">기록을 준비하고 있어요.</p>}>
          <NativeDiningCapture
            owner={owner}
            request={{ entryID: editID }}
            onClose={() => setEditID(null)}
            onSaved={() => setEditID(null)}
          />
        </React.Suspense>
      )}
    </>
  );
}
