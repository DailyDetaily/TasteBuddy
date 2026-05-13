import { Camera, ChevronDown, X } from 'lucide-react';
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

import {
  PREFERENCE_INTAKE_QUESTIONS,
  type PreferenceIntakeProfile,
} from '../constants/preferenceIntakeData';
import { TASTE_SURVEY_CONTEXT_OPTIONS } from '../constants/tasteSurveyConfig';
import BirthDatePicker, {
  formatBirthDate,
  getBirthDateLabel,
  getDaysInMonth,
  getDefaultBirthDateYears,
  parseBirthDate,
  type BirthDateParts,
} from './system/BirthDatePicker';
import SelectionCard from './system/SelectionCard';
import type {
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

const dietaryQuestion = PREFERENCE_INTAKE_QUESTIONS.find(
  (question) => question.id === 'dietaryRestrictions',
);

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
  const years = useMemo(getDefaultBirthDateYears, []);
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
      birthDate: nextBirthDate,
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
      respondentContext: {
        ...draftContext,
        birthDate: draftBirthDate ?? undefined,
      },
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
            label="생년월일"
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
              <BirthDatePicker
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
