import { attributeIdentity, canonical, LIKING_VALUES, sameSelection, unique } from './personal-taste-insights.mjs';

// 빈 필드에 가능한 응답을 하나씩 넣어 현재 규칙의 해석 변화를 비교한다.
// 분기에는 확률을 붙이지 않으며, 가상 응답이나 가상 근거를 원자료·결과에 추가하지 않는다.
function decisionStates(model) {
  const states = new Map();
  for (const candidate of model.candidates) {
    const minimum = candidate.conditions.length ? model.policy.minConditionMeals : model.policy.minMeals;
    if (candidate.distribution.mealCount >= minimum) states.set(`liking:${canonical(candidate.conditions)}`, candidate.direction ?? candidate.status);
  }
  for (const pattern of model.fitPatterns) {
    const minimum = pattern.conditions.length ? model.policy.minConditionMeals : model.policy.minMeals;
    if (pattern.distribution.mealCount >= minimum) states.set(`fit:${canonical(pattern.conditions)}`, pattern.repeatedValue ?? pattern.status);
  }
  for (const pattern of model.overallPatterns) {
    const minimum = pattern.conditions.length ? model.policy.minConditionMeals : model.policy.minMeals;
    const repeated = pattern.cells.filter(cell => cell.mealIDs.length >= minimum).map(cell => [cell.overallValue, cell.attributeValue]);
    if (repeated.length) states.set(`overall:${canonical(pattern.conditions)}`, canonical(repeated));
  }
  return states;
}

function hypotheticalRecords(records, question, source, answer) {
  if (question.intent === 'exploration') {
    const seed = records.find(row => row.attribute === question.attribute && (row.reference ?? null) === (question.reference ?? null));
    if (!seed) return null;
    const base = { ...seed, observationId: '__question_liking__', experienceId: '__question_experience__', mealId: '__question_meal__',
      kind: 'attribute_liking', scale: 'attribute-three-category-v1', value: answer, target: 'unspecified', phase: 'unspecified',
      dishKindIDs: [], selectionEvidence: null, sourceSpans: [], conditionSources: [], phrase: '', confirmationStatus: 'explicit_user_choice' };
    return [...records, base, { ...base, observationId: '__question_intensity__', kind: 'sensory_intensity',
      scale: 'expression-strength-v1', value: question.proposedCondition.value }];
  }
  if (!source) return null;
  const belongs = row => row.experienceId === source.experienceId && attributeIdentity(row) === attributeIdentity(source)
    && row.target === source.target && row.phase === source.phase && sameSelection(row, source);
  if (question.facet === 'target' || question.facet === 'phase') {
    return records.map(row => belongs(row) ? { ...row, [question.facet]: answer } : row);
  }
  const kind = question.facet === 'liking' ? 'attribute_liking' : 'sensory_intensity';
  const scale = question.facet === 'liking' ? 'attribute-three-category-v1' : 'expression-strength-v1';
  // 충돌한 강도와 미응답은 다르다. 가상 답변으로 기존 모순을 지우지 않는다.
  if (records.some(row => belongs(row) && row.kind === kind)) return null;
  return [...records, { ...source, observationId: '__question_answer__', kind, scale, value: answer,
    phrase: '', sourceSpans: [], conditionSources: [], selectionEvidence: source.selectionEvidence
      ? { ...source.selectionEvidence, facet: question.facet, responseValue: answer, labelValue: '' } : null }];
}

export function assessQuestion(question, records, project, baseline) {
  const relevant = records.filter(row => attributeIdentity(row) === canonical([question.attribute, question.reference ?? null]));
  const source = question.intent === 'exploration' ? null : relevant.find(row => question.evidenceIDs.includes(row.observationId)
    && row.target === question.target && row.phase === question.phase
    && (question.facet !== 'liking' || row.kind === 'sensory_presence'));
  const responseSourceID = source?.observationId ?? null;
  const comparedMealCount = unique(relevant.map(row => row.mealId)).length;
  let answers;
  if (question.intent === 'exploration' || question.facet === 'liking') answers = LIKING_VALUES;
  else if (question.facet === 'intensity') answers = ['weak', 'medium', 'strong'];
  else answers = unique(relevant.map(row => row[question.facet]).filter(value => value && value !== 'unspecified'));
  const states = [decisionStates(baseline)];
  let alternativeCount = 0;
  // 어느 분기에서도 최소 관찰 수에 이르지 못하면 일반적인 미응답 보완으로 둔다.
  const relevantRatings = unique(relevant.filter(row => row.kind === 'attribute_liking' || row.kind === 'preference_fit').map(row => row.mealId)).length;
  if (relevantRatings + 1 >= Math.min(baseline.policy.minMeals, baseline.policy.minConditionMeals)) {
    for (const answer of answers) {
      const hypothetical = hypotheticalRecords(records, question, source, answer);
      if (!hypothetical) continue;
      states.push(decisionStates(project(hypothetical))); alternativeCount++;
    }
  }
  const keys = unique(states.flatMap(state => [...state.keys()]));
  const changedInterpretationCount = keys.filter(key => unique(states.map(state => state.get(key) ?? 'not_supported')).length > 1).length;
  return { ...question, responseSourceID, impact: { changedInterpretationCount, alternativeCount, comparedMealCount,
    basis: changedInterpretationCount ? 'answer_can_change_interpretation' : 'fills_missing_information' } };
}

export function questionPrecedes(left, right) {
  if (left.impact.changedInterpretationCount !== right.impact.changedInterpretationCount) return left.impact.changedInterpretationCount > right.impact.changedInterpretationCount;
  if (left.score !== right.score) return left.score > right.score;
  if (left.mealIDs.length !== right.mealIDs.length) return left.mealIDs.length > right.mealIDs.length;
  return left.key < right.key;
}
