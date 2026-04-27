import { useEffect, useMemo, useState } from 'react';
import { Bookmark, CheckCircle, CirclePlus } from 'lucide-react';

import BottomSheetShell, { BottomSheetCloseButton } from '../system/BottomSheetShell';
import Chip from '../system/Chip';
import PrimaryButton from '../system/PrimaryButton';
import SelectionCard from '../system/SelectionCard';
import SectionTitle from '../system/SectionTitle';
import { Input } from '../ui/input';
import { ICON_TOKENS } from '../../constants/designTokens';
import type { RestaurantDetailViewModel } from '../../pages/RestaurantDetailPage';

interface BookmarkList {
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

interface RestaurantBookmarkSheetProps {
  onSaved?: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  restaurant: RestaurantDetailViewModel;
}

type BookmarkSheetMode = 'select' | 'create' | 'done';

const LIST_STORAGE_KEY = 'tastebuddy-restaurant-bookmark-lists-v1';
const BOOKMARK_STORAGE_KEY = 'tastebuddy-restaurant-bookmarks-v1';
export const RESTAURANT_BOOKMARKS_CHANGED_EVENT = 'tastebuddy-restaurant-bookmarks-changed';

const LIST_SUGGESTIONS = [
  {
    id: 'want-to-visit',
    name: '가보고 싶은 다이닝',
    description: '다음 레스토랑 탐색 때 다시 비교할 후보',
  },
  {
    id: 'anniversary',
    name: '기념일 후보',
    description: '차분하게 오래 기억될 식사를 고를 때',
  },
  {
    id: 'quiet-room',
    name: '조용한 공간',
    description: '대화와 서비스 흐름을 함께 보고 싶은 곳',
  },
  {
    id: 'chef-interest',
    name: '셰프 관심 리스트',
    description: '셰프의 코스와 감각 흐름을 이어서 보고 싶은 곳',
  },
  {
    id: 'compare-later',
    name: '나중에 비교할 곳',
    description: '메뉴와 내 미각 기준을 더 살펴본 뒤 고를 곳',
  },
] satisfies BookmarkList[];

function loadBookmarkLists() {
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

function createListId(name: string) {
  return `list-${name.trim().replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
}

function saveRestaurantBookmark(restaurant: RestaurantDetailViewModel, listId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const currentBookmarks = loadRestaurantBookmarks();
  const restaurantKey = getRestaurantBookmarkKey(restaurant.name);
  const nextRecord: RestaurantBookmarkRecord = {
    chefName: restaurant.chef.name,
    listId,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
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

export default function RestaurantBookmarkSheet({
  onSaved,
  onOpenChange,
  open,
  restaurant,
}: RestaurantBookmarkSheetProps) {
  const [lists, setLists] = useState<BookmarkList[]>(loadBookmarkLists);
  const [mode, setMode] = useState<BookmarkSheetMode>('select');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [customListName, setCustomListName] = useState('');
  const [savedList, setSavedList] = useState<BookmarkList | null>(null);
  const hasLists = lists.length > 0;
  const isCreating = mode === 'create' || !hasLists;
  const selectedSuggestion = LIST_SUGGESTIONS.find(
    (suggestion) => suggestion.name === customListName,
  );
  const canSave = isCreating ? customListName.trim().length > 0 : selectedListId !== null;
  const activeList = useMemo(
    () => lists.find((list) => list.id === selectedListId) ?? null,
    [lists, selectedListId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextLists = loadBookmarkLists();
    setLists(nextLists);
    setMode(nextLists.length > 0 ? 'select' : 'create');
    setSelectedListId(nextLists[0]?.id ?? null);
    setCustomListName('');
    setSavedList(null);
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify(lists));
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
      setSavedList(nextList);
      setSelectedListId(nextList.id);
      setMode('done');
      return;
    }

    if (!activeList) {
      return;
    }

    saveRestaurantBookmark(restaurant, activeList.id);
    onSaved?.();
    setSavedList(activeList);
    setMode('done');
  };

  const footer = mode === 'done' ? (
    <PrimaryButton onClick={() => onOpenChange(false)}>완료</PrimaryButton>
  ) : (
    <PrimaryButton disabled={!canSave} onClick={handleSave}>
      {isCreating ? '리스트 만들고 저장' : '저장하기'}
    </PrimaryButton>
  );

  return (
    <BottomSheetShell
      open={open}
      onOpenChange={onOpenChange}
      headerEnd={<BottomSheetCloseButton />}
      contentClassName="h-auto max-h-[88vh]"
      bodyClassName="overflow-y-auto no-scrollbar px-5 pb-2"
      footer={footer}
    >
      {mode === 'done' && savedList ? (
        <div className="flex flex-col items-center gap-5 pt-4 text-center">
          <div className="flex size-[48px] items-center justify-center rounded-full bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-primary)]">
            <CheckCircle size={ICON_TOKENS.size.xl} strokeWidth={1.8} />
          </div>
          <div className="flex flex-col gap-2">
            <SectionTitle as="h2" size="lg">
              북마크에 저장했어요
            </SectionTitle>
            <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-muted)]">
              다음에 레스토랑을 비교할 때 이 리스트 기준으로 다시 보여드릴게요.
            </p>
          </div>

          <div className="w-full rounded-[20px] bg-[var(--tb-color-surface-muted)] px-4 py-4 text-left">
            <p className="text-[12px] font-semibold text-[var(--tb-color-text-hint)]">
              저장된 레스토랑
            </p>
            <p className="mt-2 text-[16px] font-bold text-[var(--tb-color-text-primary)]">
              {restaurant.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip size="sm" tone="neutral" variant="soft">
                {savedList.name}
              </Chip>
              <Chip size="sm" tone="neutral" variant="soft">
                {restaurant.chef.name} 셰프
              </Chip>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 pt-1">
          <div className="flex items-start gap-3">
            <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-secondary)]">
              <Bookmark size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <SectionTitle as="h2" size="lg">
                {isCreating ? '어떤 리스트로 저장할까요?' : '저장할 리스트를 선택하세요'}
              </SectionTitle>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
                {isCreating
                  ? '리스트 이름을 정해두면 나중에 내 미각 기준으로 레스토랑을 다시 고르기 쉬워요.'
                  : '이미 만들어둔 리스트에 저장하거나 새로운 리스트를 만들 수 있어요.'}
              </p>
            </div>
          </div>

          {!isCreating ? (
            <div className="flex flex-col gap-3">
              {lists.map((list) => (
                <SelectionCard
                  key={list.id}
                  title={list.name}
                  description={list.description}
                  selected={selectedListId === list.id}
                  onClick={() => setSelectedListId(list.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setCustomListName('');
                }}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-base)] px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
              >
                <CirclePlus size={ICON_TOKENS.size.md} strokeWidth={1.8} />
                새로운 리스트 만들기
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
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
      )}
    </BottomSheetShell>
  );
}
