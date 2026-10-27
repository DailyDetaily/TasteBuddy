export interface PlaceIdentity {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
}
export interface PlaceQuery { query?: string; address?: string | null; lat?: number | null; lng?: number | null; phone?: string | null }
export function normalizeCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}
function name(value?: string | null) { return (value ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); }
function phone(value?: string | null) { return (value ?? '').replace(/[^0-9]/g, '').replace(/^82/, '0'); }
export function choosePlace<T extends PlaceIdentity>(places: T[], query: PlaceQuery): T | null {
  const expected = name(query.query), expectedPhone = phone(query.phone);
  const lat = normalizeCoordinate(query.lat), lng = normalizeCoordinate(query.lng);
  const candidates = places.flatMap(place => {
    const actual = name(place.displayName?.text);
    const sameName = !!expected && !!actual && (expected === actual || (expected.length >= 2 && actual.length >= 2 && (actual.includes(expected) || expected.includes(actual))));
    const samePhone = expectedPhone.length >= 8 && [phone(place.nationalPhoneNumber), phone(place.internationalPhoneNumber)].includes(expectedPhone);
    if (!sameName && !samePhone) return [];
    let distance = Number.POSITIVE_INFINITY;
    const pLat = normalizeCoordinate(place.location?.latitude), pLng = normalizeCoordinate(place.location?.longitude);
    if (lat !== null && lng !== null && pLat !== null && pLng !== null) {
      distance = Math.hypot((lat - pLat) * 111320, (lng - pLng) * 111320 * Math.cos(lat * Math.PI / 180));
      if (distance > (sameName ? 500 : 100)) return [];
    } else if (query.address) {
      const street = name(query.address.trim().split(/\s+/).slice(-2).join(''));
      if (!street || !name(place.formattedAddress).includes(street)) return [];
    } else if (!sameName) return [];
    return [{ place, distance, exact: actual === expected, samePhone }];
  }).sort((a, b) => Number(b.samePhone) - Number(a.samePhone) || a.distance - b.distance || Number(b.exact) - Number(a.exact));
  if (candidates.length > 1 && !query.address && lat === null && lng === null && !candidates[0].samePhone) return null;
  return candidates[0]?.place ?? null;
}
