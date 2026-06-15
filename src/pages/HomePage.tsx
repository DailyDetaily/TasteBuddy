import { useEffect, useMemo, useState } from 'react';

import {
  type HomeChefMatchCardData,
} from '../components/home/HomeCards';
import HomeUnifiedSearch, { type HomeSearchResult } from '../components/home/HomeUnifiedSearch';
import SocialDishFeedbackCommentFocusScreen from '../components/social/SocialDishFeedbackCommentFocusScreen';
import {
  DEFAULT_TASTE_MEASUREMENT_RESULTS,
  createTasteMeasurementSnapshot,
  type TasteMeasurementSnapshot,
} from '../constants/tasteMeasurementData';
import { type RestaurantReadyGuidance } from '../constants/quickTasteCalibrationData';
import {
  hydrateReservationPageData,
  hydrateRestaurantContentCatalog,
  hydrateUserLearnedCalibration,
  hydrateUserTbaConfidenceStates,
  type RestaurantContentCatalog,
} from '../lib/tasteBuddySupabase';
import TasteMatchFeed from '../components/social/TasteMatchFeed';
import { TBA } from '../lib/tasteBuddyAgent';
import {
  createDiningFriendProfileFromPublicTasteProfile,
  hydrateTasteBuddyAgentSocialGraph,
  type TasteBuddyAgentSocialGraph,
} from '../lib/tasteBuddyAgentSupabase';
import {
  getCurrentSupabaseSession,
  isAnonymousSupabaseSession,
  type DiningFriendProfile,
} from '../lib/supabase';
import { RESERVATION_CATALOG, type ReservationRecord } from '../constants/reservationCatalog';
import type { TasteProfile as PalateBloomTasteProfile } from '../components/system/PalateBloomAvatar';
import type {
  PublicTasteProfile,
  TasteBuddyAgentUserConfidenceState,
  TasteMatchFeedItem,
} from '../types/tasteBuddyAgent';
import type { UserLearnedCalibration } from '../types/tastePersonalization';

const HOME_SAFE_FALLBACK_MEASUREMENT_SNAPSHOT = createTasteMeasurementSnapshot(
  DEFAULT_TASTE_MEASUREMENT_RESULTS,
  '2026-03-08T15:20:00+09:00',
  'broad-starter',
);
const HOME_EMPTY_TASTE_SOCIAL_GRAPH: TasteBuddyAgentSocialGraph = {
  profiles: [],
  reviews: [],
};

interface HomePageProps {
  disableHydration?: boolean;
  hasMeasurementData: boolean;
  measurementSnapshot: TasteMeasurementSnapshot | null;
  starterGuidance?: RestaurantReadyGuidance | null;
  onStartMeasurement: () => void;
  onStartRemeasurement: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu?: () => void;
  onRootViewChange?: (isRootView: boolean) => void;
  onOpenRestaurantDetail?: (chef: HomeChefMatchCardData) => void;
  onOpenRestaurantDetailFromSearch?: (result: HomeSearchResult) => void;
  onStartDiningFeedbackFromSearch?: (result: HomeSearchResult) => void;
  onOpenTasteBuddyProfile?: (profile: DiningFriendProfile) => void;
  onAddFriend?: (friend: DiningFriendProfile) => Promise<{ ok: boolean; message: string }>;
  onRemoveFriend?: (friend: DiningFriendProfile) => Promise<{ ok: boolean; message: string }>;
  onSearchFriends?: (query: string) => Promise<{
    ok: boolean;
    friends: DiningFriendProfile[];
    message: string;
  }>;
  hasUnreadNotifications?: boolean;
  userAvatarImageSrc?: string | null;
  userNickname?: string | null;
  userPalateBloomProfile?: PalateBloomTasteProfile;
  userPalateBloomShapeSeed?: string;
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
  onRootViewChange,
  onOpenRestaurantDetail,
  onOpenRestaurantDetailFromSearch,
  onStartDiningFeedbackFromSearch,
  onOpenTasteBuddyProfile,
  onAddFriend,
  onRemoveFriend,
  onSearchFriends,
  hasUnreadNotifications,
  userAvatarImageSrc,
  userNickname,
  userPalateBloomProfile,
  userPalateBloomShapeSeed,
}: HomePageProps) {
  const effectiveMeasurementSnapshot =
    measurementSnapshot ?? HOME_SAFE_FALLBACK_MEASUREMENT_SNAPSHOT;
  const [reservations, setReservations] = useState<ReservationRecord[]>(RESERVATION_CATALOG);
  const [contentCatalog, setContentCatalog] = useState<RestaurantContentCatalog>({
    chefs: [],
    dishes: [],
  });
  const [tasteSocialGraph, setTasteSocialGraph] = useState<TasteBuddyAgentSocialGraph>(
    HOME_EMPTY_TASTE_SOCIAL_GRAPH,
  );
  const [isTasteSocialGraphLoading, setIsTasteSocialGraphLoading] = useState(() => !disableHydration);
  const [userLearnedCalibration, setUserLearnedCalibration] = useState<UserLearnedCalibration | null>(null);
  const [userTbaConfidenceStates, setUserTbaConfidenceStates] = useState<TasteBuddyAgentUserConfidenceState[]>([]);
  const [focusedTasteMatchItemId, setFocusedTasteMatchItemId] = useState<string | null>(null);
  const [commentsByTasteMatchItemId, setCommentsByTasteMatchItemId] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (disableHydration) {
      setIsTasteSocialGraphLoading(false);
      return;
    }

    let isCancelled = false;
    setIsTasteSocialGraphLoading(true);

    const hydrateContentCatalog = () => {
      if (isCancelled) {
        return;
      }

      void hydrateRestaurantContentCatalog().then((hydratedCatalog) => {
        if (!isCancelled) {
          setContentCatalog(hydratedCatalog);
        }
      });
    };

    void (async () => {
      const session = await getCurrentSupabaseSession();

      if (isCancelled) {
        return;
      }

      hydrateContentCatalog();

      if (!session || isAnonymousSupabaseSession(session)) {
        setIsTasteSocialGraphLoading(false);
        return;
      }

      void hydrateReservationPageData().then((hydratedData) => {
        if (!isCancelled) {
          setReservations(hydratedData.reservations);
        }
      });

      void hydrateTasteBuddyAgentSocialGraph({ includeSeedReviews: true })
        .then((hydratedTasteSocialGraph) => {
          if (!isCancelled) {
            setTasteSocialGraph(hydratedTasteSocialGraph);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!isCancelled) {
            setIsTasteSocialGraphLoading(false);
          }
        });

      void hydrateUserTbaConfidenceStates().then((hydratedUserTbaConfidenceStates) => {
        if (!isCancelled) {
          setUserTbaConfidenceStates(hydratedUserTbaConfidenceStates);
        }
      });

      void hydrateUserLearnedCalibration().then((hydratedCalibration) => {
        if (!isCancelled) {
          setUserLearnedCalibration(hydratedCalibration);
        }
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [disableHydration]);

  const visibleReservations = reservations.length > 0 ? reservations : RESERVATION_CATALOG;
  const tasteIdentity = useMemo(
    () =>
      TBA.buildTasteIdentity({
        feedbackCount: userLearnedCalibration?.supportCount ?? 0,
        measurementSnapshot: effectiveMeasurementSnapshot,
        reviewCount: userLearnedCalibration?.supportCount ?? 0,
      }),
    [effectiveMeasurementSnapshot, userLearnedCalibration],
  );
  const tasteMatchFeed = useMemo(
    () =>
      TBA.generateTasteMatchFeed({
        candidateProfiles: tasteSocialGraph.profiles,
        limit: 12,
        reviews: tasteSocialGraph.reviews,
        userConfidenceStates: userTbaConfidenceStates,
        viewerProfile: tasteIdentity,
      }),
    [tasteIdentity, tasteSocialGraph.profiles, tasteSocialGraph.reviews, userTbaConfidenceStates],
  );
  const focusedTasteMatchItem =
    focusedTasteMatchItemId
      ? tasteMatchFeed.find((item) => item.id === focusedTasteMatchItemId) ?? null
      : null;
  const isSocialCommentFocusOpen = Boolean(focusedTasteMatchItem);
  const commentCountsByTasteMatchItemId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(commentsByTasteMatchItemId).map(([itemId, comments]) => [
          itemId,
          comments.length,
        ]),
      ),
    [commentsByTasteMatchItemId],
  );

  useEffect(() => {
    onRootViewChange?.(!isSocialCommentFocusOpen);

    return () => {
      onRootViewChange?.(true);
    };
  }, [isSocialCommentFocusOpen, onRootViewChange]);

  useEffect(() => {
    if (focusedTasteMatchItemId && !focusedTasteMatchItem) {
      setFocusedTasteMatchItemId(null);
    }
  }, [focusedTasteMatchItem, focusedTasteMatchItemId]);

  const openTasteMatchRestaurant = (item: TasteMatchFeedItem) => {
    const reviewerName = item.reviewer.displayName || item.reviewer.nickname;
    const dishTitle = item.dishTitle ?? item.restaurantName;

    onOpenRestaurantDetailFromSearch?.({
      chef: 'Taste Buddy',
      id: `taste-match-${item.restaurantId}`,
      image: null,
      label: dishTitle,
      matchMeta: item.reason,
      restaurant: item.restaurantName,
      searchText: [
        item.restaurantName,
        dishTitle,
        reviewerName,
        ...item.supportingSignals,
        ...item.tasteTags,
        ...item.experienceTags,
      ].join(' '),
      signatureItems: [...item.supportingSignals, ...item.tasteTags, ...item.experienceTags],
      subLabel: `${item.restaurantName} · ${reviewerName}`,
      type: 'menu',
    });
  };
  const openTasteMatchBuddyProfile = (profile: PublicTasteProfile) => {
    onOpenTasteBuddyProfile?.(
      createDiningFriendProfileFromPublicTasteProfile(profile),
    );
  };
  const submitTasteMatchComment = (itemId: string, comment: string) => {
    setCommentsByTasteMatchItemId((current) => ({
      ...current,
      [itemId]: [...(current[itemId] ?? []), comment],
    }));
  };

  if (!hasMeasurementData || !measurementSnapshot) {
    return (
      <main className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
        <div
          className="flex flex-1 items-center justify-center px-5 text-[13px] font-semibold text-[var(--tb-color-text-subtle)]"
          aria-live="polite"
        >
          홈을 준비하고 있어요.
        </div>
      </main>
    );
  }

  if (focusedTasteMatchItem) {
    return (
      <SocialDishFeedbackCommentFocusScreen
        comments={commentsByTasteMatchItemId[focusedTasteMatchItem.id] ?? []}
        item={focusedTasteMatchItem}
        onBack={() => setFocusedTasteMatchItemId(null)}
        onOpenBuddyProfile={(item) => openTasteMatchBuddyProfile(item.reviewer)}
        onOpenRestaurantDetail={openTasteMatchRestaurant}
        onSubmitComment={(comment) => submitTasteMatchComment(focusedTasteMatchItem.id, comment)}
        viewerAvatarImageSrc={userAvatarImageSrc}
        viewerAvatarProfile={userPalateBloomProfile}
        viewerAvatarShapeSeed={userPalateBloomShapeSeed}
        viewerNickname={userNickname ?? '나'}
      />
    );
  }

  return (
    <main className="flex h-full w-full flex-col bg-[var(--tb-color-bg-page)]">
      <header className="shrink-0 px-5 pb-4 pt-1">
        <HomeUnifiedSearch
          catalog={contentCatalog}
          onAddFriend={onAddFriend}
          onOpenTasteBuddyProfile={onOpenTasteBuddyProfile}
          onOpenRestaurantDetail={onOpenRestaurantDetailFromSearch}
          onRemoveFriend={onRemoveFriend}
          onStartDiningFeedback={onStartDiningFeedbackFromSearch}
          onSearchFriends={onSearchFriends}
          reservations={visibleReservations}
        />
      </header>
      <section className="flex-1 overflow-y-auto no-scrollbar" aria-label="홈 콘텐츠">
        <div className="flex flex-col gap-3 px-5 pb-20 animate-fadeIn">
          <TasteMatchFeed
            commentCountsByItemId={commentCountsByTasteMatchItemId}
            fallbackBuddyProfiles={tasteSocialGraph.profiles}
            feedItems={tasteMatchFeed}
            isFeedLoading={isTasteSocialGraphLoading}
            onOpenDishComments={(item) => setFocusedTasteMatchItemId(item.id)}
            onOpenBuddyProfile={openTasteMatchBuddyProfile}
            onOpenRestaurantDetail={openTasteMatchRestaurant}
            viewerProfile={tasteIdentity}
          />
          <div className="h-6" />
        </div>
      </section>
    </main>
  );
}
