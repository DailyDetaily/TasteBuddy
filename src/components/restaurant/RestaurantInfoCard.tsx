import { Fragment } from 'react';
import {
  Clock,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

import SectionCard from '../SectionCard';
import { ICON_TOKENS } from '../../constants/designTokens';

export interface RestaurantInfoViewModel {
  address: string;
  email?: string;
  hours: string;
  instagram?: string;
  phone?: string;
  website?: string;
}

interface RestaurantInfoCardProps {
  info: RestaurantInfoViewModel;
}

function getRestaurantInfoHref(label: string, value: string) {
  if (label === '주소') {
    const encodedAddress = encodeURIComponent(value);

    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }

  if (label === '웹사이트') {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  if (label === '인스타그램') {
    const handle = value.replace(/^@/, '').trim();

    return handle ? `https://www.instagram.com/${handle}/` : undefined;
  }

  if (label === '이메일') {
    return `mailto:${value}`;
  }

  if (label === '전화번호') {
    return `tel:${value.replace(/[^\d+]/g, '')}`;
  }

  return undefined;
}

export default function RestaurantInfoCard({
  info,
}: RestaurantInfoCardProps) {
  const rows = [
    { icon: MapPin, label: '주소', value: info.address },
    { icon: Clock, label: '영업시간', value: info.hours },
    { icon: Globe, label: '웹사이트', value: info.website },
    { icon: Instagram, label: '인스타그램', value: info.instagram },
    { icon: Mail, label: '이메일', value: info.email },
    { icon: Phone, label: '전화번호', value: info.phone },
  ].filter((row): row is {
    icon: typeof MapPin;
    label: string;
    value: string;
  } => Boolean(row.value));

  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-3">
        {rows.map((row, index) => {
          const Icon = row.icon;
          const href = getRestaurantInfoHref(row.label, row.value);
          const shouldOpenInNewTab = Boolean(href);
          const rowContent = (
            <div className="flex w-full items-center gap-3">
              <Icon
                aria-hidden="true"
                className="shrink-0 text-[var(--tb-color-icon-primary)]"
                size={ICON_TOKENS.size.md}
                strokeWidth={1.8}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-[var(--tb-color-text-hint)]">
                  {row.label}
                </p>
                <p className="break-words text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                  {row.value}
                </p>
              </div>
            </div>
          );

          return (
            <Fragment key={row.label}>
              {href ? (
                <a
                  className="block rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
                  href={href}
                  rel={shouldOpenInNewTab ? 'noopener noreferrer' : undefined}
                  target={shouldOpenInNewTab ? '_blank' : undefined}
                >
                  {rowContent}
                </a>
              ) : (
                rowContent
              )}
              {index < rows.length - 1 ? (
                <div className="h-px w-full bg-[var(--tb-color-border-subtle)]" />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </SectionCard>
  );
}
