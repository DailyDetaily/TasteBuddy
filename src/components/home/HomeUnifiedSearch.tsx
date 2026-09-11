import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  ChefHat,
  CircleCheck,
  CirclePlus,
  Clock,
  Search,
  Sparkles,
  Store,
  Utensils,
} from 'lucide-react';

import ChefAvatar from '../system/ChefAvatar';
import Chip from '../system/Chip';
import CompactCard from '../system/CompactCard';
import EmptyState from '../system/EmptyState';
import DiningFriendProfileCard from '../profile/DiningFriendProfileCard';
import SearchOverlayShell from '../search/SearchOverlayShell';
import { cn } from '../ui/utils';
import { type ReservationRecord } from '../../constants/reservationCatalog';
import { ICON_TOKENS } from '../../constants/designTokens';
import {
  searchKakaoRestaurantPlaces,
  type RestaurantContentCatalog,
  type RestaurantContentDish,
} from '../../lib/tasteBuddySupabase';
import { resolveUsableImagePath } from '../../lib/chefMatching';
import { getChefImageByName } from './HomeCards';
import RestaurantBookmarkSheet, {
  RESTAURANT_BOOKMARKS_CHANGED_EVENT,
  getRestaurantBookmarkKey,
  isRestaurantBookmarked,
} from '../restaurant/RestaurantBookmarkSheet';
import type { DiningFriendProfile } from '../../lib/supabase';
import {
  createRestaurantDetailFromSearchResult,
  getRestaurantInfo,
} from '../../pages/RestaurantDetailPage';

const HOME_RECENT_SEARCH_STORAGE_KEY = 'tastebuddy-home-recent-searches-v1';
const HOME_KAKAO_SEARCH_CACHE_STORAGE_KEY = 'tastebuddy-home-kakao-search-cache-v1';
const MAX_RECENT_SEARCHES = 5;
const MAX_KAKAO_SEARCH_CACHE_ENTRIES = 30;
const MAX_GROUP_RESULTS = 6;
const KAKAO_SEARCH_DEBOUNCE_MS = 80;
const SEARCH_BAR_FIELD_CLASS_NAME =
  'flex h-11 min-w-0 flex-1 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-left transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const SEARCH_BAR_ICON_BUTTON_CLASS_NAME =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[#303946] transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const APP_LUCIDE_ICON_SIZE_M = ICON_TOKENS.size.md;
const SEARCH_BAR_ICON_SIZE = ICON_TOKENS.size.md;
const SEARCH_RESULT_ACTION_BUTTON_SIZE = ICON_TOKENS.container.lg;
const SEARCH_RESULT_ACTION_ICON_SIZE = ICON_TOKENS.size.lg;
const SEARCH_RESULT_ACTIVE_RECORD_ICON_SIZE = 24;
const SEARCH_FOCUS_CARD_CLASS_NAME =
  'rounded-[24px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] p-4';
const SEARCH_SECTION_TITLE_CLASS_NAME =
  'text-[13px] font-semibold text-[var(--tb-color-text-primary)]';
const SEARCH_SECTION_COUNT_CLASS_NAME =
  'text-[11px] font-medium text-[var(--tb-color-text-faint)]';
const SEARCH_RESULT_CARD_CLASS_NAME =
  'tb-section-card overflow-hidden border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2';
const SEARCH_RESULT_CARD_SELECTED_CLASS_NAME = 'border-[var(--tb-color-text-primary)]';
const SEARCH_RESULT_CARD_UNSELECTED_CLASS_NAME =
  'border-[var(--tb-color-border-default)] hover:-translate-y-[1px] hover:border-[var(--tb-color-border-strong)]';
const SEARCH_RESULT_CARD_BODY_CLASS_NAME = 'tb-section-card__body w-full';
const SEARCH_RESULT_DESCRIPTION_CLASS_NAME =
  'mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]';
const SEARCH_RESULT_TITLE_CLASS_NAME =
  'mt-2 text-[15px] font-semibold text-[var(--tb-color-text-primary)]';
const SEARCH_RESULT_BODY_COPY_CLASS_NAME =
  'mt-4 text-[13px] leading-relaxed text-[var(--tb-color-text-body)]';
const SEARCH_RESULT_SIGNATURES_CLASS_NAME = 'mt-3 flex flex-wrap gap-2';
const SEARCH_RESULT_TYPE_LABEL_CLASS_NAME =
  'text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tb-color-text-faint)]';
const SEARCH_EMPTY_STATE_CLASS_NAME =
  'rounded-[28px] border border-dashed border-[var(--tb-color-border-default)] bg-white/75 px-2 py-6';
const SEARCH_SUGGESTION_SECTION_CLASS_NAME = 'tb-card-stack';
const SEARCH_SUGGESTION_ITEMS_CLASS_NAME = 'flex flex-wrap gap-2';
const SEARCH_PENDING_ADDRESS_LABEL = '주소 확인 중';
const HANGUL_BASE_CODE = '가'.charCodeAt(0);
const HANGUL_LAST_CODE = '힣'.charCodeAt(0);
const HANGUL_INITIAL_UNIT = 588;
const HANGUL_INITIALS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

type SearchResultType = 'restaurant' | 'chef' | 'menu';
type SearchResultSource = 'taste-buddy' | 'kakao';

export type HomeSearchResult = {
  chef: string;
  id: string;
  image: string | null;
  label: string;
  matchMeta: string;
  place?: {
    address: string | null;
    category?: string | null;
    lat: number | null;
    lng: number | null;
    phone: string | null;
    placeId: string | null;
    placeUrl: string | null;
  };
  restaurant: string;
  searchText: string;
  signatureItems: string[];
  source?: SearchResultSource;
  subLabel: string;
  type: SearchResultType;
};

type SearchGroups = {
  chefs: HomeSearchResult[];
  friends: DiningFriendProfile[];
  menus: HomeSearchResult[];
  restaurants: HomeSearchResult[];
  totalCount: number;
};

interface HomeUnifiedSearchProps {
  catalog: RestaurantContentCatalog;
  closeTrigger?: number;
  onAddFriend?: (friend: DiningFriendProfile) => Promise<{ ok: boolean; message: string }>;
  onOpenTasteBuddyProfile?: (friend: DiningFriendProfile) => void;
  onOpenRestaurantDetail?: (result: HomeSearchResult) => void;
  onRemoveFriend?: (friend: DiningFriendProfile) => Promise<{ ok: boolean; message: string }>;
  onStartDiningFeedback?: (result: HomeSearchResult) => void;
  onSearchFriends?: (query: string) => Promise<{
    ok: boolean;
    friends: DiningFriendProfile[];
    message: string;
  }>;
  openTrigger?: number;
  reservations: ReservationRecord[];
  showTrigger?: boolean;
}

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[()'".,/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactSearchValue(value: string) {
  return normalizeSearchValue(value).replace(/\s+/g, '');
}

function getHangulInitialSearchValue(value: string) {
  return Array.from(normalizeSearchValue(value))
    .map((character) => {
      if (character === ' ') {
        return ' ';
      }

      const characterCode = character.charCodeAt(0);

      if (characterCode >= HANGUL_BASE_CODE && characterCode <= HANGUL_LAST_CODE) {
        return HANGUL_INITIALS[
          Math.floor((characterCode - HANGUL_BASE_CODE) / HANGUL_INITIAL_UNIT)
        ];
      }

      return character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueSearchValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildSearchVariants(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  const normalizedValue = normalizeSearchValue(value);
  const compactValue = compactSearchValue(value);
  const initialValue = getHangulInitialSearchValue(value);
  const compactInitialValue = initialValue.replace(/\s+/g, '');

  return uniqueSearchValues([
    normalizedValue,
    compactValue,
    initialValue,
    compactInitialValue,
  ]);
}

function buildQueryVariants(value: string) {
  const normalizedValue = normalizeSearchValue(value);
  const compactValue = compactSearchValue(value);
  const hasInitialConsonantInput = /[ㄱ-ㅎ]/.test(normalizedValue);

  return uniqueSearchValues([
    normalizedValue,
    compactValue,
    ...(hasInitialConsonantInput ? buildSearchVariants(value) : []),
  ]);
}

function splitSearchTerms(value: string) {
  return normalizeSearchValue(value)
    .split(' ')
    .map((term) => term.trim())
    .filter(Boolean);
}

function hasSearchableCompleteCharacter(value: string) {
  return /[가-힣ㄱ-ㅎa-z0-9]/i.test(value);
}

function isSearchableProfileIdentityQuery(value: string) {
  const normalizedValue = value.trim().replace(/^@+/, '');
  return hasSearchableCompleteCharacter(normalizedValue) &&
    (normalizedValue.length >= 2 || /[가-힣]/.test(normalizedValue));
}

function buildSearchText(parts: Array<string | null | undefined>) {
  return normalizeSearchValue(parts.filter(Boolean).join(' '));
}

function getRestaurantSearchAliases(restaurantName: string) {
  const normalizedName = normalizeSearchValue(restaurantName);

  if (
    normalizedName.includes('7th door') ||
    normalizedName.includes('7thdoor') ||
    normalizedName.includes('세븐도어') ||
    normalizedName.includes('세븐스도어')
  ) {
    return ['7th Door', '7thDoor', '세븐스도어', '세븐도어'];
  }

  return [];
}

function formatChefName(name: string) {
  return name.endsWith('셰프') ? name : `${name} 셰프`;
}

function loadRecentSearches() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(HOME_RECENT_SEARCH_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((value): value is string => typeof value === 'string')
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(HOME_RECENT_SEARCH_STORAGE_KEY, JSON.stringify(searches));
}

function getKakaoSearchCacheKey(query: string) {
  return normalizeSearchValue(query);
}

function readCachedKakaoSearchResult(value: unknown): HomeSearchResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const result = value as Partial<HomeSearchResult>;

  if (
    result.source !== 'kakao' ||
    result.type !== 'restaurant' ||
    typeof result.id !== 'string' ||
    typeof result.label !== 'string' ||
    typeof result.restaurant !== 'string' ||
    typeof result.subLabel !== 'string'
  ) {
    return null;
  }

  return {
    chef: typeof result.chef === 'string' ? result.chef : 'Taste Buddy 분석 준비 중',
    id: result.id,
    image: typeof result.image === 'string' ? result.image : null,
    label: result.label,
    matchMeta: typeof result.matchMeta === 'string' ? result.matchMeta : '',
    place: result.place,
    restaurant: result.restaurant,
    searchText: typeof result.searchText === 'string' ? result.searchText : buildSearchText([result.label]),
    signatureItems: Array.isArray(result.signatureItems)
      ? result.signatureItems.filter((item): item is string => typeof item === 'string')
      : [],
    source: 'kakao',
    subLabel: result.subLabel,
    type: 'restaurant',
  };
}

function loadKakaoSearchCache() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(HOME_KAKAO_SEARCH_CACHE_STORAGE_KEY);

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return {};
    }

    return Object.entries(parsedValue as Record<string, unknown>).reduce<Record<string, HomeSearchResult[]>>(
      (cache, [key, value]) => {
        if (!Array.isArray(value)) {
          return cache;
        }

        const results = value
          .map(readCachedKakaoSearchResult)
          .filter((result): result is HomeSearchResult => Boolean(result))
          .slice(0, MAX_GROUP_RESULTS);

        if (results.length > 0) {
          cache[key] = results;
        }

        return cache;
      },
      {},
    );
  } catch {
    return {};
  }
}

function saveKakaoSearchCache(cache: Record<string, HomeSearchResult[]>) {
  if (typeof window === 'undefined') {
    return;
  }

  const compactCache = Object.fromEntries(
    Object.entries(cache)
      .filter(([, results]) => results.length > 0)
      .slice(-MAX_KAKAO_SEARCH_CACHE_ENTRIES),
  );

  window.localStorage.setItem(HOME_KAKAO_SEARCH_CACHE_STORAGE_KEY, JSON.stringify(compactCache));
}

function resolveChefImage(
  name: string,
  reservations: ReservationRecord[],
  avatarPath?: string | null,
) {
  const resolvedAvatarPath = resolveUsableImagePath(avatarPath);
  if (resolvedAvatarPath) {
    return resolvedAvatarPath;
  }

  const chefImage = getChefImageByName(name);
  if (chefImage) {
    return chefImage;
  }

  const reservationMatch = reservations.find((reservation) => reservation.chef === name);
  return reservationMatch?.chefImage ?? getChefImageByName(name);
}

function dedupeSignatureItems(items: string[]) {
  return Array.from(new Set(items.filter(Boolean))).slice(0, 3);
}

function buildRestaurantResults(
  catalog: RestaurantContentCatalog,
  reservations: ReservationRecord[],
) {
  const resultsByKey = new Map<string, HomeSearchResult>();

  catalog.dishes.forEach((dish) => {
    const key = normalizeSearchValue(dish.restaurant);
    const existingResult = resultsByKey.get(key);
    const signatureItems = dedupeSignatureItems([
      ...(existingResult?.signatureItems ?? []),
      dish.title,
      dish.subtitle,
    ]);
    const chefName = existingResult?.chef || dish.chef;

    resultsByKey.set(key, {
      id: `restaurant-${key}`,
      type: 'restaurant',
      label: dish.restaurant,
      subLabel: getRestaurantInfo(dish.restaurant).address,
      restaurant: dish.restaurant,
      chef: chefName,
      image: existingResult?.image ?? resolveChefImage(chefName, reservations, dish.chefAvatarPath),
      matchMeta: signatureItems.slice(0, 2).join(' · ') || '시즌 메뉴를 살펴볼 수 있어요.',
      signatureItems,
      searchText: buildSearchText([
        dish.restaurant,
        dish.restaurantSlug,
        ...getRestaurantSearchAliases(dish.restaurant),
        chefName,
        ...signatureItems,
      ]),
    });
  });

  reservations.forEach((reservation) => {
    const key = normalizeSearchValue(reservation.restaurant);
    const existingResult = resultsByKey.get(key);
    const signatureItems = dedupeSignatureItems([
      ...(existingResult?.signatureItems ?? []),
      reservation.course,
      ...reservation.adjustments.map((adjustment) => adjustment.taste),
    ]);

    resultsByKey.set(key, {
      id: existingResult?.id ?? `restaurant-reservation-${reservation.id}`,
      type: 'restaurant',
      label: reservation.restaurant,
      subLabel: existingResult?.subLabel ?? getRestaurantInfo(reservation.restaurant).address,
      restaurant: reservation.restaurant,
      chef: existingResult?.chef ?? reservation.chef,
      image: existingResult?.image ?? reservation.chefImage ?? getChefImageByName(reservation.chef),
      matchMeta:
        existingResult?.matchMeta ??
        (signatureItems.slice(0, 2).join(' · ') || `${reservation.course} 준비 중`),
      signatureItems,
      searchText: buildSearchText([
        reservation.restaurant,
        ...getRestaurantSearchAliases(reservation.restaurant),
        reservation.chef,
        reservation.course,
        ...signatureItems,
      ]),
    });
  });

  return Array.from(resultsByKey.values());
}

function buildChefResults(
  catalog: RestaurantContentCatalog,
  reservations: ReservationRecord[],
) {
  const resultsByKey = new Map<string, HomeSearchResult>();

  catalog.chefs.forEach((chef) => {
    const key = normalizeSearchValue(`${chef.restaurant}-${chef.name}`);
    resultsByKey.set(key, {
      id: `chef-${key}`,
      type: 'chef',
      label: formatChefName(chef.name),
      subLabel: chef.restaurant,
      restaurant: chef.restaurant,
      chef: chef.name,
      image: resolveChefImage(chef.name, reservations, chef.avatarPath),
      matchMeta:
        chef.signatureDishTitles.slice(0, 2).join(' · ') ||
        '대표 메뉴 힌트가 준비되어 있어요.',
      signatureItems: chef.signatureDishTitles.slice(0, 3),
      searchText: buildSearchText([
        chef.name,
        chef.restaurant,
        chef.restaurantSlug,
        ...getRestaurantSearchAliases(chef.restaurant),
        ...chef.signatureDishTitles,
      ]),
    });
  });

  reservations.forEach((reservation) => {
    const key = normalizeSearchValue(`${reservation.restaurant}-${reservation.chef}`);
    const existingResult = resultsByKey.get(key);

    resultsByKey.set(key, {
      id: existingResult?.id ?? `chef-reservation-${reservation.id}`,
      type: 'chef',
      label: existingResult?.label ?? formatChefName(reservation.chef),
      subLabel: existingResult?.subLabel ?? reservation.restaurant,
      restaurant: reservation.restaurant,
      chef: reservation.chef,
      image:
        existingResult?.image ?? reservation.chefImage ?? getChefImageByName(reservation.chef),
      matchMeta: existingResult?.matchMeta ?? reservation.course,
      signatureItems: dedupeSignatureItems([
        ...(existingResult?.signatureItems ?? []),
        reservation.course,
      ]),
      searchText: buildSearchText([
        reservation.chef,
        reservation.restaurant,
        ...getRestaurantSearchAliases(reservation.restaurant),
        reservation.course,
      ]),
    });
  });

  return Array.from(resultsByKey.values());
}

function buildMenuResults(
  catalog: RestaurantContentCatalog,
  reservations: ReservationRecord[],
) {
  const dishResults = catalog.dishes.map<HomeSearchResult>((dish) => ({
    id: `menu-${dish.id}`,
    type: 'menu',
    label: dish.title,
    subLabel: `${dish.restaurant} · ${formatChefName(dish.chef)}`,
    restaurant: dish.restaurant,
    chef: dish.chef,
    image: resolveChefImage(dish.chef, reservations, dish.chefAvatarPath),
    matchMeta: [dish.courseLabel, dish.seasonLabel].filter(Boolean).join(' · ') || dish.subtitle,
    signatureItems: dedupeSignatureItems([dish.subtitle, ...dish.ingredients]),
    searchText: buildSearchText([
      dish.title,
      dish.subtitle,
      dish.restaurant,
      ...getRestaurantSearchAliases(dish.restaurant),
      dish.chef,
      dish.courseLabel,
      dish.seasonLabel ?? '',
      ...dish.ingredients,
    ]),
  }));

  const reservationResults = reservations.map<HomeSearchResult>((reservation) => ({
    id: `menu-reservation-${reservation.id}`,
    type: 'menu',
    label: reservation.course,
    subLabel: `${reservation.restaurant} · ${formatChefName(reservation.chef)}`,
    restaurant: reservation.restaurant,
    chef: reservation.chef,
    image: reservation.chefImage ?? getChefImageByName(reservation.chef),
    matchMeta: reservation.status === 'completed' ? '지난 다이닝 코스' : '예약된 코스',
    signatureItems: reservation.adjustments.map((adjustment) => adjustment.taste),
    searchText: buildSearchText([
      reservation.course,
      reservation.restaurant,
      ...getRestaurantSearchAliases(reservation.restaurant),
      reservation.chef,
      ...reservation.adjustments.map((adjustment) => adjustment.taste),
    ]),
  }));

  return [...dishResults, ...reservationResults];
}

function getWeightedSearchFields(item: HomeSearchResult) {
  const restaurantAliases =
    item.type === 'restaurant'
      ? getRestaurantSearchAliases(item.label)
      : getRestaurantSearchAliases(item.restaurant);

  return [
    { value: item.label, weight: 150 },
    ...restaurantAliases.map((alias) => ({ value: alias, weight: 132 })),
    { value: item.restaurant, weight: item.type === 'restaurant' ? 126 : 104 },
    { value: item.chef, weight: item.type === 'chef' ? 122 : 78 },
    { value: item.subLabel, weight: 62 },
    ...item.signatureItems.map((signatureItem) => ({ value: signatureItem, weight: 58 })),
    { value: item.matchMeta, weight: 44 },
    { value: item.searchText, weight: 36 },
  ];
}

function getFieldMatchScore(
  fieldValue: string,
  queryVariants: string[],
  queryTerms: string[],
  weight: number,
) {
  const fieldVariants = buildSearchVariants(fieldValue);
  if (fieldVariants.length === 0) {
    return -1;
  }

  const compactTerms = queryTerms.map((term) => term.replace(/\s+/g, '')).filter(Boolean);

  return fieldVariants.reduce((bestScore, fieldVariant) => {
    const directScore = queryVariants.reduce((score, queryVariant) => {
      if (!queryVariant) {
        return score;
      }

      if (fieldVariant === queryVariant) {
        return Math.max(score, weight + 70);
      }

      if (fieldVariant.startsWith(queryVariant)) {
        return Math.max(score, weight + 45);
      }

      if (fieldVariant.includes(queryVariant)) {
        return Math.max(score, weight + 24);
      }

      return score;
    }, -1);

    const termScore =
      queryTerms.length > 1 &&
      queryTerms.every((term, index) => (
        fieldVariant.includes(term) ||
        Boolean(compactTerms[index] && fieldVariant.includes(compactTerms[index]))
      ))
        ? weight + 16 + queryTerms.length * 6
        : -1;

    return Math.max(bestScore, directScore, termScore);
  }, -1);
}

function calculateMatchScore(query: string, item: HomeSearchResult) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery || !hasSearchableCompleteCharacter(normalizedQuery)) {
    return -1;
  }

  const terms = splitSearchTerms(query);
  const queryVariants = buildQueryVariants(query);
  const fieldScore = getWeightedSearchFields(item).reduce((bestScore, field) => (
    Math.max(bestScore, getFieldMatchScore(field.value, queryVariants, terms, field.weight))
  ), -1);

  return fieldScore;
}

function filterResults(results: HomeSearchResult[], query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery || !hasSearchableCompleteCharacter(normalizedQuery)) {
    return [];
  }

  return results
    .map((result) => ({
      result,
      score: calculateMatchScore(query, result),
    }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score || left.result.label.localeCompare(right.result.label, 'ko'))
    .slice(0, MAX_GROUP_RESULTS)
    .map((entry) => entry.result);
}

function buildSuggestedQueries(
  restaurantResults: HomeSearchResult[],
  chefResults: HomeSearchResult[],
  menuResults: HomeSearchResult[],
) {
  const candidates = [
    ...restaurantResults.slice(0, 3),
    ...chefResults.slice(0, 2),
    ...menuResults.slice(0, 3),
  ];

  return Array.from(new Map(candidates.map((candidate) => [candidate.label, candidate])).values()).slice(0, 6);
}

function buildKakaoSearchResult(place: Awaited<ReturnType<typeof searchKakaoRestaurantPlaces>>[number]) {
  const name = place.name?.trim();

  if (!name) {
    return null;
  }

  const address = place.roadAddress || place.address;

  return {
    id: `kakao-restaurant-${place.placeId ?? normalizeSearchValue(`${name}-${address ?? ''}`)}`,
    type: 'restaurant',
    label: name,
    subLabel: address ?? '주소 확인 중',
    restaurant: name,
    chef: 'Taste Buddy 분석 준비 중',
    image: null,
    matchMeta:
      '카카오가 제공한 장소 정보로 먼저 확인하고, 메뉴별 미각 분석은 Taste Buddy 데이터가 준비되면 이어서 볼 수 있어요.',
    signatureItems: [place.category, place.phone ? `전화 ${place.phone}` : null]
      .filter((item): item is string => Boolean(item))
      .slice(0, 3),
    searchText: buildSearchText([name, address, place.category ?? '', place.phone ?? '']),
    source: 'kakao',
    place: {
      address,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      placeId: place.placeId,
      placeUrl: place.placeUrl,
    },
  } satisfies HomeSearchResult;
}

function needsKakaoAddressEnhancement(result: HomeSearchResult) {
  const normalizedRestaurant = normalizeSearchValue(result.restaurant);

  return (
    result.type === 'restaurant' &&
    !result.place?.address &&
    result.source !== 'kakao' &&
    !normalizedRestaurant.includes('benu')
  );
}

function findMatchingKakaoRestaurantResult(
  result: HomeSearchResult,
  kakaoRestaurantResults: HomeSearchResult[],
) {
  const normalizedRestaurant = normalizeSearchValue(result.restaurant || result.label);

  return kakaoRestaurantResults.find((candidate) => {
    const normalizedCandidate = normalizeSearchValue(candidate.restaurant || candidate.label);

    return (
      normalizedCandidate === normalizedRestaurant ||
      normalizedCandidate.includes(normalizedRestaurant) ||
      normalizedRestaurant.includes(normalizedCandidate)
    );
  }) ?? null;
}

function enhanceRestaurantResultWithKakaoPlace(
  result: HomeSearchResult,
  kakaoRestaurantResults: HomeSearchResult[],
) {
  if (!needsKakaoAddressEnhancement(result)) {
    return result;
  }

  const kakaoMatch = findMatchingKakaoRestaurantResult(result, kakaoRestaurantResults);
  const kakaoAddress = kakaoMatch?.place?.address;

  if (!kakaoAddress) {
    return result;
  }

  return {
    ...result,
    matchMeta: result.matchMeta || kakaoMatch.matchMeta,
    place: kakaoMatch.place,
    subLabel: kakaoAddress,
  };
}

function resolvePendingKakaoAddressResult(
  result: HomeSearchResult,
  kakaoRestaurantResults: HomeSearchResult[],
  isSearching: boolean,
) {
  const enhancedResult = enhanceRestaurantResultWithKakaoPlace(result, kakaoRestaurantResults);

  if (enhancedResult !== result || !isSearching || !needsKakaoAddressEnhancement(result)) {
    return enhancedResult;
  }

  return {
    ...result,
    subLabel: SEARCH_PENDING_ADDRESS_LABEL,
  };
}

function getResultTypeLabel(type: SearchResultType) {
  switch (type) {
    case 'restaurant':
      return '레스토랑';
    case 'chef':
      return '셰프';
    case 'menu':
    default:
      return '메뉴';
  }
}

function getResultTypeIcon(type: SearchResultType) {
  switch (type) {
    case 'restaurant':
      return Store;
    case 'chef':
      return ChefHat;
    case 'menu':
    default:
      return Utensils;
  }
}

function SearchSuggestionChip({
  label,
  onClick,
  tone = 'default',
}: {
  label: string;
  onClick: () => void;
  tone?: 'default' | 'recent';
}) {
  return (
    <Chip
      size="md"
      tone="neutral"
      variant={tone === 'recent' ? 'outline' : 'soft'}
      backgroundColorToken={
        tone === 'recent' ? 'var(--tb-color-surface-base)' : undefined
      }
      leadingIcon={tone === 'recent' ? <Clock /> : <Sparkles />}
      role="button"
      tabIndex={0}
      aria-pressed="false"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'cursor-pointer select-none transition-colors',
        tone === 'recent'
          ? 'text-[var(--tb-color-text-primary)] hover:bg-[var(--tb-color-surface-muted)]'
          : 'text-[var(--tb-color-text-body)] hover:bg-[var(--tb-color-surface-disabled)]',
      )}
    >
      {label}
    </Chip>
  );
}

function SearchFocusCard({ result }: { result: HomeSearchResult }) {
  const TypeIcon = getResultTypeIcon(result.type);

  return (
    <div className={SEARCH_FOCUS_CARD_CLASS_NAME}>
      <div className="flex items-start gap-3">
        <ChefAvatar
          alt={result.chef}
          className="size-[52px] shrink-0 rounded-[18px]"
          iconSize={ICON_TOKENS.size.lg}
          imageSrc={result.image}
          variant="neutral"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={SEARCH_RESULT_TYPE_LABEL_CLASS_NAME}>
              탐색 포커스
            </span>
            <Chip
              size="md"
              tone="neutral"
              leadingIcon={<TypeIcon />}
              className="text-[var(--tb-color-text-body)]"
            >
              {getResultTypeLabel(result.type)}
            </Chip>
          </div>
          <p className={SEARCH_RESULT_TITLE_CLASS_NAME}>
            {result.label}
          </p>
          <p className={SEARCH_RESULT_DESCRIPTION_CLASS_NAME}>
            {result.subLabel}
          </p>
        </div>
      </div>
      <p className={SEARCH_RESULT_BODY_COPY_CLASS_NAME}>
        {result.matchMeta}
      </p>
      {result.signatureItems.length > 0 ? (
        <div className={SEARCH_RESULT_SIGNATURES_CLASS_NAME}>
          {result.signatureItems.slice(0, 3).map((item) => (
            <Chip
              key={item}
              size="md"
              tone="neutral"
              className="text-[var(--tb-color-text-body)]"
            >
              {item}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchSection({
  bookmarkedRestaurantKeys,
  onBookmarkToggle,
  onRecordToggle,
  recordedResultIds,
  title,
  results,
  selectedResultId,
  onSelect,
}: {
  bookmarkedRestaurantKeys: string[];
  onBookmarkToggle: (result: HomeSearchResult) => void;
  onRecordToggle: (result: HomeSearchResult) => void;
  onSelect: (result: HomeSearchResult) => void;
  recordedResultIds: string[];
  results: HomeSearchResult[];
  selectedResultId: string | null;
  title: string;
}) {
  return (
    <section className="tb-section-stack" aria-label={title}>
      <div className="flex items-center justify-between">
        <h3 className={SEARCH_SECTION_TITLE_CLASS_NAME}>{title}</h3>
        <span className={SEARCH_SECTION_COUNT_CLASS_NAME}>
          {results.length}개
        </span>
      </div>
      <ul className="grid gap-3">
        {results.map((result) => {
          const isSelected = selectedResultId === result.id;
          const isRecorded = recordedResultIds.includes(result.id);
          const restaurantKey = getRestaurantBookmarkKey(result.restaurant);
          const isBookmarked =
            bookmarkedRestaurantKeys.includes(restaurantKey) ||
            isRestaurantBookmarked(result.restaurant);
          const RecordIcon = isRecorded ? CircleCheck : CirclePlus;
          const BookmarkIcon = Bookmark;

          return (
            <li
              key={result.id}
              className="list-none"
            >
              <CompactCard
                as="div"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(result)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(result);
                  }
                }}
                aria-pressed={isSelected}
                title={result.matchMeta}
                className={cn(
                  isSelected
                    ? 'bg-[var(--tb-user-accent-tint-soft)]'
                    : 'hover:bg-[var(--tb-color-surface-card-hover)]',
                )}
                media={
                  <ChefAvatar
                    alt={result.chef}
                    className="h-[40px] w-[40px] shrink-0 rounded-[var(--tb-radius-10)] object-cover"
                    iconSize={ICON_TOKENS.size.lg}
                    imageSrc={result.image}
                    variant="neutral"
                  />
                }
                heading={result.label}
                metadata={result.subLabel}
                headingClassName="font-semibold"
                metadataClassName="font-normal"
                actions={
                  <div className="flex items-center justify-end gap-0">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRecordToggle(result);
                        }}
                        aria-label="내 기록에 추가"
                        title="내 기록에 추가"
                        className={cn(
                          'flex items-center justify-center rounded-full transition-colors',
                          isRecorded
                            ? 'text-[var(--tb-color-text-secondary)] [&>svg>circle]:fill-current [&>svg>path]:stroke-white'
                            : 'text-[var(--tb-color-icon-muted)] hover:text-[var(--tb-color-text-primary)]',
                        )}
                        style={{
                          width: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                          height: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                        }}
                      >
                        <RecordIcon
                          strokeWidth={1.8}
                          size={
                            isRecorded
                              ? SEARCH_RESULT_ACTIVE_RECORD_ICON_SIZE
                              : SEARCH_RESULT_ACTION_ICON_SIZE
                          }
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onBookmarkToggle(result);
                        }}
                        aria-label="나중에 갈 레스토랑에 추가"
                        title="나중에 갈 레스토랑에 추가"
                        className={cn(
                          'flex items-center justify-center rounded-full transition-colors',
                          isBookmarked
                            ? 'text-[var(--tb-color-text-secondary)] [&>svg]:fill-current'
                            : 'text-[var(--tb-color-icon-muted)] hover:text-[var(--tb-color-text-primary)]',
                        )}
                        style={{
                          width: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                          height: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                        }}
                      >
                        <BookmarkIcon size={SEARCH_RESULT_ACTION_ICON_SIZE} strokeWidth={1.8} />
                      </button>
                  </div>
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FriendSearchSection({
  canAddFriend,
  canRemoveFriend,
  friends,
  onOpenProfile,
  onToggleFriend,
  updatingFriendId,
}: {
  canAddFriend: boolean;
  canRemoveFriend: boolean;
  friends: DiningFriendProfile[];
  onOpenProfile?: (friend: DiningFriendProfile) => void;
  onToggleFriend: (friend: DiningFriendProfile) => void;
  updatingFriendId: string | null;
}) {
  return (
    <section className="tb-section-stack" aria-label="버디">
      <div className="flex items-center justify-between">
        <h3 className={SEARCH_SECTION_TITLE_CLASS_NAME}>버디</h3>
        <span className={SEARCH_SECTION_COUNT_CLASS_NAME}>{friends.length}명</span>
      </div>
      <ul className="grid gap-3">
        {friends.map((friend) => (
          <li key={friend.id} className="list-none">
            <DiningFriendProfileCard
              actionAriaLabel={friend.isFriend ? '팔로잉 취소' : '팔로우'}
              actionDisabled={
                updatingFriendId === friend.id ||
                (friend.isFriend ? !canRemoveFriend : !canAddFriend)
              }
              actionLabel={
                friend.isFriend
                  ? updatingFriendId === friend.id
                    ? '취소 중'
                    : '팔로잉'
                  : updatingFriendId === friend.id
                    ? '추가 중'
                    : '팔로우'
              }
              actionVariant={friend.isFriend ? 'neutral' : 'accent'}
              friend={friend}
              onAction={onToggleFriend}
              onOpenProfile={onOpenProfile}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomeUnifiedSearch({
  catalog,
  closeTrigger,
  onAddFriend,
  onOpenTasteBuddyProfile,
  onOpenRestaurantDetail,
  onRemoveFriend,
  onStartDiningFeedback,
  onSearchFriends,
  openTrigger,
  reservations,
  showTrigger = true,
}: HomeUnifiedSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCloseTriggerRef = useRef(closeTrigger);
  const lastOpenTriggerRef = useRef(openTrigger);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<HomeSearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [recordedResultIds, setRecordedResultIds] = useState<string[]>([]);
  const [bookmarkedRestaurantKeys, setBookmarkedRestaurantKeys] = useState<string[]>([]);
  const [kakaoResults, setKakaoResults] = useState<HomeSearchResult[]>([]);
  const [kakaoResultQueryKey, setKakaoResultQueryKey] = useState('');
  const [isKakaoSearching, setIsKakaoSearching] = useState(false);
  const [friendResults, setFriendResults] = useState<DiningFriendProfile[]>([]);
  const [isFriendSearching, setIsFriendSearching] = useState(false);
  const [friendSearchMessage, setFriendSearchMessage] = useState<string | null>(null);
  const [updatingFriendId, setUpdatingFriendId] = useState<string | null>(null);
  const [bookmarkSheetResult, setBookmarkSheetResult] = useState<HomeSearchResult | null>(null);
  const [, setBookmarkSyncIndex] = useState(0);
  const kakaoSearchCacheRef = useRef<Record<string, HomeSearchResult[]>>(loadKakaoSearchCache());

  const kakaoSearchCacheKey = getKakaoSearchCacheKey(query);
  const cachedKakaoResults = kakaoSearchCacheKey
    ? kakaoSearchCacheRef.current[kakaoSearchCacheKey] ?? []
    : [];
  const effectiveKakaoResults =
    kakaoResultQueryKey === kakaoSearchCacheKey && kakaoResults.length > 0
      ? kakaoResults
      : cachedKakaoResults;
  const restaurantResults = buildRestaurantResults(catalog, reservations);
  const chefResults = buildChefResults(catalog, reservations);
  const menuResults = buildMenuResults(catalog, reservations);
  const suggestions = buildSuggestedQueries(restaurantResults, chefResults, menuResults);
  const filteredRestaurants = query.trim() ? filterResults(restaurantResults, query) : [];
  const filteredChefs = query.trim() ? filterResults(chefResults, query) : [];
  const filteredMenus = query.trim() ? filterResults(menuResults, query) : [];
  const hasRestaurantResultsNeedingKakaoAddress =
    filteredRestaurants.some(needsKakaoAddressEnhancement);
  const shouldSearchKakao =
    Boolean(query.trim()) &&
    hasSearchableCompleteCharacter(normalizeSearchValue(query)) &&
    (
      (filteredRestaurants.length === 0 && filteredChefs.length === 0 && filteredMenus.length === 0) ||
      hasRestaurantResultsNeedingKakaoAddress
    ) &&
    friendResults.length === 0 &&
    !isFriendSearching;
  const enhancedFilteredRestaurants = filteredRestaurants.map((result) =>
    resolvePendingKakaoAddressResult(
      result,
      effectiveKakaoResults,
      shouldSearchKakao && (isKakaoSearching || effectiveKakaoResults.length > 0),
    ),
  );
  const visibleKakaoResults =
    shouldSearchKakao && filteredRestaurants.length === 0 ? effectiveKakaoResults : [];
  const searchGroups: SearchGroups = {
    restaurants:
      enhancedFilteredRestaurants.length > 0 ? enhancedFilteredRestaurants : visibleKakaoResults,
    chefs: filteredChefs,
    friends: friendResults,
    menus: filteredMenus,
    totalCount:
      enhancedFilteredRestaurants.length +
      filteredChefs.length +
      friendResults.length +
      filteredMenus.length +
      visibleKakaoResults.length,
  };
  const bookmarkSheetTargetResult =
    bookmarkSheetResult ?? searchGroups.restaurants[0] ?? restaurantResults[0] ?? null;

  const updateRecentSearches = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) {
      return;
    }

    setRecentSearches((current) => {
      const nextSearches = [nextValue, ...current.filter((item) => item !== nextValue)].slice(
        0,
        MAX_RECENT_SEARCHES,
      );
      saveRecentSearches(nextSearches);
      return nextSearches;
    });
  };

  const getRecentSearchValueForResult = (result: HomeSearchResult) => (
    result.source === 'kakao' ? query.trim() || result.label : result.label
  );

  const dismissKeyboard = () => {
    inputRef.current?.blur();
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const handleClose = (immediate = false) => {
    dismissKeyboard();

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (immediate) {
      setIsClosing(false);
      setIsOpen(false);
      setQuery('');
      setSelectedResult(null);
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsClosing(false);
      setIsOpen(false);
      setQuery('');
      setSelectedResult(null);
      closeTimerRef.current = null;
    }, 200);
  };

  const handleOpen = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsClosing(false);
    setIsOpen(true);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldSearchKakao) {
      setKakaoResults([]);
      setKakaoResultQueryKey('');
      setIsKakaoSearching(false);
      return;
    }

    let isCancelled = false;
    const cacheKey = getKakaoSearchCacheKey(query);
    const cachedResults = kakaoSearchCacheRef.current[cacheKey] ?? [];

    setKakaoResultQueryKey(cacheKey);
    setKakaoResults(cachedResults);
    setIsKakaoSearching(true);

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const places = await searchKakaoRestaurantPlaces(query);

        if (isCancelled) {
          return;
        }

        const nextResults = places
            .map(buildKakaoSearchResult)
            .filter((result): result is HomeSearchResult => Boolean(result))
            .slice(0, MAX_GROUP_RESULTS);

        if (nextResults.length > 0) {
          kakaoSearchCacheRef.current = {
            ...kakaoSearchCacheRef.current,
            [cacheKey]: nextResults,
          };
          saveKakaoSearchCache(kakaoSearchCacheRef.current);
        }

        setKakaoResultQueryKey(cacheKey);
        setKakaoResults(nextResults);
        setIsKakaoSearching(false);
      })();
    }, cachedResults.length > 0 ? 0 : KAKAO_SEARCH_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, shouldSearchKakao]);

  useEffect(() => {
    const nextQuery = query.trim();

    if (!onSearchFriends || !isSearchableProfileIdentityQuery(nextQuery)) {
      setFriendResults([]);
      setFriendSearchMessage(null);
      setIsFriendSearching(false);
      return;
    }

    let isCancelled = false;
    setIsFriendSearching(true);

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const result = await onSearchFriends(nextQuery);

        if (isCancelled) {
          return;
        }

        setFriendResults(result.ok ? result.friends : []);
        setFriendSearchMessage(result.ok ? null : result.message);
        setIsFriendSearching(false);
      })();
    }, 220);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const handleSuggestionSelect = (value: string) => {
    setQuery(value);
    updateRecentSearches(value);
    setSelectedResult(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleResultSelect = (result: HomeSearchResult) => {
    updateRecentSearches(getRecentSearchValueForResult(result));
    if (onOpenRestaurantDetail) {
      handleClose(true);
      onOpenRestaurantDetail(result);
      return;
    }

    setSelectedResult(result);
  };

  const handleFriendToggle = async (friend: DiningFriendProfile) => {
    const handler = friend.isFriend ? onRemoveFriend : onAddFriend;

    if (!handler) {
      return;
    }

    setUpdatingFriendId(friend.id);
    setFriendSearchMessage(null);
    const result = await handler(friend);
    setUpdatingFriendId((currentId) => (currentId === friend.id ? null : currentId));
    setFriendSearchMessage(result.message);

    if (result.ok) {
      setFriendResults((currentResults) =>
        currentResults.map((item) =>
          item.id === friend.id ? { ...item, isFriend: !friend.isFriend } : item,
        ),
      );
      if (!friend.isFriend) {
        updateRecentSearches(`@${friend.nickname}`);
      }
    }
  };

  const handleFriendProfileOpen = (friend: DiningFriendProfile) => {
    if (!onOpenTasteBuddyProfile) {
      return;
    }

    updateRecentSearches(query.trim() || friend.displayName || `@${friend.nickname}`);
    handleClose(true);
    onOpenTasteBuddyProfile(friend);
  };

  const handleClearQuery = () => {
    setQuery('');
    setSelectedResult(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleRecordedResult = (resultId: string) => {
    setRecordedResultIds((current) =>
      current.includes(resultId)
        ? current.filter((item) => item !== resultId)
        : [...current, resultId],
    );
  };

  const handleRecordResult = (result: HomeSearchResult) => {
    updateRecentSearches(getRecentSearchValueForResult(result));

    if (!onStartDiningFeedback) {
      toggleRecordedResult(result.id);
      return;
    }

    setRecordedResultIds((current) =>
      current.includes(result.id) ? current : [...current, result.id],
    );
    handleClose(true);
    onStartDiningFeedback(result);
  };

  const toggleBookmarkedResult = (result: HomeSearchResult) => {
    setBookmarkSheetResult(result);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      return;
    }

    const primaryResult =
      searchGroups.restaurants[0] ?? searchGroups.chefs[0] ?? searchGroups.menus[0] ?? null;
    if (primaryResult) {
      handleResultSelect(primaryResult);
      return;
    }

    updateRecentSearches(nextQuery);
  };

  useEffect(() => {
    if (openTrigger === undefined || openTrigger === lastOpenTriggerRef.current) {
      return;
    }

    lastOpenTriggerRef.current = openTrigger;
    handleOpen();
  }, [openTrigger]);

  useEffect(() => {
    if (closeTrigger === undefined || closeTrigger === lastCloseTriggerRef.current) {
      return;
    }

    lastCloseTriggerRef.current = closeTrigger;
    handleClose(true);
  }, [closeTrigger]);

  useEffect(() => {
    if (!isOpen || isClosing) {
      return;
    }

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen, isClosing]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      HOME_RECENT_SEARCH_STORAGE_KEY,
      JSON.stringify(recentSearches),
    );
  }, [recentSearches]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedResult(null);
  }, [query]);

  useEffect(() => {
    const syncBookmarkState = () => {
      setBookmarkSyncIndex((current) => current + 1);
    };

    window.addEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncBookmarkState);
    window.addEventListener('storage', syncBookmarkState);

    return () => {
      window.removeEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncBookmarkState);
      window.removeEventListener('storage', syncBookmarkState);
    };
  }, []);

  return (
    <>
      {showTrigger ? (
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={handleOpen}
            aria-label="통합 검색 열기"
            className={SEARCH_BAR_FIELD_CLASS_NAME}
          >
            <span className="truncate text-[13px] font-medium text-[var(--tb-color-text-muted)]">
              레스토랑, 메뉴, 셰프, 버디 검색
            </span>
          </button>
          <button
            type="button"
            onClick={handleOpen}
            aria-label="통합 검색"
            className={SEARCH_BAR_ICON_BUTTON_CLASS_NAME}
          >
            <Search size={SEARCH_BAR_ICON_SIZE} />
          </button>
        </div>
      ) : null}

      {isOpen ? (
        <SearchOverlayShell
          ariaLabel="통합 검색"
          inputRef={inputRef}
          isClosing={isClosing}
          onClearQuery={handleClearQuery}
          onClose={() => handleClose()}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
          placeholder="레스토랑, 메뉴, 셰프, 버디 검색"
          query={query}
        >
                <div className="tb-section-stack">
                  {selectedResult ? <SearchFocusCard result={selectedResult} /> : null}

                  {!query.trim() ? (
                    <>
                      {recentSearches.length > 0 ? (
                        <section className={SEARCH_SUGGESTION_SECTION_CLASS_NAME}>
                          <div className="flex items-center justify-between">
                            <h3 className={SEARCH_SECTION_TITLE_CLASS_NAME}>
                              최근 검색
                            </h3>
                            <button
                              type="button"
                              onClick={() => {
                                setRecentSearches([]);
                                saveRecentSearches([]);
                              }}
                              className={`${SEARCH_SECTION_COUNT_CLASS_NAME} transition-colors hover:text-[var(--tb-color-text-body)]`}
                            >
                              모두 지우기
                            </button>
                          </div>
                          <div className={SEARCH_SUGGESTION_ITEMS_CLASS_NAME}>
                            {recentSearches.map((item) => (
                              <SearchSuggestionChip
                                key={item}
                                label={item}
                                onClick={() => handleSuggestionSelect(item)}
                                tone="recent"
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      <section className={SEARCH_SUGGESTION_SECTION_CLASS_NAME}>
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className={SEARCH_SECTION_TITLE_CLASS_NAME}>
                            추천 탐색
                          </h3>
                          <p className={SEARCH_RESULT_DESCRIPTION_CLASS_NAME}>
                            레스토랑을 먼저, 셰프와 메뉴, 다이닝 친구까지 함께 찾을 수 있어요.
                          </p>
                        </div>
                        <div className={SEARCH_SUGGESTION_ITEMS_CLASS_NAME}>
                          {suggestions.map((item) => (
                            <SearchSuggestionChip
                              key={item.id}
                              label={item.label}
                              onClick={() => handleSuggestionSelect(item.label)}
                            />
                          ))}
                        </div>
                      </section>
                    </>
                  ) : searchGroups.totalCount > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                          총 {searchGroups.totalCount}개 결과
                        </p>
                        <p className="text-[11px] font-medium text-[var(--tb-color-text-faint)]">
                          레스토랑 · 버디 함께 정렬
                        </p>
                      </div>

                      {searchGroups.restaurants.length > 0 ? (
                        <SearchSection
                          bookmarkedRestaurantKeys={bookmarkedRestaurantKeys}
                          onBookmarkToggle={toggleBookmarkedResult}
                          onRecordToggle={handleRecordResult}
                          recordedResultIds={recordedResultIds}
                          title="레스토랑"
                          results={searchGroups.restaurants}
                          selectedResultId={selectedResult?.id ?? null}
                          onSelect={handleResultSelect}
                        />
                      ) : null}

                      {searchGroups.chefs.length > 0 ? (
                        <SearchSection
                          bookmarkedRestaurantKeys={bookmarkedRestaurantKeys}
                          onBookmarkToggle={toggleBookmarkedResult}
                          onRecordToggle={handleRecordResult}
                          recordedResultIds={recordedResultIds}
                          title="셰프"
                          results={searchGroups.chefs}
                          selectedResultId={selectedResult?.id ?? null}
                          onSelect={handleResultSelect}
                        />
                      ) : null}

                      {searchGroups.friends.length > 0 ? (
                        <FriendSearchSection
                          canAddFriend={Boolean(onAddFriend)}
                          canRemoveFriend={Boolean(onRemoveFriend)}
                          friends={searchGroups.friends}
                          onOpenProfile={
                            onOpenTasteBuddyProfile
                              ? (friend) => handleFriendProfileOpen(friend)
                              : undefined
                          }
                          onToggleFriend={(friend) => void handleFriendToggle(friend)}
                          updatingFriendId={updatingFriendId}
                        />
                      ) : null}

                      {searchGroups.menus.length > 0 ? (
                        <SearchSection
                          bookmarkedRestaurantKeys={bookmarkedRestaurantKeys}
                          onBookmarkToggle={toggleBookmarkedResult}
                          onRecordToggle={handleRecordResult}
                          recordedResultIds={recordedResultIds}
                          title="메뉴"
                          results={searchGroups.menus}
                          selectedResultId={selectedResult?.id ?? null}
                          onSelect={handleResultSelect}
                        />
                      ) : null}

                      {friendSearchMessage ? (
                        <p className="text-[11px] leading-relaxed text-[var(--tb-color-text-muted)]">
                          {friendSearchMessage}
                        </p>
                      ) : null}
                    </>
                  ) : isKakaoSearching || isFriendSearching ? (
                    <div className={SEARCH_EMPTY_STATE_CLASS_NAME}>
                      <EmptyState
                        icon={<Search size={APP_LUCIDE_ICON_SIZE_M} />}
                        title={isFriendSearching ? '버디 이름을 확인하고 있어요' : '카카오에서 식당 정보를 확인하고 있어요'}
                        description={
                          isFriendSearching
                            ? '이름과 버디네임을 함께 비교해 다이닝 친구 후보를 찾고 있어요.'
                            : 'Taste Buddy에 아직 없는 식당도 같은 상세 페이지에서 먼저 확인할 수 있어요.'
                        }
                      />
                    </div>
                  ) : (
                    <div className={SEARCH_EMPTY_STATE_CLASS_NAME}>
                      <EmptyState
                        icon={<Search size={APP_LUCIDE_ICON_SIZE_M} />}
                        title={friendSearchMessage ? '버디 검색을 확인하지 못했어요' : '아직 맞는 결과를 찾지 못했어요'}
                        description={
                          friendSearchMessage ??
                          '레스토랑 이름, 셰프 이름, 코스명, 버디 이름이나 버디네임으로 다시 시도해보세요. 추천 탐색 키워드로 시작해도 좋아요.'
                        }
                      />
                      {suggestions.length > 0 ? (
                        <div className="mt-2 flex flex-wrap justify-center gap-2 px-4 pb-2">
                          {suggestions.map((item) => (
                            <SearchSuggestionChip
                              key={item.id}
                              label={item.label}
                              onClick={() => handleSuggestionSelect(item.label)}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
        </SearchOverlayShell>
      ) : null
      }
      {bookmarkSheetTargetResult ? (
        <RestaurantBookmarkSheet
          open={bookmarkSheetResult !== null}
          onOpenChange={(open) => {
            if (!open) {
              setBookmarkSheetResult(null);
            }
          }}
          onSaved={() => {
            const restaurantName = bookmarkSheetResult?.restaurant;

            if (!restaurantName) {
              return;
            }

            const restaurantKey = getRestaurantBookmarkKey(restaurantName);
            setBookmarkedRestaurantKeys((current) =>
              current.includes(restaurantKey) ? current : [...current, restaurantKey],
            );
          }}
          restaurant={createRestaurantDetailFromSearchResult(bookmarkSheetTargetResult)}
        />
      ) : null}
    </>
  );
}
