import { useEffect, useState } from 'react';

import Home from './imports/Home';
import AnalysisPage from './pages/AnalysisPage';
import ReservationPage from './pages/ReservationPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './pages/SplashScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import TeastickConnectScreen from './pages/TeastickConnectScreen';
import TasteMeasurementScreen from './pages/TasteMeasurementScreen';
import BottomTabBar, { type TabType } from './components/BottomTabBar';
import { type TasteMeasurementSnapshot } from './constants/tasteMeasurementData';

type AppState = 'splash' | 'onboarding' | 'teastick' | 'measurement' | 'main';
type MeasurementEntryPoint = 'initial' | 'main';

const USER_STATE_STORAGE_KEY = 'tastebuddy-user-state-v1';

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

export default function App() {
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

  useEffect(() => {
    window.localStorage.setItem(
      USER_STATE_STORAGE_KEY,
      JSON.stringify({
        hasCompletedInitialMeasurement,
        latestTasteMeasurementSnapshot,
      } satisfies PersistedUserState),
    );
  }, [hasCompletedInitialMeasurement, latestTasteMeasurementSnapshot]);

  const hasMeasurementData =
    hasCompletedInitialMeasurement && latestTasteMeasurementSnapshot !== null;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleSplashComplete = () => {
    if (hasMeasurementData) {
      setActiveTab('home');
      setAppState('main');
      return;
    }

    setAppState('onboarding');
  };

  const handleStartInitialMeasurementFlow = () => {
    setMeasurementEntryPoint('initial');
    setMeasurementReturnTab('analysis');
    setAppState('teastick');
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="relative flex h-screen w-full max-w-[1440px] flex-col overflow-hidden bg-white font-sans shadow-2xl">
        {appState === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
        {appState === 'onboarding' && (
          <OnboardingScreen onComplete={handleStartInitialMeasurementFlow} />
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
            }}
            onBack={() => setAppState('teastick')}
          />
        )}

        <div className={`flex-1 overflow-hidden ${appState === 'main' ? 'block' : 'hidden'}`}>
          <div className={activeTab === 'home' ? 'h-full w-full' : 'hidden'}>
            <Home onStartMeasurement={() => handleStartMeasurementFromMain('home')} />
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
                measurementSnapshot={latestTasteMeasurementSnapshot}
                onStartMeasurement={() => handleStartMeasurementFromMain('analysis')}
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
              />
            ) : null}
          </div>
        </div>

        {appState === 'main' && (
          <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
}
