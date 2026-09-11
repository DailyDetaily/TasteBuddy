import assert from 'node:assert/strict';
import test from 'node:test';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

test('native account snapshots enforce ownership, revisions, payload shape and deletion boundaries', async () => {
  const db = await createTestSupabaseDb({ through: '20260908105000' });
  const userA = '11111111-1111-4111-8111-111111111111';
  const userB = '22222222-2222-4222-8222-222222222222';
  const payload = JSON.stringify({ schemaVersion: 1, values: {}, hasSeenOnboarding: true, photoFilenames: [] });
  const asUser = async (user, claims = {}) => {
    await db.exec(`reset role; set role authenticated;
      select set_config('request.jwt.claim.sub', '${user}', false);
      select set_config('request.jwt.claims', '${JSON.stringify(claims)}', false);`);
  };
  try {
    await db.exec(`insert into auth.users(id,email) values ('${userA}','a@example.com'), ('${userB}','b@example.com');`);
    await db.exec(`insert into storage.buckets(id,name) values ('native-dining-photos','native-dining-photos') on conflict do nothing;
      insert into storage.objects(bucket_id,name) values ('native-dining-photos','${userA}/saved-photo.jpg');`);
    await asUser(userA);
    assert.equal((await db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,0) as revision`, [userA, payload])).rows[0].revision, 1);
    await assert.rejects(db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,0)`, [userA, payload]), /revision conflict/);
    await assert.rejects(db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,0)`, [userB, payload]), /access denied/);
    await assert.rejects(db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,1)`, [userA, JSON.stringify({ schemaVersion: 1, photoFilenames: [] })]), /check constraint/);
    assert.equal((await db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,1) as revision`, [userA, payload])).rows[0].revision, 2);
    const missingPhoto = JSON.stringify({ ...JSON.parse(payload), photoFilenames: ['missing-photo.jpg'] });
    await assert.rejects(db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,2)`, [userA, missingPhoto]), /photo original missing/);
    const savedPhoto = JSON.stringify({ ...JSON.parse(payload), photoFilenames: ['saved-photo.jpg'] });
    assert.equal((await db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,2) as revision`, [userA, savedPhoto])).rows[0].revision, 3);

    await asUser(userB);
    assert.equal((await db.query('select * from public.native_account_data')).rows.length, 0);
    await asUser(userA, { client_id: 'external-client' });
    assert.equal((await db.query('select * from public.native_account_data')).rows.length, 0);
    await assert.rejects(db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,2)`, [userA, payload]), /access denied/);
    await asUser(userA, { is_anonymous: true });
    await assert.rejects(db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,2)`, [userA, payload]), /access denied/);

    await db.exec(`reset role; insert into public.account_deletion_requests(user_id) values ('${userA}');`);
    await asUser(userA);
    await assert.rejects(db.query(`select public.save_native_account_data($1::uuid,$2::jsonb,3)`, [userA, payload]), /deletion in progress/);
    await db.exec(`reset role; delete from auth.users where id = '${userA}';`);
    assert.equal((await db.query('select * from public.native_account_data')).rows.length, 0);
  } finally {
    await db.close();
  }
});
