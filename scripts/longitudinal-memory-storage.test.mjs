import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

test('v2 account snapshot preserves opaque raw revisions, refuses downgrade, and deletes without resurrection', async () => {
  const db = await createTestSupabaseDb({ through: '20260908105000' });
  const id = '11111111-1111-4111-8111-111111111111';
  try {
    await db.exec(await readFile('supabase/migrations/20260913011000_native_food_memory_v2.sql', 'utf8'));
    await db.exec(`insert into auth.users(id,email) values ('${id}','synthetic@example.com');
      set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);
      select set_config('request.jwt.claims','{}',false);`);
    const initial = { schemaVersion: 1, values: { source: 'synthetic-legacy' }, hasSeenOnboarding: true, photoFilenames: [] };
    const save = (payload, revision) => db.query('select public.save_native_account_data($1::uuid,$2::jsonb,$3) as revision', [id, JSON.stringify(payload), revision]);
    await save(initial, 0);
    const revised = { ...initial, schemaVersion: 2, values: { source: 'synthetic-original-and-correction' } };
    await save(revised, 1);
    assert.deepEqual((await db.query('select payload from public.native_account_data')).rows[0].payload, revised);
    await assert.rejects(save(initial, 2), /downgrade refused/);
    await save({ ...revised, values: {} }, 2);
    await assert.rejects(save(revised, 2), /revision conflict/);
    assert.deepEqual((await db.query('select payload from public.native_account_data')).rows[0].payload.values, {});
    await db.exec(`reset role; delete from auth.users where id='${id}'`);
    assert.equal((await db.query('select * from public.native_account_data')).rows.length, 0);
  } finally { await db.close(); }
});

test('ChatGPT migration accepts v1/v2 without weakening size, missing version, or account boundaries', async () => {
  const db = await createTestSupabaseDb();
  try {
    await db.exec('create role authenticator');
    await db.exec(await readFile('supabase/migrations/20260906120000_chatgpt_analysis_connection.sql', 'utf8'));
    await db.exec(await readFile('supabase/migrations/20260913010000_food_memory_export_v2.sql', 'utf8'));
    const id = '11111111-1111-4111-8111-111111111111';
    await db.exec(`insert into auth.users(id) values ('${id}');`);
    for (const version of [1, 2]) {
      await db.query('insert into public.chatgpt_analysis_exports(user_id,payload) values ($1,$2) on conflict (user_id) do update set payload=excluded.payload', [id, { schemaVersion: version }]);
    }
    for (const payload of [{}, { schemaVersion: 3 }, { schemaVersion: 2, source: 'x'.repeat(530000) }]) {
      await assert.rejects(db.query('update public.chatgpt_analysis_exports set payload=$1', [payload]), /check constraint/);
    }
  } finally { await db.close(); }
});
