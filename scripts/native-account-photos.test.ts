import assert from 'node:assert/strict';
import test from 'node:test';
import { deleteNativeAccountPhotos } from '../supabase/functions/delete-account/native-photos';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';

await test('private photo deletion drains every page and fails closed on storage errors', async () => {
  const files = Array.from({ length: 230 }, (_, i) => ({ id: String(i), name: `photo-${i}.jpg` }));
  const removed: string[] = [];
  await deleteNativeAccountPhotos(owner, {
    async list(path, options) {
      assert.equal(path, owner);
      return { data: files.slice(0, options.limit), error: null };
    },
    async remove(paths) {
      assert.ok(paths.every((path) => path.startsWith(`${owner}/`)));
      removed.push(...paths);
      files.splice(0, paths.length);
      return { error: null };
    },
  });
  assert.equal(new Set(removed).size, 230);
  const file = { id: 'photo', name: 'one.jpg' };
  const noop = async () => ({ error: null });
  await assert.rejects(deleteNativeAccountPhotos(owner, {
    list: async () => ({ data: null, error: 'offline' }), remove: noop,
  }), /Could not list/);
  await assert.rejects(deleteNativeAccountPhotos(owner, {
    list: async () => ({ data: [file], error: null }), remove: async () => ({ error: 'offline' }),
  }), /Could not delete/);
  await assert.rejects(deleteNativeAccountPhotos(owner, {
    list: async () => ({ data: [file], error: null }), remove: noop,
  }), /requires a retry/);
  await assert.rejects(deleteNativeAccountPhotos(owner, {
    list: async () => ({ data: [{ ...file, name: '../other.jpg' }], error: null }), remove: noop,
  }), /Unexpected native photo path/);
});

await test('private photo policies isolate accounts, require upload admission, and block OAuth and deletion races', async () => {
  const db = await createTestSupabaseDb({ through: '20260908120000' });
  const signIn = async (id: string, claims = {}) => {
    await db.exec('reset role; set role authenticated;');
    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)",
      [id, JSON.stringify({ sub: id, ...claims })]);
  };
  const insert = (name: string) => db.query(
    "insert into storage.objects(bucket_id,name) values ('native-dining-photos',$1)", [name]);
  try {
    await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)',
      [owner, 'owner@example.com', other, 'other@example.com']);
    const bucket = (await db.query("select * from storage.buckets where id='native-dining-photos'")).rows[0];
    assert.equal(bucket.public, false);
    assert.equal(Number(bucket.file_size_limit), 6 * 1024 * 1024);
    assert.deepEqual(bucket.allowed_mime_types, ['image/jpeg']);
    await signIn(owner);
    await assert.rejects(insert(`${owner}/one.jpg`), /row-level security/);
    await db.query('select public.begin_account_media_upload()');
    await insert(`${owner}/one.jpg`);
    await assert.rejects(insert(`${other}/other.jpg`), /row-level security/);
    await assert.rejects(insert(`${owner}/../other.jpg`), /row-level security/);
    await assert.rejects(insert(`${owner}/nested/other.jpg`), /row-level security/);
    await db.query("update storage.objects set name=$1 where name=$2", [`${owner}/changed.jpg`, `${owner}/one.jpg`]);
    assert.equal((await db.query('select name from storage.objects')).rows[0].name, `${owner}/one.jpg`, 'originals are immutable');
    await signIn(other);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    await db.query('delete from storage.objects');
    await signIn(owner, { client_id: 'oauth-client' });
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    await assert.rejects(insert(`${owner}/oauth.jpg`), /row-level security/);
    await signIn(owner);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 1);
    const source = { schemaVersion: 1, values: {}, hasSeenOnboarding: true, photoFilenames: ['one.jpg'] };
    await db.query('select public.save_native_account_data($1,$2::jsonb,0)', [owner, JSON.stringify(source)]);
    await db.query('delete from storage.objects');
    assert.equal((await db.query('select * from storage.objects')).rows.length, 1, 'a committed source still references this original');
    await db.query('select public.save_native_account_data($1,$2::jsonb,1)', [owner, JSON.stringify({ ...source, photoFilenames: [] })]);
    await db.exec('reset role;');
    const pending = await db.query('select public.prepare_account_deletion($1) as active', [owner]);
    assert.equal(pending.rows[0].active, 1);
    await signIn(owner);
    await assert.rejects(insert(`${owner}/late.jpg`), /row-level security/);
    await assert.rejects(db.query('select public.begin_account_media_upload()'), /deletion is pending/);
    await db.query('delete from storage.objects');
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    await db.exec("reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);");
    await assert.rejects(insert(`${owner}/anon.jpg`), /row-level security/);
  } finally {
    await db.close();
  }
});
