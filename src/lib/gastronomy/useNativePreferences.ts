import { useMemo } from "react";
import { useNativeJournal } from "./useNativeJournal";
import { readNativePreferences } from "./nativePreferences";
export function useNativePreferences(owner: string, active = true) {
  const journal = useNativeJournal(owner, active);
  const state = useMemo(() => {
    if (!journal.archive) return { data: null, error: null };
    try {
      return {
        data: readNativePreferences(journal.archive.snapshot),
        error: null,
      };
    } catch (e) {
      return {
        data: null,
        error:
          e instanceof Error ? e.message : "선호 응답을 불러오지 못했어요.",
      };
    }
  }, [journal.archive]);
  return {
    ...journal,
    ...state,
    error: state.error ?? journal.error,
    ready: !!journal.archive && !state.error,
  };
}
