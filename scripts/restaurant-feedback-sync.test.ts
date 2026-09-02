import assert from 'node:assert/strict';
import {
  buildRestaurantFeedbackExternalRef,
  canSyncFeedbackSubmission,
  mergeHydratedFeedbackById,
  parseRestaurantFeedbackSubmissionId,
  serializeFeedbackMutation,
} from '../src/lib/restaurantFeedbackSync';
import {
  clearLocalAccountCaches,
  deleteLocalProfileAvatar,
  loadLocalProfileAvatarObjectUrl,
  saveLocalProfileAvatar,
} from '../src/lib/localProfileAvatar';

const firstVisit = 1788400000000;
const secondVisit = firstVisit + 1000;
const firstRef = buildRestaurantFeedbackExternalRef('seoul-7th-door', firstVisit);
const secondRef = buildRestaurantFeedbackExternalRef('seoul-7th-door', secondVisit);
assert.notEqual(firstRef, secondRef, 'two visits to the same restaurant must not overwrite each other');
assert.equal(parseRestaurantFeedbackSubmissionId(firstRef), firstVisit);
assert.equal(parseRestaurantFeedbackSubmissionId(secondRef), secondVisit);
assert.equal(parseRestaurantFeedbackSubmissionId('restaurant-feedback-seoul-7th-door'), null);
assert.equal(parseRestaurantFeedbackSubmissionId('content-seed:user:restaurant:completed'), null);

// Hydration replaces the optimistic copy using the same visit key. In-progress edits survive.
const hydrated = mergeHydratedFeedbackById(
  { [firstVisit]: 'old local review', [secondVisit]: 'unsaved edit' },
  { [parseRestaurantFeedbackSubmissionId(firstRef)!]: 'latest saved review', [secondVisit]: 'remote' },
  new Set([secondVisit]),
);
assert.equal(Object.keys(hydrated).length, 2);
assert.equal(hydrated[firstVisit], 'latest saved review');
assert.equal(hydrated[secondVisit], 'unsaved edit');

assert.equal(canSyncFeedbackSubmission({ submissionId: firstVisit }, 'A'), true);
assert.equal(canSyncFeedbackSubmission({ submissionId: firstVisit, ownerUserId: 'A' }, 'A'), true);
assert.equal(canSyncFeedbackSubmission({ submissionId: firstVisit, ownerUserId: 'A' }, 'B'), false);
const acknowledged = JSON.parse(JSON.stringify({ submissionId: firstVisit, ownerUserId: 'A', syncedAt: new Date().toISOString() }));
assert.equal(canSyncFeedbackSubmission(acknowledged, 'A'), false, 'a reload must not replay acknowledged feedback');
assert.equal(canSyncFeedbackSubmission(acknowledged, 'B'), false);

const sequence: string[] = [];
let releaseSave!: () => void;
const saving = serializeFeedbackMutation(`A:${firstRef}`, async () => {
  sequence.push('save start');
  await new Promise<void>((resolve) => { releaseSave = resolve; });
  sequence.push('save complete');
});
await Promise.resolve();
await Promise.resolve();
const deleting = serializeFeedbackMutation(`A:${firstRef}`, async () => { sequence.push('delete'); });
const independent = serializeFeedbackMutation(`A:${secondRef}`, async () => { sequence.push('other visit'); });
await independent;
assert.deepEqual(sequence, ['save start', 'other visit']);
releaseSave();
await Promise.all([saving, deleting]);
assert.deepEqual(sequence, ['save start', 'other visit', 'save complete', 'delete']);
await assert.rejects(serializeFeedbackMutation(firstRef, async () => { throw new Error('offline'); }));
assert.equal(await serializeFeedbackMutation(firstRef, async () => 'retried'), 'retried');

// Exercise public avatar APIs with controllable request-success/transaction-abort
// timing. Resolving a request before the transaction commits would fail this test.
const blobs = new Map<string, Blob>();
let abortNextTransaction = false;
let failNextOpen = false;
const database = {
  close() {},
  objectStoreNames: { contains: () => true },
  transaction() {
    const transaction: any = {};
    transaction.objectStore = () => {
      function requestFor(operation: 'get' | 'put' | 'delete', key: string, value?: Blob) {
        const request: any = { result: operation === 'get' ? blobs.get(key) : undefined };
        queueMicrotask(() => {
          request.onsuccess?.();
          queueMicrotask(() => {
            if (abortNextTransaction) {
              abortNextTransaction = false;
              transaction.error = new Error('transaction aborted');
              transaction.onabort?.();
              return;
            }
            if (operation === 'put') blobs.set(key, value!);
            if (operation === 'delete') blobs.delete(key);
            transaction.oncomplete?.();
          });
        });
        return request;
      }
      return {
        get: (key: string) => requestFor('get', key),
        put: (value: Blob, key: string) => requestFor('put', key, value),
        delete: (key: string) => requestFor('delete', key),
      };
    };
    return transaction;
  },
};
const previousIndexedDb = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {
  open() {
    const request: any = { result: database };
    queueMicrotask(() => {
      if (failNextOpen) {
        failNextOpen = false;
        request.error = new Error('IndexedDB unavailable');
        request.onerror?.();
      } else request.onsuccess?.();
    });
    return request;
  },
} });
try {
  blobs.set('current', new Blob(['legacy avatar']));
  const avatar = new File(['avatar A'], 'avatar.png', { type: 'image/png' });
  const savedUrl = await saveLocalProfileAvatar(avatar, 'A');
  URL.revokeObjectURL(savedUrl);
  assert.equal(await loadLocalProfileAvatarObjectUrl('B'), null);
  assert.equal(await loadLocalProfileAvatarObjectUrl('guest'), null, 'legacy unscoped avatars must never cross accounts');
  abortNextTransaction = true;
  await assert.rejects(deleteLocalProfileAvatar('A'), /aborted/);
  assert.ok(blobs.has('owner:A'), 'an aborted transaction must not be reported as a successful deletion');

  failNextOpen = true;
  let didClearApp = false;
  let didClearDesign = false;
  const cleanup = await clearLocalAccountCaches('A', () => {
    didClearApp = true;
    throw new Error('localStorage unavailable');
  }, () => { didClearDesign = true; });
  assert.equal(didClearApp, true);
  assert.equal(didClearDesign, true);
  assert.deepEqual(cleanup.map((result) => result.status), ['rejected', 'rejected', 'fulfilled']);
  assert.equal(await loadLocalProfileAvatarObjectUrl('B'), null, 'failed cleanup must not expose A to the next account');
  assert.equal(await loadLocalProfileAvatarObjectUrl('guest'), null);
  await deleteLocalProfileAvatar('A');
  assert.equal(await loadLocalProfileAvatarObjectUrl('A'), null);
  assert.equal(blobs.has('current'), false);
} finally {
  if (previousIndexedDb) Object.defineProperty(globalThis, 'indexedDB', previousIndexedDb);
  else Reflect.deleteProperty(globalThis, 'indexedDB');
}

console.log('Restaurant feedback identity, hydration, account scope, retry, ordering and avatar cleanup tests passed.');
