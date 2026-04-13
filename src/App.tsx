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
import QuickTasteCalibrationScreen from './pages/QuickTasteCalibrationScreen';
import TeastickConnectScreen from './pages/TeastickConnectScreen';
import TasteMeasurementScreen from './pages/TasteMeasurementScreen';
import ImproveAccuracyScreen from './pages/ImproveAccuracyScreen';
import BottomTabBar, { type TabType } from './components/BottomTabBar';
import TopAppBar from './components/TopAppBar';
import NotificationPanel from './components/NotificationPanel';
import AppMenuDrawer from './components/AppMenuDrawer';
import { type TasteMeasurementSnapshot } from './constants/tasteMeasurementData';
import {
  createFallbackRestaurantReadyGuidance,
  isRestaurantReadyGuidance,
  mergeRestaurantReadyGuidanceWithSnapshot,
  type RestaurantReadyGuidance,
} from './constants/quickTasteCalibrationData';
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

type AppState = 'splash' | 'onboarding' | 'calibration' | 'teastick' | 'measurement' | 'improve-accuracy' | 'main';
type MeasurementEntryPoint = 'initial' | 'main';
const MAIN_APP_TOP_OFFSET = 'calc(var(--tb-safe-area-top) + var(--tb-size-top-app-bar-height))';
const MAIN_APP_BOTTOM_OFFSET =
  'calc(var(--tb-size-bottom-tab-bar-height) + var(--tb-safe-area-bottom))';

const USER_STATE_STORAGE_KEY = 'tastebuddy-user-state-v4';
const LEGACY_USER_STATE_STORAGE_KEYS = [
  'tastebuddy-user-state-v1',
  'tastebuddy-user-state-v2',
  'tastebuddy-user-state-v3',
] as const;

interface PersistedUserState {
  hasCompletedInitialMeasurement: boolean;
  latestRestaurantReadyGuidance: RestaurantReadyGuidance | null;
  latestTasteMeasurementSnapshot: TasteMeasurementSnapshot | null;
}

function isTasteMeasurementSnapshot(value: unknown): value is TasteMeasurementSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as TasteMeasurementSnapshot;

  return typeof snapshot.measuredAt === 'string' && typeof snapshot.results === 'object';
}

function loadPersistedUserState(): PersistedUserState {
  if (typeof window === 'undefined') {
    return {
      hasCompletedInitialMeasurement: false,
      latestRestaurantReadyGuidance: null,
      latestTasteMeasurementSnapshot: null,
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
        latestRestaurantReadyGuidance: null,
        latestTasteMeasurementSnapshot: null,
      };
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PersistedUserState>;
    const latestTasteMeasurementSnapshot = isTasteMeasurementSnapshot(
      parsedValue.latestTasteMeasurementSnapshot,
    )
      ? parsedValue.latestTasteMeasurementSnapshot
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
      latestRestaurantReadyGuidance,
      latestTasteMeasurementSnapshot,
    };
  } catch {
    return {
      hasCompletedInitialMeasurement: false,
      latestRestaurantReadyGuidance: null,
      latestTasteMeasurementSnapshot: null,
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
  const [hasSplashDelayCompleted, setHasSplashDelayCompleted] = useState(false);
  const [hasHydratedRemoteMeasurement, setHasHydratedRemoteMeasurement] = useState(
    !isSupabaseConfigured,
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(getFallbackNotifications);

  // Overlay states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReservationRootView, setIsReservationRootView] = useState(true);

  useEffect(() => {
    window.localStorage.setItem(
      USER_STATE_STORAGE_KEY,
      JSON.stringify({
        hasCompletedInitialMeasurement,
        latestRestaurantReadyGuidance,
        latestTasteMeasurementSnapshot,
      } satisfies PersistedUserState),
    );
  }, [
    hasCompletedInitialMeasurement,
    latestRestaurantReadyGuidance,
    latestTasteMeasurementSnapshot,
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

    setAppState('onboarding');
  }, [
    appState,
    hasHydratedRemoteMeasurement,
    hasMeasurementData,
    hasSplashDelayCompleted,
  ]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handlePersistedMeasurement = (
    snapshot: TasteMeasurementSnapshot,
    source: 'quick_calibration' | 'teastick',
  ) => {
    void persistTasteMeasurementSnapshot(snapshot, source);
  };

  const handleSplashComplete = () => {
    setHasSplashDelayCompleted(true);
  };

  const handleStartInitialMeasurementFlow = () => {
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
    setAppState('calibration');
  };

  const handleExitMeasurementFlow = () => {
    if (measurementEntryPoint === 'main') {
      setActiveTab(measurementReturnTab);
      setAppState('main');
      return;
    }

    setAppState('onboarding');
  };

  const handleOpenImproveAccuracy = () => {
    setMeasurementEntryPoint('main');
    setMeasurementReturnTab(activeTab);
    setAppState('improve-accuracy');
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
    appState === 'onboarding' || appState === 'calibration';
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
      className={`flex min-h-[100dvh] items-center justify-center overflow-hidden ${
        isImmersiveWhiteShell ? 'bg-white' : 'bg-[var(--tb-color-bg-page)]'
      }`}
    >
      <div
        className={`relative flex h-[100dvh] w-full max-w-[1440px] flex-col overflow-hidden font-sans shadow-2xl ${
          isImmersiveWhiteShell ? 'bg-white' : 'bg-[var(--tb-color-bg-page)]'
        }`}
      >
        {appState === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
        {appState === 'onboarding' && (
          <OnboardingScreen onComplete={handleStartInitialMeasurementFlow} />
        )}
        {appState === 'calibration' && (
          <QuickTasteCalibrationScreen
            onBack={() => {
              if (measurementEntryPoint === 'main') {
                handleExitMeasurementFlow();
                return;
              }

              setAppState('onboarding');
            }}
            onComplete={({ snapshot, starterGuidance }) => {
              setLatestTasteMeasurementSnapshot(snapshot);
              setLatestRestaurantReadyGuidance(starterGuidance);
              setHasCompletedInitialMeasurement(true);
              setActiveTab(measurementEntryPoint === 'main' ? measurementReturnTab : 'home');
              setAppState('main');
              handlePersistedMeasurement(snapshot, 'quick_calibration');
            }}
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
          onStartMeasurement={() => handleStartMeasurementFromMain(activeTab)}
          onImproveAccuracy={handleOpenImproveAccuracy}
        />
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
