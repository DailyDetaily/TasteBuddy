import assert from 'node:assert/strict';

import { TASTE_IDS } from '../src/constants/designTokens';
import { DISH_KIND_OPTIONS, inferDishKindIds } from '../src/constants/dishKindTags';
import { TBA_CORE_TASTE_LEXICON } from '../src/constants/tbaCoreTasteLexicon';
import { TASTE_SURVEY_CONTEXT_STEPS } from '../src/constants/tasteSurveyConfig';
import { TASTE_SURVEY_ITEMS } from '../src/constants/tasteSurveyItems';
import {
  buildTasteSurveyCompatibleResult,
  scoreTasteSurveyResponses,
} from '../src/lib/tasteSurveyScoring';
import {
  buildTasteIdentity,
  buildDiningNote,
  computeTasteSimilarity,
  generateTasteMatchFeed,
  getDefaultDiningReviews,
  getDefaultPublicTasteProfiles,
  ingestDiningReview,
  publishTasteProfile,
  TasteBuddyAgent,
} from '../src/lib/tasteBuddyAgent';
import {
  calculateLexiconConfidence,
  canUseLexiconForSurface,
  normalizeLexiconDishKindAffinity,
  rankLexiconForDishKinds,
} from '../src/lib/tbaKnowledge';
import {
  buildTasteSurveyMeasurementRawPayload,
  sanitizeTasteSurveyRespondentContext,
} from '../src/lib/tasteSurveyPersistence';
import type { TbaKnowledgeSurface } from '../src/types/tasteBuddyKnowledge';
import type { TasteSurveyRespondentContext, TasteSurveyResponse } from '../src/types/tasteSurvey';

function response(
  itemId: string,
  selectedValue: TasteSurveyResponse['selectedValue'],
  uncertain = false,
): TasteSurveyResponse {
  return {
    itemId,
    selectedValue: uncertain ? null : selectedValue,
    uncertain,
  };
}

function responsesForTaste(
  tasteId: string,
  selectedValue: TasteSurveyResponse['selectedValue'],
): TasteSurveyResponse[] {
  return TASTE_SURVEY_ITEMS
    .filter((item) => item.tasteId === tasteId)
    .map((item) => response(item.id, selectedValue));
}

function assertClose(actual: number, expected: number, message: string) {
  assert.ok(
    Math.abs(actual - expected) < 0.0001,
    `${message}: expected ${expected}, received ${actual}`,
  );
}

{
  const low = scoreTasteSurveyResponses(responsesForTaste('sweet', 1));
  const high = scoreTasteSurveyResponses(responsesForTaste('sweet', 7));

  assert.equal(low.snapshot.results.sweet, 0);
  assert.equal(high.snapshot.results.sweet, 10);
}

{
  const sweetItems = TASTE_SURVEY_ITEMS.filter((item) => item.tasteId === 'sweet');
  const scored = scoreTasteSurveyResponses([
    response(sweetItems[0].id, 7),
    response(sweetItems[1].id, null, true),
  ]);

  assert.equal(scored.snapshot.results.sweet, 10);
  assert.equal(scored.tasteScores.sweet.excludedItemCount, 1);
  assert.equal(scored.tasteScores.sweet.respondedItemCount, 1);
}

{
  const bitter = scoreTasteSurveyResponses(responsesForTaste('bitter', 7));
  const umami = scoreTasteSurveyResponses(responsesForTaste('umami', 7));
  const fat = scoreTasteSurveyResponses(responsesForTaste('fat', 7));

  assert.ok(umami.tasteScores.umami.confidence < bitter.tasteScores.bitter.confidence);
  assert.ok(fat.tasteScores.fat.confidence < bitter.tasteScores.bitter.confidence);
}

{
  const sweetItems = TASTE_SURVEY_ITEMS.filter((item) => item.tasteId === 'sweet');
  const scored = scoreTasteSurveyResponses([
    response(sweetItems.find((item) => item.construct === 'salience')!.id, 1),
    response(sweetItems.find((item) => item.construct === 'overload')!.id, 7),
  ]);

  assertClose(scored.tasteScores.sweet.baseVectorScore ?? -1, 0.42, 'weighted score');
  assert.equal(scored.snapshot.results.sweet, 4.2);
}

{
  const result = buildTasteSurveyCompatibleResult(
    TASTE_SURVEY_ITEMS.map((item) => response(item.id, 4)),
  );

  assert.equal(result.snapshot.source, 'broad-starter');
  assert.equal(typeof result.snapshot.measuredAt, 'string');

  for (const tasteId of TASTE_IDS) {
    assert.equal(typeof result.snapshot.results[tasteId], 'number');
  }

  assert.ok(Array.isArray(result.starterGuidance.topAxes));
  assert.ok(result.starterGuidance.topAxes.length > 0);
  assert.equal(typeof result.starterGuidance.summaryLine, 'string');
  assert.equal(typeof result.starterGuidance.goalPhrase, 'string');
  assert.equal(typeof result.starterGuidance.cautionAxis, 'string');
  assert.equal(typeof result.starterGuidance.cautionLabel, 'string');
  assert.ok(Array.isArray(result.starterGuidance.evidence));
  assert.ok(result.starterGuidance.evidence.length > 0);
}

{
  const scored = scoreTasteSurveyResponses([]);

  for (const tasteId of TASTE_IDS) {
    assert.equal(scored.snapshot.results[tasteId], null);
  }
}

{
  assert.equal(TASTE_SURVEY_CONTEXT_STEPS.length, 3);
  assert.equal(TASTE_SURVEY_CONTEXT_STEPS[0].options.length, 0);
  assert.deepEqual(
    TASTE_SURVEY_CONTEXT_STEPS.map((step) => step.id),
    ['birthDate', 'sexContext', 'smokingStatus'],
  );
}

{
  const respondentContext: TasteSurveyRespondentContext = {
    birthDate: '1996-07-10',
    sexContext: 'prefer_not_to_say',
    smokingStatus: 'current',
  };
  const responses = TASTE_SURVEY_ITEMS.map((item) => response(item.id, 4));
  const result = buildTasteSurveyCompatibleResult(responses);
  const rawPayload = buildTasteSurveyMeasurementRawPayload({
    compatibleResult: result,
    respondentContext,
    responses,
  });

  assert.equal(rawPayload.measurement_flow, 'taste_survey');
  assert.equal(rawPayload.respondent_context.birth_date, '1996-07-10');
  assert.equal(rawPayload.respondent_context.sex_context, 'prefer_not_to_say');
  assert.equal(rawPayload.respondent_context.smoking_status, 'current');
  assert.equal(rawPayload.response_count, responses.length);
}

{
  const responses = TASTE_SURVEY_ITEMS.map((item) => response(item.id, 4));
  const result = buildTasteSurveyCompatibleResult(responses);
  const rawPayload = buildTasteSurveyMeasurementRawPayload({
    compatibleResult: result,
    respondentContext: {},
    responses,
  });

  assert.equal(rawPayload.respondent_context.birth_date, null);
  assert.equal(rawPayload.respondent_context.sex_context, null);
  assert.equal(rawPayload.respondent_context.smoking_status, null);
  assert.equal(rawPayload.response_count, responses.length);
}

{
  const sanitized = sanitizeTasteSurveyRespondentContext({
    birthDate: '1990-03-14',
    sexContext: 'unknown',
    smokingStatus: 'former',
  });

  assert.deepEqual(sanitized, {
    birthDate: '1990-03-14',
    smokingStatus: 'former',
  });
}

{
  const viewer = buildTasteIdentity({
    feedbackCount: 4,
    measurementSnapshot: {
      measuredAt: '2026-05-27T00:00:00.000Z',
      results: {
        bitter: 4.5,
        fat: 5.1,
        salty: 4.8,
        sour: 7.6,
        sweet: 4.4,
        umami: 7.1,
      },
      source: 'measured',
    },
    reviewCount: 4,
    userId: 'viewer',
  });
  const publicProfiles = getDefaultPublicTasteProfiles();
  const similar = computeTasteSimilarity(viewer, publicProfiles[0].snapshot);
  const different = computeTasteSimilarity(viewer, publicProfiles[1].snapshot);

  assert.ok(similar.similarityScore > different.similarityScore);
  assert.ok(similar.sharedSignals.length > 0);
}

{
  const profile = buildTasteIdentity({
    measurementSnapshot: {
      measuredAt: '2026-05-27T00:00:00.000Z',
      results: {
        bitter: 5,
        fat: 5,
        salty: 5,
        sour: 5,
        sweet: 5,
        umami: 5,
      },
      source: 'broad-starter',
    },
    userId: 'private-user',
  });
  const publicProfile = publishTasteProfile(profile);

  assert.equal(publicProfile.visibility, 'private');
}

{
  const viewer = getDefaultPublicTasteProfiles()[0].snapshot;
  const privateReview = ingestDiningReview({
    id: 'private-review',
    rating: 5,
    restaurantId: 'private-place',
    restaurantName: '비공개 장소',
    reviewerId: 'taste-public-mina',
    tasteTags: ['fresh'],
    visibility: 'private',
  });
  const feed = generateTasteMatchFeed({
    reviews: [...getDefaultDiningReviews(), privateReview],
    viewerProfile: viewer,
  });

  assert.ok(feed.length > 0);
  assert.equal(feed.some((item) => item.restaurantId === 'private-place'), false);
  assert.ok(feed.every((item) => typeof item.reason === 'string' && item.reason.length > 0));
}

{
  const brightAcidity = TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === 'bright-acidity')!;
  const mergedSeafood = normalizeLexiconDishKindAffinity({
    ...brightAcidity,
    dishKindAffinity: {
      fish: 0.4,
      seafood: 0.6,
      shellfish: 0.8,
    },
  });
  const mergedVegetable = normalizeLexiconDishKindAffinity({
    ...brightAcidity,
    dishKindAffinity: {
      herb: 0.55,
      salad: 0.7,
      vegetable: 0.5,
    },
  });
  const mergedGrilled = normalizeLexiconDishKindAffinity({
    ...brightAcidity,
    dishKindAffinity: {
      grilled: 0.4,
      roasted: 0.85,
      smoked: 0.72,
    },
  });

  assert.equal(mergedSeafood.seafood, 0.8);
  assert.equal(mergedVegetable.vegetable_herb, 0.7);
  assert.equal(mergedGrilled.grilled_smoked, 0.85);
}

{
  const brightAcidity = TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === 'bright-acidity')!;
  const retiredEntry = { ...brightAcidity, status: 'retired' as const };
  const lowConfidenceEntry = {
    ...brightAcidity,
    dishKindAffinity: {},
    initialConfidence: 0.3,
  };
  const activeSeafoodEntry = {
    ...brightAcidity,
    initialConfidence: 0.5,
    status: 'active' as const,
  };
  const allSurfaces: TbaKnowledgeSurface[] = [
    'taste-bubble',
    'detail-tag',
    'dining-note',
    'recommendation',
    'chef-guide',
    'tcs',
  ];

  assert.equal(canUseLexiconForSurface(brightAcidity, 'taste-bubble'), true);
  assert.equal(canUseLexiconForSurface(brightAcidity, 'dining-note'), true);
  assert.equal(canUseLexiconForSurface(brightAcidity, 'chef-guide', { dishKindIds: ['seafood'] }), false);
  allSurfaces.forEach((surface) => {
    assert.equal(canUseLexiconForSurface(retiredEntry, surface, { dishKindIds: ['seafood'] }), false);
  });
  assert.equal(canUseLexiconForSurface(lowConfidenceEntry, 'recommendation'), false);
  assert.equal(canUseLexiconForSurface(activeSeafoodEntry, 'chef-guide', { dishKindIds: ['seafood'] }), true);
  assert.equal(canUseLexiconForSurface(activeSeafoodEntry, 'tcs', { appFeedbackConfidence: 1, evidenceCount: 10 }), false);
}

{
  const seafoodRanked = TasteBuddyAgent.rankCoreTasteLexiconForDishKinds(
    TBA_CORE_TASTE_LEXICON,
    ['seafood'],
    { limit: 5, surface: 'taste-bubble' },
  );
  const dessertRanked = rankLexiconForDishKinds(
    TBA_CORE_TASTE_LEXICON,
    ['dessert'],
    { limit: 5, surface: 'taste-bubble' },
  );
  const brightAcidity = TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === 'bright-acidity')!;
  const customKindConfidence = calculateLexiconConfidence(brightAcidity, {
    dishKindIds: ['custom-dish-kind:향신료'],
  });

  assert.ok(seafoodRanked.length > 0);
  assert.ok(seafoodRanked[0].dishKindScore >= 0.8);
  assert.ok(seafoodRanked.slice(0, 5).some((candidate) => (
    ['briny-sea', 'seafood-aroma', 'white-fish-clean', 'shellfish-sweetness'].includes(candidate.entry.id)
  )));
  assert.ok(dessertRanked.length > 0);
  assert.ok(dessertRanked[0].dishKindScore >= 0.8);
  assert.ok(dessertRanked.slice(0, 5).some((candidate) => (
    ['caramel-sweetness', 'chocolate-bitter-sweet', 'clean-sweetness'].includes(candidate.entry.id)
  )));
  assertClose(customKindConfidence, brightAcidity.initialConfidence, 'custom dish kind confidence');
}

{
  const docs = TasteBuddyAgent.buildCoreTasteKnowledgeDocs(TBA_CORE_TASTE_LEXICON);
  const brightAcidity = TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === 'bright-acidity')!;
  const brightDoc = TasteBuddyAgent.buildKnowledgeDocFromLexicon(brightAcidity);
  const mushroomDoc = TasteBuddyAgent.buildKnowledgeDocFromLexicon(
    TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === 'mushroom-earthy-umami')!,
  );
  const activeSeafoodDoc = TasteBuddyAgent.buildKnowledgeDocFromLexicon({
    ...brightAcidity,
    initialConfidence: 0.5,
    status: 'active' as const,
  });
  const retiredDoc = TasteBuddyAgent.buildKnowledgeDocFromLexicon({
    ...brightAcidity,
    status: 'retired' as const,
  });
  const seafoodDocs = TasteBuddyAgent.rankKnowledgeDocsForDishKinds(docs, ['seafood'], {
    limit: 5,
    surface: 'dining-note',
  });
  const dessertDocs = TasteBuddyAgent.rankKnowledgeDocsForDishKinds(docs, ['dessert'], {
    limit: 5,
    surface: 'dining-note',
  });

  assert.equal(docs.length, TBA_CORE_TASTE_LEXICON.length);
  assert.equal(TasteBuddyAgent.coreTasteKnowledgeDocs.length, TBA_CORE_TASTE_LEXICON.length);
  assert.equal(brightDoc.id, 'core-taste-lexicon:bright-acidity');
  assert.deepEqual(brightDoc.lexiconIds, ['bright-acidity']);
  assert.equal(brightDoc.primaryLexiconId, 'bright-acidity');
  assert.equal(brightDoc.docType, 'core-taste-lexicon');
  assert.equal(brightDoc.title, '산뜻한 산미');
  assert.ok(brightDoc.dishKindIds.includes('seafood'));
  assert.ok(brightDoc.dishKindIds.includes('vegetable_herb'));
  assert.ok(brightDoc.searchableText.includes('fresh acidity'));
  assert.ok(brightDoc.confidence.combined >= brightDoc.confidence.lexicon);
  assert.ok(mushroomDoc.ingredientHints.includes('표고버섯'));
  assert.ok(mushroomDoc.ingredientTaxonomyIds.includes('foodon-bridge:ingredient:shiitake'));
  assert.ok(mushroomDoc.sourceNotes.includes('foodon-taxonomy'));
  assert.equal(TasteBuddyAgent.canUseKnowledgeDocForSurface(brightDoc, 'dining-note'), true);
  assert.equal(TasteBuddyAgent.canUseKnowledgeDocForSurface(brightDoc, 'chef-guide'), false);
  assert.equal(TasteBuddyAgent.canUseKnowledgeDocForSurface(activeSeafoodDoc, 'chef-guide'), true);
  assert.equal(TasteBuddyAgent.canUseKnowledgeDocForSurface(retiredDoc, 'dining-note'), false);
  assert.ok(seafoodDocs.some((candidate) => (
    ['briny-sea', 'seafood-aroma', 'white-fish-clean', 'shellfish-sweetness'].includes(candidate.doc.primaryLexiconId)
  )));
  assert.ok(dessertDocs.some((candidate) => (
    ['caramel-sweetness', 'chocolate-bitter-sweet', 'clean-sweetness'].includes(candidate.doc.primaryLexiconId)
  )));
  assert.equal(
    TasteBuddyAgent.filterKnowledgeDocsForSurface([retiredDoc], 'recommendation').length,
    0,
  );
}

{
  const docs = TasteBuddyAgent.buildCoreTasteKnowledgeDocs(TBA_CORE_TASTE_LEXICON);
  const seafoodRetrieval = TasteBuddyAgent.retrieveKnowledgeDocs({
    detailTags: ['clean finish'],
    dishKindTags: ['seafood'],
    docs,
    queryText: '제철 생선과 맑은 소스',
    tasteTags: ['맑은 감칠맛'],
  });
  const dessertRetrieval = TasteBuddyAgent.retrieveKnowledgeDocs({
    detailTags: ['fruit aroma'],
    dishKindTags: ['dessert'],
    docs,
    queryText: '오미자와 배 디저트',
    tasteTags: ['깔끔한 단맛'],
  });
  const aliasRetrieval = TasteBuddyAgent.retrieveKnowledgeDocs({
    detailTags: [],
    dishKindTags: ['custom-dish-kind:향신료'],
    docs,
    queryText: '직접 입력 메뉴',
    tasteTags: ['fresh acidity'],
  });
  const foodOnRetrieval = TasteBuddyAgent.retrieveKnowledgeDocs({
    docs,
    ingredients: ['표고버섯'],
    queryText: '표고버섯 숯불 구이',
    techniques: ['charcoal broiling'],
  });
  const brightAcidity = TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === 'bright-acidity')!;
  const retiredRetrieval = TasteBuddyAgent.retrieveKnowledgeDocs({
    docs: [
      TasteBuddyAgent.buildKnowledgeDocFromLexicon({
        ...brightAcidity,
        status: 'retired' as const,
      }),
    ],
    queryText: 'fresh acidity',
    tasteTags: ['fresh acidity'],
  });
  const emptyRetrieval = TasteBuddyAgent.retrieveKnowledgeDocs({
    docs,
  });

  assert.ok(seafoodRetrieval.candidates.length > 0);
  assert.equal(seafoodRetrieval.surface, 'dining-note');
  assert.ok(seafoodRetrieval.candidates.some((candidate) => (
    ['clear-umami', 'briny-sea', 'white-fish-clean'].includes(candidate.doc.primaryLexiconId)
  )));
  assert.ok(seafoodRetrieval.candidates[0].matchedSignals.some((signal) => signal.kind === 'dish-kind'));
  assert.ok(seafoodRetrieval.candidates[0].matchedSignals.some((signal) => (
    signal.kind === 'taste-tag' || signal.kind === 'detail-tag' || signal.kind === 'query'
  )));
  assert.ok(dessertRetrieval.candidates.some((candidate) => (
    ['clean-sweetness', 'fruit-aroma', 'caramel-sweetness'].includes(candidate.doc.primaryLexiconId)
  )));
  assert.equal(aliasRetrieval.candidates[0]?.doc.primaryLexiconId, 'bright-acidity');
  assert.equal(aliasRetrieval.candidates[0]?.dishKindScore, 0);
  assert.ok(aliasRetrieval.candidates[0]?.textScore ?? 0 > 0);
  assert.ok(foodOnRetrieval.candidates.some((candidate) => candidate.doc.primaryLexiconId === 'mushroom-earthy-umami'));
  assert.ok(foodOnRetrieval.candidates.some((candidate) => candidate.doc.primaryLexiconId === 'charcoal-grilled'));
  assert.ok(foodOnRetrieval.candidates.some((candidate) => (
    candidate.matchedSignals.some((signal) => signal.kind === 'foodon')
  )));
  assert.equal(retiredRetrieval.candidates.length, 0);
  assert.equal(emptyRetrieval.candidates.length, 0);
}

{
  const seafoodMapping = TasteBuddyAgent.mapCoreTasteLexiconSignalsForDiningNote({
    detailTags: ['clean finish'],
    dishKindTags: ['seafood'],
    subject: '제철 생선과 맑은 소스',
    tasteTags: ['맑은 감칠맛'],
  });
  const dessertMapping = TasteBuddyAgent.mapCoreTasteLexiconSignalsForDiningNote({
    detailTags: ['fruit aroma'],
    dishKindTags: ['dessert'],
    subject: '오미자와 배 디저트',
    tasteTags: ['깔끔한 단맛'],
  });
  const aliasMapping = TasteBuddyAgent.mapCoreTasteLexiconSignalsForDiningNote({
    detailTags: [],
    dishKindTags: ['meat'],
    subject: '테스트 메뉴',
    tasteTags: ['fresh acidity'],
  });
  const customKindMapping = TasteBuddyAgent.mapCoreTasteLexiconSignalsForDiningNote({
    detailTags: [],
    dishKindTags: ['custom-dish-kind:향신료'],
    subject: '직접 입력 메뉴',
    tasteTags: ['fresh acidity'],
  });
  const foodOnMapping = TasteBuddyAgent.mapCoreTasteLexiconSignalsForDiningNote({
    detailTags: [],
    dishKindTags: [],
    subject: '표고버섯 숯불 구이',
    tasteTags: [],
  });

  assert.ok(seafoodMapping.lexiconCandidates.some((candidate) => (
    ['clear-umami', 'briny-sea', 'seafood-aroma', 'white-fish-clean'].includes(candidate.entry.id)
  )));
  assert.ok(seafoodMapping.tasteBubbleLabels.some((label) => (
    ['맑은 감칠맛', '해수 감칠맛', '흰살 생선의 맑음'].includes(label)
  )));
  assert.ok(Object.keys(seafoodMapping.tasteVector).length > 0);
  assert.ok(Object.keys(seafoodMapping.perceptualVector).length > 0);
  assert.ok(dessertMapping.lexiconCandidates.some((candidate) => (
    ['clean-sweetness', 'fruit-aroma', 'caramel-sweetness', 'chocolate-bitter-sweet'].includes(candidate.entry.id)
  )));
  assert.ok(dessertMapping.tasteBubbleLabels.some((label) => (
    ['깔끔한 단맛', '과일 향', '캐러멜 단맛', '초콜릿 쓴단맛'].includes(label)
  )));
  assert.ok(aliasMapping.lexiconCandidates.some((candidate) => candidate.entry.id === 'bright-acidity'));
  assert.equal(customKindMapping.lexiconCandidates[0]?.entry.id, 'bright-acidity');
  assert.equal(customKindMapping.lexiconCandidates[0]?.dishKindScore, 0);
  assert.ok(foodOnMapping.foodOnMatches.some((match) => match.entry.id === 'foodon-bridge:ingredient:shiitake'));
  assert.ok(foodOnMapping.tbaSignalIds.includes('ingredient:mushroom'));
  assert.ok(foodOnMapping.lexiconCandidates.some((candidate) => (
    candidate.entry.id === 'mushroom-earthy-umami' && candidate.foodOnScore > 0
  )));
  assert.ok(foodOnMapping.lexiconCandidates.some((candidate) => (
    candidate.entry.id === 'charcoal-grilled' && candidate.foodOnScore > 0
  )));
}

{
  const note = buildDiningNote({
    detailTags: ['clean finish'],
    dishKindTags: ['seafood'],
    id: 'lexicon-note',
    restaurantName: '정식당',
    subject: '제철 생선과 맑은 소스',
    tasteTags: ['fresh acidity'],
  });
  const fallbackNote = buildDiningNote({
    detailTags: [],
    dishKindTags: [],
    id: 'fallback-note',
    restaurantName: '테스트 식당',
    subject: '알 수 없는 메뉴',
    tasteTags: ['unknown-signal'],
  });
  const foodOnAwareNote = buildDiningNote({
    detailTags: [],
    dishKindTags: [],
    id: 'foodon-aware-note',
    ingredients: ['표고버섯'],
    restaurantName: '테스트 식당',
    subject: '표고버섯 숯불 구이',
    tasteTags: [],
    techniques: ['charcoal broiling'],
  });
  const foodOnAwareSnapshot = TasteBuddyAgent.buildDiningAnalysisSnapshot({
    detailTags: [],
    dishKindTags: [],
    id: 'foodon-aware-snapshot',
    ingredients: ['표고버섯'],
    restaurantName: '테스트 식당',
    subject: '표고버섯 숯불 구이',
    tasteTags: [],
    techniques: ['charcoal broiling'],
  });
  const foodKnowledgeAwareSnapshot = TasteBuddyAgent.buildDiningAnalysisSnapshot({
    detailTags: [],
    dishKindTags: [],
    id: 'food-knowledge-aware-snapshot',
    ingredients: ['돼지고기', '간장'],
    restaurantName: '테스트 식당',
    subject: '가례불고기',
    tasteTags: [],
    techniques: ['숯불 구이'],
  });
  const backRibKindIds = inferDishKindIds({ title: '백립' });
  const backRibNote = buildDiningNote({
    detailTags: ['balance-finish-heavy', 'balance-intensity-high'],
    dishKindTags: backRibKindIds,
    id: 'back-rib-note',
    restaurantName: '테스트 식당',
    reviewSnippet: '직접 입력한 메뉴라 사용자가 남긴 감각 단서가 가장 중요한 기준입니다.',
    subject: '백립',
    tasteTags: ['fermented', 'savory'],
  });
  const brightAcidity = TBA_CORE_TASTE_LEXICON.find((entry) => entry.id === 'bright-acidity')!;
  const retiredMapping = TasteBuddyAgent.mapCoreTasteLexiconSignalsForDiningNote({
    detailTags: [],
    dishKindTags: ['seafood'],
    entries: [{ ...brightAcidity, status: 'retired' }],
    subject: '제철 생선과 맑은 소스',
    tasteTags: ['fresh acidity'],
  });

  assert.ok(note.tasteBubbles.some((bubble) => bubble.label === '산뜻한 산미'));
  assert.ok(note.detailTags.some((tag) => tag.label === '깔끔한 마무리'));
  assert.equal(typeof note.summary, 'string');
  assert.ok(note.summary.length > 0);
  assert.equal(retiredMapping.lexiconCandidates.length, 0);
  assert.ok(fallbackNote.tasteBubbles.length > 0);
  assert.ok(fallbackNote.detailTags.length > 0);
  assert.equal(fallbackNote.tasteBubbles.some((bubble) => bubble.label === '산뜻한 산미'), false);
  assert.ok(foodOnAwareNote.tasteBubbles.some((bubble) => bubble.label === '버섯 흙내음 감칠맛'));
  assert.ok(foodOnAwareNote.detailTags.some((tag) => tag.label === '숯불 구이'));
  assert.ok(foodOnAwareNote.summary.includes('버섯 흙내음 감칠맛'));
  assert.equal(foodOnAwareSnapshot.source, 'TasteBuddyAgent');
  assert.equal(foodOnAwareSnapshot.summary, foodOnAwareNote.summary);
  assert.ok(foodOnAwareSnapshot.confidence > 0);
  assert.ok(foodOnAwareSnapshot.foodOnMatchIds.includes('foodon-bridge:ingredient:shiitake'));
  assert.ok(foodOnAwareSnapshot.lexiconCandidateIds.includes('mushroom-earthy-umami'));
  assert.ok(foodKnowledgeAwareSnapshot.foodKnowledgeMatchIds.includes('tba-food:native:91511'));
  assert.ok(foodKnowledgeAwareSnapshot.tbaSignalIds.includes('ingredient:pork'));
  assert.ok(foodKnowledgeAwareSnapshot.tbaSignalIds.includes('dish-kind:grilled_smoked'));
  assert.ok(foodKnowledgeAwareSnapshot.lexiconCandidateIds.includes('pork-savory-fat'));
  assert.ok(backRibNote.detailTags.some((tag) => tag.label === '마무리가 무거움'));
  assert.equal(backRibNote.summary.includes('balance-finish-heavy'), false);
  assert.equal(backRibNote.summary.includes('직접 입력한 메뉴'), false);
  assert.ok(backRibKindIds.includes('meat'));
}

{
  const signalIds = TasteBuddyAgent.signalTaxonomy.map((definition) => definition.id);
  const uniqueSignalIds = new Set(signalIds);
  const lexiconSignalIds = TasteBuddyAgent.mapCoreLexiconToSignalIds([
    'bright-acidity',
    'clean-finish',
  ]);

  assert.equal(uniqueSignalIds.size, signalIds.length);
  assert.equal(TasteBuddyAgent.signalById['dish-kind:seafood']?.label, '해산물');
  assert.deepEqual(lexiconSignalIds, ['lexicon:bright-acidity', 'lexicon:clean-finish']);
}

{
  const dishKindMapping = TasteBuddyAgent.mapFeedbackInputToSignals({
    dishKindTags: DISH_KIND_OPTIONS.map((option) => option.id),
  });
  const mappedDishKindIds = dishKindMapping.byDomain['dish-kind']?.map((signal) => signal.definition.id) ?? [];

  assert.equal(mappedDishKindIds.length, DISH_KIND_OPTIONS.length);
  assert.ok(mappedDishKindIds.includes('dish-kind:seafood'));
  assert.ok(mappedDishKindIds.includes('dish-kind:dessert'));
  assert.equal(dishKindMapping.unmappedTags.length, 0);
}

{
  const acidityMatches = TasteBuddyAgent.findSignalDefinitionsByText('fresh acidity', {
    domains: ['taste-bubble'],
    limit: 3,
  });
  const finishMatches = TasteBuddyAgent.findSignalDefinitionsByText('clean finish', {
    domains: ['perceptual-detail'],
    limit: 3,
  });
  const unknownMapping = TasteBuddyAgent.mapTagsToSignals(['알수없는신호'], {
    source: 'detail-tag',
  });

  assert.equal(acidityMatches[0]?.definition.id, 'lexicon:bright-acidity');
  assert.equal(finishMatches[0]?.definition.id, 'lexicon:clean-finish');
  assert.equal(unknownMapping.mappedSignals.length, 0);
  assert.deepEqual(unknownMapping.unmappedTags, [{ source: 'detail-tag', value: '알수없는신호' }]);
}

{
  const feedbackMapping = TasteBuddyAgent.mapFeedbackInputToSignals({
    detailTags: ['흰살생선', '숯불', '발효'],
    dishKindTags: ['seafood'],
    tasteTags: ['fresh acidity'],
  });
  const mappedIds = feedbackMapping.mappedSignals.map((signal) => signal.definition.id);

  assert.ok(mappedIds.includes('dish-kind:seafood'));
  assert.ok(mappedIds.includes('lexicon:bright-acidity'));
  assert.ok(mappedIds.includes('ingredient:white-fish'));
  assert.ok(mappedIds.includes('process:charcoal'));
  assert.ok(mappedIds.includes('process:fermented'));
  assert.ok(feedbackMapping.byDomain['taste-bubble']?.some((signal) => signal.definition.id === 'lexicon:bright-acidity'));
  assert.ok(feedbackMapping.byDomain['ingredient-kind']?.some((signal) => signal.definition.id === 'ingredient:white-fish'));
  assert.ok(feedbackMapping.byDomain['cooking-process']?.some((signal) => signal.definition.id === 'process:charcoal'));
}

{
  const shiitakeMatches = TasteBuddyAgent.findFoodOnBridgeEntriesByText('표고');
  const charcoalMatches = TasteBuddyAgent.findFoodOnBridgeEntriesByText('charcoal broiling');
  const mappedFood = TasteBuddyAgent.mapFoodOnBridgeInput({
    dishKindTags: ['seafood'],
    ingredients: ['표고버섯', '흰살생선'],
    menuText: '숯불 흰살 생선과 표고 육수',
    techniques: ['charcoal broiling', 'food fermentation'],
  });

  assert.equal(TasteBuddyAgent.foodOnBridgeVersion, '0.1');
  assert.equal(TasteBuddyAgent.foodOnReferenceLicense, 'CC BY 4.0');
  assert.equal(shiitakeMatches[0]?.entry.id, 'foodon-bridge:ingredient:shiitake');
  assert.equal(charcoalMatches[0]?.entry.foodOnIri, 'http://purl.obolibrary.org/obo/FOODON_03450007');
  assert.ok(mappedFood.matches.some((match) => match.entry.id === 'foodon-bridge:ingredient:shiitake'));
  assert.ok(mappedFood.matches.some((match) => match.entry.id === 'foodon-bridge:process:charcoal-broiling'));
  assert.ok(mappedFood.tbaSignalIds.includes('ingredient:mushroom'));
  assert.ok(mappedFood.tbaSignalIds.includes('ingredient:white-fish'));
  assert.ok(mappedFood.tbaSignalIds.includes('process:charcoal'));
  assert.ok(mappedFood.tbaSignalIds.includes('process:fermented'));
  assert.ok(mappedFood.tbaSignalIds.includes('lexicon:white-fish-clean'));
}

{
  const garlicMatches = TasteBuddyAgent.findFoodOnBridgeEntriesByText('마늘');
  const stirFryMatches = TasteBuddyAgent.findFoodOnBridgeEntriesByText('stir-frying');
  const everydayFood = TasteBuddyAgent.mapFoodOnBridgeInput({
    ingredients: ['달걀', '두부', '마늘', '토마토', '김', '쌀', '고추장', '참기름', '커피'],
    menuText: '토마토 달걀 볶음과 김밥',
    techniques: ['볶음', '삶기', '데침'],
  });

  assert.equal(TasteBuddyAgent.getSignalById('ingredient:allium')?.label, '마늘/양파류');
  assert.equal(garlicMatches[0]?.entry.id, 'foodon-bridge:ingredient:allium');
  assert.equal(stirFryMatches[0]?.entry.foodOnIri, 'http://purl.obolibrary.org/obo/FOODON_03450028');
  assert.ok(everydayFood.matches.some((match) => match.entry.id === 'foodon-bridge:ingredient:egg'));
  assert.ok(everydayFood.matches.some((match) => match.entry.id === 'foodon-bridge:ingredient:soy-tofu'));
  assert.ok(everydayFood.matches.some((match) => match.entry.id === 'foodon-bridge:ingredient:seaweed'));
  assert.ok(everydayFood.matches.some((match) => match.entry.id === 'foodon-bridge:process:stir-frying'));
  assert.ok(everydayFood.matches.some((match) => match.entry.id === 'foodon-bridge:process:boiling'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:egg'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:soy-tofu'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:allium'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:tomato'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:seaweed'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:rice'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:chili-jang'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:seed-oil'));
  assert.ok(everydayFood.tbaSignalIds.includes('ingredient:coffee'));
  assert.ok(everydayFood.tbaSignalIds.includes('process:stir-fried'));
  assert.ok(everydayFood.tbaSignalIds.includes('process:boiled'));
}

console.log('tasteSurveyScoring tests passed');
