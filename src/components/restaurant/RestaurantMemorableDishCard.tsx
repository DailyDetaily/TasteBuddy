import CardDetailLabel from '../system/CardDetailLabel';
import Chip from '../system/Chip';
import ImageBox from '../system/ImageBox';
import PageSection from '../system/PageSection';
import SectionCard from '../SectionCard';
import TasteChip from '../system/TasteChip';

export interface RestaurantMemorableDishViewModel {
  id: string;
  imageUrl?: string | null;
  summary: string;
  tags: string[];
  title: string;
}

interface RestaurantMemorableDishCardProps {
  dishes: RestaurantMemorableDishViewModel[];
}

function getTasteChipProps(tag: string) {
  if (tag.includes('감칠')) {
    return { taste: '감칠맛', value: tag };
  }

  if (tag.includes('지방')) {
    return { taste: '지방맛', value: tag };
  }

  if (tag.includes('산미')) {
    return { taste: '신맛', value: tag };
  }

  return null;
}

export default function RestaurantMemorableDishCard({
  dishes,
}: RestaurantMemorableDishCardProps) {
  return (
    <PageSection
      contentClassName="flex flex-col gap-3"
      title={
        <div className="flex w-full items-center justify-between gap-3">
          <span>나에게 기억될 가능성이 높은 메뉴</span>
          <button type="button" className="shrink-0">
            <CardDetailLabel label="전체 메뉴 보기" />
          </button>
        </div>
      }
      titleAs="h2"
      titleSize="md"
    >
      {dishes.map((dish) => (
        <SectionCard key={dish.id} hoverEffect={false}>
          <div className="flex w-full items-start gap-3">
            <ImageBox
              alt={`${dish.title} 이미지`}
              className="size-[64px] rounded-[12px]"
              fallback="menu"
              imageSrc={dish.imageUrl}
              variant="neutral"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                {dish.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {dish.tags.map((tag) => {
                  const tasteChipProps = getTasteChipProps(tag);

                  return tasteChipProps ? (
                    <TasteChip
                      key={`${dish.id}-${tag}`}
                      taste={tasteChipProps.taste}
                      value={tasteChipProps.value}
                    />
                  ) : (
                    <Chip key={`${dish.id}-${tag}`} size="xs" tone="neutral" variant="soft">
                      {tag}
                    </Chip>
                  );
                })}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--tb-color-text-muted)]">
                {dish.summary}
              </p>
            </div>
          </div>
        </SectionCard>
      ))}
    </PageSection>
  );
}
