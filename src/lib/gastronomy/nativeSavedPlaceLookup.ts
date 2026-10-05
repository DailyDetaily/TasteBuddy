import { supabase } from "../supabase";
import type { NativeBookmark } from "./nativeProfile";
import type { SavedPlace } from "./nativeSavedPlace";
// The keyword is only a candidate search; the provider ID remains the admission check.
export async function lookupSavedPlace(
  bookmark: NativeBookmark,
): Promise<SavedPlace | null> {
  if (!supabase) throw Error("장소 정보를 확인할 연결이 없어요.");
  const id = bookmark.restaurantID.replace(/^kakao-restaurant-/, "");
  if (!/^\d+$/.test(id))
    throw Error("이 식당은 장소 식별자를 먼저 연결해야 해요.");
  const { data: rows, error: indexError } = await supabase
    .from("restaurant_place_index")
    .select(
      "provider_place_id,raw_name,road_address,formatted_address,phone,category",
    )
    .eq("provider", "kakao")
    .eq("provider_place_id", id)
    .limit(2);
  if (indexError)
    throw Error("장소 정보를 불러오지 못했어요. 다시 시도해 주세요.");
  if (rows && rows.length > 1) throw Error("연결된 장소 정보가 서로 달라요.");
  let place: Record<string, unknown> | null = rows?.[0]
    ? {
        placeId: rows[0].provider_place_id,
        name: rows[0].raw_name,
        address: rows[0].road_address ?? rows[0].formatted_address,
        phone: rows[0].phone,
        category: rows[0].category,
      }
    : null;
  if (!place && bookmark.restaurantName.trim()) {
    const { data, error } = await supabase.functions.invoke(
      "kakao-place-lookup",
      { body: { query: bookmark.restaurantName, expectedPlaceId: id } },
    );
    if (error)
      throw Error("장소 정보를 불러오지 못했어요. 다시 시도해 주세요.");
    place = data?.place ?? null;
  }
  return admitSavedPlace(bookmark.restaurantID, id, place);
}
export function admitSavedPlace(
  bookmarkID: string,
  expected: string,
  value: Record<string, unknown> | null,
): SavedPlace | null {
  if (
    !value ||
    value.placeId !== expected ||
    typeof value.name !== "string" ||
    !value.name.trim()
  )
    return null;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    restaurantID: bookmarkID,
    name: value.name,
    chefName: "",
    source: "kakao",
    place: {
      placeId: expected,
      address: str(value.address),
      phone: str(value.phone),
      category: str(value.category),
      placeUrl: `https://place.map.kakao.com/${expected}`,
    },
  };
}
