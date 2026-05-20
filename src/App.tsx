import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, UserPlus, X } from 'lucide-react';

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
import SavedRestaurantListPage from './pages/SavedRestaurantListPage';
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
import ActionOverlayCard from './components/system/ActionOverlayCard';
import {
  createTasteProfileAvatarInitials,
  createTasteProfileAvatarStyle,
} from './components/system/TasteProfileAvatar';
import ProfileIdentitySheetContent from './components/ProfileIdentitySheetContent';
import ProfileEditSheetContent from './components/ProfileEditSheetContent';
import ProfileSetupSheetContent from './components/ProfileSetupSheetContent';
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
  DEFAULT_TASTE_MEASUREMENT_RESULTS,
  createTasteMeasurementSnapshot,
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
  createFollowerCountNotification,
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
import type { RestaurantBookmarkRecord } from './components/restaurant/RestaurantBookmarkSheet';
import {
  RESERVATION_CATALOG,
  type ReservationRecord,
} from './constants/reservationCatalog';
import {
  deleteCurrentSupabaseAccount,
  ensureSupabaseSession,
  getCurrentSupabaseSession,
  hydrateSupabaseFriendSummary,
  hydrateSupabaseProfileConnections,
  hydrateSupabaseProfileIdentity,
  isAnonymousSupabaseSession,
  isMissingSupabaseEmailAccountError,
  isSupabaseConfigured,
  linkAnonymousSupabaseUserEmail,
  addSupabaseFriendByNickname,
  searchSupabaseProfilesByNickname,
  sendSupabaseEmailOtp,
  sendSupabaseMagicLink,
  signOutSupabaseSession,
  subscribeToSupabaseAuthState,
  updateSupabaseProfileIdentity,
  uploadSupabaseProfileAvatar,
  verifySupabaseEmailOtp,
  type DiningFriendProfile,
  type ProfileConnectionKind,
  type SupabaseEmailOtpIntent,
} from './lib/supabase';
import { resolvePublicMediaPath } from './lib/mediaAssets';
import { buildTasteSurveyCompatibleResult } from './lib/tasteSurveyScoring';
import { TASTE_SURVEY_ITEMS } from './constants/tasteSurveyItems';
import { TASTE_SURVEY_CONTEXT_STEPS } from './constants/tasteSurveyConfig';
import {
  createUserTasteAccentStyle,
  resolveUserTasteAccent,
} from './lib/userTasteAccent';
import { ICON_TOKENS, MOTION_TOKENS } from './constants/designTokens';
import {
  buildTasteSurveyMeasurementRawPayload,
  hasTasteSurveyRespondentContext,
  sanitizeTasteSurveyRespondentContext,
} from './lib/tasteSurveyPersistence';
import {
  deleteLocalProfileAvatar,
  loadLocalProfileAvatarObjectUrl,
  saveLocalProfileAvatar,
} from './lib/localProfileAvatar';
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
  isSavedRestaurantListOpen: boolean;
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
const EDGE_TO_EDGE_VIEWPORT_HEIGHT_CSS_VARIABLE = '--tb-edge-to-edge-viewport-height';
const BOTTOM_SHEET_STAGE_HEIGHT_CLASS =
  'h-[calc(var(--tb-viewport-height,100dvh)*0.95_-_var(--tb-safe-area-top)_-_12px)] max-h-[calc(var(--tb-viewport-height,100dvh)*0.95_-_var(--tb-safe-area-top)_-_12px)]';

const USER_STATE_STORAGE_KEY = 'tastebuddy-user-state-v5';
const FOLLOWER_COUNT_STORAGE_KEY = 'tastebuddy-last-seen-follower-count-v2';
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
  profileAvatarPath: string | null;
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

  const visualViewportHeight = window.visualViewport?.height ?? 0;
  const layoutViewportHeight = window.innerHeight;
  const documentViewportHeight = document.documentElement.clientHeight;
  return Math.max(
    visualViewportHeight,
    layoutViewportHeight,
    documentViewportHeight,
  );
}

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isTranslucentStandaloneStatusBar() {
  if (typeof document === 'undefined') {
    return false;
  }

  const statusBarMeta = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-status-bar-style"]',
  );

  return statusBarMeta?.content === 'black-translucent';
}

function getSafeAreaInsetTop() {
  if (typeof document === 'undefined') {
    return 0;
  }

  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.paddingTop = 'env(safe-area-inset-top)';
  document.body.appendChild(probe);
  const safeAreaTop = Number.parseFloat(window.getComputedStyle(probe).paddingTop);
  probe.remove();

  return Number.isFinite(safeAreaTop) ? safeAreaTop : 0;
}

function getEdgeToEdgeViewportHeight(visibleViewportHeight: number) {
  if (!isStandaloneDisplayMode() || !isTranslucentStandaloneStatusBar()) {
    return visibleViewportHeight;
  }

  const safeAreaTop = getSafeAreaInsetTop();
  const expandedViewportHeight = visibleViewportHeight + safeAreaTop;
  const screenHeight = window.screen?.height ?? 0;

  if (screenHeight > visibleViewportHeight) {
    return Math.min(screenHeight, expandedViewportHeight);
  }

  return visibleViewportHeight;
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
  return Boolean(context.birthDate && context.sexContext && context.smokingStatus);
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

function hasProfileIdentity(input: {
  displayName?: string | null;
  nickname?: string | null;
}) {
  return Boolean(input.displayName?.trim() || input.nickname?.trim());
}

function getUserInitials(displayName: string | null, email: string | null) {
  return createTasteProfileAvatarInitials(displayName, email);
}

function createEmptyPersistedUserState(): PersistedUserState {
  return {
    hasCompletedInitialMeasurement: false,
    latestPreferenceIntakeProfile: null,
    latestRestaurantReadyGuidance: null,
    latestTasteSurveyRespondentContext: {},
    latestTasteMeasurementSnapshot: null,
    profileAvatarDataUrl: null,
    profileAvatarPath: null,
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
    const profileAvatarPath =
      typeof parsedValue.profileAvatarPath === 'string' &&
        parsedValue.profileAvatarPath.trim().length > 0
        ? parsedValue.profileAvatarPath
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
      profileAvatarPath,
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
  const [tabResetKeys, setTabResetKeys] = useState<Record<TabType, number>>({
    analysis: 0,
    home: 0,
    profile: 0,
    reservation: 0,
  });
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
  const [profileAvatarPath, setProfileAvatarPath] = useState<string | null>(
    persistedUserState.profileAvatarPath,
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [hydratedProfileDisplayName, setHydratedProfileDisplayName] = useState<string | null>(null);
  const [hydratedProfileNickname, setHydratedProfileNickname] = useState<string | null>(null);
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
  const [profileEditMessage, setProfileEditMessage] = useState<string | null>(null);
  const [profileFollowerCount, setProfileFollowerCount] = useState(0);
  const [profileFollowingCount, setProfileFollowingCount] = useState(0);
  const [isProfileAvatarPreparing, setIsProfileAvatarPreparing] = useState(false);
  const [isProfileAvatarEditorOpen, setIsProfileAvatarEditorOpen] = useState(false);
  const [isProfileEditDeleteConfirmOpen, setIsProfileEditDeleteConfirmOpen] = useState(false);
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
  const [profileConnectionView, setProfileConnectionView] =
    useState<ProfileConnectionKind | null>(null);
  const [isSavedRestaurantListOpen, setIsSavedRestaurantListOpen] = useState(false);

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

    try {
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
          profileAvatarDataUrl: null,
          profileAvatarPath,
          profileBirthDate,
          tasteSurveyDraft: nextTasteSurveyDraft,
        } satisfies PersistedUserState),
      );
    } catch (error) {
      console.warn('Failed to persist Taste Buddy user state.', error);
    }
  }, [
    currentSurveyContextIndex,
    currentSurveyIndex,
    hasCompletedInitialMeasurement,
    latestPreferenceIntakeProfile,
    latestRestaurantReadyGuidance,
    latestTasteMeasurementSnapshot,
    profileAvatarPath,
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
  const sessionDisplayName = getSessionDisplayName(supabaseSession);
  const sessionNickname = getSessionNickname(supabaseSession);
  const currentUserDisplayName = hydratedProfileDisplayName ?? sessionDisplayName;
  const currentUserNickname = hydratedProfileNickname ?? sessionNickname;
  const currentUserProfileLabel = currentUserNickname ?? currentUserDisplayName;
  const isAnonymousUser = isSupabaseConfigured
    ? isAnonymousSupabaseSession(supabaseSession) || !currentUserEmail
    : true;
  const shouldShowAuthEntry = isSupabaseConfigured && isAnonymousUser;
  const userInitials = getUserInitials(currentUserDisplayName ?? currentUserNickname, currentUserEmail);
  const userLabel = currentUserProfileLabel || (currentUserEmail ? '프로필 연결됨' : 'Taste Buddy Guest');
  const userAvatarStyle = useMemo(
    () => createTasteProfileAvatarStyle(latestTasteMeasurementSnapshot),
    [latestTasteMeasurementSnapshot],
  );
  const profileAvatarImageSrc = useMemo(
    () => resolvePublicMediaPath(profileAvatarPath) ?? profileAvatarDataUrl,
    [profileAvatarDataUrl, profileAvatarPath],
  );

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const localAvatarObjectUrl = await loadLocalProfileAvatarObjectUrl();

        if (isCancelled || !localAvatarObjectUrl) {
          return;
        }

        setProfileAvatarDataUrl((currentUrl) => {
          if (currentUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(currentUrl);
          }

          return localAvatarObjectUrl;
        });
      } catch (error) {
        console.warn('Failed to load local profile avatar.', error);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseSession) {
      setHydratedProfileDisplayName(null);
      setHydratedProfileNickname(null);
      return;
    }

    let isCancelled = false;

    void (async () => {
      const result = await hydrateSupabaseProfileIdentity();

      if (isCancelled || !result.ok) {
        return;
      }

      setProfileAvatarPath(result.avatarPath);
      setHydratedProfileDisplayName(result.displayName);
      setHydratedProfileNickname(result.nickname);
      if (result.avatarPath) {
        setProfileAvatarDataUrl(null);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [supabaseSession?.user.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabaseSession) {
      setProfileFollowerCount(0);
      setProfileFollowingCount(0);
      return;
    }

    let isCancelled = false;

    void (async () => {
      const result = await hydrateSupabaseFriendSummary();

      if (isCancelled || !result.ok) {
        return;
      }

      setProfileFollowerCount(result.followerCount);
      setProfileFollowingCount(result.followingCount);
    })();

    return () => {
      isCancelled = true;
    };
  }, [supabaseSession?.user.id]);

  useEffect(() => {
    const userId = supabaseSession?.user.id;
    if (!isSupabaseConfigured || !userId) {
      return;
    }

    const storageKey = `${FOLLOWER_COUNT_STORAGE_KEY}:${userId}`;
    const storedValue = window.localStorage.getItem(storageKey);
    const lastSeenFollowerCount = storedValue ? Number.parseInt(storedValue, 10) : 0;

    if (Number.isNaN(lastSeenFollowerCount) || profileFollowerCount <= lastSeenFollowerCount) {
      window.localStorage.setItem(storageKey, String(profileFollowerCount));
      return;
    }

    window.localStorage.setItem(storageKey, String(profileFollowerCount));

    void (async () => {
      const currentNotifications = await hydrateNotifications();
      if (
        currentNotifications.some(
          (notification) => notification.title === '새 팔로워' && !notification.read,
        )
      ) {
        setNotifications(currentNotifications);
        return;
      }

      const createdNotification = await createFollowerCountNotification(profileFollowerCount);
      if (!createdNotification) {
        return;
      }

      const nextNotifications = await hydrateNotifications();
      setNotifications(nextNotifications);
    })();
  }, [profileFollowerCount, supabaseSession?.user.id]);

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab !== 'profile') {
      setProfileConnectionView(null);
    }
  }, [activeTab]);

  useEffect(() => {
    const rootElement = document.documentElement;

    const syncViewportHeight = () => {
      const viewportHeight = getVisibleViewportHeight();

      if (!viewportHeight) {
        return;
      }

      rootElement.style.setProperty(VIEWPORT_HEIGHT_CSS_VARIABLE, `${viewportHeight}px`);
      rootElement.style.setProperty(
        EDGE_TO_EDGE_VIEWPORT_HEIGHT_CSS_VARIABLE,
        `${getEdgeToEdgeViewportHeight(viewportHeight)}px`,
      );
    };

    syncViewportHeight();
    window.requestAnimationFrame(syncViewportHeight);
    const settleViewportTimer = window.setTimeout(syncViewportHeight, 250);
    const finalViewportTimer = window.setTimeout(syncViewportHeight, 1000);

    window.addEventListener('resize', syncViewportHeight);
    window.addEventListener('orientationchange', syncViewportHeight);
    window.visualViewport?.addEventListener('resize', syncViewportHeight);
    window.visualViewport?.addEventListener('scroll', syncViewportHeight);

    return () => {
      window.removeEventListener('resize', syncViewportHeight);
      window.removeEventListener('orientationchange', syncViewportHeight);
      window.visualViewport?.removeEventListener('resize', syncViewportHeight);
      window.visualViewport?.removeEventListener('scroll', syncViewportHeight);
      window.clearTimeout(settleViewportTimer);
      window.clearTimeout(finalViewportTimer);
      rootElement.style.removeProperty(VIEWPORT_HEIGHT_CSS_VARIABLE);
      rootElement.style.removeProperty(EDGE_TO_EDGE_VIEWPORT_HEIGHT_CSS_VARIABLE);
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
    isSavedRestaurantListOpen,
    selectedRestaurantDetail,
  });

  const isSameMainNavigationLocation = (
    left: MainNavigationLocation,
    right: MainNavigationLocation,
  ) =>
    left.activeTab === right.activeTab &&
    left.isSavedRestaurantListOpen === right.isSavedRestaurantListOpen &&
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
    setIsSavedRestaurantListOpen(location.isSavedRestaurantListOpen);
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
      isSavedRestaurantListOpen: false,
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
    setIsSavedRestaurantListOpen(false);
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

  const handleOpenSavedRestaurantList = () => {
    trackEvent('saved_restaurant_list_open', {
      active_tab: activeTab,
    });
    setProfileConnectionView(null);
    setIsSavedRestaurantListOpen(true);
  };

  const handleOpenSavedRestaurantDetail = (bookmark: RestaurantBookmarkRecord) => {
    openRestaurantDetail(
      createRestaurantDetailFromFavoriteChef({
        image: null,
        matchRate: 70,
        name: bookmark.chefName,
        restaurant: bookmark.restaurantName,
        taste: '감칠맛',
      }),
    );
  };

  const handleTabChange = (tab: TabType) => {
    trackEvent('tab_select', {
      from_tab: activeTab,
      to_tab: tab,
      from_restaurant_detail: Boolean(selectedRestaurantDetail),
    });
    setTabResetKeys((current) => ({
      ...current,
      [tab]: current[tab] + 1,
    }));
    setProfileConnectionView(null);
    setIsSavedRestaurantListOpen(false);
    setIsReservationFeedbackMapView(false);
    setIsRestaurantDetailFeedbackMapView(false);
    setSelectedRestaurantDetail(null);
    setActiveTab(tab);
  };

  const handleOpenProfileIdentitySheet = () => {
    trackEvent('profile_sheet_open', {
      is_anonymous_user: isAnonymousUser,
      has_avatar: Boolean(profileAvatarImageSrc),
    });
    setIsProfileIdentitySheetOpen(true);
  };

  const handleOpenProfileEditSheet = () => {
    trackEvent('profile_edit_open');
    setProfileEditStatus('idle');
    setProfileEditMessage(null);
    setIsProfileAvatarPreparing(false);
    setIsProfileAvatarEditorOpen(false);
    setIsProfileEditDeleteConfirmOpen(false);
    setIsProfileIdentitySheetOpen(false);
    setIsProfileEditSheetOpen(true);
  };

  const handleBackToProfileIdentitySheet = () => {
    trackEvent('profile_edit_back');
    setIsProfileAvatarEditorOpen(false);
    setIsProfileEditDeleteConfirmOpen(false);
    setIsProfileEditSheetOpen(false);
    setIsProfileIdentitySheetOpen(true);
  };

  const handleSubmitProfileEdit = async (input: {
    avatarFile: File | null;
    birthDate: string | null;
    displayName: string;
    nickname: string;
    preferenceProfile: PreferenceIntakeProfile;
    respondentContext: TasteSurveyRespondentContext;
    shouldRemoveAvatar: boolean;
  }) => {
    setProfileEditStatus('submitting');
    setProfileEditMessage(null);
    trackEvent('profile_edit_submit', {
      has_avatar: Boolean(input.avatarFile) || (!input.shouldRemoveAvatar && Boolean(profileAvatarImageSrc)),
      has_birth_date: Boolean(input.birthDate),
      has_display_name: Boolean(input.displayName.trim()),
      has_nickname: Boolean(input.nickname.trim()),
    });

    const sanitizedContext = sanitizeTasteSurveyRespondentContext(input.respondentContext);
    const nextDisplayName = input.displayName.trim();
    const nextNickname = input.nickname.trim();
    const currentDisplayName = currentUserDisplayName ?? '';
    const currentNickname = currentUserNickname ?? '';
    let nextAvatarPath = input.shouldRemoveAvatar ? null : profileAvatarPath;
    let nextLocalAvatarUrl: string | null = input.shouldRemoveAvatar ? null : profileAvatarDataUrl;
    let shouldSyncAvatarPath = input.shouldRemoveAvatar;

    if (input.shouldRemoveAvatar) {
      try {
        await deleteLocalProfileAvatar();
      } catch (error) {
        console.warn('Failed to delete local profile avatar.', error);
      }
    }

    if (input.avatarFile) {
      const avatarUploadResult = await uploadSupabaseProfileAvatar(input.avatarFile);

      if (avatarUploadResult.ok && avatarUploadResult.avatarPath) {
        nextAvatarPath = avatarUploadResult.avatarPath;
        nextLocalAvatarUrl = null;
        shouldSyncAvatarPath = true;
        try {
          await deleteLocalProfileAvatar();
        } catch (error) {
          console.warn('Failed to clear local profile avatar fallback.', error);
        }
      } else {
        try {
          nextLocalAvatarUrl = await saveLocalProfileAvatar(input.avatarFile);
          nextAvatarPath = null;
          shouldSyncAvatarPath = false;
          trackEvent('profile_edit_avatar_local_fallback', {
            reason: avatarUploadResult.message ?? 'edge_function_unavailable',
          });
        } catch (error) {
          trackEvent('profile_edit_error', { reason: 'avatar_local_fallback' });
          setProfileEditMessage(
            error instanceof Error
              ? error.message
              : '프로필 사진을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          );
          setProfileEditStatus('idle');
          return;
        }
      }
    }

    if (
      nextDisplayName !== currentDisplayName ||
      nextNickname !== currentNickname ||
      shouldSyncAvatarPath
    ) {
      const result = await updateSupabaseProfileIdentity({
        ...(shouldSyncAvatarPath ? { avatarPath: nextAvatarPath } : {}),
        displayName: nextDisplayName,
        nickname: nextNickname,
      });

      if (!result.ok) {
        trackEvent('profile_edit_error', { reason: 'identity_update' });
        setProfileEditMessage(
          result.message || '프로필 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
        setProfileEditStatus('idle');
        return;
      }

      const session = await getCurrentSupabaseSession();
      setSupabaseSession(session);
      setHydratedProfileDisplayName(nextDisplayName || nextNickname || null);
      setHydratedProfileNickname(nextNickname || null);
    }

    setProfileAvatarDataUrl((currentUrl) => {
      if (currentUrl?.startsWith('blob:') && currentUrl !== nextLocalAvatarUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return nextLocalAvatarUrl;
    });
    setProfileAvatarPath(nextAvatarPath);
    setProfileBirthDate(input.birthDate);
    setTasteSurveyRespondentContext(sanitizedContext);
    setLatestPreferenceIntakeProfile(input.preferenceProfile);
    setProfileEditStatus('idle');
    setProfileEditMessage(null);
    setIsProfileAvatarPreparing(false);
    setIsProfileEditSheetOpen(false);
    setIsProfileIdentitySheetOpen(true);
    trackEvent('profile_edit_complete');
  };

  const handleLinkCurrentProfileEmail = () => {
    trackEvent('profile_link_email_open');
    setIsProfileIdentitySheetOpen(false);
    openAuthEntrySheet('link-current-profile');
  };

  const handleSearchDiningFriends = async (query: string) => {
    trackEvent('friend_search_submit', {
      has_query: Boolean(query.trim()),
    });

    return searchSupabaseProfilesByNickname(query);
  };

  const handleAddDiningFriend = async (friend: DiningFriendProfile) => {
    trackEvent('friend_add_submit', {
      friend_id: friend.id,
    });

    const result = await addSupabaseFriendByNickname(friend.nickname);

    if (result.ok) {
      const summary = await hydrateSupabaseFriendSummary();
      if (summary.ok) {
        setProfileFollowerCount(summary.followerCount);
        setProfileFollowingCount(summary.followingCount);
      }
    }

    return result;
  };

  const refreshNotifications = async () => {
    const nextNotifications = await hydrateNotifications();
    setNotifications(nextNotifications);
    return nextNotifications;
  };

  const handleLoadProfileConnections = async (kind: ProfileConnectionKind) => {
    trackEvent('profile_connections_open', {
      kind,
    });

    return hydrateSupabaseProfileConnections(kind);
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

  const continueAfterVerifiedEmailLogin = async (session: Session | null) => {
    const identityResult = await hydrateSupabaseProfileIdentity();
    const sessionIdentity = {
      displayName: getSessionDisplayName(session),
      nickname: getSessionNickname(session),
    };
    const hasExistingIdentity =
      (identityResult.ok && hasProfileIdentity(identityResult)) ||
      hasProfileIdentity(sessionIdentity);

    if (identityResult.ok) {
      setProfileAvatarPath(identityResult.avatarPath);
      setHydratedProfileDisplayName(identityResult.displayName);
      setHydratedProfileNickname(identityResult.nickname);

      if (identityResult.avatarPath) {
        setProfileAvatarDataUrl(null);
      }
    }

    if (!hasExistingIdentity) {
      setProfileSetupStatus('idle');
      setProfileSetupMessage(null);
      setIsProfileSetupSheetOpen(true);
      return;
    }

    const remoteSnapshot = await hydrateLatestMeasurementSnapshot();

    if (remoteSnapshot) {
      setLatestTasteMeasurementSnapshot(remoteSnapshot);
      setHasCompletedInitialMeasurement(true);
      setLatestRestaurantReadyGuidance((current) =>
        current
          ? mergeRestaurantReadyGuidanceWithSnapshot(current, remoteSnapshot)
          : createFallbackRestaurantReadyGuidance(remoteSnapshot),
      );
      setActiveTab('home');
      setAppState('main');
      return;
    }

    if (hasMeasurementData) {
      setActiveTab('home');
      setAppState('main');
      return;
    }

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

    let effectiveIntent = authEntryIntent;
    let result = await sendSupabaseEmailOtp(email, authEntryIntent, {
      shouldCreateUser: authEntryIntent !== 'start-with-email',
    });

    if (
      authEntryIntent === 'start-with-email' &&
      isAnonymousUser &&
      !result.ok &&
      isMissingSupabaseEmailAccountError(result.message)
    ) {
      effectiveIntent = 'link-current-profile';
      trackEvent('auth_email_auto_signup_from_login', { reason: 'email_not_found' });
      result = await sendSupabaseEmailOtp(email, effectiveIntent);
    }

    trackEvent(result.ok ? 'auth_email_code_sent' : 'auth_email_code_error', {
      intent: effectiveIntent,
    });

    setAuthEntryStatus(result.ok ? 'success' : 'error');
    setAuthEntryMessage(
      result.ok
        ? effectiveIntent === 'link-current-profile'
          ? '현재 프로필을 연결할 인증 코드를 보냈습니다.'
          : '이메일로 인증 코드를 보냈습니다.'
        : result.message,
    );

    if (result.ok) {
      setAuthEntryIntent(effectiveIntent);
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

    await continueAfterVerifiedEmailLogin(session);
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
      setProfileSetupMessage('이름이나 버디네임 중 하나는 입력해 주세요.');
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
    setHydratedProfileDisplayName(input.displayName.trim() || input.nickname.trim() || null);
    setHydratedProfileNickname(input.nickname.trim() || null);
    setIsProfileSetupSheetOpen(false);
    setProfileSetupStatus('idle');
    setProfileSetupMessage(null);
    setTasteSurveyIntroReturnTarget('profile');
    setIsTasteSurveyIntroSheetOpen(true);
  };

  const handleStartTasteSurveyFromIntro = () => {
    trackEvent('taste_survey_intro_start', { source: 'taste_survey_intro_sheet' });
    handleOpenTasteSurveySheetFlow(true, 'context');
  };

  const handleOpenTasteSurveySheetFlow = (
    shouldClearResponses = false,
    initialStep: TasteSurveyFlowStep = 'intro',
  ) => {
    trackEvent('taste_survey_sheet_open', { should_clear_responses: shouldClearResponses });
    resetTasteSurveyFlow(shouldClearResponses);
    setTasteSurveyFlowStep(initialStep);
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
    handleOpenTasteSurveySheetFlow(true, 'context');
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

  const handleOpenExistingEmailLogin = () => {
    trackEvent('auth_existing_email_login_open', { is_anonymous_user: isAnonymousUser });
    setIsMenuOpen(false);
    openAuthEntrySheet('start-with-email');
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
    setIsProfileEditDeleteConfirmOpen(false);

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
      void refreshNotifications();
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
    shouldShowMainShell &&
    !isSavedRestaurantListOpen &&
    !isReservationFeedbackMapView &&
    !isRestaurantDetailFeedbackMapView;
  const profileConnectionTopBarTitle =
    activeTab === 'profile' && profileConnectionView
      ? profileConnectionView === 'followers'
        ? '팔로워'
        : '팔로잉'
      : null;
  const profileSavedListTopBarTitle =
    activeTab === 'profile' && isSavedRestaurantListOpen ? '테이스트 리스트' : null;
  const mainTopBarTitle = profileSavedListTopBarTitle ?? profileConnectionTopBarTitle;
  const shouldLetStatusBarShowContent =
    appState === 'main' && (isReservationFeedbackMapView || isRestaurantDetailFeedbackMapView);
  const usesPageViewportBackground =
    appState === 'splash' ||
    appState === 'main' ||
    appState === 'tastick' ||
    appState === 'measurement' ||
    appState === 'improve-accuracy' ||
    (appState === 'calibration' &&
      (tasteSurveyFlowStep === 'intro' ||
        tasteSurveyFlowStep === 'questionsIntro' ||
        tasteSurveyFlowStep === 'profileIntro')) ||
    isReservationFeedbackMapView ||
    isRestaurantDetailFeedbackMapView;
  const viewportBackgroundColor = usesPageViewportBackground
    ? PAGE_VIEWPORT_BACKGROUND
    : FOCUS_VIEWPORT_BACKGROUND;
  const userTasteAccentStyle = useMemo(
    () => createUserTasteAccentStyle(resolveUserTasteAccent(latestTasteMeasurementSnapshot)),
    [latestTasteMeasurementSnapshot],
  );

  useEffect(() => {
    const rootElement = document.documentElement;
    const accentEntries = Object.entries(userTasteAccentStyle);

    accentEntries.forEach(([propertyName, propertyValue]) => {
      rootElement.style.setProperty(propertyName, String(propertyValue));
    });

    return () => {
      accentEntries.forEach(([propertyName]) => {
        rootElement.style.removeProperty(propertyName);
      });
    };
  }, [userTasteAccentStyle]);

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
      className={`flex min-h-[var(--tb-edge-to-edge-viewport-height,var(--tb-viewport-height,100dvh))] items-center justify-center overflow-hidden transition-colors ${isLayeredMeasurementSheetOpen
        ? 'bg-black'
        : usesPageViewportBackground
          ? 'bg-[var(--tb-color-bg-page)]'
          : 'bg-white'
        }`}
      style={userTasteAccentStyle}
    >
      <div
        ref={backgroundCardRef}
        className={`relative flex h-[var(--tb-edge-to-edge-viewport-height,var(--tb-viewport-height,100dvh))] w-full max-w-[1440px] origin-top flex-col overflow-hidden font-sans will-change-transform ${usesPageViewportBackground ? 'bg-[var(--tb-color-bg-page)]' : 'bg-white'
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
            birthDate={profileBirthDate ?? tasteSurveyRespondentContext.birthDate ?? null}
            context={tasteSurveyRespondentContext}
            currentIndex={currentSurveyContextIndex}
            onBack={handleBackFromTasteSurveyContext}
            onBirthDateChange={setProfileBirthDate}
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
                    appearance={mainTopBarTitle ? 'solid' : 'default'}
                    showBack={Boolean(mainTopBarTitle)}
                    title={mainTopBarTitle ?? undefined}
                    onBack={() => {
                      if (profileSavedListTopBarTitle) {
                        setIsSavedRestaurantListOpen(false);
                        return;
                      }

                      setProfileConnectionView(null);
                    }}
                    onStartMeasurement={() => handleStartMeasurementFromMain(activeTab)}
                    onOpenSearch={handleOpenGlobalSearch}
                    onOpenNotifications={overlayProps.onOpenNotifications}
                    onOpenMenu={overlayProps.onOpenMenu}
                    hasUnreadNotifications={overlayProps.hasUnreadNotifications}
                    onOpenProfile={handleOpenProfileIdentitySheet}
                    showSearchAction={activeTab !== 'home'}
                    userInitials={userInitials}
                    userAvatarImageSrc={profileAvatarImageSrc}
                    userAvatarStyle={userAvatarStyle}
                    rightActions={
                      profileSavedListTopBarTitle ? (
                        <div
                          aria-hidden="true"
                          style={{
                            width: ICON_TOKENS.container.lg,
                            height: ICON_TOKENS.container.lg,
                          }}
                        />
                      ) : profileConnectionTopBarTitle ? (
                        <button
                          type="button"
                          onClick={handleOpenProfileIdentitySheet}
                          className="flex size-10 items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:bg-[var(--tb-color-surface-muted)]"
                          aria-label="친구 추가"
                        >
                          <UserPlus size={20} strokeWidth={2} />
                        </button>
                      ) : undefined
                    }
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
                  key={`home-${tabResetKeys.home}`}
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
                  onAddFriend={handleAddDiningFriend}
                  onSearchFriends={handleSearchDiningFriends}
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
                    key={`analysis-${tabResetKeys.analysis}`}
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
                    key={`reservation-${tabResetKeys.reservation}`}
                    measurementSnapshot={latestTasteMeasurementSnapshot}
                    starterGuidance={latestRestaurantReadyGuidance}
                    userAvatarImageSrc={profileAvatarImageSrc}
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
                {latestTasteMeasurementSnapshot && isSavedRestaurantListOpen ? (
                  <SavedRestaurantListPage
                    catalog={globalSearchCatalog}
                    fallbackRestaurants={globalSearchReservations}
                    onOpenFallbackRestaurant={(reservation) =>
                      openRestaurantDetail(createRestaurantDetailFromReservation(reservation))
                    }
                    onOpenRestaurant={handleOpenSavedRestaurantDetail}
                  />
                ) : latestTasteMeasurementSnapshot ? (
                  <ProfilePage
                    key={`profile-${tabResetKeys.profile}`}
                    measurementSnapshot={latestTasteMeasurementSnapshot}
                    profileIdentity={{
                      avatarImageDataUrl: profileAvatarImageSrc,
                      avatarStyle: userAvatarStyle,
                      displayName: currentUserDisplayName ?? currentUserNickname,
                      followerCount: profileFollowerCount,
                      followingCount: profileFollowingCount,
                      initials: userInitials,
                      nickname: currentUserNickname ?? currentUserDisplayName,
                    }}
                    starterGuidance={latestRestaurantReadyGuidance}
                    onAddFriend={handleAddDiningFriend}
                    activeConnectionView={profileConnectionView}
                    onConnectionViewChange={setProfileConnectionView}
                    onLoadConnections={handleLoadProfileConnections}
                    onOpenSupportPanel={handleOpenSupportPanel}
                    onOpenRestaurantDetail={(chef) =>
                      openRestaurantDetail(createRestaurantDetailFromFavoriteChef(chef))
                    }
                    onOpenSavedList={handleOpenSavedRestaurantList}
                    onStartMeasurement={() => handleStartMeasurementFromMain('profile')}
                    onNavigateToReservation={() => navigateToTab('reservation')}
                    onOpenProfileSettings={handleOpenProfileIdentitySheet}
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
            onAddFriend={handleAddDiningFriend}
            onOpenRestaurantDetail={(result) =>
              openRestaurantDetail(createRestaurantDetailFromSearchResult(result))
            }
            onSearchFriends={handleSearchDiningFriends}
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
          onOpenLogin={handleOpenExistingEmailLogin}
          onStartMeasurement={() => handleStartMeasurementFromMain(activeTab)}
          onImproveAccuracy={handleOpenImproveAccuracy}
          onRequestLogout={handleRequestLogout}
          isAnonymousUser={isAnonymousUser}
          userEmail={currentUserEmail}
          userAvatarImageSrc={profileAvatarImageSrc}
          userAvatarStyle={userAvatarStyle}
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
          contentClassName={`${BOTTOM_SHEET_STAGE_HEIGHT_CLASS} bg-[var(--tb-color-bg-page)]`}
          bodyClassName="px-5 pb-1 pt-2"
          headerCenter={
            <h2 className="text-[16px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
              프로필
            </h2>
          }
          headerEnd={<BottomSheetCloseButton />}
        >
          <ProfileIdentitySheetContent
            avatarImageDataUrl={profileAvatarImageSrc}
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
            friendCount={profileFollowingCount}
            onAddFriend={handleAddDiningFriend}
            onEditProfile={handleOpenProfileEditSheet}
            onLinkCurrentProfile={handleLinkCurrentProfileEmail}
            onSearchFriends={handleSearchDiningFriends}
          />
        </BottomSheetShell>

        <BottomSheetShell
          open={isProfileEditSheetOpen}
          dismissible={!isProfileAvatarEditorOpen}
          onOpenChange={(open) => {
            setIsProfileEditSheetOpen(open);
            if (!open) {
              setIsProfileAvatarEditorOpen(false);
              setIsProfileEditDeleteConfirmOpen(false);
            }
          }}
          onDrag={(_, percentageDragged) => {
            if (isProfileAvatarEditorOpen) {
              return;
            }

            applySheetBackgroundCardProgress(backgroundCardRef.current, 1 - percentageDragged, true);
          }}
          onRelease={(_, open) => {
            if (isProfileAvatarEditorOpen) {
              return;
            }

            applySheetBackgroundCardProgress(backgroundCardRef.current, open ? 1 : 0);
          }}
          overlayClassName={isProfileAvatarEditorOpen ? "pointer-events-none !bg-transparent" : undefined}
          contentClassName={
            isProfileAvatarEditorOpen
              ? "!fixed !bottom-0 !left-0 !right-0 !top-0 !z-[90] !mx-0 !mb-0 !mt-0 !h-[var(--tb-viewport-height,100dvh)] !max-h-none !w-screen !max-w-none !translate-y-0 !transform-none !rounded-none !border-0 !bg-[var(--tb-color-bg-page)] !shadow-none data-[vaul-drawer-direction=bottom]:!bottom-0 data-[vaul-drawer-direction=bottom]:!left-0 data-[vaul-drawer-direction=bottom]:!right-0 data-[vaul-drawer-direction=bottom]:!top-0 data-[vaul-drawer-direction=bottom]:!mt-0 data-[vaul-drawer-direction=bottom]:!max-h-none data-[vaul-drawer-direction=bottom]:!rounded-none data-[vaul-drawer-direction=bottom]:!border-t-0 [&>div:first-child]:hidden"
              : `${BOTTOM_SHEET_STAGE_HEIGHT_CLASS} bg-[var(--tb-color-bg-page)]`
          }
          bodyClassName={
            isProfileAvatarEditorOpen
              ? "relative overflow-hidden px-0 pb-0 pt-0"
              : "overflow-y-auto px-5 pb-1 pt-2"
          }
          headerCenter={
            isProfileAvatarEditorOpen
              ? undefined
              : (
                <h2 className="text-[16px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                  프로필 편집
                </h2>
              )
          }
          headerStart={
            isProfileAvatarEditorOpen
              ? undefined
              : (
                <BottomSheetIconButton
                  ariaLabel="프로필로 돌아가기"
                  icon={ChevronLeft}
                  onClick={handleBackToProfileIdentitySheet}
                />
              )
          }
          headerEnd={isProfileAvatarEditorOpen ? undefined : <BottomSheetCloseButton />}
          footer={
            isProfileAvatarEditorOpen
              ? undefined
              : (
                <div className="flex w-full flex-col gap-2">
                  <Button
                    className="h-12 w-full rounded-[var(--tb-radius-12)] bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[#df2b4d]"
                    disabled={profileEditStatus === 'submitting' || isProfileAvatarPreparing || isDeletingAccount}
                    type="button"
                    onClick={() => {
                      trackEvent('profile_edit_delete_account_request');
                      setIsProfileEditDeleteConfirmOpen(true);
                    }}
                  >
                    내 계정 삭제하기
                  </Button>
                  <Button
                    className="h-12 w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] hover:bg-[var(--tb-color-text-secondary)]"
                    disabled={profileEditStatus === 'submitting' || isProfileAvatarPreparing}
                    form="profile-edit-sheet-form"
                    type="submit"
                  >
                    {isProfileAvatarPreparing
                      ? '사진 준비 중'
                      : profileEditStatus === 'submitting'
                        ? '저장 중'
                        : '저장'}
                  </Button>
                </div>
              )
          }
          floatingLayer={
            isProfileEditDeleteConfirmOpen && !isProfileAvatarEditorOpen ? (
              <ActionOverlayCard
                layout="split"
                title="계속 하시겠습니까? 이 사용자의 모든 데이터가 완전히 삭제됩니다."
                actions={[
                  {
                    label: '아니오',
                    onClick: () => setIsProfileEditDeleteConfirmOpen(false),
                    disabled: isDeletingAccount,
                  },
                  {
                    label: isDeletingAccount ? '삭제 중' : '예',
                    onClick: handleDeleteAccount,
                    disabled: isDeletingAccount,
                    tone: 'destructive',
                  },
                ]}
              />
            ) : undefined
          }
        >
          <ProfileEditSheetContent
            avatarImageDataUrl={profileAvatarImageSrc}
            avatarStyle={userAvatarStyle}
            birthDate={profileBirthDate}
            displayName={currentUserDisplayName}
            formId="profile-edit-sheet-form"
            initials={userInitials}
            isSubmitting={profileEditStatus === 'submitting'}
            nickname={currentUserNickname}
            preferenceProfile={latestPreferenceIntakeProfile}
            respondentContext={tasteSurveyRespondentContext}
            statusMessage={profileEditMessage}
            userTasteAccentStyle={userTasteAccentStyle}
            onAvatarPreparationChange={setIsProfileAvatarPreparing}
            onAvatarEditorOpenChange={setIsProfileAvatarEditorOpen}
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
              ? BOTTOM_SHEET_STAGE_HEIGHT_CLASS
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
          contentClassName={BOTTOM_SHEET_STAGE_HEIGHT_CLASS}
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
          contentClassName={`${BOTTOM_SHEET_STAGE_HEIGHT_CLASS} bg-[var(--tb-color-bg-page)]`}
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
            onStart={handleStartTasteSurveyFromIntro}
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
          contentClassName={BOTTOM_SHEET_STAGE_HEIGHT_CLASS}
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
          contentClassName={`${BOTTOM_SHEET_STAGE_HEIGHT_CLASS} bg-[var(--tb-color-bg-focus)]`}
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
              birthDate={profileBirthDate ?? tasteSurveyRespondentContext.birthDate ?? null}
              context={tasteSurveyRespondentContext}
              currentIndex={currentSurveyContextIndex}
              onBack={handleBackFromTasteSurveyContext}
              onBirthDateChange={setProfileBirthDate}
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

        {activeSupportPanel ? (
          <ActionOverlayCard
            cardClassName="max-w-[360px]"
            title={
              activeSupportPanel === 'notification-settings'
                ? '보정 알림 설정'
                : activeSupportPanel === 'help'
                  ? '도움말'
                  : '앱 정보'
            }
            description={
              activeSupportPanel === 'notification-settings'
                ? '다이닝 전 미각 측정 알림은 현재 프로필 기준으로 이어집니다.'
                : activeSupportPanel === 'help'
                  ? 'Taste Buddy는 현재 입맛을 셰프가 읽기 쉬운 언어로 바꾸는 데서 시작합니다.'
                  : 'Taste Buddy v1.0.0은 다음 예약을 더 정교하게 맞추는 프리미엄 다이닝 개인화 서비스입니다.'
            }
            onBackdropClick={handleCloseSupportPanel}
            actions={[
              {
                label:
                  activeSupportPanel === 'help'
                    ? '미각 재측정 시작'
                    : activeSupportPanel === 'notification-settings'
                      ? '알림 센터 열기'
                      : '프로필 보기',
                onClick: () => {
                  if (activeSupportPanel === 'help') {
                    handleStartMeasurementFromMain(activeTab);
                  } else if (activeSupportPanel === 'notification-settings') {
                    setIsNotificationOpen(true);
                  } else {
                    navigateToTab('profile');
                  }

                  handleCloseSupportPanel();
                },
              },
              {
                label: '닫기',
                onClick: handleCloseSupportPanel,
              },
            ]}
          >
            <div className="flex w-full flex-col gap-3 text-left">
              {(activeSupportPanel === 'notification-settings'
                ? [
                  {
                    label: '알림이 하는 일',
                    body: '최근 측정과 예약 흐름을 기준으로, 다음 다이닝 전에 다시 점검하면 좋은 시점을 알려줍니다.',
                  },
                  {
                    label: '어디서 확인하나요',
                    body: '오른쪽 상단 알림 패널에서 예약, 피드백, 보정 관련 메시지를 모아볼 수 있어요.',
                  },
                ]
                : activeSupportPanel === 'help'
                  ? [
                    {
                      label: '1. 미각 설문',
                      body: '최근 식사에서 반복된 감각 반응을 바탕으로 현재 입맛의 기준을 잡고, 첫 예약에 바로 쓸 수 있는 프로필을 만듭니다.',
                    },
                    {
                      label: '2. 예약 개인화',
                      body: '예약과 셰프 준비를 지금의 반응으로 해석해, 식사 전 전달이 더 자연스럽게 이어지도록 돕습니다.',
                    },
                    {
                      label: '3. 식후 피드백',
                      body: '한 줄 피드백만으로도 다음 예약과 셰프 가이드가 조금씩 더 정교해집니다.',
                    },
                  ]
                  : [
                    {
                      label: '현재 버전',
                      body: 'Taste Buddy v1.0.0',
                    },
                    {
                      label: '제품 방향',
                      body: '현재 입맛을 해석해, 다음 식사가 더 잘 맞도록 셰프와 사용자를 중간에서 연결합니다.',
                    },
                  ]).map((item) => (
                    <div
                      key={item.label}
                      className="border-t border-[var(--tb-color-border-subtle)] pt-3 first:border-t-0 first:pt-0"
                    >
                      <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                        {item.body}
                      </p>
                    </div>
                  ))}
            </div>
          </ActionOverlayCard>
        ) : null}

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
