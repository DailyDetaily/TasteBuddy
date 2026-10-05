import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {buildPersonalTasteModel} from './tba-engine/personal-taste-model.mjs';

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'tb-instance-links-'));
after(() => fs.rm(directory, {recursive: true, force: true}));
await build({
  stdin: {
    contents: `export * from './src/lib/gastronomy/nativeRecord.ts';
      export * from './src/lib/gastronomy/nativeArchive.ts';
      export * from './src/lib/gastronomy/nativeAnalysis.ts';
      export * from './src/lib/gastronomy/nativeDiscoveryRelations.ts';`,
    resolveDir: process.cwd(),
  },
  outfile: path.join(directory, 'contracts.mjs'), bundle: true,
  platform: 'browser', format: 'esm', logLevel: 'silent',
});
const m = await import(path.join(directory, 'contracts.mjs'));
const now = new Date('2026-10-02T03:00:00Z');
const selection = (instance, extra = {}) => ({
  ...m.makeSelection('v2.detail.texture.soft', 'detailTag'),
  selectionInstanceID: instance, target: 'whole_dish', phase: 'during_meal', ...extra,
});
const entry = selections => m.prepareNativeRecord({
  ...m.newNativeRecord(undefined, now), menu: '검증용 요리', sensorySelections: selections,
  mealTime: {source: 'user_confirmed', start: m.swiftTime(now), confirmedAt: m.swiftTime(now)},
}, undefined, now);

test('separate instances cannot supply each other with intensity in analysis or discovery links', () => {
  const original = entry([selection('A', {liking: 'liked', preferenceFit: 'justRight'}), selection('B', {intensity: 'strong'})]);
  const result = m.buildNativeAnalysis([original], 'owner');
  assert.equal(result.model.units.length, 1);
  assert.equal(result.model.units[0].intensity, null);
  assert.deepEqual(new Set(result.model.units[0].evidence.map(e => e.selectionEvidence.selectionInstanceID)), new Set(['A']));
  const links = m.validatedDiscoveryIntensityLinks(result.observations);
  for (const row of result.observations.filter(r => ['attribute_liking', 'preference_fit'].includes(r.kind)))
    assert.deepEqual(links[row.observationId] ?? [], []);
  const payload = m.replaceNativeRecord(m.blankSnapshot(), original, null, now);
  const data = m.decodeNativeAccount(payload, now);
  assert.notEqual(data.observations.find(o => o.facet === 'liking').selection,
    data.observations.find(o => o.facet === 'intensity').selection);
});

test('responses from the same instance retain their intensity evidence', () => {
  const original = entry([selection('A', {liking: 'liked', intensity: 'strong'})]);
  const result = m.buildNativeAnalysis([original], 'owner');
  assert.equal(result.model.units[0].intensity, 'strong');
  const liking = result.observations.find(o => o.kind === 'attribute_liking');
  const intensity = result.observations.find(o => o.kind === 'sensory_intensity');
  assert.deepEqual(m.validatedDiscoveryIntensityLinks(result.observations)[liking.observationId], [intensity.observationId]);
});

test('instances with missing phase receive separate questions and independent suppression', () => {
  const original = entry([selection('A', {phase: 'unspecified', liking: 'liked'}), selection('B', {phase: 'unspecified', liking: 'disliked'})]);
  const result = m.buildNativeAnalysis([original], 'owner');
  const questions = result.model.queuedSelections.filter(q => q.facet === 'phase');
  assert.equal(questions.length, 2);
  assert.notEqual(questions[0].id, questions[1].id);
  const sources = questions.map(q => result.observations.find(o => o.observationId === q.responseSourceID));
  assert.deepEqual(new Set(sources.map(s => s.selectionEvidence.selectionInstanceID)), new Set(['A', 'B']));
  for (const question of questions) {
    const instances = result.observations.filter(o => question.evidenceIDs.includes(o.observationId))
      .map(o => o.selectionEvidence.selectionInstanceID);
    assert.equal(new Set(instances).size, 1);
  }
  const suppressed = buildPersonalTasteModel({userId: 'owner', records: result.observations},
    {individualQuestions: true, suppressedQuestionIDs: [questions[0].id]});
  assert.deepEqual(suppressed.queuedSelections.filter(q => q.facet === 'phase').map(q => q.id), [questions[1].id]);
});

test('editing one instance does not change the other response timestamp', () => {
  const original = entry([selection('A', {intensity: 'light'}), selection('B', {intensity: 'light'})]);
  const changedAt = new Date(+now + 1000);
  const edited = m.prepareNativeRecord({...original, sensorySelections: original.sensorySelections.map(s =>
    s.selectionInstanceID === 'A' ? {...s, intensity: 'strong'} : s)}, original, changedAt);
  const result = m.buildNativeAnalysis([edited], 'owner');
  const intensity = instance => result.observations.find(o => o.kind === 'sensory_intensity' && o.selectionEvidence.selectionInstanceID === instance);
  assert.equal(intensity('A').knownAt, changedAt.toISOString());
  assert.equal(intensity('B').knownAt, now.toISOString());
});
