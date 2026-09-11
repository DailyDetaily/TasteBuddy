import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { withAccountMediaUpload } from '../supabase/functions/_shared/account-media';
import { purgeAccountMediaCache } from '../supabase/functions/_shared/cloudflare-cache';
import { deleteR2Prefix } from '../supabase/functions/_shared/r2-delete';
import { deleteAccountData } from '../supabase/functions/delete-account/cleanup';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const thirdUserId = '33333333-3333-4333-8333-333333333333';
const r2 = { accountId: 'test-account', accessKeyId: 'test-key', secretAccessKey: 'test-secret', bucket: 'test-bucket' };
const cache = { zoneId: 'a'.repeat(32), apiToken: 'test-token', publicMediaBaseUrl: 'https://media.example.com' };

await test('account deletion preserves Auth on storage/cache failure and retries both prefixes before success', async () => {
  const calls: string[] = [];
  let failure: 'storage' | 'native' | 'cache' | null = 'storage';
  const dependencies = {
    async prepare() { calls.push('prepare'); return 0; },
    async deleteMediaPrefix(prefix: string) {
      calls.push(prefix);
      if (failure === 'storage' && prefix.startsWith('feedback-reflections')) throw new Error('storage unavailable');
    },
    async purgeMediaCache() { calls.push('purge'); if (failure === 'cache') throw new Error('cache unavailable'); },
    async deleteNativePhotos() { calls.push('native'); if (failure === 'native') throw new Error('native storage unavailable'); },
    async deleteAuthUser() { calls.push('auth'); },
  };
  await assert.rejects(deleteAccountData(userId, dependencies), /storage unavailable/);
  assert.equal(calls.includes('auth'), false);
  calls.length = 0;
  failure = 'native';
  await assert.rejects(deleteAccountData(userId, dependencies), /native storage unavailable/);
  assert.equal(calls.includes('auth'), false);
  calls.length = 0;
  failure = 'cache';
  await assert.rejects(deleteAccountData(userId, dependencies), /cache unavailable/);
  assert.equal(calls.includes('auth'), false);
  calls.length = 0;
  failure = null;
  assert.deepEqual(await deleteAccountData(userId, dependencies), { deleted: true, pendingUploads: false });
  assert.deepEqual(calls, ['prepare', `user-avatars/${userId}/`, `feedback-reflections/${userId}/`, 'native', 'purge', 'auth']);
});

await test('active uploads and invalid preparation never start destructive cleanup', async () => {
  const unexpected = async () => { throw new Error('cleanup must not start'); };
  const dependencies = { deleteMediaPrefix: unexpected, deleteNativePhotos: unexpected, purgeMediaCache: unexpected, deleteAuthUser: unexpected };
  assert.deepEqual(await deleteAccountData(userId, { ...dependencies, prepare: async () => 1 }), { deleted: false, pendingUploads: true });
  await assert.rejects(deleteAccountData(userId, { ...dependencies, prepare: async () => null as unknown as number }), /Invalid account deletion state/);
  await assert.rejects(deleteAccountData(userId, { ...dependencies, prepare: async () => { throw new Error('database unavailable'); } }), /database unavailable/);
});

await test('failed Auth deletion remains an error after storage cleanup', async () => {
  await assert.rejects(deleteAccountData(userId, {
    prepare: async () => 0,
    deleteMediaPrefix: async () => {},
    deleteNativePhotos: async () => {},
    purgeMediaCache: async () => {},
    deleteAuthUser: async () => { throw new Error('Auth unavailable'); },
  }), /Auth unavailable/);
});

function listXml(keys: string[], token?: string) {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><IsTruncated>${Boolean(token)}</IsTruncated>${keys.map((key) => `<Contents><Key>${escape(key)}</Key></Contents>`).join('')}${token ? `<NextContinuationToken>${escape(token)}</NextContinuationToken>` : ''}</ListBucketResult>`;
}

await test('R2 cleanup follows pagination, decodes keys, accepts already deleted objects, then verifies empty', async () => {
  const prefix = `user-avatars/${userId}/`;
  const deleted: string[] = [];
  let requests = 0;
  await deleteR2Prefix(r2, prefix, async (url, init) => {
    requests += 1;
    const parsed = new URL(url);
    assert.match((init.headers as Record<string, string>).Authorization, /^AWS4-HMAC-SHA256 Credential=/);
    assert.ok(init.signal);
    if (init.method === 'DELETE') {
      deleted.push(decodeURIComponent(parsed.pathname));
      return new Response(null, { status: deleted.length === 1 ? 204 : 404 });
    }
    assert.equal(parsed.searchParams.get('prefix'), prefix);
    if (parsed.searchParams.get('max-keys') === '1') return new Response(listXml([]));
    if (parsed.searchParams.has('continuation-token')) {
      assert.equal(parsed.searchParams.get('continuation-token'), 'page+2&token');
      return new Response(listXml([`${prefix}second.png`]));
    }
    return new Response(listXml([`${prefix}one&two.png`], 'page+2&token'));
  });
  assert.deepEqual(deleted, [`/test-bucket/${prefix}one&two.png`, `/test-bucket/${prefix}second.png`]);
  assert.equal(requests, 5);
});

await test('R2 list, delete, malformed pagination, and verification failures fail closed', async () => {
  const prefix = `feedback-reflections/${userId}/`;
  await assert.rejects(deleteR2Prefix(r2, prefix, async () => new Response('', { status: 403 })), /R2 list failed/);
  await assert.rejects(deleteR2Prefix(r2, prefix, async () => new Response('<Error/>')), /Invalid R2 list/);
  await assert.rejects(deleteR2Prefix(r2, prefix, async () => new Response('<ListBucketResult><IsTruncated>true</IsTruncated></ListBucketResult>')), /continuation token/);
  await assert.rejects(deleteR2Prefix(r2, prefix, async () => new Response(listXml([`feedback-reflections/${otherUserId}/other.jpg`]))), /unexpected object prefix/);
  await assert.rejects(deleteR2Prefix(r2, prefix, async (_url, init) => init.method === 'DELETE'
    ? new Response('', { status: 500 }) : new Response(listXml([`${prefix}photo.jpg`]))), /R2 delete failed/);
  await assert.rejects(deleteR2Prefix(r2, prefix, async (url) => new Response(listXml(new URL(url).searchParams.has('max-keys') ? [`${prefix}late.jpg`] : []))), /requires a retry/);
});

await test('Cloudflare purge targets only both account prefixes and requires acknowledged success', async () => {
  const calls: unknown[] = [];
  await purgeAccountMediaCache(userId, cache, async (input, init) => {
    assert.equal(input, `https://api.cloudflare.com/client/v4/zones/${cache.zoneId}/purge_cache`);
    calls.push(JSON.parse(String(init?.body)));
    return Response.json({ success: true });
  });
  assert.deepEqual(calls, [{ prefixes: [`media.example.com/user-avatars/${userId}/`, `media.example.com/feedback-reflections/${userId}/`] }]);
  await assert.rejects(purgeAccountMediaCache(userId, cache, async () => Response.json({ success: false })), /not confirmed/);
  await assert.rejects(purgeAccountMediaCache(userId, cache, async () => new Response('', { status: 429 })), /purge failed/);
  await assert.rejects(purgeAccountMediaCache(userId, { ...cache, publicMediaBaseUrl: 'http://invalid.example' }), /Invalid public media origin/);
});

await test('upload lease releases on success and failure, and rejected lease never writes storage', async () => {
  const calls: string[] = [];
  const client = { async rpc(name: string) { calls.push(name); return { data: 'lease-id', error: null }; } };
  assert.equal(await withAccountMediaUpload(client, async () => 'object-key'), 'object-key');
  assert.deepEqual(calls, ['begin_account_media_upload', 'finish_account_media_upload']);
  calls.length = 0;
  await assert.rejects(withAccountMediaUpload(client, async () => { throw new Error('upload failed'); }), /upload failed/);
  assert.deepEqual(calls, ['begin_account_media_upload', 'finish_account_media_upload']);
  let uploaded = false;
  await assert.rejects(withAccountMediaUpload({ async rpc() { return { data: null, error: new Error('pending') }; } }, async () => { uploaded = true; }), /Cannot upload/);
  assert.equal(uploaded, false);
});

await test('PostgreSQL: forward migration protects shared data, deduplicates follows, and cleans account ownership', async () => {
  const db = await createTestSupabaseDb({ through: '20260604' });
  const asUser = async (id: string, email: string) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)", [id, JSON.stringify({ sub: id, email })]);
    await db.exec('set role authenticated');
  };
  const asAdmin = () => db.exec('reset role');
  const count = async (sql: string) => Number((await db.query(sql)).rows[0].count);
  try {
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values
      ($1, 'one@example.test', '{"nickname":"one"}'), ($2, 'two@example.test', '{"nickname":"two"}'), ($3, 'three@example.test', '{"nickname":"three"}')`, [userId, otherUserId, thirdUserId]);
    await db.exec(`insert into public.restaurant_place_index (provider, provider_place_id, normalized_name) values ('kakao', 'fixture', 'Fixture');
      insert into public.restaurant_operating_hours (restaurant_place_index_id, provider) select id, 'kakao' from public.restaurant_place_index;
      insert into public.restaurant_bookmark_lists (owner_email, list_id, name, description) values ('one@example.test', 'saved', 'Saved', ''), ('two@example.test', 'saved', 'Saved', ''), ('deleted@example.test', 'old', 'Old', '');
      insert into public.restaurant_bookmarks (owner_email, restaurant_key, list_id, restaurant_id, restaurant_name, chef_name) values ('one@example.test', 'r1', 'saved', 'r1', 'Fixture', 'Chef');`);
    await asUser(userId, 'one@example.test');
    await db.query("select * from public.add_friend_by_nickname('two')");
    await asAdmin();
    assert.equal(await count("select count(*) from public.notifications where type='follower_added'"), 2, 'fixture reproduces the original duplicate');
    await db.exec(await readFile('supabase/migrations/20260903090000_premerge_data_safety.sql', 'utf8'));
    assert.equal(await count("select count(*) from public.notifications where type='follower_added'"), 1);
    assert.equal(await count("select count(*) from public.restaurant_bookmark_lists where owner_email='deleted@example.test'"), 0);
    assert.equal(await count("select count(*) from public.account_legacy_bookmarks where owner_email='deleted@example.test'"), 1, 'unmatched legacy data is retained for operator reconciliation');

    await asUser(userId, 'one@example.test');
    await assert.rejects(db.query('select * from public.account_legacy_bookmarks'), /permission denied/);
    assert.equal(await count('select count(*) from public.restaurant_place_index'), 1);
    for (const table of ['restaurant_place_index', 'restaurant_operating_hours']) {
      await assert.rejects(db.exec(`update public.${table} set provider='google'`), /permission denied/);
      await assert.rejects(db.exec(`delete from public.${table}`), /permission denied/);
    }
    await assert.rejects(db.exec("insert into public.restaurant_place_index (provider, provider_place_id, normalized_name) values ('kakao', 'bad', 'bad')"), /permission denied/);
    await assert.rejects(db.exec("insert into public.restaurant_operating_hours (provider) values ('kakao')"), /permission denied/);
    await db.query("select * from public.add_friend_by_nickname('three')");
    await db.query("select * from public.add_friend_by_nickname('three')");
    await asAdmin();
    assert.equal(await count("select count(*) from public.notifications where type='follower_added'"), 2, 'new follow and retry add one notification total');
    await db.exec("set role service_role; update public.restaurant_place_index set normalized_name='Service update'; reset role;");

    await asUser(otherUserId, 'two@example.test');
    assert.equal(await count('select count(*) from public.restaurant_bookmarks'), 0, 'another account cannot read bookmarks');
    await asUser(userId, 'one@example.test');
    const lease = (await db.query('select public.begin_account_media_upload() as id')).rows[0].id;
    await assert.rejects(db.query('select public.prepare_account_deletion($1)', [userId]), /permission denied/);
    await assert.rejects(db.query('insert into public.account_deletion_requests (user_id) values ($1)', [userId]), /permission denied/);
    await asAdmin();
    await db.exec('set role service_role');
    assert.equal((await db.query('select public.prepare_account_deletion($1) as active', [userId])).rows[0].active, 1);
    await asUser(userId, 'one@example.test');
    await assert.rejects(db.query('select public.begin_account_media_upload()'), /deletion is pending/);
    await asUser(otherUserId, 'two@example.test');
    await db.query('select public.finish_account_media_upload($1)', [lease]);
    await asAdmin();
    assert.equal(await count('select count(*) from public.account_media_uploads'), 1, 'another account cannot release a lease');
    await asUser(userId, 'one@example.test');
    await db.query('select public.finish_account_media_upload($1)', [lease]);
    await asAdmin();
    assert.equal((await db.query('select public.prepare_account_deletion($1) as active', [userId])).rows[0].active, 0);

    await asUser(thirdUserId, 'three@example.test');
    await db.query('select public.begin_account_media_upload()');
    await asAdmin();
    assert.equal((await db.query('select public.prepare_account_deletion($1) as active', [thirdUserId])).rows[0].active, 1);
    await db.query("update public.account_media_uploads set expires_at=now()-interval '1 second' where user_id=$1", [thirdUserId]);
    assert.equal((await db.query('select public.prepare_account_deletion($1) as active', [thirdUserId])).rows[0].active, 0, 'crashed uploads expire and deletion can retry');

    await db.query('delete from auth.users where id=$1', [userId]);
    assert.equal(await count("select count(*) from public.restaurant_bookmark_lists where owner_email='one@example.test'"), 0);
    assert.equal(await count('select count(*) from public.restaurant_bookmarks'), 0);
    assert.equal(await count("select count(*) from public.restaurant_bookmark_lists where owner_email='two@example.test'"), 1, 'other account data survives');
    await asUser(userId, 'one@example.test');
    await assert.rejects(db.exec("insert into public.restaurant_bookmark_lists (owner_email, list_id, name, description) values ('one@example.test', 'stale', 'Stale JWT', '')"), /foreign key constraint/);
  } finally {
    await db.close();
  }
});

await test('PostgreSQL: repairs live follower schema drift without backfilling existing follows', async () => {
  const db = await createTestSupabaseDb({
    through: '20260604',
    skipVersions: ['20260519', '20260520', '20260521'],
  });
  try {
    assert.equal((await db.query("select count(*)::integer as count from pg_enum where enumtypid='public.notification_type'::regtype and enumlabel='follower_added'")).rows[0].count, 0);
    assert.equal((await db.query("select to_regprocedure('public.notify_profile_follower_added()') as function")).rows[0].function, null);
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values
      ($1, 'one@example.test', '{"nickname":"one"}'), ($2, 'two@example.test', '{"nickname":"two"}')`, [userId, otherUserId]);
    await db.query('insert into public.profile_friendships (requester_id, addressee_id) values ($1,$2)', [userId, otherUserId]);

    // Separate transactions reproduce the deployment ordering required by enums.
    await db.exec(await readFile('supabase/migrations/20260903085000_restore_follower_notification_type.sql', 'utf8'));
    await db.exec(await readFile('supabase/migrations/20260903090000_premerge_data_safety.sql', 'utf8'));
    assert.equal((await db.query('select count(*)::integer as count from public.notifications')).rows[0].count, 0, 'repair must not notify historical followers');
    assert.equal((await db.query("select count(*)::integer as count from pg_trigger where tgname='profile_friendships_notify_follower_added'")).rows[0].count, 1);

    await db.query("select set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false)", [userId, JSON.stringify({sub:userId,email:'one@example.test'})]);
    await db.exec('set role authenticated');
    await db.query("select * from public.add_friend_by_nickname('two')");
    await db.exec('delete from public.profile_friendships');
    await db.query("select * from public.add_friend_by_nickname('two')");
    await db.query("select * from public.add_friend_by_nickname('two')");
    await db.exec('reset role');
    assert.equal((await db.query('select count(*)::integer as count from public.notifications')).rows[0].count, 1, 'only a new follow creates one notification after repair');
  } finally {
    await db.close();
  }
});
