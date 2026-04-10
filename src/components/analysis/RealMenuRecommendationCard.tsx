import type { ReactNode } from 'react';

import SectionCard from '../SectionCard';
import ChefAvatar from '../system/ChefAvatar';
import OutlineBadge from '../system/OutlineBadge';
import { ICON_TOKENS } from '../../constants/designTokens';
import TasteChip from '../system/TasteChip';

export interface RealMenuRecommendationCardData {
  chef: string;
  courseLabel: string;
  fitScore: number;
  id: string;
  ingredients: string[];
  reason: string;
  restaurant: string;
  subtitle: string;
  tasteLabel: string;
  title: string;
}

function MenuMetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-muted)] px-2 py-1 text-[10px] font-medium text-[var(--tb-color-text-secondary)]">
      {children}
    </span>
  );
}

function getChefLabel(chef: string) {
  return chef.endsWith('셰프') ? chef : `${chef} 셰프`;
}

function buildMenuSummary(menu: RealMenuRecommendationCardData) {
  return menu.subtitle || menu.ingredients.slice(0, 4).join(' · ') || `${menu.courseLabel} 코스`;
}

export default function RealMenuRecommendationCard({
  menu,
}: {
  menu: RealMenuRecommendationCardData;
}) {
  return (
    <SectionCard>
      <div className="flex w-full flex-col gap-[12px]">
        <div className="flex items-center gap-2 w-full">
          <TasteChip taste={menu.tasteLabel} />
          <p className="min-w-0 truncate font-bold text-[14px] text-[var(--tb-color-text-primary)]">
            {menu.title}
          </p>
          <div className="grow" />
          <OutlineBadge className="shrink-0">{menu.fitScore}% 적합</OutlineBadge>
        </div>

        <div className="flex items-start justify-between gap-[8px] w-full">
          <ChefAvatar
            alt={getChefLabel(menu.chef)}
            className="size-[40px] shrink-0 rounded-[8px]"
            iconSize={ICON_TOKENS.size.lg}
            taste={menu.tasteLabel}
            variant="neutral"
          />
          <div className="flex min-w-0 grow flex-col gap-[2px]">
            <p className="font-bold text-[14px] text-[var(--tb-color-text-primary)]">
              {getChefLabel(menu.chef)}
            </p>
            <p className="text-[12px] text-[var(--tb-color-text-muted)]">
              {menu.restaurant}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-start gap-[8px]">
          <p className="text-[12px] text-[var(--tb-color-text-muted)]">
            {buildMenuSummary(menu)}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-start gap-[6px]">
          <MenuMetaChip>{menu.courseLabel}</MenuMetaChip>
          {menu.ingredients.slice(0, 2).map((ingredient) => (
            <MenuMetaChip key={`${menu.id}:${ingredient}`}>{ingredient}</MenuMetaChip>
          ))}
        </div>

        <p className="text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
          {menu.reason}
        </p>
      </div>
    </SectionCard>
  );
}
