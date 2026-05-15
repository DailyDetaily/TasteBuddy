const DB_NAME = 'taste-buddy-local-media';
const DB_VERSION = 1;
const STORE_NAME = 'profile-avatars';
const CURRENT_AVATAR_KEY = 'current';

function openLocalMediaDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB.'));
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
    request.onsuccess = () => resolve(request.result);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    };
  });
}

export async function saveLocalProfileAvatar(file: File) {
  await withAvatarStore('readwrite', (store) => store.put(file, CURRENT_AVATAR_KEY));

  return URL.createObjectURL(file);
}

export async function loadLocalProfileAvatarObjectUrl() {
  const file = await withAvatarStore<Blob | undefined>('readonly', (store) =>
    store.get(CURRENT_AVATAR_KEY),
  );

  return file ? URL.createObjectURL(file) : null;
}

export async function deleteLocalProfileAvatar() {
  await withAvatarStore('readwrite', (store) => store.delete(CURRENT_AVATAR_KEY));
}
