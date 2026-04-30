const KAKAO_LOCAL_SEARCH_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

interface KakaoPlaceLookupRequest {
  expectedPlaceId?: string;
  includeCandidates?: boolean;
  query?: string;
  radius?: number;
  x?: string;
  y?: string;
}

interface KakaoPlaceDocument {
  address_name?: string;
  category_group_code?: string;
  category_group_name?: string;
  category_name?: string;
  id?: string;
  phone?: string;
  place_name?: string;
  place_url?: string;
  road_address_name?: string;
  x?: string;
  y?: string;
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
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function normalizeRadius(value: unknown) {
  const radius = Number(value);

  if (!Number.isFinite(radius) || radius <= 0) {
    return undefined;
  }

  return Math.min(Math.round(radius), 20_000);
}

function pickBestPlace(
  documents: KakaoPlaceDocument[],
  expectedPlaceId?: string,
) {
  if (expectedPlaceId) {
    const exactMatch = documents.find((document) => document.id === expectedPlaceId);

    if (exactMatch) {
      return exactMatch;
    }
  }

  return (
    documents.find((document) => document.category_group_code === 'FD6') ??
    documents[0] ??
    null
  );
}

function formatPlace(document: KakaoPlaceDocument) {
  return {
    address: document.road_address_name || document.address_name || null,
    category: document.category_name || document.category_group_name || null,
    lat: document.y ? Number(document.y) : null,
    lng: document.x ? Number(document.x) : null,
    name: document.place_name || null,
    phone: document.phone || null,
    placeId: document.id || null,
    placeUrl: document.place_url || null,
    provider: 'kakao',
    roadAddress: document.road_address_name || null,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
  }

  const kakaoRestApiKey = Deno.env.get('KAKAO_REST_API_KEY');

  if (!kakaoRestApiKey) {
    return jsonResponse({ error: 'KAKAO_REST_API_KEY is not configured' }, { status: 500 });
  }

  let payload: KakaoPlaceLookupRequest;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const query = normalizeQuery(payload.query);

  if (!query) {
    return jsonResponse({ error: 'query is required' }, { status: 400 });
  }

  const params = new URLSearchParams({
    category_group_code: 'FD6',
    page: '1',
    query,
    size: '10',
    sort: 'accuracy',
  });
  const radius = normalizeRadius(payload.radius);

  if (payload.x && payload.y) {
    params.set('x', payload.x);
    params.set('y', payload.y);
  }

  if (radius) {
    params.set('radius', String(radius));
  }

  const kakaoResponse = await fetch(`${KAKAO_LOCAL_SEARCH_URL}?${params.toString()}`, {
    headers: {
      Authorization: `KakaoAK ${kakaoRestApiKey}`,
    },
  });

  if (!kakaoResponse.ok) {
    const message = await kakaoResponse.text();

    return jsonResponse(
      { error: 'Kakao Local API request failed', status: kakaoResponse.status, message },
      { status: 502 },
    );
  }

  const data = await kakaoResponse.json();
  const documents = Array.isArray(data.documents)
    ? (data.documents as KakaoPlaceDocument[])
    : [];
  const place = pickBestPlace(documents, payload.expectedPlaceId);

  if (!place) {
    return jsonResponse({ place: null, places: [] });
  }

  const places = documents
    .filter((document) => document.category_group_code === 'FD6' || document.category_name?.includes('음식점'))
    .map(formatPlace);

  return jsonResponse({
    place: formatPlace(place),
    places: payload.includeCandidates ? places : undefined,
  });
});
