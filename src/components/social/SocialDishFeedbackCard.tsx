import type { TasteMatchFeedItem } from '../../types/tasteBuddyAgent';
import DishFeedbackCard, {
  type DishFeedbackCardViewModel,
} from '../dining/DishFeedbackCard';
import { TBA } from '../../lib/tasteBuddyAgent';
import { createPalateBloomProfileFromMeasurementSnapshot } from '../system/PalateBloomAvatar';

interface SocialDishFeedbackCardProps {
  commentCount?: number;
  item: TasteMatchFeedItem;
  onLike?: (item: TasteMatchFeedItem) => void;
  onOpenBuddyProfile?: (item: TasteMatchFeedItem) => void;
  onOpenComments?: (item: TasteMatchFeedItem) => void;
  onOpenRestaurantDetail?: (item: TasteMatchFeedItem) => void;
}

function getDateLabel(createdAt?: string) {
  if (!createdAt) {
    return '최근 기록';
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '최근 기록';
  }

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getRelativeDateLabel(createdAt?: string) {
  if (!createdAt) {
    return '최근';
  }

  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return '최근';
  }

  const days = Math.max(0, Math.round((Date.now() - createdTime) / (1000 * 60 * 60 * 24)));

  if (days === 0) return '오늘';
  if (days === 1) return '1일 전';
  return `${days}일 전`;
}

export function createSocialDishFeedbackCardViewModel(item: TasteMatchFeedItem): DishFeedbackCardViewModel {
  const reviewerName = item.reviewer.nickname || item.reviewer.displayName;
  const subject = item.dishTitle ?? `${item.restaurantName} 다이닝`;
  const diningNote = TBA.buildDiningNoteForTasteMatchItem(item);
  const tbaAnalysisSnapshot = TBA.buildDiningAnalysisSnapshotForTasteMatchItem(item);

  return {
    absoluteDateLabel: getDateLabel(item.reviewCreatedAt),
    author: {
      avatarImageSrc: item.reviewer.avatarPath,
      avatarProfile: createPalateBloomProfileFromMeasurementSnapshot(null, item.reviewer.userId),
      displayName: reviewerName,
      shapeSeed: `${item.reviewer.userId}|${item.reviewer.stage}`,
    },
    detailTags: diningNote.detailTags,
    id: item.id,
    images: [{ alt: `${subject} 메뉴 사진` }],
    restaurantName: item.restaurantName,
    relativeDateLabel: getRelativeDateLabel(item.reviewCreatedAt),
    subject,
    synthesisSummary: diningNote.summary,
    tbaAnalysisSnapshot,
    tasteBubbles: diningNote.tasteBubbles,
  };
}

export default function SocialDishFeedbackCard({
  commentCount = 0,
  item,
  onLike,
  onOpenBuddyProfile,
  onOpenComments,
  onOpenRestaurantDetail,
}: SocialDishFeedbackCardProps) {
  return (
    <DishFeedbackCard
      card={createSocialDishFeedbackCardViewModel(item)}
      commentCount={commentCount}
      onLike={() => onLike?.(item)}
      onOpenAuthorProfile={() => onOpenBuddyProfile?.(item)}
      onOpenComments={() => onOpenComments?.(item)}
      onOpenSubject={() => onOpenRestaurantDetail?.(item)}
    />
  );
}
