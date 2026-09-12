import { TASTE_SURVEY_INSTRUMENT } from '../constants/tasteSurveyConfig';
import { createTasteSurveySubmission, normalizeTasteSurveyResponses, readTasteSurveySubmission, snapshotFromTasteSurveySubmission } from './tasteSurveyEvidence';
import type {
  TasteSurveyCompatibleResult,
  TasteSurveyRespondentContext,
  TasteSurveyResponse,
  TasteSurveySexContext,
  TasteSurveySmokingStatus,
} from '../types/tasteSurvey';

const SEX_CONTEXT_VALUES = new Set<TasteSurveySexContext>([
  'female',
  'male',
  'other_or_not_listed',
  'prefer_not_to_say',
]);

const SMOKING_STATUS_VALUES = new Set<TasteSurveySmokingStatus>([
  'never',
  'former',
  'current',
  'prefer_not_to_say',
]);

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeTasteSurveyRespondentContext(
  value: unknown,
): TasteSurveyRespondentContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const context = value as Partial<TasteSurveyRespondentContext>;
  const sanitized: TasteSurveyRespondentContext = {};

  if (context.birthDate && BIRTH_DATE_PATTERN.test(context.birthDate)) {
    sanitized.birthDate = context.birthDate;
  }

  if (context.sexContext && SEX_CONTEXT_VALUES.has(context.sexContext)) {
    sanitized.sexContext = context.sexContext;
  }

  if (context.smokingStatus && SMOKING_STATUS_VALUES.has(context.smokingStatus)) {
    sanitized.smokingStatus = context.smokingStatus;
  }

  return sanitized;
}

export function hasTasteSurveyRespondentContext(
  context: TasteSurveyRespondentContext,
) {
  return Boolean(context.birthDate || context.sexContext || context.smokingStatus);
}

export function serializeTasteSurveyRespondentContext(
  context: TasteSurveyRespondentContext,
) {
  return {
    birth_date: context.birthDate ?? null,
    sex_context: context.sexContext ?? null,
    smoking_status: context.smokingStatus ?? null,
  };
}

export function buildTasteSurveyMeasurementRawPayload({
  compatibleResult,
  respondentContext,
  responses,
}: {
  compatibleResult: TasteSurveyCompatibleResult;
  respondentContext: TasteSurveyRespondentContext;
  responses: readonly TasteSurveyResponse[];
}) {
  const preserved = readTasteSurveySubmission(compatibleResult.snapshot.surveySubmission);
  const normalizedResponses = preserved?.responses ?? normalizeTasteSurveyResponses(responses);
  const context = preserved?.respondentContext ?? sanitizeTasteSurveyRespondentContext(respondentContext);
  const submission = preserved ?? createTasteSurveySubmission(
    normalizedResponses,
    compatibleResult.snapshot.measuredAt,
    sanitizeTasteSurveyRespondentContext(respondentContext),
  );
  return {
    derived_snapshot_source: 'recalled-intensity',
    instrument_id: TASTE_SURVEY_INSTRUMENT.id,
    instrument_version: TASTE_SURVEY_INSTRUMENT.version,
    measurement_flow: 'taste_survey',
    respondent_context: serializeTasteSurveyRespondentContext(context),
    response_count: normalizedResponses.length,
    survey_responses: normalizedResponses,
    survey_submission: submission,
    uncertain_response_count: normalizedResponses.filter((response) => response.uncertain).length,
  };
}

export function restoreTasteSurveyMeasurementSnapshot(rawPayload: unknown) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) return null;
  const submission = readTasteSurveySubmission((rawPayload as Record<string, unknown>).survey_submission);
  return submission ? snapshotFromTasteSurveySubmission(submission) : null;
}
