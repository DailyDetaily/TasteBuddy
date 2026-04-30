import { Ellipsis } from 'lucide-react';
import { useState } from 'react';

import CardDetailLabel from '../system/CardDetailLabel';
import ImageBox from '../system/ImageBox';
import PageSection from '../system/PageSection';
import SectionCard from '../SectionCard';
import { ICON_TOKENS } from '../../constants/designTokens';

export interface RestaurantMemorableDishViewModel {
  id: string;
  imageUrl?: string | null;
  summary: string;
  tags: string[];
  title: string;
}

interface RestaurantMemorableDishCardProps {
  dishes: RestaurantMemorableDishViewModel[];
  onSelectDish?: (dish: RestaurantMemorableDishViewModel, index: number) => void;
}

function getBriefDishSummary(summary: string) {
  return summary
    .replace(/^현재\s+(미각\s+기준|프로필\s+기준|프로필|기준)(에서|과)?\s*/u, '')
    .replace(/^나의\s+미각\s+기준에서\s*/u, '');
}

const DEFAULT_VISIBLE_DISH_COUNT = 2;

export default function RestaurantMemorableDishCard({
  dishes,
  onSelectDish,
}: RestaurantMemorableDishCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const canExpand = dishes.length > DEFAULT_VISIBLE_DISH_COUNT;
  const visibleDishes = canExpand && !isExpanded
    ? dishes.slice(0, DEFAULT_VISIBLE_DISH_COUNT)
    : dishes;

  return (
    <PageSection
      contentClassName="flex flex-col gap-3"
      title={
        <div className="flex w-full items-center justify-between gap-3">
          <span>메뉴</span>
          {canExpand ? (
            <button
              type="button"
              aria-expanded={isExpanded}
              className="shrink-0"
              onClick={() => setIsExpanded((previous) => !previous)}
            >
              <CardDetailLabel
                direction={isExpanded ? 'up' : 'down'}
                label={isExpanded ? '메뉴 접기' : '전체 메뉴 보기'}
              />
            </button>
          ) : null}
        </div>
      }
      titleAs="h2"
      titleSize="md"
    >
      <SectionCard hoverEffect={false}>
        <div className="flex w-full flex-col gap-3">
          {visibleDishes.map((dish, index) => (
            <div key={dish.id} className="flex w-full flex-col gap-3">
              <div
                aria-label={`${dish.title} 메뉴 상세 보기`}
                className={`flex w-full items-center gap-3 ${
                  onSelectDish ? 'cursor-pointer' : ''
                }`}
                onClick={onSelectDish ? () => onSelectDish(dish, index) : undefined}
                onKeyDown={
                  onSelectDish
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectDish(dish, index);
                        }
                      }
                    : undefined
                }
                role={onSelectDish ? 'button' : undefined}
                tabIndex={onSelectDish ? 0 : undefined}
              >
                <ImageBox
                  alt={`${dish.title} 이미지`}
                  imageSrc={dish.imageUrl}
                  kind="menu"
                  size="lg"
                  variant="neutral"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-[var(--tb-color-text-primary)]">
                    {dish.title}
                  </p>
                  <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
                    {getBriefDishSummary(dish.summary)}
                  </p>
                </div>
              </div>
              {index < visibleDishes.length - 1 ? (
                <div className="h-px w-full bg-[var(--tb-color-border-subtle)]" />
              ) : null}
            </div>
          ))}
          {canExpand ? (
            <button
              type="button"
              aria-label={isExpanded ? '메뉴 접기' : '전체 메뉴 보기'}
              className="-my-2 flex h-3 w-full items-center justify-center text-[var(--tb-color-icon-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
              onClick={() => setIsExpanded((previous) => !previous)}
            >
              <Ellipsis
                aria-hidden="true"
                size={ICON_TOKENS.size.md}
                strokeWidth={1.8}
              />
            </button>
          ) : null}
        </div>
      </SectionCard>
    </PageSection>
  );
}
