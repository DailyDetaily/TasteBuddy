import { canonical, unique } from './personal-taste-insights.mjs';

export const questionFamilyKey = q => canonical([q.attribute, q.reference ?? null, q.facet, q.target, q.phase, q.intent ?? 'clarification', q.proposedCondition ?? null]);
export function questionSourceKey(source) {
  const s = source.selectionEvidence;
  return s ? canonical([source.experienceId, s.type, s.selectionID, s.catalogVersion, s.labelSnapshot, s.relatedBubbleID ?? null,
      ...(s.selectionInstanceID != null ? [s.selectionInstanceID] : [])])
    : canonical([source.experienceId, source.phrase, canonical(source.sourceSpans)]);
}
// Mirrors PersonalTasteQuestionInstance.swift. A question belongs to one original choice.
export function individualQuestionGroups(questions, included) {
  const byID = new Map(included.map(r => [r.observationId, r])), bySource = new Map(), result = new Map();
  for (const row of included) { const key = questionSourceKey(row); bySource.set(key, [...(bySource.get(key) ?? []), row]); }
  for (const raw of questions) {
    const q = {...raw, intent: raw.intent ?? 'clarification'}, family = questionFamilyKey(q);
    if (q.intent === 'exploration') {
      const observed = unique(included.filter(r => r.attribute === q.attribute && (r.reference ?? null) === (q.reference ?? null) && r.kind === 'sensory_intensity').map(r => r.value));
      const missing = ['weak','medium','strong'].filter(v => !observed.includes(v));
      const proposed = missing.length === 1 ? missing[0] : observed.length === 1 && ['weak','strong'].includes(observed[0]) ? 'medium' : null;
      if (proposed) { const optional = {...q, proposedCondition:{dimension:'intensity',value:proposed}}; result.set(questionFamilyKey(optional), optional); }
      continue;
    }
    const matches = r => r.attribute === q.attribute && (r.reference ?? null) === (q.reference ?? null) && r.target === q.target && r.phase === q.phase;
    const sources = q.evidenceIDs.map(id => byID.get(id)).filter(r => r && matches(r)).sort((a,b) =>
      (a.kind === 'sensory_presence') !== (b.kind === 'sensory_presence') ? a.kind === 'sensory_presence' ? -1 : 1 : a.observationId < b.observationId ? -1 : 1);
    const seen = new Set();
    for (const source of sources) {
      const logical = questionSourceKey(source); if (seen.has(logical)) continue; seen.add(logical);
      const peers = bySource.get(logical).filter(matches), kind = {liking:'attribute_liking',intensity:'sensory_intensity'}[q.facet];
      if (kind && peers.some(r => r.kind === kind)) continue;
      const key = canonical([family, logical]), copy = {...q,evidenceIDs:unique(peers.map(r => r.observationId)),mealIDs:[source.mealId],responseSourceID:source.observationId};
      if (!result.has(key) || result.get(key).score < copy.score) result.set(key, copy);
    }
  }
  return result;
}
