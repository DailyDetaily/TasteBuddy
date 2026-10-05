import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-transport-contract-'));
await build({
  entryPoints: ['src/lib/gastronomy/nativeTransport.ts'], outfile: path.join(temporary, 'transport.mjs'),
  bundle: true, format: 'esm', platform: 'node', logLevel: 'silent',
  define: { 'import.meta.env': JSON.stringify({ VITE_SUPABASE_URL: 'https://fixture.invalid', VITE_SUPABASE_PUBLISHABLE_KEY: 'test-only' }) },
  plugins: [{ name: 'isolated-transport', setup(build) {
    build.onResolve({ filter: /^@supabase\/supabase-js$/ }, () => ({ path: 'client', namespace: 'fixture' }));
    build.onResolve({ filter: /^\.\.\/supabase$/ }, () => ({ path: 'session', namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'session'
      ? 'export const getCurrentSupabaseSession = async () => globalThis.__releaseSession;'
      : 'export const createClient = (...args) => globalThis.__releaseClient(...args);', loader: 'js' }));
  } }],
});
const { nativeTransport } = await import(path.join(temporary, 'transport.mjs'));
const session = owner => ({ user: { id: owner, is_anonymous: false }, access_token: `token-${owner}` });
function fixture() {
  const calls = [], pins = [];
  globalThis.__releaseSession = session('A');
  const state = { photo: new Blob(['original'], { type: 'image/jpeg' }), error: null, afterUpload: undefined };
  globalThis.__releaseClient = (_url, _key, options) => {
    pins.push(options);
    return {
      from() {
        const query = { select: () => query, eq: (_key, owner) => { calls.push(['fetch', owner]); return query; }, limit: () => query,
          maybeSingle: async () => ({ data: null, error: null }) };
        return query;
      },
      rpc: async (name, args) => { calls.push([name, args]); return { data: name === 'begin_account_media_upload' ? 'lease' : 1, error: null }; },
      storage: { from: () => ({
        download: async file => { calls.push(['download', file]); return { data: state.photo, error: state.error }; },
        upload: async file => { calls.push(['upload', file]); state.afterUpload?.(); return { error: null }; },
      }) },
    };
  };
  return { calls, pins, state };
}
const snapshot = { schemaVersion: 2, values: {}, hasSeenOnboarding: true, photoFilenames: ['original.jpg'] };
test('a request for another owner never creates an authenticated client', async () => {
  const f = fixture();
  await assert.rejects(nativeTransport.fetch('B'), /계정이 바뀌어/);
  assert.equal(f.pins.length, 0);
});
test('admitted requests retain their original bearer token across session changes', async () => {
  const f = fixture();
  await nativeTransport.fetch('A');
  globalThis.__releaseSession = session('B');
  assert.equal(await f.pins[0].accessToken(), 'token-A');
});
test('a missing local and remote photo prevents committing the account snapshot', async () => {
  const f = fixture();
  f.state.photo = null;
  f.state.error = { message: 'not found' };
  await assert.rejects(nativeTransport.save('A', snapshot, 0, async () => null), /사진을 복원하지 못/);
  assert.equal(f.calls.filter(c => c[0] === 'save_native_account_data').length, 0);
});
test('an existing remote photo is verified before its reference can be saved', async () => {
  const f = fixture();
  assert.equal(await nativeTransport.save('A', snapshot, 0, async () => null), 1);
  assert.deepEqual(f.calls.map(c => c[0]), ['download', 'save_native_account_data']);
});
test('switching account during photo upload releases the lease without saving the snapshot', async () => {
  const f = fixture();
  f.state.afterUpload = () => { globalThis.__releaseSession = session('B'); };
  await assert.rejects(nativeTransport.save('A', snapshot, 0, async () => f.state.photo), /계정이 바뀌어/);
  assert.ok(f.calls.some(c => c[0] === 'finish_account_media_upload'));
  assert.ok(!f.calls.some(c => c[0] === 'save_native_account_data'));
  assert.equal(await f.pins[0].accessToken(), 'token-A');
});
test('malformed paths, empty photos, and invalid media types cannot be restored', async () => {
  const f = fixture();
  await assert.rejects(nativeTransport.downloadPhoto('A', '../other.jpg'));
  for (const photo of [new Blob([], { type: 'image/jpeg' }), new Blob(['<html>'], { type: 'text/html' })]) {
    f.state.photo = photo;
    await assert.rejects(nativeTransport.downloadPhoto('A', 'source.jpg'), /사진을 복원하지 못/);
  }
});
