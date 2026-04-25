import { TASTE_SURVEY_INSTRUMENT } from '../constants/tasteSurveyConfig';
import type {
  TasteSurveyAgeRange,
  TasteSurveyCompatibleResult,
  TasteSurveyRespondentContext,
  TasteSurveyResponse,
  TasteSurveySexContext,
  TasteSurveySmokingStatus,
} from '../types/tasteSurvey';

const AGE_RANGE_VALUES = new Set<TasteSurveyAgeRange>([
  'teen',
  '18_24',
  '25_34',
  '35_44',
  '45_54',
  '55_64',
  '65_plus',
  'prefer_not_to_say',
]);

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

export function sanitizeTasteSurveyRespondentContext(
  value: unknown,
): TasteSurveyRespondentContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const context = value as Partial<TasteSurveyRespondentContext>;
  const sanitized: TasteSurveyRespondentContext = {};

  if (context.ageRange && AGE_RANGE_VALUES.has(context.ageRange)) {
    sanitized.ageRange = context.ageRange;
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
  return Boolean(context.ageRange || context.sexContext || context.smokingStatus);
}

export function serializeTasteSurveyRespondentContext(
  context: TasteSurveyRespondentContext,
) {
  return {
    age_range: context.ageRange ?? null,
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
  return {
    derived_snapshot_source: compatibleResult.snapshot.source ?? 'broad-starter',
    instrument_id: TASTE_SURVEY_INSTRUMENT.id,
    instrument_version: TASTE_SURVEY_INSTRUMENT.version,
    measurement_flow: 'taste_survey',
    respondent_context: serializeTasteSurveyRespondentContext(respondentContext),
    response_count: responses.length,
    survey_responses: responses,
    uncertain_response_count: responses.filter((response) => response.uncertain).length,
  };
}
