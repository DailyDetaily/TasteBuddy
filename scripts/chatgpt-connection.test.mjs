import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

test('ChatGPT export enforces ownership, server expiry, deletion and restricted OAuth claims', async () => {
  const db = await createTestSupabaseDb();
  const a = '11111111-1111-4111-8111-111111111111';
  const b = '22222222-2222-4222-8222-222222222222';
  try {
    await db.exec('create role authenticator;');
    await db.exec(await readFile('supabase/migrations/20260906120000_chatgpt_analysis_connection.sql', 'utf8'));
    await db.exec(`insert into auth.users(id) values ('${a}'), ('${b}');`);
    const asUser = async id => db.exec(`reset role; set request.jwt.claim.sub = '${id}'; set request.jwt.claims = '{"role":"authenticated","is_anonymous":false}'; set role authenticated;`);
    await asUser(a);
    await db.exec(`insert into public.chatgpt_analysis_exports(user_id, payload, expires_at) values ('${a}', '{"schemaVersion":1}', '2999-01-01');`);
    const expiry = await db.query('select expires_at < now() + interval \'25 hours\' as bounded from public.chatgpt_analysis_exports');
    assert.equal(expiry.rows[0].bounded, true);
    await assert.rejects(db.exec(`insert into public.chatgpt_analysis_exports(user_id, payload) values ('${b}', '{"schemaVersion":1}');`), /row-level security/);
    await asUser(b);
    assert.equal((await db.query('select * from public.chatgpt_analysis_exports')).rows.length, 0);
    await db.exec(`delete from public.chatgpt_analysis_exports where user_id='${a}';`);
    await asUser(a);
    assert.equal((await db.query('select * from public.chatgpt_analysis_exports')).rows.length, 1);
    await db.exec(`set request.jwt.claims = '{"client_id":"chatgpt-client"}';`);
    assert.equal((await db.query('select * from public.chatgpt_analysis_exports')).rows.length, 0);
    await asUser(a);
    await db.exec('delete from public.chatgpt_analysis_exports');
    assert.equal((await db.query('select * from public.chatgpt_analysis_exports')).rows.length, 0);
    await assert.rejects(db.exec(`insert into public.chatgpt_analysis_exports(user_id, payload) values ('${a}', '{}');`), /check constraint/);
    await db.exec('reset role;');
    await db.exec("insert into public.chatgpt_oauth_configuration(client_id, resource_url) values ('chatgpt-client', 'https://taste.example.com/mcp');");
    const hook = async event => (await db.query('select public.chatgpt_access_token_hook($1::jsonb) as result', [JSON.stringify(event)])).rows[0].result;
    const direct = { claims: { role: 'authenticated', aud: 'authenticated' } };
    assert.deepEqual(await hook(direct), direct);
    const issued = await hook({ client_id: 'chatgpt-client', claims: { ...direct.claims, sub: a } });
    assert.equal(issued.claims.role, 'tb_chatgpt_reader');
    assert.equal(issued.claims.aud, 'https://taste.example.com/mcp');
    assert.equal(issued.claims.tb_scope, 'taste:read');
    await assert.rejects(hook({ client_id: 'unexpected', claims: direct.claims }), /not enabled/);
    await assert.rejects(hook({ client_id: 'chatgpt-client', claims: { is_anonymous: true } }), /not enabled/);
    const membership = await db.query("select pg_has_role('authenticator', 'tb_chatgpt_reader', 'MEMBER') as member");
    assert.equal(membership.rows[0].member, false);
    await db.exec(`insert into public.chatgpt_analysis_exports(user_id,payload) values ('${a}','{"schemaVersion":1}'); delete from auth.users where id='${a}';`);
    assert.equal((await db.query('select * from public.chatgpt_analysis_exports')).rows.length, 0);
  } finally { await db.close(); }
});
