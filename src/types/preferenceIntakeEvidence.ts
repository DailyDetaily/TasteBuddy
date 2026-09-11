export interface PreferenceIntakeSubmission {
  schemaVersion: 'tba-preference-intake/1';
  instrumentVersion: string;
  id: string;
  userID: string;
  recordedAt: string;
  knownAt: string;
  source: { kind: 'preference_intake'; platform: 'web' | 'ios' | 'android' };
  responses: {
    questionID: string;
    questionText: string;
    questionDescription: string;
    state: 'answered' | 'unanswered';
    selectedOptions: { id: string; label: string; description: string }[];
  }[];
}
