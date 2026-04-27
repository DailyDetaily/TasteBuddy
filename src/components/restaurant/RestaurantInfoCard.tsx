import {
  Clock,
  Globe,
  Instagram,
  MapPin,
  Phone,
} from 'lucide-react';

import SectionCard from '../SectionCard';
import { ICON_TOKENS } from '../../constants/designTokens';

export interface RestaurantInfoViewModel {
  address: string;
  hours: string;
  instagram?: string;
  phone?: string;
  website?: string;
}

interface RestaurantInfoCardProps {
  info: RestaurantInfoViewModel;
}

export default function RestaurantInfoCard({
  info,
}: RestaurantInfoCardProps) {
  const rows = [
    { icon: MapPin, label: '주소', value: info.address },
    { icon: Clock, label: '영업시간', value: info.hours },
    { icon: Globe, label: '웹사이트', value: info.website },
    { icon: Instagram, label: '인스타그램', value: info.instagram },
    { icon: Phone, label: '전화번호', value: info.phone },
  ].filter((row): row is {
    icon: typeof MapPin;
    label: string;
    value: string;
  } => Boolean(row.value));

  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-1">
        {rows.map((row, index) => {
          const Icon = row.icon;

          return (
            <div
              key={row.label}
              className={`flex w-full items-start gap-3 py-3 ${
                index < rows.length - 1
                  ? 'border-b border-[var(--tb-color-border-subtle)]'
                  : ''
              }`}
            >
              <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-icon-primary)]">
                <Icon aria-hidden="true" size={ICON_TOKENS.size.sm} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[var(--tb-color-text-hint)]">
                  {row.label}
                </p>
                <p className="mt-1 break-words text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                  {row.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
