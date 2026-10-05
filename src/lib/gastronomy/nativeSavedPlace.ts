import type { RestaurantContentCatalog } from "../tasteBuddySupabase";
import type { ReservationRecord } from "../../constants/reservationCatalog";
import type { NativeBookmark } from "./nativeProfile";

export interface SavedPlace {
  restaurantID: string;
  name: string;
  chefName: string;
  source: "catalog" | "reservation" | "kakao";
  place?: {
    placeId: string;
    address: string | null;
    phone: string | null;
    category: string | null;
    placeUrl: string;
  };
}
export type SavedPlaceResolution =
  | { status: "resolved"; place: SavedPlace }
  | { status: "missing" | "ambiguous" };
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[()'".,/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const text = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
const optionalText = (v: unknown) => (typeof v === "string" ? v : null);

// Only source identifiers are compared. A bookmark's display name is never a lookup key.
// Name-derived legacy IDs are admitted only if they resolve to one current source identity.
export function resolveNativeSavedPlace(
  bookmark: Pick<NativeBookmark, "restaurantID">,
  catalog: RestaurantContentCatalog,
  reservations: ReservationRecord[],
  cachedPlaces: unknown,
): SavedPlaceResolution {
  const id = bookmark.restaurantID;
  if (!text(id)) return { status: "missing" };
  const matches = new Map<string, SavedPlace>();
  const add = (identity: string, place: SavedPlace) => {
    const previous = matches.get(identity);
    // Different names/addresses for the same cached provider ID need a fresh lookup, not an arbitrary winner.
    if (previous && JSON.stringify(previous) !== JSON.stringify(place))
      matches.set(`${identity}:conflict:${matches.size}`, place);
    else matches.set(identity, place);
  };
  const grouped = new Map<
    string,
    { name: string; chefName: string; aliases: Set<string> }
  >();
  for (const item of [...catalog.chefs, ...catalog.dishes]) {
    if (!text(item.restaurantSlug) || !text(item.restaurant)) continue;
    const key = `catalog:${item.restaurantSlug}`;
    const chefName = "chef" in item ? item.chef : item.name;
    const aliases = [
      item.restaurantSlug,
      `restaurant-${normalize(item.restaurant)}`,
      `chef-${normalize(`${item.restaurant}-${chefName}`)}`,
    ];
    if ("title" in item) aliases.push(`menu-${item.id}`);
    const existing = grouped.get(key);
    if (
      existing &&
      (existing.name !== item.restaurant || existing.chefName !== chefName)
    ) {
      // Multiple chefs can serve one restaurant; retain separate candidates so an ambiguous bookmark is not rebound.
      grouped.set(`${key}:${item.id}`, {
        name: item.restaurant,
        chefName,
        aliases: new Set(aliases),
      });
    } else
      grouped.set(key, {
        name: item.restaurant,
        chefName,
        aliases: new Set([...(existing?.aliases ?? []), ...aliases]),
      });
  }
  for (const [key, item] of grouped)
    if (item.aliases.has(id))
      add(key, {
        restaurantID: id,
        name: item.name,
        chefName: item.chefName,
        source: "catalog",
      });
  for (const r of reservations) {
    if (
      [
        `restaurant-reservation-${r.id}`,
        `chef-reservation-${r.id}`,
        `menu-reservation-${r.id}`,
      ].includes(id)
    )
      add(`reservation:${r.id}`, {
        restaurantID: id,
        name: r.restaurant,
        chefName: r.chef,
        source: "reservation",
      });
  }
  if (
    cachedPlaces &&
    typeof cachedPlaces === "object" &&
    !Array.isArray(cachedPlaces)
  ) {
    for (const rows of Object.values(cachedPlaces)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (
          !row ||
          row.source !== "kakao" ||
          !text(row.restaurant) ||
          !row.place ||
          !text(row.place.placeId) ||
          !/^\d+$/.test(row.place.placeId)
        )
          continue;
        const placeID = row.place.placeId;
        if (id !== placeID && id !== `kakao-restaurant-${placeID}`) continue;
        add(`kakao:${placeID}`, {
          restaurantID: id,
          name: row.restaurant,
          chefName: "",
          source: "kakao",
          place: {
            placeId: placeID,
            address: optionalText(row.place.address),
            phone: optionalText(row.place.phone),
            category: optionalText(row.place.category),
            placeUrl: `https://place.map.kakao.com/${placeID}`,
          },
        });
      }
    }
  }
  return matches.size === 1
    ? { status: "resolved", place: [...matches.values()][0] }
    : { status: matches.size ? "ambiguous" : "missing" };
}
export function readSavedPlaceCache(): unknown {
  try {
    return JSON.parse(
      localStorage.getItem("tastebuddy-home-kakao-search-cache-v1") ?? "null",
    );
  } catch {
    return null;
  }
}
