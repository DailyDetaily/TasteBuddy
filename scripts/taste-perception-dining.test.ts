import assert from 'node:assert/strict';
import { buildDiningPerceptionRecords } from '../src/lib/tastePerceptionDining';
import { buildTastePerception } from '../src/lib/tastePerception.mjs';
import { mergeTasteSurveyHistory } from '../src/lib/tasteSurveyEvidence';
import { buildTasteSurveyCompatibleResult } from '../src/lib/tasteSurveyScoring';
import { TASTE_SURVEY_ITEMS } from '../src/constants/tasteSurveyItems';
import type { DiningPageExternalFeedbackSubmission } from '../src/pages/DiningPage';

const submission = (index: number, note: string): DiningPageExternalFeedbackSubmission => ({
  submissionId: index, submittedAt: `2026-08-${String(index).padStart(2, '0')}T12:05:00.000Z`,
  restaurant: { id: 'restaurant', name: '기록한 식당', category: '', chef: { name: '' }, decisionReason: '', locationLabel: '', scores: { personalMatchRate: 99 }, summaryLine: '생성된 짠맛 요약' },
  scenario: { completedAt: `2026-08-${String(index).padStart(2, '0')}T12:00:00.000Z`, restaurant: '기록한 식당', reservationId: index, courseName: '', postDiningPrompt: '',
    dishes: [{ id: 'menu', title: '국물 요리', chefIntent: '', courseLabel: '', feedbackChoices: [], flavorNotes: ['강한 단맛'], ingredients: [], subtitle: '', techniques: [] }] },
  draft: { overallComment: '전체 평가', overallRating: 5, returnIntent: 'yes', dishResponses: { menu: {
    rating: 5, selectedChoiceId: null, selectedExperienceIds: [], selectedDetailTagIds: [], reflectionNote: note,
    tbaAnalysisSnapshot: { source: 'TasteBuddyAgent', subject: '생성됨', summary: '짠맛을 강하게 느껴요', confidence: .99,
      detailTags: [], tasteBubbles: [], foodKnowledgeMatchIds: [], foodOnMatchIds: [], generatedAt: '', lexiconCandidateIds: [], tbaSignalIds: [], version: 'derived' },
  } } },
});
const local = Array.from({ length: 6 }, (_, index) => submission(index + 1,
  index < 3 ? '  첫입에 국물의 은은한 짠맛을 느꼈어요.  ' : '첫입에 국물의 강한 짠맛을 느꼈어요.'));
const dining = buildDiningPerceptionRecords(local);
const result = buildTastePerception(dining.records);
assert.equal(result.evidenceCount, 6);
assert.equal(result.changes.length, 1);
assert.equal(result.axes.find((row: any) => row.axis === 'salty').current.currentLevel, 2);
assert.ok(dining.sources[0].note.startsWith('  '), '원문 공백도 보존한다');
assert.ok(dining.records.every(row => row.sourceRecordID && row.observationId.startsWith(row.sourceRecordID)));
assert.equal(buildTastePerception(buildDiningPerceptionRecords([submission(1, '')]).records).evidenceCount, 0, '생성된 요약과 별점은 강도 근거가 아니다');
assert.equal(buildTastePerception(buildDiningPerceptionRecords([submission(1, '짰어요.')]).records).patterns.length, 0);
assert.doesNotThrow(() => buildDiningPerceptionRecords([{ submissionId: 1, draft: {}, scenario: {}, restaurant: {} } as any]));
const noDate = submission(1, '첫입에 국물의 강한 짠맛을 느꼈어요.'); noDate.scenario.completedAt = '';
assert.equal(buildTastePerception(buildDiningPerceptionRecords([noDate]).records).evidenceCount, 0);

const history = Array.from({ length: 10 }, (_, index) => buildTasteSurveyCompatibleResult([
  { itemId: TASTE_SURVEY_ITEMS[0].id, selectedValue: index % 5 as 0 | 1 | 2 | 3 | 4, uncertain: false },
], { measuredAt: `2026-08-${String(index + 1).padStart(2, '0')}T00:00:00.000Z` }).snapshot.surveySubmission!);
const retained = mergeTasteSurveyHistory([...history, history[9], null, { schemaVersion: 1 }]);
assert.equal(retained.length, 7);
assert.deepEqual(retained.at(-1), history[9]);
assert.deepEqual(mergeTasteSurveyHistory(JSON.parse(JSON.stringify(retained))), retained);
console.log('맛의 경향: 완료된 웹 원응답·정제·전후 비교·원본 연결·설문 이력 검사 통과');
