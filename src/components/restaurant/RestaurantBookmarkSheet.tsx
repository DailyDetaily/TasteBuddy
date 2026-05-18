import { useEffect, useState } from 'react';
import {
  Beef,
  CakeSlice,
  Coffee,
  CookingPot,
  Croissant,
  CupSoda,
  Dessert,
  EggFried,
  Fish,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  Wine,
  type LucideIcon,
  Bookmark,
  CirclePlus,
} from 'lucide-react';

import BottomSheetShell from '../system/BottomSheetShell';
import Chip from '../system/Chip';
import ImageBox from '../system/ImageBox';
import PrimaryButton from '../system/PrimaryButton';
import { Input } from '../ui/input';
import { ICON_TOKENS, TASTE_TOKENS } from '../../constants/designTokens';
import type { RestaurantDetailViewModel } from '../../pages/RestaurantDetailPage';

export interface BookmarkList {
  id: string;
  name: string;
  description: string;
}

export interface RestaurantBookmarkRecord {
  chefName: string;
  listId: string;
  restaurantId: string;
  restaurantName: string;
  savedAt: string;
}

type RestaurantBookmarkRecordInput = Pick<
  RestaurantBookmarkRecord,
  'chefName' | 'restaurantId' | 'restaurantName'
>;

interface RestaurantBookmarkSheetProps {
  newListAccentColor?: string;
  onSaved?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  restaurant: RestaurantDetailViewModel;
}

type BookmarkSheetMode = 'select' | 'create';

const LIST_STORAGE_KEY = 'tastebuddy-restaurant-bookmark-lists-v1';
const BOOKMARK_STORAGE_KEY = 'tastebuddy-restaurant-bookmarks-v1';
export const DEFAULT_BOOKMARK_LIST_ID = 'default-saved';
export const RESTAURANT_BOOKMARKS_CHANGED_EVENT = 'tastebuddy-restaurant-bookmarks-changed';

const LIST_SUGGESTIONS = [
  {
    id: 'want-to-visit',
    name: '가보고 싶은 다이닝',
    description: '예약 전 다시 판단해볼 후보',
  },
  {
    id: 'compare-later',
    name: '나중에 비교할 곳',
    description: '메뉴와 내 미각 기준을 더 살펴본 뒤 고를 곳',
  },
  {
    id: 'reference-point',
    name: '기준점이 될 수 있는 곳',
    description: '내 취향의 기준을 잡을 때 다시 볼 후보',
  },
  {
    id: 'anniversary',
    name: '기념일 후보',
    description: '차분하게 오래 기억될 식사를 고를 때',
  },
  {
    id: 'chef-interest',
    name: '셰프 관심 리스트',
    description: '셰프의 코스와 감각 흐름을 이어서 보고 싶은 곳',
  },
] satisfies BookmarkList[];

const LIST_THUMBNAIL_ICONS = [
  Beef,
  CakeSlice,
  Coffee,
  CookingPot,
  Croissant,
  CupSoda,
  Dessert,
  EggFried,
  Fish,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  Wine,
] satisfies LucideIcon[];

const LIST_THUMBNAIL_TASTE_IDS = [
  'sweet',
  'sour',
  'bitter',
  'salty',
  'umami',
  'fat',
] as const;

function getStableHash(value: string) {
  return Array.from(value).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
}

function getStableListIcon(listId: string) {
  const hash = getStableHash(listId);

  return LIST_THUMBNAIL_ICONS[hash % LIST_THUMBNAIL_ICONS.length] ?? Utensils;
}

function getStableListTastePalette(listId: string) {
  const hash = getStableHash(listId);
  const tasteId =
    LIST_THUMBNAIL_TASTE_IDS[hash % LIST_THUMBNAIL_TASTE_IDS.length] ?? 'sweet';

  return TASTE_TOKENS[tasteId].palette;
}

export function loadBookmarkLists() {
  if (typeof window === 'undefined') {
    return [] as BookmarkList[];
  }

  try {
    const rawValue = window.localStorage.getItem(LIST_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item): item is BookmarkList =>
      Boolean(item) &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.description === 'string',
    );
  } catch {
    return [];
  }
}

export function saveBookmarkLists(lists: BookmarkList[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(lists));
  window.dispatchEvent(new Event(RESTAURANT_BOOKMARKS_CHANGED_EVENT));
}

export function getRestaurantBookmarkKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[()'".,/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function loadRestaurantBookmarks() {
  if (typeof window === 'undefined') {
    return [] as RestaurantBookmarkRecord[];
  }

  try {
    const rawValue = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item): item is RestaurantBookmarkRecord =>
      Boolean(item) &&
      typeof item.chefName === 'string' &&
      typeof item.listId === 'string' &&
      typeof item.restaurantId === 'string' &&
      typeof item.restaurantName === 'string' &&
      typeof item.savedAt === 'string',
    );
  } catch {
    return [];
  }
}

export function isRestaurantBookmarked(restaurantName: string) {
  const targetKey = getRestaurantBookmarkKey(restaurantName);

  return loadRestaurantBookmarks().some(
    (bookmark) => getRestaurantBookmarkKey(bookmark.restaurantName) === targetKey,
  );
}

function getRestaurantBookmarkListId(restaurantName: string) {
  const targetKey = getRestaurantBookmarkKey(restaurantName);

  return loadRestaurantBookmarks().find(
    (bookmark) => getRestaurantBookmarkKey(bookmark.restaurantName) === targetKey,
  )?.listId ?? null;
}

function createListId(name: string) {
  return `list-${name.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
}

export function saveRestaurantBookmarkRecord(
  record: RestaurantBookmarkRecordInput,
  listId = DEFAULT_BOOKMARK_LIST_ID,
) {
  if (typeof window === 'undefined') {
    return;
  }

  const currentBookmarks = loadRestaurantBookmarks();
  const restaurantKey = getRestaurantBookmarkKey(record.restaurantName);
  const nextRecord: RestaurantBookmarkRecord = {
    chefName: record.chefName,
    listId,
    restaurantId: record.restaurantId,
    restaurantName: record.restaurantName,
    savedAt: new Date().toISOString(),
  };
  const nextBookmarks = [
    nextRecord,
    ...currentBookmarks.filter(
      (bookmark) => getRestaurantBookmarkKey(bookmark.restaurantName) !== restaurantKey,
    ),
  ];

  window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(nextBookmarks));
  window.dispatchEvent(new Event(RESTAURANT_BOOKMARKS_CHANGED_EVENT));
}

function saveRestaurantBookmark(
  restaurant: RestaurantDetailViewModel,
  listId = DEFAULT_BOOKMARK_LIST_ID,
) {
  saveRestaurantBookmarkRecord(
    {
      chefName: restaurant.chef.name,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    },
    listId,
  );
}

export function saveRestaurantBookmarkToDefault(restaurant: RestaurantDetailViewModel) {
  saveRestaurantBookmark(restaurant, DEFAULT_BOOKMARK_LIST_ID);
}

export function removeRestaurantBookmark(restaurantName: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const restaurantKey = getRestaurantBookmarkKey(restaurantName);
  const nextBookmarks = loadRestaurantBookmarks().filter(
    (bookmark) => getRestaurantBookmarkKey(bookmark.restaurantName) !== restaurantKey,
  );

  window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(nextBookmarks));
  window.dispatchEvent(new Event(RESTAURANT_BOOKMARKS_CHANGED_EVENT));
}

export default function RestaurantBookmarkSheet({
  newListAccentColor,
  onSaved,
  onOpenChange,
  open,
  restaurant,
}: RestaurantBookmarkSheetProps) {
  const [lists, setLists] = useState<BookmarkList[]>(loadBookmarkLists);
  const [mode, setMode] = useState<BookmarkSheetMode>('select');
  const [customListName, setCustomListName] = useState('');
  const [bookmarkedListId, setBookmarkedListId] = useState<string | null>(null);
  const hasLists = lists.length > 0;
  const isCreating = mode === 'create' || !hasLists;
  const selectedSuggestion = LIST_SUGGESTIONS.find(
    (suggestion) => suggestion.name === customListName,
  );
  const canSave = isCreating ? customListName.trim().length > 0 : true;
  const restaurantImageSrc = restaurant.heroImageUrl ?? restaurant.chef.avatarUrl ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextLists = loadBookmarkLists();
    let nextBookmarkedListId = getRestaurantBookmarkListId(restaurant.name);

    if (!nextBookmarkedListId) {
      saveRestaurantBookmark(restaurant);
      nextBookmarkedListId = DEFAULT_BOOKMARK_LIST_ID;
    }

    setLists(nextLists);
    setMode(nextLists.length > 0 ? 'select' : 'create');
    setCustomListName('');
    setBookmarkedListId(nextBookmarkedListId);
  }, [open, restaurant.chef.name, restaurant.id, restaurant.name]);

  useEffect(() => {
    saveBookmarkLists(lists);
  }, [lists]);

  const handleSave = () => {
    if (isCreating) {
      const name = customListName.trim();
      if (!name) {
        return;
      }

      const nextList: BookmarkList = {
        id: selectedSuggestion?.id
          ? `${selectedSuggestion.id}-${Date.now()}`
          : createListId(name),
        name,
        description: selectedSuggestion?.description ?? '내 기준으로 다시 살펴볼 레스토랑 리스트',
      };

      setLists((current) => [nextList, ...current]);
      saveRestaurantBookmark(restaurant, nextList.id);
      onSaved?.();
      setBookmarkedListId(nextList.id);
      onOpenChange(false);
      return;
    }
  };

  const handleRemoveBookmark = () => {
    removeRestaurantBookmark(restaurant.name);
    setBookmarkedListId(null);
    onOpenChange(false);
  };

  const handleMoveToList = (list: BookmarkList) => {
    saveRestaurantBookmark(restaurant, list.id);
    onSaved?.();
    setBookmarkedListId(list.id);
    onOpenChange(false);
  };

  const footer = isCreating ? (
    <PrimaryButton disabled={!canSave} onClick={handleSave}>
      리스트 만들고 저장
    </PrimaryButton>
  ) : null;

  return (
    <BottomSheetShell
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="h-auto max-h-[88vh] bg-[var(--tb-color-surface-base)]"
      bodyClassName="overflow-y-auto no-scrollbar px-0 pb-0"
      footer={footer}
    >
      <div className="flex flex-col">
        {bookmarkedListId ? (
          <section
            aria-label="현재 저장 상태"
            className="flex flex-col gap-2 bg-[var(--tb-color-surface-base)] px-5 py-3"
          >
            <button
              type="button"
              onClick={handleRemoveBookmark}
              className="flex w-full items-center gap-3 rounded-[12px] bg-transparent text-left transition-colors] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2 active:scale-[0.99]"
            >
              <ImageBox
                alt={restaurant.name}
                fallback="restaurant"
                imageSrc={restaurantImageSrc}
                className="size-[52px] rounded-[12px]"
                imageClassName="object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                  저장됨
                </span>
                <span className="mt-1 block truncate text-[13px] font-medium leading-snug text-[var(--tb-color-text-muted)]">
                  공개 리스트
                </span>
              </span>
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center text-[var(--tb-color-text-primary)]"
              >
                <Bookmark
                  size={ICON_TOKENS.size.xl}
                  strokeWidth={0}
                  fill="currentColor"
                />
              </span>
            </button>
          </section>
        ) : null}

        {bookmarkedListId && !isCreating ? (
          <div
            aria-hidden="true"
            className="mx-5 h-px bg-[var(--tb-color-border-default)]"
          />
        ) : null}

        {!isCreating ? (
          <section
            aria-label="저장 리스트"
            className="bg-[var(--tb-color-bg-focus)] min-h-[252px] px-5 py-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                리스트
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setCustomListName('');
                }}
                className="text-[11px] font-bold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-user-accent-tint-soft-border)]"
                style={{
                  color: newListAccentColor ?? 'var(--tb-user-accent-main, var(--tb-taste-sweet-accent))',
                }}
              >
                새 리스트
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {lists.map((list) => {
                const ListThumbnailIcon = getStableListIcon(list.id);
                const listThumbnailPalette = getStableListTastePalette(list.id);

                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => handleMoveToList(list)}
                    className="flex w-full items-center gap-3 rounded-[12px] bg-transparent text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2 active:scale-[0.99]"
                  >
                    <span
                      className="flex size-[52px] shrink-0 items-center justify-center rounded-[12px]"
                      style={{
                        backgroundColor: listThumbnailPalette.tintSurface,
                        color: listThumbnailPalette.main,
                      }}
                    >
                      <ListThumbnailIcon size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                        {list.name}
                      </span>
                      <span className="mt-1 block truncate text-[13px] font-medium leading-snug text-[var(--tb-color-text-muted)]">
                        공개 리스트
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center text-[var(--tb-color-icon-muted)]"
                    >
                      <CirclePlus size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-4 bg-[var(--tb-color-bg-page)] px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {LIST_SUGGESTIONS.map((suggestion) => (
                <Chip
                  key={suggestion.id}
                  role="button"
                  tabIndex={0}
                  size="md"
                  tone="neutral"
                  variant={customListName === suggestion.name ? 'solid' : 'soft'}
                  onClick={() => setCustomListName(suggestion.name)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setCustomListName(suggestion.name);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {suggestion.name}
                </Chip>
              ))}
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                직접 입력
              </span>
              <Input
                value={customListName}
                onChange={(event) => setCustomListName(event.target.value)}
                placeholder="예: 부모님과 가볼 곳"
                className="h-[48px] rounded-[12px] border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-[14px] text-[var(--tb-color-text-primary)] placeholder:text-[var(--tb-color-text-hint)] focus-visible:ring-[var(--tb-color-border-default)]"
              />
            </label>

            {hasLists ? (
              <button
                type="button"
                onClick={() => {
                  setMode('select');
                  setCustomListName('');
                }}
                className="self-start text-[12px] font-semibold text-[var(--tb-color-text-muted)]"
              >
                기존 리스트로 돌아가기
              </button>
            ) : null}
          </div>
        )}
      </div>
    </BottomSheetShell>
  );
}
