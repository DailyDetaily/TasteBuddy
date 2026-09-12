import assert from 'node:assert/strict';
import { createDiningFeedbackDraft, type DiningFeedbackScenario } from '../src/constants/diningFeedbackData';
import { clearDiningFeedbackItemInSupabase, submitDiningFeedbackToSupabase } from '../src/lib/tasteBuddySupabase';

const owner = 'aaaaaaaa-1111-4111-8111-111111111111';
const calls: Array<{ name: string; args: any }> = [];
let previous: any = null;
let rpcError: any = null;
let readError: any = null;
let cacheThrows = false;
(globalThis as any).__tasteSurveyTransport = {
  session: { user: { id: owner, is_anonymous: false } },
  from(table: string) {
    // Source-table writes have no mock implementation: any legacy fallback fails this test.
    if (table === 'tba_feedback_evidence_events' && cacheThrows) throw new Error('cache unavailable');
    const query: any = {
      select() { return query; }, eq() { return query; }, order() { return query; }, limit() { return query; },
      maybeSingle: async () => ({ data: previous, error: readError }),
      then(resolve: (value: unknown) => void) { resolve({ data: [], error: null }); },
    };
    return query;
  },
  async rpc(name: string, args: any) {
    calls.push({ name, args });
    return { data: rpcError ? null : { persisted: true }, error: rpcError };
  },
};
const scenario: DiningFeedbackScenario = {
  completedAt: '2026-09-08T00:00:00Z', courseName: '코스', postDiningPrompt: '', reservationId: 1,
  restaurant: '식당', dishes: [{ id: 'dish', title: '메뉴', subtitle: '', chefIntent: '', courseLabel: '메인',
    ingredients: [], techniques: [], flavorNotes: [], feedbackChoices: [] }],
};
const draft = createDiningFeedbackDraft(scenario);
draft.dishResponses.dish.reflectionNote = '단맛이 강하지 않았어요';
const reservation = { id: 1, remoteId: 'bbbbbbbb-1111-4111-8111-111111111111', restaurant: '식당',
  chef: '', date: '2026-09-08', time: '12:00', guests: 1, course: '코스', status: 'completed' as const };
const input = { draft, reservation, scenario, createOnly: true, expectedUserId: owner };

await assert.rejects(submitDiningFeedbackToSupabase({ ...input, expectedUserId: 'other' }), /account changed/);
assert.equal(calls.length, 0);
readError = new Error('previous state unavailable');
await assert.rejects(submitDiningFeedbackToSupabase(input), /previous state unavailable/);
assert.equal(calls.length, 0, 'a failed source read cannot turn an edit into a new evidence event');
readError = null;
rpcError = new Error('RPC not deployed');
await assert.rejects(submitDiningFeedbackToSupabase(input), /RPC not deployed/);
assert.equal(calls.length, 1, 'an unavailable RPC must never fall back to partial source writes');
rpcError = null;
cacheThrows = true;
assert.equal((await submitDiningFeedbackToSupabase(input)).persisted, true,
  'a failed derived-cache refresh cannot turn a committed save into a failed submission');
const saved = calls.at(-1)!;
assert.equal(saved.name, 'save_dining_feedback_atomic');
assert.equal(saved.args.p_create_only, true);
assert.equal(saved.args.p_expected_user_id, owner);
assert.equal(saved.args.p_items[0].feedback.reflection_note, draft.dishResponses.dish.reflectionNote);
assert.ok(saved.args.p_items[0].parse);
assert.equal(saved.args.p_items[0].evidence.event_type, 'created');

previous = { id: 'submission', updated_at: '2026-09-08T00:00:01Z', feedback_items: [{
  id: 'item', updated_at: '2026-09-08T00:00:01Z', reservation_dishes: { sort_order: 0 },
  ...saved.args.p_items[0].feedback,
}] };
assert.equal((await submitDiningFeedbackToSupabase({ ...input,
  draft: createDiningFeedbackDraft(scenario), createOnly: false,
})).persisted, true);
assert.equal(calls.at(-1)!.args.p_items[0].evidence.event_type, 'deleted',
  'saving an emptied response must remove old evidence through the same transaction');
assert.equal((await clearDiningFeedbackItemInSupabase({ ...input, dish: scenario.dishes[0] })).persisted, true);
const cleared = calls.at(-1)!.args;
assert.equal(cleared.p_clear, true);
assert.equal(cleared.p_expected_updated_at, previous.updated_at);
assert.equal(cleared.p_items[0].expected_updated_at, previous.feedback_items[0].updated_at);
assert.equal(cleared.p_items[0].evidence.event_type, 'deleted');
assert.equal(cleared.p_items[0].parse.confidence, 0);
assert.deepEqual(cleared.p_items[0].feedback.selected_tag_ids, []);
assert.equal(cleared.p_items[0].feedback.reflection_note, null);
console.log('Atomic feedback client RPC, raw evidence, failed-read, unavailable-RPC, clear and cache-failure tests passed.');
