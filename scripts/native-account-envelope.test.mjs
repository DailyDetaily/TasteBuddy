import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createTestSupabaseDb } from './utils/test-supabase-db.mjs';

const migrationVersion = '20261002010000';
const owner = 'aaaaaaaa-1111-4111-8111-111111111111';
const other = 'aaaaaaaa-2222-4222-8222-222222222222';
const androidKey = 'tastebuddy.android.archive.v1';
const base64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64');
const snapshot = () => ({
  schemaVersion: 2,
  values: {
    'tastebuddy.ios.dining-entries.v1': base64([{ id: 'preserved-original' }]),
    'tastebuddy.android.archive.v1': base64({ schemaVersion: 1, state: {}, photoFilenames: [] }),
    'unknown.future.binary': Buffer.from([0, 255, 17]).toString('base64'),
    'unknown.future.valid-padding': 'AB==',
    'unknown.future.empty': '',
  },
  hasSeenOnboarding: true,
  photoFilenames: [],
  futureMetadata: { preserve: ['exactly', 7] },
});
async function asUser(db, id) {
  await db.exec('reset role; set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}
const save = (db, payload, revision, user = owner) => db.query(
  'select public.save_native_account_data($1,$2::jsonb,$3) as revision',
  [user, JSON.stringify(payload), revision],
);

test('current migrations reject undecodable envelopes without replacing source or revision', async () => {
  const db = await createTestSupabaseDb({ through: '99999999999999' });
  try {
    await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)',
      [owner, 'source@example.com', other, 'other@example.com']);
    await asUser(db, owner);
    const original = snapshot();
    assert.equal((await save(db, original, 0)).rows[0].revision, 1);
    const invalid = [
      { ...original, schemaVersion: '2' },
      { ...original, hasSeenOnboarding: 'true' },
      { ...original, hasSeenOnboarding: null },
      Object.fromEntries(Object.entries(original).filter(([key]) => key !== 'hasSeenOnboarding')),
      ...[{ not: 'base64' }, null, 42, 'not%base64', 'W 10=', 'W10=\n', 'W10', 'W10===']
        .map(source => ({ ...original, values: { ...original.values, source } })),
    ];
    for (const payload of invalid) {
      await assert.rejects(save(db, payload, 1), /native_account_data_envelope_check/);
      const row = (await db.query('select payload, revision from public.native_account_data')).rows[0];
      assert.deepEqual(row, { payload: original, revision: 1 });
    }
    assert.equal((await save(db, original, 1)).rows[0].revision, 2);
    await assert.rejects(save(db, original, 1), /revision conflict/);
    await asUser(db, other);
    assert.equal((await db.query('select * from public.native_account_data')).rows.length, 0);
    await assert.rejects(save(db, original, 2), /access denied/);
  } finally {
    await db.close();
  }
});

test('older writers cannot remove the Android archive or omit its photo references', async () => {
  const db = await createTestSupabaseDb({ through: '99999999999999' });
  try {
    await db.query('insert into auth.users(id,email) values ($1,$2)', [owner, 'android-owner@example.com']);
    await db.query("insert into storage.objects(bucket_id,name) values ('native-dining-photos',$1)",
      [`${owner}/android-original.jpg`]);
    await asUser(db, owner);
    const android = { schemaVersion: 1, state: { original: 'Android 합성 원문', unknown: { keep: true } },
      photoFilenames: ['android-original.jpg'], futureField: ['preserve', 7] };
    const original = { ...snapshot(), values: { ...snapshot().values, [androidKey]: base64(android) },
      photoFilenames: ['android-original.jpg'] };
    await save(db, original, 0);
    const stored = () => db.query('select payload::text as payload_text, revision from public.native_account_data');
    const before = (await stored()).rows[0];

    const droppingExtension = structuredClone(original);
    delete droppingExtension.values[androidKey];
    droppingExtension.photoFilenames = [];
    await assert.rejects(save(db, droppingExtension, 1), /Android archive removal refused/);
    assert.deepEqual((await stored()).rows[0], before);

    await assert.rejects(save(db, { ...original, photoFilenames: [] }, 1), /native_account_data_envelope_check/);
    assert.deepEqual((await stored()).rows[0], before);
    await db.query("delete from storage.objects where bucket_id='native-dining-photos' and name=$1",
      [`${owner}/android-original.jpg`]);
    assert.equal((await db.query("select count(*)::int as count from storage.objects where bucket_id='native-dining-photos'"))
      .rows[0].count, 1, 'the rejected legacy write must leave the Android photo protected');

    const compatible = { ...original, values: { ...original.values,
      'tastebuddy.ios.dining-entries.v1': base64([{ id: 'edited-ios-original' }]) } };
    assert.equal((await save(db, compatible, 1)).rows[0].revision, 2);
    assert.equal((await db.query('select payload from public.native_account_data')).rows[0].payload.values[androidKey],
      original.values[androidKey], 'compatible writes preserve the exact extension bytes');

    const emptied = { ...compatible, photoFilenames: [], values: { ...compatible.values,
      [androidKey]: base64({ schemaVersion: 1, state: {}, photoFilenames: [] }) } };
    assert.equal((await save(db, emptied, 2)).rows[0].revision, 3, 'explicit Android empty archives remain valid');
    await db.exec('reset role');
    await db.query('delete from auth.users where id=$1', [owner]);
    assert.equal((await db.query('select * from public.native_account_data')).rows.length, 0,
      'whole-account deletion is unaffected by the update guard');
  } finally {
    await db.close();
  }
});

test('Android extension envelope is validated while unknown state and future positive versions stay opaque', async () => {
  const db = await createTestSupabaseDb({ through: '99999999999999' });
  try {
    await db.query('insert into auth.users(id,email) values ($1,$2)', [owner, 'android-envelope@example.com']);
    await asUser(db, owner);
    const original = snapshot();
    await save(db, original, 0);
    const invalid = [
      base64(null), base64([]), base64({ schemaVersion: '1', state: {}, photoFilenames: [] }),
      base64({ schemaVersion: 0, state: {}, photoFilenames: [] }),
      base64({ schemaVersion: -1, state: {}, photoFilenames: [] }),
      base64({ schemaVersion: 1, state: [], photoFilenames: [] }),
      base64({ schemaVersion: 1, state: {}, photoFilenames: [42] }),
      base64({ schemaVersion: 1, state: {}, photoFilenames: ['../other.jpg'] }),
      base64({ schemaVersion: 1, state: {}, photoFilenames: ['not-in-manifest.jpg'] }),
      Buffer.from('not JSON').toString('base64'),
      Buffer.from([0xff, 0xfe]).toString('base64'),
    ];
    for (const encoded of invalid) {
      await assert.rejects(save(db, { ...original, values: { ...original.values, [androidKey]: encoded } }, 1),
        /native_account_data_envelope_check/);
      assert.deepEqual((await db.query('select payload, revision from public.native_account_data')).rows[0],
        { payload: original, revision: 1 });
    }
    const future = { ...original, values: { ...original.values, [androidKey]: base64({
      schemaVersion: 2, state: { futureModel: { untouched: [1, '원문'] } }, photoFilenames: [], futureFlag: true,
    }) } };
    assert.equal((await save(db, future, 1)).rows[0].revision, 2);
    assert.deepEqual((await db.query('select payload from public.native_account_data')).rows[0].payload, future);
  } finally {
    await db.close();
  }
});

test('envelope migration preserves historical malformed bytes for recovery and protects subsequent writes', async () => {
  const db = await createTestSupabaseDb({ through: '99999999999999', skipVersions: [migrationVersion] });
  try {
    await db.query('insert into auth.users(id,email) values ($1,$2)', [owner, 'recovery@example.com']);
    await asUser(db, owner);
    const historical = { ...snapshot(), values: { source: 'legacy-invalid%base64' } };
    await save(db, historical, 0);
    await db.exec('reset role');
    await db.exec(await readFile(`supabase/migrations/${migrationVersion}_native_account_envelope_validation.sql`, 'utf8'));
    await asUser(db, owner);
    const before = (await db.query('select payload, revision from public.native_account_data')).rows[0];
    assert.deepEqual(before, { payload: historical, revision: 1 });
    await assert.rejects(save(db, historical, 1), /native_account_data_envelope_check/);
    const recovered = snapshot();
    assert.equal((await save(db, recovered, 1)).rows[0].revision, 2);
    assert.deepEqual((await db.query('select payload from public.native_account_data')).rows[0].payload, recovered);
  } finally {
    await db.close();
  }
});
