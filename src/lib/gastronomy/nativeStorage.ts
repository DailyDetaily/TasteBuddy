import type { ArchiveStorage, LocalArchive } from "./nativeRepository";
import type { DiscoveryHistory } from "./nativeJournalPolicy";
const DATABASE = "tastebuddy-native-records-v1";
let connection: Promise<IDBDatabase> | undefined;
function db() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 3);
    request.onupgradeneeded = () => {
      for (const store of [
        "archives",
        "photos",
        "deletedOwners",
        "discoveryHistory",
      ])
        if (!request.result.objectStoreNames.contains(store))
          request.result.createObjectStore(store);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        connection = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      connection = undefined;
      reject(
        new Error(
          "이 브라우저에 기록을 저장하지 못했어요. 저장 공간을 확인해 주세요.",
        ),
      );
    };
    request.onblocked = () => {
      connection = undefined;
      reject(new Error("다른 창의 기록 저장이 끝난 뒤 다시 시도해 주세요."));
    };
  }));
}
async function read<T>(store: string, key: string): Promise<T | null> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, "readonly");
    const request = transaction.objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}
export const nativeStorage: ArchiveStorage = {
  read: (owner) => read<LocalArchive>("archives", owner),
  photo: (owner, filename) =>
    read<Blob>("photos", JSON.stringify([owner, filename])),
  async cachePhoto(owner, photo) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(["photos", "deletedOwners"], "readwrite");
      let error: unknown;
      const marker = transaction.objectStore("deletedOwners").get(owner);
      marker.onsuccess = () => {
        if (marker.result) {
          error = new Error("삭제한 계정의 사진은 다시 저장하지 않아요.");
          transaction.abort();
          return;
        }
        // add refuses same-name replacement even when another tab wins the race.
        try { transaction.objectStore("photos").add(photo.blob, JSON.stringify([owner, photo.filename])); }
        catch (failure) { error = failure; transaction.abort(); }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = transaction.onabort = () => reject(error ?? new Error("사진을 기기에 보관하지 못했어요. 기존 기록은 유지했어요."));
    });
  },
  async update(owner, change, photo, requiredPhotos) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
          ["archives", "photos", "deletedOwners"],
          "readwrite",
        ),
        store = transaction.objectStore("archives");
      let next: LocalArchive;
      let error: unknown;
      const marker = transaction.objectStore("deletedOwners").get(owner);
      marker.onsuccess = () => {
        if (marker.result) {
          error = new Error("삭제한 계정의 기록은 다시 저장하지 않아요.");
          transaction.abort();
          return;
        }
        const request = store.get(owner);
        request.onsuccess = () => {
          try {
            next = change(request.result ?? null);
            if (next.owner !== owner)
              throw new Error("기록 소유자가 변경되었어요.");
            store.put(next, owner);
            // Delete only photos that were referenced before this transaction and are no longer
            // referenced by any current, in-flight, conflicting or recovery snapshot for this owner.
            const references = (archive: LocalArchive | null): Set<string> =>
              new Set(
                archive
                  ? [
                      archive.snapshot,
                      archive.pending?.snapshot,
                      archive.conflict?.snapshot,
                      ...(archive.recoveries ?? []).map((r) => r.snapshot),
                    ].flatMap((s) => s?.photoFilenames ?? [])
                  : [],
              );
            const before = references(request.result ?? null),
              after = references(next);
            for (const filename of before)
              if (!after.has(filename))
                transaction
                  .objectStore("photos")
                  .delete(JSON.stringify([owner, filename]));
            for (const item of photo ? Array.isArray(photo) ? photo : [photo] : []) {
              if (!after.has(item.filename)) continue;
              const photos = transaction.objectStore("photos");
              const key = JSON.stringify([owner, item.filename]);
              const existing = photos.get(key);
              existing.onsuccess = () => {
                // Photos are immutable. A concurrent tab may have inserted this name
                // after the repository checked it; abort the entire source transaction.
                if (existing.result) {
                  error = new Error("같은 이름의 사진이 먼저 저장되었어요. 다시 확인해 주세요.");
                  transaction.abort();
                  return;
                }
                try { photos.add(item.blob, key); }
                catch (failure) { error = failure; transaction.abort(); }
              };
            }
            const supplied = new Set((photo ? Array.isArray(photo) ? photo : [photo] : []).map(p => p.filename));
            for (const filename of requiredPhotos ?? []) {
              if (supplied.has(filename)) continue;
              const original = transaction.objectStore("photos").get(JSON.stringify([owner, filename]));
              original.onsuccess = () => {
                if (!original.result) {
                  error = new Error("복원 중 사진이 변경되어 멈췄어요. 기존 기록은 유지했어요. 다시 시도해 주세요.");
                  transaction.abort();
                }
              };
            }
          } catch (e) {
            error = e;
            transaction.abort();
          }
        };
      };
      transaction.oncomplete = () => resolve(next);
      transaction.onerror = transaction.onabort = () =>
        reject(
          error ??
            new Error("기록을 저장하지 못했어요. 작성한 내용을 유지했어요."),
        );
    });
  },
};

/** Called only after explicit account deletion succeeds; logout keeps account-owned originals. */
export async function deleteNativeLocalAccount(owner: string): Promise<void> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      ["archives", "photos", "deletedOwners", "discoveryHistory"],
      "readwrite",
    );
    transaction.objectStore("archives").delete(owner);
    transaction.objectStore("discoveryHistory").delete(owner);
    transaction.objectStore("deletedOwners").put(true, owner);
    const cursor = transaction.objectStore("photos").openCursor();
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (!row) return;
      try {
        if (JSON.parse(String(row.key))[0] === owner) row.delete();
      } catch {}
      row.continue();
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () =>
      reject(new Error("기기에 보관한 기록을 지우지 못했어요."));
  });
}

export async function readDiscoveryHistory(
  owner: string,
): Promise<DiscoveryHistory | null> {
  const value = await read<DiscoveryHistory>("discoveryHistory", owner);
  if (
    value !== null &&
    (!value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.values(value).some(
        (v) => typeof v !== "number" || !Number.isFinite(v),
      ))
  )
    throw new Error("발견 이력을 읽지 못했어요. 기존 이력은 보존했어요.");
  return value;
}
export async function changeDiscoveryHistory(
  owner: string,
  change: (history: DiscoveryHistory) => DiscoveryHistory,
  validate?: (archive: LocalArchive | null) => boolean,
): Promise<DiscoveryHistory> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(
      ["discoveryHistory", "deletedOwners", "archives"],
      "readwrite",
    );
    let next: DiscoveryHistory, error: unknown;
    const marker = tx.objectStore("deletedOwners").get(owner);
    marker.onsuccess = () => {
      if (marker.result) {
        error = new Error("삭제한 계정의 표시 이력은 다시 저장하지 않아요.");
        tx.abort();
        return;
      }
      const original = tx.objectStore("archives").get(owner);
      original.onsuccess = () => {
        try {
          if (validate && !validate(original.result ?? null))
            throw new Error(
              "연결된 기록이 바뀌었어요. 현재 발견을 다시 확인해 주세요.",
            );
        } catch (e) {
          error = e;
          tx.abort();
          return;
        }
        const store = tx.objectStore("discoveryHistory"),
          request = store.get(owner);
        request.onsuccess = () => {
          try {
            const history = request.result ?? {};
            if (
              !history ||
              typeof history !== "object" ||
              Array.isArray(history) ||
              Object.values(history).some(
                (v) => typeof v !== "number" || !Number.isFinite(v),
              )
            )
              throw new Error(
                "발견 이력을 읽지 못했어요. 기존 이력은 보존했어요.",
              );
            next = change(history);
            store.put(next, owner);
          } catch (e) {
            error = e;
            tx.abort();
          }
        };
      };
    };
    tx.oncomplete = () => resolve(next);
    tx.onabort = tx.onerror = () =>
      reject(
        error ??
          new Error("발견 이력을 저장하지 못했어요. 다시 시도해 주세요."),
      );
  });
}
