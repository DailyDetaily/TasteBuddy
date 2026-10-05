import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-hydration-owner-'));
await build({
  stdin: {
    contents: "export { hydrateReservationPageData } from './src/lib/tasteBuddySupabase.ts';",
    resolveDir: process.cwd(),
  },
  outfile: path.join(temporary, 'hydration.mjs'),
  bundle: true, platform: 'node', format: 'esm', logLevel: 'silent',
  define: { 'import.meta.env': '{}' },
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.jpeg': 'dataurl', '.svg': 'text' },
  plugins: [{ name: 'owner-hydration-transport', setup(builder) {
    builder.onResolve({ filter: /^\.\/supabase$/ }, args => args.importer.endsWith('/tasteBuddySupabase.ts')
      ? { path: 'transport', namespace: 'owner-hydration' } : undefined);
    builder.onLoad({ filter: /.*/, namespace: 'owner-hydration' }, () => ({
      contents: `
        export const isSupabaseConfigured = true;
        export const supabase = {
          from: (...args) => globalThis.__hydrationOwnerFixture.from(...args),
          rpc: () => { throw new Error('Unexpected RPC during owner-bound read'); },
        };
        export const getCurrentSupabaseSession = async () => globalThis.__hydrationOwnerFixture.session;
        export const ensureSupabaseSession = () => { throw new Error('Unexpected auth creation during read'); };
        export const isAnonymousSupabaseSession = session => !!session?.user?.is_anonymous;
        export const uploadSupabaseFeedbackReflectionPhoto = () => { throw new Error('Unexpected upload during read'); };
      `,
      loader: 'js',
    }));
  } }],
});

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error('Live network is forbidden in owner hydration tests'); };
after(async () => {
  globalThis.fetch = originalFetch;
  delete globalThis.__hydrationOwnerFixture;
  await fs.rm(temporary, { recursive: true, force: true });
});
const { hydrateReservationPageData } = await import(path.join(temporary, 'hydration.mjs'));
const ownerA = 'aaaaaaaa-1111-4111-8111-111111111111';
const ownerB = 'bbbbbbbb-2222-4222-8222-222222222222';
const visit = 'cccccccc-3333-4333-8333-333333333333';
const dish = 'dddddddd-4444-4444-8444-444444444444';
const session = id => ({ user: { id, is_anonymous: false }, access_token: `fixture-${id}` });
const loadA = () => hydrateReservationPageData({ seedIfEmpty: false, expectedOwner: ownerA });

function fixture() {
  const value = {
    session: session(ownerA), calls: [], beforeResponse: undefined,
    results: {
      reservations: { error: null, data: [{
        id: visit, external_ref: 'owner-hydration-fixture', reservation_at: '2026-10-02T03:00:00Z',
        party_size: 1, course_name: '합성 테스트 코스', status: 'completed',
        restaurants: { name: '합성 테스트 식당 A' }, chefs: null,
      }] },
      reservation_dishes: { error: null, data: [{
        id: dish, reservation_id: visit, sort_order: 0, course_position: 'other',
        title: '합성 테스트 메뉴 A', subtitle: '', chef_intent: '',
        ingredients: [], techniques: [], flavor_notes: [],
      }] },
      feedback_submissions: { error: null, data: [{
        reservation_id: visit, overall_rating: 4, overall_comment: 'A의 합성 식사 원문', return_intent: 'yes',
        feedback_items: [{ rating: 4, reflection_note: 'A의 합성 메뉴 원문', selected_tag_ids: [],
          selected_experience_ids: [], selected_detail_tag_ids: [], selected_dish_kind_ids: [],
          reservation_dishes: { sort_order: 0 } }],
      }] },
    },
    from(table) {
      assert.ok(Object.hasOwn(value.results, table), `Unexpected table: ${table}`);
      const call = { table, filters: [] };
      const query = {
        select() { return query; },
        eq(key, filter) { call.filters.push(['eq', key, filter]); return query; },
        in(key, filter) { call.filters.push(['in', key, [...filter]]); return query; },
        order() { return query; },
        then(resolve, reject) {
          return Promise.resolve().then(async () => {
            value.calls.push(call);
            await value.beforeResponse?.(table);
            const result = value.results[table];
            return { data: structuredClone(result.data), error: result.error };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  globalThis.__hydrationOwnerFixture = value;
  return value;
}

test('owner mismatch at admission rejects before any source query', async () => {
  const value = fixture();
  value.session = session(ownerB);
  await assert.rejects(loadA(), /계정이 바뀌어/);
  assert.deepEqual(value.calls, []);
});

test('matching owner reads the stored reservation and original feedback without seeding', async () => {
  const value = fixture();
  const result = await loadA();
  assert.equal(result.reservations.length, 1);
  const reservation = result.reservations[0];
  assert.equal(reservation.remoteId, visit);
  assert.equal(reservation.restaurant, '합성 테스트 식당 A');
  assert.equal(result.feedbackByReservationId[reservation.id].overallComment, 'A의 합성 식사 원문');
  assert.equal(Object.values(result.feedbackByReservationId[reservation.id].dishResponses)[0].reflectionNote,
    'A의 합성 메뉴 원문');
  assert.deepEqual(value.calls.map(call => call.table), ['reservations', 'reservation_dishes', 'feedback_submissions']);
  assert.deepEqual(value.calls[0].filters, [['eq', 'user_id', ownerA]]);
  assert.deepEqual(value.calls[2].filters, [['in', 'reservation_id', [visit]]]);
});

for (const table of ['reservations', 'feedback_submissions']) {
  test(`switching session while ${table} is pending cannot publish the old owner's response`, { timeout: 10000 }, async () => {
    const value = fixture();
    let entered, release;
    const waiting = new Promise(resolve => { entered = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    value.beforeResponse = async current => {
      if (current === table) { entered(); await gate; }
    };
    const loading = loadA();
    // Attach the rejection observer before releasing the transport response.
    const rejected = assert.rejects(loading, /계정이 바뀌어/);
    await waiting;
    value.session = session(ownerB);
    release();
    await rejected;
    assert.ok(value.calls.some(call => call.table === table));
  });

  test(`failed ${table} read propagates instead of returning sample or empty account data`, async () => {
    const value = fixture();
    const failure = new Error(`Synthetic ${table} read failure`);
    value.results[table] = { data: null, error: failure };
    await assert.rejects(loadA(), error => error === failure);
  });
}
