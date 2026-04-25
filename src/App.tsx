import { useEffect, useState } from 'react';

import Home from './pages/HomePage';
import AnalysisPage from './pages/AnalysisPage';
import DesignSystemPage from './pages/DesignSystemPage';
import DesignSystemPreviewPage from './pages/DesignSystemPreviewPage';
import FigmaWorksPreviewPage from './pages/FigmaWorksPreviewPage';
import ReservationPage from './pages/ReservationPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './pages/SplashScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import PreferenceIntakeScreen from './pages/PreferenceIntakeScreen';
import TasteSurveyIntroScreen from './pages/TasteSurveyIntroScreen';
import TasteSurveyContextScreen from './pages/TasteSurveyContextScreen';
import TasteSurveyScreen from './pages/TasteSurveyScreen';
import TasteSurveyReviewScreen from './pages/TasteSurveyReviewScreen';
import TasteSurveyResultScreen from './pages/TasteSurveyResultScreen';
import TeastickConnectScreen from './pages/TeastickConnectScreen';
import TasteMeasurementScreen from './pages/TasteMeasurementScreen';
import ImproveAccuracyScreen from './pages/ImproveAccuracyScreen';
import BottomTabBar, { type TabType } from './components/BottomTabBar';
import TopAppBar from './components/TopAppBar';
import NotificationPanel from './components/NotificationPanel';
import AppMenuDrawer, { type AppMenuSupportPanel } from './components/AppMenuDrawer';
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
import { type TasteMeasurementSnapshot } from './constants/tasteMeasurementData';
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
  persistTasteMeasurementSnapshot,
} from './lib/tasteBuddySupabase';
import { ensureSupabaseSession, isSupabaseConfigured } from './lib/supabase';
import { buildTasteSurveyCompatibleResult } from './lib/tasteSurveyScoring';
import { TASTE_SURVEY_ITEMS } from './constants/tasteSurveyItems';
import { TASTE_SURVEY_CONTEXT_STEPS } from './constants/tasteSurveyConfig';
import {
  buildTasteSurveyMeasurementRawPayload,
  hasTasteSurveyRespondentContext,
  sanitizeTasteSurveyRespondentContext,
} from './lib/tasteSurveyPersistence';
import type {
  TasteSurveyCompatibleResult,
  TasteSurveyLikertValue,
  TasteSurveyRespondentContext,
  TasteSurveyResponse,
} from './types/tasteSurvey';

type AppState =
  | 'splash'
  | 'onboarding'
  | 'intake'
  | 'calibration'
  | 'teastick'
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
const MAIN_APP_TOP_OFFSET = 'calc(var(--tb-safe-area-top) + var(--tb-size-top-app-bar-height))';
const MAIN_APP_BOTTOM_OFFSET =
  'calc(var(--tb-size-bottom-tab-bar-height) + var(--tb-safe-area-bottom))';

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
  latestTasteMeasurementSnapshot: TasteMeasurementSnapshot | null;
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

function loadPersistedUserState(): PersistedUserState {
  if (typeof window === 'undefined') {
    return {
      hasCompletedInitialMeasurement: false,
      latestPreferenceIntakeProfile: null,
      latestRestaurantReadyGuidance: null,
      latestTasteMeasurementSnapshot: null,
      tasteSurveyDraft: null,
    };
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

      return {
        hasCompletedInitialMeasurement: false,
        latestPreferenceIntakeProfile: null,
        latestRestaurantReadyGuidance: null,
        latestTasteMeasurementSnapshot: null,
        tasteSurveyDraft: null,
      };
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

    return {
      hasCompletedInitialMeasurement:
        Boolean(parsedValue.hasCompletedInitialMeasurement) && latestTasteMeasurementSnapshot !== null,
      latestPreferenceIntakeProfile,
      latestRestaurantReadyGuidance,
      latestTasteMeasurementSnapshot,
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
    return {
      hasCompletedInitialMeasurement: false,
      latestPreferenceIntakeProfile: null,
      latestRestaurantReadyGuidance: null,
      latestTasteMeasurementSnapshot: null,
      tasteSurveyDraft: null,
    };
  }
}

function MainApp() {
  const [persistedUserState] = useState<PersistedUserState>(loadPersistedUserState);
  const [appState, setAppState] = useState<AppState>('splash');
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
      persistedUserState.tasteSurveyDraft?.respondentContext ?? {},
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
    !isSupabaseConfigured,
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(getFallbackNotifications);

  // Overlay states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSupportPanel, setActiveSupportPanel] = useState<AppMenuSupportPanel | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isReservationRootView, setIsReservationRootView] = useState(true);

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
        latestTasteMeasurementSnapshot,
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
    surveyResponses,
    tasteSurveyFlowStep,
    tasteSurveyRespondentContext,
  ]);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      if (!isSupabaseConfigured) {
        setHasHydratedRemoteMeasurement(true);
        return;
      }

      await ensureSupabaseSession();
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handlePersistedMeasurement = (
    snapshot: TasteMeasurementSnapshot,
    source: 'quick_calibration' | 'teastick',
    options?: Parameters<typeof persistTasteMeasurementSnapshot>[2],
  ) => {
    void persistTasteMeasurementSnapshot(snapshot, source, options);
  };

  const handleSplashComplete = () => {
    setHasSplashDelayCompleted(true);
  };

  const handleStartInitialMeasurementFlow = () => {
    setAppState('intake');
  };

  const resetTasteSurveyFlow = (shouldClearResponses = false) => {
    setTasteSurveyFlowStep('intro');
    setCurrentSurveyContextIndex(0);
    setCurrentSurveyIndex(0);
    setLatestSurveyCompatibleResult(null);

    if (shouldClearResponses) {
      setSurveyResponses({});
      setTasteSurveyRespondentContext({});
    }
  };

  const handleEnterTasteSurveyFlow = (shouldClearResponses = false) => {
    resetTasteSurveyFlow(shouldClearResponses);
    setAppState('calibration');
  };

  const handleStartMeasurementFromMain = (originTab: TabType) => {
    setMeasurementEntryPoint('main');
    setMeasurementReturnTab(originTab);
    setAppState('teastick');
  };

  const handleStartRemeasurementFromMain = (originTab: TabType) => {
    setMeasurementEntryPoint('main');
    setMeasurementReturnTab(originTab);
    handleEnterTasteSurveyFlow(true);
  };

  const handleExitMeasurementFlow = () => {
    if (measurementEntryPoint === 'main') {
      setActiveTab(measurementReturnTab);
      setAppState('main');
      return;
    }

    setAppState('onboarding');
  };

  const handleExitTasteSurveyFlow = () => {
    if (measurementEntryPoint === 'main') {
      handleExitMeasurementFlow();
      return;
    }

    setAppState('intake');
  };

  const handleSelectSurveyLikert = (itemId: string, value: TasteSurveyLikertValue) => {
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
    if (currentSurveyContextIndex < TASTE_SURVEY_CONTEXT_STEPS.length - 1) {
      setCurrentSurveyContextIndex((previousIndex) => previousIndex + 1);
      return;
    }

    setTasteSurveyFlowStep('questionsIntro');
  };

  const handleBackFromTasteSurveyContext = () => {
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
    if (currentSurveyIndex < TASTE_SURVEY_ITEMS.length - 1) {
      setCurrentSurveyIndex((previousIndex) => previousIndex + 1);
      return;
    }

    setTasteSurveyFlowStep('profileIntro');
  };

  const handleBackFromSurveyQuestion = () => {
    if (currentSurveyIndex > 0) {
      setCurrentSurveyIndex((previousIndex) => previousIndex - 1);
      return;
    }

    setCurrentSurveyContextIndex(Math.max(TASTE_SURVEY_CONTEXT_STEPS.length - 1, 0));
    setTasteSurveyFlowStep('context');
  };

  const handleSubmitTasteSurveyReview = () => {
    const compatibleResult = buildCompatibleResultFromSurveyResponses(surveyResponses);

    setLatestSurveyCompatibleResult(compatibleResult);
    setTasteSurveyFlowStep('result');
  };

  const handleCompleteTasteSurvey = () => {
    const compatibleResult =
      latestSurveyCompatibleResult ?? buildCompatibleResultFromSurveyResponses(surveyResponses);

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
    setActiveTab(measurementEntryPoint === 'main' ? measurementReturnTab : 'home');
    setAppState('main');
  };

  const handleOpenImproveAccuracy = () => {
    setMeasurementEntryPoint('main');
    setMeasurementReturnTab(activeTab);
    setAppState('improve-accuracy');
  };

  const handleOpenSupportPanel = (panel: AppMenuSupportPanel) => {
    setIsMenuOpen(false);
    setActiveSupportPanel(panel);
  };

  const handleCloseSupportPanel = () => {
    setActiveSupportPanel(null);
  };

  const handleRequestLogout = () => {
    setIsMenuOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith('tastebuddy-'))
        .forEach((key) => window.localStorage.removeItem(key));
    }

    clearAppliedDesignTokenRuntimeState();

    window.location.reload();
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
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
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );

    void markAllNotificationsAsRead();
  };

  // Common overlay props
  const overlayProps = {
    onOpenNotifications: () => setIsNotificationOpen(true),
    onOpenMenu: () => setIsMenuOpen(true),
    hasUnreadNotifications: notifications.some((notification) => !notification.read),
  };

  const isImmersiveWhiteShell =
    appState === 'onboarding' || appState === 'intake' || appState === 'calibration';
  const shouldShowMainShell =
    appState === 'main' && (activeTab !== 'reservation' || isReservationRootView);

  useEffect(() => {
    const nextBackgroundColor = isImmersiveWhiteShell ? '#ffffff' : '#f3f3f3';
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    rootElement.style.backgroundColor = nextBackgroundColor;
    bodyElement.style.backgroundColor = nextBackgroundColor;

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', nextBackgroundColor);
    }

    return () => {
      rootElement.style.backgroundColor = '';
      bodyElement.style.backgroundColor = '';

      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#ffffff');
      }
    };
  }, [isImmersiveWhiteShell]);

  return (
    <div
      className={`flex min-h-[100dvh] items-center justify-center overflow-hidden ${isImmersiveWhiteShell ? 'bg-white' : 'bg-[var(--tb-color-bg-page)]'
        }`}
    >
      <div
        className={`relative flex h-[100dvh] w-full max-w-[1440px] flex-col overflow-hidden font-sans ${isImmersiveWhiteShell ? 'bg-white' : 'bg-[var(--tb-color-bg-page)]'
          }`}
      >
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
            actionLabel="설문 시작"
            onBack={handleExitTasteSurveyFlow}
            onStart={() => {
              setCurrentSurveyContextIndex(0);
              setTasteSurveyFlowStep('context');
            }}
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
        {appState === 'teastick' && (
          <TeastickConnectScreen
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
              handlePersistedMeasurement(snapshot, 'teastick');
            }}
            onBack={() => setAppState('teastick')}
          />
        )}
        {appState === 'improve-accuracy' && (
          <ImproveAccuracyScreen
            onConnectDevice={() => setAppState('teastick')}
            onSkip={() => {
              setActiveTab(measurementReturnTab);
              setAppState('main');
            }}
          />
        )}

        {shouldShowMainShell ? (
          <>
            <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center">
              <div className="pointer-events-auto w-full max-w-[1440px]">
                <TopAppBar
                  onStartMeasurement={() => handleStartMeasurementFromMain(activeTab)}
                  onOpenNotifications={overlayProps.onOpenNotifications}
                  onOpenMenu={overlayProps.onOpenMenu}
                  hasUnreadNotifications={overlayProps.hasUnreadNotifications}
                />
              </div>
            </div>
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
              <div className="pointer-events-auto w-full max-w-[1440px]">
                <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
              </div>
            </div>
          </>
        ) : null}

        <div
          className={`relative flex-1 overflow-hidden ${appState === 'main' ? 'block' : 'hidden'}`}
          style={
            appState === 'main'
              ? {
                paddingTop: shouldShowMainShell ? MAIN_APP_TOP_OFFSET : undefined,
                paddingBottom: shouldShowMainShell ? MAIN_APP_BOTTOM_OFFSET : undefined,
              }
              : undefined
          }
        >
          <div className={activeTab === 'home' ? 'h-full w-full' : 'hidden'}>
            <Home
              hasMeasurementData={hasMeasurementData}
              measurementSnapshot={latestTasteMeasurementSnapshot}
              starterGuidance={latestRestaurantReadyGuidance}
              onStartMeasurement={() => handleStartMeasurementFromMain('home')}
              onStartRemeasurement={() => handleStartRemeasurementFromMain('home')}
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
                onRootViewChange={setIsReservationRootView}
                onStartMeasurement={() => handleStartMeasurementFromMain('reservation')}
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
                onStartMeasurement={() => handleStartMeasurementFromMain('profile')}
                onNavigateToReservation={(chefName: string) => {
                  setActiveTab('reservation');
                }}
                {...overlayProps}
              />
            ) : null}
          </div>
        </div>

        {/* Global Overlays */}
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
          onStartMeasurement={() => handleStartMeasurementFromMain(activeTab)}
          onImproveAccuracy={handleOpenImproveAccuracy}
          onRequestLogout={handleRequestLogout}
        />

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
                      setActiveTab('profile');
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
                로그아웃
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                현재 프로필, 최근 검색, 디자인 런타임 상태를 지우고 처음 화면으로 돌아갑니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

type InternalRoute = 'app' | 'design-system' | 'design-system-updates' | 'figma-works';

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

  return <MainApp />;
}
