import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  canUseTbaFoodKnowledgeForSurface,
  inferTbaMenuContext,
  rankTbaFoodKnowledgeEntries,
} from '../src/lib/tbaFoodKnowledgeDataset';
import {
  TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
  TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT,
} from '../src/constants/tbaFoodKnowledgeRuntime';
import type { TbaFoodKnowledgeEntry } from '../src/types/tbaFoodOntology';

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), relativePath), 'utf8')) as T;
}

interface Catalog<T> {
  items: T[];
}

interface KoreanFoodItem {
  koName: string;
  englishName: string;
  scientificName: string;
  foodGroup: string;
  aliases: string[];
}

interface FoodOnItem {
  canonicalName: string;
  aliases: string[];
}

interface NativeFoodItem {
  koDishName: string;
  foodTypePath: string[];
  cookingMethodPath: string[];
}

const koreanCatalog = readJson<Catalog<KoreanFoodItem>>(
  'data/food-knowledge/normalized/korean-food-catalog.json',
);
const foodOnIndex = readJson<Catalog<FoodOnItem>>(
  'data/food-knowledge/normalized/foodon-taxonomy-index.json',
);
const nativeCatalog = readJson<Catalog<NativeFoodItem>>(
  'data/food-knowledge/normalized/native-food-catalog.json',
);
const bridge = readJson<Catalog<TbaFoodKnowledgeEntry>>(
  'data/food-knowledge/tba/tba-food-knowledge-bridge.json',
);

function textOf(value: unknown) {
  return JSON.stringify(value).toLowerCase();
}

function findKoreanFood(query: string) {
  return koreanCatalog.items.find((item) => textOf(item).includes(query.toLowerCase()));
}

function findFoodOn(query: string) {
  return foodOnIndex.items.find((item) => textOf(item).includes(query.toLowerCase()));
}

function findBridge(query: string) {
  return bridge.items.find((item) => textOf(item).includes(query.toLowerCase()));
}

function mockEntry(overrides: Partial<TbaFoodKnowledgeEntry>): TbaFoodKnowledgeEntry {
  return {
    aliases: [],
    canonicalName: '테스트 항목',
    confidence: 0.55,
    dishKindIds: [],
    foodGroup: '',
    foodOnIds: [],
    id: 'tba-food:test',
    ingredientSignalIds: [],
    kind: 'ingredient',
    koName: '테스트 항목',
    lexiconIds: [],
    nativeFoodIds: [],
    processSignalIds: [],
    sourceRefs: [],
    status: 'candidate',
    surfaces: {
      'chef-guide': false,
      'detail-tag': true,
      'dining-note': true,
      recommendation: false,
      tcs: true,
      'taste-bubble': true,
    },
    ...overrides,
  };
}

{
  const samples = [
    ['표고버섯', '버섯'],
    ['고등어', '어패'],
    ['돼지고기', '육류'],
    ['메밀', '곡류'],
  ] as const;

  for (const [query, expectedGroupText] of samples) {
    const item = findKoreanFood(query);
    assert.ok(item, `${query} should be normalized from Korean standard food DB`);
    assert.ok(item!.foodGroup.includes(expectedGroupText), `${query} should keep Korean food group`);
    assert.ok(item!.englishName.length > 0 || item!.scientificName.length > 0);
  }
}

{
  for (const query of ['shiitake', 'pork', 'grilled', 'fermented']) {
    assert.ok(findFoodOn(query), `${query} should be present in FoodOn taxonomy index`);
    assert.ok(findBridge(query), `${query} should be bridged into TBA food knowledge`);
  }
}

{
  const nativeFood = nativeCatalog.items.find((item) => item.koDishName === '가례불고기');
  assert.ok(nativeFood, '가례불고기 should be collected from native food catalog');
  assert.ok(nativeFood!.foodTypePath.includes('육류'));
  assert.ok(nativeFood!.cookingMethodPath.some((value) => value.includes('굽')));

  const nativeBridge = findBridge('가례불고기');
  assert.ok(nativeBridge, '가례불고기 should have a TBA bridge entry');
  assert.ok(nativeBridge!.dishKindIds.includes('meat'));
  assert.ok(nativeBridge!.dishKindIds.includes('grilled_smoked'));
  assert.ok(nativeBridge!.dishKindIds.includes('fermented_jang'));
}

{
  const bridgeText = textOf(bridge.items.slice(0, 500));
  for (const forbidden of ['energy_kcal', 'protein_g', 'fat_g', 'carbohydrate_g', 'nutrient', 'nutrition']) {
    assert.equal(bridgeText.includes(forbidden), false, `TBA bridge should not include nutrient field ${forbidden}`);
  }

  const apiKey = process.env.NONGSARO_API_KEY;
  if (apiKey && apiKey.length > 8) {
    assert.equal(textOf(bridge).includes(apiKey.toLowerCase()), false, 'API key must not be stored in bridge JSON');
    assert.equal(textOf(nativeCatalog).includes(apiKey.toLowerCase()), false, 'API key must not be stored in native catalog JSON');
  }
}

{
  const candidate = mockEntry({ confidence: 0.55, status: 'candidate' });
  const strongCandidate = mockEntry({ confidence: 0.8, status: 'candidate' });
  const active = mockEntry({ confidence: 0.8, status: 'active' });
  const retired = mockEntry({ confidence: 0.95, status: 'retired' });

  assert.equal(canUseTbaFoodKnowledgeForSurface(candidate, 'dining-note'), true);
  assert.equal(canUseTbaFoodKnowledgeForSurface(candidate, 'recommendation'), false);
  assert.equal(canUseTbaFoodKnowledgeForSurface(strongCandidate, 'chef-guide'), false);
  assert.equal(canUseTbaFoodKnowledgeForSurface(active, 'chef-guide'), true);
  assert.equal(canUseTbaFoodKnowledgeForSurface(retired, 'dining-note'), false);
  assert.equal(canUseTbaFoodKnowledgeForSurface(retired, 'recommendation'), false);
}

{
  const ranked = rankTbaFoodKnowledgeEntries(bridge.items, '가례불고기 돼지고기 숯불 간장', {
    limit: 5,
    surface: 'dining-note',
  });

  assert.ok(ranked.length > 0);
  assert.ok(ranked.some((candidate) => candidate.entry.dishKindIds.includes('meat')));
  assert.ok(ranked.some((candidate) => candidate.entry.lexiconIds.includes('lexicon:pork-savory-fat')));
}

{
  assert.equal(TBA_FOOD_KNOWLEDGE_RUNTIME_SOURCE_COUNT, bridge.items.length);
  assert.ok(TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES.length < bridge.items.length);
  assert.ok(TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES.length >= nativeCatalog.items.length);

  const runtimeNativeFood = TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES.find((entry) => entry.koName === '가례불고기');
  assert.ok(runtimeNativeFood, 'runtime subset should keep native food dishes for dining note matching');
  assert.ok(runtimeNativeFood!.dishKindIds.includes('meat'));
}

{
  const inferredColdNoodles = inferTbaMenuContext(
    TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
    '평양냉면',
  );

  assert.ok(inferredColdNoodles.dishKindIds.includes('grain_noodle'));
  assert.ok(inferredColdNoodles.dishKindIds.includes('cold'));
  assert.ok(inferredColdNoodles.ingredients.includes('면'));
  assert.ok(inferredColdNoodles.techniques.includes('차갑게'));

  const inferredNativeDish = inferTbaMenuContext(
    TBA_FOOD_KNOWLEDGE_RUNTIME_ENTRIES,
    '가례불고기',
  );

  assert.ok(inferredNativeDish.foodKnowledgeMatchIds.length > 0);
  assert.ok(inferredNativeDish.dishKindIds.includes('meat'));
  assert.ok(inferredNativeDish.ingredients.length > 0);
  assert.ok(inferredNativeDish.techniques.length > 0);
}

console.log('TBA food knowledge dataset tests passed');
