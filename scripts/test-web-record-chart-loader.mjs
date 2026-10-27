import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-chart-loader-'));
const out = path.join(dir, 'loader.mjs');
await build({ stdin: { contents: "export {loadNativeAccountData} from './src/lib/gastronomy/nativeAccount'; export {fake} from './src/lib/gastronomy/nativeRuntime'; export {blankSnapshot} from './src/lib/gastronomy/nativeRecord';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
  plugins: [{ name: 'fixture-repository', setup(build) {
    build.onResolve({ filter: /nativeRuntime$/ }, () => ({ path: 'fixture', namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `export const fake={local:null,remote:null,error:null,owners:[]}; export const nativeRepository={read:async owner=>{fake.owners.push(owner);return fake.local;},reconnect:async owner=>{fake.owners.push(owner);if(fake.error)throw fake.error;return fake.remote;}}; export const withJournalLock=async(owner,action)=>action();`, loader: 'js' }));
  } }] });
const { loadNativeAccountData: load, blankSnapshot, fake } = await import(out);
after(() => fs.rm(dir, { recursive: true, force: true }));
test('remote result is scoped and marked synchronized; offline cache carries an error', async () => {
  fake.local = { snapshot: blankSnapshot() }; fake.remote = { snapshot: blankSnapshot(), remoteEnabled: true }; fake.error = null;
  const fresh = await load('account-A'); assert.equal(fresh.freshness, 'synced'); assert.equal(fresh.syncError, undefined);
  assert.deepEqual(fake.owners, ['account-A', 'account-A']);
  fake.error = Error('offline'); const cached = await load('account-A');
  assert.equal(cached.freshness, 'cached'); assert.equal(cached.syncError, 'offline');
});
test('unavailable or corrupt sources never become known-empty success', async () => {
  fake.local = null; fake.error = Error('offline'); await assert.rejects(load('account-B'), /offline/);
  fake.local = { snapshot: { schemaVersion: 999, values: {} } }; await assert.rejects(load('account-B'));
});
test('guest/local-only storage is not labelled as synchronized backend data', async () => {
  fake.local = null; fake.error = null; fake.remote = { snapshot: blankSnapshot(), remoteEnabled: false };
  assert.equal((await load('guest')).freshness, 'local');
});
