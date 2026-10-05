import { useMemo, useRef } from "react";
import { useNativeJournal } from "./useNativeJournal";
import {
  PROFILE_AVATAR_KEY,
  PROFILE_IDENTITY_KEY,
  readNativeProfileIdentity,
  updateNativeProfileIdentity,
  type ProfileIdentityEdit,
} from "./nativeProfileIdentity";
export function useNativeProfileIdentity(owner: string, active: boolean) {
  const journal = useNativeJournal(owner, active),
    currentOwner = useRef(owner);
  currentOwner.current = owner;
  const raw = journal.archive?.snapshot.values;
  const state = useMemo(() => {
    if (!raw) return { data: null, error: null };
    try {
      return {
        data: readNativeProfileIdentity(journal.archive!.snapshot),
        error: null,
      };
    } catch (e) {
      return {
        data: null,
        error: e instanceof Error ? e.message : "프로필을 읽지 못했어요.",
      };
    }
  }, [owner, !!raw, raw?.[PROFILE_IDENTITY_KEY], raw?.[PROFILE_AVATAR_KEY]]);
  return {
    ...state,
    ready: active && !!journal.archive && !state.error,
    loading: journal.loading,
    backupError: journal.error,
    dirty: journal.archive?.dirty,
    remoteEnabled: journal.archive?.remoteEnabled,
    retry: journal.retry,
    sync: journal.sync,
    async save(
      edit: ProfileIdentityEdit,
      expected: string,
      avatar?: string | null,
    ) {
      if (!active || !journal.archive || state.error)
        throw Error(state.error ?? "프로필을 불러온 뒤 다시 시도해 주세요.");
      const next = await journal.changeSnapshot((s) => {
        if (currentOwner.current !== owner)
          throw Error("계정이 바뀌어 저장을 멈췄어요.");
        return updateNativeProfileIdentity(s, edit, expected, avatar);
      });
      return readNativeProfileIdentity(next.snapshot);
    },
  };
}
