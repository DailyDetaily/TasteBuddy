import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildFoodEvidencePilot } from './food-evidence.mjs';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));
const build = () => buildFoodEvidencePilot({ rootDir });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const pointer = (doc, path) => path.slice(1).split('/').reduce((v, key) => v[key], doc);
const pilot = build();

test('7개의 ID와 같은 이름의 서로 다른 레시피를 보존한다', () => {
  assert.equal(pilot.foods.length, 7);
  assert.equal(new Set(pilot.foods.map(f => f.id)).size, 7);
  const duplicates = pilot.foods.filter(f => f.name === '가자미미역국');
  assert.deepEqual(duplicates.map(f => f.id), ['native-food:91013', 'native-food:91393']);
  assert.notDeepEqual(duplicates[0].claims, duplicates[1].claims);
  assert.equal(pilot.foods.filter(f => f.recordKind === 'RecipeVersion').length, 4);
  assert.equal(pilot.foods.filter(f => f.recordKind === 'FoodConcept').length, 3);
});

test('모든 식품·주장·finding 출처를 실제 행 및 원문 구절까지 역추적할 수 있다', () => {
  const docs = new Map(pilot.sources.map(source => {
    const bytes = readFileSync(resolve(rootDir, source.path));
    assert.equal(source.hash, hash(bytes));
    return [source.id, JSON.parse(bytes)];
  }));
  const refs = [...pilot.foods.flatMap(f => [...f.sourceRefs, ...f.claims.flatMap(c => c.sourceRefs)]), ...pilot.findings.flatMap(f => f.sourceRefs)];
  for (const ref of refs) {
    const doc = docs.get(ref.sourceId);
    const row = pointer(doc, ref.recordPointer);
    assert.equal(hash(JSON.stringify(row)), ref.recordHash);
    for (const [key, value] of Object.entries(ref.selector)) assert.equal(row[key], value);
    assert.deepEqual(pointer(doc, ref.pointer), ref.quote);
    assert.equal(ref.pointer, `${ref.recordPointer}/${ref.field}`);
  }
  for (const food of pilot.foods) for (const claim of food.claims) {
    if (claim.status === 'reviewed_name_component') assert.ok(claim.sourceRefs[0].quote.split(', ').includes(claim.value));
    else assert.deepEqual(claim.value, claim.sourceRefs[0].quote);
  }
});

test('분류와 삶기·끓이기 원문 충돌을 양쪽 주장에 표시하고 유지한다', () => {
  const food = pilot.foods.find(f => f.id === 'native-food:91391');
  const classification = food.claims.find(c => c.predicate === 'source_cooking_classification');
  const preparation = food.claims.find(c => c.predicate === 'preparation_text');
  assert.equal(classification.value, '가열하지 않는 음식 > 소금이나 장류에 절이는 음식 > 소금이나 장류에 절이는 음식');
  assert.match(preparation.value, /삶아/);
  assert.match(preparation.value, /끓인/);
  assert.equal(classification.status, 'contested_source_conflict');
  assert.equal(preparation.status, 'contested_source_conflict');
  assert.ok(food.issues.includes('native-classification-conflict:91391'));
});

test('파생 출처·결측을 명시하고 화학·감각·사용자 근거나 부분문자열 태그를 만들지 않는다', () => {
  const standard = pilot.sources.find(s => s.path.endsWith('korean-food-catalog.json'));
  assert.equal(standard.recordKind, 'derived_catalog');
  assert.equal(standard.observedCollectedAt, null);
  assert.equal(pilot.sources[0].observedCollectedAt, '2026-06-04T04:54:17.474Z');
  const allowed = new Set(['name', 'english_name', 'scientific_name', 'source_food_classification', 'preparation_state', 'ingredients_text', 'seasonings_text', 'preparation_text', 'source_cooking_classification', 'origin_text']);
  for (const food of pilot.foods) {
    for (const claim of food.claims) {
      assert.ok(allowed.has(claim.predicate));
      assert.equal(typeof claim.value, 'string');
      assert.equal('confidence' in claim, false);
    }
    for (const key of ['compoundMeasurements', 'sensoryStudyObservations', 'sensoryPrediction', 'userObservations', 'userLiking', 'menuOfferingVersion', 'serving']) assert.equal(food.unknowns[key], null);
    assert.equal('ingredientSignalIds' in food, false);
    assert.equal('foodOnIds' in food, false);
  }
  assert.equal(pilot.foods.find(f => f.id === 'korean-food:5606a53f7a02').unknowns.preparationState, null);
  assert.equal(pilot.foods.find(f => f.id === 'native-food:91391').claims.find(c => c.predicate === 'seasonings_text').status, 'source_empty');
  const mappingFindings = pilot.findings.filter(f => f.kind === 'existing_mapping_review');
  assert.equal(mappingFindings.length, 7);
  assert.ok(mappingFindings.every(f => f.status === 'not_adopted' && f.bridgeId && f.interpretationPath.length >= 3));
  assert.ok(mappingFindings.some(f => f.mappedValue === 'foodon:FOODON_02000056' && f.interpretationPath.at(-1) === 'beef chuck eye roast'));
});

test('동일 입력 재실행은 생성 시각·임의 점수 없이 동일 결과를 낸다', () => {
  assert.deepEqual(build(), build());
  assert.equal('generatedAt' in pilot, false);
});

function withFixture(mutate, check) {
  const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'tba-food-evidence-'));
  try {
    for (const source of pilot.sources) {
      const doc = JSON.parse(readFileSync(resolve(rootDir, source.path), 'utf8'));
      mutate(source.path, doc);
      const target = resolve(fixtureRoot, source.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, JSON.stringify(doc));
    }
    check(() => buildFoodEvidencePilot({ rootDir: fixtureRoot }));
  } finally { rmSync(fixtureRoot, { recursive: true, force: true }); }
}

test('선택 행 변경·누락·중복은 명확히 실패하며 다른 행 수정은 선택을 바꾸지 않는다', () => {
  withFixture((path, doc) => {
    if (path.includes('/raw/')) doc.items.find(r => r.sourceId === '91511').detailFields.fdmtInfo = '변경된 재료';
  }, run => assert.throws(run, /REVIEWED_RECORD_CHANGED:.*sourceId=91511/));
  withFixture((path, doc) => {
    if (path.includes('/raw/')) doc.items = doc.items.filter(r => r.sourceId !== '91511');
  }, run => assert.throws(run, /RECORD_NOT_UNIQUE:.*sourceId=91511; found 0/));
  withFixture((path, doc) => {
    if (path.endsWith('korean-food-catalog.json')) doc.items.push(doc.items.find(r => r.id === 'korean-food:50e0ec477973'));
  }, run => assert.throws(run, /RECORD_NOT_UNIQUE:.*korean-food:50e0ec477973; found 2/));
  withFixture((path, doc) => {
    if (path.endsWith('korean-food-catalog.json')) doc.items[0].koName = '검토 범위 밖 행 변경';
  }, run => assert.deepEqual(run().foods, pilot.foods));
});
