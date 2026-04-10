import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import '../../src/index.css';
import BottomTabBar from '../../src/components/BottomTabBar';
import { createInitialTasteMeasurementSnapshot } from '../../src/constants/tasteMeasurementData';
import { applyPersistedDesignTokenRuntimeState } from '../../src/lib/designTokenRuntime';
import StaticHomePage from './StaticHomePage';

applyPersistedDesignTokenRuntimeState();

function HomeScreenPreview() {
  const measurementSnapshot = useMemo(() => createInitialTasteMeasurementSnapshot(), []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#F7F7F7_0%,#FFFFFF_35%,#F3F3F3_100%)] p-6">
      <div className="tb-figma-device relative mx-auto w-[390px] overflow-hidden rounded-[32px] border border-[var(--tb-color-border-default)] bg-white shadow-[0_24px_60px_rgba(15,15,15,0.12)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center pt-3">
          <div className="h-1.5 w-24 rounded-full bg-[var(--tb-color-border-strong)]" />
        </div>

        <div className="relative h-[844px] overflow-hidden bg-[var(--tb-color-bg-page)]">
          <div className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
            <div className="flex-1 overflow-hidden">
              <StaticHomePage
                measurementCount={3}
                measurementSnapshot={measurementSnapshot}
              />
            </div>
            <BottomTabBar activeTab="home" onTabChange={() => undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HomeScreenPreview />
  </React.StrictMode>,
);
