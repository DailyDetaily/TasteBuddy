import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildOverallTasteProfile } from '../src/lib/overallTasteProfile.mjs';

const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'overall-profile-repository-'));
await build({ stdin: { contents: "export * from './src/lib/gastronomy/nativeRepository.ts'; export * from './src/lib/gastronomy/nativeRecord.ts'; export * from './src/lib/gastronomy/nativeRecordDeletion.ts'; export * from './src/lib/gastronomy/nativeAnalysis.ts'; export * from './src/lib/gastronomy/nativeArchive.ts';", resolveDir: process.cwd() }, outfile: path.join(temp, 'contracts.mjs'), bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
const { NativeRepository, readValidatedNativeRecords, newNativeRecord, makeSelection, swiftTime, deleteNativeRecord, buildNativeAnalysis } = await import(path.join(temp, 'contracts.mjs'));
const now = new Date('2026-10-25T03:00:00Z');
test('repository save, restore, update, delete and account isolation propagate to the whole profile', async () => {
  const values = new Map(); let remote = null, failing = false;
  const storage = { read: async owner => structuredClone(values.get(owner) ?? null), photo: async () => null,
    update: async (owner, change) => { const next = change(structuredClone(values.get(owner) ?? null)); values.set(owner, structuredClone(next)); return next; } };
  const transport = { fetch: async owner => { if (failing) throw new Error('offline'); return { enabled: true, remote: owner === 'A' ? remote : null }; }, save: async (_owner, snapshot) => { remote = { snapshot, revision: (remote?.revision ?? 0) + 1 }; return remote.revision; } };
  const repo = new NativeRepository(storage, transport);
  const result = archive => {
    // Repository mutations use the real save clock; the chart must read after that boundary.
    const readAt = new Date();
    const analysis = buildNativeAnalysis(readValidatedNativeRecords(archive.snapshot), archive.owner, readAt);
    return buildOverallTasteProfile(analysis.model, analysis.observations, { userID: archive.owner, asOf: readAt.toISOString() }).axes[3].current;
  };
  const draft = (day, liking) => {
    const date = swiftTime(new Date(`2026-10-0${day}T03:00:00Z`));
    return { ...newNativeRecord(undefined, now), menu: '합성 국수', restaurant: '검증 식당', feedbackStatus: 'completed',
      mealTime: { source: 'user_confirmed', start: date, confirmedAt: swiftTime(now) },
      sensorySelections: [{ ...makeSelection('salty-balanced', 'bubble'), liking, target: 'whole_dish', phase: 'first_bite' }] };
  };
  await repo.refresh('A');
  const first = await repo.commit('A', draft(1, 'liked'), null);
  assert.equal(result(first).value, 100);
  const second = await repo.commit('A', draft(2, 'disliked'), null);
  assert.equal(result(second).value, 50);
  await repo.sync('A');
  values.delete('A');
  const restored = await repo.refresh('A');
  assert.equal(result(restored).rated, 2);
  assert.equal(result(restored).value, 50);
  const negative = readValidatedNativeRecords(restored.snapshot).find(row => row.sensorySelections[0].liking === 'disliked');
  const updated = await repo.commit('A', { ...negative, sensorySelections: negative.sensorySelections.map(row => ({ ...row, liking: 'liked' })) }, negative);
  assert.equal(result(updated).value, 100);
  const selected = readValidatedNativeRecords(updated.snapshot).find(row => row.id === negative.id);
  const deleted = await repo.changeSnapshot('A', snapshot => deleteNativeRecord(snapshot, selected));
  assert.equal(result(deleted).rated, 1);
  assert.equal(result(await repo.refresh('B')).value, null);
  failing = true;
  await assert.rejects(repo.refresh('A'), /offline/);
  assert.equal(result(await repo.read('A')).value, 100, 'a failed read retains the local original; callers label it as cached');
});
test.after(async () => fs.rm(temp, { recursive: true, force: true }));
