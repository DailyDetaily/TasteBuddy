import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildPersonalTasteModel,predictPersonalTaste} from './personal-taste-model.mjs';
import {POLICY_CONTRAST_PAIRS} from './policy-contrast-fixtures.mjs';
const results=[];
for (const pair of POLICY_CONTRAST_PAIRS) for (const variant of pair.variants) {
 test(`${pair.id}/${variant.label} ${pair.title}`,()=>{
  const input=structuredClone(variant.input),before=JSON.stringify(input);
  const m=buildPersonalTasteModel({userId:input.userID,records:input.records},input.options);
  const c=m.candidates.find(c=>c.attribute==='taste.sour'&&!c.conditions.length);
  const intensityIDs=new Set(input.records.filter(r=>r.kind==='sensory_intensity').map(r=>r.observationId));
  const all={mealCount:c?.distribution.mealCount??0,direction:c?.direction??null,unitCount:m.units.length,
   positive:c?.distribution.positive??0,neutral:c?.distribution.neutral??0,negative:c?.distribution.negative??0,mixed:c?.distribution.mixed??0,
   excludedCount:m.excludedEvidence.length,missingKnownAtCount:m.temporalValidity.missingKnownAtCount,
   intensities:[...new Set(m.units.map(u=>u.intensity))].sort((a,b)=>String(a).localeCompare(String(b))),
   overallAssociationCount:m.overallAssociations.length,hasOverallPatterns:m.overallPatterns.length>0,
   hasFitIntensity:m.fitPatterns.some(p=>p.conditions.some(c=>c.dimension==='intensity')),
   hasOverallIntensity:m.overallPatterns.some(p=>p.conditions.some(c=>c.dimension==='intensity')),
   overallHasIntensityEvidence:m.overallPatterns.some(p=>p.evidenceIDs.some(id=>intensityIDs.has(id))),
   intensityClarificationCount:(m.queuedSelections??[m.nextSelection].filter(Boolean)).filter(q=>q.intent==='clarification'&&q.facet==='intensity').length,
   fitRepeatedValue:m.fitPatterns.find(p=>!p.conditions.length)?.repeatedValue??null,
   predictionDirection:input.query?predictPersonalTaste(m,input.query).direction:null};
  const actual=Object.fromEntries(Object.keys(variant.expected).map(k=>[k,all[k]]));
  const unchanged=JSON.stringify(input)===before;
  results.push({pairID:pair.id,label:variant.label,actual,inputUnchanged:unchanged});
  assert.equal(unchanged,true,'probe must not mutate input');
  assert.deepEqual(actual,variant.expected);
 });
}
after(()=>{
 if (!process.env.TBA_POLICY_RESULTS) return;
 const source=fs.readFileSync(new URL('./policy-contrast-fixtures.mjs',import.meta.url));
 const report={format:'tastebuddy-policy-contrast/2',evidenceClass:'synthetic_fixture',oracleSHA256:createHash('sha256').update(source).digest('hex'),
  note:'New executable contrasts retain the previously described semantic boundaries. Prior download and frozen shared/cohort files are not overwritten. This is not user-utility or production evidence.',
  pairs:POLICY_CONTRAST_PAIRS.map(p=>({...p,variants:p.variants.map(v=>({...v,currentExecution:results.find(r=>r.pairID===p.id&&r.label===v.label)??null}))}))};
 fs.writeFileSync(process.env.TBA_POLICY_RESULTS,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
});
