import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  AddCircleFilled,
  AddCircleRegular,
  BookmarkFilled,
  BookmarkRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import {
  ChefHat,
  Clock3,
  Search,
  Sparkles,
  Store,
  UtensilsCrossed,
} from 'lucide-react';

import ChefAvatar from '../system/ChefAvatar';
import EmptyState from '../system/EmptyState';
import { cn } from '../ui/utils';
import { type ReservationRecord } from '../../constants/reservationCatalog';
import { ICON_TOKENS } from '../../constants/designTokens';
import {
  type RestaurantContentCatalog,
  type RestaurantContentDish,
} from '../../lib/tasteBuddySupabase';
import { getChefImageByName } from './HomeCards';

const HOME_RECENT_SEARCH_STORAGE_KEY = 'tastebuddy-home-recent-searches-v1';
const MAX_RECENT_SEARCHES = 5;
const MAX_GROUP_RESULTS = 6;
const SEARCH_BAR_FIELD_CLASS_NAME =
  'flex h-11 min-w-0 flex-1 items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-left transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const SEARCH_BAR_ICON_BUTTON_CLASS_NAME =
  'flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] text-[#303946] transition-colors hover:bg-[var(--tb-color-surface-disabled)]';
const APP_LUCIDE_ICON_SIZE_S = ICON_TOKENS.size.sm;
const APP_LUCIDE_ICON_SIZE_M = ICON_TOKENS.size.md;
const SEARCH_BAR_ICON_SIZE = ICON_TOKENS.size.lg;
const CARD_TRAILING_ICON_SIZE = ICON_TOKENS.size.md;
const SEARCH_RESULT_ACTION_BUTTON_SIZE = ICON_TOKENS.container.lg;
const SEARCH_RESULT_ACTION_ICON_SIZE = ICON_TOKENS.size.lg;

type SearchResultType = 'restaurant' | 'chef' | 'menu';

type HomeSearchResult = {
  chef: string;
  id: string;
  image: string | null;
  label: string;
  matchMeta: string;
  restaurant: string;
  searchText: string;
  signatureItems: string[];
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
  reservations: ReservationRecord[];
}

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
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

function buildSearchText(parts: Array<string | null | undefined>) {
  return normalizeSearchValue(parts.filter(Boolean).join(' '));
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

function resolveChefImage(name: string, reservations: ReservationRecord[]) {
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
      image: existingResult?.image ?? resolveChefImage(chefName, reservations),
      matchMeta: signatureItems.slice(0, 2).join(' · ') || '시즌 메뉴를 살펴볼 수 있어요.',
      signatureItems,
      searchText: buildSearchText([
        dish.restaurant,
        dish.restaurantSlug,
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
      image: resolveChefImage(chef.name, reservations),
      matchMeta:
        chef.signatureDishTitles.slice(0, 2).join(' · ') ||
        '대표 메뉴 힌트가 준비되어 있어요.',
      signatureItems: chef.signatureDishTitles.slice(0, 3),
      searchText: buildSearchText([
        chef.name,
        chef.restaurant,
        chef.restaurantSlug,
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
    image: resolveChefImage(dish.chef, reservations),
    matchMeta: [dish.courseLabel, dish.seasonLabel].filter(Boolean).join(' · ') || dish.subtitle,
    signatureItems: dedupeSignatureItems([dish.subtitle, ...dish.ingredients]),
    searchText: buildSearchText([
      dish.title,
      dish.subtitle,
      dish.restaurant,
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
      reservation.chef,
      ...reservation.adjustments.map((adjustment) => adjustment.taste),
    ]),
  }));

  return [...dishResults, ...reservationResults];
}

function calculateMatchScore(query: string, item: HomeSearchResult) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) {
    return 0;
  }

  const haystack = item.searchText;
  if (!haystack.includes(normalizedQuery)) {
    const terms = splitSearchTerms(query);
    if (!terms.every((term) => haystack.includes(term))) {
      return -1;
    }
  }

  let score = 0;
  const normalizedLabel = normalizeSearchValue(item.label);
  const normalizedSubLabel = normalizeSearchValue(item.subLabel);
  const normalizedMeta = normalizeSearchValue(item.matchMeta);

  if (normalizedLabel === normalizedQuery) {
    score += 150;
  } else if (normalizedLabel.startsWith(normalizedQuery)) {
    score += 120;
  } else if (normalizedLabel.includes(normalizedQuery)) {
    score += 100;
  }

  if (normalizedSubLabel.includes(normalizedQuery)) {
    score += 45;
  }

  if (normalizedMeta.includes(normalizedQuery)) {
    score += 30;
  }

  const terms = splitSearchTerms(query);
  score += terms.filter((term) => haystack.includes(term)).length * 20;

  return score;
}

function filterResults(results: HomeSearchResult[], query: string) {
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
      return UtensilsCrossed;
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors',
        tone === 'recent'
          ? 'border-[var(--tb-color-border-default)] bg-white text-[var(--tb-color-text-primary)] hover:bg-[var(--tb-color-surface-muted)]'
          : 'border-transparent bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-body)] hover:bg-[var(--tb-color-surface-disabled)]',
      )}
    >
      {tone === 'recent' ? (
        <Clock3 size={APP_LUCIDE_ICON_SIZE_S} />
      ) : (
        <Sparkles size={APP_LUCIDE_ICON_SIZE_S} />
      )}
      <span>{label}</span>
    </button>
  );
}

function SearchFocusCard({ result }: { result: HomeSearchResult }) {
  const TypeIcon = getResultTypeIcon(result.type);

  return (
    <div className="rounded-[24px] border border-[var(--tb-color-border-default)] bg-white/95 p-4 shadow-[0_20px_44px_rgba(15,23,42,0.08)]">
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tb-color-text-faint)]">
              탐색 포커스
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tb-color-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--tb-color-text-body)]">
              <TypeIcon size={APP_LUCIDE_ICON_SIZE_S} />
              {getResultTypeLabel(result.type)}
            </span>
          </div>
          <p className="mt-2 text-[15px] font-semibold text-[var(--tb-color-text-primary)]">
            {result.label}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {result.subLabel}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-[var(--tb-color-text-body)]">
        {result.matchMeta}
      </p>
      {result.signatureItems.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.signatureItems.slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full bg-[var(--tb-color-surface-muted)] px-3 py-1 text-[11px] font-medium text-[var(--tb-color-text-body)]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchSection({
  bookmarkedResultIds,
  onBookmarkToggle,
  onRecordToggle,
  recordedResultIds,
  title,
  results,
  selectedResultId,
  onSelect,
}: {
  bookmarkedResultIds: string[];
  onBookmarkToggle: (resultId: string) => void;
  onRecordToggle: (resultId: string) => void;
  onSelect: (result: HomeSearchResult) => void;
  recordedResultIds: string[];
  results: HomeSearchResult[];
  selectedResultId: string | null;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">{title}</h3>
        <span className="text-[11px] font-medium text-[var(--tb-color-text-faint)]">
          {results.length}개
        </span>
      </div>
      <div className="grid gap-3">
        {results.map((result) => {
          const TypeIcon = getResultTypeIcon(result.type);
          const isSelected = selectedResultId === result.id;
          const resultTypeLabel = getResultTypeLabel(result.type);
          const showsQuickActions =
            result.type === 'restaurant' || result.type === 'menu';
          const isRecorded = recordedResultIds.includes(result.id);
          const isBookmarked = bookmarkedResultIds.includes(result.id);
          const RecordIcon = isRecorded ? AddCircleFilled : AddCircleRegular;
          const BookmarkIcon = isBookmarked ? BookmarkFilled : BookmarkRegular;

          return (
            <div
              key={result.id}
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
                'tb-section-card overflow-hidden border text-left shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2',
                isSelected
                  ? 'border-[var(--tb-color-text-primary)] shadow-[0_16px_36px_rgba(15,23,42,0.1)]'
                  : 'border-[var(--tb-color-border-default)] hover:-translate-y-[1px] hover:border-[var(--tb-color-border-strong)]',
              )}
            >
              <div className="tb-section-card__body">
                <div className="flex w-full items-center gap-3">
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
                  {showsQuickActions ? (
                    <div className="ml-auto flex shrink-0 items-center gap-0">
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
                            ? 'text-[var(--tb-color-text-primary)]'
                            : 'text-[var(--tb-color-icon-muted)] hover:text-[var(--tb-color-text-primary)]',
                        )}
                        style={{
                          width: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                          height: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                        }}
                      >
                        <RecordIcon fontSize={SEARCH_RESULT_ACTION_ICON_SIZE} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onBookmarkToggle(result.id);
                        }}
                        aria-label="나중에 갈 레스토랑에 추가"
                        title="나중에 갈 레스토랑에 추가"
                        className={cn(
                          'flex items-center justify-center rounded-full transition-colors',
                          isBookmarked
                            ? 'text-[var(--tb-color-text-primary)]'
                            : 'text-[var(--tb-color-icon-muted)] hover:text-[var(--tb-color-text-primary)]',
                        )}
                        style={{
                          width: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                          height: SEARCH_RESULT_ACTION_BUTTON_SIZE,
                        }}
                      >
                        <BookmarkIcon fontSize={SEARCH_RESULT_ACTION_ICON_SIZE} />
                      </button>
                    </div>
                  ) : (
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <TypeIcon
                        size={APP_LUCIDE_ICON_SIZE_S}
                        className={cn(
                          isSelected
                            ? 'text-[var(--tb-color-text-primary)]'
                            : 'text-[var(--tb-color-icon-muted)]',
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-[12px] font-semibold text-[var(--tb-color-text-primary)]">
                        {resultTypeLabel}
                      </span>
                      <ChevronRightRegular
                        fontSize={CARD_TRAILING_ICON_SIZE}
                        className="text-[var(--tb-color-icon-muted)]"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function HomeUnifiedSearch({
  catalog,
  reservations,
}: HomeUnifiedSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<HomeSearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [recordedResultIds, setRecordedResultIds] = useState<string[]>([]);
  const [bookmarkedResultIds, setBookmarkedResultIds] = useState<string[]>([]);

  const restaurantResults = buildRestaurantResults(catalog, reservations);
  const chefResults = buildChefResults(catalog, reservations);
  const menuResults = buildMenuResults(catalog, reservations);
  const suggestions = buildSuggestedQueries(restaurantResults, chefResults, menuResults);
  const filteredRestaurants = query.trim() ? filterResults(restaurantResults, query) : [];
  const filteredChefs = query.trim() ? filterResults(chefResults, query) : [];
  const filteredMenus = query.trim() ? filterResults(menuResults, query) : [];
  const searchGroups: SearchGroups = {
    restaurants: filteredRestaurants,
    chefs: filteredChefs,
    menus: filteredMenus,
    totalCount: filteredRestaurants.length + filteredChefs.length + filteredMenus.length,
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

  const handleSuggestionSelect = (value: string) => {
    setQuery(value);
    updateRecentSearches(value);
    setSelectedResult(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleResultSelect = (result: HomeSearchResult) => {
    setSelectedResult(result);
    updateRecentSearches(result.label);
  };

  const toggleRecordedResult = (resultId: string) => {
    setRecordedResultIds((current) =>
      current.includes(resultId)
        ? current.filter((item) => item !== resultId)
        : [...current, resultId],
    );
  };

  const toggleBookmarkedResult = (resultId: string) => {
    setBookmarkedResultIds((current) =>
      current.includes(resultId)
        ? current.filter((item) => item !== resultId)
        : [...current, resultId],
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

  return (
    <>
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

      {isOpen ? (
        <>
          <div className="fixed inset-x-0 top-[56px] bottom-0 z-[55] bg-[var(--tb-color-bg-page)]/92 backdrop-blur-[14px] animate-fadeIn" />
          <div className="fixed inset-x-0 top-[56px] bottom-0 z-[56] flex justify-center">
            <div className="flex h-full w-full max-w-[1440px] flex-col">
              <div className="border-b border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)]/95 px-5 pb-4 pt-3 backdrop-blur-sm">
                <form className="flex items-center gap-3" onSubmit={handleSubmit}>
                  <div
                    className={cn(
                      SEARCH_BAR_FIELD_CLASS_NAME,
                      'hover:bg-[var(--tb-color-surface-muted)]',
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
                      className="h-full min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-[#303946] outline-none placeholder:text-[#5D6672]"
                    />
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

              <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8 pt-4">
                <div className="mx-auto flex w-full max-w-[680px] flex-col gap-5">
                  {selectedResult ? <SearchFocusCard result={selectedResult} /> : null}

                  {!query.trim() ? (
                    <>
                      {recentSearches.length > 0 ? (
                        <section className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                              최근 검색
                            </h3>
                            <button
                              type="button"
                              onClick={() => setRecentSearches([])}
                              className="text-[11px] font-medium text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-body)]"
                            >
                              모두 지우기
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
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

                      <section className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Sparkles
                            size={APP_LUCIDE_ICON_SIZE_S}
                            className="text-[var(--tb-color-icon-primary)]"
                          />
                          <h3 className="text-[13px] font-semibold text-[var(--tb-color-text-primary)]">
                            추천 탐색
                          </h3>
                        </div>
                        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                          레스토랑을 먼저, 셰프와 메뉴를 함께 비교할 수 있도록 정리했어요.
                        </p>
                        <div className="flex flex-wrap gap-2">
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
                          bookmarkedResultIds={bookmarkedResultIds}
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
                          bookmarkedResultIds={bookmarkedResultIds}
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
                          bookmarkedResultIds={bookmarkedResultIds}
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
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-[var(--tb-color-border-default)] bg-white/75 px-2 py-6">
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
      ) : null}
    </>
  );
}
