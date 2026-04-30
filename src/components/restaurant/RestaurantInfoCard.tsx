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

type RestaurantInfoRowId = 'address' | 'hours' | 'website' | 'instagram' | 'email' | 'phone';
type RestaurantInfoSource = 'kakao' | 'google' | 'partner' | 'manual';

export interface RestaurantInfoRowViewModel {
  href?: string;
  id: RestaurantInfoRowId;
  label: string;
  source: RestaurantInfoSource;
  value: string;
}

export interface RestaurantInfoViewModel {
  address: string;
  email?: string;
  hours: string;
  instagram?: string;
  mapUrl?: string;
  phone?: string;
  sourceByRow?: Partial<Record<RestaurantInfoRowId, RestaurantInfoSource>>;
  website?: string;
}

interface RestaurantInfoCardProps {
  info: RestaurantInfoViewModel;
  rows?: RestaurantInfoRowViewModel[];
}

const RESTAURANT_INFO_ICONS: Record<RestaurantInfoRowId, typeof MapPin> = {
  address: MapPin,
  email: Mail,
  hours: Clock,
  instagram: Instagram,
  phone: Phone,
  website: Globe,
};

function getRestaurantInfoHref(id: RestaurantInfoRowId, value: string) {
  if (id === 'address') {
    const encodedAddress = encodeURIComponent(value);

    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }

  if (id === 'website') {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  if (id === 'instagram') {
    const handle = value.replace(/^@/, '').trim();

    return handle ? `https://www.instagram.com/${handle}/` : undefined;
  }

  if (id === 'email') {
    return `mailto:${value}`;
  }

  if (id === 'phone') {
    return `tel:${value.replace(/[^\d+]/g, '')}`;
  }

  return undefined;
}

export function buildRestaurantInfoRows(
  info: RestaurantInfoViewModel,
): RestaurantInfoRowViewModel[] {
  const rows: Array<RestaurantInfoRowViewModel | null> = [
    info.address
      ? {
          id: 'address',
          label: '주소',
          value: info.address,
          href: info.mapUrl ?? getRestaurantInfoHref('address', info.address),
          source: info.sourceByRow?.address ?? (info.mapUrl ? 'kakao' : 'manual'),
        }
      : null,
    info.hours
      ? {
          id: 'hours',
          label: '영업시간',
          value: info.hours,
          source: info.sourceByRow?.hours ?? 'manual',
        }
      : null,
    info.website
      ? {
          id: 'website',
          label: '웹사이트',
          value: info.website,
          href: getRestaurantInfoHref('website', info.website),
          source: info.sourceByRow?.website ?? 'manual',
        }
      : null,
    info.instagram
      ? {
          id: 'instagram',
          label: '인스타그램',
          value: info.instagram,
          href: getRestaurantInfoHref('instagram', info.instagram),
          source: info.sourceByRow?.instagram ?? 'manual',
        }
      : null,
    info.email
      ? {
          id: 'email',
          label: '이메일',
          value: info.email,
          href: getRestaurantInfoHref('email', info.email),
          source: info.sourceByRow?.email ?? 'manual',
        }
      : null,
    info.phone
      ? {
          id: 'phone',
          label: '전화번호',
          value: info.phone,
          href: getRestaurantInfoHref('phone', info.phone),
          source: info.sourceByRow?.phone ?? 'manual',
        }
      : null,
  ];

  return rows.filter((row): row is RestaurantInfoRowViewModel => Boolean(row));
}

export default function RestaurantInfoCard({
  info,
  rows = buildRestaurantInfoRows(info),
}: RestaurantInfoCardProps) {
  return (
    <SectionCard hoverEffect={false}>
      <div className="flex w-full flex-col gap-3">
        {rows.map((row, index) => {
          const Icon = RESTAURANT_INFO_ICONS[row.id];
          const href = row.href;
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
