/** One visit keeps the same identity before and after it reaches Supabase. */
export function buildRestaurantFeedbackExternalRef(restaurantId: string, submissionId: number) {
  return `restaurant-feedback-${restaurantId}-${submissionId}`;
}

export function parseRestaurantFeedbackSubmissionId(externalRef: string | null | undefined) {
  const match = externalRef?.match(/^restaurant-feedback-.+-(\d{13,16})$/);
  const submissionId = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(submissionId) && submissionId > 0 ? submissionId : null;
}

export interface FeedbackSyncMetadata {
  submissionId: number;
  ownerUserId?: string | null;
  syncedAt?: string | null;
  remoteId?: string | null;
}

export function canSyncFeedbackSubmission(submission: FeedbackSyncMetadata, userId: string) {
  return !submission.syncedAt && (!submission.ownerUserId || submission.ownerUserId === userId);
}

export function mergeHydratedFeedbackById<T>(
  local: Record<number, T>,
  remote: Record<number, T>,
  protectedIds: ReadonlySet<number>,
) {
  const merged = { ...local, ...remote };
  for (const id of protectedIds) {
    if (id in local) merged[id] = local[id];
  }
  return merged;
}

// Serialize create/edit/delete for one visit in this tab. Failures must not block retries.
const feedbackMutations = new Map<string, Promise<unknown>>();

export function serializeFeedbackMutation<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = feedbackMutations.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => {
    // Web Locks extend ordering to other tabs; database-derived learning remains
    // idempotent for clients without this API and for other devices.
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request(`tastebuddy-feedback:${key}`, operation);
    }
    return operation();
  });
  feedbackMutations.set(key, next);
  void next.finally(() => {
    if (feedbackMutations.get(key) === next) feedbackMutations.delete(key);
  }).catch(() => undefined);
  return next;
}
