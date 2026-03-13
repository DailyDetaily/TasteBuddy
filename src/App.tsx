import { useState } from 'react';
import Home from './imports/Home';
import AnalysisPage from './pages/AnalysisPage';
import ReservationPage from './pages/ReservationPage';
import ProfilePage from './pages/ProfilePage';
import SplashScreen from './pages/SplashScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import TeastickConnectScreen from './pages/TeastickConnectScreen';
import TasteMeasurementScreen from './pages/TasteMeasurementScreen'; // Added import
import BottomTabBar, { type TabType } from './components/BottomTabBar';

type AppState = 'splash' | 'onboarding' | 'teastick' | 'measurement' | 'main'; // Updated AppState

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // "분석" 탭으로 전환하는 함수를 Home에 전달
  const handleGoToAnalysis = () => setActiveTab('analysis');

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-[1440px] h-screen bg-white shadow-2xl overflow-hidden relative font-sans flex flex-col">
        {appState === 'splash' && <SplashScreen onComplete={() => setAppState('onboarding')} />}
        {appState === 'onboarding' && <OnboardingScreen onComplete={() => setAppState('teastick')} />}
        {appState === 'teastick' && (
          <TeastickConnectScreen
            onConnect={() => setAppState('measurement')} // Updated onConnect
            onSkip={() => setAppState('main')}
          />
        )}
        {appState === 'measurement' && ( // Added TasteMeasurementScreen rendering
          <TasteMeasurementScreen
            onComplete={() => setAppState('main')}
            onBack={() => setAppState('teastick')}
          />
        )}

        {/* 탭 콘텐츠 (메인 앱) */}
        <div className={`flex-1 overflow-hidden ${appState === 'main' ? 'block' : 'hidden'}`}>
          <div className={activeTab === 'home' ? 'w-full h-full' : 'hidden'}>
            <Home onGoToAnalysis={handleGoToAnalysis} />
          </div>
          <div className={activeTab === 'analysis' ? 'w-full h-full animate-fadeIn' : 'hidden'}>
            <AnalysisPage />
          </div>
          <div className={activeTab === 'reservation' ? 'w-full h-full animate-fadeIn' : 'hidden'}>
            <ReservationPage />
          </div>
          <div className={activeTab === 'profile' ? 'w-full h-full animate-fadeIn' : 'hidden'}>
            <ProfilePage />
          </div>
        </div>

        {/* 공통 하단 탭바 */}
        {appState === 'main' && (
          <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
    </div>
  );
}
