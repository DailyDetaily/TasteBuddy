import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPersonalTasteModel } from './tba-engine/personal-taste-model.mjs';
import { buildOverallTasteProfile } from '../src/lib/overallTasteProfile.mjs';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/overall-taste-profile.json', import.meta.url)));
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: fixtures.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
const project = records => buildOverallTasteProfile(buildPersonalTasteModel({ userId: 'owner', records }, { _assessQuestions: false }), records,
  { userID: 'owner', asOf: fixtures.asOf, dayKey: value => formatter.format(new Date(value)) });
for (const example of fixtures.cases) test(`overall profile: ${example.id}`, () => {
  const result = project(example.records);
  assert.deepEqual(result.axes.map(row => row.current.value), example.expected.values);
  assert.deepEqual(result.axes.map(row => row.previous.value), example.expected.previous);
  assert.deepEqual(result.axes.map(row => row.current.rated), example.expected.rated);
  assert.deepEqual(result.axes.map(row => row.current.mixed), example.expected.mixed);
  assert.deepEqual(project([...example.records, ...example.records]), result, 'restore/replay does not add votes');
});
test('a model from another account cannot appear during an account switch', () => {
  const records = fixtures.cases[0].records;
  const model = buildPersonalTasteModel({ userId: 'owner', records }, { _assessQuestions: false });
  assert.ok(buildOverallTasteProfile(model, records, { userID: 'other' }).axes.every(row => row.current.value === null));
});
