import { NativeRepository } from "./nativeRepository";
import { nativeStorage } from "./nativeStorage";
import { nativeTransport } from "./nativeTransport";
export const nativeRepository = new NativeRepository(
  nativeStorage,
  nativeTransport,
);
const locks = new Map<string, Promise<unknown>>();
export async function withJournalLock<T>(
  owner: string,
  operation: () => Promise<T>,
): Promise<T> {
  if (navigator.locks)
    return await navigator.locks.request(
      `tastebuddy-native:${owner}`,
      operation,
    );
  const prior = locks.get(owner) ?? Promise.resolve();
  const result = prior.catch(() => {}).then(operation);
  locks.set(owner, result);
  return result;
}
