import { Fragment, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

import SectionCard from '../SectionCard';
import { ICON_TOKENS } from '../../constants/designTokens';

export type RestaurantInfoRowId = 'address' | 'hours' | 'website' | 'instagram' | 'email' | 'phone';
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
  onRowClick?: (row: RestaurantInfoRowViewModel) => void;
  rows?: RestaurantInfoRowViewModel[];
  showRowChevron?: boolean;
  variant?: 'card' | 'plain';
}

type HoursDisplay = {
  all: string[];
  today: string;
};

const RESTAURANT_INFO_ICONS: Record<RestaurantInfoRowId, typeof MapPin> = {
  address: MapPin,
  email: Mail,
  hours: Clock,
  instagram: Instagram,
  phone: Phone,
  website: Globe,
};

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function splitHoursByDay(value: string) {
  return value
    .split(/\s*\/\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getHoursLineWeekday(line: string) {
  const normalizedLine = line.replace(/^요일\s*/, '');

  return WEEKDAY_LABELS.find(
    (weekdayLabel) =>
      normalizedLine.startsWith(`${weekdayLabel} `) ||
      normalizedLine.startsWith(`${weekdayLabel}요일`) ||
      normalizedLine.startsWith(`${weekdayLabel}:`),
  );
}

function getTodayHoursDisplay(value: string): HoursDisplay | null {
  const all = splitHoursByDay(value);
  const dayLines = all.filter((line) => getHoursLineWeekday(line));

  if (dayLines.length < 2) {
    return null;
  }

  const todayLabel = WEEKDAY_LABELS[new Date().getDay()];
  const today = all.find((line) => getHoursLineWeekday(line) === todayLabel) ?? dayLines[0];

  return { all, today };
}

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

function getRestaurantInfoDisplayValue(row: RestaurantInfoRowViewModel) {
  if (row.id !== 'website') {
    return row.value;
  }

  const websiteHref = getRestaurantInfoHref('website', row.value);

  if (!websiteHref) {
    return row.value;
  }

  try {
    const { hostname } = new URL(websiteHref);

    return hostname.replace(/^www\./i, '');
  } catch {
    return row.value.replace(/^https?:\/\//i, '').split('/')[0] ?? row.value;
  }
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
  onRowClick,
  rows = buildRestaurantInfoRows(info),
  showRowChevron = false,
  variant = 'card',
}: RestaurantInfoCardProps) {
  const [isHoursExpanded, setIsHoursExpanded] = useState(false);
  const hoursDisplay = useMemo(
    () => getTodayHoursDisplay(rows.find((row) => row.id === 'hours')?.value ?? ''),
    [rows],
  );

  const content = (
    <div className="flex w-full flex-col gap-3">
      {rows.map((row, index) => {
        const Icon = RESTAURANT_INFO_ICONS[row.id];
        const href = row.href;
        const shouldOpenInNewTab = Boolean(href);
        const displayValue = getRestaurantInfoDisplayValue(row);
        const selectionHoursValue =
          onRowClick && row.id === 'hours' && hoursDisplay?.today ? hoursDisplay.today : null;
        const isCollapsibleHours = row.id === 'hours' && Boolean(hoursDisplay) && !onRowClick;
        const isExpandedHoursRow = isCollapsibleHours && isHoursExpanded;
        const visibleHours = isHoursExpanded ? hoursDisplay?.all : hoursDisplay?.today;
        const rowContent = (
          <div
            className={`flex w-full gap-3 ${isExpandedHoursRow ? 'items-start' : 'items-center'}`}
          >
            <Icon
              aria-hidden="true"
              className="shrink-0 text-[var(--tb-color-icon-primary)]"
              size={ICON_TOKENS.size.md}
              strokeWidth={1.8}
            />
            <div className="min-w-0 flex-1">
              {isCollapsibleHours && visibleHours ? (
                <div className="space-y-1">
                  {Array.isArray(visibleHours) ? (
                    visibleHours.map((hoursLine) => (
                      <p
                        className="break-words text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]"
                        key={hoursLine}
                      >
                        {hoursLine}
                      </p>
                    ))
                  ) : (
                    <p className="break-words text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                      {visibleHours}
                    </p>
                  )}
                </div>
              ) : (
                <p className="break-words text-[13px] leading-relaxed text-[var(--tb-color-text-primary)]">
                  {selectionHoursValue ?? displayValue}
                </p>
              )}
            </div>
            {isCollapsibleHours ? (
              <button
                aria-expanded={isHoursExpanded}
                aria-label={isHoursExpanded ? '전체 영업시간 접기' : '전체 영업시간 펼치기'}
                className={`shrink-0 text-[var(--tb-color-icon-secondary)] transition-colors hover:text-[var(--tb-color-icon-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)] ${isExpandedHoursRow ? 'self-start' : 'self-center'}`}
                onClick={() => setIsHoursExpanded((current) => !current)}
                type="button"
              >
                {isHoursExpanded ? (
                  <ChevronUp aria-hidden="true" size={18} strokeWidth={1.9} />
                ) : (
                  <ChevronDown aria-hidden="true" size={18} strokeWidth={1.9} />
                )}
              </button>
            ) : null}
            {showRowChevron && onRowClick ? (
              <ChevronRight
                aria-hidden="true"
                className="shrink-0 self-center text-[var(--tb-color-icon-secondary)]"
                size={18}
                strokeWidth={1.9}
              />
            ) : null}
          </div>
        );

        return (
          <Fragment key={row.label}>
            {onRowClick ? (
              <button
                className="block w-full rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tb-color-border-strong)]"
                onClick={() => onRowClick(row)}
                type="button"
              >
                {rowContent}
              </button>
            ) : href ? (
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
  );

  if (variant === 'plain') {
    return content;
  }

  return (
    <SectionCard hoverEffect={false}>
      {content}
    </SectionCard>
  );
}
