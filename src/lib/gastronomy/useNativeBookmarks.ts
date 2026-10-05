import { useMemo, useRef } from "react";
import { useNativeJournal } from "./useNativeJournal";
import { readNativeBookmarks } from "./nativeBookmarks";
import type { NativeSnapshot } from "./nativeRecord";
export function useNativeBookmarks(owner: string, active = true) {
  const journal = useNativeJournal(owner, active),
    ownerRef = useRef(owner);
  ownerRef.current = owner;
  const result = useMemo(() => {
    if (!journal.archive) return { state: null, error: null };
    try {
      return {
        state: readNativeBookmarks(journal.archive.snapshot),
        error: null,
      };
    } catch (e) {
      return {
        state: null,
        error:
          e instanceof Error ? e.message : "저장 정보를 불러오지 못했어요.",
      };
    }
  }, [journal.archive]);
  return {
    ...journal,
    ...result,
    readError: result.error,
    error: result.error ?? journal.error,
    async change(change: (snapshot: NativeSnapshot) => NativeSnapshot) {
      if (!active || !journal.archive || result.error)
        throw Error(result.error ?? "저장 목록을 먼저 불러와 주세요.");
      return journal.changeSnapshot((snapshot) => {
        if (ownerRef.current !== owner)
          throw Error("계정이 바뀌어 저장을 멈췄어요.");
        return change(snapshot);
      });
    },
  };
}
export type NativeBookmarksController = ReturnType<typeof useNativeBookmarks>;
