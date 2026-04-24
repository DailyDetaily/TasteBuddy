import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import {
  getStrongestTasteMeasurement,
  getTasteMeasurementEntries,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import type { RestaurantContentDish } from './tasteBuddySupabase';
import { projectDishForUser } from './tastePersonalization';
import type { TasteVector, UserLearnedCalibration } from '../types/tastePersonalization';

export type PersonalizedMatchConfidence = 'starter' | 'building' | 'strong';

export interface PersonalizedChefMatch {
  chef: string;
  chefAvatarPath: string | null;
  image: string | null;
  match: number;
  matchConfidence: PersonalizedMatchConfidence;
  matchReason: string;
  representativeDishTitle: string;
  restaurant: string;
  restaurantSlug: string;
  sourceTasteId: TasteId;
  tasteId: TasteId;
}

interface PersonalizedDishMatch {
  dish: RestaurantContentDish;
  match: number;
  matchConfidence: PersonalizedMatchConfidence;
  matchReason: string;
  rawScore: number;
  sourceTasteId: TasteId;
}

interface BuildPersonalizedChefMatchesOptions {
  calibration?: UserLearnedCalibration | null;
  dishes: readonly RestaurantContentDish[];
  limit?: number;
  measurementSnapshot: TasteMeasurementSnapshot;
  resolveChefImage?: (dish: RestaurantContentDish) => string | null;
}

const MATCH_RATE_FLOOR = 55;
const MATCH_RATE_RANGE = 42;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasLearnedCalibration(calibration?: UserLearnedCalibration | null) {
  return Boolean(calibration && calibration.supportCount > 0);
}

function buildUserTasteVector(snapshot: TasteMeasurementSnapshot): TasteVector {
  return getTasteMeasurementEntries(snapshot).reduce<TasteVector>((vector, entry) => {
    vector[entry.id] = clamp(entry.score / 100, 0, 1);
    return vector;
  }, {} as TasteVector);
}

function getTasteAlignment(userVector: TasteVector, dishVector: TasteVector) {
  const dishWeight = TASTE_IDS.reduce((sum, tasteId) => sum + Math.abs(dishVector[tasteId]), 0);

  if (dishWeight <= 0) {
    return 0;
  }

  const weightedOverlap = TASTE_IDS.reduce(
    (sum, tasteId) => sum + userVector[tasteId] * dishVector[tasteId],
    0,
  );

  return clamp(weightedOverlap / dishWeight, 0, 1);
}

function buildMatchConfidence(
  snapshot: TasteMeasurementSnapshot,
  dishConfidence: number,
  calibration?: UserLearnedCalibration | null,
): PersonalizedMatchConfidence {
  if (snapshot.source === 'broad-starter' || dishConfidence < 0.58) {
    return 'starter';
  }

  if ((calibration?.supportCount ?? 0) >= 3 && dishConfidence >= 0.72) {
    return 'strong';
  }

  return 'building';
}

function buildMatchReason(
  snapshot: TasteMeasurementSnapshot,
  dish: RestaurantContentDish,
  calibration?: UserLearnedCalibration | null,
) {
  const strongestTaste = getStrongestTasteMeasurement(snapshot);
  const dominantTasteLabel = TASTE_TOKENS[dish.dominantTaste].label;

  if (dish.dominantTaste === strongestTaste.id) {
    return `${strongestTaste.label} 반응이 또렷한 현재 프로필과 ${dish.title}의 ${dominantTasteLabel} 흐름이 잘 맞아요.`;
  }

  if (hasLearnedCalibration(calibration)) {
    return `최근 다이닝 피드백까지 반영하면 ${dish.title}의 ${dominantTasteLabel} 구성이 현재 프로필에 자연스럽게 이어질 가능성이 높아요.`;
  }

  return `현재 프로필의 ${strongestTaste.label} 축을 기준으로 ${dish.title}의 ${dominantTasteLabel} 구성이 균형 있게 맞을 가능성이 높아요.`;
}

export function resolveUsableImagePath(imagePath?: string | null) {
  if (!imagePath) {
    return null;
  }

  if (/^(https?:|data:|\/)/.test(imagePath)) {
    return imagePath;
  }

  return null;
}

export function scorePersonalizedDishMatch(
  snapshot: TasteMeasurementSnapshot,
  dish: RestaurantContentDish,
  calibration?: UserLearnedCalibration | null,
): PersonalizedDishMatch {
  const userTasteVector = buildUserTasteVector(snapshot);
  const shouldProjectForUser = hasLearnedCalibration(calibration);
  const projectedProfile = shouldProjectForUser
    ? projectDishForUser(
        {
          confidence: dish.confidence,
          perceptualVector: dish.perceptualVector,
          tasteVector: dish.tasteVector,
        },
        calibration!,
      )
    : null;
  const tasteVector = projectedProfile?.predictedTasteVector ?? dish.tasteVector;
  const confidence = projectedProfile?.confidence ?? dish.confidence;
  const tasteAlignment = getTasteAlignment(userTasteVector, tasteVector);
  const dominantTasteFit = userTasteVector[dish.dominantTaste] * tasteVector[dish.dominantTaste];
  const rawScore = clamp(
    tasteAlignment * 0.62 + dominantTasteFit * 0.23 + confidence * 0.15,
    0,
    1,
  );

  return {
    dish,
    match: Math.round(MATCH_RATE_FLOOR + rawScore * MATCH_RATE_RANGE),
    matchConfidence: buildMatchConfidence(snapshot, confidence, calibration),
    matchReason: buildMatchReason(snapshot, dish, calibration),
    rawScore,
    sourceTasteId: getStrongestTasteMeasurement(snapshot).id,
  };
}

export function buildPersonalizedChefMatches({
  calibration,
  dishes,
  limit,
  measurementSnapshot,
  resolveChefImage,
}: BuildPersonalizedChefMatchesOptions): PersonalizedChefMatch[] {
  const bestMatchByRestaurant = new Map<string, PersonalizedDishMatch>();

  for (const dish of dishes) {
    const match = scorePersonalizedDishMatch(measurementSnapshot, dish, calibration);
    const key = dish.restaurantSlug || `${dish.restaurant}:${dish.chef}`;
    const current = bestMatchByRestaurant.get(key);

    if (!current || match.match > current.match || match.rawScore > current.rawScore) {
      bestMatchByRestaurant.set(key, match);
    }
  }

  const matches = Array.from(bestMatchByRestaurant.values())
    .sort((left, right) => {
      if (right.match !== left.match) {
        return right.match - left.match;
      }

      return left.dish.title.localeCompare(right.dish.title, 'ko');
    })
    .map<PersonalizedChefMatch>(({ dish, match, matchConfidence, matchReason, sourceTasteId }) => ({
      chef: dish.chef,
      chefAvatarPath: dish.chefAvatarPath,
      image: resolveChefImage?.(dish) ?? resolveUsableImagePath(dish.chefAvatarPath),
      match,
      matchConfidence,
      matchReason,
      representativeDishTitle: dish.title,
      restaurant: dish.restaurant,
      restaurantSlug: dish.restaurantSlug,
      sourceTasteId,
      tasteId: dish.dominantTaste,
    }));

  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}
