import type {
  BookmarkList,
  RestaurantBookmarkRecord,
} from '../components/restaurant/RestaurantBookmarkSheet';
import { supabase } from './supabase';

export interface RestaurantBookmarkState {
  bookmarks: RestaurantBookmarkRecord[];
  lists: BookmarkList[];
}

type BookmarkListRow = {
  cover_icon_id: string | null;
  cover_taste_id: string | null;
  description: string;
  is_private: boolean;
  list_id: string;
  name: string;
};

type RestaurantBookmarkRow = {
  chef_name: string;
  list_id: string;
  restaurant_id: string;
  restaurant_name: string;
  saved_at: string;
};

export function normalizeBookmarkOwnerEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase() ?? '';

  return normalizedEmail || null;
}

function getRestaurantBookmarkKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[()'".,/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createListRow(ownerEmail: string, list: BookmarkList) {
  return {
    owner_email: ownerEmail,
    list_id: list.id,
    name: list.name,
    description: list.description,
    is_private: list.isPrivate === true,
    cover_icon_id: list.coverIconId ?? null,
    cover_taste_id: list.coverTasteId ?? null,
  };
}

function createBookmarkRow(ownerEmail: string, bookmark: RestaurantBookmarkRecord) {
  const savedAtTime = new Date(bookmark.savedAt).getTime();
  const savedAt = Number.isFinite(savedAtTime)
    ? bookmark.savedAt
    : new Date().toISOString();

  return {
    owner_email: ownerEmail,
    restaurant_key: getRestaurantBookmarkKey(bookmark.restaurantName),
    list_id: bookmark.listId,
    restaurant_id: bookmark.restaurantId,
    restaurant_name: bookmark.restaurantName,
    chef_name: bookmark.chefName,
    saved_at: savedAt,
  };
}

function parseListRow(row: BookmarkListRow): BookmarkList | null {
  if (!row.list_id || !row.name || !row.description) {
    return null;
  }

  return {
    id: row.list_id,
    name: row.name,
    description: row.description,
    isPrivate: row.is_private === true,
    coverIconId: row.cover_icon_id ?? undefined,
    coverTasteId: row.cover_taste_id ?? undefined,
  };
}

function parseBookmarkRow(row: RestaurantBookmarkRow): RestaurantBookmarkRecord | null {
  if (
    !row.chef_name ||
    !row.list_id ||
    !row.restaurant_id ||
    !row.restaurant_name ||
    !row.saved_at
  ) {
    return null;
  }

  return {
    chefName: row.chef_name,
    listId: row.list_id,
    restaurantId: row.restaurant_id,
    restaurantName: row.restaurant_name,
    savedAt: row.saved_at,
  };
}

export async function hydrateRestaurantBookmarkStateForEmail(
  email: string | null | undefined,
): Promise<RestaurantBookmarkState | null> {
  const ownerEmail = normalizeBookmarkOwnerEmail(email);

  if (!supabase || !ownerEmail) {
    return null;
  }

  const [listsResult, bookmarksResult] = await Promise.all([
    supabase
      .from('restaurant_bookmark_lists')
      .select('list_id, name, description, is_private, cover_icon_id, cover_taste_id')
      .eq('owner_email', ownerEmail)
      .order('created_at', { ascending: false }),
    supabase
      .from('restaurant_bookmarks')
      .select('list_id, restaurant_id, restaurant_name, chef_name, saved_at')
      .eq('owner_email', ownerEmail)
      .order('saved_at', { ascending: false }),
  ]);

  if (listsResult.error || bookmarksResult.error) {
    console.warn('Failed to hydrate restaurant bookmark state.', {
      bookmarksError: bookmarksResult.error,
      listsError: listsResult.error,
    });
    return null;
  }

  return {
    lists: ((listsResult.data ?? []) as BookmarkListRow[])
      .map(parseListRow)
      .filter((list): list is BookmarkList => Boolean(list)),
    bookmarks: ((bookmarksResult.data ?? []) as RestaurantBookmarkRow[])
      .map(parseBookmarkRow)
      .filter((bookmark): bookmark is RestaurantBookmarkRecord => Boolean(bookmark)),
  };
}

export async function persistRestaurantBookmarkStateForEmail(
  email: string | null | undefined,
  state: RestaurantBookmarkState,
) {
  const ownerEmail = normalizeBookmarkOwnerEmail(email);

  if (!supabase || !ownerEmail) {
    return false;
  }

  const listRows = state.lists.map((list) => createListRow(ownerEmail, list));
  const bookmarkRows = state.bookmarks.map((bookmark) => createBookmarkRow(ownerEmail, bookmark));
  const deleteBookmarksResult = await supabase
    .from('restaurant_bookmarks')
    .delete()
    .eq('owner_email', ownerEmail);

  if (deleteBookmarksResult.error) {
    console.warn('Failed to clear remote restaurant bookmarks.', deleteBookmarksResult.error);
    return false;
  }

  const deleteListsResult = await supabase
    .from('restaurant_bookmark_lists')
    .delete()
    .eq('owner_email', ownerEmail);

  if (deleteListsResult.error) {
    console.warn('Failed to clear remote restaurant bookmark lists.', deleteListsResult.error);
    return false;
  }

  if (listRows.length > 0) {
    const { error } = await supabase
      .from('restaurant_bookmark_lists')
      .insert(listRows);

    if (error) {
      console.warn('Failed to persist restaurant bookmark lists.', error);
      return false;
    }
  }

  if (bookmarkRows.length > 0) {
    const { error } = await supabase
      .from('restaurant_bookmarks')
      .insert(bookmarkRows);

    if (error) {
      console.warn('Failed to persist restaurant bookmarks.', error);
      return false;
    }
  }

  return true;
}
