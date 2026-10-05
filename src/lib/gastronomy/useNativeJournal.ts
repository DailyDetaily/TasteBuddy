import { useCallback, useEffect, useRef, useState } from "react";
import { readValidatedNativeRecords, type LocalArchive } from "./nativeRepository";
import { nativeRepository, withJournalLock } from "./nativeRuntime";
import {
  type NativeRecord,
  type NativeSnapshot,
} from "./nativeRecord";
import { DINING_RECORDS_CHANGED } from "./events";
const notify = (owner: string) =>
  {
    window.dispatchEvent(
    new CustomEvent(DINING_RECORDS_CHANGED, { detail: { owner } }),
    );
    if (typeof BroadcastChannel === "function") {
      const channel = new BroadcastChannel(DINING_RECORDS_CHANGED);
      channel.postMessage({ owner });
      channel.close();
    }
  };
export function useNativeJournal(owner: string, active = true) {
  const scope = useRef({ owner, version: 0, mounted: true });
  if (scope.current.owner !== owner) {
    scope.current.owner = owner;
    scope.current.version++;
  }
  useEffect(() => {
    scope.current.mounted = true;
    return () => { scope.current.mounted = false; scope.current.version++; };
  }, []);
  const guard = () => {
    const version = scope.current.version;
    return () => scope.current.mounted && scope.current.owner === owner && scope.current.version === version;
  };
  const [value, setValue] = useState<LocalArchive | null>(null),
    [error, setError] = useState<string | null>(null),
    [loading, setLoading] = useState(false);
  const archive = value?.owner === owner ? value : null;
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const changed = (e: Event) => {
      const target = (e as CustomEvent).detail?.owner;
      if (!target || target === owner) setRevision((r) => r + 1);
    };
    window.addEventListener(DINING_RECORDS_CHANGED, changed);
    const connected = () => setRevision(r => r + 1);
    window.addEventListener("online", connected);
    const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(DINING_RECORDS_CHANGED) : null;
    if (channel) channel.onmessage = e => { if (e.data?.owner === owner) connected(); };
    return () => {
      window.removeEventListener(DINING_RECORDS_CHANGED, changed);
      window.removeEventListener("online", connected);
      channel?.close();
    };
  }, [owner]);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const cached = await nativeRepository.read(owner);
      if (cached && !cancelled) setValue(cached);
      return withJournalLock(owner, () => nativeRepository.reconnect(owner));
    })()
      .then((next) => {
        if (!cancelled) setValue(next);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "기록을 불러오지 못했어요.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [owner, active, revision]);
  const commit = useCallback(
    async (
      entry: NativeRecord,
      expected: NativeRecord | null,
      photo?: { filename: string; blob: Blob },
      updateMetadata?: (snapshot: NativeSnapshot) => NativeSnapshot,
    ) => {
      const current = guard();
      if (!current()) throw new Error("계정이 바뀌어 저장을 멈췄어요.");
      // IndexedDB serializes the local transaction; a network backup must not block it.
      const next = await nativeRepository.commit(
        owner,
        entry,
        expected,
        photo,
        updateMetadata,
      );
      if (current()) setValue(next);
      notify(owner);
      // Local durability is the completion boundary. Backup continues after the editor closes.
      void withJournalLock(owner, () => nativeRepository.sync(owner))
        .then(() => notify(owner))
        .catch(() => notify(owner));
      return next;
    },
    [owner],
  );
  const changeSnapshot = useCallback(
    async (change: (snapshot: NativeSnapshot) => NativeSnapshot) => {
      const current = guard();
      if (!current()) throw new Error("계정이 바뀌어 저장을 멈췄어요.");
      const next = await nativeRepository.changeSnapshot(owner, change);
      if (current()) setValue(next);
      notify(owner);
      void withJournalLock(owner, () => nativeRepository.sync(owner))
        .then(() => notify(owner))
        .catch(() => notify(owner));
      return next;
    },
    [owner],
  );
  const sync = useCallback(async () => {
    const current = guard();
    if (!current()) return;
    setLoading(true);
    try {
      const next = await withJournalLock(owner, () =>
        nativeRepository.reconnect(owner),
      );
      if (current()) { setValue(next); setError(null); }
      notify(owner);
    } catch (e) {
      if (current()) setError(e instanceof Error ? e.message : "백업을 완료하지 못했어요.");
      const next = await nativeRepository.read(owner);
      if (next && current()) setValue(next);
    } finally {
      if (current()) setLoading(false);
    }
  }, [owner]);
  const useAccount = useCallback(async () => {
    const current = guard();
    if (!current()) return;
    try {
      const next = await withJournalLock(owner, () =>
        nativeRepository.useAccountCopy(owner),
      );
      if (current()) { setValue(next); setError(null); }
      notify(owner);
    } catch (e) {
      if (current()) setError(
        e instanceof Error ? e.message : "계정 기록을 불러오지 못했어요.",
      );
    }
  }, [owner]);
  let entries: NativeRecord[] = [];
  let parseError: string | null = null;
  try {
    if (archive) entries = readValidatedNativeRecords(archive.snapshot);
  } catch (e) {
    parseError = e instanceof Error ? e.message : "원본을 읽지 못했어요.";
  }
  return {
    archive,
    entries,
    loading,
    error: error ?? parseError ?? archive?.lastError ?? null,
    canEdit: !!archive && !parseError,
    commit,
    changeSnapshot,
    sync,
    useAccount,
    retry: () => setRevision((r) => r + 1),
  };
}
