import DishFeedbackCard from '../dining/DishFeedbackCard';
import { findTasteExperience } from '../reservation/DiningFeedbackFlow';
import { effectiveSelections, nativeRecordPhotoFilenames, type NativeRecord } from '../../lib/gastronomy/nativeRecord';
import { swiftDate } from '../../lib/gastronomy/nativeArchive';
import useNativeRecordPhotos from './useNativeRecordPhotos';
import type { TasteProfile } from '../system/PalateBloomAvatar';

const tasteLabels: Record<string, string> = {
  sweet: '단맛', sour: '신맛', salty: '짠맛', bitter: '쓴맛', umami: '감칠맛', fat: '지방맛',
};

export function confirmedMealDateLabel(entry: NativeRecord) {
  const date = entry.mealTime?.source === 'user_confirmed' && entry.mealTime.start != null
    ? swiftDate(entry.mealTime.start) : null;
  return date ? new Date(date).toLocaleDateString('ko-KR') : '식사일 미확인';
}

export default function NativeDiningFeedCard({ owner, entry, mealCount, avatarImageSrc, avatarProfile, onSelect, onOptions, onShare }: {
  owner: string;
  entry: NativeRecord;
  mealCount: number;
  avatarImageSrc?: string | null;
  avatarProfile?: TasteProfile;
  onSelect: () => void;
  onOptions: () => void;
  onShare: () => void;
}) {
  const { urls: photos } = useNativeRecordPhotos(owner, entry);
  const selections = effectiveSelections(entry);
  return <div className="native-dining-feed-card">
    <DishFeedbackCard
      card={{
        id: entry.id,
        author: { displayName: '나', shapeSeed: 'current-user', avatarImageSrc, avatarProfile },
        subject: entry.menu,
        restaurantName: entry.restaurant || (entry.foodSource?.kind === 'homeCooked' ? '직접 만든 요리' : '식당 미기록'),
        relativeDateLabel: mealCount > 1 ? `같은 식사 · ${mealCount}개 메뉴` : '식사 기록',
        absoluteDateLabel: confirmedMealDateLabel(entry),
        images: photos.map((imageSrc) => ({ imageSrc, alt: `${entry.menu} 기록 사진` })),
        tasteBubbles: selections.filter((selection) => selection.type === 'bubble').map((selection) => ({
          id: selection.selectionInstanceID ?? selection.id,
          label: selection.labelSnapshot,
          colorTaste: tasteLabels[findTasteExperience(selection.id)?.axis ?? ''],
        })),
        detailTags: selections.filter((selection) => selection.type === 'detailTag').map((selection) => ({
          id: selection.selectionInstanceID ?? `${selection.id}:${selection.relatedBubbleID ?? ''}`,
          label: selection.labelSnapshot,
        })),
        synthesisSummary: entry.note || (entry.feedbackStatus === 'captured'
          ? `${nativeRecordPhotoFilenames(entry).length ? '사진으로 남긴 식사예요.' : '메뉴를 먼저 기록했어요.'} 취향을 덧붙여보세요.`
          : '아직 남긴 메모가 없어요.'),
      }}
      actions={{ onShare }}
      onOpenOptions={onOptions}
      onSelect={onSelect}
      onOpenSubject={onSelect}
    />
  </div>;
}
