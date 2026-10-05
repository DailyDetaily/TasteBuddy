import type {PreferenceIntakeSubmission} from '../types/preferenceIntakeEvidence';
import type {PreferenceIntakeResponses} from '../constants/preferenceIntakeData';
export const PREFERENCE_INTAKE_EVIDENCE_VERSION:string;
export const PREFERENCE_INTAKE_MEANINGS:Record<string,[string,string]>;
export function createPreferenceIntakeSubmission(responses:PreferenceIntakeResponses,options?:{id?:string;userID?:string;recordedAt?:string;knownAt?:string;platform?:'web'|'ios'|'android'}):PreferenceIntakeSubmission;
export function isPreferenceIntakeSubmission(value:unknown):value is PreferenceIntakeSubmission;
export function buildPreferenceIntakeEvidence(submissions:unknown,options?:{userID?:string;asOf?:string|null}):{version:string;source:string;submissionID:string|null;recordedAt:string|null;answeredQuestionCount:number;records:Array<Omit<PreferenceIntakeSubmission['responses'][number],'state'>&{id:string;sourceSubmissionID:string;kind:string;label:string;state:string;recordedAt:string;knownAt:string;summary:string}>;limits:string[];excludedSubmissions:Array<{id:string;reason:string}>};
export function preferenceIntakeResponsesFromEvidence(submissions:unknown,userID?:string):PreferenceIntakeResponses|null;
