const GOOGLE_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

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
    name?: string;
  }>;
  priceLevel?: string;
  rating?: number;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  userRatingCount?: number;
  websiteUri?: string;
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

function normalizeCoordinate(value: unknown) {
  const coordinate = Number(value);

  return Number.isFinite(coordinate) ? coordinate : null;
}

function formatOpeningHours(weekdayDescriptions?: string[]) {
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) {
    return null;
  }

  return weekdayDescriptions
    .map((description) => description.replace(/요일/g, '').replace(/:\s*/, ' '))
    .join(' / ');
}

function formatPlace(place: GooglePlace) {
  const firstPhoto = place.photos?.[0];

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
          name: firstPhoto.name,
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

  const queryParts = [
    normalizeQuery(payload.query),
    normalizeQuery(payload.address),
  ].filter(Boolean);
  const textQuery = queryParts.join(' ');

  if (!textQuery) {
    return jsonResponse({ error: 'query is required' }, { status: 400 });
  }

  const lat = normalizeCoordinate(payload.lat);
  const lng = normalizeCoordinate(payload.lng);
  const body: Record<string, unknown> = {
    includedType: 'restaurant',
    languageCode: 'ko',
    maxResultCount: 5,
    regionCode: 'KR',
    textQuery,
  };

  if (lat !== null && lng !== null) {
    body.locationBias = {
      circle: {
        center: {
          latitude: lat,
          longitude: lng,
        },
        radius: 500,
      },
    };
  }

  const googleResponse = await fetch(GOOGLE_TEXT_SEARCH_URL, {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask': [
        'places.displayName',
        'places.formattedAddress',
        'places.googleMapsUri',
        'places.id',
        'places.internationalPhoneNumber',
        'places.location',
        'places.nationalPhoneNumber',
        'places.photos',
        'places.priceLevel',
        'places.rating',
        'places.regularOpeningHours',
        'places.userRatingCount',
        'places.websiteUri',
      ].join(','),
    },
    method: 'POST',
  });

  if (!googleResponse.ok) {
    const message = await googleResponse.text();

    return jsonResponse(
      { error: 'Google Places API request failed', status: googleResponse.status, message },
      { status: 502 },
    );
  }

  const data = await googleResponse.json();
  const places = Array.isArray(data.places) ? (data.places as GooglePlace[]) : [];
  const place = places[0] ?? null;

  return jsonResponse({
    place: place ? formatPlace(place) : null,
  });
});
