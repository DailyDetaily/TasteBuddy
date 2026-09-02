const DB_NAME = 'taste-buddy-local-media';
const DB_VERSION = 1;
const STORE_NAME = 'profile-avatars';
const LEGACY_AVATAR_KEY = 'current';
const avatarKey = (ownerId: string) => `owner:${ownerId}`;

function openLocalMediaDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
    request.onblocked = () => reject(new Error('IndexedDB is blocked by another page.'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function withAvatarStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const database = await openLocalMediaDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    // A successful request can still be rolled back if its transaction aborts.
    transaction.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    };
  });
}

export async function saveLocalProfileAvatar(file: File, ownerId: string) {
  await withAvatarStore('readwrite', (store) => store.put(file, avatarKey(ownerId)));

  return URL.createObjectURL(file);
}

export async function loadLocalProfileAvatarObjectUrl(ownerId: string) {
  const file = await withAvatarStore<Blob | undefined>('readonly', (store) =>
    store.get(avatarKey(ownerId)),
  );

  return file ? URL.createObjectURL(file) : null;
}

export async function deleteLocalProfileAvatar(ownerId: string) {
  if (typeof indexedDB === 'undefined') return;
  await withAvatarStore('readwrite', (store) => store.delete(avatarKey(ownerId)));
  // Legacy unscoped avatars are deliberately never read for a new account.
  await withAvatarStore('readwrite', (store) => store.delete(LEGACY_AVATAR_KEY));
}

export async function clearLocalAccountCaches(
  ownerId: string,
  clearAppState: () => void,
  clearDesignState: () => void,
) {
  // A failed/blocked storage backend must not prevent the other account caches
  // from being cleared or leave a signed-out account visible in the current UI.
  return Promise.allSettled([
    deleteLocalProfileAvatar(ownerId),
    Promise.resolve().then(clearAppState),
    Promise.resolve().then(clearDesignState),
  ]);
}
