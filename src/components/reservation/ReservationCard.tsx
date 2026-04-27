import React from 'react';
import {
  ChevronRight as ChevronRightIcon,
  Clock as ClockIcon,
  Utensils as UtensilsIcon,
  Activity as ActivityIcon
} from 'lucide-react';

import type { ReservationRecord } from '../../constants/reservationCatalog';
import { ICON_TOKENS } from '../../constants/designTokens';
import SectionCard from '../SectionCard';
import ChefAvatar from '../system/ChefAvatar';
import CardDetailLabel from '../system/CardDetailLabel';
import StatusChip from '../system/StatusChip';
import TasteChip from '../system/TasteChip';
import { reservationStatusConfig } from './reservationStatusConfig';

const wrapIcon = (IconComponent: React.ElementType) => {
  return ({ size, fontSize, style, ...props }: any) => (
    <IconComponent {...props} style={{ fontSize: size ?? fontSize, width: size ?? fontSize, height: size ?? fontSize, ...style }} />
  );
};

const ChevronRight = wrapIcon(ChevronRightIcon);
const Clock = wrapIcon(ClockIcon);
const Utensils = wrapIcon(UtensilsIcon);
const Activity = wrapIcon(ActivityIcon);

interface ReservationCardProps {
  onOpenRestaurantInfo?: () => void;
  onSelect: () => void;
  reservation: ReservationRecord;
}

export default function ReservationCard({
  onOpenRestaurantInfo,
  onSelect,
  reservation,
}: ReservationCardProps) {
  const status = reservationStatusConfig[reservation.status];

  return (
    <SectionCard onClick={onSelect}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusChip color={status.color} backgroundColor={status.bg}>
            {status.label}
          </StatusChip>
          <span className="text-[14px] font-bold text-[var(--tb-color-text-primary)]">
            {reservation.restaurant}
          </span>
        </div>
        <ChevronRight
          size={ICON_TOKENS.size.md}
          className="text-[var(--tb-color-text-disabled)]"
        />
      </div>

      {onOpenRestaurantInfo ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenRestaurantInfo();
          }}
          className="self-start"
        >
          <CardDetailLabel label="레스토랑 정보" />
        </button>
      ) : null}

      <div className="flex w-full items-center gap-3">
        <ChefAvatar
          alt={reservation.chef}
          className="h-[40px] w-[40px] rounded-[8px]"
          iconSize={ICON_TOKENS.size.lg}
          imageSrc={reservation.chefImage}
          taste={reservation.adjustments[0]?.taste}
          variant="neutral"
        />
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
            {reservation.chef} 셰프
          </span>
          <span className="text-[12px] text-[var(--tb-color-text-subtle)]">
            프로필 반영 중
          </span>
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1">
          <Clock size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-muted)]" />
          <span className="text-[12px] text-[var(--tb-color-text-muted)]">
            {reservation.date} {reservation.time}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Utensils size={ICON_TOKENS.size.sm} className="text-[var(--tb-color-icon-muted)]" />
          <span className="text-[12px] text-[var(--tb-color-text-muted)]">
            {reservation.course}
          </span>
        </div>
      </div>

      <div className="flex w-full items-center gap-2 rounded-[12px] bg-[var(--tb-color-surface-muted)] px-3 py-2">
        <Activity size={ICON_TOKENS.size.sm} style={{ color: status.color }} />
        <span className="text-[12px] text-[var(--tb-color-text-primary)]">
          {reservation.tcsStatus}
        </span>
      </div>

      <p className="w-full text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
        {reservation.diningPromise}
      </p>

      {reservation.adjustments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {reservation.adjustments.map((adjustment, index) => (
            <TasteChip
              key={`${adjustment.taste}-${adjustment.direction}-${index}`}
              taste={adjustment.taste}
              value={adjustment.direction}
            />
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
