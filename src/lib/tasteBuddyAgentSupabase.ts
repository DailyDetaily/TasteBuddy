import { TASTE_IDS } from '../constants/designTokens';
import {
  createInitialTasteMeasurementResults,
  type TasteMeasurementResults,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import type {
  DiningReview,
  PublicTasteProfile,
  TasteProfileVisibility,
} from '../types/tasteBuddyAgent';
import { TBA } from './tasteBuddyAgent';
import { ensureSupabaseSession, isSupabaseConfigured, supabase } from './supabase';
import type { DiningFriendProfile } from './supabase';

interface TasteSocialProfileRow {
  avatar_path: string | null;
  average_rating: number | null;
  created_at: string | null;
  display_name: string | null;
  feedback_count: number | null;
  id: string;
  nickname: string | null;
  review_count: number | null;
  taste_measurement: Record<string, unknown> | null;
  user_key: string;
  visibility: string | null;
}

interface TasteDiningReviewRow {
  created_at: string | null;
  dish_id: string | null;
  dish_title: string | null;
  experience_tags: string[] | null;
  id: string;
  rating: number | null;
  restaurant_id: string;
  restaurant_name: string;
  review_key: string;
  review_text: string | null;
  reviewer_profile_id: string;
  taste_tags: string[] | null;
  visibility: string | null;
}

export interface TasteBuddyAgentSocialGraph {
  profiles: PublicTasteProfile[];
  reviews: DiningReview[];
}

interface HydrateTasteBuddyAgentSocialGraphOptions {
  includeSeedReviews?: boolean;
}

export function createDiningFriendProfileFromPublicTasteProfile(
  profile: PublicTasteProfile,
): DiningFriendProfile {
  const measuredAt = profile.snapshot.generatedAt;

  return {
    activitySummary: {
      averageRating: profile.publicStats.averageRating,
      feedbackCount: profile.publicStats.reviewCount,
      measurementCount: 1,
      reservationCount: profile.publicStats.reviewCount,
      savedRestaurantCount: 0,
    },
    avatarPath: profile.avatarPath ?? null,
    displayName: profile.displayName,
    favoriteChefs: [],
    followerCount: Math.max(0, profile.publicStats.reviewCount * 3 + 12),
    followingCount: Math.max(0, profile.publicStats.reviewCount + 5),
    id: profile.userId,
    isFriend: false,
    latestTasteMeasurementSnapshot: {
      measuredAt,
      results: {
        bitter: Math.round(profile.snapshot.tasteVector.bitter * 100) / 10,
        fat: Math.round(profile.snapshot.tasteVector.fat * 100) / 10,
        salty: Math.round(profile.snapshot.tasteVector.salty * 100) / 10,
        sour: Math.round(profile.snapshot.tasteVector.sour * 100) / 10,
        sweet: Math.round(profile.snapshot.tasteVector.sweet * 100) / 10,
        umami: Math.round(profile.snapshot.tasteVector.umami * 100) / 10,
      },
      source: 'measured',
    },
    nickname: profile.nickname,
  };
}

function normalizeVisibility(visibility: string | null | undefined): TasteProfileVisibility {
  if (visibility === 'public' || visibility === 'followers' || visibility === 'private') {
    return visibility;
  }

  return 'private';
}

function parseNumber(value: unknown) {
  const numericValue = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseTasteMeasurementResults(rawMeasurement: Record<string, unknown> | null) {
  const results: TasteMeasurementResults = createInitialTasteMeasurementResults();

  for (const tasteId of TASTE_IDS) {
    results[tasteId] = parseNumber(rawMeasurement?.[tasteId]) ?? null;
  }

  return results;
}

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function createProfileFromRow(row: TasteSocialProfileRow): PublicTasteProfile {
  const measurementSnapshot: TasteMeasurementSnapshot = {
    measuredAt: row.created_at ?? new Date().toISOString(),
    results: parseTasteMeasurementResults(row.taste_measurement),
    source: 'measured',
  };
  const reviewCount = Math.max(0, Math.round(row.review_count ?? 0));
  const feedbackCount = Math.max(0, Math.round(row.feedback_count ?? 0));
  const snapshot = TBA.buildTasteIdentity({
    feedbackCount,
    measurementSnapshot,
    reviewCount,
    userId: row.user_key,
  });

  return TBA.publishTasteProfile(snapshot, {
    avatarPath: row.avatar_path,
    averageRating: parseNumber(row.average_rating),
    displayName: row.display_name,
    nickname: row.nickname,
    reviewCount,
    visibility: normalizeVisibility(row.visibility),
  });
}

function createReviewFromRow(row: TasteDiningReviewRow, reviewerId: string): DiningReview {
  return TBA.ingestDiningReview({
    createdAt: row.created_at ?? undefined,
    dishId: row.dish_id,
    dishTitle: row.dish_title,
    experienceTags: parseStringArray(row.experience_tags),
    id: row.review_key || row.id,
    rating: row.rating ?? 4,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    reviewerId,
    reviewText: row.review_text ?? undefined,
    tasteTags: parseStringArray(row.taste_tags),
    visibility: normalizeVisibility(row.visibility),
  });
}

export async function hydrateTasteBuddyAgentSocialGraph({
  includeSeedReviews = false,
}: HydrateTasteBuddyAgentSocialGraphOptions = {}): Promise<TasteBuddyAgentSocialGraph> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      profiles: [],
      reviews: [],
    };
  }

  const session = await ensureSupabaseSession();

  if (!session) {
    return {
      profiles: [],
      reviews: [],
    };
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('taste_social_profiles')
    .select(
      'id, user_key, display_name, nickname, avatar_path, visibility, taste_measurement, feedback_count, review_count, average_rating, created_at',
    )
    .in('visibility', ['public', 'followers'])
    .order('created_at', { ascending: true });

  if (profileError) {
    console.warn('Failed to hydrate TasteBuddyAgent social profiles from Supabase.', profileError);
    return {
      profiles: [],
      reviews: [],
    };
  }

  const profileRowsList = (profileRows ?? []) as TasteSocialProfileRow[];
  const profiles = profileRowsList.map(createProfileFromRow);
  const profileUserKeyById = new Map(profileRowsList.map((row) => [row.id, row.user_key]));

  if (profileRowsList.length === 0) {
    return {
      profiles,
      reviews: [],
    };
  }

  let reviewQuery = supabase
    .from('taste_dining_reviews')
    .select(
      'id, review_key, reviewer_profile_id, restaurant_id, restaurant_name, dish_id, dish_title, rating, review_text, taste_tags, experience_tags, visibility, created_at',
    )
    .eq('visibility', 'public')
    .in('reviewer_profile_id', Array.from(profileUserKeyById.keys()));

  if (!includeSeedReviews) {
    reviewQuery = reviewQuery.eq('is_seed', false);
  }

  const { data: reviewRows, error: reviewError } = await reviewQuery
    .order('created_at', { ascending: false })
    .limit(30);

  if (reviewError) {
    console.warn('Failed to hydrate TasteBuddyAgent dining reviews from Supabase.', reviewError);
    return {
      profiles,
      reviews: [],
    };
  }

  return {
    profiles,
    reviews: ((reviewRows ?? []) as TasteDiningReviewRow[]).flatMap((row) => {
      const reviewerId = profileUserKeyById.get(row.reviewer_profile_id);

      return reviewerId ? [createReviewFromRow(row, reviewerId)] : [];
    }),
  };
}
