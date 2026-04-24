import assert from 'node:assert/strict';

import { TASTE_IDS } from '../src/constants/designTokens';
import { TASTE_SURVEY_ITEMS } from '../src/constants/tasteSurveyItems';
import {
  buildTasteSurveyCompatibleResult,
  scoreTasteSurveyResponses,
} from '../src/lib/tasteSurveyScoring';
import type { TasteSurveyResponse } from '../src/types/tasteSurvey';

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

console.log('tasteSurveyScoring tests passed');
