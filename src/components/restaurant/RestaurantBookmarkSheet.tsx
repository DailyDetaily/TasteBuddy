import { useEffect, useRef, useState } from 'react';
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
  CircleCheck,
  CirclePlus,
  Plus,
  X,
} from 'lucide-react';

import ActionOverlayCard from '../system/ActionOverlayCard';
import BottomSheetShell from '../system/BottomSheetShell';
import Chip from '../system/Chip';
import ImageBox from '../system/ImageBox';
import ToastSurface from '../system/ToastSurface';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { ICON_TOKENS, TASTE_TOKENS } from '../../constants/designTokens';
import type { RestaurantDetailViewModel } from '../../pages/RestaurantDetailPage';

export interface BookmarkList {
  coverIconId?: ListCoverIconId;
  coverTasteId?: ListCoverTasteId;
  id: string;
  isPrivate?: boolean;
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

const LIST_COVER_ICONS = [
  { id: 'beef', icon: Beef },
  { id: 'cake-slice', icon: CakeSlice },
  { id: 'coffee', icon: Coffee },
  { id: 'cooking-pot', icon: CookingPot },
  { id: 'croissant', icon: Croissant },
  { id: 'cup-soda', icon: CupSoda },
  { id: 'dessert', icon: Dessert },
  { id: 'egg-fried', icon: EggFried },
  { id: 'fish', icon: Fish },
  { id: 'salad', icon: Salad },
  { id: 'sandwich', icon: Sandwich },
  { id: 'soup', icon: Soup },
  { id: 'utensils', icon: Utensils },
  { id: 'wine', icon: Wine },
] as const satisfies Array<{ id: string; icon: LucideIcon }>;

const LIST_COVER_TASTE_IDS = [
  'sweet',
  'sour',
  'bitter',
  'salty',
  'umami',
  'fat',
] as const;

type ListCoverIconId = (typeof LIST_COVER_ICONS)[number]['id'];
type ListCoverTasteId = (typeof LIST_COVER_TASTE_IDS)[number];

function isListCoverIconId(value: unknown): value is ListCoverIconId {
  return LIST_COVER_ICONS.some((item) => item.id === value);
}

function isListCoverTasteId(value: unknown): value is ListCoverTasteId {
  return LIST_COVER_TASTE_IDS.some((tasteId) => tasteId === value);
}

function getStableHash(value: string) {
  return Array.from(value).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
}

function getStableListIcon(listId: string) {
  const hash = getStableHash(listId);

  return LIST_COVER_ICONS[hash % LIST_COVER_ICONS.length]?.icon ?? Utensils;
}

function getStableListTastePalette(listId: string) {
  const hash = getStableHash(listId);
  const tasteId =
    LIST_COVER_TASTE_IDS[hash % LIST_COVER_TASTE_IDS.length] ?? 'sweet';

  return TASTE_TOKENS[tasteId].palette;
}

export function ListThumbnail({
  className = 'size-[52px]',
  IconOverride,
  iconSize = ICON_TOKENS.size.lg,
  list,
}: {
  className?: string;
  IconOverride?: LucideIcon;
  iconSize?: number;
  list: BookmarkList;
}) {
  const ListThumbnailIcon = getStableListIcon(list.id);
  const listThumbnailPalette = getStableListTastePalette(list.id);
  const selectedIcon = LIST_COVER_ICONS.find((item) => item.id === list.coverIconId)?.icon;
  const selectedPalette = list.coverTasteId
    ? TASTE_TOKENS[list.coverTasteId].palette
    : null;
  const ThumbnailIcon = IconOverride ?? selectedIcon ?? ListThumbnailIcon;
  const thumbnailPalette = selectedPalette ?? listThumbnailPalette;

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[12px] ${className}`}
      style={{
        backgroundColor: thumbnailPalette.tintSurface,
        color: thumbnailPalette.main,
      }}
    >
      <ThumbnailIcon size={iconSize} strokeWidth={1.8} />
    </span>
  );
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

    return parsedValue
      .filter((item): item is BookmarkList =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.description === 'string',
      )
      .map((item) => ({
        ...item,
        coverIconId: isListCoverIconId(item.coverIconId) ? item.coverIconId : undefined,
        coverTasteId: isListCoverTasteId(item.coverTasteId) ? item.coverTasteId : undefined,
        isPrivate: item.isPrivate === true,
      }));
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

export function getPublicBookmarkLists(lists: BookmarkList[] = loadBookmarkLists()) {
  return lists.filter((list) => !list.isPrivate);
}

export function getBookmarkListVisibilityLabel(list: Pick<BookmarkList, 'isPrivate'>) {
  return list.isPrivate ? '비밀 리스트' : '공개 리스트';
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
  const [pendingSavedListId, setPendingSavedListId] = useState<string | null>(null);
  const [toastList, setToastList] = useState<BookmarkList | null>(null);
  const [newListCoverSeed, setNewListCoverSeed] = useState(0);
  const [selectedCoverIconId, setSelectedCoverIconId] =
    useState<ListCoverIconId>('utensils');
  const [selectedCoverTasteId, setSelectedCoverTasteId] =
    useState<ListCoverTasteId>('sweet');
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);
  const [isSecretList, setIsSecretList] = useState(false);
  const closeDelayTimeoutRef = useRef<number | null>(null);
  const hasLists = lists.length > 0;
  const isCreating = mode === 'create' || !hasLists;
  const selectedSuggestion = LIST_SUGGESTIONS.find(
    (suggestion) => suggestion.name === customListName,
  );
  const bookmarkedList = lists.find((list) => list.id === bookmarkedListId) ?? null;
  const currentSavedVisibilityLabel = bookmarkedList
    ? getBookmarkListVisibilityLabel(bookmarkedList)
    : '공개 리스트';
  const canSave = isCreating ? customListName.trim().length > 0 : true;
  const restaurantImageSrc = restaurant.heroImageUrl ?? restaurant.chef.avatarUrl ?? null;
  const newListCoverPreview: BookmarkList = {
    coverIconId: selectedCoverIconId,
    coverTasteId: selectedCoverTasteId,
    id: `new-list-cover-${newListCoverSeed}`,
    isPrivate: isSecretList,
    name: customListName || '새 리스트',
    description: '새 테이스트 리스트 커버',
  };
  const selectedCoverPalette = TASTE_TOKENS[selectedCoverTasteId].palette;

  useEffect(() => {
    if (closeDelayTimeoutRef.current !== null) {
      window.clearTimeout(closeDelayTimeoutRef.current);
      closeDelayTimeoutRef.current = null;
    }

    return () => {
      if (closeDelayTimeoutRef.current !== null) {
        window.clearTimeout(closeDelayTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!toastList) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastList(null);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastList]);

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
    setPendingSavedListId(null);
    setNewListCoverSeed(Date.now());
    setSelectedCoverIconId('utensils');
    setSelectedCoverTasteId('sweet');
    setIsCoverEditorOpen(false);
    setIsSecretList(false);
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
        coverIconId: selectedCoverIconId,
        coverTasteId: selectedCoverTasteId,
        id: selectedSuggestion?.id
          ? `${selectedSuggestion.id}-${Date.now()}`
          : createListId(name),
        isPrivate: isSecretList,
        name,
        description: selectedSuggestion?.description ?? '내 기준으로 다시 살펴볼 레스토랑 리스트',
      };

      setLists((current) => [nextList, ...current]);
      saveRestaurantBookmark(restaurant, nextList.id);
      onSaved?.();
      setBookmarkedListId(nextList.id);
      setToastList(nextList);
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
    if (pendingSavedListId || bookmarkedListId === list.id) {
      return;
    }

    setPendingSavedListId(list.id);
    saveRestaurantBookmark(restaurant, list.id);
    onSaved?.();
    setBookmarkedListId(list.id);

    closeDelayTimeoutRef.current = window.setTimeout(() => {
      setToastList(list);
      setPendingSavedListId(null);
      onOpenChange(false);
      closeDelayTimeoutRef.current = null;
    }, 220);
  };

  const handleRemoveFromList = (list: BookmarkList) => {
    if (pendingSavedListId || bookmarkedListId !== list.id) {
      return;
    }

    saveRestaurantBookmark(restaurant, DEFAULT_BOOKMARK_LIST_ID);
    setBookmarkedListId(DEFAULT_BOOKMARK_LIST_ID);
    setPendingSavedListId(null);
  };

  const handleCancelCreate = () => {
    setCustomListName('');
    setIsCoverEditorOpen(false);
    setIsSecretList(false);

    if (hasLists) {
      setMode('select');
      return;
    }

    onOpenChange(false);
  };

  const handleToggleSuggestion = (name: string) => {
    setCustomListName((currentName) => (currentName === name ? '' : name));
  };

  const listSuggestionChips = (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
        추천 리스트
      </span>
      <div className="-mx-5 overflow-x-auto px-5 no-scrollbar">
        <div className="flex w-max gap-2">
          {LIST_SUGGESTIONS.map((suggestion) => {
            const isSelectedSuggestion = customListName === suggestion.name;

            return (
              <Chip
                key={suggestion.id}
                role="button"
                aria-pressed={isSelectedSuggestion}
                tabIndex={0}
                size="md"
                tone="neutral"
                variant="soft"
                onClick={() => handleToggleSuggestion(suggestion.name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleToggleSuggestion(suggestion.name);
                  }
                }}
                className="cursor-pointer"
	                style={
	                  isSelectedSuggestion
	                    ? {
	                        backgroundColor: selectedCoverPalette.tintSurface,
	                        borderColor: selectedCoverPalette.main,
	                        color: selectedCoverPalette.main,
	                      }
	                    : undefined
	                }
              >
                {suggestion.name}
              </Chip>
            );
          })}
        </div>
      </div>
    </div>
  );

  const coverEditorLayer = isCreating && isCoverEditorOpen ? (
    <ActionOverlayCard
      title="커버 편집"
      onBackdropClick={() => setIsCoverEditorOpen(false)}
      headerStart={(
          <button
            type="button"
            aria-label="커버 편집 닫기"
            onClick={() => setIsCoverEditorOpen(false)}
            className="flex size-10 items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors active:opacity-70"
          >
            <X size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
          </button>
      )}
      headerEnd={(
          <button
            type="button"
            onClick={() => setIsCoverEditorOpen(false)}
            className="flex h-10 items-center justify-end text-[13px] font-bold text-[var(--tb-color-text-primary)] transition-colors active:opacity-70"
          >
            완료
          </button>
      )}
    >

        <ListThumbnail
          list={newListCoverPreview}
          className="size-[104px]"
          iconSize={ICON_TOKENS.size.xl}
        />

        <div className="flex items-center justify-center gap-2">
          {LIST_COVER_TASTE_IDS.map((tasteId) => {
            const palette = TASTE_TOKENS[tasteId].palette;
            const isSelected = selectedCoverTasteId === tasteId;

            return (
              <button
                key={tasteId}
                type="button"
                aria-label={`${tasteId} 배경 선택`}
                aria-pressed={isSelected}
                onClick={() => setSelectedCoverTasteId(tasteId)}
                className={`size-8 rounded-[10px] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2 active:scale-[0.96] ${
                  isSelected
                    ? 'ring-2 ring-offset-2'
                    : ''
                }`}
                style={{
                  backgroundColor: palette.tintSurface,
                  color: palette.main,
                  '--tw-ring-color': palette.main,
                }}
              />
            );
          })}
        </div>

        <div className="grid w-full grid-cols-5 gap-2">
          {LIST_COVER_ICONS.map(({ icon: Icon, id }) => {
            const isSelected = selectedCoverIconId === id;

            return (
              <button
                key={id}
                type="button"
                aria-label={`${id} 아이콘 선택`}
                aria-pressed={isSelected}
                onClick={() => setSelectedCoverIconId(id)}
                className={`flex aspect-square items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-icon-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2 active:scale-[0.96] ${
                  isSelected
                    ? 'ring-0'
                    : ''
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: selectedCoverPalette.tintSurface,
                        color: selectedCoverPalette.main,
                        '--tw-ring-color': selectedCoverPalette.main,
                      }
                    : undefined
                }
              >
                <Icon size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
              </button>
            );
          })}
        </div>
    </ActionOverlayCard>
  ) : null;

  const footer = isCreating ? (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={handleCancelCreate}
        className="flex h-12 items-center justify-center rounded-[12px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] text-[14px] font-bold text-[var(--tb-color-text-secondary)] transition-colors active:opacity-70"
      >
        취소
      </button>
      <button
        type="button"
        disabled={!canSave}
        onClick={handleSave}
        className="flex h-12 items-center justify-center rounded-[12px] bg-[var(--tb-color-text-primary)] text-[14px] font-bold text-[var(--tb-color-text-inverse)] transition-colors active:opacity-70 disabled:bg-[var(--tb-color-surface-disabled)] disabled:text-[var(--tb-color-text-disabled)]"
      >
        저장
      </button>
    </div>
  ) : null;

  return (
    <>
      <BottomSheetShell
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={
          isCreating
            ? 'h-[calc(var(--tb-viewport-height,100dvh)*0.95_-_var(--tb-safe-area-top)_-_12px)] max-h-[calc(var(--tb-viewport-height,100dvh)*0.95_-_var(--tb-safe-area-top)_-_12px)] bg-[var(--tb-color-surface-base)]'
            : 'h-auto max-h-[88vh] bg-[var(--tb-color-surface-base)]'
        }
        bodyClassName="overflow-y-auto no-scrollbar px-0 pb-0"
        footer={footer}
        floatingLayer={coverEditorLayer}
      >
        <div className="flex flex-col">
        {isCreating ? (
          <>
            <section
              aria-label="새 리스트 미리보기"
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ListThumbnail
                  list={newListCoverPreview}
                  className="size-[52px]"
                  iconSize={ICON_TOKENS.size.lg}
                />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                    {customListName || '새 리스트'}
                  </p>
                  <p className="mt-1 truncate text-[13px] font-medium leading-snug text-[var(--tb-color-text-muted)]">
                    {isSecretList ? '비밀 리스트' : '공개 리스트'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCoverEditorOpen(true)}
                className="shrink-0 text-[12px] font-bold transition-colors active:opacity-70"
                style={{
                  color: selectedCoverPalette.main,
                }}
              >
                변경
              </button>
            </section>
            <div
              aria-hidden="true"
              className="mx-5 h-px bg-[var(--tb-color-border-default)]"
            />
          </>
        ) : null}

        {bookmarkedListId && !isCreating ? (
          <section
            aria-label="현재 저장 상태"
            className="flex flex-col gap-2 bg-[var(--tb-color-surface-base)] px-5 py-3"
          >
            <button
              type="button"
              onClick={handleRemoveBookmark}
              className="flex w-full items-center gap-3 rounded-[12px] bg-transparent text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2 active:scale-[0.99]"
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
                  {currentSavedVisibilityLabel}
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
            aria-label="테이스트 리스트"
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
            <div className="flex flex-col gap-5">
              {lists.map((list) => {
                const isSavedToList = bookmarkedListId === list.id;
                const isShowingSavedState = pendingSavedListId === list.id || isSavedToList;

                return (
                  <div
                    key={list.id}
                    className="flex w-full items-center gap-3 rounded-[12px] bg-transparent text-left transition-colors"
                  >
                    <button
                      type="button"
                      disabled={Boolean(pendingSavedListId) || isSavedToList}
                      onClick={() => handleMoveToList(list)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-80"
                    >
                      <ListThumbnail list={list} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                          {list.name}
                        </span>
                        <span className="mt-1 block truncate text-[13px] font-medium leading-snug text-[var(--tb-color-text-muted)]">
                          {getBookmarkListVisibilityLabel(list)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={
                        isShowingSavedState
                          ? `${list.name}에서 제거`
                          : `${list.name}에 추가`
                      }
                      disabled={Boolean(pendingSavedListId) && !isShowingSavedState}
                      onClick={() => {
                        if (isShowingSavedState) {
                          handleRemoveFromList(list);
                          return;
                        }

                        handleMoveToList(list);
                      }}
                      className={`flex size-10 shrink-0 items-center justify-center ${
                        isShowingSavedState
                          ? 'text-[var(--tb-color-text-secondary)] [&>svg>circle]:fill-current [&>svg>path]:stroke-white'
                          : 'text-[var(--tb-color-icon-muted)]'
                      } transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-text-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-80`}
                    >
                      {isShowingSavedState ? (
                        <CircleCheck size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
                      ) : (
                        <CirclePlus size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="flex min-h-[192px] flex-col gap-5 bg-[var(--tb-color-surface-base)] p-5">
            <section aria-label="리스트 이름" className="flex flex-col gap-2">
              <h3 className="text-[16px] font-semibold text-[var(--tb-color-text-primary)]">
                리스트 이름
              </h3>
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[var(--tb-color-text-subtle)]">
                  직접 입력
                </span>
                <Input
                  value={customListName}
                  onChange={(event) => setCustomListName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSave();
                    }
                  }}
                  placeholder="예: 부모님과 가볼 곳"
                  className="h-[48px] rounded-[12px] border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-4 text-[14px] text-[var(--tb-color-text-primary)] placeholder:text-[var(--tb-color-text-hint)] focus-visible:ring-[var(--tb-color-border-default)]"
                />
              </label>
            </section>

            {listSuggestionChips}

            <section aria-label="리스트 커버" className="flex flex-col gap-2">
              <h3 className="text-[16px] font-semibold text-[var(--tb-color-text-primary)]">
                리스트 커버
              </h3>
              <button
                type="button"
                aria-label="리스트 커버 변경"
                onClick={() => setIsCoverEditorOpen(true)}
                className="w-fit rounded-[12px] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-list-cover-main)] focus-visible:ring-offset-2 active:scale-[0.98]"
                style={{
                  '--tb-list-cover-main': selectedCoverPalette.main,
                }}
              >
                <ListThumbnail
                  list={newListCoverPreview}
                  className="size-[104px]"
                  IconOverride={Plus}
                  iconSize={ICON_TOKENS.size.lg}
                />
              </button>
            </section>

            <section aria-label="공개여부" className="flex flex-col gap-2">
              <h3 className="text-[16px] font-semibold text-[var(--tb-color-text-primary)]">
                공개여부
              </h3>
              <label className="flex min-h-12 items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                    비밀 리스트로 설정하기
                  </span>
                  <span className="mt-1 block text-[13px] font-medium leading-snug text-[var(--tb-color-text-muted)]">
                    회원님만 이 리스트를 볼 수 있습니다.
                  </span>
                </span>
                <Switch
                  size="lg"
                  checked={isSecretList}
                  onCheckedChange={setIsSecretList}
                  aria-label="비밀 리스트로 설정하기"
                  className="data-[state=checked]:bg-[var(--tb-list-cover-main)]"
                  style={{
                    '--tb-list-cover-main': selectedCoverPalette.main,
                  }}
                />
              </label>
            </section>

          </div>
        )}
      </div>
      </BottomSheetShell>

      {toastList ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tb-size-bottom-tab-bar-height)+var(--tb-safe-area-bottom)+12px)] z-[80] flex justify-center px-5">
          <ToastSurface
            actionLabel="보기"
            className="pointer-events-auto max-w-[420px]"
            media={(
              <ListThumbnail
                list={toastList}
                className="size-10"
                iconSize={ICON_TOKENS.size.md}
              />
            )}
            message={`${toastList.name}에 저장됨`}
          />
        </div>
      ) : null}
    </>
  );
}
