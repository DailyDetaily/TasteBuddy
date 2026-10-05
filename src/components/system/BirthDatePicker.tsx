import { useEffect, useId, useRef } from 'react';

export interface BirthDateParts {
  day: number;
  month: number;
  year: number;
}

const PICKER_ROW_HEIGHT = 42;
const PICKER_VISIBLE_ROWS = 7;
const PICKER_HEIGHT = PICKER_ROW_HEIGHT * PICKER_VISIBLE_ROWS;
const PICKER_CYLINDER_RADIUS = 140;
const PICKER_CYLINDER_STEP_DEGREES = 14;
const PICKER_TEXT_SIZE = 22;

// Row geometry measured from the Korean iOS 26.5 profile DatePicker capture.
const IOS_PROFILE_ROW_OFFSETS = [0, 31.5, 58.5, 77.5, 87.5];
const IOS_PROFILE_ROW_SCALE_X = [1, 0.89, 0.87, 0.85, 0.82];
const IOS_PROFILE_ROW_SCALE_Y = [1, 0.81, 0.61, 0.38, 0.1];
const IOS_PROFILE_ROW_GRAY = [56, 165, 172, 206, 239];

export function parseBirthDate(value: string | null): BirthDateParts {
  if (value) {
    const [year, month, day] = value.split('-').map(Number);

    if (year && month && day) {
      return { day, month, year };
    }
  }

  return { day: 10, month: 7, year: 1996 };
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function formatBirthDate(parts: BirthDateParts) {
  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function getBirthDateLabel(value: string | null) {
  if (!value) {
    return '선택해 주세요';
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return '선택해 주세요';
  }

  return `${year}년 ${month}월 ${day}일`;
}

export function getDefaultBirthDateYears() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: currentYear - 1919 }, (_, index) => currentYear - index);
}

interface BirthDatePickerProps {
  days: number[];
  months: number[];
  onChange: (field: keyof BirthDateParts, value: number) => void;
  onConfirm?: () => void;
  parts: BirthDateParts;
  showConfirmButton?: boolean;
  showTitle?: boolean;
  wheelHeight?: number;
  appearance?: 'default' | 'ios-profile';
  title?: string;
  years: number[];
}

export default function BirthDatePicker({
  days,
  months,
  onChange,
  onConfirm,
  parts,
  showConfirmButton = true,
  showTitle = true,
  wheelHeight = PICKER_HEIGHT,
  appearance = 'default',
  title = '생년월일',
  years,
}: BirthDatePickerProps) {
  return (
    <div className={appearance === 'ios-profile' ? 'tb-birth-picker-ios' : undefined}>
      {showTitle && <h3 className="text-center text-[16px] font-bold text-[var(--tb-color-text-primary)]">
        {title}
      </h3>}
      <div className={`relative overflow-hidden ${showTitle ? 'mt-2' : ''}`} style={{ height: wheelHeight }}>
        <div className="tb-birth-picker-band pointer-events-none absolute left-0 right-0 top-1/2 h-9 -translate-y-1/2 rounded-[18px] bg-[var(--tb-color-surface-muted)]" />
        <div className="tb-birth-picker-fade pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-[var(--tb-color-bg-focus)] via-[var(--tb-color-bg-focus)]/80 to-transparent" />
        <div className="tb-birth-picker-fade pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-[var(--tb-color-bg-focus)] via-[var(--tb-color-bg-focus)]/80 to-transparent" />
        <div className="tb-birth-picker-columns relative z-10 grid h-full grid-cols-3 gap-1">
          <BirthDatePickerSelect
            height={wheelHeight}
            iosProfile={appearance === 'ios-profile'}
            suffix="년"
            value={parts.year}
            values={years}
            onChange={(value) => onChange('year', value)}
          />
          <BirthDatePickerSelect
            height={wheelHeight}
            iosProfile={appearance === 'ios-profile'}
            suffix="월"
            value={parts.month}
            values={months}
            onChange={(value) => onChange('month', value)}
          />
          <BirthDatePickerSelect
            height={wheelHeight}
            iosProfile={appearance === 'ios-profile'}
            suffix="일"
            value={parts.day}
            values={days}
            onChange={(value) => onChange('day', value)}
          />
        </div>
      </div>
      {showConfirmButton ? (
        <button
          type="button"
          className="mt-4 h-12 w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[14px] font-bold text-[var(--tb-color-text-inverse)]"
          onClick={onConfirm}
        >
          선택 완료
        </button>
      ) : null}
    </div>
  );
}

function BirthDatePickerSelect({
  height,
  iosProfile,
  onChange,
  suffix,
  value,
  values,
}: {
  height: number;
  iosProfile: boolean;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
  values: number[];
}) {
  const optionId = useId();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastCommittedValueRef = useRef(value);
  const selectedIndex = Math.max(0, values.indexOf(value));
  const cyclic = iosProfile && (suffix === '월' ? values.length === 12 : suffix === '일' && values.length >= 28);
  const scrollValues = cyclic ? [...values, ...values, ...values] : values;
  const scrollIndex = selectedIndex + (cyclic ? values.length : 0);
  const visibleOptions = Array.from({ length: 9 }, (_, index) => index - 4)
    .filter(offset => cyclic || (selectedIndex + offset >= 0 && selectedIndex + offset < values.length))
    .map(offset => ({
      distance: Math.abs(offset),
      offset,
      optionValue: values[(selectedIndex + offset + values.length) % values.length],
    }));

  useEffect(() => {
    lastCommittedValueRef.current = value;
    scrollRef.current?.scrollTo({
      top: scrollIndex * PICKER_ROW_HEIGHT,
      behavior: 'auto',
    });
  }, [scrollIndex, value]);

  const handleScroll = () => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    const nextIndex = Math.min(
      scrollValues.length - 1,
      Math.max(0, Math.round(scrollElement.scrollTop / PICKER_ROW_HEIGHT)),
    );
    const nextValue = scrollValues[nextIndex];

    if (nextValue !== undefined && nextValue !== (iosProfile ? lastCommittedValueRef.current : value)) {
      lastCommittedValueRef.current = nextValue;
      onChange(nextValue);
    }
  };

  return (
    <div className="relative h-full overflow-hidden rounded-xl focus-within:outline focus-within:outline-2 focus-within:outline-[var(--tb-color-text-primary)] focus-within:outline-offset-[-2px]" style={{ perspective: '420px' }}>
      <div className="pointer-events-none absolute inset-0 z-10">
        {visibleOptions.map(({ distance, offset: rowOffset, optionValue }) => {
          const selected = rowOffset === 0;
          const direction = rowOffset < 0 ? -1 : 1;
          const angle = distance * PICKER_CYLINDER_STEP_DEGREES;
          const angleRadians = (angle * Math.PI) / 180;
          const offset = Math.sin(angleRadians) * PICKER_CYLINDER_RADIUS;
          const colorClass = selected
            ? 'text-[var(--tb-color-text-primary)]'
            : distance <= 1
              ? 'text-[var(--tb-color-text-muted)]'
              : 'text-[var(--tb-color-text-faint)]';
          const opacity = [1, 0.64, 0.38, 0.22, 0.1][distance] ?? 0.1;
          const rotateX = -direction * angle;
          const scaleY = [1, 0.78, 0.56, 0.38, 0.24][distance] ?? 0.24;
          const blur = [0, 0, 0.25, 0.55, 0.85][distance] ?? 0.85;
          const skewX = direction * distance * 0.55;
          const depth = distance * 5;

          return (
            <div
              key={rowOffset}
              aria-hidden="true"
              className={`absolute left-0 top-1/2 flex h-9 w-full -translate-y-1/2 items-center justify-center text-center font-normal transition-[color,opacity,transform] duration-150 motion-reduce:transition-none ${colorClass}`}
              style={{
                backfaceVisibility: 'hidden',
                filter: !iosProfile && blur > 0 ? `blur(${blur}px)` : undefined,
                fontSize: iosProfile ? 23 : PICKER_TEXT_SIZE,
                fontFamily: iosProfile ? '-apple-system, BlinkMacSystemFont, sans-serif' : undefined,
                color: iosProfile ? `rgb(${IOS_PROFILE_ROW_GRAY[distance]} ${IOS_PROFILE_ROW_GRAY[distance]} ${IOS_PROFILE_ROW_GRAY[distance]})` : undefined,
                justifyContent: iosProfile && suffix !== '년' ? 'flex-start' : undefined,
                opacity: iosProfile ? 1 : opacity,
                transform: iosProfile ? `translateY(${direction * IOS_PROFILE_ROW_OFFSETS[distance]}px) scale(${IOS_PROFILE_ROW_SCALE_X[distance]}, ${IOS_PROFILE_ROW_SCALE_Y[distance]})` : [
                  `translateY(${direction * offset}px)`,
                  `rotateX(${rotateX}deg)`,
                  `translateZ(${-depth}px)`,
                  `skewX(${skewX}deg)`,
                  `scaleY(${scaleY})`,
                ].join(' '),
                transformOrigin: iosProfile && suffix !== '년' ? 'left center' : 'center center',
                zIndex: 30 - distance,
              }}
            >
              {optionValue}
              {suffix}
            </div>
          );
        })}
      </div>
      <div
        aria-label={suffix === '년' ? '연도' : suffix}
        aria-activedescendant={`${optionId}-${scrollIndex}`}
        tabIndex={0}
        className="absolute inset-0 z-20 snap-y snap-mandatory overflow-y-auto opacity-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollRef}
        role="listbox"
        style={{
          paddingBottom: (height - PICKER_ROW_HEIGHT) / 2,
          paddingTop: (height - PICKER_ROW_HEIGHT) / 2,
        }}
        onScroll={handleScroll}
        onKeyDown={(event) => {
          const nextIndex = event.key === 'ArrowDown' ? (cyclic ? (selectedIndex + 1) % values.length : Math.min(values.length - 1, selectedIndex + 1))
            : event.key === 'ArrowUp' ? (cyclic ? (selectedIndex - 1 + values.length) % values.length : Math.max(0, selectedIndex - 1))
              : event.key === 'Home' ? 0
                : event.key === 'End' ? values.length - 1 : null;
          if (nextIndex === null) return;
          event.preventDefault();
          if (values[nextIndex] !== undefined) onChange(values[nextIndex]);
        }}
      >
        {scrollValues.map((optionValue, optionIndex) => (
          <button
            key={optionIndex}
            id={`${optionId}-${optionIndex}`}
            type="button"
            tabIndex={-1}
            aria-selected={optionIndex === scrollIndex}
            aria-hidden={cyclic && (optionIndex < values.length || optionIndex >= values.length * 2) || undefined}
            className="flex h-[42px] w-full snap-center items-center justify-center"
            role="option"
            onClick={() => onChange(optionValue)}
          >
            {optionValue}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}
