import catalog from './preferenceIntakeCatalog.json';
import type { PreferenceIntakeSubmission } from '../types/preferenceIntakeEvidence';
import { preferenceIntakeResponsesFromEvidence } from '../lib/preferenceIntakeEvidence.mjs';

export type PreferenceIntakeQuestionId =
  | 'allergies'
  | 'dietaryRestrictions'
  | 'preferredCuisineTypes'
  | 'avoidedSignals'
  | 'flavorIntensityPreference'
  | 'explorationStyle'
  | 'sharePreferenceWithRestaurant';

export type PreferenceIntakeSelectionMode = 'single' | 'multiple';

export type FlavorIntensityOption =
  | 'very-light'
  | 'light'
  | 'balanced'
  | 'rich'
  | 'very-rich';

export type ExplorationStyleOption = 'familiar' | 'balanced' | 'adventurous';

export type SharePreferenceWithRestaurantOption =
  | 'safety-only'
  | 'summary-ok'
  | 'preview-first';

export interface PreferenceIntakeOption {
  description: string;
  id: string;
  label: string;
}

export interface PreferenceIntakeQuestion {
  description: string;
  eyebrow: string;
  gridColumns?: 1 | 2;
  helperText?: string;
  id: PreferenceIntakeQuestionId;
  maxSelections?: number;
  minSelections?: number;
  noneOptionId?: string;
  options: readonly PreferenceIntakeOption[];
  selectionMode: PreferenceIntakeSelectionMode;
  title: string;
}

export interface PreferenceIntakeResponses {
  allergies: string[];
  avoidedSignals: string[];
  dietaryRestrictions: string[];
  explorationStyle: ExplorationStyleOption | null;
  flavorIntensityPreference: FlavorIntensityOption | null;
  preferredCuisineTypes: string[];
  sharePreferenceWithRestaurant: SharePreferenceWithRestaurantOption | null;
}

export interface PreferenceIntakeProfile {
  submissions?: PreferenceIntakeSubmission[];
  allergies: string[];
  avoidedSignals: string[];
  dietaryRestrictions: string[];
  explorationStyle: ExplorationStyleOption | null;
  flavorIntensityPreference: FlavorIntensityOption | null;
  preferredCuisineTypes: string[];
  sharePreferenceWithRestaurant: SharePreferenceWithRestaurantOption | null;
}

const NONE_OPTION_IDS = {
  allergies: 'allergies-none',
  avoidedSignals: 'avoided-signals-none',
  dietaryRestrictions: 'dietary-restrictions-none',
} as const;

const FLAVOR_INTENSITY_OPTIONS = [
  'very-light',
  'light',
  'balanced',
  'rich',
  'very-rich',
] as const satisfies readonly FlavorIntensityOption[];

const EXPLORATION_STYLE_OPTIONS = [
  'familiar',
  'balanced',
  'adventurous',
] as const satisfies readonly ExplorationStyleOption[];

const SHARE_PREFERENCE_OPTIONS = [
  'safety-only',
  'summary-ok',
  'preview-first',
] as const satisfies readonly SharePreferenceWithRestaurantOption[];

export const PREFERENCE_INTAKE_QUESTIONS = catalog.questions as readonly PreferenceIntakeQuestion[];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isNullableOption<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): value is T | null {
  return value === null || (typeof value === 'string' && allowedValues.includes(value as T));
}

export function createInitialPreferenceIntakeResponses(): PreferenceIntakeResponses {
  return {
    allergies: [],
    avoidedSignals: [],
    dietaryRestrictions: [],
    explorationStyle: null,
    flavorIntensityPreference: null,
    preferredCuisineTypes: [],
    sharePreferenceWithRestaurant: null,
  };
}

export function createPreferenceIntakeResponsesFromProfile(
  profile: PreferenceIntakeProfile | null,
  userID = 'local-owner',
): PreferenceIntakeResponses {
  if (!profile) {
    return createInitialPreferenceIntakeResponses();
  }

  const recorded = preferenceIntakeResponsesFromEvidence(profile.submissions, userID);
  if (recorded) return recorded as PreferenceIntakeResponses;
  if (profile.submissions?.length) return createInitialPreferenceIntakeResponses();

  return {
    allergies: profile.allergies,
    avoidedSignals: profile.avoidedSignals,
    dietaryRestrictions: profile.dietaryRestrictions,
    explorationStyle: profile.explorationStyle,
    flavorIntensityPreference:
      isNullableOption(
        (profile as PreferenceIntakeProfile & { flavorIntensityPreference?: unknown })
          .flavorIntensityPreference,
        FLAVOR_INTENSITY_OPTIONS,
      )
        ? (profile as PreferenceIntakeProfile & {
            flavorIntensityPreference?: FlavorIntensityOption | null;
          }).flavorIntensityPreference ?? null
        : null,
    preferredCuisineTypes: profile.preferredCuisineTypes,
    sharePreferenceWithRestaurant: profile.sharePreferenceWithRestaurant,
  };
}

function sanitizeMultipleValue(question: PreferenceIntakeQuestion, selections: string[]) {
  if (!question.noneOptionId) {
    return selections;
  }

  return selections.filter((selection) => selection !== question.noneOptionId);
}

export function buildPreferenceIntakeProfile(
  responses: PreferenceIntakeResponses,
): PreferenceIntakeProfile {
  const questionsById = new Map(
    PREFERENCE_INTAKE_QUESTIONS.map((question) => [question.id, question]),
  );

  return {
    allergies: sanitizeMultipleValue(
      questionsById.get('allergies')!,
      responses.allergies,
    ),
    avoidedSignals: sanitizeMultipleValue(
      questionsById.get('avoidedSignals')!,
      responses.avoidedSignals,
    ),
    dietaryRestrictions: sanitizeMultipleValue(
      questionsById.get('dietaryRestrictions')!,
      responses.dietaryRestrictions,
    ),
    explorationStyle: responses.explorationStyle,
    flavorIntensityPreference: responses.flavorIntensityPreference,
    preferredCuisineTypes: responses.preferredCuisineTypes,
    sharePreferenceWithRestaurant: responses.sharePreferenceWithRestaurant,
  };
}

export function isPreferenceIntakeProfile(value: unknown): value is PreferenceIntakeProfile {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const profile = value as PreferenceIntakeProfile;

  return (
    isStringArray(profile.allergies) &&
    isStringArray(profile.avoidedSignals) &&
    isStringArray(profile.dietaryRestrictions) &&
    isStringArray(profile.preferredCuisineTypes) &&
    (profile.submissions === undefined || Array.isArray(profile.submissions)) &&
    (profile.flavorIntensityPreference === undefined ||
      isNullableOption(profile.flavorIntensityPreference, FLAVOR_INTENSITY_OPTIONS)) &&
    isNullableOption(profile.explorationStyle, EXPLORATION_STYLE_OPTIONS) &&
    isNullableOption(profile.sharePreferenceWithRestaurant, SHARE_PREFERENCE_OPTIONS)
  );
}

export function getNextPreferenceMultiSelectValue(
  question: PreferenceIntakeQuestion,
  currentValue: string[],
  optionId: string,
): string[] {
  const maxSelections = question.maxSelections ?? Number.POSITIVE_INFINITY;
  const noneOptionId = question.noneOptionId;
  const hasSelection = currentValue.includes(optionId);

  if (hasSelection) {
    return currentValue.filter((selection) => selection !== optionId);
  }

  if (noneOptionId && optionId === noneOptionId) {
    return [noneOptionId];
  }

  const baseSelections = noneOptionId
    ? currentValue.filter((selection) => selection !== noneOptionId)
    : [...currentValue];

  if (baseSelections.length >= maxSelections) {
    return baseSelections;
  }

  return [...baseSelections, optionId];
}

export function isPreferenceQuestionAnswered(
  question: PreferenceIntakeQuestion,
  responses: PreferenceIntakeResponses,
): boolean {
  const value = responses[question.id];

  const ids = Array.isArray(value) ? value : value == null ? [] : [value];
  if (new Set(ids).size !== ids.length || ids.some(id => !question.options.some(option => option.id === id))
    || ids.length > (question.maxSelections ?? question.options.length)
    || (question.noneOptionId && ids.includes(question.noneOptionId) && ids.length > 1)) return false;

  if (question.selectionMode === 'single') {
    return typeof value === 'string' && value.length > 0;
  }

  return Array.isArray(value) && value.length >= (question.minSelections ?? 1);
}
