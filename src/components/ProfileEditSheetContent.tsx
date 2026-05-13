import { Camera, ChevronDown, X } from 'lucide-react';
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import {
  PREFERENCE_INTAKE_QUESTIONS,
  type PreferenceIntakeProfile,
} from '../constants/preferenceIntakeData';
import { TASTE_SURVEY_CONTEXT_OPTIONS } from '../constants/tasteSurveyConfig';
import SelectionCard from './system/SelectionCard';
import type {
  TasteSurveyAgeRange,
  TasteSurveyRespondentContext,
  TasteSurveySexContext,
  TasteSurveySmokingStatus,
} from '../types/tasteSurvey';

interface ProfileEditSheetContentProps {
  avatarImageDataUrl: string | null;
  avatarStyle: CSSProperties;
  birthDate: string | null;
  displayName: string | null;
  formId: string;
  initials: string;
  nickname: string | null;
  preferenceProfile: PreferenceIntakeProfile | null;
  respondentContext: TasteSurveyRespondentContext;
  userTasteAccentStyle: CSSProperties;
  onSubmit: (input: {
    avatarImageDataUrl: string | null;
    birthDate: string | null;
    displayName: string;
    nickname: string;
    preferenceProfile: PreferenceIntakeProfile;
    respondentContext: TasteSurveyRespondentContext;
  }) => Promise<void> | void;
}

type ProfileEditPicker =
  | 'birthDate'
  | 'sexContext'
  | 'smokingStatus'
  | 'dietaryRestrictions'
  | null;

interface BirthDateParts {
  day: number;
  month: number;
  year: number;
}

const dietaryQuestion = PREFERENCE_INTAKE_QUESTIONS.find(
  (question) => question.id === 'dietaryRestrictions',
);
const PROFILE_PICKER_ROW_HEIGHT = 42;
const PROFILE_PICKER_VISIBLE_ROWS = 7;
const PROFILE_PICKER_HEIGHT = PROFILE_PICKER_ROW_HEIGHT * PROFILE_PICKER_VISIBLE_ROWS;
const PROFILE_PICKER_VERTICAL_PADDING =
  (PROFILE_PICKER_HEIGHT - PROFILE_PICKER_ROW_HEIGHT) / 2;
const PROFILE_PICKER_CYLINDER_RADIUS = 140;
const PROFILE_PICKER_CYLINDER_STEP_DEGREES = 14;
const PROFILE_PICKER_TEXT_SIZE = 22;

const emptyPreferenceProfile: PreferenceIntakeProfile = {
  allergies: [],
  avoidedSignals: [],
  dietaryRestrictions: [],
  explorationStyle: null,
  flavorIntensityPreference: null,
  preferredCuisineTypes: [],
  sharePreferenceWithRestaurant: null,
};

function getInitialPreferenceProfile(profile: PreferenceIntakeProfile | null) {
  return profile ?? emptyPreferenceProfile;
}

function parseBirthDate(value: string | null): BirthDateParts {
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

function formatBirthDate(parts: BirthDateParts) {
  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getAgeRangeFromBirthDate(birthDate: string): TasteSurveyAgeRange {
  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  if (age < 18) {
    return 'teen';
  }

  if (age <= 24) {
    return '18_24';
  }

  if (age <= 34) {
    return '25_34';
  }

  if (age <= 44) {
    return '35_44';
  }

  if (age <= 54) {
    return '45_54';
  }

  if (age <= 64) {
    return '55_64';
  }

  return '65_plus';
}

function getBirthDateLabel(value: string | null) {
  if (!value) {
    return '선택해 주세요';
  }

  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return '선택해 주세요';
  }

  return `${year}년 ${month}월 ${day}일`;
}

function resolveOptionLabel(
  options: readonly { label: string; value: string }[],
  value?: string,
) {
  return options.find((option) => option.value === value)?.label ?? '선택해 주세요';
}

function getDietarySummary(profile: PreferenceIntakeProfile) {
  if (!dietaryQuestion || profile.dietaryRestrictions.length === 0) {
    return '식이제한 없음';
  }

  const selectedLabels = profile.dietaryRestrictions
    .map((restriction) =>
      dietaryQuestion.options.find((option) => option.id === restriction)?.label,
    )
    .filter(Boolean);

  if (selectedLabels.length === 0) {
    return '식이제한 없음';
  }

  if (selectedLabels.length <= 2) {
    return selectedLabels.join(', ');
  }

  return `${selectedLabels[0]}, ${selectedLabels[1]} 외 ${selectedLabels.length - 2}개`;
}

export default function ProfileEditSheetContent({
  avatarImageDataUrl,
  avatarStyle,
  birthDate,
  displayName,
  formId,
  initials,
  nickname,
  preferenceProfile,
  respondentContext,
  userTasteAccentStyle,
  onSubmit,
}: ProfileEditSheetContentProps) {
  const [draftAvatarImageDataUrl, setDraftAvatarImageDataUrl] = useState<string | null>(
    avatarImageDataUrl,
  );
  const [draftBirthDate, setDraftBirthDate] = useState<string | null>(birthDate);
  const [draftBirthDateParts, setDraftBirthDateParts] = useState<BirthDateParts>(
    parseBirthDate(birthDate),
  );
  const [draftDisplayName, setDraftDisplayName] = useState(displayName ?? '');
  const [draftNickname, setDraftNickname] = useState(nickname ?? '');
  const [draftContext, setDraftContext] =
    useState<TasteSurveyRespondentContext>(respondentContext);
  const [draftPreferenceProfile, setDraftPreferenceProfile] = useState<PreferenceIntakeProfile>(
    getInitialPreferenceProfile(preferenceProfile),
  );
  const [activePicker, setActivePicker] = useState<ProfileEditPicker>(null);

  useEffect(() => {
    setDraftAvatarImageDataUrl(avatarImageDataUrl);
    setDraftBirthDate(birthDate);
    setDraftBirthDateParts(parseBirthDate(birthDate));
    setDraftDisplayName(displayName ?? '');
    setDraftNickname(nickname ?? '');
    setDraftContext(respondentContext);
    setDraftPreferenceProfile(getInitialPreferenceProfile(preferenceProfile));
  }, [avatarImageDataUrl, birthDate, displayName, nickname, preferenceProfile, respondentContext]);

  const dietaryOptions = useMemo(
    () => dietaryQuestion?.options ?? [],
    [],
  );
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: currentYear - 1919 }, (_, index) => currentYear - index);
  }, []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const days = useMemo(
    () =>
      Array.from(
        { length: getDaysInMonth(draftBirthDateParts.year, draftBirthDateParts.month) },
        (_, index) => index + 1,
      ),
    [draftBirthDateParts.month, draftBirthDateParts.year],
  );

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraftAvatarImageDataUrl(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const updateBirthDatePart = (field: keyof BirthDateParts, value: number) => {
    setDraftBirthDateParts((current) => {
      const next = { ...current, [field]: value };
      const maxDay = getDaysInMonth(next.year, next.month);

      if (next.day > maxDay) {
        next.day = maxDay;
      }

      return next;
    });
  };

  const confirmBirthDate = () => {
    const nextBirthDate = formatBirthDate(draftBirthDateParts);
    setDraftBirthDate(nextBirthDate);
    setDraftContext((current) => ({
      ...current,
      ageRange: getAgeRangeFromBirthDate(nextBirthDate),
    }));
    setActivePicker(null);
  };

  const handleDietaryToggle = (optionId: string) => {
    if (!dietaryQuestion) {
      return;
    }

    setDraftPreferenceProfile((currentProfile) => {
      const currentValue = currentProfile.dietaryRestrictions;
      const noneOptionId = dietaryQuestion.noneOptionId;

      if (optionId === noneOptionId) {
        return { ...currentProfile, dietaryRestrictions: [] };
      }

      const nextValue = currentValue.includes(optionId)
        ? currentValue.filter((item) => item !== optionId)
        : [...currentValue.filter((item) => item !== noneOptionId), optionId];

      return { ...currentProfile, dietaryRestrictions: nextValue };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void onSubmit({
      avatarImageDataUrl: draftAvatarImageDataUrl,
      birthDate: draftBirthDate,
      displayName: draftDisplayName.trim(),
      nickname: draftNickname.trim(),
      preferenceProfile: draftPreferenceProfile,
      respondentContext: draftContext,
    });
  };

  return (
    <>
      <form
        id={formId}
        className="flex flex-col gap-5"
        style={userTasteAccentStyle}
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-center gap-3 pt-1">
          <div className="relative size-24 rounded-full">
            <div
              className="flex size-24 items-center justify-center overflow-hidden rounded-full"
              style={draftAvatarImageDataUrl ? undefined : avatarStyle}
            >
              {draftAvatarImageDataUrl ? (
                <img
                  alt=""
                  className="size-full object-cover"
                  src={draftAvatarImageDataUrl}
                />
              ) : (
                <span className="text-[18px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.34)]">
                  {initials}
                </span>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-full border border-white/50 shadow-[inset_0_0_0_1px_rgba(15,15,15,0.08)]" />
          </div>

          <div className="flex items-center gap-3">
            <label
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--tb-radius-12)] px-3 text-[12px] font-semibold transition-transform active:scale-[0.99]"
              style={{
                background: 'var(--tb-user-accent-tint-surface)',
                color: 'var(--tb-user-accent-dark)',
              }}
            >
              <Camera aria-hidden="true" className="size-4" strokeWidth={2} />
              사진 추가
              <input
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                type="file"
              />
            </label>
            {draftAvatarImageDataUrl ? (
              <button
                type="button"
                className="px-1 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)]"
                onClick={() => setDraftAvatarImageDataUrl(null)}
              >
                삭제
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <ProfileEditTextField
            label="이름"
            placeholder="이름을 입력해 주세요"
            value={draftDisplayName}
            onChange={setDraftDisplayName}
          />
          <ProfileEditTextField
            label="닉네임"
            placeholder="Taste Buddy에서 사용할 이름"
            value={draftNickname}
            onChange={setDraftNickname}
          />
          <ProfileEditSelectField
            label="연령"
            value={getBirthDateLabel(draftBirthDate)}
            onClick={() => setActivePicker('birthDate')}
          />
          <ProfileEditSelectField
            label="성별"
            value={resolveOptionLabel(
              TASTE_SURVEY_CONTEXT_OPTIONS.sexContext,
              draftContext.sexContext,
            )}
            onClick={() => setActivePicker('sexContext')}
          />
          <ProfileEditSelectField
            label="흡연유무"
            value={resolveOptionLabel(
              TASTE_SURVEY_CONTEXT_OPTIONS.smokingStatus,
              draftContext.smokingStatus,
            )}
            onClick={() => setActivePicker('smokingStatus')}
          />
          <ProfileEditSelectField
            label="식이제한"
            value={getDietarySummary(draftPreferenceProfile)}
            onClick={() => setActivePicker('dietaryRestrictions')}
          />
        </div>
      </form>

      {activePicker ? (
        <div
          className="fixed inset-0 z-[80] flex items-end bg-black/45 p-5"
          onClick={() => setActivePicker(null)}
        >
          <div
            className="relative w-full rounded-[24px] bg-[var(--tb-color-bg-focus)] px-5 pb-4 pt-4 shadow-[var(--tb-shadow-drawer)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="선택 카드 닫기"
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors active:opacity-70"
              onClick={() => setActivePicker(null)}
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </button>
            {activePicker === 'birthDate' ? (
              <ProfileBirthDatePicker
                days={days}
                months={months}
                parts={draftBirthDateParts}
                years={years}
                onChange={updateBirthDatePart}
                onConfirm={confirmBirthDate}
              />
            ) : null}

            {activePicker === 'sexContext' ? (
              <ProfileRadioPicker
                title="성별"
                options={TASTE_SURVEY_CONTEXT_OPTIONS.sexContext}
                selectedValue={draftContext.sexContext}
                onSelect={(value) => {
                  setDraftContext((current) => ({
                    ...current,
                    sexContext: value as TasteSurveySexContext | undefined,
                  }));
                }}
              />
            ) : null}

            {activePicker === 'smokingStatus' ? (
              <ProfileRadioPicker
                title="흡연유무"
                options={TASTE_SURVEY_CONTEXT_OPTIONS.smokingStatus}
                selectedValue={draftContext.smokingStatus}
                onSelect={(value) => {
                  setDraftContext((current) => ({
                    ...current,
                    smokingStatus: value as TasteSurveySmokingStatus | undefined,
                  }));
                }}
              />
            ) : null}

            {activePicker === 'dietaryRestrictions' ? (
              <ProfileDietaryPicker
                options={dietaryOptions}
                selectedValues={draftPreferenceProfile.dietaryRestrictions}
                noneOptionId={dietaryQuestion?.noneOptionId}
                onSelect={handleDietaryToggle}
                onConfirm={() => setActivePicker(null)}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProfileEditTextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
        {label}
      </span>
      <input
        className="h-12 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white px-3 text-[14px] font-semibold text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:font-medium placeholder:text-[var(--tb-color-text-hint)] focus:border-[var(--tb-color-border-strong)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function ProfileEditSelectField({
  label,
  onClick,
  value,
}: {
  label: string;
  onClick: () => void;
  value: string;
}) {
  const isEmpty = value === '선택해 주세요';

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
        {label}
      </span>
      <button
        type="button"
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white px-3 text-left text-[14px] font-semibold outline-none transition-colors active:scale-[0.995] ${
          isEmpty ? 'text-[var(--tb-color-text-hint)]' : 'text-[var(--tb-color-text-primary)]'
        }`}
        onClick={onClick}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-[var(--tb-color-icon-secondary)]"
          strokeWidth={2.2}
        />
      </button>
    </div>
  );
}

function ProfileBirthDatePicker({
  days,
  months,
  onChange,
  onConfirm,
  parts,
  years,
}: {
  days: number[];
  months: number[];
  onChange: (field: keyof BirthDateParts, value: number) => void;
  onConfirm: () => void;
  parts: BirthDateParts;
  years: number[];
}) {
  return (
    <div>
      <h3 className="text-center text-[16px] font-bold text-[var(--tb-color-text-primary)]">
        생년월일
      </h3>
      <div className="relative mt-2 h-[294px] overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-9 -translate-y-1/2 rounded-[18px] bg-[var(--tb-color-surface-muted)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14 bg-gradient-to-b from-[var(--tb-color-bg-focus)] via-[var(--tb-color-bg-focus)]/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-[var(--tb-color-bg-focus)] via-[var(--tb-color-bg-focus)]/80 to-transparent" />
        <div className="relative z-10 grid h-full grid-cols-3 gap-1">
          <ProfilePickerSelect
            suffix="년"
            value={parts.year}
            values={years}
            onChange={(value) => onChange('year', value)}
          />
          <ProfilePickerSelect
            suffix="월"
            value={parts.month}
            values={months}
            onChange={(value) => onChange('month', value)}
          />
          <ProfilePickerSelect
            suffix="일"
            value={parts.day}
            values={days}
            onChange={(value) => onChange('day', value)}
          />
        </div>
      </div>
      <button
        type="button"
        className="mt-4 h-12 w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[14px] font-bold text-[var(--tb-color-text-inverse)]"
        onClick={onConfirm}
      >
        선택 완료
      </button>
    </div>
  );
}

function ProfilePickerSelect({
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
    if (lastCommittedValueRef.current === value) {
      return;
    }

    lastCommittedValueRef.current = value;
    scrollRef.current?.scrollTo({
      top: selectedIndex * PROFILE_PICKER_ROW_HEIGHT,
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
      Math.max(0, Math.round(scrollElement.scrollTop / PROFILE_PICKER_ROW_HEIGHT)),
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
          const angle = distance * PROFILE_PICKER_CYLINDER_STEP_DEGREES;
          const angleRadians = (angle * Math.PI) / 180;
          const offset = Math.sin(angleRadians) * PROFILE_PICKER_CYLINDER_RADIUS;
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
                fontSize: PROFILE_PICKER_TEXT_SIZE,
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
          paddingBottom: PROFILE_PICKER_VERTICAL_PADDING,
          paddingTop: PROFILE_PICKER_VERTICAL_PADDING,
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

function ProfileRadioPicker({
  onSelect,
  options,
  selectedValue,
  title,
}: {
  onSelect: (value: string | undefined) => void;
  options: readonly { label: string; value: string }[];
  selectedValue?: string;
  title: string;
}) {
  return (
    <div>
      <h3 className="text-center text-[16px] font-bold text-[var(--tb-color-text-primary)]">
        {title}
      </h3>
      <div className="mt-4 flex flex-col gap-2">
        {options.map((option) => {
          const selected = selectedValue === option.value;

          return (
            <SelectionCard
              key={option.value}
              className="min-h-12 items-center rounded-[var(--tb-radius-12)] border-transparent bg-[var(--tb-color-surface-muted)] px-4 py-3 shadow-none hover:border-transparent hover:bg-[var(--tb-color-surface-muted)]"
              indicator="radio"
              selected={selected}
              singleLine
              title={option.label}
              onClick={() => onSelect(selected ? undefined : option.value)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProfileDietaryPicker({
  noneOptionId,
  onConfirm,
  onSelect,
  options,
  selectedValues,
}: {
  noneOptionId?: string;
  onConfirm: () => void;
  onSelect: (value: string) => void;
  options: readonly { id: string; label: string }[];
  selectedValues: string[];
}) {
  return (
    <div>
      <h3 className="text-center text-[16px] font-bold text-[var(--tb-color-text-primary)]">
        식이제한
      </h3>
      <div className="mt-4 flex max-h-[44vh] flex-col gap-2 overflow-y-auto">
        {options.map((option) => {
          const selected =
            option.id === noneOptionId
              ? selectedValues.length === 0
              : selectedValues.includes(option.id);

          return (
            <SelectionCard
              key={option.id}
              className="min-h-12 items-center rounded-[var(--tb-radius-12)] border-transparent bg-[var(--tb-color-surface-muted)] px-4 py-3 shadow-none hover:border-transparent hover:bg-[var(--tb-color-surface-muted)]"
              indicator="checkbox"
              selected={selected}
              singleLine
              title={option.label}
              onClick={() => onSelect(option.id)}
            />
          );
        })}
      </div>
      <button
        type="button"
        className="mt-4 h-12 w-full rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[14px] font-bold text-[var(--tb-color-text-inverse)]"
        onClick={onConfirm}
      >
        선택 완료
      </button>
    </div>
  );
}
