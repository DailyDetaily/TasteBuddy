import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const workspaceRoot = process.cwd();
const supportedProviders = new Set(['kakao', 'naver', 'google']);

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadWorkspaceEnv() {
  loadDotEnvFile(path.join(workspaceRoot, '.env.local'));
  loadDotEnvFile(path.join(workspaceRoot, '.env'));
}

function parseArgs(argv) {
  const options = {
    provider: 'kakao',
    query: '',
    limit: 5,
    restaurantSlug: '',
    withHours: false,
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--provider') {
      options.provider = next;
      index += 1;
    } else if (arg === '--query') {
      options.query = next;
      index += 1;
    } else if (arg === '--limit') {
      options.limit = Number.parseInt(next, 10);
      index += 1;
    } else if (arg === '--restaurant-slug') {
      options.restaurantSlug = next;
      index += 1;
    } else if (arg === '--with-hours') {
      options.withHours = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/sync-place-index.mjs --provider kakao --query "정식당" --restaurant-slug jungsik --limit 3
  node scripts/sync-place-index.mjs --provider google --query "Jungsik Seoul" --with-hours --dry-run
  node scripts/sync-place-index.mjs --provider naver --query "정식당"

Providers:
  kakao   Korean place index: name, address, coordinates, phone, category, Kakao Map URL
  naver   Naver local search helper: name, address, category, phone-like telephone field
  google  Global place index and optional opening hours through --with-hours
`.trim());
}

function requireValue(label, value) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function normalizeName(value) {
  return `${value ?? ''}`.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function toNullableNumber(value) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchJson(label, url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${text}`);
  }

  return json;
}

async function searchKakaoPlaces(query, limit) {
  const key = requireValue('KAKAO_REST_API_KEY', process.env.KAKAO_REST_API_KEY);
  const params = new URLSearchParams({
    query,
    category_group_code: 'FD6',
    size: `${Math.min(Math.max(limit, 1), 15)}`,
  });

  const json = await fetchJson(
    'Kakao Local search',
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    {
      headers: {
        Authorization: `KakaoAK ${key}`,
      },
    },
  );

  return (json.documents ?? []).map((place) => ({
    provider: 'kakao',
    providerPlaceId: place.id,
    normalizedName: normalizeName(place.place_name),
    rawName: place.place_name,
    formattedAddress: place.road_address_name || place.address_name || null,
    roadAddress: place.road_address_name || null,
    lat: toNullableNumber(place.y),
    lng: toNullableNumber(place.x),
    phone: place.phone || null,
    category: place.category_name || null,
    providerUrl: place.place_url || null,
    sourcePayload: place,
    hours: null,
  }));
}

async function searchNaverPlaces(query, limit) {
  const clientId = requireValue('NAVER_CLIENT_ID', process.env.NAVER_CLIENT_ID);
  const clientSecret = requireValue('NAVER_CLIENT_SECRET', process.env.NAVER_CLIENT_SECRET);
  const params = new URLSearchParams({
    query,
    display: `${Math.min(Math.max(limit, 1), 5)}`,
    sort: 'random',
  });

  const json = await fetchJson(
    'Naver Local search',
    `https://openapi.naver.com/v1/search/local.json?${params}`,
    {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    },
  );

  return (json.items ?? []).map((place) => ({
    provider: 'naver',
    providerPlaceId: `${place.mapx ?? ''}:${place.mapy ?? ''}:${normalizeName(place.title)}`,
    normalizedName: normalizeName(place.title),
    rawName: place.title,
    formattedAddress: place.roadAddress || place.address || null,
    roadAddress: place.roadAddress || null,
    lat: null,
    lng: null,
    phone: place.telephone || null,
    category: place.category || null,
    providerUrl: place.link || null,
    sourcePayload: place,
    hours: null,
  }));
}

function normalizeGooglePlace(place, details = null) {
  const source = details ?? place;
  const displayName = source.displayName?.text ?? place.displayName?.text ?? source.name;
  const openingHours = source.regularOpeningHours ?? null;
  const currentHours = source.currentOpeningHours ?? null;

  return {
    provider: 'google',
    providerPlaceId: `${source.id ?? place.id}`,
    normalizedName: normalizeName(displayName),
    rawName: displayName,
    formattedAddress: source.formattedAddress ?? null,
    roadAddress: null,
    lat: toNullableNumber(source.location?.latitude),
    lng: toNullableNumber(source.location?.longitude),
    phone: source.nationalPhoneNumber ?? source.internationalPhoneNumber ?? null,
    category: source.primaryTypeDisplayName?.text ?? source.primaryType ?? null,
    providerUrl: source.googleMapsUri ?? null,
    sourcePayload: source,
    hours: openingHours || currentHours
      ? {
          regularHoursJson: openingHours ?? {},
          regularHoursText: openingHours?.weekdayDescriptions ?? [],
          currentOpenNow: currentHours?.openNow ?? openingHours?.openNow ?? null,
          sourcePayload: {
            regularOpeningHours: openingHours,
            currentOpeningHours: currentHours,
          },
        }
      : null,
  };
}

async function fetchGooglePlaceDetails(placeId) {
  const key = requireValue('GOOGLE_MAPS_API_KEY', process.env.GOOGLE_MAPS_API_KEY);
  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'location',
    'primaryType',
    'primaryTypeDisplayName',
    'googleMapsUri',
    'nationalPhoneNumber',
    'internationalPhoneNumber',
    'regularOpeningHours',
    'currentOpeningHours',
  ].join(',');

  return fetchJson('Google Place Details', `https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fields,
    },
  });
}

async function searchGooglePlaces(query, limit, withHours) {
  const key = requireValue('GOOGLE_MAPS_API_KEY', process.env.GOOGLE_MAPS_API_KEY);
  const fields = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.primaryType',
    'places.primaryTypeDisplayName',
    'places.googleMapsUri',
  ].join(',');

  const json = await fetchJson('Google Text Search', 'https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': fields,
    },
    body: JSON.stringify({
      textQuery: query,
      includedType: 'restaurant',
      maxResultCount: Math.min(Math.max(limit, 1), 20),
      languageCode: 'ko',
      regionCode: 'KR',
    }),
  });

  const places = json.places ?? [];
  if (!withHours) {
    return places.map((place) => normalizeGooglePlace(place));
  }

  const hydrated = [];
  for (const place of places) {
    const details = await fetchGooglePlaceDetails(place.id);
    hydrated.push(normalizeGooglePlace(place, details));
  }

  return hydrated;
}

async function searchPlaces(options) {
  if (options.provider === 'kakao') {
    return searchKakaoPlaces(options.query, options.limit);
  }

  if (options.provider === 'naver') {
    return searchNaverPlaces(options.query, options.limit);
  }

  if (options.provider === 'google') {
    return searchGooglePlaces(options.query, options.limit, options.withHours);
  }

  throw new Error(`Unsupported provider: ${options.provider}`);
}

async function runQuery(label, action) {
  const result = await action();
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function resolveRestaurantId(supabase, slug) {
  if (!slug) {
    return null;
  }

  const data = await runQuery('find restaurant', () =>
    supabase.from('restaurants').select('id, slug').eq('slug', slug).single(),
  );

  return data.id;
}

function buildPlacePayload(place, restaurantId) {
  const payload = {
    provider: place.provider,
    provider_place_id: place.providerPlaceId,
    normalized_name: place.normalizedName,
    raw_name: place.rawName,
    formatted_address: place.formattedAddress,
    road_address: place.roadAddress,
    lat: place.lat,
    lng: place.lng,
    phone: place.phone,
    category: place.category,
    provider_url: place.providerUrl,
    source_payload: place.sourcePayload,
    source_updated_at: null,
    last_synced_at: new Date().toISOString(),
  };

  if (restaurantId) {
    payload.restaurant_id = restaurantId;
  }

  return payload;
}

async function upsertPlace(supabase, place, restaurantId) {
  const payload = buildPlacePayload(place, restaurantId);

  return runQuery('upsert restaurant place index', () =>
    supabase
      .from('restaurant_place_index')
      .upsert(payload, { onConflict: 'provider,provider_place_id' })
      .select('id, restaurant_id, provider, normalized_name')
      .single(),
  );
}

async function upsertHours(supabase, placeRecord, place) {
  if (!place.hours) {
    return null;
  }

  const payload = {
    restaurant_id: placeRecord.restaurant_id,
    restaurant_place_index_id: placeRecord.id,
    provider: place.provider,
    regular_hours_json: place.hours.regularHoursJson ?? {},
    regular_hours_text: place.hours.regularHoursText ?? [],
    current_open_now: place.hours.currentOpenNow,
    timezone: 'Asia/Seoul',
    source_payload: place.hours.sourcePayload ?? {},
    last_checked_at: new Date().toISOString(),
  };

  return runQuery('upsert restaurant operating hours', () =>
    supabase
      .from('restaurant_operating_hours')
      .upsert(payload, { onConflict: 'restaurant_place_index_id,provider' })
      .select('id')
      .single(),
  );
}

function printResults(places) {
  console.table(
    places.map((place) => ({
      provider: place.provider,
      id: place.providerPlaceId,
      name: place.normalizedName,
      address: place.formattedAddress,
      lat: place.lat,
      lng: place.lng,
      hasHours: Boolean(place.hours),
    })),
  );
}

async function main() {
  loadWorkspaceEnv();
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  if (!supportedProviders.has(options.provider)) {
    throw new Error(`--provider must be one of: ${Array.from(supportedProviders).join(', ')}`);
  }

  if (!options.query) {
    throw new Error('--query is required.');
  }

  const places = await searchPlaces(options);
  printResults(places);

  if (options.dryRun) {
    console.log(`Dry run complete. ${places.length} place candidate(s) fetched.`);
    return;
  }

  const supabaseUrl = requireValue('VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL);
  const supabaseSecretKey = requireValue(
    'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
    },
  });

  const restaurantId = await resolveRestaurantId(supabase, options.restaurantSlug);
  let syncedPlaces = 0;
  let syncedHours = 0;

  for (const place of places) {
    const placeRecord = await upsertPlace(supabase, place, restaurantId);
    syncedPlaces += 1;

    const hoursRecord = await upsertHours(supabase, placeRecord, place);
    if (hoursRecord) {
      syncedHours += 1;
    }
  }

  console.log(`Synced ${syncedPlaces} place index row(s), ${syncedHours} operating hour row(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
