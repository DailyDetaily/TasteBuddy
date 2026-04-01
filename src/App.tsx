import { useEffect, useState } from 'react';

import Home from './imports/Home';
import AnalysisPage from './pages/AnalysisPage';
import DesignSystemPage from './pages/DesignSystemPage';
import DesignSystemPreviewPage from './pages/DesignSystemPreviewPage';
import ReservationPage from './pages/ReservationPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './pages/SplashScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import QuickTasteCalibrationScreen from './pages/QuickTasteCalibrationScreen';
import TeastickConnectScreen from './pages/TeastickConnectScreen';
import TasteMeasurementScreen from './pages/TasteMeasurementScreen';
import ImproveAccuracyScreen from './pages/ImproveAccuracyScreen';
import BottomTabBar, { type TabType } from './components/BottomTabBar';
import NotificationPanel from './components/NotificationPanel';
import AppMenuDrawer from './components/AppMenuDrawer';
import { type TasteMeasurementSnapshot } from './constants/tasteMeasurementData';
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

const USER_STATE_STORAGE_KEY = 'tastebuddy-user-state-v3';
const LEGACY_USER_STATE_STORAGE_KEYS = [
  'tastebuddy-user-state-v1',
  'tastebuddy-user-state-v2',
] as const;

interface PersistedUserState {
  hasCompletedInitialMeasurement: boolean;
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
      latestTasteMeasurementSnapshot: null,
    };
  }

  try {
    const rawValue = window.localStorage.getItem(USER_STATE_STORAGE_KEY);

    if (!rawValue) {
      LEGACY_USER_STATE_STORAGE_KEYS.forEach((storageKey) => {
        window.localStorage.removeItem(storageKey);
      });

      return {
        hasCompletedInitialMeasurement: false,
        latestTasteMeasurementSnapshot: null,
      };
    }

    const parsedValue = JSON.parse(rawValue) as Partial<PersistedUserState>;
    const latestTasteMeasurementSnapshot = isTasteMeasurementSnapshot(
      parsedValue.latestTasteMeasurementSnapshot,
    )
      ? parsedValue.latestTasteMeasurementSnapshot
      : null;

    return {
      hasCompletedInitialMeasurement:
        Boolean(parsedValue.hasCompletedInitialMeasurement) && latestTasteMeasurementSnapshot !== null,
      latestTasteMeasurementSnapshot,
    };
  } catch {
    return {
      hasCompletedInitialMeasurement: false,
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
  const [hasSplashDelayCompleted, setHasSplashDelayCompleted] = useState(false);
  const [hasHydratedRemoteMeasurement, setHasHydratedRemoteMeasurement] = useState(
    !isSupabaseConfigured,
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(getFallbackNotifications);

  // Overlay states
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(
      USER_STATE_STORAGE_KEY,
      JSON.stringify({
        hasCompletedInitialMeasurement,
        latestTasteMeasurementSnapshot,
      } satisfies PersistedUserState),
    );
  }, [hasCompletedInitialMeasurement, latestTasteMeasurementSnapshot]);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--tb-color-bg-page)]">
      <div className="relative flex h-screen w-full max-w-[1440px] flex-col overflow-hidden bg-[var(--tb-color-bg-page)] font-sans shadow-2xl">
        {appState === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
        {appState === 'onboarding' && (
          <OnboardingScreen onComplete={handleStartInitialMeasurementFlow} />
        )}
        {appState === 'calibration' && (
          <QuickTasteCalibrationScreen
            onBack={() => setAppState('onboarding')}
            onComplete={(snapshot) => {
              setLatestTasteMeasurementSnapshot(snapshot);
              setHasCompletedInitialMeasurement(true);
              setActiveTab('analysis');
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
              setHasCompletedInitialMeasurement(true);
              setActiveTab('analysis');
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

        <div className={`flex-1 overflow-hidden ${appState === 'main' ? 'block' : 'hidden'}`}>
          <div className={activeTab === 'home' ? 'h-full w-full' : 'hidden'}>
            <Home
              hasMeasurementData={hasMeasurementData}
              measurementSnapshot={latestTasteMeasurementSnapshot}
              onStartMeasurement={() => handleStartMeasurementFromMain('home')}
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
                onStartMeasurement={() => handleStartMeasurementFromMain('profile')}
                onNavigateToReservation={(chefName: string) => {
                  setActiveTab('reservation');
                }}
                {...overlayProps}
              />
            ) : null}
          </div>
        </div>

        {appState === 'main' && (
          <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        )}

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

type InternalRoute = 'app' | 'design-system' | 'design-system-updates';

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

  if (previewMode === 'design-system-updates') {
    return 'design-system-updates';
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

  if (internalRoute === 'design-system') {
    return <DesignSystemPage />;
  }

  if (internalRoute === 'design-system-updates') {
    return <DesignSystemPreviewPage />;
  }

  return <MainApp />;
}
