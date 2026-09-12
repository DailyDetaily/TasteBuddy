import test from 'node:test';
import assert from 'node:assert/strict';
import {loadFrozenCohorts,recordsForMeal,evaluateFrozenCohorts,evaluateFrozenScenarios} from './advanced-personal-evaluation.mjs';
import * as api from './personal-taste-model.mjs';

const fixture=await loadFrozenCohorts();
const scenarios=evaluateFrozenScenarios(api);
for(const scenario of scenarios.filter(s=>s.status!=='contract_unconnected'))test(`frozen ${scenario.id} preserves permitted raw-evidence interpretation`,()=>assert.equal(scenario.status,'passed',scenario.reason));
test('unconnected entry checks are explicit and never counted as successful model checks',()=>{
  assert.deepEqual(scenarios.filter(s=>s.status==='contract_unconnected').map(s=>s.id),['AM-18','AM-22','AM-27']);
  assert.equal(scenarios.length,32);
});

test('frozen temporal cohorts never share a meal or a future response between query and training',()=>{
  const results=evaluateFrozenCohorts(fixture,api);
  assert.equal(results.reduce((sum,c)=>sum+c.evaluated.length,0),61);
  for(const result of results){
    const source=fixture.cohorts.find(c=>c.id===result.id);
    for(const row of result.evaluated){
      assert.ok(!row.trainMealIDs.includes(row.mealID));
      for(const id of row.trainMealIDs){const train=source.meals.find(m=>m.mealID===id);assert.ok(Date.parse(train.observedAt)<=Date.parse(row.queryAt));assert.ok(Date.parse(train.knownAt)<=Date.parse(row.queryAt));}
    }
  }
  const reversal=results.find(c=>c.id==='conditional_reversal');
  assert.ok(reversal.model.accuracyAmongPredictions>reversal.baseline.accuracyAmongPredictions);
  assert.equal(results.find(c=>c.id==='no_signal').model.predicted,0);
  assert.equal(results.find(c=>c.id==='sparse').model.predicted,0);
});

test('knownAt cutoff excludes future edits and unknown legacy times without claiming historical reconstruction',()=>{
  const cohort=fixture.cohorts[1],selected=cohort.meals.slice(0,4),records=selected.flatMap(recordsForMeal),userId=selected[0].userID;
  const legacy=records.map(r=>({...r,observationId:`legacy:${r.observationId}`,knownAt:null}));
  const edited=records.map(r=>({...r,observationId:`edited:${r.observationId}`,knownAt:'2027-01-01T00:00:00Z'}));
  const cutoff='2026-02-01T00:00:00Z';
  const snapshot=api.buildPersonalTasteModel({userId,records:[...records,...legacy,...edited],evidenceSetHash:'independent-time-test'},{asOf:cutoff});
  assert.ok(snapshot.candidates.flatMap(c=>c.evidenceIDs).every(id=>!id.startsWith('legacy:')&&!id.startsWith('edited:')));
  assert.equal(snapshot.temporalValidity.historicalReconstruction,false);
  const current=api.buildPersonalTasteModel({userId,records:legacy,evidenceSetHash:'independent-current-test'});
  assert.ok(current.temporalValidity.missingKnownAtCount>0);
  assert.ok(current.candidates.length>0);
});
