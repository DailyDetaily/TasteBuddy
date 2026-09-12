import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFeedbackSelections } from '../src/lib/tastePersonalization';
import { DEFAULT_FEEDBACK_TAG_DEFINITIONS } from '../src/constants/tastePersonalization';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

const db = await createTestSupabaseDb({ through: '20260903091000' });
const owner = 'aaaaaaaa-1111-4111-8111-111111111111';
const other = 'aaaaaaaa-2222-4222-8222-222222222222';
const visit = 'bbbbbbbb-1111-4111-8111-111111111111';
const foreignVisit = 'bbbbbbbb-2222-4222-8222-222222222222';
const tag = DEFAULT_FEEDBACK_TAG_DEFINITIONS[0].id;

function makeItem(position: number) {
  const parsed = parseFeedbackSelections([{ tagId: tag }]);
  return {
    expected_updated_at: null as string | null,
    dish: { sort_order: position, course_position: 'other', title: `Dish ${position}`,
      subtitle: null, chef_intent: null, ingredients: [], techniques: [], flavor_notes: [] },
    feedback: { rating: 4, selected_tag_ids: [tag], selected_reason: 'reason', comment: null,
      selected_experience_ids: [], selected_detail_tag_ids: [], selected_dish_kind_ids: [],
      custom_dish_kind_labels: [], custom_detail_tags: {}, reflection_note: '원문 보존',
      reflection_photo_name: null, reflection_photo_preview_url: null, tba_analysis_snapshot: { confidence: 0.7 },
      tba_signal_ids: ['signal'], tba_foodon_match_ids: [], tba_lexicon_candidate_ids: [],
      tba_confidence: 0.7, tba_analysis_version: 'test' },
    parse: { perception_taste_delta: parsed.perceptionTasteDelta,
      perception_perceptual_delta: parsed.perceptionPerceptualDelta,
      preference_taste_delta: parsed.preferenceTasteDelta,
      preference_perceptual_delta: parsed.preferencePerceptualDelta, confidence: parsed.confidence,
      rationale: parsed.rationale },
    evidence: { event_type: 'created', evidence_action: 'include', previous_snapshot: null,
      next_snapshot: { confidence: 0.7 }, previous_tba_signal_ids: [], next_tba_signal_ids: ['signal'],
      previous_tba_confidence: null, next_tba_confidence: 0.7, confidence_delta: 0.7,
      confidence_effect: {}, payload: {} },
  };
}

async function save(items: ReturnType<typeof makeItem>[], options: {
  expectedVersion?: string | null; expectedOwner?: string; reservation?: string; createOnly?: boolean; clear?: boolean;
} = {}) {
  return db.query(`select public.save_dining_feedback_atomic($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7) result`, [
    options.reservation ?? visit, options.expectedOwner ?? owner, options.expectedVersion ?? null,
    JSON.stringify({ overall_rating: 4, overall_comment: '식사 원문', return_intent: 'yes' }),
    JSON.stringify(items), options.createOnly ?? false, options.clear ?? false,
  ]);
}

async function state() {
  const tables = ['reservation_dishes', 'feedback_submissions', 'feedback_items', 'feedback_parses',
    'tba_feedback_evidence_events', 'user_learned_deltas'];
  return Promise.all(tables.map(async (table) => (await db.query(
    `select to_jsonb(t) row from public.${table} t order by id`,
  )).rows.map((entry: any) => entry.row)));
}

async function currentItems() {
  const rows = (await db.query(`select d.sort_order, i.updated_at::text from public.feedback_items i
    join public.reservation_dishes d on d.id=i.reservation_dish_id order by d.sort_order`)).rows;
  return rows.map((row: any) => ({ ...makeItem(row.sort_order), expected_updated_at: row.updated_at }));
}

async function currentVersion() {
  return (await db.query('select updated_at::text from public.feedback_submissions where reservation_id=$1', [visit]))
    .rows[0].updated_at;
}

try {
  await db.exec(await readFile('supabase/migrations/20260908110000_atomic_feedback.sql', 'utf8'));
  await db.query("insert into auth.users(id,email) values ($1,'atomic@example.com'),($2,'other@example.com')", [owner, other]);
  const restaurant = 'cccccccc-1111-4111-8111-111111111111';
  await db.query("insert into public.restaurants(id,name,slug) values ($1,'Atomic fixture','atomic-fixture')", [restaurant]);
  await db.query(`insert into public.reservations(id,user_id,restaurant_id,reservation_at,party_size,status)
    values ($1,$2,$5,now(),1,'completed'),($3,$4,$5,now(),1,'completed')`, [visit, owner, foreignVisit, other, restaurant]);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${owner}', false);`);

  const empty = await state();
  const invalidParse = [makeItem(0), makeItem(1)];
  invalidParse[1].parse.confidence = 2;
  await assert.rejects(save(invalidParse), /confidence_check/);
  assert.deepEqual(await state(), empty, 'a second-dish parse failure must roll back source, evidence, dishes and learning');

  const invalidEvidence = [makeItem(0), makeItem(1)];
  invalidEvidence[1].evidence.event_type = 'invalid';
  await assert.rejects(save(invalidEvidence), /event_type_check/);
  assert.deepEqual(await state(), empty, 'evidence failure cannot acknowledge or partially train a submission');

  await assert.rejects(save([makeItem(0)], { reservation: foreignVisit }), /does not belong/);
  await assert.rejects(save([makeItem(0)], { expectedOwner: other }), /matching direct app account/);
  await db.exec(`select set_config('request.jwt.claims', '{"client_id":"reader"}', false);`);
  await assert.rejects(save([makeItem(0)]), /matching direct app account/);
  await db.exec(`select set_config('request.jwt.claims', '{}', false);`);
  assert.deepEqual(await state(), empty);

  const ownedItems = [makeItem(0), makeItem(1)];
  Object.assign(ownedItems[0].dish, { id: foreignVisit, reservation_id: foreignVisit });
  Object.assign(ownedItems[0].feedback, { feedback_submission_id: foreignVisit, reservation_dish_id: foreignVisit });
  Object.assign(ownedItems[0].evidence, { user_id: other, reservation_id: foreignVisit });
  await save(ownedItems, { createOnly: true });
  const committed = await state();
  assert.deepEqual(committed.map((rows) => rows.length), [2, 1, 2, 2, 2, 1]);
  assert.equal(committed[5][0].support_count, 2);
  assert.ok(committed[0].every((row: any) => row.reservation_id === visit));
  assert.ok(committed[4].every((row: any) => row.user_id === owner && row.reservation_id === visit),
    'injected relationship IDs cannot attach evidence to another account or visit');
  assert.ok(committed[1][0].client_submission_completed_at);
  await save([makeItem(0)], { createOnly: true });
  assert.deepEqual(await state(), committed, 'lost acknowledgements must not duplicate evidence');

  const staleVersion = await currentVersion();
  const edited = await currentItems();
  edited[0].feedback.rating = 1;
  edited[0].feedback.reflection_note = '수정된 원문';
  edited[0].evidence.event_type = 'updated';
  await save(edited, { expectedVersion: staleVersion });
  const afterEdit = await state();
  assert.equal(afterEdit[2].find((row: any) => row.rating === 1)?.reflection_note, '수정된 원문');
  await assert.rejects(save(edited, { expectedVersion: staleVersion }), /changed/);
  assert.deepEqual(await state(), afterEdit, 'stale concurrent edits must preserve the committed result');

  const failedEdit = await currentItems();
  failedEdit[1].parse.confidence = -1;
  await assert.rejects(save(failedEdit, { expectedVersion: await currentVersion() }), /confidence_check/);
  assert.deepEqual(await state(), afterEdit, 'a failed edit restores the previous complete version');

  const cleared = (await currentItems())[0];
  cleared.feedback.selected_tag_ids = [];
  cleared.feedback.reflection_note = '';
  cleared.feedback.tba_signal_ids = [];
  cleared.parse.confidence = 0;
  cleared.evidence.event_type = 'deleted';
  cleared.evidence.evidence_action = 'remove';
  const clearVersion = await currentVersion();
  const invalidClear = structuredClone(cleared);
  invalidClear.evidence.event_type = 'invalid';
  await assert.rejects(save([invalidClear], { expectedVersion: clearVersion, clear: true }), /event_type_check/);
  assert.deepEqual(await state(), afterEdit, 'clear and removal evidence must fail together');
  await save([cleared], { expectedVersion: clearVersion, clear: true });
  const afterClear = await state();
  assert.equal(afterClear[5][0].support_count, 1);
  await save([makeItem(0), makeItem(1)], { createOnly: true });
  assert.deepEqual(await state(), afterClear, 'a delayed original submission cannot undo later edits or clears');

  await db.exec('reset role; set role anon;');
  await assert.rejects(save([]), /permission denied/);
  console.log('Atomic feedback SQL rollback, learning, ownership, edit, clear, concurrency and replay tests passed.');
} finally {
  await db.close();
}
