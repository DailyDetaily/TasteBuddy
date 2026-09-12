interface NativePhotoStorage {
  list(path: string, options: { limit: number; sortBy: { column: string; order: string } }): PromiseLike<{
    data: Array<{ name: string; id?: string | null }> | null; error: unknown;
  }>;
  remove(paths: string[]): PromiseLike<{ error: unknown }>;
}

export async function deleteNativeAccountPhotos(userId: string, storage: NativePhotoStorage) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(userId)) {
    throw new Error('Invalid native photo owner');
  }
  let previousPage = '';
  for (;;) {
    // Delete the first page, then list again: advancing an offset skips objects.
    const { data, error } = await storage.list(userId, {
      limit: 100, sortBy: { column: 'name', order: 'asc' },
    });
    if (error || !Array.isArray(data)) throw new Error('Could not list native account photos');
    if (data.length === 0) return;
    if (data.some((file) => !file.id || !/^[A-Za-z0-9_-]{1,251}\.jpg$/.test(file.name))) {
      throw new Error('Unexpected native photo path');
    }
    const page = JSON.stringify(data.map((file) => file.name));
    if (page === previousPage) throw new Error('Native photo deletion requires a retry');
    previousPage = page;
    const removed = await storage.remove(data.map((file) => `${userId}/${file.name}`));
    if (removed.error) throw new Error('Could not delete native account photos');
  }
}
