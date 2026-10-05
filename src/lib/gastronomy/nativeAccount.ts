import { decodeNativeAccount } from "./nativeArchive";
import { nativeRepository, withJournalLock } from "./nativeRuntime";
import { canonical } from "./nativeRecord";
import { DINING_RECORDS_CHANGED } from "./events";
import type { Data } from "./engine";
const refreshing = new Set<string>();
export async function loadNativeAccountData(owner: string): Promise<Data> {
  const local = await nativeRepository.read(owner);
  if (local) {
    const data = decodeNativeAccount(local.snapshot);
    if (!refreshing.has(owner)) {
      refreshing.add(owner);
      void withJournalLock(owner, () => nativeRepository.reconnect(owner))
        .then((next) => {
          if (canonical(next.snapshot) !== canonical(local.snapshot))
            window.dispatchEvent(
              new CustomEvent(DINING_RECORDS_CHANGED, { detail: { owner } }),
            );
        })
        .catch(() => {})
        .finally(() => refreshing.delete(owner));
    }
    return data;
  }
  const archive = await withJournalLock(owner, () =>
    nativeRepository.refresh(owner),
  );
  return decodeNativeAccount(archive.snapshot);
}
