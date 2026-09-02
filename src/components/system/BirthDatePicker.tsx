import { useEffect, useRef } from 'react';

export interface BirthDateParts {
  day: number;
  month: number;
  year: number;
}

const PICKER_ROW_HEIGHT = 42;
const PICKER_VISIBLE_ROWS = 7;
const PICKER_HEIGHT = PICKER_ROW_HEIGHT * PICKER_VISIBLE_ROWS;
const PICKER_VERTICAL_PADDING = (PICKER_HEIGHT - PICKER_ROW_HEIGHT) / 2;
const PICKER_CYLINDER_RADIUS = 140;
const PICKER_CYLINDER_STEP_DEGREES = 14;
const PICKER_TEXT_SIZE = 22;

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
  title = '생년월일',
  years,
}: BirthDatePickerProps) {
  return (
    <div>
      <h3 className="text-center text-[16px] font-bold text-[var(--tb-color-text-primary)]">
        {title}
      </h3>
      <div className="relative mt-2 h-[294px] overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-9 -translate-y-1/2 rounded-[18px] bg-[var(--tb-color-surface-muted)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-[var(--tb-color-bg-focus)] via-[var(--tb-color-bg-focus)]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-[var(--tb-color-bg-focus)] via-[var(--tb-color-bg-focus)]/80 to-transparent" />
        <div className="relative z-10 grid h-full grid-cols-3 gap-1">
          <BirthDatePickerSelect
            suffix="년"
            value={parts.year}
            values={years}
            onChange={(value) => onChange('year', value)}
          />
          <BirthDatePickerSelect
            suffix="월"
            value={parts.month}
            values={months}
            onChange={(value) => onChange('month', value)}
          />
          <BirthDatePickerSelect
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
  onChange,
  suffix,
  value,
  values,
}: {
  onChange: (value: number) => void;
  suffix: string;
  value: number;
  values: number[];
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastCommittedValueRef = useRef(value);
  const selectedIndex = Math.max(0, values.indexOf(value));
  const visibleOptions = values
    .map((optionValue, optionIndex) => ({
      distance: Math.min(Math.abs(optionIndex - selectedIndex), 4),
      optionIndex,
      optionValue,
    }))
    .filter((option) => Math.abs(option.optionIndex - selectedIndex) <= 4);

  useEffect(() => {
    lastCommittedValueRef.current = value;
    scrollRef.current?.scrollTo({
      top: selectedIndex * PICKER_ROW_HEIGHT,
      behavior: 'auto',
    });
  }, [selectedIndex, value]);

  const handleScroll = () => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    const nextIndex = Math.min(
      values.length - 1,
      Math.max(0, Math.round(scrollElement.scrollTop / PICKER_ROW_HEIGHT)),
    );
    const nextValue = values[nextIndex];

    if (nextValue !== undefined && nextValue !== value) {
      lastCommittedValueRef.current = nextValue;
      onChange(nextValue);
    }
  };

  return (
    <div className="relative h-full overflow-hidden" style={{ perspective: '420px' }}>
      <div className="pointer-events-none absolute inset-0 z-10">
        {visibleOptions.map(({ distance, optionIndex, optionValue }) => {
          const selected = optionValue === value;
          const direction = optionIndex < selectedIndex ? -1 : 1;
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
              key={optionValue}
              aria-hidden="true"
              className={`absolute left-0 top-1/2 flex h-9 w-full -translate-y-1/2 items-center justify-center text-center font-normal transition-[color,opacity,transform] duration-150 ${colorClass}`}
              style={{
                backfaceVisibility: 'hidden',
                filter: blur > 0 ? `blur(${blur}px)` : undefined,
                fontSize: PICKER_TEXT_SIZE,
                opacity,
                transform: [
                  `translateY(${direction * offset}px)`,
                  `rotateX(${rotateX}deg)`,
                  `translateZ(${-depth}px)`,
                  `skewX(${skewX}deg)`,
                  `scaleY(${scaleY})`,
                ].join(' '),
                transformOrigin: 'center center',
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
        aria-label={suffix}
        className="absolute inset-0 z-20 snap-y snap-mandatory overflow-y-auto opacity-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollRef}
        role="listbox"
        style={{
          paddingBottom: PICKER_VERTICAL_PADDING,
          paddingTop: PICKER_VERTICAL_PADDING,
        }}
        onScroll={handleScroll}
      >
        {values.map((optionValue) => (
          <button
            key={optionValue}
            type="button"
            aria-selected={optionValue === value}
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
