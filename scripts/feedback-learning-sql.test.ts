import assert from 'node:assert/strict';
import { DEFAULT_FEEDBACK_TAG_DEFINITIONS } from '../src/constants/tastePersonalization';
import {
  computeReservationLearningSignal,
  createEmptyUserLearnedCalibration,
  parseFeedbackSelections,
  updateUserLearnedCalibration,
} from '../src/lib/tastePersonalization';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

const db = await createTestSupabaseDb({ through: '20260903091000' });
const userId = 'aaaaaaaa-1111-4111-8111-111111111111';
const restaurantId = 'bbbbbbbb-1111-4111-8111-111111111111';
const visits: Array<{ id: string; submission: string; item: string; rating: number; days: number; tag: string }> = [];
const tagIds = DEFAULT_FEEDBACK_TAG_DEFINITIONS.slice(0, 3).map((tag) => tag.id);

async function readCalibration() {
  const { rows } = await db.query('select * from public.user_learned_deltas where user_id = $1', [userId]);
  const row = rows[0];
  return {
    perceptionTasteDelta: row.perception_taste_delta,
    perceptionPerceptualDelta: row.perception_perceptual_delta,
    preferenceTasteDelta: row.preference_taste_delta,
    preferencePerceptualDelta: row.preference_perceptual_delta,
    supportCount: row.support_count,
    hypothesisCount: row.hypothesis_count,
  };
}

function expectedCalibration() {
  let calibration = createEmptyUserLearnedCalibration();
  for (const visit of visits) {
    calibration = updateUserLearnedCalibration(calibration, computeReservationLearningSignal([{
      rating: visit.rating,
      daysSinceDining: visit.days,
      parsedReaction: parseFeedbackSelections([{ tagId: visit.tag }]),
      sourceConfidence: 1,
    }])).next;
  }
  const { updatedAt: _updatedAt, ...values } = calibration;
  return values;
}

async function saveParse(visit: typeof visits[number]) {
  const parsed = parseFeedbackSelections([{ tagId: visit.tag }]);
  await db.query(`insert into public.feedback_parses(feedback_item_id, perception_taste_delta,
    perception_perceptual_delta, preference_taste_delta, preference_perceptual_delta, confidence)
    values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6)
    on conflict(feedback_item_id) do update set perception_taste_delta=excluded.perception_taste_delta,
      perception_perceptual_delta=excluded.perception_perceptual_delta,
      preference_taste_delta=excluded.preference_taste_delta,
      preference_perceptual_delta=excluded.preference_perceptual_delta, confidence=excluded.confidence`,
  [visit.item, JSON.stringify(parsed.perceptionTasteDelta), JSON.stringify(parsed.perceptionPerceptualDelta),
    JSON.stringify(parsed.preferenceTasteDelta), JSON.stringify(parsed.preferencePerceptualDelta), parsed.confidence]);
}

try {
  await db.query('insert into auth.users(id, email) values ($1, $2)', [userId, 'learning-test@example.com']);
  await db.query('insert into public.restaurants(id, name, slug) values ($1, $2, $3)',
    [restaurantId, 'Learning fixture', 'learning-fixture']);
  for (let index = 0; index < 3; index++) {
    const suffix = String(index + 1).padStart(12, '0');
    const visit = {
      id: `cccccccc-1111-4111-8111-${suffix}`,
      submission: `dddddddd-1111-4111-8111-${suffix}`,
      item: `eeeeeeee-1111-4111-8111-${suffix}`,
      rating: index + 1, days: index * 45, tag: tagIds[index],
    };
    visits.push(visit);
    const submittedAt = new Date(Date.UTC(2026, 8, index + 1));
    const diningAt = new Date(submittedAt.getTime() - visit.days * 86400000);
    await db.query(`insert into public.reservations(id,user_id,restaurant_id,external_ref,reservation_at,party_size,status)
      values ($1,$2,$3,$4,$5,1,'completed')`, [visit.id, userId, restaurantId,
      `restaurant-feedback-learning-fixture-${1788400000000 + index}`, diningAt.toISOString()]);
    await db.query(`insert into public.reservation_dishes(id,reservation_id,title,sort_order) values ($1,$2,'dish',0)`,
      [visit.item, visit.id]);
    await db.query(`insert into public.feedback_submissions(id,reservation_id,user_id,overall_rating,return_intent,submitted_at)
      values ($1,$2,$3,3,'yes',$4)`, [visit.submission, visit.id, userId, submittedAt.toISOString()]);
    await db.query(`insert into public.feedback_items(id,feedback_submission_id,reservation_dish_id,rating,selected_tag_ids)
      values ($1,$2,$1,$3,$4::jsonb)`, [visit.item, visit.submission, visit.rating, JSON.stringify([visit.tag])]);
    await saveParse(visit);
    assert.deepEqual(await readCalibration(), expectedCalibration(), 'server learning must match JS rating/decay/blending semantics');
  }

  const beforeReplay = await readCalibration();
  await Promise.all([...visits, ...visits, ...visits].map(saveParse));
  assert.deepEqual(await readCalibration(), beforeReplay, 'overlapping retries must neither duplicate evidence nor lose another visit');

  visits[0].tag = tagIds[2];
  visits[0].rating = 5;
  await db.query('update public.feedback_items set rating=$2, selected_tag_ids=$3::jsonb where id=$1',
    [visits[0].item, visits[0].rating, JSON.stringify([visits[0].tag])]);
  await saveParse(visits[0]);
  assert.deepEqual(await readCalibration(), expectedCalibration(), 'editing must replace the old contribution');

  const removed = visits.splice(1, 1)[0];
  await db.query(`update public.feedback_items set selected_tag_ids='[]'::jsonb where id=$1`, [removed.item]);
  assert.deepEqual(await readCalibration(), expectedCalibration(), 'clearing a dish must remove its contribution');

  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  await assert.rejects(db.query(`insert into public.user_learned_deltas(user_id,support_count) values ($1,999)
    on conflict(user_id) do update set support_count=999`, [userId]), /row-level security/);
  await db.query('update public.user_learned_deltas set support_count=999 where user_id=$1', [userId]);
  assert.deepEqual(await readCalibration(), expectedCalibration(), 'older clients cannot overwrite derived counts');
  await assert.rejects(db.query('select public.recompute_feedback_learning_for_user($1)', [userId]), /permission denied/);
  await db.exec('reset role;');

  // Deleting an item cascades its parse; the remaining visits still determine learning.
  const deleted = visits.shift()!;
  await db.query('delete from public.feedback_items where id=$1', [deleted.item]);
  assert.deepEqual(await readCalibration(), expectedCalibration());
  console.log('Feedback learning SQL equivalence, replay, edit/delete and old-client protection tests passed.');
} finally {
  await db.close();
}
