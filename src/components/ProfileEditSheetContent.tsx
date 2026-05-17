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
  isSubmitting?: boolean;
  nickname: string | null;
  preferenceProfile: PreferenceIntakeProfile | null;
  respondentContext: TasteSurveyRespondentContext;
  statusMessage?: string | null;
  userTasteAccentStyle: CSSProperties;
  onAvatarPreparationChange?: (isPreparing: boolean) => void;
  onSubmit: (input: {
    avatarFile: File | null;
    birthDate: string | null;
    displayName: string;
    nickname: string;
    preferenceProfile: PreferenceIntakeProfile;
    respondentContext: TasteSurveyRespondentContext;
    shouldRemoveAvatar: boolean;
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

const PROFILE_AVATAR_SIZE = 512;
const PROFILE_AVATAR_QUALITY = 0.84;
const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_AVATAR_OUTPUT_TYPE = 'image/webp';

function detectImageTypeFromBytes(bytes: Uint8Array) {
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { extension: 'webp', type: 'image/webp' };
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { extension: 'png', type: 'image/png' };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: 'jpg', type: 'image/jpeg' };
  }

  return null;
}

function getInitialPreferenceProfile(profile: PreferenceIntakeProfile | null) {
  return profile ?? emptyPreferenceProfile;
}

async function loadImageFromFile(file: File) {
  const sourceUrl = URL.createObjectURL(file);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('프로필 사진을 불러오지 못했습니다.'));
      image.src = sourceUrl;
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function normalizeProfileAvatarFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    throw new Error('프로필 사진은 5MB 이하로 올려 주세요.');
  }

  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('프로필 사진을 처리하지 못했습니다.');
  }

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;

  canvas.width = PROFILE_AVATAR_SIZE;
  canvas.height = PROFILE_AVATAR_SIZE;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    PROFILE_AVATAR_SIZE,
    PROFILE_AVATAR_SIZE,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, PROFILE_AVATAR_OUTPUT_TYPE, PROFILE_AVATAR_QUALITY);
  });

  if (!blob) {
    throw new Error('프로필 사진을 저장 형식으로 변환하지 못했습니다.');
  }

  const buffer = await blob.arrayBuffer();
  const detectedImageType = detectImageTypeFromBytes(new Uint8Array(buffer));
  const outputType = detectedImageType?.type ?? (blob.type || 'image/png');
  const outputExtension =
    detectedImageType?.extension ?? (outputType === 'image/webp' ? 'webp' : 'png');

  return new File([buffer], `profile-avatar.${outputExtension}`, { type: outputType });
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
  isSubmitting = false,
  nickname,
  preferenceProfile,
  respondentContext,
  statusMessage,
  userTasteAccentStyle,
  onAvatarPreparationChange,
  onSubmit,
}: ProfileEditSheetContentProps) {
  const [draftAvatarPreviewUrl, setDraftAvatarPreviewUrl] = useState<string | null>(null);
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [isPreparingAvatar, setIsPreparingAvatar] = useState(false);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);
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
    setDraftAvatarFile(null);
    setAvatarMessage(null);
    setIsPreparingAvatar(false);
    onAvatarPreparationChange?.(false);
    setDraftAvatarPreviewUrl((currentUrl) => {
      if (currentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
    setShouldRemoveAvatar(false);
    setDraftBirthDate(birthDate);
    setDraftBirthDateParts(parseBirthDate(birthDate));
    setDraftDisplayName(displayName ?? '');
    setDraftNickname(nickname ?? '');
    setDraftContext(respondentContext);
    setDraftPreferenceProfile(getInitialPreferenceProfile(preferenceProfile));
  }, [
    avatarImageDataUrl,
    birthDate,
    displayName,
    nickname,
    onAvatarPreparationChange,
    preferenceProfile,
    respondentContext,
  ]);

  useEffect(
    () => () => {
      if (draftAvatarPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(draftAvatarPreviewUrl);
      }
    },
    [draftAvatarPreviewUrl],
  );

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

  const draftAvatarImageSrc = shouldRemoveAvatar
    ? null
    : draftAvatarPreviewUrl ?? avatarImageDataUrl;

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAvatarMessage('사진을 프로필용 이미지로 준비하고 있어요.');
    setIsPreparingAvatar(true);
    onAvatarPreparationChange?.(true);

    void (async () => {
      try {
        const normalizedFile = await normalizeProfileAvatarFile(file);
        const previewUrl = URL.createObjectURL(normalizedFile);

        setDraftAvatarPreviewUrl((currentUrl) => {
          if (currentUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(currentUrl);
          }

          return previewUrl;
        });
        setDraftAvatarFile(normalizedFile);
        setAvatarMessage('사진이 준비되었어요. 저장을 누르면 프로필에 반영됩니다.');
        setShouldRemoveAvatar(false);
      } catch (error) {
        console.warn('Failed to prepare profile avatar.', error);
        setAvatarMessage(
          error instanceof Error
            ? error.message
            : '프로필 사진을 준비하지 못했습니다. 다른 이미지를 선택해 주세요.',
        );
      } finally {
        setIsPreparingAvatar(false);
        onAvatarPreparationChange?.(false);
      }
    })();
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

    if (isPreparingAvatar || isSubmitting) {
      return;
    }

    void onSubmit({
      avatarFile: draftAvatarFile,
      birthDate: draftBirthDate,
      displayName: draftDisplayName.trim(),
      nickname: draftNickname.trim(),
      preferenceProfile: draftPreferenceProfile,
      respondentContext: {
        ...draftContext,
        birthDate: draftBirthDate ?? undefined,
      },
      shouldRemoveAvatar,
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
              style={draftAvatarImageSrc ? undefined : avatarStyle}
            >
              {draftAvatarImageSrc ? (
                <img
                  alt=""
                  className="size-full object-cover"
                  src={draftAvatarImageSrc}
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
                disabled={isPreparingAvatar || isSubmitting}
                onChange={handleAvatarChange}
                type="file"
              />
            </label>
            {draftAvatarImageSrc ? (
              <button
                type="button"
                className="px-1 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)]"
                onClick={() => {
                  setDraftAvatarPreviewUrl((currentUrl) => {
                    if (currentUrl?.startsWith('blob:')) {
                      URL.revokeObjectURL(currentUrl);
                    }

                    return null;
                  });
                  setDraftAvatarFile(null);
                  setAvatarMessage('프로필 사진을 삭제하려면 저장을 눌러 주세요.');
                  setShouldRemoveAvatar(true);
                }}
              >
                삭제
              </button>
            ) : null}
          </div>
          {avatarMessage || statusMessage ? (
            <p
              className="max-w-[260px] text-center text-[12px] leading-relaxed"
              style={{
                color: statusMessage
                  ? 'var(--tb-color-feedback-danger, #b42318)'
                  : 'var(--tb-color-text-muted)',
              }}
            >
              {statusMessage ?? avatarMessage}
            </p>
          ) : null}
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
            helperText="친구가 나를 찾는 고유 닉네임입니다."
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
  helperText,
  label,
  onChange,
  placeholder,
  value,
}: {
  helperText?: string;
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
      {helperText ? (
        <span className="text-[11px] leading-relaxed text-[var(--tb-color-text-faint)]">
          {helperText}
        </span>
      ) : null}
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
