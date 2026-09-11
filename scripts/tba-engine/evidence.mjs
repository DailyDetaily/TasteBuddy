import { createHash } from 'node:crypto';
import { SEMANTIC_CONTRACT } from '../tba-platform-pilot/rules.mjs';

export const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export const unique = values => [...new Set(values)].sort(compare);
export const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => compare(a, b))) : item);
export const digest = value => createHash('sha256').update(canonical(value)).digest('hex');
export const clone = value => structuredClone(value);
export const confirmed = record => ['explicit_user_choice', 'rule_extracted_statement'].includes(record.confirmationStatus);
export const scopeKey = record => canonical([record.experienceId, record.attribute, record.reference, record.target, record.phase]);
export const groupBy = (records, key) => {
  const groups = new Map();
  for (const record of records) {
    const id = key(record);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(record);
  }
  return [...groups].sort(([a], [b]) => compare(a, b));
};
export const coverage = records => ({
  experiences: unique(records.map(r => r.experienceId)).length,
  meals: unique(records.map(r => r.mealId)).length,
  observations: unique(records.map(r => r.observationId).filter(Boolean)).length,
  independentSamples: null,
});
export const refs = records => unique(records.map(r => r.observationId).filter(Boolean));
export const scope = records => ({
  foodIds: unique(records.map(r => r.foodId)),
  experienceIds: unique(records.map(r => r.experienceId)),
  mealIds: unique(records.map(r => r.mealId)),
  targets: unique(records.map(r => r.target)),
  phases: unique(records.map(r => r.phase)),
});
export const attributeLabel = attribute => ({
  'taste.sweet': '단맛', 'taste.sour': '산미', 'taste.salty': '짠맛', 'taste.bitter': '쓴맛', 'taste.umami': '감칠맛',
  'flavor.ingredient_character': '재료 본연의 맛', 'flavor.nutty_savory': '고소함', 'flavor.cereal_savory': '구수함',
  'flavor.fresh': '산뜻한 맛', 'flavor.rich': '농밀한 풍미', 'flavor.fermented': '발효 풍미', 'flavor.balance': '맛의 균형',
  'aroma.roasted': '구운 향', 'aroma.smoky': '불향', 'aroma.fermented': '발효향', 'aroma.nutty': '견과류 향',
  'aroma.fruity': '과일향', 'aroma.floral': '꽃향', 'aroma.herbal': '허브향',
  'trigeminal.spicy': '매운 자극', 'trigeminal.numbing': '얼얼함', 'trigeminal.pungent': '알싸함',
  'trigeminal.fizzy': '탄산감', 'mouthfeel.fatty': '기름진 풍미',
  'texture.crisp': '바삭함', 'texture.chewy': '쫄깃함', 'texture.soft': '부드러운 식감',
}[attribute] ?? SEMANTIC_CONTRACT.attributes.find(item => item.id === attribute)?.meaning.split('.')[0] ?? attribute);

// '안 달아서 좋다'의 긍정을 단맛 자체의 호감으로 확장하지 않는다.
export function qualifiedLiking(record, records) {
  return records.some(other => confirmed(other) && other.kind === 'sensory_presence' && other.value === false
    && scopeKey(other) === scopeKey(record));
}

export function evidenceQuotes(records) {
  return records.map(record => ({
    observationId: record.observationId,
    foodId: record.foodId,
    foodName: record.foodName,
    quote: record.phrase,
    target: record.target,
    phase: record.phase,
    kind: record.kind,
    attribute: record.attribute,
    value: record.value,
    confirmationStatus: record.confirmationStatus,
    sourceAnswerRefs: clone(record.sourceAnswerRefs),
  }));
}
