import { useEffect, useState } from 'react';

import {
  type HomeChefMatchCardData,
  HomeCardStack,
  buildReservationPersonalizationSummary,
  getChefImageByName,
  getRecentChangeSummary,
} from '../components/home/HomeCards';
import HomeUnifiedSearch from '../components/home/HomeUnifiedSearch';
import {
  type TasteMeasurementSnapshot,
  isTasteMeasurementStale,
  getTasteMeasurementAgeLabel,
} from '../constants/tasteMeasurementData';
import { type RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import {
  hydrateReservationPageData,
  hydrateRestaurantContentCatalog,
  type RestaurantContentCatalog,
} from '../lib/tasteBuddySupabase';
import { isSupabaseConfigured } from '../lib/supabase';
import { RESERVATION_CATALOG, type ReservationRecord } from '../constants/reservationCatalog';

interface HomePageProps {
  disableHydration?: boolean;
  hasMeasurementData: boolean;
  measurementSnapshot: TasteMeasurementSnapshot | null;
  starterGuidance?: RestaurantReadyGuidance | null;
  onStartMeasurement: () => void;
  onStartRemeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
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
  hasUnreadNotifications,
}: HomePageProps) {
  const fallbackReservations = isSupabaseConfigured && !disableHydration ? [] : RESERVATION_CATALOG;
  const [reservations, setReservations] = useState<ReservationRecord[]>(fallbackReservations);
  const [contentCatalog, setContentCatalog] = useState<RestaurantContentCatalog>({
    chefs: [],
    dishes: [],
  });

  useEffect(() => {
    if (disableHydration) return;
    let isCancelled = false;

    void (async () => {
      const [hydratedData, hydratedCatalog] = await Promise.all([
        hydrateReservationPageData(),
        hydrateRestaurantContentCatalog(),
      ]);

      if (isCancelled) return;
      setReservations(hydratedData.reservations);
      setContentCatalog(hydratedCatalog);
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

  const groupedByRestaurant = new Map<string, HomeChefMatchCardData>();
  contentCatalog.dishes.forEach((dish) => {
    const match = 58 + Math.min(37, Math.round(dish.confidence * 35));
    if (
      !groupedByRestaurant.has(dish.restaurantSlug) ||
      groupedByRestaurant.get(dish.restaurantSlug)!.match < match
    ) {
      groupedByRestaurant.set(dish.restaurantSlug, {
        chef: dish.chef,
        match,
        restaurant: dish.restaurant,
        image: getChefImageByName(dish.chef),
        tasteId: dish.dominantTaste,
      });
    }
  });

  const chefCards = Array.from(groupedByRestaurant.values()).sort((left, right) => right.match - left.match);

  return (
    <div className="flex flex-col w-full h-full bg-[var(--tb-color-bg-page)]">
      <div className="shrink-0 px-5 pb-4 pt-1">
        <HomeUnifiedSearch catalog={contentCatalog} reservations={reservations} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
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
            recentChangeText={recentChangeText}
          />
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
