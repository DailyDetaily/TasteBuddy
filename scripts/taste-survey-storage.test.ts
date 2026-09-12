import assert from 'node:assert/strict';
import { buildTasteSurveyCompatibleResult } from '../src/lib/tasteSurveyScoring';
import { TASTE_SURVEY_ITEMS } from '../src/constants/tasteSurveyItems';
import { persistTasteMeasurementSnapshot, hydrateLatestMeasurementSnapshot, hydrateRecentMeasurementSnapshots, hydrateReservationPageData } from '../src/lib/tasteBuddySupabase';

// Only the transport is replaced. Exercise the production save/hydrate functions end to end.
const requests: Array<{ table: string; payload?: any }> = [];
let stored: any = null;
let failInsert = false;
const session = { user: { id: 'survey-fixture-user', is_anonymous: false } };
(globalThis as any).__tasteSurveyTransport = {
  session,
  from(table: string) {
    requests.push({ table });
    let inserting = false;
    const query: any = {
      insert(payload: any) { inserting = true; requests[requests.length - 1].payload = payload; if (!failInsert) stored = { id: 'survey-session', ...payload }; return query; },
      select() { return query; }, eq() { return query; }, order() { return query; }, limit() { return query; }, in() { return query; },
      single: async () => ({ data: { id: 'survey-session' }, error: failInsert ? { message: 'fixture insert failure' } : null }),
      maybeSingle: async () => ({ data: stored, error: null }),
      then(resolve: (value: unknown) => void) { resolve({ data: table === 'measurement_results' ? [] : stored ? [stored] : [], error: null }); },
    };
    return query;
  },
};
const sweet = TASTE_SURVEY_ITEMS.find((item) => item.tasteId === 'sweet')!;
const fat = TASTE_SURVEY_ITEMS.find((item) => item.tasteId === 'fat')!;
const snapshot = buildTasteSurveyCompatibleResult([
  { itemId: sweet.id, selectedValue: 0, uncertain: false },
  { itemId: fat.id, selectedValue: null, uncertain: true, uncertaintyReason: 'cannot_isolate_taste' },
], { measuredAt: '2026-09-07T00:00:00.000Z', respondentContext: { smokingStatus: 'prefer_not_to_say' } }).snapshot;
assert.equal(await persistTasteMeasurementSnapshot(snapshot, 'quick_calibration'), true);
assert.deepEqual(requests.map((request) => request.table), ['measurement_sessions']);
assert.equal(stored.confidence_score, 0);
assert.equal(stored.raw_payload.confidence_status, 'not_validated');
assert.equal(stored.raw_payload.instrument_version, '2.0.0');
assert.deepEqual(stored.raw_payload.survey_submission, snapshot.surveySubmission);
requests.length = 0;
assert.deepEqual(await hydrateLatestMeasurementSnapshot(), snapshot);
assert.deepEqual(requests.map((request) => request.table), ['measurement_sessions']);
assert.deepEqual(await hydrateRecentMeasurementSnapshots(), [snapshot]);
stored.raw_payload.survey_submission.scale.min = 1;
requests.length = 0;
assert.equal(await hydrateLatestMeasurementSnapshot(), null);
assert.ok(!requests.some((request) => request.table === 'measurement_results'));
failInsert = true;
requests.length = 0;
const valid = buildTasteSurveyCompatibleResult([]).snapshot;
assert.equal(await persistTasteMeasurementSnapshot(valid, 'quick_calibration'), false);
assert.ok(!requests.some((request) => request.table === 'measurement_results'));
console.log('Survey cloud transport tests passed: raw-only write, round trip, invalid payload, failure.');
requests.length = 0;
stored = null;
failInsert = false;
assert.deepEqual(await hydrateReservationPageData({ seedIfEmpty: false }), {
  reservations: [], feedbackByReservationId: {}, feedbackScenariosByReservationId: {},
});
assert.deepEqual(requests.map(request => request.table), ['reservations'], '분석 조회는 예시 예약을 생성하지 않는다');
