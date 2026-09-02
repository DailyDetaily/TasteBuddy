export interface AccountDeletionDependencies {
  prepare(userId: string): Promise<number>;
  deleteMediaPrefix(prefix: string): Promise<void>;
  purgeMediaCache(userId: string): Promise<void>;
  deleteAuthUser(userId: string): Promise<void>;
}

export async function deleteAccountData(userId: string, dependencies: AccountDeletionDependencies) {
  const activeUploads = await dependencies.prepare(userId);
  if (!Number.isInteger(activeUploads) || activeUploads < 0) {
    throw new Error('Invalid account deletion state');
  }
  if (activeUploads > 0) return { deleted: false, pendingUploads: true } as const;

  // Keep Auth intact until storage succeeds, so partial failures remain retryable.
  await dependencies.deleteMediaPrefix(`user-avatars/${userId}/`);
  await dependencies.deleteMediaPrefix(`feedback-reflections/${userId}/`);
  await dependencies.purgeMediaCache(userId);
  // The database trigger removes email-owned bookmarks atomically with this step.
  await dependencies.deleteAuthUser(userId);
  return { deleted: true, pendingUploads: false } as const;
}
