import { choosePlace, normalizeCoordinate } from './matching.ts';
const GOOGLE_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const GOOGLE_PLACE_PHOTO_MAX_WIDTH = 720;

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

interface GooglePlaceEnrichRequest {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  query?: string;
  placeId?: string;
}

interface GooglePlace {
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  googleMapsUri?: string;
  id?: string;
  internationalPhoneNumber?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  nationalPhoneNumber?: string;
  photos?: Array<{
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
    }>;
    heightPx?: number;
    name?: string;
    widthPx?: number;
  }>;
  priceLevel?: string;
  rating?: number;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  userRatingCount?: number;
  websiteUri?: string;
}

interface GooglePlacePhotoMediaResponse {
  photoUri?: string;
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

function normalizeQuery(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 120) : '';
}

function formatOpeningHours(weekdayDescriptions?: string[]) {
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) {
    return null;
  }

  return weekdayDescriptions
    .map((description) => description.replace(/요일/g, '').replace(/:\s*/, ' '))
    .join(' / ');
}

async function resolvePhotoURL(photoName: string, apiKey: string) {
  const components = new URL(`https://places.googleapis.com/v1/${photoName}/media`);

  components.searchParams.set('key', apiKey);
  components.searchParams.set('maxWidthPx', String(GOOGLE_PLACE_PHOTO_MAX_WIDTH));
  components.searchParams.set('skipHttpRedirect', 'true');

  try {
    const response = await fetch(components);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GooglePlacePhotoMediaResponse;

    return data.photoUri ?? null;
  } catch {
    return null;
  }
}

async function formatPlace(place: GooglePlace, apiKey: string) {
  const firstPhoto = place.photos?.[0];
  const firstPhotoURL = firstPhoto?.name
    ? await resolvePhotoURL(firstPhoto.name, apiKey)
    : null;

  return {
    address: place.formattedAddress ?? null,
    googleMapsUrl: place.googleMapsUri ?? null,
    hours: formatOpeningHours(place.regularOpeningHours?.weekdayDescriptions),
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    name: place.displayName?.text ?? null,
    phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    photo: firstPhoto?.name
      ? {
          attributions: firstPhoto.authorAttributions ?? [],
          heightPx: firstPhoto.heightPx ?? null,
          name: firstPhoto.name,
          url: firstPhotoURL,
          widthPx: firstPhoto.widthPx ?? null,
        }
      : null,
    placeId: place.id ?? null,
    priceLevel: place.priceLevel ?? null,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    website: place.websiteUri ?? null,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

  if (!googleMapsApiKey) {
    return jsonResponse({ disabled: true, place: null });
  }

  let payload: GooglePlaceEnrichRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = normalizeQuery(payload.query);
  const placeId = typeof payload.placeId === 'string' ? payload.placeId.trim() : '';
  if (placeId && !/^[A-Za-z0-9_-]{10,255}$/.test(placeId)) {
    return jsonResponse({ error: 'Invalid placeId' }, { status: 400 });
  }
  if (!query && !placeId) {
    return jsonResponse({ error: 'query or placeId is required' }, { status: 400 });
  }

  const fields = [
    'displayName', 'formattedAddress', 'googleMapsUri', 'id', 'internationalPhoneNumber',
    'location', 'nationalPhoneNumber', 'photos', 'priceLevel', 'rating',
    'regularOpeningHours', 'userRatingCount', 'websiteUri',
  ];
  const headers = { 'Content-Type': 'application/json', 'X-Goog-Api-Key': googleMapsApiKey };
  let place: GooglePlace | null = null;
  try {
    if (placeId) {
      const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ko`, {
        headers: { ...headers, 'X-Goog-FieldMask': fields.join(',') },
      });
      if (response.status === 404) return jsonResponse({ place: null });
      if (!response.ok) throw new Error(`Google returned ${response.status}`);
      const resolved = await response.json() as GooglePlace;
      place = resolved.id === placeId ? resolved : null;
    } else {
      const lat = normalizeCoordinate(payload.lat);
      const lng = normalizeCoordinate(payload.lng);
      const address = normalizeQuery(payload.address);
      const queries = [...new Set([query + (address ? ` ${address}` : ''), query])];
      for (const textQuery of queries) {
        // Food records include bars and cafés; a restaurant-only filter drops valid places.
        const body: Record<string, unknown> = { languageCode: 'ko', maxResultCount: 5, regionCode: 'KR', textQuery };
        if (lat !== null && lng !== null) {
          body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 500 } };
        }
        const response = await fetch(GOOGLE_TEXT_SEARCH_URL, {
          body: JSON.stringify(body), headers: { ...headers, 'X-Goog-FieldMask': fields.map(field => `places.${field}`).join(',') }, method: 'POST',
        });
        if (!response.ok) throw new Error(`Google returned ${response.status}`);
        const result = await response.json();
        const places = Array.isArray(result.places) ? result.places as GooglePlace[] : [];
        place = choosePlace(places, payload);
        if (place) break;
      }
    }
    return jsonResponse({ place: place ? await formatPlace(place, googleMapsApiKey) : null });
  } catch {
    return jsonResponse({ error: 'Google Places API request failed' }, { status: 502 });
  }
});
