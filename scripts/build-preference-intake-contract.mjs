import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import catalog from '../src/constants/preferenceIntakeCatalog.json' with { type: 'json' };
import { PREFERENCE_EVIDENCE_CASES } from './tba-engine/preference-intake-fixtures.mjs';

for (const path of ['ios/TasteBuddy/Resources/Fixtures/preference-intake.json', 'android/app/src/main/assets/fixtures/preference-intake.json']) {
  const url = new URL(`../${path}`, import.meta.url);
  const previous = JSON.parse(readFileSync(url, 'utf8'));
  assert.deepEqual(previous.questions, catalog.questions, '질문 문구가 플랫폼 기준과 달라요.');
  const next = JSON.stringify({ ...previous, evidenceCases: PREFERENCE_EVIDENCE_CASES }, null, 2) + '\n';
  if (process.argv.includes('--check')) assert.equal(readFileSync(url, 'utf8'), next, `${path} 갱신 필요`);
  else writeFileSync(url, next);
}
console.log(`선호 원본 계약 ${PREFERENCE_EVIDENCE_CASES.length}개 사례 확인`);
