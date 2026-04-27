import { useEffect, useState } from 'react';

import {
  HomeCardStack,
  buildReservationPersonalizationSummary,
  getChefImageByName,
  getRecentChangeSummary,
  type HomeChefMatchCardData,
} from '../components/home/HomeCards';
import HomeUnifiedSearch, { type HomeSearchResult } from '../components/home/HomeUnifiedSearch';
import {
  type TasteMeasurementSnapshot,
  isTasteMeasurementStale,
  getTasteMeasurementAgeLabel,
} from '../constants/tasteMeasurementData';
import { type RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import {
  hydrateReservationPageData,
  hydrateRestaurantContentCatalog,
  hydrateUserLearnedCalibration,
  type RestaurantContentCatalog,
} from '../lib/tasteBuddySupabase';
import {
  buildPersonalizedChefMatches,
  resolveUsableImagePath,
} from '../lib/chefMatching';
import { isSupabaseConfigured } from '../lib/supabase';
import { RESERVATION_CATALOG, type ReservationRecord } from '../constants/reservationCatalog';
import type { UserLearnedCalibration } from '../types/tastePersonalization';

interface HomePageProps {
  disableHydration?: boolean;
  hasMeasurementData: boolean;
  measurementSnapshot: TasteMeasurementSnapshot | null;
  starterGuidance?: RestaurantReadyGuidance | null;
  onStartMeasurement: () => void;
  onStartRemeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onOpenRestaurantDetail?: (chef: HomeChefMatchCardData) => void;
  onOpenRestaurantDetailFromSearch?: (result: HomeSearchResult) => void;
  hasUnreadNotifications?: boolean;
}

export default function HomePage({
  disableHydration = false,
  hasMeasurementData,
  measurementSnapshot,
  starterGuidance = null,
  onStartMeasurement,
  onStartRemeasurement,
  onOpenNotifications,
  onOpenMenu,
  onOpenRestaurantDetail,
  onOpenRestaurantDetailFromSearch,
  hasUnreadNotifications,
}: HomePageProps) {
  const fallbackReservations = isSupabaseConfigured && !disableHydration ? [] : RESERVATION_CATALOG;
  const [reservations, setReservations] = useState<ReservationRecord[]>(fallbackReservations);
  const [contentCatalog, setContentCatalog] = useState<RestaurantContentCatalog>({
    chefs: [],
    dishes: [],
  });
  const [userLearnedCalibration, setUserLearnedCalibration] = useState<UserLearnedCalibration | null>(null);

  useEffect(() => {
    if (disableHydration) return;
    let isCancelled = false;

    void (async () => {
      const [hydratedData, hydratedCatalog, hydratedCalibration] = await Promise.all([
        hydrateReservationPageData(),
        hydrateRestaurantContentCatalog(),
        hydrateUserLearnedCalibration(),
      ]);

      if (isCancelled) return;
      setReservations(hydratedData.reservations);
      setContentCatalog(hydratedCatalog);
      setUserLearnedCalibration(hydratedCalibration);
    })();

    return () => {
      isCancelled = true;
    };
  }, [disableHydration]);

  if (!hasMeasurementData || !measurementSnapshot) {
    return null;
  }

  const upcomingReservations = reservations.filter((reservation) => reservation.status !== 'completed');
  const featuredReservation = upcomingReservations[0] ?? null;
  const featuredSummary = featuredReservation
    ? buildReservationPersonalizationSummary(
        measurementSnapshot,
        featuredReservation,
        starterGuidance,
      )
    : null;

  const needsMeasurementRefresh = isTasteMeasurementStale(measurementSnapshot);
  const measurementAgeLabel = getTasteMeasurementAgeLabel(measurementSnapshot);
  const recentChangeText = getRecentChangeSummary(measurementSnapshot);

  const chefCards = buildPersonalizedChefMatches({
    calibration: userLearnedCalibration,
    dishes: contentCatalog.dishes,
    measurementSnapshot,
    resolveChefImage: (dish) =>
      resolveUsableImagePath(dish.chefAvatarPath) ?? getChefImageByName(dish.chef),
  });

  return (
    <main className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
      <header className="shrink-0 px-5 pb-4 pt-1">
        <HomeUnifiedSearch
          catalog={contentCatalog}
          onOpenRestaurantDetail={onOpenRestaurantDetailFromSearch}
          reservations={reservations}
        />
      </header>
      <section className="flex-1 overflow-y-auto no-scrollbar pb-10" aria-label="홈 콘텐츠">
        <div className="flex flex-col gap-3 px-5 pb-5 animate-fadeIn">
          <HomeCardStack
            chefCards={chefCards}
            featuredReservation={featuredReservation}
            featuredSummary={featuredSummary}
            measurementAgeLabel={measurementAgeLabel}
            measurementSnapshot={measurementSnapshot}
            needsMeasurementRefresh={needsMeasurementRefresh}
            onStartMeasurement={onStartMeasurement}
            onStartRemeasurement={onStartRemeasurement}
            onSelectChefMatch={onOpenRestaurantDetail}
            recentChangeText={recentChangeText}
          />
          <div className="h-6" />
        </div>
      </section>
    </main>
  );
}
