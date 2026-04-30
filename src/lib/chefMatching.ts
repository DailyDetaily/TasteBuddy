import { TASTE_IDS, TASTE_TOKENS, type TasteId } from '../constants/designTokens';
import {
  getStrongestTasteMeasurement,
  getTasteMeasurementEntries,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import type { RestaurantContentDish } from './tasteBuddySupabase';
import { projectDishForUser } from './tastePersonalization';
import type { TasteVector, UserLearnedCalibration } from '../types/tastePersonalization';
import { resolvePublicMediaPath } from './mediaAssets';

export type PersonalizedMatchConfidence = 'starter' | 'building' | 'strong';

export interface PersonalizedChefMatch {
  chef: string;
  chefAvatarPath: string | null;
  image: string | null;
  match: number;
  matchConfidence: PersonalizedMatchConfidence;
  matchReason: string;
  profileRank: number;
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

interface RankedTasteAxis {
  rank: number;
  tasteId: TasteId;
  valueMm: number;
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
  sourceTasteId = getStrongestTasteMeasurement(snapshot).id,
  profileRank?: number,
) {
  const sourceTaste =
    getTasteMeasurementEntries(snapshot).find((entry) => entry.id === sourceTasteId) ??
    getStrongestTasteMeasurement(snapshot);
  const dominantTasteLabel = TASTE_TOKENS[dish.dominantTaste].label;

  if (dish.dominantTaste === sourceTaste.id) {
    return `현재 프로필과 ${dish.title}의 ${dominantTasteLabel} 흐름이 잘 맞아요.`;
  }

  if (hasLearnedCalibration(calibration)) {
    return `최근 다이닝 피드백까지 반영하면 ${dish.title}의 ${dominantTasteLabel} 구성이 자연스럽게 이어질 가능성이 높아요.`;
  }

  return `${sourceTaste.label} 반응을 기준으로 ${dish.title}의 ${dominantTasteLabel} 구성이 균형 있게 맞을 가능성이 높아요.`;
}

export function resolveUsableImagePath(imagePath?: string | null) {
  return resolvePublicMediaPath(imagePath);
}

export function scorePersonalizedDishMatch(
  snapshot: TasteMeasurementSnapshot,
  dish: RestaurantContentDish,
  calibration?: UserLearnedCalibration | null,
  sourceTasteId = getStrongestTasteMeasurement(snapshot).id,
  profileRank?: number,
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
  const sourceTasteFit = userTasteVector[sourceTasteId] * tasteVector[sourceTasteId];
  const dominantTasteFit = userTasteVector[dish.dominantTaste] * tasteVector[dish.dominantTaste];
  const rawScore = clamp(
    tasteAlignment * 0.42 +
      sourceTasteFit * 0.34 +
      dominantTasteFit * 0.09 +
      confidence * 0.15,
    0,
    1,
  );

  return {
    dish,
    match: Math.round(MATCH_RATE_FLOOR + rawScore * MATCH_RATE_RANGE),
    matchConfidence: buildMatchConfidence(snapshot, confidence, calibration),
    matchReason: buildMatchReason(snapshot, dish, calibration, sourceTasteId, profileRank),
    rawScore,
    sourceTasteId,
  };
}

function getRankedTasteAxes(snapshot: TasteMeasurementSnapshot): RankedTasteAxis[] {
  return getTasteMeasurementEntries(snapshot)
    .slice()
    .sort((left, right) => {
      if (right.valueMm !== left.valueMm) {
        return right.valueMm - left.valueMm;
      }

      return Math.abs(right.deltaMm) - Math.abs(left.deltaMm);
    })
    .map((entry, index) => ({
      rank: index + 1,
      tasteId: entry.id,
      valueMm: entry.valueMm,
    }));
}

function getAxisPresence(dish: RestaurantContentDish, tasteId: TasteId) {
  return clamp(dish.tasteVector[tasteId] ?? 0, 0, 1);
}

function buildAxisMatchCandidates(
  calibration: UserLearnedCalibration | null | undefined,
  dishes: readonly RestaurantContentDish[],
  measurementSnapshot: TasteMeasurementSnapshot,
  rankedAxis: RankedTasteAxis,
) {
  const minimumAxisPresence = 0.12;
  const axisDishes = dishes.filter(
    (dish) => getAxisPresence(dish, rankedAxis.tasteId) >= minimumAxisPresence,
  );
  const candidateDishes = axisDishes.length > 0 ? axisDishes : dishes;

  return candidateDishes
    .map((dish) => {
      const match = scorePersonalizedDishMatch(
        measurementSnapshot,
        dish,
        calibration,
        rankedAxis.tasteId,
        rankedAxis.rank,
      );
      const axisPresence = getAxisPresence(dish, rankedAxis.tasteId);
      const rankWeight = clamp(rankedAxis.valueMm / 10, 0, 1);

      return {
        ...match,
        rawScore: clamp(match.rawScore * 0.78 + axisPresence * 0.16 + rankWeight * 0.06, 0, 1),
      };
    })
    .sort((left, right) => {
      if (right.rawScore !== left.rawScore) {
        return right.rawScore - left.rawScore;
      }

      if (right.match !== left.match) {
        return right.match - left.match;
      }

      return left.dish.title.localeCompare(right.dish.title, 'ko');
    });
}

function getChefMatchKey(dish: RestaurantContentDish) {
  return dish.chef.trim().toLowerCase();
}

export function buildPersonalizedChefMatches({
  calibration,
  dishes,
  limit,
  measurementSnapshot,
  resolveChefImage,
}: BuildPersonalizedChefMatchesOptions): PersonalizedChefMatch[] {
  const rankedAxes = getRankedTasteAxes(measurementSnapshot);
  const selectedMatches: Array<PersonalizedDishMatch & { profileRank: number }> = [];
  const axisCandidateEntries = rankedAxes.map((rankedAxis) => ({
    candidates: buildAxisMatchCandidates(
      calibration,
      dishes,
      measurementSnapshot,
      rankedAxis,
    ),
    rankedAxis,
  }));
  const consumedChefKeys = new Set<string>();

  for (const { candidates, rankedAxis } of axisCandidateEntries) {
    const uniqueChefCandidate = candidates.find((candidate) => {
      const chefKey = getChefMatchKey(candidate.dish);

      return !consumedChefKeys.has(chefKey);
    });
    const selectedCandidate = uniqueChefCandidate ?? candidates[0];

    if (!selectedCandidate) {
      continue;
    }

    consumedChefKeys.add(getChefMatchKey(selectedCandidate.dish));
    selectedMatches.push({
      ...selectedCandidate,
      profileRank: rankedAxis.rank,
    });
  }

  const matches = selectedMatches
    .map<PersonalizedChefMatch>(({
      dish,
      match,
      matchConfidence,
      matchReason,
      profileRank,
      sourceTasteId,
    }) => ({
      chef: dish.chef,
      chefAvatarPath: dish.chefAvatarPath,
      image: resolveChefImage?.(dish) ?? resolveUsableImagePath(dish.chefAvatarPath),
      match,
      matchConfidence,
      matchReason,
      profileRank,
      representativeDishTitle: dish.title,
      restaurant: dish.restaurant,
      restaurantSlug: dish.restaurantSlug,
      sourceTasteId,
      tasteId: sourceTasteId,
    }));

  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}
