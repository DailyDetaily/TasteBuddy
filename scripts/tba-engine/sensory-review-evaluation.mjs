import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parseByRules, LEXICON_VERSION, RULE_VERSION } from '../tba-platform-pilot/rules.mjs';

const suiteURL = new URL('./sensory-review-cases.json', import.meta.url);
export const reviewSuite = JSON.parse(readFileSync(suiteURL, 'utf8'));
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value;
export function verifySuite(suite = reviewSuite) {
  const { frozenContentSha256, ...content } = suite;
  return createHash('sha256').update(JSON.stringify(stable(content))).digest('hex') === frozenContentSha256;
}
const domains = { taste: 'taste', aroma: 'aroma', texture: 'texture', mouthfeel: 'mouthfeel', temperature: 'temperature', irritation: 'trigeminal', finish: 'finish' };
const specialDomains = {30:['taste','finish'],32:'texture',33:'texture',34:'aroma',35:['texture','mouthfeel'],36:'aroma',40:'texture',46:'aroma',47:'mouthfeel',48:'taste',49:'mouthfeel',50:'mouthfeel'};
const numberOf = c => Number(c.id.slice(3));
const sensory = atom => /^sensory_|^attribute_liking$|^preference_fit$/.test(atom.kind);

/** 부분구절은 원문 그대로여야 하며, 같은 영역의 sensory_detail에 포함되어야 한다.
 * 대상/시점/이유의 정확 관계와 문장 전체 의미 정확도는 자동 평가하지 않는다.
 */
export function scoreReviewCase(fixture, parsed) {
  const atoms = parsed.observations ?? [];
  const unresolved = parsed.unresolved ?? [];
  const failures = [];
  const sourceErrors = atoms.flatMap((a, i) => {
    const spans = a.sourceSpans ?? [];
    const errors = [];
    if (!spans.length || spans.some(s => !Number.isInteger(s.start) || !Number.isInteger(s.end) || s.start < 0 || s.end <= s.start || fixture.text.slice(s.start, s.end) !== s.quote)) errors.push(`${i}:source_span`);
    if (a.kind === 'sensory_detail' && (typeof a.value !== 'string' || !spans.some(s => s.quote.includes(a.value)))) errors.push(`${i}:detail_not_verbatim`);
    return errors;
  });
  const domain = specialDomains[numberOf(fixture)] ?? domains[fixture.domain];
  const allowedDomains = Array.isArray(domain) ? domain : domain ? [domain] : [];
  const detailResults = fixture.expected.detail.map(expected => ({
    expected: expected.valueContains,
    matched: atoms.some(a => a.kind === expected.kind && a.scale === expected.scale && typeof a.value === 'string' && a.value.includes(expected.valueContains) && fixture.text.includes(a.value) && (!allowedDomains.length || allowedDomains.some(d => a.attribute?.startsWith(`${d}.`)))),
  }));
  // 동결 exact-detail 지표와 별도로, 형식 중복을 요구하지 않는 의미 동등성을 측정한다.
  const equivalentPredicates = {
    33: a => a.kind === 'sensory_presence' && a.attribute === 'texture.crisp' && a.value === true && a.target !== 'sauce',
    34: a => a.kind === 'sensory_presence' && ['aroma.dairy','aroma.reference'].includes(a.attribute) && a.value === true && (a.reference ?? '').includes('버터'),
    36: a => a.kind === 'sensory_presence' && a.attribute === 'aroma.herbal' && a.value === true,
    48: a => a.kind === 'sensory_intensity' && a.attribute === 'taste.sour' && a.value === 'strong',
  };
  const equivalentPredicate = equivalentPredicates[numberOf(fixture)];
  const existingMeaningEquivalent = !!equivalentPredicate && atoms.some(a => equivalentPredicate(a) && (a.sourceSpans ?? []).some(s => fixture.text.slice(s.start,s.end) === s.quote));
  for (const detail of detailResults) if (!detail.matched && !existingMeaningEquivalent) failures.push('detail_or_equivalent_missing');
  const likingRequired = fixture.expected.liking;
  const likingMatched = !likingRequired || atoms.some(a => /liking$/.test(a.kind) && a.value === likingRequired);
  if (!likingMatched) failures.push('explicit_liking_missing');
  const safetyFailures = [];
  if (sourceErrors.length) safetyFailures.push('fabricated_source_span');
  if (!likingRequired && atoms.some(a => /liking$/.test(a.kind)) && ![39,40,47].includes(numberOf(fixture))) safetyFailures.push('sensory_implies_liking');
  if ([39,41,42,43,44,45].includes(numberOf(fixture)) && atoms.some(sensory)) safetyFailures.push('non_user_or_non_consumed_context_as_sensation');
  if ([31,36].includes(numberOf(fixture)) && atoms.some(a => a.phase === 'first_bite')) safetyFailures.push('early_implies_first_bite');
  if ([6,7,8,9,10,29,46].includes(numberOf(fixture)) && atoms.some(a => /ingredient/.test(a.kind))) safetyFailures.push('aroma_metaphor_implies_ingredient');
  if (numberOf(fixture) === 33 && atoms.some(a => a.attribute === 'texture.crisp' && a.target === 'sauce')) safetyFailures.push('condition_as_sensory_target');
  const mustUnresolved = !fixture.expected.mustUnresolved || unresolved.length > 0;
  if (!mustUnresolved) failures.push('required_unresolved_missing');
  const contextRequired = !!fixture.expected.preserveContext;
  // 원문 보존은 관계 추출과 다르다. 문장 전체가 보존돼도 의미 관계 성공으로 세지 않는다.
  const storedText = [...atoms.flatMap(a => (a.sourceSpans ?? []).map(s => s.quote)), ...unresolved.map(u => u.text ?? u.phrase ?? u.quote ?? '')].join('\n');
  const contextVerbatimAvailable = !contextRequired || storedText.includes(fixture.text);
  return { id: fixture.id, domain: fixture.domain, detailResults, existingMeaningEquivalent, detailOrEquivalent: detailResults.length > 0 && (detailResults.every(d=>d.matched) || existingMeaningEquivalent), likingRequired: likingRequired ?? null, likingMatched, sourceErrors, safetyFailures, mustUnresolved, contextRequired, contextVerbatimAvailable, relationshipSemantics: contextRequired ? 'not_automatically_scored' : 'not_applicable', unresolved: unresolved.length > 0 || !!parsed.needsAI, interpretedDetail: detailResults.length > 0 && detailResults.every(d => d.matched), semanticSuccess: !failures.length && !safetyFailures.length && !parsed.needsAI && !unresolved.length && !contextRequired, failures, atoms: atoms.map(a => ({kind:a.kind,attribute:a.attribute,value:a.value,scale:a.scale,target:a.target,phase:a.phase})) };
}
export function evaluateSensoryReview({ suite = reviewSuite, parse = text => parseByRules({question:'free_text',questionVersion:'2',choiceVersion:LEXICON_VERSION,target:'whole_dish',phase:'unspecified',value:text}), snapshot } = {}) {
  if (!verifySuite(suite)) throw new Error('SENSORY_REVIEW_FIXTURE_HASH_MISMATCH');
  if (snapshot && snapshot.suiteHash !== suite.frozenContentSha256) throw new Error('SENSORY_REVIEW_BASELINE_HASH_MISMATCH');
  const results = suite.cases.map(c => scoreReviewCase(c, snapshot ? snapshot.results.find(r => r.id === c.id).result : parse(c.text)));
  const expectedDetails = results.flatMap(r => r.detailResults);
  return { version:'sensory-review-evaluation/1', suiteVersion:suite.version, suiteHash:suite.frozenContentSha256, ruleVersion:snapshot?.ruleVersion ?? RULE_VERSION, productionSourceHashes: snapshot ? null : Object.fromEntries(['rules.mjs','sensory-language.mjs','semantic-lexicon.json'].map(name => [name,createHash('sha256').update(readFileSync(new URL(`../tba-platform-pilot/${name}`,import.meta.url))).digest('hex')])), capturedAt:new Date().toISOString(), evaluationRole:'development_review_not_hidden_holdout', metrics:{ cases:results.length, safety:{casesWithViolation:results.filter(r=>r.safetyFailures.length).length, limitation:'Selected machine-checkable invariants only; not overall safety accuracy'}, detailRecall:{matched:expectedDetails.filter(d=>d.matched).length, expected:expectedDetails.length}, meaningCoverage:{matched:results.filter(r=>r.detailOrEquivalent).length,expected:results.filter(r=>r.detailResults.length).length,existingAtomAlternativeCases:[33,34,36,48],limitation:'Detail fragment or explicitly permitted semantic equivalent; not full sentence relation correctness'}, rubricReview:{ambiguousLikingCase:'SR-027',reason:'재미있었다 expresses interest but may not assert sensory liking; frozen expectation retained, not silently relaxed',unambiguousLikingExpected:15,unambiguousLikingMatched:results.filter(r=>r.id!=='SR-027'&&r.likingRequired&&r.likingMatched).length}, explicitLiking:{matched:results.filter(r=>r.likingRequired&&r.likingMatched).length, expected:results.filter(r=>r.likingRequired).length}, sourcePreservation:{casesWithInvalidAtomSource:results.filter(r=>r.sourceErrors.length).length}, unresolvedCases:results.filter(r=>r.unresolved).length, context:{requiringRelationReview:results.filter(r=>r.contextRequired).length, automaticRelationAccuracy:null}, semanticSuccess:results.filter(r=>r.semanticSuccess).length, overallAccuracy:null }, limitations:['No LLM/API calls','Review fixtures are synthetic; not user preference evidence','Cases may be shared for fixes, so this is not an undisclosed holdout','Matched fragments do not establish complete target/time/condition/combination interpretation','Unresolved and API-pending cases never count as semantic success','This is not interchangeable with the existing fixed regression suite'], results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseline = process.argv.includes('--baseline');
  const snapshot = baseline ? JSON.parse(readFileSync(new URL('./sensory-review-baseline.json', import.meta.url))) : undefined;
  const report = evaluateSensoryReview({snapshot});
  const outputIndex = process.argv.indexOf('--output');
  if (outputIndex >= 0) writeFileSync(process.argv[outputIndex+1], JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({ruleVersion:report.ruleVersion,suiteHash:report.suiteHash,metrics:report.metrics},null,2));
}
