import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-release-contract-'));
await build({
  stdin: { contents: [
    'nativeRecord', 'nativeRepository', 'nativeRecordDeletion', 'nativeAnalysis',
  ].map(name => `export * from './src/lib/gastronomy/${name}.ts';`).join('\n'), resolveDir: process.cwd() },
  outfile: path.join(temporary, 'contracts.mjs'), bundle: true, platform: 'node', format: 'esm', logLevel: 'silent',
});
const m = await import(path.join(temporary, 'contracts.mjs'));
const clone = value => structuredClone(value);
const now = new Date('2026-10-02T03:00:00Z');
function snapshot(menu = '국수', filename) {
  const entry = { ...m.newNativeRecord(undefined, now), menu, note: '내 원문',
    sensorySelections: [{ ...m.makeSelection('salty-balanced', 'bubble'), liking: 'liked' }],
    ...(filename ? { reflectionPhotoFilename: filename } : {}),
  };
  const value = m.replaceNativeRecord(m.blankSnapshot(), entry, null, now);
  value.photoFilenames = filename ? [filename] : [];
  return value;
}
function storage() {
  const archives = new Map(), photos = new Map();
  return {
    fail: false,
    read: async owner => clone(archives.get(owner) ?? null),
    photo: async (owner, file) => photos.get(JSON.stringify([owner, file])) ?? null,
    async cachePhoto(owner, photo) {
      if (this.fail) throw Error('quota');
      const key = JSON.stringify([owner, photo.filename]);
      if (photos.has(key)) throw Error('photo collision');
      photos.set(key, photo.blob);
    },
    async update(owner, change, values) {
      const next = change(clone(archives.get(owner) ?? null));
      if (this.fail) throw Error('quota');
      assert.equal(next.owner, owner);
      archives.set(owner, clone(next));
      for (const photo of values ? Array.isArray(values) ? values : [values] : [])
        photos.set(JSON.stringify([owner, photo.filename]), photo.blob);
      return clone(next);
    },
  };
}
function server() {
  const states = new Map(), photos = new Map();
  return {
    states, photos, offline: false, saves: 0, downloading: undefined,
    async fetch(owner) {
      if (this.offline) throw Error('offline');
      return { enabled: true, remote: clone(states.get(owner) ?? null) };
    },
    async downloadPhoto(owner, file) {
      await this.downloading?.();
      const value = photos.get(JSON.stringify([owner, file]));
      if (!value) throw Error('missing remote photo');
      return value;
    },
    async save(owner, value, revision, photo) {
      if (this.offline) throw Error('offline');
      assert.equal(states.get(owner)?.revision ?? 0, revision);
      for (const file of value.photoFilenames) {
        const blob = await photo(file);
        if (blob) photos.set(JSON.stringify([owner, file]), blob);
        assert.ok(photos.has(JSON.stringify([owner, file])));
      }
      states.set(owner, { snapshot: clone(value), revision: revision + 1 });
      this.saves++;
      return revision + 1;
    },
  };
}
test('offline original uploads on reconnect and a second device restores the same analysis', async () => {
  const local = storage(), remote = server(), a = new m.NativeRepository(local, remote);
  await a.refresh('A');
  const entry = m.readNativeRecords(snapshot('재접속 기록'))[0];
  await a.commit('A', entry, null);
  remote.offline = true;
  await assert.rejects(a.sync('A'), /offline/);
  remote.offline = false;
  const reloaded = new m.NativeRepository(local, remote);
  const uploaded = await reloaded.reconnect('A');
  assert.equal(uploaded.dirty, false);
  assert.equal(remote.saves, 1);
  const second = new m.NativeRepository(storage(), remote);
  const restored = await second.reconnect('A');
  assert.deepEqual(restored.snapshot, uploaded.snapshot);
  assert.deepEqual(
    m.buildNativeAnalysis(m.readNativeRecords(restored.snapshot), 'local-owner', now),
    m.buildNativeAnalysis(m.readNativeRecords(uploaded.snapshot), 'local-owner', now),
  );
  assert.equal(m.readNativeRecords((await second.refresh('B')).snapshot).length, 0);
});
test('restore persists the photo bytes and snapshot together for offline use by the same owner', async () => {
  const local = storage(), remote = server();
  remote.states.set('A', { snapshot: snapshot('사진 기록', 'source.jpg'), revision: 4 });
  remote.photos.set(JSON.stringify(['A', 'source.jpg']), new Blob(['photo-original'], { type: 'image/jpeg' }));
  const repo = new m.NativeRepository(local, remote);
  const result = await repo.refresh('A');
  remote.offline = true;
  assert.equal(result.revision, 4);
  assert.equal(await (await repo.photo('A', 'source.jpg')).text(), 'photo-original');
  assert.equal(await repo.photo('B', 'source.jpg'), null);
  assert.equal(m.readNativeRecords((await repo.read('A')).snapshot)[0].menu, '사진 기록');
});
test('missing account photo leaves a readable local original and revision unchanged', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  await repo.refresh('A');
  await repo.commit('A', m.readNativeRecords(snapshot())[0], null);
  const before = await repo.read('A');
  remote.states.set('A', { snapshot: snapshot('불완전 백업', 'missing.jpg'), revision: 2 });
  await assert.rejects(repo.refresh('A'), /missing remote photo/);
  assert.deepEqual(await repo.read('A'), before);
  assert.equal(remote.saves, 0);
});
test('storage exhaustion cannot publish a restored snapshot without its photos', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  remote.states.set('A', { snapshot: snapshot('큰 사진', 'source.jpg'), revision: 1 });
  remote.photos.set(JSON.stringify(['A', 'source.jpg']), new Blob(['original'], { type: 'image/jpeg' }));
  local.fail = true;
  await assert.rejects(repo.refresh('A'), /quota/);
  assert.equal(await repo.read('A'), null);
  assert.equal(await repo.photo('A', 'source.jpg'), null);
});
test('an edit made while restoring photos remains current and the remote copy becomes a conflict', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  await repo.refresh('A');
  remote.states.set('A', { snapshot: snapshot('다른 기기', 'source.jpg'), revision: 1 });
  remote.photos.set(JSON.stringify(['A', 'source.jpg']), new Blob(['original'], { type: 'image/jpeg' }));
  remote.downloading = async () => { await repo.commit('A', m.readNativeRecords(snapshot('복원 중 작성'))[0], null); };
  const result = await repo.refresh('A');
  assert.equal(m.readNativeRecords(result.snapshot)[0].menu, '복원 중 작성');
  assert.equal(m.readNativeRecords(result.conflict.snapshot)[0].menu, '다른 기기');
  assert.equal(result.dirty, true);
});
test('deleting a native record retains Android extension bytes and its shared photo reference', () => {
  const value = snapshot('지울 기록', 'shared.jpg');
  const android = { schemaVersion: 1, state: { original: '안드로이드 원문', unknown: [1, 2] }, photoFilenames: ['shared.jpg'] };
  value.values[m.ANDROID_ARCHIVE_KEY] = m.encodeNativeValue(android);
  const next = m.deleteNativeRecord(value, m.readNativeRecords(value)[0]);
  assert.deepEqual(next.photoFilenames, ['shared.jpg']);
  assert.equal(next.values[m.ANDROID_ARCHIVE_KEY], value.values[m.ANDROID_ARCHIVE_KEY]);
  assert.equal(m.readNativeRecords(next).length, 0);
});
test('unknown or damaged Android extension cannot replace the readable account archive', async () => {
  for (const extension of [{ schemaVersion: 2, state: {}, photoFilenames: [] }, { schemaVersion: 1, state: {}, photoFilenames: ['../bad.jpg'] }, { schemaVersion: 1, state: {}, photoFilenames: ['unlisted.jpg'] }]) {
    const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
    await repo.refresh('A');
    const before = await repo.read('A'), value = snapshot();
    value.values[m.ANDROID_ARCHIVE_KEY] = m.encodeNativeValue(extension);
    remote.states.set('A', { snapshot: value, revision: 1 });
    await assert.rejects(repo.refresh('A'), /Android/);
    assert.deepEqual(await repo.read('A'), before);
  }
});
test('malformed envelope values and onboarding flags never clear an existing original', async () => {
  for (const malformed of [{ values: { foreign: {} } }, { values: { foreign: 'bad%base64' } },
    { values: { foreign: 'W1 0=' } }, { values: { foreign: 'W10' } },
    { hasSeenOnboarding: 'true' }, { hasSeenOnboarding: undefined }, { photoFilenames: ['../outside.jpg'] }]) {
    const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
    await repo.refresh('A');
    const before = await repo.read('A');
    remote.states.set('A', { snapshot: { ...snapshot(), ...malformed }, revision: 1 });
    await assert.rejects(repo.refresh('A'));
    assert.deepEqual(await repo.read('A'), before);
  }
});
test('a native photo reference missing from the manifest is rejected before restore', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  await repo.refresh('A');
  const before = await repo.read('A'), broken = snapshot('참조만 남은 사진', 'missing.jpg');
  broken.photoFilenames = [];
  remote.states.set('A', { snapshot: broken, revision: 2 });
  await assert.rejects(repo.refresh('A'), /사진의 백업 목록/);
  assert.deepEqual(await repo.read('A'), before);
});
test('reusing a photo filename for different bytes never overwrites an existing original', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  await repo.refresh('A');
  const entry = m.readNativeRecords(snapshot('원본 사진', 'same.jpg'))[0];
  await repo.commit('A', entry, null, { filename: 'same.jpg', blob: new Blob(['original'], { type: 'image/jpeg' }) });
  const before = await repo.read('A'), original = m.readNativeRecords(before.snapshot)[0];
  await assert.rejects(repo.commit('A', { ...original, note: '덮어쓰기' }, original,
    { filename: 'same.jpg', blob: new Blob(['different'], { type: 'image/jpeg' }) }), /같은 이름/);
  assert.deepEqual(await repo.read('A'), before);
  assert.equal(await (await repo.photo('A', 'same.jpg')).text(), 'original');
});
test('photo restore stages one original at a time and a later failure never publishes partial source', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  const value = snapshot('여러 사진', 'first.jpg');
  value.photoFilenames.push('second.jpg');
  remote.states.set('A', { snapshot: value, revision: 1 });
  remote.photos.set(JSON.stringify(['A', 'first.jpg']), new Blob(['first-original'], { type: 'image/jpeg' }));
  let downloads = 0;
  remote.downloading = async () => {
    if (++downloads === 2) {
      assert.equal(await (await repo.photo('A', 'first.jpg')).text(), 'first-original');
      throw Error('second download failed');
    }
  };
  await assert.rejects(repo.refresh('A'), /second download failed/);
  assert.equal(await repo.read('A'), null);
  assert.equal(await repo.photo('A', 'second.jpg'), null);
});
test('corrupt local source is preserved until an explicit valid account-copy recovery', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  remote.states.set('A', { snapshot: snapshot('복원할 원문'), revision: 2 });
  await repo.refresh('A');
  const broken = m.encodeNativeValue({ truncated: '원문 그대로' });
  await local.update('A', value => ({ ...value, dirty: true,
    snapshot: { ...value.snapshot, values: { ...value.snapshot.values, [m.DINING_KEY]: broken } } }));
  const original = await repo.read('A');
  const compared = await repo.refresh('A');
  assert.deepEqual(compared.snapshot, original.snapshot);
  assert.equal(compared.conflict.revision, 2);
  assert.throws(() => m.readValidatedNativeRecords(compared.snapshot));
  const restored = await repo.useAccountCopy('A');
  assert.equal(m.readNativeRecords(restored.snapshot)[0].menu, '복원할 원문');
  assert.deepEqual(restored.recoveries[0].snapshot, original.snapshot);
  assert.equal(restored.recoveries[0].snapshot.values[m.DINING_KEY], broken);
  assert.equal(remote.saves, 0);
});
test('photo failure during explicit corrupt-source recovery never replaces the local bytes', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  remote.states.set('A', { snapshot: snapshot(), revision: 1 });
  await repo.refresh('A');
  await local.update('A', value => ({ ...value, snapshot: { ...value.snapshot,
    values: { [m.DINING_KEY]: 'not%base64' } } }));
  await repo.refresh('A');
  const before = await repo.read('A');
  remote.states.set('A', { snapshot: snapshot('사진 있는 복원본', 'unavailable.jpg'), revision: 2 });
  await assert.rejects(repo.useAccountCopy('A'), /missing remote photo/);
  assert.deepEqual(await repo.read('A'), before);
});
test('explicit recovery cannot downgrade a future local schema even with a valid remote copy', async () => {
  const local = storage(), remote = server(), repo = new m.NativeRepository(local, remote);
  remote.states.set('A', { snapshot: snapshot(), revision: 1 });
  await repo.refresh('A');
  await local.update('A', value => ({ ...value, snapshot: { ...value.snapshot, schemaVersion: 3 }, conflict: remote.states.get('A') }));
  const before = await repo.read('A');
  await assert.rejects(repo.refresh('A'));
  await assert.rejects(repo.useAccountCopy('A'), /새 버전/);
  assert.deepEqual(await repo.read('A'), before);
});
