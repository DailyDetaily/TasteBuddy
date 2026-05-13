import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, X } from 'lucide-react';

import Home from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import DesignSystemPage from './pages/DesignSystemPage';
import DesignSystemPreviewPage from './pages/DesignSystemPreviewPage';
import FigmaWorksPreviewPage from './pages/FigmaWorksPreviewPage';
import RestaurantDetailPage, {
  createRestaurantDetailFromChefMatch,
  createRestaurantDetailFromFavoriteChef,
  createRestaurantDetailFromMenuRecommendation,
  createRestaurantDetailFromReservation,
  createRestaurantDetailFromSearchResult,
  type RestaurantDetailViewModel,
} from './pages/RestaurantDetailPage';
import ReservationPage from './pages/ReservationPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './pages/SplashScreen';
import { AuthEntryForm } from './pages/AuthEntryScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import PreferenceIntakeScreen from './pages/PreferenceIntakeScreen';
import TasteSurveyIntroScreen from './pages/TasteSurveyIntroScreen';
import TasteSurveyContextScreen from './pages/TasteSurveyContextScreen';
import TasteSurveyScreen from './pages/TasteSurveyScreen';
import TasteSurveyReviewScreen from './pages/TasteSurveyReviewScreen';
import TasteSurveyResultScreen from './pages/TasteSurveyResultScreen';
import TastickConnectScreen from './pages/TastickConnectScreen';
import TasteMeasurementScreen from './pages/TasteMeasurementScreen';
import ImproveAccuracyScreen from './pages/ImproveAccuracyScreen';
import BottomTabBar, { type TabType } from './components/BottomTabBar';
import TopAppBar from './components/TopAppBar';
import NotificationPanel from './components/NotificationPanel';
import AppMenuDrawer, { type AppMenuSupportPanel } from './components/AppMenuDrawer';
import AuthProfileDialog from './components/AuthProfileDialog';
import BottomSheetShell, {
  BottomSheetCloseButton,
  BottomSheetIconButton,
} from './components/system/BottomSheetShell';
import ProfileIdentitySheetContent from './components/ProfileIdentitySheetContent';
import ProfileEditSheetContent from './components/ProfileEditSheetContent';
import ProfileSetupSheetContent from './components/ProfileSetupSheetContent';
import SectionCard from './components/SectionCard';
import { Button } from './components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';
import {
  DEFAULT_TASTE_MEASUREMENT_RESULTS,
  createTasteMeasurementSnapshot,
  getTasteMeasurementEntries,
  type TasteMeasurementSnapshot,
} from './constants/tasteMeasurementData';
import {
  createFallbackRestaurantReadyGuidance,
  isRestaurantReadyGuidance,
  mergeRestaurantReadyGuidanceWithSnapshot,
  type RestaurantReadyGuidance,
} from './constants/quickTasteCalibrationData';
import {
  isPreferenceIntakeProfile,
  type PreferenceIntakeProfile,
} from './constants/preferenceIntakeData';
import { clearAppliedDesignTokenRuntimeState } from './lib/designTokenRuntime';
import {
  getFallbackNotifications,
  hydrateNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from './lib/notificationsSupabase';
import {
  hydrateLatestMeasurementSnapshot,
  hydrateReservationPageData,
  hydrateRestaurantContentCatalog,
  persistTasteMeasurementSnapshot,
  type RestaurantContentCatalog,
} from './lib/tasteBuddySupabase';
import HomeUnifiedSearch from './components/home/HomeUnifiedSearch';
import {
  RESERVATION_CATALOG,
  type ReservationRecord,
} from './constants/reservationCatalog';
import {
  deleteCurrentSupabaseAccount,
  ensureSupabaseSession,
  getCurrentSupabaseSession,
  isAnonymousSupabaseSession,
  isSupabaseConfigured,
  linkAnonymousSupabaseUserEmail,
  sendSupabaseEmailOtp,
  sendSupabaseMagicLink,
  signOutSupabaseSession,
  subscribeToSupabaseAuthState,
  updateSupabaseProfileIdentity,
  verifySupabaseEmailOtp,
  type SupabaseEmailOtpIntent,
} from './lib/supabase';
import { buildTasteSurveyCompatibleResult } from './lib/tasteSurveyScoring';
import { TASTE_SURVEY_ITEMS } from './constants/tasteSurveyItems';
import { TASTE_SURVEY_CONTEXT_STEPS } from './constants/tasteSurveyConfig';
import {
  createUserTasteAccentStyle,
  resolveUserTasteAccent,
} from './lib/userTasteAccent';
import { MOTION_TOKENS, TASTE_TOKENS } from './constants/designTokens';
import {
  buildTasteSurveyMeasurementRawPayload,
  hasTasteSurveyRespondentContext,
  sanitizeTasteSurveyRespondentContext,
} from './lib/tasteSurveyPersistence';
import { initializeAnalytics, trackEvent, trackPageView } from './lib/analytics';
import type {
  TasteSurveyCompatibleResult,
  TasteSurveyLikertValue,
  TasteSurveyRespondentContext,
  TasteSurveyResponse,
} from './types/tasteSurvey';
import type { Session } from '@supabase/supabase-js';

type AppState =
  | 'splash'
  | 'onboarding'
  | 'intake'
  | 'calibration'
  | 'tastick'
  | 'measurement'
  | 'improve-accuracy'
  | 'main';
type MeasurementEntryPoint = 'initial' | 'main';
type TasteSurveyFlowStep =
  | 'intro'
  | 'context'
  | 'questionsIntro'
  | 'questions'
  | 'profileIntro'
  | 'review'
  | 'result';
interface MainNavigationLocation {
  activeTab: TabType;
  selectedRestaurantDetail: RestaurantDetailViewModel | null;
}
const MAIN_APP_TOP_OFFSET = 'calc(var(--tb-safe-area-top) + var(--tb-size-top-app-bar-height))';
const MAIN_APP_BOTTOM_OFFSET =
  'calc(var(--tb-size-bottom-tab-bar-height) + var(--tb-safe-area-bottom))';
const FOCUS_VIEWPORT_BACKGROUND = '#ffffff';
const PAGE_VIEWPORT_BACKGROUND = '#f3f3f3';
const BACKGROUND_CARD_OPEN_SCALE = 0.9;
const BACKGROUND_CARD_OPEN_OFFSET = 30;
const BACKGROUND_CARD_OPEN_RADIUS = 24;
const BACKGROUND_CARD_SHADOW_Y = 20;
const BACKGROUND_CARD_SHADOW_BLUR = 60;
const BACKGROUND_CARD_SHADOW_OPACITY = 0.24;
const BACKGROUND_CARD_TRANSITION = [
  `transform ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
  `border-radius ${MOTION_TOKENS.durationMs.slowest}ms ${MOTION_TOKENS.easing.entrance}`,
  `box-shadow ${MOTION_TOKENS.durationMs.slow}ms ${MOTION_TOKENS.easing.entrance}`,
].join(', ');
const VIEWPORT_HEIGHT_CSS_VARIABLE = '--tb-viewport-height';

const USER_STATE_STORAGE_KEY = 'tastebuddy-user-state-v5';
const LEGACY_USER_STATE_STORAGE_KEYS = [
  'tastebuddy-user-state-v1',
  'tastebuddy-user-state-v2',
  'tastebuddy-user-state-v3',
  'tastebuddy-user-state-v4',
] as const;

interface PersistedUserState {
  hasCompletedInitialMeasurement: boolean;
  latestPreferenceIntakeProfile: PreferenceIntakeProfile | null;
  latestRestaurantReadyGuidance: RestaurantReadyGuidance | null;
  latestTasteSurveyRespondentContext: TasteSurveyRespondentContext;
  latestTasteMeasurementSnapshot: TasteMeasurementSnapshot | null;
  profileAvatarDataUrl: string | null;
  profileBirthDate: string | null;
  tasteSurveyDraft: PersistedTasteSurveyDraft | null;
}

interface PersistedTasteSurveyDraft {
  currentSurveyContextIndex: number;
  currentSurveyIndex: number;
  respondentContext: TasteSurveyRespondentContext;
  surveyResponses: Record<string, TasteSurveyResponse>;
  tasteSurveyFlowStep: TasteSurveyFlowStep;
  tasteSurveyLastUpdatedAt: string;
}

function isTasteMeasurementSnapshot(value: unknown): value is TasteMeasurementSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as TasteMeasurementSnapshot;

  return typeof snapshot.measuredAt === 'string' && typeof snapshot.results === 'object';
}

function isTasteSurveyFlowStep(value: unknown): value is TasteSurveyFlowStep {
  return (
    value === 'intro' ||
    value === 'context' ||
    value === 'questionsIntro' ||
    value === 'questions' ||
    value === 'profileIntro' ||
    value === 'review' ||
    value === 'result'
  );
}

function isTasteSurveyLikertValue(value: unknown): value is TasteSurveyLikertValue {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 7
  );
}

function isTasteSurveyResponse(value: unknown): value is TasteSurveyResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Partial<TasteSurveyResponse>;

  return (
    typeof response.itemId === 'string' &&
    typeof response.uncertain === 'boolean' &&
    (response.selectedValue === null || isTasteSurveyLikertValue(response.selectedValue))
  );
}

function getVisibleViewportHeight() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.visualViewport?.height ?? window.innerHeight;
}

function sanitizeTasteSurveyResponses(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, TasteSurveyResponse>;
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, TasteSurveyResponse>>(
    (responses, [itemId, response]) => {
      if (isTasteSurveyResponse(response) && response.itemId === itemId) {
        responses[itemId] = response;
      }

      return responses;
    },
    {},
  );
}

function isPersistedTasteSurveyDraft(value: unknown): value is PersistedTasteSurveyDraft {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const draft = value as Partial<PersistedTasteSurveyDraft>;

  return (
    typeof draft.currentSurveyIndex === 'number' &&
    Number.isInteger(draft.currentSurveyIndex) &&
    draft.currentSurveyIndex >= 0 &&
    isTasteSurveyFlowStep(draft.tasteSurveyFlowStep) &&
    typeof draft.tasteSurveyLastUpdatedAt === 'string'
  );
}

function clampSurveyIndex(value: number) {
  return Math.min(Math.max(value, 0), Math.max(TASTE_SURVEY_ITEMS.length - 1, 0));
}

function clampSurveyContextIndex(value: number) {
  return Math.min(Math.max(value, 0), Math.max(TASTE_SURVEY_CONTEXT_STEPS.length - 1, 0));
}

function createTasteSurveyDraft(
  surveyResponses: Record<string, TasteSurveyResponse | undefined>,
  currentSurveyContextIndex: number,
  currentSurveyIndex: number,
  tasteSurveyFlowStep: TasteSurveyFlowStep,
  respondentContext: TasteSurveyRespondentContext,
): PersistedTasteSurveyDraft | null {
  const sanitizedResponses = sanitizeTasteSurveyResponses(surveyResponses);
  const sanitizedRespondentContext = sanitizeTasteSurveyRespondentContext(respondentContext);
  const hasDraftProgress =
    Object.keys(sanitizedResponses).length > 0 ||
    hasTasteSurveyRespondentContext(sanitizedRespondentContext) ||
    currentSurveyContextIndex > 0 ||
    currentSurveyIndex > 0 ||
    tasteSurveyFlowStep !== 'intro';

  if (!hasDraftProgress) {
    return null;
  }

  return {
    currentSurveyContextIndex: clampSurveyContextIndex(currentSurveyContextIndex),
    currentSurveyIndex: clampSurveyIndex(currentSurveyIndex),
    respondentContext: sanitizedRespondentContext,
    surveyResponses: sanitizedResponses,
    tasteSurveyFlowStep,
    tasteSurveyLastUpdatedAt: new Date().toISOString(),
  };
}

function hasCompleteTasteSurveyRespondentContext(
  context: TasteSurveyRespondentContext,
) {
  return Boolean(context.ageRange && context.sexContext && context.smokingStatus);
}

function getTasteSurveyResponseList(
  responses: Record<string, TasteSurveyResponse | undefined>,
) {
  return Object.values(responses).filter(
    (response): response is TasteSurveyResponse => Boolean(response),
  );
}

function buildCompatibleResultFromSurveyResponses(
  responses: Record<string, TasteSurveyResponse | undefined>,
) {
  return buildTasteSurveyCompatibleResult(getTasteSurveyResponseList(responses));
}

function createTasteSurveyMeasurementRawPayload(
  responses: Record<string, TasteSurveyResponse | undefined>,
  compatibleResult: TasteSurveyCompatibleResult,
  respondentContext: TasteSurveyRespondentContext,
) {
  const responseList = getTasteSurveyResponseList(responses);

  return buildTasteSurveyMeasurementRawPayload({
    compatibleResult,
    respondentContext,
    responses: responseList,
  });
}

function getSessionEmail(session: Session | null) {
  return session?.user.email ?? session?.user.new_email ?? null;
}

function getSessionDisplayName(session: Session | null) {
  const metadata = session?.user.user_metadata;
  const displayName = typeof metadata?.display_name === 'string' ? metadata.display_name.trim() : '';

  return displayName || null;
}

function getSessionNickname(session: Session | null) {
  const metadata = session?.user.user_metadata;
  const nickname = typeof metadata?.nickname === 'string' ? metadata.nickname.trim() : '';

  return nickname || null;
}

function getSessionProfileLabel(session: Session | null) {
  const nickname = getSessionNickname(session);
  const displayName = getSessionDisplayName(session);

  return nickname || displayName || null;
}

const HANGUL_INITIAL_ROMAN = [
  'G',
  'K',
  'N',
  'D',
  'T',
  'R',
  'M',
  'B',
  'P',
  'S',
  'S',
  '',
  'J',
  'J',
  'C',
  'K',
  'T',
  'P',
  'H',
] as const;

const HANGUL_VOWEL_ROMAN_INITIAL = [
  'A',
  'A',
  'Y',
  'Y',
  'E',
  'E',
  'Y',
  'Y',
  'O',
  'W',
  'W',
  'W',
  'Y',
  'U',
  'W',
  'W',
  'W',
  'Y',
  'E',
  'I',
  'I',
] as const;

function getRomanizedNameInitial(character: string) {
  const codePoint = character.charCodeAt(0);

  if (codePoint < 0xac00 || codePoint > 0xd7a3) {
    return character;
  }

  const syllableOffset = codePoint - 0xac00;
  const initialIndex = Math.floor(syllableOffset / 588);
  const vowelIndex = Math.floor((syllableOffset % 588) / 28);

  return HANGUL_INITIAL_ROMAN[initialIndex] || HANGUL_VOWEL_ROMAN_INITIAL[vowelIndex] || character;
}

function getUserInitials(displayName: string | null, email: string | null) {
  const source = displayName?.trim() || email?.split('@')[0] || '';

  if (!source) {
    return 'TB';
  }

  const nameParts = source
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (nameParts.length >= 2) {
    return nameParts
      .slice(0, 2)
      .map((part) => getRomanizedNameInitial(part[0] ?? ''))
      .join('')
      .toUpperCase();
  }

  const compactName = (nameParts[0] ?? source).replace(/[^a-zA-Z0-9가-힣]/g, '');

  if (!compactName) {
    return 'TB';
  }

  const nameCharacters = Array.from(compactName);
  const initialsSource =
    displayName?.trim() && /^[가-힣]{3,}$/.test(compactName)
      ? nameCharacters.slice(1, 3)
      : nameCharacters.slice(0, 2);

  return initialsSource
    .map(getRomanizedNameInitial)
    .join('')
    .toUpperCase();
}

function createTasteProfileAvatarStyle(
  snapshot: TasteMeasurementSnapshot | null,
): CSSProperties {
  if (!snapshot) {
    return {
      background:
        'radial-gradient(circle at 28% 24%, rgba(255, 153, 0, 0.52), transparent 45%), radial-gradient(circle at 72% 76%, rgba(251, 192, 45, 0.38), transparent 44%), #FFE8C1',
    };
  }

  const entries = getTasteMeasurementEntries(snapshot);
  const totalValue = entries.reduce((sum, entry) => sum + Math.max(entry.valueMm, 0.1), 0);
  const positions = [
    ['26%', '24%'],
    ['72%', '22%'],
    ['78%', '70%'],
    ['32%', '78%'],
    ['50%', '42%'],
    ['18%', '58%'],
  ] as const;
  const meshLayers = entries
    .map((entry, index) => {
      const token = TASTE_TOKENS[entry.id];
      const ratio = Math.max(entry.valueMm, 0.1) / totalValue;
      const alpha = Math.min(0.72, 0.22 + ratio * 2.6);
      const radius = Math.min(66, 34 + ratio * 150);
      const [x, y] = positions[index] ?? ['50%', '50%'];

      return `radial-gradient(circle at ${x} ${y}, ${token.palette.main}${Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')} 0%, transparent ${radius.toFixed(0)}%)`;
    })
    .join(', ');

  return {
    background: `${meshLayers}, var(--tb-color-surface-muted)`,
  };
}

function createEmptyPersistedUserState(): PersistedUserState {
  return {
    hasCompletedInitialMeasurement: false,
    latestPreferenceIntakeProfile: null,
    latestRestaurantReadyGuidance: null,
    latestTasteSurveyRespondentContext: {},
    latestTasteMeasurementSnapshot: null,
    profileAvatarDataUrl: null,
    profileBirthDate: null,
    tasteSurveyDraft: null,
  };
}

function clearTasteBuddyLocalState() {
  if (typeof window === 'undefined') {
    return;
  }

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith('tastebuddy-'))
    .forEach((key) => window.localStorage.removeItem(key));
}

function consumeOnboardingResetParam() {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);

  if (url.searchParams.get('reset') !== 'onboarding') {
    return false;
  }

  clearTasteBuddyLocalState();
  url.searchParams.delete('reset');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);

  return true;
}

function applySheetBackgroundCardProgress(
  element: HTMLDivElement | null,
  progress: number,
  immediate = false,
) {
  if (!element) {
    return;
  }

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const scale = 1 - (1 - BACKGROUND_CARD_OPEN_SCALE) * clampedProgress;
  const translateY = BACKGROUND_CARD_OPEN_OFFSET * clampedProgress;
  const borderRadius = BACKGROUND_CARD_OPEN_RADIUS * clampedProgress;
  const shadowOffsetY = BACKGROUND_CARD_SHADOW_Y * clampedProgress;
  const shadowBlur = BACKGROUND_CARD_SHADOW_BLUR * clampedProgress;
  const shadowOpacity = BACKGROUND_CARD_SHADOW_OPACITY * clampedProgress;

  element.style.transition = immediate ? 'none' : BACKGROUND_CARD_TRANSITION;
  element.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
  element.style.borderRadius = `${borderRadius}px`;
  element.style.boxShadow = clampedProgress > 0
    ? `0 ${shadowOffsetY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity})`
    : 'none';
}

function loadPersistedUserState(): PersistedUserState {
  if (typeof window === 'undefined') {
    return createEmptyPersistedUserState();
  }

  try {
    const rawValue =
      window.localStorage.getItem(USER_STATE_STORAGE_KEY) ??
      LEGACY_USER_STATE_STORAGE_KEYS.map((storageKey) =>
        window.localStorage.getItem(storageKey),
      ).find(Boolean) ??
      null;

    if (!rawValue) {
      LEGACY_USER_STATE_STORAGE_KEYS.forEach((storageKey) => {
        window.localStorage.removeItem(storageKey);
      });

      return createEmptyPersistedUserState();
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PersistedUserState>;
    const latestTasteMeasurementSnapshot = isTasteMeasurementSnapshot(
      parsedValue.latestTasteMeasurementSnapshot,
    )
      ? parsedValue.latestTasteMeasurementSnapshot
      : null;
    const latestPreferenceIntakeProfile = isPreferenceIntakeProfile(
      parsedValue.latestPreferenceIntakeProfile,
    )
      ? parsedValue.latestPreferenceIntakeProfile
      : null;
    const latestRestaurantReadyGuidance = isRestaurantReadyGuidance(
      parsedValue.latestRestaurantReadyGuidance,
    )
      ? parsedValue.latestRestaurantReadyGuidance
      : latestTasteMeasurementSnapshot
        ? createFallbackRestaurantReadyGuidance(latestTasteMeasurementSnapshot)
        : null;
    const latestTasteSurveyRespondentContext = sanitizeTasteSurveyRespondentContext(
      parsedValue.latestTasteSurveyRespondentContext ??
      parsedValue.tasteSurveyDraft?.respondentContext,
    );
    const profileAvatarDataUrl =
      typeof parsedValue.profileAvatarDataUrl === 'string' &&
        parsedValue.profileAvatarDataUrl.startsWith('data:image/')
        ? parsedValue.profileAvatarDataUrl
        : null;
    const profileBirthDate =
      typeof parsedValue.profileBirthDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(parsedValue.profileBirthDate)
        ? parsedValue.profileBirthDate
        : null;

    return {
      hasCompletedInitialMeasurement:
        Boolean(parsedValue.hasCompletedInitialMeasurement) && latestTasteMeasurementSnapshot !== null,
      latestPreferenceIntakeProfile,
      latestRestaurantReadyGuidance,
      latestTasteSurveyRespondentContext,
      latestTasteMeasurementSnapshot,
      profileAvatarDataUrl,
      profileBirthDate,
      tasteSurveyDraft:
        isPersistedTasteSurveyDraft(parsedValue.tasteSurveyDraft)
          ? {
            currentSurveyContextIndex: clampSurveyContextIndex(
              parsedValue.tasteSurveyDraft.currentSurveyContextIndex ?? 0,
            ),
            currentSurveyIndex: clampSurveyIndex(parsedValue.tasteSurveyDraft.currentSurveyIndex),
            respondentContext: sanitizeTasteSurveyRespondentContext(
              parsedValue.tasteSurveyDraft.respondentContext,
            ),
            surveyResponses: sanitizeTasteSurveyResponses(
              parsedValue.tasteSurveyDraft.surveyResponses,
            ),
            tasteSurveyFlowStep: parsedValue.tasteSurveyDraft.tasteSurveyFlowStep,
            tasteSurveyLastUpdatedAt: parsedValue.tasteSurveyDraft.tasteSurveyLastUpdatedAt,
          }
          : null,
    };
  } catch {
    return createEmptyPersistedUserState();
  }
}

function MainApp() {
  const [shouldStartFromOnboarding] = useState(consumeOnboardingResetParam);
  const [persistedUserState] = useState<PersistedUserState>(() =>
    shouldStartFromOnboarding ? createEmptyPersistedUserState() : loadPersistedUserState(),
  );
  const backgroundCardRef = useRef<HTMLDivElement>(null);
  const [appState, setAppState] = useState<AppState>(
    shouldStartFromOnboarding ? 'onboarding' : 'splash',
  );
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [measurementEntryPoint, setMeasurementEntryPoint] =
    useState<MeasurementEntryPoint>('initial');
  const [measurementReturnTab, setMeasurementReturnTab] = useState<TabType>('home');
  const [hasCompletedInitialMeasurement, setHasCompletedInitialMeasurement] = useState(
    persistedUserState.hasCompletedInitialMeasurement,
  );
  const [latestTasteMeasurementSnapshot, setLatestTasteMeasurementSnapshot] = useState<
    TasteMeasurementSnapshot | null
  >(persistedUserState.latestTasteMeasurementSnapshot);
  const [latestRestaurantReadyGuidance, setLatestRestaurantReadyGuidance] =
    useState<RestaurantReadyGuidance | null>(persistedUserState.latestRestaurantReadyGuidance);
  const [latestPreferenceIntakeProfile, setLatestPreferenceIntakeProfile] =
    useState<PreferenceIntakeProfile | null>(persistedUserState.latestPreferenceIntakeProfile);
  const [profileAvatarDataUrl, setProfileAvatarDataUrl] = useState<string | null>(
    persistedUserState.profileAvatarDataUrl,
  );
  const [profileBirthDate, setProfileBirthDate] = useState<string | null>(
    persistedUserState.profileBirthDate,
  );
  const [tasteSurveyFlowStep, setTasteSurveyFlowStep] =
    useState<TasteSurveyFlowStep>(
      persistedUserState.tasteSurveyDraft?.tasteSurveyFlowStep ?? 'intro',
    );
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(
    persistedUserState.tasteSurveyDraft?.currentSurveyIndex ?? 0,
  );
  const [currentSurveyContextIndex, setCurrentSurveyContextIndex] = useState(
    persistedUserState.tasteSurveyDraft?.currentSurveyContextIndex ?? 0,
  );
  const [tasteSurveyRespondentContext, setTasteSurveyRespondentContext] =
    useState<TasteSurveyRespondentContext>(
      persistedUserState.tasteSurveyDraft?.respondentContext ??
      persistedUserState.latestTasteSurveyRespondentContext,
    );
  const [surveyResponses, setSurveyResponses] = useState<
    Record<string, TasteSurveyResponse | undefined>
  >(persistedUserState.tasteSurveyDraft?.surveyResponses ?? {});
  const [latestSurveyCompatibleResult, setLatestSurveyCompatibleResult] =
    useState<TasteSurveyCompatibleResult | null>(() =>
      persistedUserState.tasteSurveyDraft?.tasteSurveyFlowStep === 'result'
        ? buildCompatibleResultFromSurveyResponses(
          persistedUserState.tasteSurveyDraft.surveyResponses,
        )
        : null,
    );
  const [hasSplashDelayCompleted, setHasSplashDelayCompleted] = useState(false);
  const [hasHydratedRemoteMeasurement, setHasHydratedRemoteMeasurement] = useState(
    shouldStartFromOnboarding || !isSupabaseConfigured,
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(getFallbackNotifications);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [isAuthProfileOpen, setIsAuthProfileOpen] = useState(false);
  const [authProfileStatus, setAuthProfileStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [authProfileMessage, setAuthProfileMessage] = useState<string | null>(null);
  const [authEntryStatus, setAuthEntryStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [authEntryMessage, setAuthEntryMessage] = useState<string | null>(null);
  const [authEntryIntent, setAuthEntryIntent] =
    useState<SupabaseEmailOtpIntent>('start-with-email');
  const [authEntryStep, setAuthEntryStep] = useState<'email' | 'code'>('email');
  const [authEntryPendingEmail, setAuthEntryPendingEmail] = useState<string | null>(null);
  const [isAuthEntrySheetOpen, setIsAuthEntrySheetOpen] = useState(false);
  const [isAuthEntryCancelConfirmOpen, setIsAuthEntryCancelConfirmOpen] = useState(false);
  const [isProfileIdentitySheetOpen, setIsProfileIdentitySheetOpen] = useState(false);
  const [isProfileEditSheetOpen, setIsProfileEditSheetOpen] = useState(false);
  const [profileEditStatus, setProfileEditStatus] = useState<'idle' | 'submitting'>('idle');
  const [isProfileSetupSheetOpen, setIsProfileSetupSheetOpen] = useState(false);
  const [profileSetupStatus, setProfileSetupStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [profileSetupMessage, setProfileSetupMessage] = useState<string | null>(null);
  const [isTasteSurveyIntroSheetOpen, setIsTasteSurveyIntroSheetOpen] = useState(false);
  const [tasteSurveyIntroReturnTarget, setTasteSurveyIntroReturnTarget] =
    useState<'auth' | 'profile'>('profile');
  const [isPreferenceIntakeSheetOpen, setIsPreferenceIntakeSheetOpen] = useState(false);
  const [isTasteSurveySheetOpen, setIsTasteSurveySheetOpen] = useState(false);

  // Overlay states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSupportPanel, setActiveSupportPanel] = useState<AppMenuSupportPanel | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isDeleteAccountConfirmOpen, setIsDeleteAccountConfirmOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isReservationRootView, setIsReservationRootView] = useState(true);
  const [isReservationFeedbackMapView, setIsReservationFeedbackMapView] = useState(false);
  const [selectedRestaurantDetail, setSelectedRestaurantDetail] =
    useState<RestaurantDetailViewModel | null>(null);
  const mainNavigationStackRef = useRef<MainNavigationLocation[]>([]);
  const [isRestaurantDetailFeedbackMapView, setIsRestaurantDetailFeedbackMapView] = useState(false);
  const [globalSearchTrigger, setGlobalSearchTrigger] = useState(0);
  const [globalSearchCatalog, setGlobalSearchCatalog] = useState<RestaurantContentCatalog>({
    chefs: [],
    dishes: [],
  });
  const [globalSearchReservations, setGlobalSearchReservations] = useState<ReservationRecord[]>(
    isSupabaseConfigured ? [] : RESERVATION_CATALOG,
  );
  const shouldLayerAuthEntrySheet = isAuthEntrySheetOpen && authEntryStep === 'code';
  const isLayeredMeasurementSheetOpen =
    shouldLayerAuthEntrySheet ||
    isProfileIdentitySheetOpen ||
    isProfileEditSheetOpen ||
    isProfileSetupSheetOpen ||
    isTasteSurveyIntroSheetOpen ||
    isPreferenceIntakeSheetOpen ||
    isTasteSurveySheetOpen;

  useEffect(() => {
    const nextTasteSurveyDraft =
      hasCompletedInitialMeasurement && latestTasteMeasurementSnapshot !== null
        ? null
        : latestPreferenceIntakeProfile
          ? createTasteSurveyDraft(
            surveyResponses,
            currentSurveyContextIndex,
            currentSurveyIndex,
            tasteSurveyFlowStep,
            tasteSurveyRespondentContext,
          )
          : null;

    window.localStorage.setItem(
      USER_STATE_STORAGE_KEY,
      JSON.stringify({
        hasCompletedInitialMeasurement,
        latestPreferenceIntakeProfile,
        latestRestaurantReadyGuidance,
        latestTasteSurveyRespondentContext: sanitizeTasteSurveyRespondentContext(
          tasteSurveyRespondentContext,
        ),
        latestTasteMeasurementSnapshot,
        profileAvatarDataUrl,
        profileBirthDate,
        tasteSurveyDraft: nextTasteSurveyDraft,
      } satisfies PersistedUserState),
    );
  }, [
    currentSurveyContextIndex,
    currentSurveyIndex,
    hasCompletedInitialMeasurement,
    latestPreferenceIntakeProfile,
    latestRestaurantReadyGuidance,
    latestTasteMeasurementSnapshot,
    profileAvatarDataUrl,
    profileBirthDate,
    surveyResponses,
    tasteSurveyFlowStep,
    tasteSurveyRespondentContext,
  ]);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      if (shouldStartFromOnboarding) {
        setHasHydratedRemoteMeasurement(true);
        return;
      }

      if (!isSupabaseConfigured) {
        setHasHydratedRemoteMeasurement(true);
        return;
      }

      const session = await ensureSupabaseSession();

      if (!isCancelled) {
        setSupabaseSession(session);
      }

      const remoteSnapshot = await hydrateLatestMeasurementSnapshot();

      if (isCancelled) {
        return;
      }

      if (remoteSnapshot) {
        setLatestTasteMeasurementSnapshot(remoteSnapshot);
        setHasCompletedInitialMeasurement(true);
        setLatestRestaurantReadyGuidance((current) =>
          current
            ? mergeRestaurantReadyGuidanceWithSnapshot(current, remoteSnapshot)
            : createFallbackRestaurantReadyGuidance(remoteSnapshot),
        );
      }

      setHasHydratedRemoteMeasurement(true);
    })();

    return () => {
      isCancelled = true;
    };
  }, [shouldStartFromOnboarding]);

  useEffect(() => {
    applySheetBackgroundCardProgress(backgroundCardRef.current, isLayeredMeasurementSheetOpen ? 1 : 0);
  }, [isLayeredMeasurementSheetOpen]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      const session = await getCurrentSupabaseSession();

      if (!isCancelled) {
        setSupabaseSession(session);
      }
    })();

    const unsubscribe = subscribeToSupabaseAuthState((session) => {
      setSupabaseSession(session);

      if (session && !isAnonymousSupabaseSession(session)) {
        setAuthProfileStatus('success');
        setAuthProfileMessage('이메일 계정이 연결되었습니다. 다음 식사에도 같은 프로필을 이어갈 수 있어요.');
      }
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      const nextNotifications = await hydrateNotifications();

      if (isCancelled) {
        return;
      }

      setNotifications(nextNotifications);
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const hasMeasurementData =
    hasCompletedInitialMeasurement && latestTasteMeasurementSnapshot !== null;
  const currentUserEmail = getSessionEmail(supabaseSession);
  const currentUserDisplayName = getSessionDisplayName(supabaseSession);
  const currentUserNickname = getSessionNickname(supabaseSession);
  const currentUserProfileLabel = getSessionProfileLabel(supabaseSession);
  const isAnonymousUser = isSupabaseConfigured
    ? isAnonymousSupabaseSession(supabaseSession) || !currentUserEmail
    : true;
  const shouldShowAuthEntry = isSupabaseConfigured && isAnonymousUser;
  const userInitials = getUserInitials(currentUserDisplayName, currentUserEmail);
  const userLabel = currentUserProfileLabel || (currentUserEmail ? '프로필 연결됨' : 'Taste Buddy Guest');
  const userAvatarStyle = useMemo(
    () => createTasteProfileAvatarStyle(latestTasteMeasurementSnapshot),
    [latestTasteMeasurementSnapshot],
  );

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    const rootElement = document.documentElement;

    const syncViewportHeight = () => {
      const viewportHeight = getVisibleViewportHeight();

      if (!viewportHeight) {
        return;
      }

      rootElement.style.setProperty(VIEWPORT_HEIGHT_CSS_VARIABLE, `${viewportHeight}px`);
    };

    syncViewportHeight();

    window.addEventListener('resize', syncViewportHeight);
    window.addEventListener('orientationchange', syncViewportHeight);
    window.visualViewport?.addEventListener('resize', syncViewportHeight);
    window.visualViewport?.addEventListener('scroll', syncViewportHeight);

    return () => {
      window.removeEventListener('resize', syncViewportHeight);
      window.removeEventListener('orientationchange', syncViewportHeight);
      window.visualViewport?.removeEventListener('resize', syncViewportHeight);
      window.visualViewport?.removeEventListener('scroll', syncViewportHeight);
      rootElement.style.removeProperty(VIEWPORT_HEIGHT_CSS_VARIABLE);
    };
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactiveElement = target?.closest(
        'button, a, [role="button"], [data-analytics-event]',
      );

      if (!interactiveElement) {
        return;
      }

      const explicitEventName = interactiveElement.getAttribute('data-analytics-event');
      const label =
        interactiveElement.getAttribute('aria-label') ??
        interactiveElement.getAttribute('title') ??
        interactiveElement.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) ??
        interactiveElement.tagName.toLowerCase();

      trackEvent(explicitEventName || 'ui_interaction', {
        app_state: appState,
        active_tab: activeTab,
        element_tag: interactiveElement.tagName.toLowerCase(),
        element_label: label,
      });
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeTab, appState]);

  useEffect(() => {
    if (selectedRestaurantDetail) {
      trackPageView(
        `Taste Buddy - ${selectedRestaurantDetail.name}`,
        `/restaurants/${selectedRestaurantDetail.id}`,
        {
          app_state: appState,
          active_tab: activeTab,
          restaurant_id: selectedRestaurantDetail.id,
          restaurant_name: selectedRestaurantDetail.name,
          chef_name: selectedRestaurantDetail.chefName,
        },
      );
      return;
    }

    if (appState === 'main') {
      trackPageView(`Taste Buddy - ${activeTab}`, `/${activeTab}`, {
        app_state: appState,
        active_tab: activeTab,
        has_measurement_data: hasMeasurementData,
      });
      return;
    }

    const calibrationStepPath =
      appState === 'calibration' ? `/${tasteSurveyFlowStep}` : '';

    trackPageView(
      `Taste Buddy - ${appState}${calibrationStepPath}`,
      `/${appState}${calibrationStepPath}`,
      {
        app_state: appState,
        taste_survey_step: appState === 'calibration' ? tasteSurveyFlowStep : undefined,
        measurement_entry_point: measurementEntryPoint,
        has_measurement_data: hasMeasurementData,
      },
    );
  }, [
    activeTab,
    appState,
    hasMeasurementData,
    measurementEntryPoint,
    selectedRestaurantDetail,
    tasteSurveyFlowStep,
  ]);

  useEffect(() => {
    if (!hasMeasurementData || !isSupabaseConfigured) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      const [hydratedData, hydratedCatalog] = await Promise.all([
        hydrateReservationPageData(),
        hydrateRestaurantContentCatalog(),
      ]);

      if (isCancelled) {
        return;
      }

      setGlobalSearchReservations(hydratedData.reservations);
      setGlobalSearchCatalog(hydratedCatalog);
    })();

    return () => {
      isCancelled = true;
    };
  }, [hasMeasurementData]);

  useEffect(() => {
    if (
      appState !== 'splash' ||
      !hasSplashDelayCompleted ||
      !hasHydratedRemoteMeasurement
    ) {
      return;
    }

    if (hasMeasurementData) {
      setActiveTab('home');
      setAppState('main');
      return;
    }

    if (latestPreferenceIntakeProfile) {
      setAppState('calibration');
      return;
    }

    setAppState('onboarding');
  }, [
    appState,
    hasHydratedRemoteMeasurement,
    hasMeasurementData,
    hasSplashDelayCompleted,
    latestPreferenceIntakeProfile,
  ]);

  const getCurrentMainNavigationLocation = (): MainNavigationLocation => ({
    activeTab,
    selectedRestaurantDetail,
  });

  const isSameMainNavigationLocation = (
    left: MainNavigationLocation,
    right: MainNavigationLocation,
  ) =>
    left.activeTab === right.activeTab &&
    left.selectedRestaurantDetail?.id === right.selectedRestaurantDetail?.id;

  const pushCurrentMainNavigationLocation = () => {
    const currentLocation = getCurrentMainNavigationLocation();
    const previousLocation = mainNavigationStackRef.current.at(-1);

    if (previousLocation && isSameMainNavigationLocation(previousLocation, currentLocation)) {
      return;
    }

    mainNavigationStackRef.current = [
      ...mainNavigationStackRef.current.slice(-9),
      currentLocation,
    ];
  };

  const restoreMainNavigationLocation = (location: MainNavigationLocation) => {
    trackEvent('main_navigation_restore', {
      tab: location.activeTab,
      has_restaurant_detail: Boolean(location.selectedRestaurantDetail),
    });
    setIsRestaurantDetailFeedbackMapView(false);
    setSelectedRestaurantDetail(location.selectedRestaurantDetail);
    setActiveTab(location.activeTab);
  };

  const goBackToPreviousMainLocation = (fallbackTab: TabType = activeTab) => {
    const previousLocation = mainNavigationStackRef.current.pop();

    if (previousLocation) {
      restoreMainNavigationLocation(previousLocation);
      return;
    }

    restoreMainNavigationLocation({
      activeTab: fallbackTab,
      selectedRestaurantDetail: null,
    });
  };

  const navigateToTab = (tab: TabType) => {
    if (activeTab === tab && selectedRestaurantDetail === null) {
      return;
    }

    trackEvent('tab_select', {
      from_tab: activeTab,
      to_tab: tab,
      from_restaurant_detail: Boolean(selectedRestaurantDetail),
    });
    pushCurrentMainNavigationLocation();
    setSelectedRestaurantDetail(null);
    setActiveTab(tab);
  };

  const openRestaurantDetail = (restaurant: RestaurantDetailViewModel) => {
    trackEvent('restaurant_detail_open', {
      active_tab: activeTab,
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      chef_name: restaurant.chefName,
    });
    pushCurrentMainNavigationLocation();
    setSelectedRestaurantDetail(restaurant);
  };

  const handleTabChange = (tab: TabType) => {
    navigateToTab(tab);
  };

  const handleOpenProfileIdentitySheet = () => {
    trackEvent('profile_sheet_open', {
      is_anonymous_user: isAnonymousUser,
      has_avatar: Boolean(profileAvatarDataUrl),
    });
    setIsProfileIdentitySheetOpen(true);
  };

  const handleOpenProfileEditSheet = () => {
    trackEvent('profile_edit_open');
    setProfileEditStatus('idle');
    setIsProfileIdentitySheetOpen(false);
    setIsProfileEditSheetOpen(true);
  };

  const handleBackToProfileIdentitySheet = () => {
    trackEvent('profile_edit_back');
    setIsProfileEditSheetOpen(false);
    setIsProfileIdentitySheetOpen(true);
  };

  const handleSubmitProfileEdit = async (input: {
    avatarImageDataUrl: string | null;
    birthDate: string | null;
    displayName: string;
    nickname: string;
    preferenceProfile: PreferenceIntakeProfile;
    respondentContext: TasteSurveyRespondentContext;
  }) => {
    setProfileEditStatus('submitting');
    trackEvent('profile_edit_submit', {
      has_avatar: Boolean(input.avatarImageDataUrl),
      has_birth_date: Boolean(input.birthDate),
      has_display_name: Boolean(input.displayName.trim()),
      has_nickname: Boolean(input.nickname.trim()),
    });

    const sanitizedContext = sanitizeTasteSurveyRespondentContext(input.respondentContext);
    const nextDisplayName = input.displayName.trim();
    const nextNickname = input.nickname.trim();
    const currentDisplayName = currentUserDisplayName ?? '';
    const currentNickname = currentUserNickname ?? '';

    if (nextDisplayName !== currentDisplayName || nextNickname !== currentNickname) {
      const result = await updateSupabaseProfileIdentity({
        displayName: nextDisplayName,
        nickname: nextNickname,
      });

      if (!result.ok) {
        trackEvent('profile_edit_error', { reason: 'identity_update' });
        setProfileEditStatus('idle');
        return;
      }

      const session = await getCurrentSupabaseSession();
      setSupabaseSession(session);
    }

    setProfileAvatarDataUrl(input.avatarImageDataUrl);
    setProfileBirthDate(input.birthDate);
    setTasteSurveyRespondentContext(sanitizedContext);
    setLatestPreferenceIntakeProfile(input.preferenceProfile);
    setProfileEditStatus('idle');
    setIsProfileEditSheetOpen(false);
    setIsProfileIdentitySheetOpen(true);
    trackEvent('profile_edit_complete');
  };

  const handleLinkCurrentProfileEmail = () => {
    trackEvent('profile_link_email_open');
    setIsProfileIdentitySheetOpen(false);
    openAuthEntrySheet('link-current-profile');
  };

  const handlePersistedMeasurement = (
    snapshot: TasteMeasurementSnapshot,
    source: 'quick_calibration' | 'tastick',
    options?: Parameters<typeof persistTasteMeasurementSnapshot>[2],
  ) => {
    trackEvent('measurement_persist', {
      source,
      is_starter_profile: snapshot.source === 'broad-starter',
      result_count: Object.keys(snapshot.results).length,
    });
    void persistTasteMeasurementSnapshot(snapshot, source, options);
  };

  const applyStarterHomeState = () => {
    const starterSnapshot = createTasteMeasurementSnapshot(
      DEFAULT_TASTE_MEASUREMENT_RESULTS,
      new Date().toISOString(),
      'broad-starter',
    );

    setLatestTasteMeasurementSnapshot(starterSnapshot);
    setLatestRestaurantReadyGuidance(createFallbackRestaurantReadyGuidance(starterSnapshot));
    setHasCompletedInitialMeasurement(true);
  };

  useEffect(() => {
    if (appState === 'main' && !hasMeasurementData) {
      applyStarterHomeState();
    }
  }, [appState, hasMeasurementData]);

  const handleSplashComplete = () => {
    trackEvent('splash_complete');
    setHasSplashDelayCompleted(true);
  };

  const openAuthEntrySheet = (intent: SupabaseEmailOtpIntent) => {
    trackEvent('auth_entry_open', { intent });
    setAuthEntryIntent(intent);
    setAuthEntryStatus('idle');
    setAuthEntryMessage(null);
    setAuthEntryStep('email');
    setAuthEntryPendingEmail(null);
    setIsAuthEntryCancelConfirmOpen(false);
    setIsAuthEntrySheetOpen(true);
  };

  const continueAfterAuthEntry = () => {
    trackEvent('auth_entry_skip', { intent: authEntryIntent });
    setAuthEntryStatus('idle');
    setAuthEntryMessage(null);
    setAuthEntryStep('email');
    setAuthEntryPendingEmail(null);
    setAuthEntryIntent('start-with-email');
    setIsAuthEntrySheetOpen(false);
    setTasteSurveyIntroReturnTarget('auth');
    setIsTasteSurveyIntroSheetOpen(true);
  };

  const handleSubmitAuthEntryEmail = async (email: string) => {
    if (!email) {
      trackEvent('auth_email_submit_invalid', { intent: authEntryIntent });
      setAuthEntryStatus('error');
      setAuthEntryMessage('친구들과 리뷰를 이어갈 이메일을 입력해 주세요.');
      return;
    }

    setAuthEntryStatus('submitting');
    setAuthEntryMessage(null);
    trackEvent('auth_email_submit', { intent: authEntryIntent });

    const result = await sendSupabaseEmailOtp(email, authEntryIntent);
    trackEvent(result.ok ? 'auth_email_code_sent' : 'auth_email_code_error', {
      intent: authEntryIntent,
    });

    setAuthEntryStatus(result.ok ? 'success' : 'error');
    setAuthEntryMessage(
      result.ok
        ? authEntryIntent === 'link-current-profile'
          ? '현재 프로필을 연결할 인증 코드를 보냈습니다.'
          : '이메일로 인증 코드를 보냈습니다.'
        : result.message,
    );

    if (result.ok) {
      setAuthEntryPendingEmail(email);
      setAuthEntryStep('code');
    }
  };

  const handleSubmitAuthEntryCode = async (code: string) => {
    if (!authEntryPendingEmail) {
      trackEvent('auth_code_submit_error', { intent: authEntryIntent, reason: 'missing_email' });
      setAuthEntryStep('email');
      setAuthEntryStatus('error');
      setAuthEntryMessage('먼저 이메일을 입력해 주세요.');
      return;
    }

    if (code.length !== 6) {
      trackEvent('auth_code_submit_error', { intent: authEntryIntent, reason: 'invalid_length' });
      setAuthEntryStatus('error');
      setAuthEntryMessage('이메일로 받은 6자리 코드를 입력해 주세요.');
      return;
    }

    setAuthEntryStatus('submitting');
    setAuthEntryMessage(null);
    trackEvent('auth_code_submit', { intent: authEntryIntent });

    const result = await verifySupabaseEmailOtp(authEntryPendingEmail, code, authEntryIntent);
    trackEvent(result.ok ? 'auth_code_verified' : 'auth_code_verify_error', {
      intent: authEntryIntent,
    });

    setAuthEntryStatus(result.ok ? 'success' : 'error');
    setAuthEntryMessage(result.message);

    if (!result.ok) {
      return;
    }

    const session = result.session ?? (await getCurrentSupabaseSession());
    setSupabaseSession(session);
    setIsAuthEntrySheetOpen(false);
    setAuthEntryStep('email');
    setAuthEntryPendingEmail(null);
    setAuthEntryIntent('start-with-email');
    setAuthEntryMessage(null);

    if (authEntryIntent === 'link-current-profile') {
      setIsProfileIdentitySheetOpen(true);
      return;
    }

    setProfileSetupStatus('idle');
    setProfileSetupMessage(null);
    setIsProfileSetupSheetOpen(true);
  };

  const handleBackToAuthEntryEmail = () => {
    trackEvent('auth_entry_back_to_email', { intent: authEntryIntent });
    setIsAuthEntryCancelConfirmOpen(false);
    setAuthEntryStep('email');
    setAuthEntryPendingEmail(null);
    setAuthEntryStatus('idle');
    setAuthEntryMessage(null);
  };

  const handleRequestCloseAuthEntry = () => {
    trackEvent('auth_entry_close_request', { intent: authEntryIntent, step: authEntryStep });
    if (authEntryStep === 'code') {
      setIsAuthEntryCancelConfirmOpen(true);
      return;
    }

    setIsAuthEntrySheetOpen(false);
  };

  const handleConfirmCloseAuthEntry = () => {
    trackEvent('auth_entry_close_confirm', { intent: authEntryIntent, step: authEntryStep });
    setIsAuthEntryCancelConfirmOpen(false);
    setIsAuthEntrySheetOpen(false);
    setAuthEntryStep('email');
    setAuthEntryPendingEmail(null);
    setAuthEntryIntent('start-with-email');
    setAuthEntryStatus('idle');
    setAuthEntryMessage(null);
  };

  const handleDevBypassAuthEntry = () => {
    if (!import.meta.env.DEV) {
      return;
    }

    trackEvent('auth_entry_dev_bypass', { intent: authEntryIntent, step: authEntryStep });

    if (authEntryStep === 'email') {
      setAuthEntryPendingEmail('dev@tastebuddy.local');
      setAuthEntryStep('code');
      setAuthEntryStatus('success');
      setAuthEntryMessage('개발용으로 인증 코드 입력 단계로 이동했습니다.');
      return;
    }

    setIsAuthEntrySheetOpen(false);
    setAuthEntryStep('email');
    setAuthEntryPendingEmail(null);
    setAuthEntryIntent('start-with-email');
    setAuthEntryStatus('idle');
    setAuthEntryMessage(null);

    if (authEntryIntent === 'link-current-profile') {
      setIsProfileIdentitySheetOpen(true);
      return;
    }

    setProfileSetupStatus('idle');
    setProfileSetupMessage(null);
    setIsProfileSetupSheetOpen(true);
  };

  const handleStartInitialMeasurementFlow = () => {
    trackEvent('initial_measurement_start', {
      auth_required: shouldShowAuthEntry,
      has_measurement_data: hasMeasurementData,
    });
    if (shouldShowAuthEntry) {
      openAuthEntrySheet('start-with-email');
      return;
    }

    setAppState('intake');
  };

  const handleSubmitProfileSetup = async (input: {
    displayName: string;
    nickname: string;
  }) => {
    if (!input.displayName.trim() && !input.nickname.trim()) {
      trackEvent('profile_setup_submit_error', { reason: 'missing_identity' });
      setProfileSetupStatus('error');
      setProfileSetupMessage('이름이나 닉네임 중 하나는 입력해 주세요.');
      return;
    }

    setProfileSetupStatus('submitting');
    setProfileSetupMessage(null);
    trackEvent('profile_setup_submit', {
      has_display_name: Boolean(input.displayName.trim()),
      has_nickname: Boolean(input.nickname.trim()),
    });

    const result = await updateSupabaseProfileIdentity(input);
    trackEvent(result.ok ? 'profile_setup_complete' : 'profile_setup_error');

    setProfileSetupStatus(result.ok ? 'success' : 'error');
    setProfileSetupMessage(result.message);

    if (!result.ok) {
      return;
    }

    const session = await getCurrentSupabaseSession();
    setSupabaseSession(session);
    setIsProfileSetupSheetOpen(false);
    setProfileSetupStatus('idle');
    setProfileSetupMessage(null);
    setTasteSurveyIntroReturnTarget('profile');
    setIsTasteSurveyIntroSheetOpen(true);
  };

  const handleStartPreferenceIntakeFromTasteSurveyIntro = () => {
    trackEvent('preference_intake_open', { source: 'taste_survey_intro_sheet' });
    setIsTasteSurveyIntroSheetOpen(false);
    setIsPreferenceIntakeSheetOpen(true);
  };

  const handleOpenTasteSurveySheetFlow = (shouldClearResponses = false) => {
    trackEvent('taste_survey_sheet_open', { should_clear_responses: shouldClearResponses });
    resetTasteSurveyFlow(shouldClearResponses);
    setIsTasteSurveyIntroSheetOpen(false);
    setIsPreferenceIntakeSheetOpen(false);
    setIsTasteSurveySheetOpen(true);
  };

  const handleCompletePreferenceIntakeSheet = (profile: PreferenceIntakeProfile) => {
    trackEvent('preference_intake_complete', {
      preference_count: Object.keys(profile).length,
    });
    setLatestPreferenceIntakeProfile(profile);
    setIsPreferenceIntakeSheetOpen(false);
    handleOpenTasteSurveySheetFlow(true);
  };

  const handleSkipPreferenceIntakeSheet = () => {
    trackEvent('preference_intake_skip', { source: 'sheet' });
    resetTasteSurveyFlow(true);
    setIsTasteSurveyIntroSheetOpen(false);
    setIsPreferenceIntakeSheetOpen(false);
    setCurrentSurveyIndex(0);
    setTasteSurveyFlowStep('questionsIntro');
    setIsTasteSurveySheetOpen(true);
  };

  const handleSkipTasteSurveySheetToHome = () => {
    trackEvent('taste_survey_skip_to_home', { source: 'sheet' });
    setIsTasteSurveyIntroSheetOpen(false);
    setIsPreferenceIntakeSheetOpen(false);
    setIsTasteSurveySheetOpen(false);
    resetTasteSurveyFlow(true);
    applyStarterHomeState();
    setActiveTab('home');
    setAppState('main');
  };

  const resetTasteSurveyFlow = (shouldClearResponses = false) => {
    setTasteSurveyFlowStep('intro');
    setCurrentSurveyContextIndex(0);
    setCurrentSurveyIndex(0);
    setLatestSurveyCompatibleResult(null);

    if (shouldClearResponses) {
      setSurveyResponses({});
    }
  };

  const handleEnterTasteSurveyFlow = (shouldClearResponses = false) => {
    trackEvent('taste_survey_flow_enter', { should_clear_responses: shouldClearResponses });
    resetTasteSurveyFlow(shouldClearResponses);
    setAppState('calibration');
  };

  const handleStartMeasurementFromMain = (originTab: TabType) => {
    trackEvent('measurement_start', { origin_tab: originTab, mode: 'new' });
    setMeasurementEntryPoint('main');
    setMeasurementReturnTab(originTab);
    pushCurrentMainNavigationLocation();
    handleEnterTasteSurveyFlow(true);
  };

  const handleStartRemeasurementFromMain = (originTab: TabType) => {
    trackEvent('measurement_start', { origin_tab: originTab, mode: 'refresh' });
    setMeasurementEntryPoint('main');
    setMeasurementReturnTab(originTab);
    pushCurrentMainNavigationLocation();
    handleEnterTasteSurveyFlow(true);
  };

  const handleExitMeasurementFlow = () => {
    trackEvent('measurement_flow_exit', { entry_point: measurementEntryPoint });
    if (measurementEntryPoint === 'main') {
      setAppState('main');
      goBackToPreviousMainLocation(measurementReturnTab);
      return;
    }

    setAppState('onboarding');
  };

  const handleExitTasteSurveyFlow = () => {
    trackEvent('taste_survey_flow_exit', {
      entry_point: measurementEntryPoint,
      step: tasteSurveyFlowStep,
    });
    if (measurementEntryPoint === 'main') {
      handleExitMeasurementFlow();
      return;
    }

    setAppState('intake');
  };

  const handleSelectSurveyLikert = (itemId: string, value: TasteSurveyLikertValue) => {
    trackEvent('taste_survey_answer', {
      item_id: itemId,
      value,
      question_index: currentSurveyIndex,
      uncertain: false,
    });
    setLatestSurveyCompatibleResult(null);
    setSurveyResponses((currentResponses) => ({
      ...currentResponses,
      [itemId]: {
        itemId,
        selectedValue: value,
        uncertain: false,
      },
    }));
  };

  const handleSelectSurveyUncertain = (itemId: string) => {
    trackEvent('taste_survey_answer', {
      item_id: itemId,
      question_index: currentSurveyIndex,
      uncertain: true,
    });
    setLatestSurveyCompatibleResult(null);
    setSurveyResponses((currentResponses) => ({
      ...currentResponses,
      [itemId]: {
        itemId,
        selectedValue: null,
        uncertain: true,
      },
    }));
  };

  const handleChangeTasteSurveyRespondentContext = (
    respondentContext: TasteSurveyRespondentContext,
  ) => {
    setLatestSurveyCompatibleResult(null);
    setTasteSurveyRespondentContext(
      sanitizeTasteSurveyRespondentContext(respondentContext),
    );
  };

  const handleNextTasteSurveyContext = () => {
    trackEvent('taste_survey_context_next', {
      context_index: currentSurveyContextIndex,
      is_last_context: currentSurveyContextIndex >= TASTE_SURVEY_CONTEXT_STEPS.length - 1,
    });
    if (currentSurveyContextIndex < TASTE_SURVEY_CONTEXT_STEPS.length - 1) {
      setCurrentSurveyContextIndex((previousIndex) => previousIndex + 1);
      return;
    }

    setTasteSurveyFlowStep('questionsIntro');
  };

  const handleBackFromTasteSurveyContext = () => {
    trackEvent('taste_survey_context_back', { context_index: currentSurveyContextIndex });
    if (currentSurveyContextIndex > 0) {
      setCurrentSurveyContextIndex((previousIndex) => previousIndex - 1);
      return;
    }

    setTasteSurveyFlowStep('intro');
  };

  const clearTasteSurveyDraftAfterCompletion = () => {
    resetTasteSurveyFlow(true);
  };

  const handleNextSurveyQuestion = () => {
    trackEvent('taste_survey_question_next', {
      question_index: currentSurveyIndex,
      is_last_question: currentSurveyIndex >= TASTE_SURVEY_ITEMS.length - 1,
    });
    if (currentSurveyIndex < TASTE_SURVEY_ITEMS.length - 1) {
      setCurrentSurveyIndex((previousIndex) => previousIndex + 1);
      return;
    }

    setTasteSurveyFlowStep('profileIntro');
  };

  const handleBackFromSurveyQuestion = () => {
    trackEvent('taste_survey_question_back', { question_index: currentSurveyIndex });
    if (currentSurveyIndex > 0) {
      setCurrentSurveyIndex((previousIndex) => previousIndex - 1);
      return;
    }

    if (hasCompleteTasteSurveyRespondentContext(tasteSurveyRespondentContext)) {
      setTasteSurveyFlowStep('intro');
      return;
    }

    setCurrentSurveyContextIndex(Math.max(TASTE_SURVEY_CONTEXT_STEPS.length - 1, 0));
    setTasteSurveyFlowStep('context');
  };

  const handleSubmitTasteSurveyReview = () => {
    trackEvent('taste_survey_review_submit', {
      answered_count: Object.values(surveyResponses).filter(Boolean).length,
      total_count: TASTE_SURVEY_ITEMS.length,
    });
    const compatibleResult = buildCompatibleResultFromSurveyResponses(surveyResponses);

    setLatestSurveyCompatibleResult(compatibleResult);
    setTasteSurveyFlowStep('result');
  };

  const handleCompleteTasteSurvey = () => {
    const compatibleResult =
      latestSurveyCompatibleResult ?? buildCompatibleResultFromSurveyResponses(surveyResponses);

    trackEvent('taste_survey_complete', {
      answered_count: Object.values(surveyResponses).filter(Boolean).length,
      entry_point: measurementEntryPoint,
    });

    setLatestTasteMeasurementSnapshot(compatibleResult.snapshot);
    setLatestRestaurantReadyGuidance(compatibleResult.starterGuidance);
    setHasCompletedInitialMeasurement(true);
    handlePersistedMeasurement(compatibleResult.snapshot, 'quick_calibration', {
      rawPayload: createTasteSurveyMeasurementRawPayload(
        surveyResponses,
        compatibleResult,
        tasteSurveyRespondentContext,
      ),
    });
    clearTasteSurveyDraftAfterCompletion();
    setIsTasteSurveySheetOpen(false);
    setActiveTab(measurementEntryPoint === 'main' ? measurementReturnTab : 'home');
    setAppState('main');
  };

  const handleOpenImproveAccuracy = () => {
    trackEvent('improve_accuracy_open', { origin_tab: activeTab });
    setMeasurementEntryPoint('main');
    setMeasurementReturnTab(activeTab);
    pushCurrentMainNavigationLocation();
    setAppState('improve-accuracy');
  };

  const handleOpenSupportPanel = (panel: AppMenuSupportPanel) => {
    trackEvent('support_panel_open', { panel });
    setIsMenuOpen(false);
    setActiveSupportPanel(panel);
  };

  const handleCloseSupportPanel = () => {
    trackEvent('support_panel_close', { panel: activeSupportPanel });
    setActiveSupportPanel(null);
  };

  const handleOpenAuthProfile = () => {
    trackEvent('auth_profile_open', { is_anonymous_user: isAnonymousUser });
    setIsMenuOpen(false);

    if (isAnonymousUser) {
      openAuthEntrySheet('link-current-profile');
      return;
    }

    setAuthProfileStatus('idle');
    setAuthProfileMessage(null);
    setIsAuthProfileOpen(true);
  };

  const handleSubmitAuthEmail = async (email: string) => {
    if (!email) {
      trackEvent('auth_profile_email_submit_error', { reason: 'missing_email' });
      setAuthProfileStatus('error');
      setAuthProfileMessage('프로필을 이어갈 이메일을 입력해 주세요.');
      return;
    }

    setAuthProfileStatus('submitting');
    setAuthProfileMessage(null);
    trackEvent('auth_profile_email_submit', { is_anonymous_user: isAnonymousUser });

    const result = isAnonymousUser
      ? await linkAnonymousSupabaseUserEmail(email)
      : await sendSupabaseMagicLink(email);
    trackEvent(result.ok ? 'auth_profile_email_success' : 'auth_profile_email_error', {
      is_anonymous_user: isAnonymousUser,
    });

    setAuthProfileStatus(result.ok ? 'success' : 'error');
    setAuthProfileMessage(result.message);

    const session = await getCurrentSupabaseSession();
    setSupabaseSession(session);
  };

  const handleRequestLogout = () => {
    trackEvent('logout_request');
    setIsMenuOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleRequestDeleteAccount = () => {
    trackEvent('delete_account_request');
    setIsAuthProfileOpen(false);
    setIsDeleteAccountConfirmOpen(true);
  };

  const handleLogout = async () => {
    trackEvent('logout_confirm');
    await signOutSupabaseSession();

    if (typeof window !== 'undefined') {
      clearTasteBuddyLocalState();
    }

    clearAppliedDesignTokenRuntimeState();

    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    trackEvent('delete_account_confirm');
    setIsDeletingAccount(true);

    const result = await deleteCurrentSupabaseAccount();
    trackEvent(result.ok ? 'delete_account_success' : 'delete_account_error');

    setIsDeletingAccount(false);
    setIsDeleteAccountConfirmOpen(false);

    if (!result.ok) {
      setAuthProfileStatus('error');
      setAuthProfileMessage(result.message);
      setIsAuthProfileOpen(true);
      return;
    }

    clearTasteBuddyLocalState();
    clearAppliedDesignTokenRuntimeState();
    window.location.reload();
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    trackEvent('notification_mark_read', { notification_id: notificationId });
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );

    void markNotificationAsRead(notificationId);
  };

  const handleMarkAllNotificationsAsRead = () => {
    trackEvent('notification_mark_all_read', {
      unread_count: notifications.filter((notification) => !notification.read).length,
    });
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );

    void markAllNotificationsAsRead();
  };

  const handleOpenGlobalSearch = () => {
    trackEvent('global_search_open', { origin_tab: activeTab });
    setIsNotificationOpen(false);
    setIsMenuOpen(false);
    setActiveSupportPanel(null);
    setGlobalSearchTrigger((current) => current + 1);
  };

  // Common overlay props
  const overlayProps = {
    onOpenNotifications: () => {
      trackEvent('notifications_open', {
        unread_count: notifications.filter((notification) => !notification.read).length,
      });
      setIsNotificationOpen(true);
    },
    onOpenMenu: () => {
      trackEvent('app_menu_open', { active_tab: activeTab });
      setIsMenuOpen(true);
    },
    hasUnreadNotifications: notifications.some((notification) => !notification.read),
  };

  const usesFocusViewportBackground =
    appState === 'splash' ||
    appState === 'onboarding' ||
    appState === 'intake' ||
    appState === 'calibration' ||
    appState === 'tastick' ||
    appState === 'measurement' ||
    appState === 'improve-accuracy' ||
    isReservationFeedbackMapView ||
    isRestaurantDetailFeedbackMapView;
  const shouldShowMainShell =
    appState === 'main' &&
    (selectedRestaurantDetail !== null || activeTab !== 'reservation' || isReservationRootView);
  const shouldShowMainTopShell = shouldShowMainShell && selectedRestaurantDetail === null;
  const shouldShowMainBottomShell =
    shouldShowMainShell && !isReservationFeedbackMapView && !isRestaurantDetailFeedbackMapView;
  const shouldLetStatusBarShowContent =
    appState === 'main' && (isReservationFeedbackMapView || isRestaurantDetailFeedbackMapView);
  const viewportBackgroundColor = usesFocusViewportBackground
    ? FOCUS_VIEWPORT_BACKGROUND
    : PAGE_VIEWPORT_BACKGROUND;
  const userTasteAccentStyle = useMemo(
    () => createUserTasteAccentStyle(resolveUserTasteAccent(latestTasteMeasurementSnapshot)),
    [latestTasteMeasurementSnapshot],
  );

  useEffect(() => {
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    rootElement.style.backgroundColor = viewportBackgroundColor;
    bodyElement.style.backgroundColor = viewportBackgroundColor;

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', viewportBackgroundColor);
    }

    return () => {
      rootElement.style.backgroundColor = '';
      bodyElement.style.backgroundColor = '';

      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#ffffff');
      }
    };
  }, [viewportBackgroundColor]);

  return (
    <div
      className={`flex min-h-[var(--tb-viewport-height,100dvh)] items-center justify-center overflow-hidden transition-colors ${isLayeredMeasurementSheetOpen
        ? 'bg-black'
        : usesFocusViewportBackground
          ? 'bg-white'
          : 'bg-[var(--tb-color-bg-page)]'
        }`}
      style={userTasteAccentStyle}
    >
      <div
        ref={backgroundCardRef}
        className={`relative flex h-[var(--tb-viewport-height,100dvh)] w-full max-w-[1440px] origin-top flex-col overflow-hidden font-sans will-change-transform ${usesFocusViewportBackground ? 'bg-white' : 'bg-[var(--tb-color-bg-page)]'
          }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[var(--tb-safe-area-top)]"
          style={{
            backgroundColor: shouldLetStatusBarShowContent ? 'transparent' : viewportBackgroundColor,
          }}
        />
        {appState === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
        {appState === 'onboarding' && (
          <OnboardingScreen onComplete={handleStartInitialMeasurementFlow} />
        )}
        {appState === 'intake' && (
          <PreferenceIntakeScreen
            initialProfile={latestPreferenceIntakeProfile}
            onBack={() => setAppState('onboarding')}
            onComplete={(profile) => {
              setLatestPreferenceIntakeProfile(profile);
              handleEnterTasteSurveyFlow(true);
            }}
          />
        )}
        {appState === 'calibration' && tasteSurveyFlowStep === 'intro' && (
          <TasteSurveyIntroScreen
            activeStepIndex={0}
            actionLabel={
              hasCompleteTasteSurveyRespondentContext(tasteSurveyRespondentContext)
                ? '다시 작성'
                : '설문 시작'
            }
            onBack={handleExitTasteSurveyFlow}
            onReuseContext={
              hasCompleteTasteSurveyRespondentContext(tasteSurveyRespondentContext)
                ? () => {
                  setCurrentSurveyIndex(0);
                  setTasteSurveyFlowStep('questions');
                }
                : undefined
            }
            onStart={() => {
              setCurrentSurveyContextIndex(0);
              setTasteSurveyFlowStep('context');
            }}
            reuseContextLabel={
              hasCompleteTasteSurveyRespondentContext(tasteSurveyRespondentContext)
                ? '건너뛰기'
                : undefined
            }
          />
        )}
        {appState === 'calibration' && tasteSurveyFlowStep === 'questionsIntro' && (
          <TasteSurveyIntroScreen
            activeStepIndex={1}
            actionLabel="감각 반응으로 이어가기"
            onBack={() => {
              setCurrentSurveyContextIndex(Math.max(TASTE_SURVEY_CONTEXT_STEPS.length - 1, 0));
              setTasteSurveyFlowStep('context');
            }}
            onStart={() => {
              setCurrentSurveyIndex(0);
              setTasteSurveyFlowStep('questions');
            }}
          />
        )}
        {appState === 'calibration' && tasteSurveyFlowStep === 'profileIntro' && (
          <TasteSurveyIntroScreen
            activeStepIndex={2}
            actionLabel="응답 확인하기"
            onBack={() => {
              setCurrentSurveyIndex(Math.max(TASTE_SURVEY_ITEMS.length - 1, 0));
              setTasteSurveyFlowStep('questions');
            }}
            onStart={() => setTasteSurveyFlowStep('review')}
          />
        )}
        {appState === 'calibration' && tasteSurveyFlowStep === 'context' && (
          <TasteSurveyContextScreen
            context={tasteSurveyRespondentContext}
            currentIndex={currentSurveyContextIndex}
            onBack={handleBackFromTasteSurveyContext}
            onChange={handleChangeTasteSurveyRespondentContext}
            onContinue={handleNextTasteSurveyContext}
          />
        )}
        {appState === 'calibration' && tasteSurveyFlowStep === 'questions' && (
          <TasteSurveyScreen
            currentIndex={currentSurveyIndex}
            currentResponse={surveyResponses[TASTE_SURVEY_ITEMS[currentSurveyIndex]?.id ?? ''] ?? null}
            items={TASTE_SURVEY_ITEMS}
            onBack={handleBackFromSurveyQuestion}
            onNext={handleNextSurveyQuestion}
            onSelectLikert={handleSelectSurveyLikert}
            onSelectUncertain={handleSelectSurveyUncertain}
          />
        )}
        {appState === 'calibration' && tasteSurveyFlowStep === 'review' && (
          <TasteSurveyReviewScreen
            items={TASTE_SURVEY_ITEMS}
            onBack={() => {
              setTasteSurveyFlowStep('profileIntro');
            }}
            onEditItem={(index) => {
              setCurrentSurveyIndex(index);
              setTasteSurveyFlowStep('questions');
            }}
            onSubmit={handleSubmitTasteSurveyReview}
            responses={surveyResponses}
          />
        )}
        {appState === 'calibration' && tasteSurveyFlowStep === 'result' && (
          <TasteSurveyResultScreen
            compatibleResult={latestSurveyCompatibleResult}
            onComplete={handleCompleteTasteSurvey}
          />
        )}
        {appState === 'tastick' && (
          <TastickConnectScreen
            onConnect={() => setAppState('measurement')}
            onSkip={handleExitMeasurementFlow}
          />
        )}
        {appState === 'measurement' && (
          <TasteMeasurementScreen
            onComplete={(snapshot) => {
              setLatestTasteMeasurementSnapshot(snapshot);
              setLatestRestaurantReadyGuidance((current) =>
                current
                  ? mergeRestaurantReadyGuidanceWithSnapshot(current, snapshot, 'Building')
                  : createFallbackRestaurantReadyGuidance(snapshot),
              );
              setHasCompletedInitialMeasurement(true);
              setActiveTab('home');
              setAppState('main');
              handlePersistedMeasurement(snapshot, 'tastick');
            }}
            onBack={() => setAppState('tastick')}
          />
        )}
        {appState === 'improve-accuracy' && (
          <ImproveAccuracyScreen
            onConnectDevice={() => setAppState('tastick')}
            onSkip={() => {
              setAppState('main');
              goBackToPreviousMainLocation(measurementReturnTab);
            }}
          />
        )}

        {shouldShowMainTopShell || shouldShowMainBottomShell ? (
          <>
            {shouldShowMainTopShell ? (
              <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center">
                <div className="pointer-events-auto w-full max-w-[1440px]">
                  <TopAppBar
                    onStartMeasurement={() => handleStartMeasurementFromMain(activeTab)}
                    onOpenSearch={handleOpenGlobalSearch}
                    onOpenNotifications={overlayProps.onOpenNotifications}
                    onOpenMenu={overlayProps.onOpenMenu}
                    hasUnreadNotifications={overlayProps.hasUnreadNotifications}
                    onOpenProfile={handleOpenProfileIdentitySheet}
                    showSearchAction={activeTab !== 'home'}
                    userInitials={userInitials}
                    userAvatarImageSrc={profileAvatarDataUrl}
                    userAvatarStyle={userAvatarStyle}
                  />
                </div>
              </div>
            ) : null}
            {shouldShowMainBottomShell ? (
              <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
                <div className="pointer-events-auto w-full max-w-[1440px]">
                  <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <div
          className={`relative flex-1 overflow-hidden ${appState === 'main' ? 'block' : 'hidden'}`}
          style={
            appState === 'main'
              ? {
                paddingTop: shouldShowMainTopShell ? MAIN_APP_TOP_OFFSET : undefined,
                paddingBottom: shouldShowMainBottomShell ? MAIN_APP_BOTTOM_OFFSET : undefined,
              }
              : undefined
          }
        >
          {selectedRestaurantDetail ? (
            <RestaurantDetailPage
              measurementSnapshot={latestTasteMeasurementSnapshot}
              restaurant={selectedRestaurantDetail}
              onBack={() => goBackToPreviousMainLocation()}
              onFeedbackMapViewChange={setIsRestaurantDetailFeedbackMapView}
            />
          ) : (
            <>
              <div className={activeTab === 'home' ? 'h-full w-full' : 'hidden'}>
                <Home
                  hasMeasurementData={hasMeasurementData}
                  measurementSnapshot={latestTasteMeasurementSnapshot}
                  starterGuidance={latestRestaurantReadyGuidance}
                  onStartMeasurement={() => handleStartMeasurementFromMain('home')}
                  onStartRemeasurement={() => handleStartRemeasurementFromMain('home')}
                  onOpenRestaurantDetail={(chef) =>
                    openRestaurantDetail(createRestaurantDetailFromChefMatch(chef))
                  }
                  onOpenRestaurantDetailFromSearch={(result) =>
                    openRestaurantDetail(createRestaurantDetailFromSearchResult(result))
                  }
                  {...overlayProps}
                />
              </div>
              <div
                className={
                  activeTab === 'analysis' && latestTasteMeasurementSnapshot
                    ? 'h-full w-full animate-fadeIn'
                    : 'hidden'
                }
              >
                {latestTasteMeasurementSnapshot ? (
                  <AnalysisPage
                    isActive={activeTab === 'analysis'}
                    measurementSnapshot={latestTasteMeasurementSnapshot}
                    onOpenRestaurantDetail={(menu) =>
                      openRestaurantDetail(createRestaurantDetailFromMenuRecommendation(menu))
                    }
                    onStartMeasurement={() => handleStartMeasurementFromMain('analysis')}
                    {...overlayProps}
                  />
                ) : null}
              </div>
              <div
                className={
                  activeTab === 'reservation' && latestTasteMeasurementSnapshot
                    ? 'h-full w-full animate-fadeIn'
                    : 'hidden'
                }
              >
                {latestTasteMeasurementSnapshot ? (
                  <ReservationPage
                    measurementSnapshot={latestTasteMeasurementSnapshot}
                    starterGuidance={latestRestaurantReadyGuidance}
                    userAvatarImageSrc={profileAvatarDataUrl}
                    userAvatarStyle={userAvatarStyle}
                    userInitials={userInitials}
                    userNickname={currentUserNickname ?? currentUserDisplayName}
                    onFeedbackMapViewChange={setIsReservationFeedbackMapView}
                    onRootViewChange={setIsReservationRootView}
                    onOpenRestaurantDetail={(reservation) =>
                      openRestaurantDetail(createRestaurantDetailFromReservation(reservation))
                    }
                    onStartMeasurement={() => handleStartRemeasurementFromMain('reservation')}
                    {...overlayProps}
                  />
                ) : null}
              </div>
              <div
                className={
                  activeTab === 'profile' && latestTasteMeasurementSnapshot
                    ? 'h-full w-full animate-fadeIn'
                    : 'hidden'
                }
              >
                {latestTasteMeasurementSnapshot ? (
                  <ProfilePage
                    measurementSnapshot={latestTasteMeasurementSnapshot}
                    starterGuidance={latestRestaurantReadyGuidance}
                    onOpenSupportPanel={handleOpenSupportPanel}
                    onOpenRestaurantDetail={(chef) =>
                      openRestaurantDetail(createRestaurantDetailFromFavoriteChef(chef))
                    }
                    onStartMeasurement={() => handleStartMeasurementFromMain('profile')}
                    onNavigateToReservation={() => navigateToTab('reservation')}
                    {...overlayProps}
                  />
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Global Overlays */}
        {appState === 'main' ? (
          <HomeUnifiedSearch
            catalog={globalSearchCatalog}
            onOpenRestaurantDetail={(result) =>
              openRestaurantDetail(createRestaurantDetailFromSearchResult(result))
            }
            openTrigger={globalSearchTrigger}
            reservations={globalSearchReservations}
            showTrigger={false}
          />
        ) : null}

        <NotificationPanel
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={notifications}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        />
        <AppMenuDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onOpenSupportPanel={handleOpenSupportPanel}
          onOpenAuth={handleOpenAuthProfile}
          onStartMeasurement={() => handleStartMeasurementFromMain(activeTab)}
          onImproveAccuracy={handleOpenImproveAccuracy}
          onRequestLogout={handleRequestLogout}
          isAnonymousUser={isAnonymousUser}
          userEmail={currentUserEmail}
          userInitials={userInitials}
          userLabel={userLabel}
        />

        <AuthProfileDialog
          isAnonymous={isAnonymousUser}
          isConfigured={isSupabaseConfigured}
          isOpen={isAuthProfileOpen}
          message={authProfileMessage}
          status={authProfileStatus}
          userEmail={currentUserEmail}
          onClose={() => setIsAuthProfileOpen(false)}
          onRequestDeleteAccount={handleRequestDeleteAccount}
          onSubmitEmail={handleSubmitAuthEmail}
        />

        <BottomSheetShell
          open={isProfileIdentitySheetOpen}
          onOpenChange={setIsProfileIdentitySheetOpen}
          onDrag={(_, percentageDragged) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
          }}
          onRelease={(_, open) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
          }}
          contentClassName="h-[95vh] max-h-[95vh] bg-[var(--tb-color-bg-page)]"
          bodyClassName="px-5 pb-1 pt-2"
          headerCenter={
            <h2 className="text-[16px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
              프로필
            </h2>
          }
          headerEnd={<BottomSheetCloseButton />}
        >
          <ProfileIdentitySheetContent
            avatarImageDataUrl={profileAvatarDataUrl}
            avatarStyle={userAvatarStyle}
            birthDate={profileBirthDate}
            displayName={currentUserDisplayName}
            email={currentUserEmail}
            initials={userInitials}
            isAnonymous={isAnonymousUser}
            nickname={currentUserNickname}
            preferenceProfile={latestPreferenceIntakeProfile}
            respondentContext={tasteSurveyRespondentContext}
            userTasteAccentStyle={userTasteAccentStyle}
            onEditProfile={handleOpenProfileEditSheet}
            onLinkCurrentProfile={handleLinkCurrentProfileEmail}
          />
        </BottomSheetShell>

        <BottomSheetShell
          open={isProfileEditSheetOpen}
          onOpenChange={setIsProfileEditSheetOpen}
          onDrag={(_, percentageDragged) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
          }}
          onRelease={(_, open) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
          }}
          contentClassName="h-[95vh] max-h-[95vh] bg-[var(--tb-color-bg-page)]"
          bodyClassName="overflow-y-auto px-5 pb-1 pt-2"
          headerCenter={
            <h2 className="text-[16px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
              프로필 편집
            </h2>
          }
          headerStart={
            <BottomSheetIconButton
              ariaLabel="프로필로 돌아가기"
              icon={ChevronLeft}
              onClick={handleBackToProfileIdentitySheet}
            />
          }
          headerEnd={<BottomSheetCloseButton />}
          footer={
            <Button
              className="h-12 w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] hover:bg-[var(--tb-color-text-secondary)]"
              disabled={profileEditStatus === 'submitting'}
              form="profile-edit-sheet-form"
              type="submit"
            >
              {profileEditStatus === 'submitting' ? '저장 중' : '저장'}
            </Button>
          }
        >
          <ProfileEditSheetContent
            avatarImageDataUrl={profileAvatarDataUrl}
            avatarStyle={userAvatarStyle}
            birthDate={profileBirthDate}
            displayName={currentUserDisplayName}
            formId="profile-edit-sheet-form"
            initials={userInitials}
            nickname={currentUserNickname}
            preferenceProfile={latestPreferenceIntakeProfile}
            respondentContext={tasteSurveyRespondentContext}
            userTasteAccentStyle={userTasteAccentStyle}
            onSubmit={handleSubmitProfileEdit}
          />
        </BottomSheetShell>

        <BottomSheetShell
          open={isAuthEntrySheetOpen}
          onOpenChange={setIsAuthEntrySheetOpen}
          onDrag={(_, percentageDragged) => {
            if (authEntryStep === 'code') {
              applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
            }
          }}
          onRelease={(_, open) => {
            if (authEntryStep === 'code') {
              applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
            }
          }}
          contentClassName={
            authEntryStep === 'code'
              ? 'h-[95vh] max-h-[95vh]'
              : 'h-auto max-h-[72vh]'
          }
          bodyClassName="px-5 pb-1 pt-2"
          headerCenter={
            <h2 className="text-[16px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
              {authEntryIntent === 'link-current-profile' ? '계정 연결' : '로그인'}
            </h2>
          }
          headerStart={
            authEntryStep === 'code' ? (
              <BottomSheetIconButton
                ariaLabel="이메일 입력으로 돌아가기"
                icon={ChevronLeft}
                onClick={handleBackToAuthEntryEmail}
              />
            ) : undefined
          }
          headerEnd={
            authEntryStep === 'code' ? (
              <BottomSheetIconButton
                ariaLabel="로그인 닫기"
                icon={X}
                onClick={handleRequestCloseAuthEntry}
              />
            ) : (
              <BottomSheetCloseButton />
            )
          }
          footer={
            <div className="flex flex-col gap-3">
              <Button
                className="h-12 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] hover:bg-[var(--tb-color-text-secondary)]"
                disabled={!isSupabaseConfigured || authEntryStatus === 'submitting'}
                form="auth-entry-sheet-email-form"
                type="submit"
              >
                {authEntryStatus === 'submitting'
                  ? authEntryStep === 'code'
                    ? '확인 중'
                    : '코드 보내는 중'
                  : authEntryStep === 'code'
                    ? '인증 코드 확인'
                    : authEntryIntent === 'link-current-profile'
                      ? '연결 코드 받기'
                      : '다음'}
              </Button>
              {authEntryStep === 'email' && authEntryIntent === 'start-with-email' ? (
                <button
                  type="button"
                  onClick={continueAfterAuthEntry}
                  className="self-center px-2 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-muted)]"
                >
                  나중에 하기
                </button>
              ) : null}
              {import.meta.env.DEV ? (
                <button
                  type="button"
                  onClick={handleDevBypassAuthEntry}
                  className="self-center px-2 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-muted)]"
                >
                  개발용으로 인증 건너뛰기
                </button>
              ) : null}
            </div>
          }
          floatingLayer={
            isAuthEntryCancelConfirmOpen ? (
              <div
                className="flex h-full w-full items-center justify-center bg-black/45 px-5"
                onClick={() => setIsAuthEntryCancelConfirmOpen(false)}
              >
                <div
                  className="w-full max-w-[320px] rounded-[20px] bg-[var(--tb-color-bg-focus)] p-4 shadow-[var(--tb-shadow-drawer)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3 className="mb-4 text-center text-[16px] font-bold text-[var(--tb-color-text-primary)]">
                    취소하시겠습니까?
                  </h3>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmCloseAuthEntry}
                      className="h-11 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-border-subtle)]"
                    >
                      예, 종료하겠습니다
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAuthEntryCancelConfirmOpen(false)}
                      className="h-11 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-border-subtle)]"
                    >
                      아니요, 계속 진행하겠습니다.
                    </button>
                  </div>
                </div>
              </div>
            ) : null
          }
        >
          <AuthEntryForm
            formId="auth-entry-sheet-email-form"
            isConfigured={isSupabaseConfigured}
            isSubmitting={authEntryStatus === 'submitting'}
            message={authEntryMessage}
            pendingEmail={authEntryPendingEmail}
            status={authEntryStatus}
            step={authEntryStep}
            onSubmitCode={handleSubmitAuthEntryCode}
            onSubmitEmail={handleSubmitAuthEntryEmail}
          />
        </BottomSheetShell>

        <BottomSheetShell
          open={isProfileSetupSheetOpen}
          onOpenChange={setIsProfileSetupSheetOpen}
          onDrag={(_, percentageDragged) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
          }}
          onRelease={(_, open) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
          }}
          contentClassName="h-[95vh] max-h-[95vh]"
          bodyClassName="px-5 pb-1 pt-2"
          headerCenter={
            <h2 className="text-[16px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
              프로필 설정
            </h2>
          }
          headerEnd={<BottomSheetCloseButton />}
          footer={
            <Button
              className="h-12 w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] hover:bg-[var(--tb-color-text-secondary)]"
              disabled={profileSetupStatus === 'submitting'}
              form="profile-setup-sheet-form"
              type="submit"
            >
              {profileSetupStatus === 'submitting' ? '저장 중' : '프로필 저장'}
            </Button>
          }
        >
          <ProfileSetupSheetContent
            formId="profile-setup-sheet-form"
            isSubmitting={profileSetupStatus === 'submitting'}
            message={profileSetupMessage}
            status={profileSetupStatus}
            onSubmit={handleSubmitProfileSetup}
          />
        </BottomSheetShell>

        <BottomSheetShell
          open={isTasteSurveyIntroSheetOpen}
          onOpenChange={setIsTasteSurveyIntroSheetOpen}
          onDrag={(_, percentageDragged) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
          }}
          onRelease={(_, open) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
          }}
          contentClassName="h-[95vh] max-h-[95vh] bg-[var(--tb-color-bg-page)]"
          bodyClassName="p-0"
        >
          <TasteSurveyIntroScreen
            onBack={() => {
              setIsTasteSurveyIntroSheetOpen(false);
              if (tasteSurveyIntroReturnTarget === 'auth') {
                setAuthEntryStatus('idle');
                setAuthEntryMessage(null);
                setAuthEntryStep('email');
                setAuthEntryPendingEmail(null);
                setIsAuthEntrySheetOpen(true);
                return;
              }

              setIsProfileSetupSheetOpen(true);
            }}
            onReuseContext={handleSkipPreferenceIntakeSheet}
            onStart={handleStartPreferenceIntakeFromTasteSurveyIntro}
            reuseContextLabel="건너뛰기"
          />
        </BottomSheetShell>

        <BottomSheetShell
          open={isPreferenceIntakeSheetOpen}
          onOpenChange={setIsPreferenceIntakeSheetOpen}
          onDrag={(_, percentageDragged) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
          }}
          onRelease={(_, open) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
          }}
          contentClassName="h-[95vh] max-h-[95vh]"
          bodyClassName="p-0"
        >
          <PreferenceIntakeScreen
            initialProfile={latestPreferenceIntakeProfile}
            onBack={() => {
              setIsPreferenceIntakeSheetOpen(false);
              setIsTasteSurveyIntroSheetOpen(true);
            }}
            onComplete={handleCompletePreferenceIntakeSheet}
          />
        </BottomSheetShell>

        <BottomSheetShell
          open={isTasteSurveySheetOpen}
          onOpenChange={setIsTasteSurveySheetOpen}
          onDrag={(_, percentageDragged) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
          }}
          onRelease={(_, open) => {
            applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
          }}
          contentClassName="h-[95vh] max-h-[95vh] bg-[var(--tb-color-bg-page)]"
          bodyClassName="p-0"
        >
          {tasteSurveyFlowStep === 'intro' && (
            <TasteSurveyIntroScreen
              activeStepIndex={0}
              actionLabel={
                hasCompleteTasteSurveyRespondentContext(tasteSurveyRespondentContext)
                  ? '다시 작성'
                  : '설문 시작'
              }
              onBack={() => {
                setIsTasteSurveySheetOpen(false);
                setIsTasteSurveyIntroSheetOpen(true);
              }}
              onReuseContext={
                hasCompleteTasteSurveyRespondentContext(tasteSurveyRespondentContext)
                  ? () => {
                    setCurrentSurveyIndex(0);
                    setTasteSurveyFlowStep('questions');
                  }
                  : undefined
              }
              onStart={() => {
                setCurrentSurveyContextIndex(0);
                setTasteSurveyFlowStep('context');
              }}
              reuseContextLabel={
                hasCompleteTasteSurveyRespondentContext(tasteSurveyRespondentContext)
                  ? '건너뛰기'
                  : undefined
              }
            />
          )}
          {tasteSurveyFlowStep === 'questionsIntro' && (
            <TasteSurveyIntroScreen
              activeStepIndex={1}
              actionLabel="감각 반응으로 이어가기"
              onBack={() => {
                setCurrentSurveyContextIndex(Math.max(TASTE_SURVEY_CONTEXT_STEPS.length - 1, 0));
                setTasteSurveyFlowStep('context');
              }}
              onReuseContext={handleSkipTasteSurveySheetToHome}
              onStart={() => {
                setCurrentSurveyIndex(0);
                setTasteSurveyFlowStep('questions');
              }}
              reuseContextLabel="건너뛰기"
            />
          )}
          {tasteSurveyFlowStep === 'profileIntro' && (
            <TasteSurveyIntroScreen
              activeStepIndex={2}
              actionLabel="응답 확인하기"
              onBack={() => {
                setCurrentSurveyIndex(Math.max(TASTE_SURVEY_ITEMS.length - 1, 0));
                setTasteSurveyFlowStep('questions');
              }}
              onStart={() => setTasteSurveyFlowStep('review')}
            />
          )}
          {tasteSurveyFlowStep === 'context' && (
            <TasteSurveyContextScreen
              context={tasteSurveyRespondentContext}
              currentIndex={currentSurveyContextIndex}
              onBack={handleBackFromTasteSurveyContext}
              onChange={handleChangeTasteSurveyRespondentContext}
              onContinue={handleNextTasteSurveyContext}
            />
          )}
          {tasteSurveyFlowStep === 'questions' && (
            <TasteSurveyScreen
              currentIndex={currentSurveyIndex}
              currentResponse={surveyResponses[TASTE_SURVEY_ITEMS[currentSurveyIndex]?.id ?? ''] ?? null}
              items={TASTE_SURVEY_ITEMS}
              onBack={handleBackFromSurveyQuestion}
              onNext={handleNextSurveyQuestion}
              onSelectLikert={handleSelectSurveyLikert}
              onSelectUncertain={handleSelectSurveyUncertain}
            />
          )}
          {tasteSurveyFlowStep === 'review' && (
            <TasteSurveyReviewScreen
              items={TASTE_SURVEY_ITEMS}
              onBack={() => {
                setTasteSurveyFlowStep('profileIntro');
              }}
              onEditItem={(index) => {
                setCurrentSurveyIndex(index);
                setTasteSurveyFlowStep('questions');
              }}
              onSubmit={handleSubmitTasteSurveyReview}
              responses={surveyResponses}
            />
          )}
          {tasteSurveyFlowStep === 'result' && (
            <TasteSurveyResultScreen
              compatibleResult={latestSurveyCompatibleResult}
              onComplete={handleCompleteTasteSurvey}
            />
          )}
        </BottomSheetShell>

        <Dialog
          open={activeSupportPanel !== null}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseSupportPanel();
            }
          }}
        >
          {activeSupportPanel ? (
            <DialogContent className="max-w-[calc(100%-1rem)] rounded-[28px] border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] p-0 shadow-[var(--tb-shadow-drawer)] sm:max-w-[520px]">
              <DialogHeader className="px-5 pt-5">
                <DialogTitle className="text-[18px] text-[var(--tb-color-text-primary)]">
                  {activeSupportPanel === 'notification-settings'
                    ? '보정 알림 설정'
                    : activeSupportPanel === 'help'
                      ? '도움말'
                      : '앱 정보'}
                </DialogTitle>
                <DialogDescription className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {activeSupportPanel === 'notification-settings'
                    ? '다이닝 전 미각 측정 알림은 현재 프로필 기준으로 이어집니다.'
                    : activeSupportPanel === 'help'
                      ? 'Taste Buddy는 현재 입맛을 셰프가 읽기 쉬운 언어로 바꾸는 데서 시작합니다.'
                      : 'Taste Buddy v1.0.0은 다음 예약을 더 정교하게 맞추는 프리미엄 다이닝 개인화 서비스입니다.'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
                {activeSupportPanel === 'notification-settings' ? (
                  <>
                    <SectionCard hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          알림이 하는 일
                        </p>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          최근 측정과 예약 흐름을 기준으로, 다음 다이닝 전에 다시 점검하면 좋은 시점을 알려줍니다.
                        </p>
                      </div>
                    </SectionCard>
                    <SectionCard hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          어디서 확인하나요
                        </p>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          오른쪽 상단 알림 패널에서 예약, 피드백, 보정 관련 메시지를 모아볼 수 있어요.
                        </p>
                      </div>
                    </SectionCard>
                  </>
                ) : activeSupportPanel === 'help' ? (
                  <>
                    <SectionCard hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          1. 미각 설문
                        </p>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          최근 식사에서 반복된 감각 반응을 바탕으로 현재 입맛의 기준을 잡고, 첫 예약에 바로 쓸 수 있는 프로필을 만듭니다.
                        </p>
                      </div>
                    </SectionCard>
                    <SectionCard hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          2. 예약 개인화
                        </p>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          예약과 셰프 준비를 지금의 반응으로 해석해, 식사 전 전달이 더 자연스럽게 이어지도록 돕습니다.
                        </p>
                      </div>
                    </SectionCard>
                    <SectionCard hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          3. 식후 피드백
                        </p>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          한 줄 피드백만으로도 다음 예약과 셰프 가이드가 조금씩 더 정교해집니다.
                        </p>
                      </div>
                    </SectionCard>
                  </>
                ) : (
                  <>
                    <SectionCard hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          현재 버전
                        </p>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          Taste Buddy v1.0.0
                        </p>
                      </div>
                    </SectionCard>
                    <SectionCard hoverEffect={false}>
                      <div className="flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                          제품 방향
                        </p>
                        <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                          현재 입맛을 해석해, 다음 식사가 더 잘 맞도록 셰프와 사용자를 중간에서 연결합니다.
                        </p>
                      </div>
                    </SectionCard>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3 px-5 pb-5">
                <Button
                  type="button"
                  onClick={() => {
                    if (activeSupportPanel === 'help') {
                      handleStartMeasurementFromMain(activeTab);
                    } else if (activeSupportPanel === 'notification-settings') {
                      setIsNotificationOpen(true);
                    } else {
                      navigateToTab('profile');
                    }

                    handleCloseSupportPanel();
                  }}
                >
                  {activeSupportPanel === 'help'
                    ? '미각 재측정 시작'
                    : activeSupportPanel === 'notification-settings'
                      ? '알림 센터 열기'
                      : '프로필 보기'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseSupportPanel}>
                  닫기
                </Button>
              </div>
            </DialogContent>
          ) : null}
        </Dialog>

        <AlertDialog
          open={isLogoutConfirmOpen}
          onOpenChange={(open) => {
            setIsLogoutConfirmOpen(open);
          }}
        >
          <AlertDialogContent className="max-w-[calc(100%-1rem)] rounded-[28px] border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] sm:max-w-[440px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[18px] text-[var(--tb-color-text-primary)]">
                {currentUserEmail ? '로그아웃' : '프로필 초기화'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                {currentUserEmail
                  ? '이 기기에서 로그아웃하고 처음 화면으로 돌아갑니다. 이메일에 연결된 프로필은 다시 로그인하면 이어갈 수 있습니다.'
                  : '이 기기에 임시로 쌓인 프로필, 최근 검색, 디자인 런타임 상태를 지우고 처음 화면으로 돌아갑니다.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                {currentUserEmail ? '로그아웃' : '초기화'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isDeleteAccountConfirmOpen}
          onOpenChange={(open) => {
            if (!isDeletingAccount) {
              setIsDeleteAccountConfirmOpen(open);
            }
          }}
        >
          <AlertDialogContent className="max-w-[calc(100%-1rem)] rounded-[28px] border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] sm:max-w-[440px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[18px] text-[var(--tb-color-text-primary)]">
                계정 삭제
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                연결된 이메일 계정과 이 계정에 저장된 미각 프로필, 예약, 피드백 학습 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingAccount}>취소</AlertDialogCancel>
              <AlertDialogAction disabled={isDeletingAccount} onClick={handleDeleteAccount}>
                {isDeletingAccount ? '삭제 중' : '계정 삭제'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

type InternalRoute =
  | 'app'
  | 'design-system'
  | 'design-system-updates'
  | 'figma-works'
  | 'tastick-connect';

function getInternalRoute(): InternalRoute {
  if (typeof window === 'undefined') {
    return 'app';
  }

  const searchParams = new URLSearchParams(window.location.search);
  const previewMode = searchParams.get('preview');
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';

  if (previewMode === 'design-system' || normalizedPath === '/design-system') {
    return 'design-system';
  }

  if (previewMode === 'design-system-updates' || normalizedPath === '/design-system-updates') {
    return 'design-system-updates';
  }

  if (previewMode === 'figma-works' || normalizedPath === '/figma-works') {
    return 'figma-works';
  }

  if (previewMode === 'tastick-connect' || normalizedPath === '/tastick-connect') {
    return 'tastick-connect';
  }

  return 'app';
}

export default function App() {
  const [internalRoute, setInternalRoute] = useState<InternalRoute>(getInternalRoute);

  useEffect(() => {
    const syncRoute = () => {
      setInternalRoute(getInternalRoute());
    };

    window.addEventListener('popstate', syncRoute);

    return () => {
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  useEffect(() => {
    if (internalRoute !== 'design-system') {
      clearAppliedDesignTokenRuntimeState();
    }
  }, [internalRoute]);

  if (internalRoute === 'design-system') {
    return <DesignSystemPage />;
  }

  if (internalRoute === 'design-system-updates') {
    return <DesignSystemPreviewPage />;
  }

  if (internalRoute === 'figma-works') {
    return <FigmaWorksPreviewPage />;
  }

  if (internalRoute === 'tastick-connect') {
    return (
      <TastickConnectScreen
        initialDrawerOpen
        initialDrawerStep="power"
        onConnect={() => { }}
        onSkip={() => { }}
      />
    );
  }

  return <MainApp />;
}
