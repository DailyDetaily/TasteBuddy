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
  X,
} from 'lucide-react';

import ChefAvatar from '../system/ChefAvatar';
import Chip from '../system/Chip';
import EmptyState from '../system/EmptyState';
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
import {
  RESTAURANT_BOOKMARKS_CHANGED_EVENT,
  getRestaurantBookmarkKey,
  isRestaurantBookmarked,
} from '../restaurant/RestaurantBookmarkSheet';

const HOME_RECENT_SEARCH_STORAGE_KEY = 'tastebuddy-home-recent-searches-v1';
const MAX_RECENT_SEARCHES = 5;
const MAX_GROUP_RESULTS = 6;
const SEARCH_BAR_FIELD_CLASS_NAME =
  'flex h-11 min-w-0 flex-1 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-left transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const SEARCH_BAR_ICON_BUTTON_CLASS_NAME =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[#303946] transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const APP_LUCIDE_ICON_SIZE_M = ICON_TOKENS.size.md;
const SEARCH_BAR_ICON_SIZE = ICON_TOKENS.size.md;
const SEARCH_RESULT_ACTION_BUTTON_SIZE = ICON_TOKENS.container.lg;
const SEARCH_RESULT_ACTION_ICON_SIZE = ICON_TOKENS.size.lg;
const SEARCH_RESULT_ACTIVE_RECORD_ICON_SIZE = 24;
const SEARCH_OVERLAY_TOP_OFFSET =
  'calc(var(--tb-safe-area-top) + var(--tb-size-top-app-bar-height))';
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
const SEARCH_PANEL_HEADER_CLASS_NAME =
  'border-b border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)]/95 px-5 pb-4 pt-1 backdrop-blur-sm';
const SEARCH_PANEL_BODY_CLASS_NAME = 'flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-4';
const SEARCH_SUGGESTION_SECTION_CLASS_NAME = 'tb-card-stack';
const SEARCH_SUGGESTION_ITEMS_CLASS_NAME = 'flex flex-wrap gap-2';

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
  menus: HomeSearchResult[];
  restaurants: HomeSearchResult[];
  totalCount: number;
};

interface HomeUnifiedSearchProps {
  catalog: RestaurantContentCatalog;
  onOpenRestaurantDetail?: (result: HomeSearchResult) => void;
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

function splitSearchTerms(value: string) {
  return normalizeSearchValue(value)
    .split(' ')
    .map((term) => term.trim())
    .filter(Boolean);
}

function hasSearchableCompleteCharacter(value: string) {
  return /[가-힣a-z0-9]/i.test(value);
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

function resolveChefImage(
  name: string,
  reservations: ReservationRecord[],
  avatarPath?: string | null,
) {
  const resolvedAvatarPath = resolveUsableImagePath(avatarPath);
  if (resolvedAvatarPath) {
    return resolvedAvatarPath;
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
      subLabel: `${formatChefName(chefName)} · 대표 메뉴 ${Math.min(signatureItems.length, 2)}개`,
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
      subLabel:
        existingResult?.subLabel ?? `${formatChefName(reservation.chef)} · 예약 기반 탐색`,
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

function calculateMatchScore(query: string, item: HomeSearchResult) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery || !hasSearchableCompleteCharacter(normalizedQuery)) {
    return -1;
  }

  const terms = splitSearchTerms(query);
  const searchableNames = [
    item.label,
    ...(item.type === 'restaurant' ? getRestaurantSearchAliases(item.label) : []),
  ].map(normalizeSearchValue).filter(Boolean);

  const hasNameMatch = searchableNames.some((name) => name.includes(normalizedQuery));
  const hasTermMatch = terms.length > 0 && searchableNames.some((name) =>
    terms.every((term) => name.includes(term)),
  );

  if (!hasNameMatch && !hasTermMatch) {
    return -1;
  }

  let score = 0;
  const normalizedLabel = normalizeSearchValue(item.label);

  if (normalizedLabel === normalizedQuery) {
    score += 150;
  } else if (normalizedLabel.startsWith(normalizedQuery)) {
    score += 120;
  } else if (normalizedLabel.includes(normalizedQuery)) {
    score += 100;
  }

  score += searchableNames
    .filter((name) => name !== normalizedLabel && name.includes(normalizedQuery))
    .length * 80;
  score += terms.filter((term) => searchableNames.some((name) => name.includes(term))).length * 20;

  return score;
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
    subLabel: address ? `카카오 장소 정보 · ${address}` : '카카오 장소 정보',
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
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      placeId: place.placeId,
      placeUrl: place.placeUrl,
    },
  } satisfies HomeSearchResult;
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
  onRecordToggle: (resultId: string) => void;
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
              <div
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
                  SEARCH_RESULT_CARD_CLASS_NAME,
                  isSelected
                    ? SEARCH_RESULT_CARD_SELECTED_CLASS_NAME
                    : SEARCH_RESULT_CARD_UNSELECTED_CLASS_NAME,
                )}
              >
                <div className={SEARCH_RESULT_CARD_BODY_CLASS_NAME}>
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <ChefAvatar
                        alt={result.chef}
                        className="h-[40px] w-[40px] shrink-0 rounded-[var(--tb-radius-10)] object-cover"
                        iconSize={ICON_TOKENS.size.lg}
                        imageSrc={result.image}
                        variant="neutral"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                          {result.label}
                        </span>
                        <span className="block truncate text-[11px] text-[var(--tb-color-text-muted)]">
                          {result.subLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-0">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRecordToggle(result.id);
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
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function HomeUnifiedSearch({
  catalog,
  onOpenRestaurantDetail,
  openTrigger,
  reservations,
  showTrigger = true,
}: HomeUnifiedSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastOpenTriggerRef = useRef(openTrigger);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<HomeSearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [recordedResultIds, setRecordedResultIds] = useState<string[]>([]);
  const [bookmarkedRestaurantKeys, setBookmarkedRestaurantKeys] = useState<string[]>([]);
  const [kakaoResults, setKakaoResults] = useState<HomeSearchResult[]>([]);
  const [isKakaoSearching, setIsKakaoSearching] = useState(false);
  const [, setBookmarkSyncIndex] = useState(0);

  const restaurantResults = buildRestaurantResults(catalog, reservations);
  const chefResults = buildChefResults(catalog, reservations);
  const menuResults = buildMenuResults(catalog, reservations);
  const suggestions = buildSuggestedQueries(restaurantResults, chefResults, menuResults);
  const filteredRestaurants = query.trim() ? filterResults(restaurantResults, query) : [];
  const filteredChefs = query.trim() ? filterResults(chefResults, query) : [];
  const filteredMenus = query.trim() ? filterResults(menuResults, query) : [];
  const shouldSearchKakao =
    Boolean(query.trim()) &&
    hasSearchableCompleteCharacter(normalizeSearchValue(query)) &&
    filteredRestaurants.length === 0 &&
    filteredChefs.length === 0 &&
    filteredMenus.length === 0;
  const visibleKakaoResults = shouldSearchKakao ? kakaoResults : [];
  const searchGroups: SearchGroups = {
    restaurants: filteredRestaurants.length > 0 ? filteredRestaurants : visibleKakaoResults,
    chefs: filteredChefs,
    menus: filteredMenus,
    totalCount:
      filteredRestaurants.length +
      filteredChefs.length +
      filteredMenus.length +
      visibleKakaoResults.length,
  };

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
      return nextSearches;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedResult(null);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    if (!shouldSearchKakao) {
      setKakaoResults([]);
      setIsKakaoSearching(false);
      return;
    }

    let isCancelled = false;
    setIsKakaoSearching(true);

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const places = await searchKakaoRestaurantPlaces(query);

        if (isCancelled) {
          return;
        }

        setKakaoResults(
          places
            .map(buildKakaoSearchResult)
            .filter((result): result is HomeSearchResult => Boolean(result))
            .slice(0, MAX_GROUP_RESULTS),
        );
        setIsKakaoSearching(false);
      })();
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [query, shouldSearchKakao]);

  const handleSuggestionSelect = (value: string) => {
    setQuery(value);
    updateRecentSearches(value);
    setSelectedResult(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleResultSelect = (result: HomeSearchResult) => {
    updateRecentSearches(result.label);
    if (onOpenRestaurantDetail) {
      handleClose();
      onOpenRestaurantDetail(result);
      return;
    }

    setSelectedResult(result);
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

  const toggleBookmarkedResult = (result: HomeSearchResult) => {
    const restaurantKey = getRestaurantBookmarkKey(result.restaurant);

    setBookmarkedRestaurantKeys((current) =>
      current.includes(restaurantKey)
        ? current.filter((item) => item !== restaurantKey)
        : [...current, restaurantKey],
    );
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
    if (!isOpen) {
      return;
    }

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

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
            <span className="truncate text-[13px] font-medium text-[#5D6672]">
              레스토랑, 메뉴, 셰프 검색
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
        <>
          <div
            className="fixed inset-x-0 bottom-0 z-[55] bg-[var(--tb-color-bg-page)]/92 backdrop-blur-[14px] animate-fadeIn"
            style={{ top: SEARCH_OVERLAY_TOP_OFFSET }}
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[56] flex justify-center"
            style={{ top: SEARCH_OVERLAY_TOP_OFFSET }}
          >
            <div className="flex h-full w-full max-w-[1440px] flex-col">
              <div className={SEARCH_PANEL_HEADER_CLASS_NAME}>
                <form className="flex items-center gap-3" onSubmit={handleSubmit}>
                  <div
                    className={cn(
                      SEARCH_BAR_FIELD_CLASS_NAME,
                      'relative hover:bg-[var(--tb-color-surface-muted)]',
                    )}
                  >
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      aria-label="통합 검색"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="레스토랑, 메뉴, 셰프 검색"
                      className="h-full min-w-0 flex-1 border-none bg-transparent pr-8 text-[13px] font-medium text-[#303946] outline-none placeholder:text-[#5D6672]"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={handleClearQuery}
                        aria-label="검색어 지우기"
                        title="검색어 지우기"
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--tb-color-icon-muted)] transition-colors hover:bg-[var(--tb-color-surface-disabled)] hover:text-[var(--tb-color-text-primary)]"
                      >
                        <X size={ICON_TOKENS.size.sm} />
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="submit"
                    aria-label="검색 실행"
                    className={SEARCH_BAR_ICON_BUTTON_CLASS_NAME}
                  >
                    <Search size={SEARCH_BAR_ICON_SIZE} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="shrink-0 text-[13px] font-semibold text-[var(--tb-color-text-body)] transition-colors hover:text-[var(--tb-color-text-primary)]"
                  >
                    취소
                  </button>
                </form>
              </div>

              <div className={SEARCH_PANEL_BODY_CLASS_NAME}>
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
                              onClick={() => setRecentSearches([])}
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
                            레스토랑을 먼저, 셰프와 메뉴를 함께 비교할 수 있도록 정리했어요.
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
                          레스토랑 우선 정렬
                        </p>
                      </div>

                      {searchGroups.restaurants.length > 0 ? (
                        <SearchSection
                          bookmarkedRestaurantKeys={bookmarkedRestaurantKeys}
                          onBookmarkToggle={toggleBookmarkedResult}
                          onRecordToggle={toggleRecordedResult}
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
                          onRecordToggle={toggleRecordedResult}
                          recordedResultIds={recordedResultIds}
                          title="셰프"
                          results={searchGroups.chefs}
                          selectedResultId={selectedResult?.id ?? null}
                          onSelect={handleResultSelect}
                        />
                      ) : null}

                      {searchGroups.menus.length > 0 ? (
                        <SearchSection
                          bookmarkedRestaurantKeys={bookmarkedRestaurantKeys}
                          onBookmarkToggle={toggleBookmarkedResult}
                          onRecordToggle={toggleRecordedResult}
                          recordedResultIds={recordedResultIds}
                          title="메뉴"
                          results={searchGroups.menus}
                          selectedResultId={selectedResult?.id ?? null}
                          onSelect={handleResultSelect}
                        />
                      ) : null}
                    </>
                  ) : isKakaoSearching ? (
                    <div className={SEARCH_EMPTY_STATE_CLASS_NAME}>
                      <EmptyState
                        icon={<Search size={APP_LUCIDE_ICON_SIZE_M} />}
                        title="카카오에서 식당 정보를 확인하고 있어요"
                        description="Taste Buddy에 아직 없는 식당도 같은 상세 페이지에서 먼저 확인할 수 있어요."
                      />
                    </div>
                  ) : (
                    <div className={SEARCH_EMPTY_STATE_CLASS_NAME}>
                      <EmptyState
                        icon={<Search size={APP_LUCIDE_ICON_SIZE_M} />}
                        title="아직 맞는 결과를 찾지 못했어요"
                        description="레스토랑 이름, 셰프 이름, 코스명으로 다시 시도해보세요. 추천 탐색 키워드로 시작해도 좋아요."
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
              </div>
            </div>
          </div>
        </>
      ) : null
      }
    </>
  );
}
