import type {
  DiningFeedbackChoice,
  DiningDishMetadata,
  DiningFeedbackDraft,
  DiningFeedbackScenario,
} from '../constants/diningFeedbackData';
import {
  createDiningFeedbackDraft,
  getDiningFeedbackScenario,
  hasDiningDishFeedbackResponse,
} from '../constants/diningFeedbackData';
import {
  TASTE_IDS,
  type TasteId,
} from '../constants/designTokens';
import {
  PERCEPTUAL_AXES,
  type PerceptualAxis,
  type PerceptualVector,
  type SignedPerceptualVector,
  type SignedTasteVector,
  type UserLearnedCalibration,
} from '../types/tastePersonalization';
import {
  RESERVATION_CATALOG,
  buildMockReservationExternalRef,
  getReservationCatalogEntry,
  parseMockReservationExternalRef,
  type ReservationRecord,
  type ReservationStatus,
  type ReservationTimelineStep,
} from '../constants/reservationCatalog';
import { getChefImageByName } from '../constants/chefImages';
import {
  TASTE_MEASUREMENT_AVERAGES,
  createInitialTasteMeasurementResults,
  type TasteMeasurementResults,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import {
  computeReservationLearningSignal,
  createEmptyUserLearnedCalibration,
  parseFeedbackSelections,
  updateUserLearnedCalibration,
} from './tastePersonalization';
import { ensureSupabaseSession, isSupabaseConfigured, supabase } from './supabase';
import { resolvePublicMediaPath } from './mediaAssets';

type MeasurementSource = 'quick_calibration' | 'tastick' | 'manual';

interface MeasurementPersistenceOptions {
  rawPayload?: Record<string, unknown>;
}

export interface ReservationPersistenceInput {
  id: number;
  restaurant: string;
  chef: string;
  date: string;
  time: string;
  guests: number;
  course: string;
  externalRef?: string | null;
  remoteId?: string | null;
  status: 'upcoming' | 'preparing' | 'ready' | 'completed';
}

interface FeedbackSubmissionResult {
  persisted: boolean;
  reservationSignalReasons: string[];
}

interface HydratedReservationPageData {
  feedbackByReservationId: Record<number, DiningFeedbackDraft>;
  feedbackScenariosByReservationId: Record<number, DiningFeedbackScenario>;
  reservations: ReservationRecord[];
}

interface ReservationQueryRow {
  chefs:
    | { avatar_path: string | null; display_name: string | null }
    | Array<{ avatar_path: string | null; display_name: string | null }>
    | null;
  course_name: string | null;
  external_ref: string | null;
  id: string;
  party_size: number;
  reservation_at: string;
  restaurants: { name: string } | Array<{ name: string }> | null;
  status: string;
}

interface FeedbackItemQueryRow {
  rating: number;
  reservation_dishes: { sort_order: number } | Array<{ sort_order: number }> | null;
  selected_tag_ids: unknown;
}

interface ReservationDishQueryRow {
  chef_intent: string | null;
  course_position: string | null;
  flavor_notes: string[] | null;
  id: string;
  ingredients: string[] | null;
  reservation_id: string;
  sort_order: number;
  subtitle: string | null;
  techniques: string[] | null;
  title: string;
}

interface FeedbackSubmissionQueryRow {
  feedback_items: FeedbackItemQueryRow[] | null;
  overall_comment: string | null;
  overall_rating: number;
  reservation_id: string;
  return_intent: DiningFeedbackDraft['returnIntent'];
}

interface MeasurementSessionQueryRow {
  completed_at: string | null;
  id: string;
  source?: MeasurementSource | null;
}

interface ContentChefQueryRow {
  avatar_path: string | null;
  display_name: string | null;
  id: string;
  restaurants: { name: string | null; slug: string | null } | Array<{ name: string | null; slug: string | null }> | null;
}

interface ContentInferenceProfileQueryRow {
  confidence: number | null;
  perceptual_vector: Partial<Record<PerceptualAxis, number>> | null;
  taste_vector: Partial<Record<TasteId, number>> | null;
}

interface ContentObservedFactQueryRow {
  fact_type: string | null;
  value_json: Record<string, unknown> | null;
  value_text: string | null;
}

interface ContentDishQueryRow {
  course_position: string | null;
  dish_inference_profiles:
    | ContentInferenceProfileQueryRow
    | ContentInferenceProfileQueryRow[]
    | null;
  dish_observed_facts: ContentObservedFactQueryRow[] | null;
  id: string;
  public_subtitle: string | null;
  public_title: string | null;
  restaurants: { name: string | null; slug: string | null } | Array<{ name: string | null; slug: string | null }> | null;
  season_label: string | null;
  status: string | null;
}

interface RestaurantPlaceIndexQueryRow {
  category: string | null;
  formatted_address: string | null;
  id: string;
  lat: number | null;
  lng: number | null;
  normalized_name: string | null;
  phone: string | null;
  provider: string | null;
  provider_place_id: string | null;
  provider_url: string | null;
  raw_name: string | null;
  restaurants:
    | { name: string | null; slug: string | null }
    | Array<{ name: string | null; slug: string | null }>
    | null;
  road_address: string | null;
}

export interface RestaurantContentChef {
  avatarPath: string | null;
  id: string;
  name: string;
  restaurant: string;
  restaurantSlug: string;
  signatureDishTitles: string[];
  taste: TasteId;
}

export interface RestaurantContentDish {
  chef: string;
  chefAvatarPath: string | null;
  chefId: string | null;
  confidence: number;
  courseLabel: string;
  coursePosition: string;
  dominantTaste: TasteId;
  id: string;
  ingredients: string[];
  perceptualVector: PerceptualVector;
  restaurant: string;
  restaurantSlug: string;
  seasonLabel: string | null;
  subtitle: string;
  tasteVector: Record<TasteId, number>;
  title: string;
}

export interface RestaurantContentCatalog {
  chefs: RestaurantContentChef[];
  dishes: RestaurantContentDish[];
}

export interface RestaurantPlaceInfo {
  address: string;
  googleMapsUrl?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
  phone?: string;
  website?: string;
  hours?: string;
  sourceByRow: {
    address: 'kakao';
    hours?: 'google';
    phone?: 'kakao' | 'google';
    website?: 'google';
  };
}

interface KakaoPlaceLookupResponse {
  place: {
    address: string | null;
    category: string | null;
    lat: number | null;
    lng: number | null;
    name: string | null;
    phone: string | null;
    placeId: string | null;
    placeUrl: string | null;
    provider: 'kakao';
    roadAddress: string | null;
  } | null;
}

export interface KakaoPlaceSearchResult {
  address: string | null;
  category: string | null;
  lat: number | null;
  lng: number | null;
  name: string | null;
  phone: string | null;
  placeId: string | null;
  placeUrl: string | null;
  provider: 'kakao';
  roadAddress: string | null;
}

interface GooglePlaceEnrichResponse {
  place: {
    address: string | null;
    googleMapsUrl: string | null;
    hours: string | null;
    lat: number | null;
    lng: number | null;
    name: string | null;
    phone: string | null;
    photo: {
      attributions: Array<{
        displayName?: string;
        uri?: string;
      }>;
      name: string;
    } | null;
    placeId: string | null;
    priceLevel: string | null;
    rating: number | null;
    userRatingCount: number | null;
    website: string | null;
  } | null;
}

interface ReservationSeedCandidate {
  chef: string;
  dishes: RestaurantContentDish[];
  restaurant: string;
  restaurantSlug: string;
  seasonLabel: string | null;
}

const RESTAURANT_NAME_TRANSLATIONS: Record<string, string> = {
  '7TH DOOR': '7th Door',
  '7TH DOOR SEOUL': '7th Door',
  '세븐도어': '7th Door',
  '세븐스도어': '7th Door',
  'ALLA PRIMA': '알라프리마',
  ALLAPRIMA: '알라프리마',
  'EATANIC GARDEN': '이타닉가든',
  EVETT: '에빗',
  JUNGSIK: '정식당',
  JUNGSIKSEOUL: '정식당',
  'LA YEON': '라연',
  'LA YEON SEOUL': '라연',
  MINGLES: '밍글스',
  'MOSU SEOUL BY CHEF SUNG ANH': '모수',
  MOSU: '모수',
  MITOU: '미토우',
  ONJIUM: '온지음',
  'RESTAURANT ALLEN': '레스토랑 알렌',
  SOIGNE: '스와니예',
  SOSUHEON: '소수헌',
  KWONSOOKSOO: '권숙수',
};

const CHEF_NAME_TRANSLATIONS: Record<string, string> = {
  'AHN SUNG-JAE': '안성재',
  'CHO EUN-HEE / PARK SUNG-BAE': '조은희 / 박성배',
  'CHO EUN HEE / PARK SUNG BAE': '조은희 / 박성배',
  'JOSEPH LIDGERWOOD': '조셉 리저우드',
  'KIM JIN HYEOK': '김진혁',
  'KIM JIN-HYEOK': '김진혁',
  'KIM DAE-CHUN': '김대천',
  'KIM SUNG IL': '김성일',
  'KIM SUNG-IL': '김성일',
  'KWON WOO-JOONG': '권우중',
  'KWON WOO JOONG': '권우중',
  'KWON YOUNG-WOON / KIM BO-MI': '권영운 / 김보미',
  'MINGOO KANG': '강민구',
  'PARK KYUNG-JAE': '박경재',
  'SEO HYUN-MIN': '서현민',
  'SON JONG-WON': '손종원',
  'YIM JUNG-SIK': '임정식',
};

const DISH_TITLE_TRANSLATIONS: Record<string, string> = {
  ABALONE: '전복',
  'ADD SEA URCHIN': '성게 추가',
  'ALL IN ONE GIMBAP': '올인원 김밥',
  BANCHAN: '반찬',
  'DO SEA URCHIN': '성게 추가',
  'DOLHAREUBANG OR NY-SEOUL': '돌하르방 또는 NY-서울',
  'DOLHAREUBANG OR ULLEUNGDO': '돌하르방 또는 울릉도',
  'DOLHAREUBANG OR ULLEUNGDO MAPLE': '돌하르방 또는 울릉도 메이플',
  'DUCK OR HANWOO GALBI': '오리 또는 한우 갈비',
  'GAMTAE GUKSU': '감태 국수',
  GIMBAP: '김밥',
  GOGUMA: '고구마',
  HWACHAE: '화채',
  'JUNGSIK SALMON': '정식당 연어',
  MAPLE: '메이플',
  'NY-SEOUL': 'NY-서울',
  'SONG I MAN DU': '송이만두',
  'SUCK OR HANWOO GALB': '오리 또는 한우 갈비',
  'SWEET NY-SEOUL': '스위트 NY-SEOUL',
  'SWEET ULLEUNGDO MAPLE': '스위트 울릉도 메이플',
  'TRUFFLE MUGUK': '트러플 뭇국',
  'ULLEUNGDO MAPLE': '울릉도 메이플',
  'URCHIN BIBIMBAP': '성게 비빔밥',
  'URCHIN GUJEOLPAN': '성게 구절판',
  'YELLOWTAIL GIMBAP': '방어 김밥',
};

const COURSE_POSITION_LABELS: Record<string, string> = {
  amuse: '아뮤즈',
  beverage: '음료',
  dessert: '디저트',
  fish: '생선',
  main: '메인',
  other: '특선',
  petit_four: '다과',
  snack: '스낵',
  starter: '스타터',
};

function normalizeTranslationKey(value: string) {
  return value.replace(/[()]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function normalizeComparableName(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[()'".,/-]/g, '')
    .replace(/\s+/g, '');
}

function localizeRestaurantName(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) {
    return '레스토랑 미정';
  }

  return RESTAURANT_NAME_TRANSLATIONS[normalizeTranslationKey(text)] ?? text;
}

function localizeChefName(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) {
    return '셰프 미정';
  }

  return CHEF_NAME_TRANSLATIONS[normalizeTranslationKey(text)] ?? text;
}

function localizeDishTitle(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) {
    return '메뉴 미정';
  }

  return DISH_TITLE_TRANSLATIONS[normalizeTranslationKey(text)] ?? text;
}

function containsHangul(value: string | null | undefined) {
  return /[가-힣]/.test(value ?? '');
}

function createZeroTasteVector() {
  return TASTE_IDS.reduce<Record<TasteId, number>>((accumulator, tasteId) => {
    accumulator[tasteId] = 0;
    return accumulator;
  }, {} as Record<TasteId, number>);
}

function formatCoursePositionLabel(value: string | null | undefined) {
  return COURSE_POSITION_LABELS[value ?? 'other'] ?? '특선';
}

function getCoursePositionOrder(value: string | null | undefined) {
  switch (value) {
    case 'snack':
    case 'amuse':
    case 'beverage':
      return 0;
    case 'starter':
      return 1;
    case 'fish':
      return 2;
    case 'main':
      return 3;
    case 'dessert':
      return 4;
    case 'petit_four':
      return 5;
    default:
      return 6;
  }
}

function buildCourseNameFromSeasonLabel(seasonLabel: string | null | undefined) {
  const text = seasonLabel?.trim() ?? '';
  const normalized = text.toLowerCase();

  if (normalized.includes('dinner')) {
    return '시그니처 디너 코스';
  }

  if (normalized.includes('lunch')) {
    return '시그니처 런치 코스';
  }

  return '시즌 테이스팅 코스';
}

function buildReservationSeedSchedule(index: number, seasonLabel: string | null | undefined) {
  const baseDate = new Date();
  const normalized = seasonLabel?.toLowerCase() ?? '';
  const isLunch = normalized.includes('lunch');
  const statusCycle: ReservationStatus[] = ['ready', 'upcoming', 'completed', 'ready'];
  const status = statusCycle[index % statusCycle.length];
  const date = new Date(baseDate);

  if (status === 'completed') {
    date.setDate(date.getDate() - (10 + index));
  } else if (status === 'ready') {
    date.setDate(date.getDate() + (3 + index));
  } else if (status === 'preparing') {
    date.setDate(date.getDate() + (6 + index));
  } else {
    date.setDate(date.getDate() + (13 + index));
  }

  const hours = isLunch ? 12 : 19;
  const minutes = isLunch ? 30 : index % 2 === 0 ? 0 : 30;
  date.setHours(hours, minutes, 0, 0);

  return {
    status,
    dateIso: date.toISOString(),
  };
}

function getSeasonRecencyScore(value: string | null | undefined) {
  const text = value?.trim();

  if (!text) {
    return 0;
  }

  const yearMatch = text.match(/20\d{2}/);
  const yearScore = yearMatch ? Number.parseInt(yearMatch[0], 10) : 2020;
  const dinnerBoost = /dinner/i.test(text) ? 0.2 : 0;
  const lunchBoost = /lunch/i.test(text) ? 0.1 : 0;
  const undatedPenalty = /undated|public tasting notes|reference/i.test(text) ? -0.3 : 0;

  return yearScore + dinnerBoost + lunchBoost + undatedPenalty;
}

function extractObservedFactValues(
  facts: ContentObservedFactQueryRow[] | null | undefined,
  factType: string,
) {
  const match = (facts ?? []).find((fact) => fact.fact_type === factType);
  if (!match) {
    return [];
  }

  const jsonValue = match.value_json;
  if (jsonValue) {
    for (const candidate of Object.values(jsonValue)) {
      if (Array.isArray(candidate)) {
        return candidate
          .map((entry) => `${entry}`.trim())
          .filter(Boolean)
          .map((entry) => localizeDishTitle(entry));
      }
    }
  }

  if (match.value_text) {
    return match.value_text
      .split(/,|·/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => localizeDishTitle(entry));
  }

  return [];
}

function buildLocalizedSubtitle(
  title: string,
  subtitle: string | null | undefined,
  ingredients: string[],
) {
  const trimmedSubtitle = subtitle?.trim();

  if (trimmedSubtitle && containsHangul(trimmedSubtitle)) {
    return trimmedSubtitle;
  }

  if (ingredients.length > 0) {
    return ingredients.slice(0, 4).join(' · ');
  }

  if (trimmedSubtitle) {
    const localized = localizeDishTitle(trimmedSubtitle);
    return localized === title ? '' : localized;
  }

  return '';
}

function getDominantTasteFromVector(vector: Partial<Record<TasteId, number>> | null | undefined) {
  return TASTE_IDS.reduce<TasteId>((current, candidate) => {
    const currentValue = vector?.[current] ?? 0;
    const candidateValue = vector?.[candidate] ?? 0;
    return candidateValue > currentValue ? candidate : current;
  }, TASTE_IDS[0]);
}

function readNumericRecord<K extends string>(keys: readonly K[], value: unknown) {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<Record<K, unknown>>)
      : {};

  return keys.reduce<Record<K, number>>((record, key) => {
    const numericValue = Number(source[key] ?? 0);
    record[key] = Number.isFinite(numericValue) ? numericValue : 0;
    return record;
  }, {} as Record<K, number>);
}

function takeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function isMatchingPlaceIndexRow(row: RestaurantPlaceIndexQueryRow, restaurantName: string) {
  const targetName = normalizeComparableName(restaurantName);
  const restaurantRelation = takeSingleRelation(row.restaurants);
  const candidates = [
    restaurantRelation?.name,
    restaurantRelation?.slug,
    row.normalized_name,
    row.raw_name,
  ].map(normalizeComparableName);

  return candidates.some(
    (candidate) =>
      candidate &&
      (candidate.includes(targetName) || targetName.includes(candidate)),
  );
}

function buildRestaurantPlaceInfoFromIndex(
  row: RestaurantPlaceIndexQueryRow,
): RestaurantPlaceInfo | null {
  const address = row.road_address || row.formatted_address;

  if (!address) {
    return null;
  }

  const placeInfo: RestaurantPlaceInfo = {
    address,
    sourceByRow: {
      address: 'kakao',
    },
  };

  if (typeof row.lat === 'number') {
    placeInfo.lat = row.lat;
  }

  if (typeof row.lng === 'number') {
    placeInfo.lng = row.lng;
  }

  if (row.provider_url) {
    placeInfo.mapUrl = row.provider_url;
  }

  if (row.phone) {
    placeInfo.phone = row.phone;
    placeInfo.sourceByRow.phone = 'kakao';
  }

  return placeInfo;
}

async function lookupLiveKakaoPlaceInfo(
  restaurantName: string,
  placeIndexMatch?: RestaurantPlaceIndexQueryRow,
): Promise<RestaurantPlaceInfo | null> {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  const query = placeIndexMatch?.raw_name || restaurantName;
  const { data, error } = await supabase.functions.invoke<KakaoPlaceLookupResponse>(
    'kakao-place-lookup',
    {
      body: {
        expectedPlaceId:
          placeIndexMatch?.provider === 'kakao'
            ? placeIndexMatch.provider_place_id ?? undefined
            : undefined,
        query,
      },
    },
  );

  if (error) {
    console.warn('Failed to hydrate live Kakao place info.', error);
    return null;
  }

  const place = data?.place;
  const address = place?.roadAddress || place?.address;

  if (!place || !address) {
    return null;
  }

  const placeInfo: RestaurantPlaceInfo = {
    address,
    sourceByRow: {
      address: 'kakao',
    },
  };

  if (typeof place.lat === 'number') {
    placeInfo.lat = place.lat;
  }

  if (typeof place.lng === 'number') {
    placeInfo.lng = place.lng;
  }

  if (place.placeUrl) {
    placeInfo.mapUrl = place.placeUrl;
  }

  if (place.phone) {
    placeInfo.phone = place.phone;
    placeInfo.sourceByRow.phone = 'kakao';
  }

  return placeInfo;
}

async function lookupGooglePlaceEnrichment(
  restaurantName: string,
  basePlaceInfo: RestaurantPlaceInfo | null,
): Promise<Partial<RestaurantPlaceInfo> | null> {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase.functions.invoke<GooglePlaceEnrichResponse>(
    'google-place-enrich',
    {
      body: {
        address: basePlaceInfo?.address,
        lat: basePlaceInfo?.lat,
        lng: basePlaceInfo?.lng,
        phone: basePlaceInfo?.phone,
        query: restaurantName,
      },
    },
  );

  if (error) {
    console.warn('Failed to hydrate Google place enrichment.', error);
    return null;
  }

  const place = data?.place;

  if (!place) {
    return null;
  }

  const enrichment: Partial<RestaurantPlaceInfo> = {
    sourceByRow: {},
  };

  if (place.hours) {
    enrichment.hours = place.hours;
    enrichment.sourceByRow = {
      ...enrichment.sourceByRow,
      hours: 'google',
    };
  }

  if (place.website) {
    enrichment.website = place.website;
    enrichment.sourceByRow = {
      ...enrichment.sourceByRow,
      website: 'google',
    };
  }

  if (!basePlaceInfo?.phone && place.phone) {
    enrichment.phone = place.phone;
    enrichment.sourceByRow = {
      ...enrichment.sourceByRow,
      phone: 'google',
    };
  }

  if (place.googleMapsUrl) {
    enrichment.googleMapsUrl = place.googleMapsUrl;
  }

  return enrichment;
}

function mergePlaceInfo(
  basePlaceInfo: RestaurantPlaceInfo | null,
  enrichment: Partial<RestaurantPlaceInfo> | null,
) {
  if (!basePlaceInfo) {
    return null;
  }

  if (!enrichment) {
    return basePlaceInfo;
  }

  return {
    ...basePlaceInfo,
    ...enrichment,
    sourceByRow: {
      ...basePlaceInfo.sourceByRow,
      ...enrichment.sourceByRow,
    },
  } satisfies RestaurantPlaceInfo;
}

export async function hydrateRestaurantPlaceInfo(
  restaurantName: string,
): Promise<RestaurantPlaceInfo | null> {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from('restaurant_place_index')
    .select(
      'id, provider, provider_place_id, normalized_name, raw_name, formatted_address, road_address, lat, lng, phone, category, provider_url, restaurants(name, slug)',
    )
    .order('last_synced_at', { ascending: false })
    .limit(200);

  if (error) {
    console.warn('Failed to hydrate restaurant place info from Supabase.', error);
    return lookupLiveKakaoPlaceInfo(restaurantName);
  }

  const rows = (data ?? []) as RestaurantPlaceIndexQueryRow[];
  const match = rows.find((row) => isMatchingPlaceIndexRow(row, restaurantName));
  const livePlaceInfo = await lookupLiveKakaoPlaceInfo(restaurantName, match);
  const basePlaceInfo = livePlaceInfo ?? (match ? buildRestaurantPlaceInfoFromIndex(match) : null);
  const googleEnrichment = await lookupGooglePlaceEnrichment(restaurantName, basePlaceInfo);

  return mergePlaceInfo(basePlaceInfo, googleEnrichment);
}

export async function searchKakaoRestaurantPlaces(
  query: string,
): Promise<KakaoPlaceSearchResult[]> {
  if (!supabase || !isSupabaseConfigured) {
    return [];
  }

  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const { data, error } = await supabase.functions.invoke<{
    places?: KakaoPlaceSearchResult[];
    place?: KakaoPlaceSearchResult | null;
  }>('kakao-place-lookup', {
    body: {
      includeCandidates: true,
      query: normalizedQuery,
    },
  });

  if (error) {
    console.warn('Failed to search Kakao restaurant places.', error);
    return [];
  }

  if (Array.isArray(data?.places)) {
    return data.places;
  }

  return data?.place ? [data.place] : [];
}

function formatReservationDateParts(dateIso: string) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(dateIso));

  const getPartValue = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  const year = getPartValue('year');
  const month = getPartValue('month');
  const day = getPartValue('day');
  const rawHour = Number.parseInt(getPartValue('hour'), 10);
  const minute = getPartValue('minute');
  const meridiem = rawHour >= 12 ? '저녁' : '오전';
  const displayHour = rawHour % 12 || 12;

  return {
    date: `${year}.${month}.${day}`,
    time: `${meridiem} ${displayHour}:${minute}`,
  };
}

function hashTextToNumericId(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 900000;
  }

  return hash + 100000;
}

function mapReservationStatusFromDb(status: string): ReservationStatus {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'ready':
      return 'ready';
    case 'preparing':
      return 'ready';
    case 'draft':
    case 'confirmed':
    case 'cancelled':
    default:
      return 'upcoming';
  }
}

function buildGenericReservationTimeline(status: ReservationStatus): ReservationTimelineStep[] {
  switch (status) {
    case 'completed':
      return [
        { step: '예약 확정', done: true },
        { step: '미각 데이터 전달', done: true },
        { step: '셰프 TCS 준비', done: true },
        { step: '사전 미각 측정', done: true },
        { step: '다이닝 완료', done: true },
      ];
    case 'ready':
      return [
        { step: '예약 확정', done: true },
        { step: '미각 데이터 전달', done: true },
        { step: '셰프 TCS 준비', done: true },
        { step: '사전 미각 측정', done: false },
        { step: '다이닝 당일', done: false, current: true },
      ];
    case 'preparing':
      return [
        { step: '예약 확정', done: true },
        { step: '미각 데이터 전달', done: true },
        { step: '셰프 TCS 준비', done: false, current: true },
        { step: '사전 미각 측정', done: false },
        { step: '다이닝 당일', done: false },
      ];
    case 'upcoming':
    default:
      return [
        { step: '예약 확정', done: true },
        { step: '미각 데이터 전달', done: false, current: true },
        { step: '셰프 TCS 준비', done: false },
        { step: '사전 미각 측정', done: false },
        { step: '다이닝 당일', done: false },
      ];
  }
}

function buildGenericTcsStatus(status: ReservationStatus) {
  switch (status) {
    case 'completed':
      return '다이닝이 완료되었습니다';
    case 'ready':
      return '셰프 가이드가 준비되었습니다';
    case 'preparing':
      return '셰프 가이드가 준비되었습니다';
    case 'upcoming':
    default:
      return '예약이 확정되었습니다';
  }
}

function buildGenericDiningPromise(
  restaurantName: string,
  courseName: string,
  status: ReservationStatus,
) {
  if (status === 'completed') {
    return `${restaurantName}의 ${courseName} 경험을 기반으로 다음 다이닝 개인화를 더 정교하게 이어갈 수 있어요.`;
  }

  if (status === 'preparing' || status === 'ready') {
    return `${courseName}에서 현재 프로필이 더 자연스럽게 전달되도록 셰프가 참고할 수 있는 개인화 가이드가 준비됐어요.`;
  }

  return `${restaurantName} 예약은 현재 프로필을 바탕으로 더 잘 맞는 다이닝 흐름을 준비할 수 있는 상태예요.`;
}

function buildGenericGuestUnderstanding(courseName: string, status: ReservationStatus) {
  if (status === 'completed') {
    return `${courseName}에서 남긴 반응은 다음 예약과 셰프용 캘리브레이션을 더 정교하게 만드는 근거가 됩니다.`;
  }

  return `현재 프로필은 ${courseName}의 전달 강도와 마무리 방향을 더 자연스럽게 맞추는 데 참고될 수 있어요.`;
}

function getGenericFeedbackChoiceDefinitions(coursePosition: string | null | undefined) {
  switch (coursePosition) {
    case 'dessert':
    case 'petit_four':
      return [
        { id: 'dessert-balanced', affectedTastes: ['단맛', '정리감'] },
        { id: 'sweet-too-forward-generic', affectedTastes: ['단맛'] },
        { id: 'freshness-needed-generic', affectedTastes: ['신맛', '정리감'] },
      ] as const;
    case 'starter':
    case 'snack':
    case 'amuse':
    case 'beverage':
      return [
        { id: 'dish-balanced-generic', affectedTastes: ['균형감'] },
        { id: 'flavor-too-strong-generic', affectedTastes: ['감칠맛', '향'] },
        { id: 'freshness-needed-generic', affectedTastes: ['신맛', '정리감'] },
      ] as const;
    default:
      return [
        { id: 'dish-balanced-generic', affectedTastes: ['균형감'] },
        { id: 'finish-too-heavy-generic', affectedTastes: ['지방감', '감칠맛'] },
        { id: 'finish-too-short-generic', affectedTastes: ['감칠맛', '피니시'] },
      ] as const;
  }
}

function buildGenericFeedbackChoices(dish: {
  coursePosition: string | null | undefined;
  ingredients: readonly string[];
  subtitle: string | null | undefined;
  title: string;
}): readonly DiningFeedbackChoice[] {
  const ingredientPairing =
    dish.ingredients.length > 0
      ? dish.ingredients.slice(0, 4).join(' · ')
      : dish.subtitle?.trim() || dish.title;

  return getGenericFeedbackChoiceDefinitions(dish.coursePosition).map((choice) => {
    switch (choice.id) {
      case 'dish-balanced-generic':
      case 'dessert-balanced':
        return {
          id: choice.id,
          label: choice.id === 'dessert-balanced' ? '식사의 끝맛과 잘 이어졌어요' : '지금 밸런스가 잘 맞았어요',
          affectedTastes: [...choice.affectedTastes],
          ingredientPairing,
          recommendation: `${dish.title}의 현재 흐름을 유지하되 식감 대비와 마무리 리듬만 계속 살리면 좋습니다.`,
          reason: `${dish.title}의 중심 풍미와 끝맛이 현재 프로필 기준에서 비교적 편안하게 받아들여졌습니다.`,
        };
      case 'flavor-too-strong-generic':
        return {
          id: choice.id,
          label: '풍미가 조금 강하게 느껴졌어요',
          affectedTastes: [...choice.affectedTastes],
          ingredientPairing,
          recommendation: `${dish.title}의 핵심 인상은 유지하되 향과 밀도의 겹침을 조금만 나눠주면 더 자연스럽게 느껴질 수 있어요.`,
          reason: `${dish.title}에서 향이나 밀도가 한 번에 올라오며 현재 컨디션 기준으로는 풍미가 조금 강하게 인지됐습니다.`,
        };
      case 'finish-too-heavy-generic':
        return {
          id: choice.id,
          label: '끝맛이 조금 무겁게 남았어요',
          affectedTastes: [...choice.affectedTastes],
          ingredientPairing,
          recommendation: `${dish.title}의 마무리에 정리감을 한 단계 더 주면 전체 코스 흐름이 더 편안하게 이어질 수 있어요.`,
          reason: `${dish.title} 이후 입안에 남는 무게감과 여운이 예상보다 길게 유지된 인상입니다.`,
        };
      case 'finish-too-short-generic':
        return {
          id: choice.id,
          label: '인상이 조금 짧게 끝났어요',
          affectedTastes: [...choice.affectedTastes],
          ingredientPairing,
          recommendation: `${dish.title}의 중심 인상이 조금 더 이어지도록 여운이나 연결감을 보강하면 더 잘 맞을 수 있어요.`,
          reason: `${dish.title}의 전개는 좋았지만 피니시나 여운이 기대보다 빠르게 끊긴 인상입니다.`,
        };
      case 'sweet-too-forward-generic':
        return {
          id: choice.id,
          label: '단맛이 먼저 느껴졌어요',
          affectedTastes: [...choice.affectedTastes],
          ingredientPairing,
          recommendation: `${dish.title}에서는 단맛의 앞선 인상을 조금만 줄이고 정리감을 보강하면 마무리가 더 좋아질 수 있어요.`,
          reason: `${dish.title}에서 단맛이 먼저 인지되며 다른 디테일보다 앞에 서는 느낌이 있었습니다.`,
        };
      case 'freshness-needed-generic':
      default:
        return {
          id: choice.id,
          label: '정리감이 조금 더 있으면 좋겠어요',
          affectedTastes: [...choice.affectedTastes],
          ingredientPairing,
          recommendation: `${dish.title}의 마무리에 밝은 포인트나 정리감을 조금 더 주면 전체 코스 흐름이 더 선명해질 수 있어요.`,
          reason: `${dish.title}의 중심 인상은 좋지만 끝맛을 정리해줄 산뜻한 포인트가 조금 더 있으면 좋겠다는 반응입니다.`,
        };
    }
  });
}

function buildGenericChefIntent(
  dishTitle: string,
  coursePosition: string | null | undefined,
  ingredients: readonly string[],
) {
  const ingredientSummary = ingredients.length > 0 ? ingredients.slice(0, 3).join(', ') : dishTitle;
  const courseLabel = formatCoursePositionLabel(coursePosition);
  return `${courseLabel} 코스에서 ${ingredientSummary}의 인상을 자연스럽게 전달하는 방향으로 구성된 메뉴입니다.`;
}

function buildFeedbackScenarioFromReservationDishes(params: {
  completedAt: string;
  courseName: string;
  dishes: ReservationDishQueryRow[];
  reservationId: number;
  restaurant: string;
}): DiningFeedbackScenario | null {
  if (params.dishes.length === 0) {
    return null;
  }

  const dishes = [...params.dishes]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map<DiningDishMetadata>((dish) => ({
      id: `reservation-dish-${dish.id}`,
      title: localizeDishTitle(dish.title),
      subtitle: buildLocalizedSubtitle(
        localizeDishTitle(dish.title),
        dish.subtitle,
        (dish.ingredients ?? []).map((ingredient) => localizeDishTitle(ingredient)),
      ),
      courseLabel: formatCoursePositionLabel(dish.course_position),
      chefIntent:
        dish.chef_intent?.trim() ||
        buildGenericChefIntent(dish.title, dish.course_position, dish.ingredients ?? []),
      ingredients: (dish.ingredients ?? []).map((ingredient) => localizeDishTitle(ingredient)),
      techniques: dish.techniques ?? [],
      flavorNotes: dish.flavor_notes ?? [],
      feedbackChoices: buildGenericFeedbackChoices({
        coursePosition: dish.course_position,
        ingredients: (dish.ingredients ?? []).map((ingredient) => localizeDishTitle(ingredient)),
        subtitle: dish.subtitle,
        title: localizeDishTitle(dish.title),
      }),
    }));

  return {
    reservationId: params.reservationId,
    restaurant: params.restaurant,
    courseName: params.courseName,
    completedAt: params.completedAt,
    postDiningPrompt:
      '어떤 코스가 잘 맞았고 어디서 마무리감이 달라졌는지 남겨주시면, 다음 다이닝과 셰프 가이드를 더 정확하게 맞출 수 있어요.',
    dishes,
  };
}

function findReservationCatalogMatch(row: ReservationQueryRow) {
  const mockId = parseMockReservationExternalRef(row.external_ref);

  if (mockId !== null) {
    return getReservationCatalogEntry(mockId);
  }

  const restaurantName = takeSingleRelation(row.restaurants)?.name ?? null;
  const chefName = takeSingleRelation(row.chefs)?.display_name ?? null;

  return (
    RESERVATION_CATALOG.find(
      (reservation) =>
        reservation.restaurant === restaurantName &&
        reservation.chef === chefName &&
        reservation.course === (row.course_name ?? reservation.course),
    ) ?? null
  );
}

function findKnownChefForRestaurant(restaurantName: string) {
  return (
    RESERVATION_CATALOG.find((reservation) => reservation.restaurant === restaurantName)?.chef ??
    null
  );
}

function isContentSeedExternalRef(externalRef: string | null | undefined) {
  return externalRef?.startsWith('content-seed:') ?? false;
}

function mapReservationRowToRecord(row: ReservationQueryRow): ReservationRecord {
  const fallbackReservation = findReservationCatalogMatch(row);
  const { date, time } = formatReservationDateParts(row.reservation_at);
  const status = mapReservationStatusFromDb(row.status);
  const rawRestaurantName = takeSingleRelation(row.restaurants)?.name ?? null;
  const chefRelation = takeSingleRelation(row.chefs);
  const rawChefName = chefRelation?.display_name ?? null;
  const rawChefAvatarPath = chefRelation?.avatar_path ?? null;
  const restaurantName =
    rawRestaurantName !== null
      ? localizeRestaurantName(rawRestaurantName)
      : fallbackReservation?.restaurant ?? '예약된 레스토랑';
  const chefName =
    rawChefName !== null
      ? localizeChefName(rawChefName)
      : fallbackReservation?.chef ?? findKnownChefForRestaurant(restaurantName) ?? '셰프 미정';

  return {
    id:
      fallbackReservation?.id ??
      parseMockReservationExternalRef(row.external_ref) ??
      hashTextToNumericId(row.id),
    restaurant: restaurantName,
    chef: chefName,
    chefImage:
      resolvePublicMediaPath(rawChefAvatarPath) ??
      getChefImageByName(chefName) ??
      fallbackReservation?.chefImage,
    date,
    time,
    externalRef: row.external_ref,
    guests: row.party_size,
    status,
    course: row.course_name ?? fallbackReservation?.course ?? '테이스팅 코스',
    matchRate: fallbackReservation?.matchRate ?? 70,
    remoteId: row.id,
    tcsStatus: fallbackReservation?.tcsStatus ?? buildGenericTcsStatus(status),
    adjustments: fallbackReservation?.adjustments ?? [],
    diningPromise:
      fallbackReservation?.diningPromise ??
      buildGenericDiningPromise(restaurantName, row.course_name ?? '테이스팅 코스', status),
    guestUnderstanding:
      fallbackReservation?.guestUnderstanding ??
      buildGenericGuestUnderstanding(row.course_name ?? '테이스팅 코스', status),
    timeline: fallbackReservation?.timeline ?? buildGenericReservationTimeline(status),
  };
}

async function fetchReservationRows(userId: string) {
  if (!supabase) {
    return [] as ReservationQueryRow[];
  }

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      external_ref,
      reservation_at,
      party_size,
      course_name,
      status,
      restaurants(name),
      chefs(display_name, avatar_path)
    `)
    .eq('user_id', userId)
    .order('reservation_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReservationQueryRow[];
}

async function fetchReservationDishRows(reservationIds: string[]) {
  if (!supabase || reservationIds.length === 0) {
    return [] as ReservationDishQueryRow[];
  }

  const { data, error } = await supabase
    .from('reservation_dishes')
    .select(
      'id, reservation_id, sort_order, course_position, title, subtitle, chef_intent, ingredients, techniques, flavor_notes',
    )
    .in('reservation_id', reservationIds)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ReservationDishQueryRow[];
}

function buildReservationSeedCandidates(contentCatalog: RestaurantContentCatalog) {
  const groupedCandidates = new Map<string, ReservationSeedCandidate>();

  for (const dish of contentCatalog.dishes) {
    const existing = groupedCandidates.get(dish.restaurantSlug);

    if (existing) {
      existing.dishes.push(dish);
      if (!existing.seasonLabel && dish.seasonLabel) {
        existing.seasonLabel = dish.seasonLabel;
      }
      continue;
    }

    groupedCandidates.set(dish.restaurantSlug, {
      chef: dish.chef,
      dishes: [dish],
      restaurant: dish.restaurant,
      restaurantSlug: dish.restaurantSlug,
      seasonLabel: dish.seasonLabel,
    });
  }

  return [...groupedCandidates.values()]
    .map((candidate) => ({
      ...candidate,
      dishes: candidate.dishes
        .slice()
        .sort(
          (left, right) =>
            getCoursePositionOrder(left.coursePosition) -
            getCoursePositionOrder(right.coursePosition),
        )
        .slice(0, 6),
    }))
    .sort((left, right) => {
      const rightScore = getSeasonRecencyScore(right.seasonLabel);
      const leftScore = getSeasonRecencyScore(left.seasonLabel);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.dishes.length - left.dishes.length;
    });
}

function buildSeedExternalRef(userId: string, candidate: ReservationSeedCandidate, status: ReservationStatus) {
  return `content-seed:${userId}:${candidate.restaurantSlug}:${status}`;
}

async function syncReservationCatalogToSupabase(userId: string) {
  const contentCatalog = await hydrateRestaurantContentCatalog();
  const candidates = buildReservationSeedCandidates(contentCatalog).slice(0, 4);

  if (candidates.length === 0) {
    for (const reservation of RESERVATION_CATALOG) {
      await getOrCreateReservationId(userId, reservation);
    }
    return;
  }

  for (const [index, candidate] of candidates.entries()) {
    const schedule = buildReservationSeedSchedule(index, candidate.seasonLabel);
    const reservationInput: ReservationPersistenceInput = {
      id: 9000 + index,
      restaurant: candidate.restaurant,
      chef: candidate.chef,
      date: formatReservationDateParts(schedule.dateIso).date,
      time: formatReservationDateParts(schedule.dateIso).time,
      guests: index === 2 ? 4 : 2,
      course: buildCourseNameFromSeasonLabel(candidate.seasonLabel),
      status: schedule.status,
      externalRef: buildSeedExternalRef(userId, candidate, schedule.status),
    };

    const reservationId = await getOrCreateReservationId(userId, reservationInput);

    if (!reservationId) {
      continue;
    }

    const reservationDishes = candidate.dishes.map<DiningDishMetadata>((dish) => ({
      id: dish.id,
      title: dish.title,
      subtitle: dish.subtitle,
      courseLabel: dish.courseLabel,
      chefIntent: buildGenericChefIntent(dish.title, dish.coursePosition, dish.ingredients),
      ingredients: dish.ingredients,
      techniques: [],
      flavorNotes: [],
      feedbackChoices: buildGenericFeedbackChoices({
        coursePosition: dish.coursePosition,
        ingredients: dish.ingredients,
        subtitle: dish.subtitle,
        title: dish.title,
      }),
    }));

    await upsertReservationDishes(reservationId, reservationDishes);
  }
}

async function hydrateFeedbackDrafts(
  reservationIdMap: Map<string, number>,
  feedbackScenariosByReservationId: Record<number, DiningFeedbackScenario>,
): Promise<Record<number, DiningFeedbackDraft>> {
  if (!supabase || reservationIdMap.size === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('feedback_submissions')
    .select(`
      reservation_id,
      overall_rating,
      overall_comment,
      return_intent,
      feedback_items(
        rating,
        selected_tag_ids,
        reservation_dishes(sort_order)
      )
    `)
    .in('reservation_id', Array.from(reservationIdMap.keys()));

  if (error) {
    console.warn('Failed to hydrate feedback drafts from Supabase.', error);
    return {};
  }

  const drafts: Record<number, DiningFeedbackDraft> = {};

  for (const row of (data ?? []) as FeedbackSubmissionQueryRow[]) {
    const localReservationId = reservationIdMap.get(row.reservation_id);

    if (!localReservationId) {
      continue;
    }

    const scenario = feedbackScenariosByReservationId[localReservationId] ?? null;
    if (!scenario) {
      continue;
    }

    const draft = createDiningFeedbackDraft(scenario);
    draft.overallRating = row.overall_rating;
    draft.overallComment = row.overall_comment ?? '';
    draft.returnIntent = row.return_intent;

    for (const feedbackItem of row.feedback_items ?? []) {
      const reservationDish = takeSingleRelation(feedbackItem.reservation_dishes);
      const scenarioDish = scenario.dishes[reservationDish?.sort_order ?? -1];

      if (!scenarioDish) {
        continue;
      }

      const selectedTagId = Array.isArray(feedbackItem.selected_tag_ids)
        ? feedbackItem.selected_tag_ids.find((value): value is string => typeof value === 'string') ?? null
        : null;

      draft.dishResponses[scenarioDish.id] = {
        rating: feedbackItem.rating,
        selectedChoiceId: selectedTagId,
      };
    }

    drafts[localReservationId] = draft;
  }

  return drafts;
}

function buildHydratedFeedbackScenarioMap(params: {
  reservationDishRows: ReservationDishQueryRow[];
  reservationIdMap: Map<string, number>;
  reservations: ReservationRecord[];
}) {
  const dishRowsByReservationId = new Map<string, ReservationDishQueryRow[]>();

  for (const row of params.reservationDishRows) {
    const currentRows = dishRowsByReservationId.get(row.reservation_id) ?? [];
    currentRows.push(row);
    dishRowsByReservationId.set(row.reservation_id, currentRows);
  }

  const feedbackScenariosByReservationId: Record<number, DiningFeedbackScenario> = {};

  for (const reservation of params.reservations) {
    const remoteId = reservation.remoteId;

    if (!remoteId) {
      const fallbackScenario = getDiningFeedbackScenario(reservation.id);
      if (fallbackScenario) {
        feedbackScenariosByReservationId[reservation.id] = fallbackScenario;
      }
      continue;
    }

    const reservationDishes = dishRowsByReservationId.get(remoteId) ?? [];
    const fallbackScenario = getDiningFeedbackScenario(reservation.id);
    const generatedScenario = buildFeedbackScenarioFromReservationDishes({
      completedAt: parseReservationDateTime(reservation.date, reservation.time),
      courseName: reservation.course,
      dishes: reservationDishes,
      reservationId: reservation.id,
      restaurant: reservation.restaurant,
    });

    if (generatedScenario) {
      feedbackScenariosByReservationId[reservation.id] = generatedScenario;
    } else if (fallbackScenario) {
      feedbackScenariosByReservationId[reservation.id] = fallbackScenario;
    }
  }

  return feedbackScenariosByReservationId;
}

function mapReservationStatus(status: ReservationPersistenceInput['status']) {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'ready':
      return 'ready';
    case 'preparing':
      return 'preparing';
    case 'upcoming':
    default:
      return 'confirmed';
  }
}

function mapCoursePosition(courseLabel: string) {
  const normalized = courseLabel.trim().toLowerCase();

  if (normalized.includes('amuse') || normalized.includes('아뮤즈') || normalized.includes('스낵')) {
    return 'amuse';
  }

  if (normalized.includes('fish') || normalized.includes('생선')) {
    return 'fish';
  }

  if (normalized.includes('main') || normalized.includes('메인')) {
    return 'main';
  }

  if (
    normalized.includes('dessert') ||
    normalized.includes('디저트') ||
    normalized.includes('다과')
  ) {
    return 'dessert';
  }

  if (normalized.includes('starter') || normalized.includes('스타터')) {
    return 'starter';
  }

  return 'other';
}

function parseReservationDateTime(date: string, time: string) {
  const [year, month, day] = date.split('.');
  const numericTime = time.replace(/[^\d:]/g, '');
  const [rawHours, rawMinutes] = numericTime.split(':');
  let hours = Number.parseInt(rawHours ?? '0', 10);
  const minutes = Number.parseInt(rawMinutes ?? '0', 10);
  const isDinner = /저녁|오후|pm/i.test(time);

  if (isDinner && hours < 12) {
    hours += 12;
  }

  if (!isDinner && /오전|am/i.test(time) && hours === 12) {
    hours = 0;
  }

  const dateIso = `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+09:00`;
  return new Date(dateIso).toISOString();
}

function buildRestaurantSlug(restaurantName: string) {
  return restaurantName.trim().toLowerCase().replace(/\s+/g, '-');
}

function toTasteMeasurementResults(rows: Array<{ taste_code: string; value_mm: number }>) {
  const results: TasteMeasurementResults = createInitialTasteMeasurementResults();

  for (const row of rows) {
    if (TASTE_IDS.includes(row.taste_code as TasteId)) {
      results[row.taste_code as TasteId] = row.value_mm;
    }
  }

  return results;
}

async function getAuthenticatedUserId() {
  const session = await ensureSupabaseSession();
  return session?.user.id ?? null;
}

async function getOrCreateRestaurantId(reservation: ReservationPersistenceInput) {
  if (!supabase) {
    return null;
  }

  const slug = buildRestaurantSlug(reservation.restaurant);
  const { data: existingRestaurant, error: existingRestaurantError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existingRestaurantError) {
    throw existingRestaurantError;
  }

  if (existingRestaurant?.id) {
    return existingRestaurant.id;
  }

  const { data: createdRestaurant, error: createdRestaurantError } = await supabase
    .from('restaurants')
    .insert({
      name: reservation.restaurant,
      slug,
    })
    .select('id')
    .single();

  if (createdRestaurantError) {
    throw createdRestaurantError;
  }

  return createdRestaurant.id;
}

async function getOrCreateChefId(restaurantId: string, chefName: string) {
  if (!supabase) {
    return null;
  }

  const { data: existingChef, error: existingChefError } = await supabase
    .from('chefs')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('display_name', chefName)
    .maybeSingle();

  if (existingChefError) {
    throw existingChefError;
  }

  if (existingChef?.id) {
    return existingChef.id;
  }

  const { data: createdChef, error: createdChefError } = await supabase
    .from('chefs')
    .insert({
      restaurant_id: restaurantId,
      display_name: chefName,
    })
    .select('id')
    .single();

  if (createdChefError) {
    throw createdChefError;
  }

  return createdChef.id;
}

async function getOrCreateReservationId(userId: string, reservation: ReservationPersistenceInput) {
  if (!supabase) {
    return null;
  }

  if (reservation.remoteId) {
    return reservation.remoteId;
  }

  const restaurantId = await getOrCreateRestaurantId(reservation);
  const chefId = restaurantId ? await getOrCreateChefId(restaurantId, reservation.chef) : null;
  const externalRef = reservation.externalRef ?? buildMockReservationExternalRef(reservation.id);

  const { data: reservationRow, error: reservationError } = await supabase
    .from('reservations')
    .upsert(
      {
        user_id: userId,
        restaurant_id: restaurantId,
        chef_id: chefId,
        external_ref: externalRef,
        reservation_at: parseReservationDateTime(reservation.date, reservation.time),
        party_size: reservation.guests,
        course_name: reservation.course,
        status: mapReservationStatus(reservation.status),
      },
      {
        onConflict: 'external_ref',
      },
    )
    .select('id')
    .single();

  if (reservationError) {
    throw reservationError;
  }

  return reservationRow.id;
}

async function upsertReservationDishes(reservationId: string, dishes: readonly DiningDishMetadata[]) {
  if (!supabase) {
    return new Map<string, string>();
  }

  const rows = dishes.map((dish, index) => ({
    reservation_id: reservationId,
    course_position: mapCoursePosition(dish.courseLabel),
    title: dish.title,
    subtitle: dish.subtitle,
    chef_intent: dish.chefIntent,
    ingredients: [...dish.ingredients],
    techniques: [...dish.techniques],
    flavor_notes: [...dish.flavorNotes],
    sort_order: index,
  }));

  const { data, error } = await supabase
    .from('reservation_dishes')
    .upsert(rows, {
      onConflict: 'reservation_id,sort_order',
    })
    .select('id, sort_order');

  if (error) {
    throw error;
  }

  const idMap = new Map<string, string>();

  for (const row of data ?? []) {
    const dish = dishes[row.sort_order];
    if (dish) {
      idMap.set(dish.id, row.id);
    }
  }

  return idMap;
}

export async function hydrateReservationPageData(): Promise<HydratedReservationPageData> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      reservations: RESERVATION_CATALOG,
      feedbackByReservationId: {},
      feedbackScenariosByReservationId: RESERVATION_CATALOG.reduce<Record<number, DiningFeedbackScenario>>(
        (scenarios, reservation) => {
          const scenario = getDiningFeedbackScenario(reservation.id);
          if (scenario) {
            scenarios[reservation.id] = scenario;
          }
          return scenarios;
        },
        {},
      ),
    };
  }

  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        reservations: [],
        feedbackByReservationId: {},
        feedbackScenariosByReservationId: {},
      };
    }

    let rows = await fetchReservationRows(userId);

    const shouldSeedContentReservations =
      rows.length === 0 ||
      rows.every((row) => parseMockReservationExternalRef(row.external_ref) !== null);

    if (shouldSeedContentReservations) {
      await syncReservationCatalogToSupabase(userId);
      rows = await fetchReservationRows(userId);
    }

    const hasContentSeedReservations = rows.some(
      (row) => isContentSeedExternalRef(row.external_ref),
    );
    const visibleRows = hasContentSeedReservations
      ? rows.filter((row) => parseMockReservationExternalRef(row.external_ref) === null)
      : rows;

    const reservationIdMap = new Map<string, number>();
    const reservations = visibleRows.map((row) => {
      const reservation = mapReservationRowToRecord(row);
      reservationIdMap.set(row.id, reservation.id);
      return reservation;
    });
    const reservationDishRows = await fetchReservationDishRows(visibleRows.map((row) => row.id));
    const feedbackScenariosByReservationId = buildHydratedFeedbackScenarioMap({
      reservationDishRows,
      reservationIdMap,
      reservations,
    });
    const feedbackByReservationId = await hydrateFeedbackDrafts(
      reservationIdMap,
      feedbackScenariosByReservationId,
    );

    return {
      reservations,
      feedbackByReservationId,
      feedbackScenariosByReservationId,
    };
  } catch (error) {
    console.warn('Failed to hydrate reservation page data from Supabase.', error);

    return {
      reservations: RESERVATION_CATALOG,
      feedbackByReservationId: {},
      feedbackScenariosByReservationId: RESERVATION_CATALOG.reduce<Record<number, DiningFeedbackScenario>>(
        (scenarios, reservation) => {
          const scenario = getDiningFeedbackScenario(reservation.id);
          if (scenario) {
            scenarios[reservation.id] = scenario;
          }
          return scenarios;
        },
        {},
      ),
    };
  }
}

export async function hydrateLatestMeasurementSnapshot() {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data: latestSession, error: latestSessionError } = await supabase
    .from('measurement_sessions')
    .select('id, completed_at, source')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSessionError) {
    console.warn('Failed to hydrate measurement session from Supabase.', latestSessionError);
    return null;
  }

  if (!latestSession?.id) {
    return null;
  }

  const { data: resultRows, error: resultRowsError } = await supabase
    .from('measurement_results')
    .select('taste_code, value_mm')
    .eq('measurement_session_id', latestSession.id);

  if (resultRowsError) {
    console.warn('Failed to hydrate measurement results from Supabase.', resultRowsError);
    return null;
  }

  return {
    measuredAt: latestSession.completed_at ?? new Date().toISOString(),
    results: toTasteMeasurementResults(resultRows ?? []),
    source: latestSession.source === 'quick_calibration' ? 'broad-starter' : 'measured',
  } satisfies TasteMeasurementSnapshot;
}

export async function hydrateRecentMeasurementSnapshots(limit = 6) {
  if (!supabase || !isSupabaseConfigured) {
    return [] as TasteMeasurementSnapshot[];
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return [] as TasteMeasurementSnapshot[];
  }

  const { data: sessionRows, error: sessionError } = await supabase
    .from('measurement_sessions')
    .select('id, completed_at, source')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (sessionError) {
    console.warn('Failed to hydrate recent measurement sessions from Supabase.', sessionError);
    return [] as TasteMeasurementSnapshot[];
  }

  const sessions = ((sessionRows ?? []) as MeasurementSessionQueryRow[]).filter(
    (session): session is MeasurementSessionQueryRow => Boolean(session.id),
  );

  if (sessions.length === 0) {
    return [] as TasteMeasurementSnapshot[];
  }

  const { data: resultRows, error: resultRowsError } = await supabase
    .from('measurement_results')
    .select('measurement_session_id, taste_code, value_mm')
    .in(
      'measurement_session_id',
      sessions.map((session) => session.id),
    );

  if (resultRowsError) {
    console.warn('Failed to hydrate recent measurement results from Supabase.', resultRowsError);
    return [] as TasteMeasurementSnapshot[];
  }

  const resultsBySessionId = new Map<string, Array<{ taste_code: string; value_mm: number }>>();

  for (const row of resultRows ?? []) {
    const currentRows = resultsBySessionId.get(row.measurement_session_id) ?? [];
    currentRows.push({
      taste_code: row.taste_code,
      value_mm: row.value_mm,
    });
    resultsBySessionId.set(row.measurement_session_id, currentRows);
  }

  return [...sessions]
    .reverse()
    .map((session) => ({
      measuredAt: session.completed_at ?? new Date().toISOString(),
      results: toTasteMeasurementResults(resultsBySessionId.get(session.id) ?? []),
      source: session.source === 'quick_calibration' ? 'broad-starter' : 'measured',
    }));
}

export async function hydrateUserLearnedCalibration(): Promise<UserLearnedCalibration | null> {
  if (!supabase || !isSupabaseConfigured) {
    return null;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const { data: deltaRow, error: deltaError } = await supabase
    .from('user_learned_deltas')
    .select(
      'perception_taste_delta, perception_perceptual_delta, preference_taste_delta, preference_perceptual_delta, support_count, hypothesis_count, updated_at',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (deltaError) {
    console.warn('Failed to hydrate learned taste calibration from Supabase.', deltaError);
    return null;
  }

  if (!deltaRow) {
    return createEmptyUserLearnedCalibration();
  }

  return {
    perceptionTasteDelta: readNumericRecord(TASTE_IDS, deltaRow.perception_taste_delta) as SignedTasteVector,
    perceptionPerceptualDelta: readNumericRecord(
      PERCEPTUAL_AXES,
      deltaRow.perception_perceptual_delta,
    ) as SignedPerceptualVector,
    preferenceTasteDelta: readNumericRecord(TASTE_IDS, deltaRow.preference_taste_delta) as SignedTasteVector,
    preferencePerceptualDelta: readNumericRecord(
      PERCEPTUAL_AXES,
      deltaRow.preference_perceptual_delta,
    ) as SignedPerceptualVector,
    supportCount: Number(deltaRow.support_count ?? 0),
    hypothesisCount: Number(deltaRow.hypothesis_count ?? 0),
    updatedAt: deltaRow.updated_at ?? undefined,
  };
}

export async function hydrateRestaurantContentCatalog(): Promise<RestaurantContentCatalog> {
  if (!supabase || !isSupabaseConfigured) {
    return { chefs: [], dishes: [] };
  }

  const [chefResponse, dishResponse] = await Promise.all([
    supabase
      .from('chefs')
      .select('id, display_name, avatar_path, restaurants(name, slug)')
      .eq('is_active', true),
    supabase
      .from('dish_entities')
      .select(
        'id, public_title, public_subtitle, season_label, course_position, status, restaurants(name, slug), dish_observed_facts(fact_type, value_text, value_json), dish_inference_profiles(confidence, taste_vector, perceptual_vector)',
      )
      .eq('status', 'active')
      .order('season_label', { ascending: false })
      .limit(500),
  ]);

  if (chefResponse.error) {
    console.warn('Failed to hydrate restaurant chefs from Supabase.', chefResponse.error);
    return { chefs: [], dishes: [] };
  }

  if (dishResponse.error) {
    console.warn('Failed to hydrate restaurant dishes from Supabase.', dishResponse.error);
    return { chefs: [], dishes: [] };
  }

  const chefRows = (chefResponse.data ?? []) as ContentChefQueryRow[];
  const dishRows = (dishResponse.data ?? []) as ContentDishQueryRow[];
  const primaryChefByRestaurantSlug = new Map<
    string,
    {
      avatarPath: string | null;
      id: string | null;
      name: string;
    }
  >();

  for (const row of chefRows) {
    const restaurantRelation = takeSingleRelation(row.restaurants);
    const restaurantSlug = restaurantRelation?.slug ?? null;
    const localizedChefName = localizeChefName(row.display_name);

    if (!restaurantSlug || primaryChefByRestaurantSlug.has(restaurantSlug)) {
      continue;
    }

    primaryChefByRestaurantSlug.set(restaurantSlug, {
      avatarPath: row.avatar_path,
      id: row.id ?? null,
      name: localizedChefName,
    });
  }

  const dishes = dishRows
    .map<RestaurantContentDish | null>((row) => {
      const restaurantRelation = takeSingleRelation(row.restaurants);
      const restaurantSlug = restaurantRelation?.slug ?? 'unknown-restaurant';
      const restaurantName = localizeRestaurantName(restaurantRelation?.name);
      const chef = primaryChefByRestaurantSlug.get(restaurantSlug) ?? {
        avatarPath: null,
        id: null,
        name: '셰프 미정',
      };
      const title = localizeDishTitle(row.public_title);

      if (!title) {
        return null;
      }

      const ingredients = extractObservedFactValues(row.dish_observed_facts, 'ingredients');
      const profile = takeSingleRelation(row.dish_inference_profiles);
      const tasteVector = readNumericRecord(TASTE_IDS, profile?.taste_vector);
      const perceptualVector = readNumericRecord(
        PERCEPTUAL_AXES,
        profile?.perceptual_vector,
      ) as PerceptualVector;

      return {
        id: row.id,
        title,
        subtitle: buildLocalizedSubtitle(title, row.public_subtitle, ingredients),
        restaurant: restaurantName,
        restaurantSlug,
        chef: chef.name,
        chefAvatarPath: chef.avatarPath,
        chefId: chef.id,
        ingredients,
        confidence: Number(profile?.confidence ?? 0.5),
        coursePosition: row.course_position ?? 'other',
        courseLabel: formatCoursePositionLabel(row.course_position),
        seasonLabel: row.season_label,
        tasteVector,
        perceptualVector,
        dominantTaste: getDominantTasteFromVector(profile?.taste_vector),
      };
    })
    .filter((dish): dish is RestaurantContentDish => Boolean(dish));

  const dishesByRestaurantSlug = new Map<string, RestaurantContentDish[]>();

  for (const dish of dishes) {
    const currentDishes = dishesByRestaurantSlug.get(dish.restaurantSlug) ?? [];
    currentDishes.push(dish);
    dishesByRestaurantSlug.set(dish.restaurantSlug, currentDishes);
  }

  const restaurantScores = new Map<
    string,
    {
      avgConfidence: number;
      bestConfidence: number;
      dishCount: number;
      recencyScore: number;
    }
  >();

  for (const [restaurantSlug, restaurantDishes] of dishesByRestaurantSlug.entries()) {
    const dishCount = restaurantDishes.length;
    const totalConfidence = restaurantDishes.reduce(
      (sum, dish) => sum + dish.confidence,
      0,
    );
    const bestConfidence = restaurantDishes.reduce(
      (best, dish) => Math.max(best, dish.confidence),
      0,
    );
    const recencyScore = restaurantDishes.reduce(
      (best, dish) => Math.max(best, getSeasonRecencyScore(dish.seasonLabel)),
      0,
    );

    restaurantScores.set(restaurantSlug, {
      avgConfidence: dishCount > 0 ? totalConfidence / dishCount : 0,
      bestConfidence,
      dishCount,
      recencyScore,
    });
  }

  const sortedDishes = dishes.slice().sort((left, right) => {
    const rightRestaurantScore = restaurantScores.get(right.restaurantSlug);
    const leftRestaurantScore = restaurantScores.get(left.restaurantSlug);
    const bestConfidenceDelta =
      (rightRestaurantScore?.bestConfidence ?? right.confidence) -
      (leftRestaurantScore?.bestConfidence ?? left.confidence);

    if (bestConfidenceDelta !== 0) {
      return bestConfidenceDelta;
    }

    const recencyDelta =
      (rightRestaurantScore?.recencyScore ?? getSeasonRecencyScore(right.seasonLabel)) -
      (leftRestaurantScore?.recencyScore ?? getSeasonRecencyScore(left.seasonLabel));

    if (recencyDelta !== 0) {
      return recencyDelta;
    }

    const confidenceDelta = right.confidence - left.confidence;
    if (confidenceDelta !== 0) {
      return confidenceDelta;
    }

    return left.title.localeCompare(right.title, 'ko');
  });

  const signatureDishTitlesByRestaurantSlug = new Map<string, string[]>();
  const dominantTasteByRestaurantSlug = new Map<string, TasteId>();

  for (const dish of sortedDishes) {
    const existingTitles = signatureDishTitlesByRestaurantSlug.get(dish.restaurantSlug) ?? [];
    if (existingTitles.length < 2 && !existingTitles.includes(dish.title)) {
      existingTitles.push(dish.title);
      signatureDishTitlesByRestaurantSlug.set(dish.restaurantSlug, existingTitles);
    }

    if (!dominantTasteByRestaurantSlug.has(dish.restaurantSlug)) {
      dominantTasteByRestaurantSlug.set(dish.restaurantSlug, dish.dominantTaste);
    }
  }

  const seenChefKeys = new Set<string>();
  const chefs = chefRows
    .map<RestaurantContentChef | null>((row) => {
      const restaurantRelation = takeSingleRelation(row.restaurants);
      const restaurantSlug = restaurantRelation?.slug ?? null;
      if (!restaurantSlug) {
        return null;
      }

      const signatureDishTitles = signatureDishTitlesByRestaurantSlug.get(restaurantSlug) ?? [];
      if (signatureDishTitles.length === 0) {
        return null;
      }

      const restaurant = localizeRestaurantName(restaurantRelation?.name);
      const name = localizeChefName(row.display_name);
      const key = `${restaurantSlug}:${name}`;

      if (seenChefKeys.has(key)) {
        return null;
      }
      seenChefKeys.add(key);

      return {
        avatarPath: row.avatar_path,
        id: row.id,
        name,
        restaurant,
        restaurantSlug,
        signatureDishTitles,
        taste: dominantTasteByRestaurantSlug.get(restaurantSlug) ?? 'umami',
      };
    })
    .filter((chef): chef is RestaurantContentChef => Boolean(chef))
    .sort((left, right) => {
      const rightScore = restaurantScores.get(right.restaurantSlug);
      const leftScore = restaurantScores.get(left.restaurantSlug);
      const bestConfidenceDelta =
        (rightScore?.bestConfidence ?? 0) - (leftScore?.bestConfidence ?? 0);

      if (bestConfidenceDelta !== 0) {
        return bestConfidenceDelta;
      }

      const dishCountDelta = (rightScore?.dishCount ?? 0) - (leftScore?.dishCount ?? 0);
      if (dishCountDelta !== 0) {
        return dishCountDelta;
      }

      return left.restaurant.localeCompare(right.restaurant, 'ko');
    });

  return {
    chefs,
    dishes: sortedDishes,
  };
}

export async function persistTasteMeasurementSnapshot(
  snapshot: TasteMeasurementSnapshot,
  source: MeasurementSource,
  options: MeasurementPersistenceOptions = {},
) {
  if (!supabase || !isSupabaseConfigured) {
    return false;
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return false;
  }

  const confidenceScore = source === 'tastick' ? 0.82 : source === 'quick_calibration' ? 0.68 : 0.55;

  const { data: sessionRow, error: sessionError } = await supabase
    .from('measurement_sessions')
    .insert({
      user_id: userId,
      source,
      status: 'completed',
      started_at: snapshot.measuredAt,
      completed_at: snapshot.measuredAt,
      confidence_score: confidenceScore,
      raw_payload: {
        persisted_from: 'taste-buddy-app',
        ...(options.rawPayload ?? {}),
      },
    })
    .select('id')
    .single();

  if (sessionError) {
    console.warn('Failed to persist measurement session.', sessionError);
    return false;
  }

  const resultRows = TASTE_IDS.map((tasteId) => {
    const valueMm = snapshot.results[tasteId] ?? TASTE_MEASUREMENT_AVERAGES[tasteId];

    return {
      measurement_session_id: sessionRow.id,
      taste_code: tasteId,
      value_mm: valueMm,
      score: Math.round(valueMm * 10),
      reference_avg_mm: TASTE_MEASUREMENT_AVERAGES[tasteId],
      delta_mm: Number((valueMm - TASTE_MEASUREMENT_AVERAGES[tasteId]).toFixed(2)),
    };
  });

  const { error: resultError } = await supabase.from('measurement_results').insert(resultRows);

  if (resultError) {
    console.warn('Failed to persist measurement results.', resultError);
    return false;
  }

  return true;
}

export async function submitDiningFeedbackToSupabase(input: {
  draft: DiningFeedbackDraft;
  reservation: ReservationPersistenceInput;
  scenario: DiningFeedbackScenario;
}): Promise<FeedbackSubmissionResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      persisted: false,
      reservationSignalReasons: [],
    };
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      persisted: false,
      reservationSignalReasons: [],
    };
  }

  const reservationId = await getOrCreateReservationId(userId, input.reservation);
  const reservationDishIds = await upsertReservationDishes(reservationId, input.scenario.dishes);

  const { data: feedbackSubmission, error: feedbackSubmissionError } = await supabase
    .from('feedback_submissions')
    .upsert(
      {
        reservation_id: reservationId,
        user_id: userId,
        overall_rating: input.draft.overallRating,
        overall_comment: input.draft.overallComment,
        return_intent: input.draft.returnIntent,
      },
      {
        onConflict: 'reservation_id',
      },
    )
    .select('id')
    .single();

  if (feedbackSubmissionError) {
    throw feedbackSubmissionError;
  }

  const feedbackObservations = [];

  for (const dish of input.scenario.dishes) {
    const response = input.draft.dishResponses[dish.id];
    const reservationDishId = reservationDishIds.get(dish.id);

    if (!response || !reservationDishId || !hasDiningDishFeedbackResponse(response)) {
      continue;
    }

    const selectedChoice = dish.feedbackChoices.find((choice) => choice.id === response.selectedChoiceId);
    const parsedReaction = parseFeedbackSelections(
      selectedChoice ? [{ tagId: selectedChoice.id }] : [],
    );

    const { data: feedbackItem, error: feedbackItemError } = await supabase
      .from('feedback_items')
      .upsert(
        {
          feedback_submission_id: feedbackSubmission.id,
          reservation_dish_id: reservationDishId,
          rating: response.rating,
          selected_tag_ids: selectedChoice ? [selectedChoice.id] : [],
          selected_reason: selectedChoice?.label ?? null,
          comment: selectedChoice?.reason ?? null,
        },
        {
          onConflict: 'feedback_submission_id,reservation_dish_id',
        },
      )
      .select('id')
      .single();

    if (feedbackItemError) {
      throw feedbackItemError;
    }

    const { error: parseError } = await supabase
      .from('feedback_parses')
      .upsert(
        {
          feedback_item_id: feedbackItem.id,
          perception_taste_delta: parsedReaction.perceptionTasteDelta,
          perception_perceptual_delta: parsedReaction.perceptionPerceptualDelta,
          preference_taste_delta: parsedReaction.preferenceTasteDelta,
          preference_perceptual_delta: parsedReaction.preferencePerceptualDelta,
          confidence: parsedReaction.confidence,
          rationale: parsedReaction.rationale,
        },
        {
          onConflict: 'feedback_item_id',
        },
      );

    if (parseError) {
      throw parseError;
    }

    feedbackObservations.push({
      rating: response.rating,
      daysSinceDining: Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(input.scenario.completedAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
      parsedReaction,
      sourceConfidence: 1,
    });
  }

  const reservationSignal = computeReservationLearningSignal(feedbackObservations);

  const { data: existingDeltaRow, error: existingDeltaError } = await supabase
    .from('user_learned_deltas')
    .select(
      'perception_taste_delta, perception_perceptual_delta, preference_taste_delta, preference_perceptual_delta, support_count, hypothesis_count',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (existingDeltaError) {
    throw existingDeltaError;
  }

  const currentCalibration = existingDeltaRow
    ? {
        perceptionTasteDelta: existingDeltaRow.perception_taste_delta ?? createEmptyUserLearnedCalibration().perceptionTasteDelta,
        perceptionPerceptualDelta:
          existingDeltaRow.perception_perceptual_delta ?? createEmptyUserLearnedCalibration().perceptionPerceptualDelta,
        preferenceTasteDelta:
          existingDeltaRow.preference_taste_delta ?? createEmptyUserLearnedCalibration().preferenceTasteDelta,
        preferencePerceptualDelta:
          existingDeltaRow.preference_perceptual_delta ?? createEmptyUserLearnedCalibration().preferencePerceptualDelta,
        supportCount: existingDeltaRow.support_count ?? 0,
        hypothesisCount: existingDeltaRow.hypothesis_count ?? 0,
      }
    : createEmptyUserLearnedCalibration();

  const learningUpdate = updateUserLearnedCalibration(currentCalibration, reservationSignal);

  const { error: learnedDeltaError } = await supabase.from('user_learned_deltas').upsert(
    {
      user_id: userId,
      perception_taste_delta: learningUpdate.next.perceptionTasteDelta,
      perception_perceptual_delta: learningUpdate.next.perceptionPerceptualDelta,
      preference_taste_delta: learningUpdate.next.preferenceTasteDelta,
      preference_perceptual_delta: learningUpdate.next.preferencePerceptualDelta,
      support_count: learningUpdate.next.supportCount,
      hypothesis_count: learningUpdate.next.hypothesisCount,
      confidence: learningUpdate.confidence,
    },
    {
      onConflict: 'user_id',
    },
  );

  if (learnedDeltaError) {
    throw learnedDeltaError;
  }

  return {
    persisted: true,
    reservationSignalReasons: reservationSignal.reasons,
  };
}
