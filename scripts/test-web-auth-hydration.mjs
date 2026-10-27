import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-auth-hydration-'));
const output = path.join(directory, 'hydrate.cjs');
await build({
  stdin: { contents: "export { hydrateLatestMeasurementSnapshotResult, hydrateLatestMeasurementSnapshot } from './src/lib/tasteBuddySupabase';", resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'cjs', outfile: output, logLevel: 'silent',
  loader: { '.png': 'dataurl', '.svg': 'text' },
  define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'account-repository-fixture', setup(build) {
    build.onResolve({ filter: /^\.\/supabase$/ }, args => args.importer.endsWith('/tasteBuddySupabase.ts')
      ? { path: 'auth-repository', namespace: 'fixture' } : undefined);
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ loader: 'js', contents: `
      export const isSupabaseConfigured = true;
      export const getCurrentSupabaseSession = async () => globalThis.__authFixture.session;
      export const ensureSupabaseSession = getCurrentSupabaseSession;
      export const isAnonymousSupabaseSession = session => Boolean(session?.user.is_anonymous);
      export const uploadSupabaseFeedbackReflectionPhoto = async () => null;
      export const supabase = { from(table) {
        globalThis.__authFixture.tables.push(table);
        const query = { select() { return query; }, eq(key, value) { globalThis.__authFixture.filters.push([table, key, value]); return query; }, order() { return query; }, limit() { return query; },
          async maybeSingle() { return globalThis.__authFixture.latest; },
          then(resolve, reject) { return Promise.resolve(globalThis.__authFixture.results).then(resolve, reject); }
        }; return query;
      }};
    ` }));
  } }],
});
const { hydrateLatestMeasurementSnapshotResult: hydrate, hydrateLatestMeasurementSnapshot: legacyHydrate } = createRequire(import.meta.url)(output);
after(() => fs.rm(directory, { recursive: true, force: true }));
beforeEach(() => {
  globalThis.__authFixture = {
    session: { user: { id: 'account-a', is_anonymous: false } }, tables: [], filters: [],
    latest: { data: { id: 'measurement-a', completed_at: '2026-10-25T01:00:00Z', source: 'manual', raw_payload: {} }, error: null },
    results: { data: ['sweet','sour','bitter','salty','umami','fat'].map(taste_code => ({ taste_code, value_mm: 42 })), error: null },
  };
});

test('authenticated hydration queries only the current account and restores its result', async () => {
  const result = await hydrate();
  assert.equal(result.status, 'ready');
  assert.equal(result.snapshot.measuredAt, '2026-10-25T01:00:00Z');
  assert.deepEqual(globalThis.__authFixture.filters, [
    ['measurement_sessions', 'user_id', 'account-a'], ['measurement_sessions', 'status', 'completed'],
    ['measurement_results', 'measurement_session_id', 'measurement-a'],
  ]);
});

test('known-empty account is distinct from unavailable session and repository failure', async () => {
  globalThis.__authFixture.latest = { data: null, error: null };
  assert.deepEqual(await hydrate(), { status: 'empty' });
  globalThis.__authFixture.latest.error = { message: 'offline' };
  assert.equal((await hydrate()).status, 'unavailable');
  globalThis.__authFixture.session = null;
  globalThis.__authFixture.tables = [];
  assert.equal((await hydrate()).status, 'unavailable');
  assert.deepEqual(globalThis.__authFixture.tables, []);
});

test('a completed measurement with missing, failed or malformed results is never fabricated', async () => {
  globalThis.__authFixture.results = { data: [], error: null };
  assert.equal((await hydrate()).status, 'unavailable');
  globalThis.__authFixture.results = { data: null, error: { message: 'read failed' } };
  assert.equal((await hydrate()).status, 'unavailable');
  globalThis.__authFixture.latest.data.raw_payload = { derived_snapshot_source: 'recalled-intensity' };
  assert.equal((await hydrate()).status, 'unavailable');
});

test('anonymous sessions never read another account and legacy callers keep null compatibility', async () => {
  globalThis.__authFixture.session.user.is_anonymous = true;
  assert.equal((await hydrate()).status, 'unavailable');
  assert.equal(await legacyHydrate(), null);
  assert.deepEqual(globalThis.__authFixture.tables, []);
});
