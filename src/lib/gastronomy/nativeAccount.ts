import { decodeNativeAccount } from './nativeArchive';
import { nativeRepository, withJournalLock } from './nativeRuntime';
import type { Data } from './engine';

export interface NativeAccountData extends Data {
  freshness: 'synced' | 'local' | 'cached';
  syncError?: string;
}

/** Keep a readable local archive on connection failure, but never call it fresh server data. */
export async function loadNativeAccountData(owner: string): Promise<NativeAccountData> {
  const local = await nativeRepository.read(owner);
  try {
    const archive = await withJournalLock(owner, () => nativeRepository.reconnect(owner));
    return {
      ...decodeNativeAccount(archive.snapshot),
      freshness: archive.remoteEnabled ? 'synced' : 'local',
      ...(archive.lastError ? { syncError: archive.lastError } : {}),
    };
  } catch (error) {
    if (!local) throw error;
    return {
      ...decodeNativeAccount(local.snapshot), freshness: 'cached',
      syncError: error instanceof Error ? error.message : '계정 기록을 동기화하지 못했어요. 이 기기의 보관본을 유지했어요.',
    };
  }
}
