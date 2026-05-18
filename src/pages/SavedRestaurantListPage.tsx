import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, CircleCheck, CirclePlus } from 'lucide-react';

import ChefAvatar from '../components/system/ChefAvatar';
import CompactCard from '../components/system/CompactCard';
import PlaceholderInputChip from '../components/system/PlaceholderInputChip';
import {
  loadBookmarkLists,
  loadRestaurantBookmarks,
  RESTAURANT_BOOKMARKS_CHANGED_EVENT,
  getRestaurantBookmarkKey,
  saveBookmarkLists,
  type BookmarkList,
  type RestaurantBookmarkRecord,
} from '../components/restaurant/RestaurantBookmarkSheet';
import { ICON_TOKENS } from '../constants/designTokens';
import type { ReservationRecord } from '../constants/reservationCatalog';
import { resolvePublicMediaPath } from '../lib/mediaAssets';
import {
  hydrateReservationPageData,
  type RestaurantContentCatalog,
} from '../lib/tasteBuddySupabase';
import { createRestaurantDetailFromFavoriteChef } from './RestaurantDetailPage';

interface SavedRestaurantListPageProps {
  catalog: RestaurantContentCatalog;
  fallbackRestaurants?: ReservationRecord[];
  onOpenFallbackRestaurant?: (reservation: ReservationRecord) => void;
  onOpenRestaurant: (bookmark: RestaurantBookmarkRecord) => void;
}

const ALL_TAB_ID = 'all';
const CREATE_LIST_PLACEHOLDER = '새 리스트 만들기';

function createSavedListId(name: string) {
  return `saved-list-${name.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
}

function getRestaurantLocationLabel({
  image,
  matchRate,
  restaurantName,
  chefName,
  taste,
}: {
  chefName: string;
  image: string | null;
  matchRate: number;
  restaurantName: string;
  taste: string;
}) {
  return createRestaurantDetailFromFavoriteChef({
    image,
    matchRate,
    name: chefName,
    restaurant: restaurantName,
    taste,
  }).locationLabel;
}

function findCatalogChef(catalog: RestaurantContentCatalog, bookmark: RestaurantBookmarkRecord) {
  const chefs = catalog?.chefs ?? [];
  const restaurantName = bookmark.restaurantName.trim();
  const chefName = bookmark.chefName.replace(/\s*셰프$/, '').trim();

  return chefs.find((chef) => {
    const sameRestaurant = chef.restaurant.trim() === restaurantName;
    const sameChef = chef.name.replace(/\s*셰프$/, '').trim() === chefName;

    return sameRestaurant || sameChef;
  }) ?? null;
}

function findCatalogDish(catalog: RestaurantContentCatalog, bookmark: RestaurantBookmarkRecord) {
  const dishes = catalog?.dishes ?? [];

  return dishes.find((dish) => dish.restaurant.trim() === bookmark.restaurantName.trim()) ?? null;
}

export default function SavedRestaurantListPage({
  catalog,
  fallbackRestaurants = [],
  onOpenFallbackRestaurant,
  onOpenRestaurant,
}: SavedRestaurantListPageProps) {
  const [lists, setLists] = useState<BookmarkList[]>(() => loadBookmarkLists());
  const [bookmarks, setBookmarks] = useState<RestaurantBookmarkRecord[]>(() =>
    loadRestaurantBookmarks(),
  );
  const [feedbackRestaurantKeys, setFeedbackRestaurantKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeListId, setActiveListId] = useState(ALL_TAB_ID);
  const [newListName, setNewListName] = useState('');
  const newListInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncBookmarks = () => {
      const nextLists = loadBookmarkLists();
      const nextBookmarks = loadRestaurantBookmarks();

      setLists(nextLists);
      setBookmarks(nextBookmarks);
      setActiveListId((currentListId) => {
        if (currentListId === ALL_TAB_ID) {
          return currentListId;
        }

        return nextLists.some((list) => list.id === currentListId) ? currentListId : ALL_TAB_ID;
      });
    };

    window.addEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncBookmarks);
    window.addEventListener('storage', syncBookmarks);

    return () => {
      window.removeEventListener(RESTAURANT_BOOKMARKS_CHANGED_EVENT, syncBookmarks);
      window.removeEventListener('storage', syncBookmarks);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const hydratedData = await hydrateReservationPageData();

      if (isCancelled) {
        return;
      }

      const feedbackReservationIds = new Set(
        Object.keys(hydratedData.feedbackByReservationId).map(Number),
      );
      const nextFeedbackRestaurantKeys = new Set(
        hydratedData.reservations
          .filter((reservation) => feedbackReservationIds.has(reservation.id))
          .map((reservation) => getRestaurantBookmarkKey(reservation.restaurant)),
      );

      setFeedbackRestaurantKeys(nextFeedbackRestaurantKeys);
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const visibleBookmarks = useMemo(
    () =>
      activeListId === ALL_TAB_ID
        ? bookmarks
        : bookmarks.filter((bookmark) => bookmark.listId === activeListId),
    [activeListId, bookmarks],
  );

  const tabs = useMemo(
    () => [
      ...(lists.length > 0
        ? [
            {
              id: ALL_TAB_ID,
              name: '전체',
              count: bookmarks.length,
            },
          ]
        : []),
      ...lists.map((list) => ({
        id: list.id,
        name: list.name,
        count: bookmarks.filter((bookmark) => bookmark.listId === list.id).length,
      })),
    ],
    [bookmarks, lists],
  );

  const handleCreateList = () => {
    const name = newListName.trim();

    if (!name) {
      newListInputRef.current?.focus();
      return;
    }

    const nextList: BookmarkList = {
      id: createSavedListId(name),
      name,
      description: '내 기준으로 다시 살펴볼 레스토랑 리스트',
    };
    const nextLists = [nextList, ...lists];

    setLists(nextLists);
    saveBookmarkLists(nextLists);
    setActiveListId(nextList.id);
    setNewListName('');
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
      <div className="pointer-events-auto w-full max-w-[1440px] shrink-0 border-b border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] px-5 pb-4 pt-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {lists.length === 0 ? (
            <PlaceholderInputChip
              aria-label="새 저장 리스트 만들기"
              inputRef={newListInputRef}
              onChange={setNewListName}
              onSubmit={handleCreateList}
              placeholder={CREATE_LIST_PLACEHOLDER}
              value={newListName}
            />
          ) : null}
          {tabs.map((tab) => {
            const isActive = activeListId === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveListId(tab.id)}
                className={`flex h-8 shrink-0 items-center gap-2 rounded-full border px-[14px] py-0 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'border-transparent'
                    : 'border-transparent bg-transparent text-[var(--tb-color-text-tertiary)]'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--tb-user-accent-tint-surface)',
                        borderColor: 'transparent',
                        color: 'var(--tb-user-accent-main)',
                      }
                    : undefined
                }
                aria-pressed={isActive}
              >
                <span>{tab.name}</span>
                <span
                  style={isActive ? { color: 'var(--tb-user-accent-dark)' } : undefined}
                  className={isActive ? undefined : 'text-[var(--tb-color-text-muted)]'}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-20 pt-4">
        {visibleBookmarks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {visibleBookmarks.map((bookmark) => {
              const chef = findCatalogChef(catalog, bookmark);
              const dish = findCatalogDish(catalog, bookmark);
              const avatarSrc = resolvePublicMediaPath(chef?.avatarPath ?? dish?.chefAvatarPath ?? null);
              const taste = dish?.dominantTaste ?? chef?.taste ?? 'umami';
              const locationLabel = getRestaurantLocationLabel({
                chefName: bookmark.chefName,
                image: avatarSrc,
                matchRate: 70,
                restaurantName: bookmark.restaurantName,
                taste,
              });
              const hasFeedback = feedbackRestaurantKeys.has(
                getRestaurantBookmarkKey(bookmark.restaurantName),
              );
              const FeedbackIcon = hasFeedback ? CircleCheck : CirclePlus;

              return (
                <CompactCard
                  key={`${bookmark.restaurantId}-${bookmark.savedAt}`}
                  onClick={() => onOpenRestaurant(bookmark)}
                  media={
                    <ChefAvatar
                      alt={bookmark.chefName}
                      className="h-[44px] w-[44px] rounded-[10px]"
                      iconSize={ICON_TOKENS.size.lg}
                      imageSrc={avatarSrc}
                      taste={taste}
                      variant="neutral"
                    />
                  }
                  heading={bookmark.restaurantName}
                  metadata={locationLabel}
                  actions={
                    <span
                      aria-hidden="true"
                      className="flex items-center justify-end gap-0"
                    >
                      <span
                        className={`flex items-center justify-center rounded-full ${
                          hasFeedback
                            ? 'text-[var(--tb-color-text-secondary)] [&>svg>circle]:fill-current [&>svg>path]:stroke-white'
                            : 'text-[var(--tb-color-icon-muted)]'
                        }`}
                        style={{
                          width: ICON_TOKENS.container.lg,
                          height: ICON_TOKENS.container.lg,
                        }}
                      >
                        <FeedbackIcon size={24} strokeWidth={1.8} />
                      </span>
                      <span
                        className="flex items-center justify-center rounded-full text-[var(--tb-color-text-secondary)] [&>svg]:fill-current"
                        style={{
                          width: ICON_TOKENS.container.lg,
                          height: ICON_TOKENS.container.lg,
                        }}
                      >
                        <Bookmark size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
                      </span>
                    </span>
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="rounded-[20px] bg-white p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-icon-primary)]">
                <Bookmark size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
              </div>
              <p className="mt-4 text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                아직 저장한 식당이 없어요
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                관심 있는 식당을 저장하면 다음 예약 전에 코스 흐름과 내 프로필 기준을 다시 비교할 수 있어요.
              </p>
            </div>

            {fallbackRestaurants.length > 0 ? (
              <>
                <p className="px-1 pt-1 text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                  먼저 비교해볼 만한 식당
                </p>
                {fallbackRestaurants.slice(0, 4).map((reservation) => (
                  <button
                    key={reservation.id}
                    type="button"
                    onClick={() => onOpenFallbackRestaurant?.(reservation)}
                    className="flex w-full items-center gap-3 rounded-[20px] bg-white p-3 text-left transition-transform active:scale-[0.99]"
                  >
                    <ChefAvatar
                      alt={reservation.chef}
                      className="h-[44px] w-[44px] rounded-[10px]"
                      iconSize={ICON_TOKENS.size.lg}
                      imageSrc={reservation.chefImage}
                      taste={reservation.adjustments[0]?.taste ?? '감칠맛'}
                      variant="neutral"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                        {reservation.restaurant}
                      </p>
                      <p className="mt-[3px] truncate text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
                        {reservation.chef} · {reservation.matchRate}%
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[var(--tb-color-text-subtle)]">
                        저장 전에 내 프로필 기준으로 다시 살펴보기
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="shrink-0 text-[var(--tb-color-icon-muted)]"
                      size={ICON_TOKENS.size.md}
                    />
                  </button>
                ))}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
