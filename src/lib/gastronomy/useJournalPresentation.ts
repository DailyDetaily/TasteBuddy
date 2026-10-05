import { useCallback, useEffect, useMemo, useState } from "react";
import { useNativeJournal } from "./useNativeJournal";
import { type NativeAnalysisSnapshot } from "./nativeAnalysis";
import { applyNativeQuestion, nativeQuestionChoices } from "./nativeQuestions";
import {
  canonical,
  DINING_KEY,
  readNativeRecords,
  type NativeRecord,
} from "./nativeRecord";
import {
  NATIVE_MODEL_OWNER,
  QUESTION_PROGRESS_KEY,
  migrateQuestionHistory,
  readQuestionHistory,
  shouldPresentQuestion,
  updateQuestionHistory,
  updateDiscoveryHistory,
  type QuestionHistory,
  type DiscoveryHistory,
  type DiscoveryIdentity,
} from "./nativeJournalPolicy";
import { changeDiscoveryHistory, readDiscoveryHistory } from "./nativeStorage";
export function usePresentationClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 60000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return now;
}
export function useQuestionPresentation(
  journal: ReturnType<typeof useNativeJournal>,
  snapshot: NativeAnalysisSnapshot | undefined,
  owner: string,
  now: Date,
) {
  const [failure, setFailure] = useState<string | null>(null),
    [undo, setUndo] = useState<{
      owner: string;
      before: NativeRecord;
      after: NativeRecord;
      question: any;
    } | null>(null);
  const encoded = journal.archive?.snapshot.values[QUESTION_PROGRESS_KEY],
    dining = journal.archive?.snapshot.values[DINING_KEY];
  useEffect(() => {
    setFailure(null);
    setUndo(null);
  }, [owner]);
  const migration = useMemo(() => {
    try {
      if (!snapshot || !journal.archive)
        return { snapshot: null, history: {} as QuestionHistory };
      const next = migrateQuestionHistory(
        journal.archive.snapshot,
        snapshot.model.queuedSelections ?? [],
        snapshot.observations,
        journal.entries,
        now,
      );
      return {
        snapshot: next,
        history: readQuestionHistory(next),
        error: null,
      };
    } catch (e) {
      return {
        snapshot: null,
        history: {} as QuestionHistory,
        error: e instanceof Error ? e.message : "질문 이력을 읽지 못했어요.",
      };
    }
  }, [snapshot, owner, encoded, dining]);
  useEffect(() => {
    if (
      !migration.snapshot ||
      migration.snapshot.values[QUESTION_PROGRESS_KEY] === encoded
    )
      return;
    let cancelled = false;
    void journal
      .changeSnapshot((current) => {
        if (current.values[DINING_KEY] !== dining)
          throw new Error("질문과 연결된 기록이 바뀌었어요.");
        return migrateQuestionHistory(
          current,
          snapshot!.model.queuedSelections ?? [],
          snapshot!.observations,
          journal.entries,
          new Date(),
        );
      })
      .then(() => {
        if (!cancelled) setFailure(null);
      })
      .catch((e) => {
        if (!cancelled) setFailure(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [migration.snapshot, encoded, dining, journal.changeSnapshot]);
  const answerable = useMemo(() => {
    const sources = new Map(
      snapshot?.observations.map((o) => [o.observationId, o]) ?? [],
    );
    const entries = new Map(
      journal.entries.map((e) => [e.id.toLowerCase(), e]),
    );
    return (snapshot?.model.queuedSelections ?? []).flatMap((question: any) => {
      if (question.intent !== "clarification") return [];
      const source = sources.get(question.responseSourceID),
        entry = source ? entries.get(source.experienceId) : undefined;
      const choices = nativeQuestionChoices(entry, source, question.facet);
      return entry && source && choices.length
        ? [{ question, source, entry, choices }]
        : [];
    });
  }, [snapshot, dining]);
  const candidates = answerable.filter((item: any) =>
    shouldPresentQuestion(
      migration.history[NATIVE_MODEL_OWNER]?.[item.question.id],
      now,
    ),
  );
  async function expose(question: any) {
    if (migration.error) throw new Error(migration.error);
    const item = candidates.find((c: any) => c.question.id === question.id);
    if (!item) throw new Error("현재 질문을 다시 확인해 주세요.");
    await journal.changeSnapshot((current) => {
      const original = readNativeRecords(current).find(
        (e) => e.id === item.entry.id,
      );
      if (!original || canonical(original) !== canonical(item.entry))
        throw new Error("질문과 연결된 기록이 바뀌었어요.");
      return updateQuestionHistory(current, question, "exposed");
    });
  }
  async function status(
    question: any,
    value: "deferred" | "cannotRecall" | "dismissed",
  ) {
    if (migration.error) throw new Error(migration.error);
    const candidate = candidates.find(
      (c: any) => c.question.id === question.id,
    );
    if (!candidate)
      throw new Error("지금 답할 수 있는 질문을 다시 확인해 주세요.");
    await journal.changeSnapshot((current) => {
      const entry = readNativeRecords(current).find(
        (e) => e.id === candidate.entry.id,
      );
      if (!entry || canonical(entry) !== canonical(candidate.entry))
        throw new Error("질문과 연결된 기록이 바뀌었어요.");
      return updateQuestionHistory(current, question, value);
    });
  }
  async function answer(item: (typeof candidates)[number], answerID: string) {
    if (migration.error) throw new Error(migration.error);
    const next = applyNativeQuestion(
      item.entry,
      item.source,
      item.question.facet,
      answerID,
    );
    if (!next)
      throw new Error("기록이 바뀌었어요. 기록을 확인한 뒤 다시 답해 주세요.");
    const saved = await journal.commit(next, item.entry, undefined, (current) =>
      updateQuestionHistory(current, item.question, "resolved"),
    );
    setUndo({
      owner,
      before: item.entry,
      after: readNativeRecords(saved.snapshot).find(
        (e) => e.id === item.entry.id,
      )!,
      question: item.question,
    });
  }
  async function undoAnswer() {
    if (!undo || undo.owner !== owner) return;
    await journal.commit(undo.before, undo.after, undefined, (current) =>
      updateQuestionHistory(current, undo.question, "active"),
    );
    setUndo(null);
  }
  return {
    candidates: migration.error ? [] : candidates,
    error: migration.error ?? failure,
    expose,
    status,
    answer,
    undoAnswer,
    canUndo: undo?.owner === owner,
    clearUndo: () => setUndo(null),
  };
}
const DISCOVERY_EVENT = "tastebuddy:discovery-presentation-changed";
export function useDiscoveryPresentation(owner: string) {
  const [value, setValue] = useState<{
      owner: string;
      history: DiscoveryHistory;
    } | null>(null),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setError(null);
    const update = () => {
      void readDiscoveryHistory(owner)
        .then((history) => {
          if (active) setValue({ owner, history: history ?? {} });
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    };
    const listener = (e: Event) => {
      if ((e as CustomEvent).detail?.owner === owner) update();
    };
    const channel =
      typeof BroadcastChannel === "function"
        ? new BroadcastChannel(DISCOVERY_EVENT)
        : null;
    if (channel)
      channel.onmessage = (e) => {
        if (e.data?.owner === owner) update();
      };
    window.addEventListener(DISCOVERY_EVENT, listener);
    update();
    return () => {
      active = false;
      channel?.close();
      window.removeEventListener(DISCOVERY_EVENT, listener);
    };
  }, [owner]);
  const update = useCallback(
    async (
      card: DiscoveryIdentity & { fingerprints?: Record<string, string> },
      action: "read" | "snooze",
    ) => {
      try {
        const history = await changeDiscoveryHistory(
          owner,
          (current) => updateDiscoveryHistory(current, card, action),
          (archive) => {
            if (!card.fingerprints) return true;
            if (!archive) return false;
            const originals = new Map(
              readNativeRecords(archive.snapshot).map((e) => [
                e.id.toUpperCase(),
                canonical(e),
              ]),
            );
            return Object.entries(card.fingerprints).every(
              ([id, fingerprint]) => originals.get(id) === fingerprint,
            );
          },
        );
        setValue({ owner, history });
        setError(null);
        window.dispatchEvent(
          new CustomEvent(DISCOVERY_EVENT, { detail: { owner } }),
        );
        if (typeof BroadcastChannel === "function") {
          const c = new BroadcastChannel(DISCOVERY_EVENT);
          c.postMessage({ owner });
          c.close();
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "발견 이력을 저장하지 못했어요.";
        setError(message);
        throw new Error(message);
      }
    },
    [owner],
  );
  return {
    history: value?.owner === owner ? value.history : {},
    ready: value?.owner === owner,
    error,
    update,
  };
}
