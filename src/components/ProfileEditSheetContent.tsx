import { Camera, ChevronDown, X } from 'lucide-react';
import {
  ChangeEvent,
  FormEvent,
  type PointerEvent as ReactPointerEvent,
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
import { resolvePublicMediaPath } from '../lib/mediaAssets';
import {
  deleteSupabaseProfileAvatar,
  listSupabaseProfileAvatars,
} from '../lib/supabase';
import ProfileAvatarEditorScreen from './ProfileAvatarEditorScreen';
import BirthDatePicker, {
  formatBirthDate,
  getBirthDateLabel,
  getDaysInMonth,
  getDefaultBirthDateYears,
  parseBirthDate,
  type BirthDateParts,
} from './system/BirthDatePicker';
import SelectionCard from './system/SelectionCard';
import TasteProfileAvatar from './system/TasteProfileAvatar';
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
  onAvatarEditorOpenChange?: (isOpen: boolean) => void;
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
const PROFILE_AVATAR_EDITOR_SIZE = 240;
const PROFILE_AVATAR_QUALITY = 0.84;
const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_AVATAR_OUTPUT_TYPE = 'image/webp';
const PROFILE_AVATAR_MIN_SCALE = 1;
const PROFILE_AVATAR_MAX_SCALE = 3;

interface AvatarCropState {
  naturalHeight: number;
  naturalWidth: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  sourceUrl: string;
}

interface AvatarAlbumItem extends AvatarCropState {
  id: string;
  label: string;
}

interface StoredAvatarItem {
  id: string;
  path: string;
  src: string;
}

interface AvatarCropOffset {
  x: number;
  y: number;
}

interface AvatarPointerPosition {
  x: number;
  y: number;
}

interface AvatarGestureState {
  initialCenterX: number;
  initialCenterY: number;
  initialDistance: number;
  pointerId: number | null;
  startOffsetX: number;
  startOffsetY: number;
  startScale: number;
}

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

async function loadImageFromUrl(sourceUrl: string) {
  const loadImage = (useAnonymousCors: boolean) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      if (useAnonymousCors) {
        image.crossOrigin = 'anonymous';
      }

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('프로필 사진을 불러오지 못했습니다.'));
      image.src = sourceUrl;
    });

  try {
    return await loadImage(true);
  } catch (error) {
    if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:')) {
      throw error;
    }

    return await loadImage(false);
  }
}

async function loadCanvasSafeImageFromUrl(sourceUrl: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('프로필 사진을 불러오지 못했습니다.'));
    image.src = sourceUrl;
  });
}

function validateProfileAvatarFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    throw new Error('프로필 사진은 5MB 이하로 올려 주세요.');
  }
}

function getAvatarCropLayout(cropState: AvatarCropState, editorSize = PROFILE_AVATAR_EDITOR_SIZE) {
  const baseScale = Math.max(
    editorSize / cropState.naturalWidth,
    editorSize / cropState.naturalHeight,
  );
  const renderedWidth = cropState.naturalWidth * baseScale * cropState.scale;
  const renderedHeight = cropState.naturalHeight * baseScale * cropState.scale;

  return {
    height: renderedHeight,
    left: (editorSize - renderedWidth) / 2 + cropState.offsetX,
    top: (editorSize - renderedHeight) / 2 + cropState.offsetY,
    width: renderedWidth,
  };
}

function clampAvatarCropOffset(
  cropState: AvatarCropState,
  nextOffset: AvatarCropOffset,
  editorSize = PROFILE_AVATAR_EDITOR_SIZE,
) {
  const layout = getAvatarCropLayout(
    {
      ...cropState,
      offsetX: 0,
      offsetY: 0,
    },
    editorSize,
  );
  const maxOffsetX = Math.max(0, (layout.width - editorSize) / 2);
  const maxOffsetY = Math.max(0, (layout.height - editorSize) / 2);

  return {
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextOffset.x)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextOffset.y)),
  };
}

function clampAvatarScale(nextScale: number) {
  return Math.min(
    PROFILE_AVATAR_MAX_SCALE,
    Math.max(PROFILE_AVATAR_MIN_SCALE, nextScale),
  );
}

function getPointerDistance(firstPointer: AvatarPointerPosition, secondPointer: AvatarPointerPosition) {
  return Math.hypot(secondPointer.x - firstPointer.x, secondPointer.y - firstPointer.y);
}

function getPointerCenter(firstPointer: AvatarPointerPosition, secondPointer: AvatarPointerPosition) {
  return {
    x: (firstPointer.x + secondPointer.x) / 2,
    y: (firstPointer.y + secondPointer.y) / 2,
  };
}

async function createCroppedProfileAvatarFile(
  cropState: AvatarCropState,
  editorSize = PROFILE_AVATAR_EDITOR_SIZE,
) {
  const image = await loadCanvasSafeImageFromUrl(cropState.sourceUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('프로필 사진을 처리하지 못했습니다.');
  }

  const layout = getAvatarCropLayout(cropState, editorSize);
  const outputScale = PROFILE_AVATAR_SIZE / editorSize;

  canvas.width = PROFILE_AVATAR_SIZE;
  canvas.height = PROFILE_AVATAR_SIZE;
  context.drawImage(
    image,
    layout.left * outputScale,
    layout.top * outputScale,
    layout.width * outputScale,
    layout.height * outputScale,
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
  onAvatarEditorOpenChange,
  onSubmit,
}: ProfileEditSheetContentProps) {
  const [draftAvatarPreviewUrl, setDraftAvatarPreviewUrl] = useState<string | null>(null);
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [avatarCropState, setAvatarCropState] = useState<AvatarCropState | null>(null);
  const [avatarAlbumItems, setAvatarAlbumItems] = useState<AvatarAlbumItem[]>([]);
  const [storedAvatarItems, setStoredAvatarItems] = useState<StoredAvatarItem[]>([]);
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
  const [avatarEditorSize, setAvatarEditorSize] = useState(PROFILE_AVATAR_EDITOR_SIZE);
  const avatarEditorRef = useRef<HTMLDivElement | null>(null);
  const avatarCropSourceUrlRef = useRef<string | null>(null);
  const avatarAlbumSourceUrlsRef = useRef<Set<string>>(new Set());
  const avatarPointersRef = useRef<Map<number, AvatarPointerPosition>>(new Map());
  const avatarGestureStateRef = useRef<AvatarGestureState | null>(null);
  const revokeAvatarCropSourceUrl = (sourceUrl: string) => {
    if (
      sourceUrl.startsWith('blob:') &&
      !avatarAlbumSourceUrlsRef.current.has(sourceUrl) &&
      sourceUrl !== draftAvatarPreviewUrl
    ) {
      URL.revokeObjectURL(sourceUrl);
    }
  };

  const selectAvatarSourceForEditing = (sourceUrl: string, label: string) => {
    setAvatarMessage('사진 위치와 크기를 맞춘 뒤 적용해 주세요.');

    void (async () => {
      try {
        const image = await loadImageFromUrl(sourceUrl);

        avatarPointersRef.current.clear();
        avatarGestureStateRef.current = null;
        setAvatarCropState((currentCropState) => {
          if (currentCropState) {
            revokeAvatarCropSourceUrl(currentCropState.sourceUrl);
          }

          return {
            naturalHeight: image.naturalHeight,
            naturalWidth: image.naturalWidth,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            sourceUrl,
          };
        });
        setDraftAvatarFile(null);
        setShouldRemoveAvatar(false);
      } catch (error) {
        console.warn('Failed to select profile avatar for editing.', error);
        setAvatarMessage(`${label}을 편집 화면으로 불러오지 못했습니다.`);
      }
    })();
  };

  const selectAvatarAlbumItem = (item: AvatarAlbumItem) => {
    avatarPointersRef.current.clear();
    avatarGestureStateRef.current = null;
    setAvatarCropState((currentCropState) => {
      if (currentCropState) {
        revokeAvatarCropSourceUrl(currentCropState.sourceUrl);
      }

      return {
        naturalHeight: item.naturalHeight,
        naturalWidth: item.naturalWidth,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        sourceUrl: item.sourceUrl,
      };
    });
    setDraftAvatarFile(null);
    setShouldRemoveAvatar(false);
    setAvatarMessage('사진 위치와 크기를 맞춘 뒤 적용해 주세요.');
  };

  const deleteStoredAvatarItem = (item: StoredAvatarItem) => {
    setAvatarMessage('프로필 사진을 삭제하고 있어요.');

    void (async () => {
      const result = await deleteSupabaseProfileAvatar(item.path);

      if (!result.ok) {
        setAvatarMessage(result.message || '프로필 사진을 삭제하지 못했습니다.');
        return;
      }

      setStoredAvatarItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.path !== item.path),
      );

      if (avatarCropState?.sourceUrl === item.src) {
        setAvatarCropState(null);
      }

      if (avatarImageDataUrl === item.src) {
        setDraftAvatarPreviewUrl(null);
        setDraftAvatarFile(null);
        setShouldRemoveAvatar(true);
      }

      setAvatarMessage('프로필 사진을 삭제했습니다.');
    })();
  };

  useEffect(() => {
    setDraftAvatarFile(null);
    setAvatarMessage(null);
    setIsPreparingAvatar(false);
    onAvatarPreparationChange?.(false);
    setAvatarCropState((currentCropState) => {
      if (currentCropState) {
        revokeAvatarCropSourceUrl(currentCropState.sourceUrl);
      }

      return null;
    });
    setAvatarAlbumItems((currentItems) => {
      currentItems.forEach((item) => URL.revokeObjectURL(item.sourceUrl));

      return [];
    });
    setStoredAvatarItems([]);
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

  useEffect(() => {
    avatarCropSourceUrlRef.current = avatarCropState?.sourceUrl ?? null;
  }, [avatarCropState?.sourceUrl]);

  useEffect(() => {
    if (!avatarCropState) {
      return;
    }

    let isActive = true;

    void (async () => {
      const result = await listSupabaseProfileAvatars();

      if (!isActive || !result.ok) {
        return;
      }

      setStoredAvatarItems(
        result.avatarPaths
          .map((path) => {
            const src = resolvePublicMediaPath(path);

            return src
              ? {
                id: path,
                path,
                src,
              }
              : null;
          })
          .filter((item): item is StoredAvatarItem => Boolean(item)),
      );
    })();

    return () => {
      isActive = false;
    };
  }, [avatarCropState]);

  useEffect(() => {
    avatarAlbumSourceUrlsRef.current = new Set(
      avatarAlbumItems.map((item) => item.sourceUrl),
    );
  }, [avatarAlbumItems]);

  useEffect(() => {
    onAvatarEditorOpenChange?.(Boolean(avatarCropState));
  }, [avatarCropState, onAvatarEditorOpenChange]);

  useEffect(
    () => () => {
      if (avatarCropSourceUrlRef.current) {
        revokeAvatarCropSourceUrl(avatarCropSourceUrlRef.current);
      }

      avatarAlbumSourceUrlsRef.current.forEach((sourceUrl) => URL.revokeObjectURL(sourceUrl));
      avatarPointersRef.current.clear();
      avatarGestureStateRef.current = null;
      onAvatarEditorOpenChange?.(false);
    },
    [onAvatarEditorOpenChange],
  );

  useEffect(() => {
    const editorElement = avatarEditorRef.current;

    if (!editorElement || !avatarCropState) {
      return;
    }

    const updateEditorSize = () => {
      const nextSize = Math.max(240, Math.round(editorElement.getBoundingClientRect().width));
      setAvatarEditorSize(nextSize);
      setAvatarCropState((currentCropState) => {
        if (!currentCropState) {
          return currentCropState;
        }

        const nextOffset = clampAvatarCropOffset(
          currentCropState,
          {
            x: currentCropState.offsetX,
            y: currentCropState.offsetY,
          },
          nextSize,
        );

        return {
          ...currentCropState,
          offsetX: nextOffset.x,
          offsetY: nextOffset.y,
        };
      });
    };

    updateEditorSize();
    const resizeObserver = new ResizeObserver(updateEditorSize);
    resizeObserver.observe(editorElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [avatarCropState?.sourceUrl]);

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
  const avatarCropLayout = avatarCropState
    ? getAvatarCropLayout(avatarCropState, avatarEditorSize)
    : null;
  const avatarLibraryItems = [
    ...avatarAlbumItems.map((item) => ({
      id: item.id,
      isEditing: avatarCropState?.sourceUrl === item.sourceUrl,
      label: item.label,
      onSelect: () => selectAvatarAlbumItem(item),
      src: item.sourceUrl,
    })),
    draftAvatarPreviewUrl
      ? {
        id: 'prepared-avatar',
        isEditing: avatarCropState?.sourceUrl === draftAvatarPreviewUrl,
        label: '편집한 사진',
        onSelect: () => selectAvatarSourceForEditing(draftAvatarPreviewUrl, '편집한 사진'),
        src: draftAvatarPreviewUrl,
      }
      : null,
    avatarImageDataUrl
      ? {
        id: 'current-avatar',
        isEditing: avatarCropState?.sourceUrl === avatarImageDataUrl,
        label: '현재 사진',
        onSelect: () => selectAvatarSourceForEditing(avatarImageDataUrl, '현재 사진'),
        src: avatarImageDataUrl,
      }
      : null,
  ].filter(
    (item): item is {
      id: string;
      isEditing?: boolean;
      isRemovable?: boolean;
      label: string;
      onRemove?: () => void;
      onSelect?: () => void;
      src: string;
    } => Boolean(item),
  );
  const avatarHistoryItems = [
    draftAvatarPreviewUrl
      ? {
        id: 'prepared-avatar-history',
        label: '편집한 사진',
        src: draftAvatarPreviewUrl,
      }
      : null,
    ...storedAvatarItems.map((item) => ({
        id: `stored-avatar-${item.path}`,
        isRemovable: true,
        label: item.src === avatarImageDataUrl ? '현재 프로필 사진' : '저장된 프로필 사진',
        onRemove: () => deleteStoredAvatarItem(item),
        src: item.src,
      })),
  ].filter(
    (item): item is {
      id: string;
      isRemovable?: boolean;
      label: string;
      onRemove?: () => void;
      src: string;
    } => Boolean(item),
  );

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setAvatarMessage('사진 위치와 크기를 맞춘 뒤 적용해 주세요.');

    void (async () => {
      const pendingSourceUrls: string[] = [];

      try {
        const nextAlbumItems = await Promise.all(
          files.map(async (file, index) => {
            validateProfileAvatarFile(file);
            const sourceUrl = URL.createObjectURL(file);
            pendingSourceUrls.push(sourceUrl);
            const image = await loadImageFromUrl(sourceUrl);

            return {
              id: `selected-avatar-${Date.now()}-${index}`,
              label: file.name || `선택한 사진 ${index + 1}`,
              naturalHeight: image.naturalHeight,
              naturalWidth: image.naturalWidth,
              offsetX: 0,
              offsetY: 0,
              scale: 1,
              sourceUrl,
            };
          }),
        );
        const primaryAlbumItem = nextAlbumItems[0];

        avatarPointersRef.current.clear();
        avatarGestureStateRef.current = null;
        avatarAlbumSourceUrlsRef.current = new Set(
          nextAlbumItems.map((item) => item.sourceUrl),
        );
        setAvatarCropState((currentCropState) => {
          if (currentCropState) {
            revokeAvatarCropSourceUrl(currentCropState.sourceUrl);
          }

          return {
            naturalHeight: primaryAlbumItem.naturalHeight,
            naturalWidth: primaryAlbumItem.naturalWidth,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
            sourceUrl: primaryAlbumItem.sourceUrl,
          };
        });
        pendingSourceUrls.length = 0;

        setAvatarAlbumItems((currentItems) => {
          currentItems.forEach((item) => URL.revokeObjectURL(item.sourceUrl));

          return nextAlbumItems;
        });

        setDraftAvatarPreviewUrl((currentUrl) => {
          if (currentUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(currentUrl);
          }

          return null;
        });
        setDraftAvatarFile(null);
        setShouldRemoveAvatar(false);
      } catch (error) {
        pendingSourceUrls.forEach((sourceUrl) => URL.revokeObjectURL(sourceUrl));

        console.warn('Failed to prepare profile avatar.', error);
        setAvatarMessage(
          error instanceof Error
            ? error.message
            : '프로필 사진을 준비하지 못했습니다. 다른 이미지를 선택해 주세요.',
        );
      }
    })();
    event.target.value = '';
  };

  const handleAvatarCropPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!avatarCropState) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    avatarPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const activePointers = Array.from(avatarPointersRef.current.values());

    if (activePointers.length >= 2) {
      const [firstPointer, secondPointer] = activePointers;
      const center = getPointerCenter(firstPointer, secondPointer);

      avatarGestureStateRef.current = {
        initialCenterX: center.x,
        initialCenterY: center.y,
        initialDistance: Math.max(1, getPointerDistance(firstPointer, secondPointer)),
        pointerId: null,
        startOffsetX: avatarCropState.offsetX,
        startOffsetY: avatarCropState.offsetY,
        startScale: avatarCropState.scale,
      };
      return;
    }

    avatarGestureStateRef.current = {
      initialCenterX: event.clientX,
      initialCenterY: event.clientY,
      initialDistance: 1,
      pointerId: event.pointerId,
      startOffsetX: avatarCropState.offsetX,
      startOffsetY: avatarCropState.offsetY,
      startScale: avatarCropState.scale,
    };
  };

  const handleAvatarCropPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!avatarCropState || !avatarPointersRef.current.has(event.pointerId)) {
      return;
    }

    event.preventDefault();
    avatarPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const activePointers = Array.from(avatarPointersRef.current.values());
    const gestureState = avatarGestureStateRef.current;

    if (!gestureState) {
      return;
    }

    if (activePointers.length >= 2) {
      const [firstPointer, secondPointer] = activePointers;
      const center = getPointerCenter(firstPointer, secondPointer);
      const nextScale = clampAvatarScale(
        gestureState.startScale *
          (getPointerDistance(firstPointer, secondPointer) / gestureState.initialDistance),
      );
      const nextCropState = {
        ...avatarCropState,
        scale: nextScale,
      };
      const nextOffset = clampAvatarCropOffset(
        nextCropState,
        {
          x: gestureState.startOffsetX + center.x - gestureState.initialCenterX,
          y: gestureState.startOffsetY + center.y - gestureState.initialCenterY,
        },
        avatarEditorSize,
      );

      setAvatarCropState((currentCropState) =>
        currentCropState
          ? {
            ...currentCropState,
            offsetX: nextOffset.x,
            offsetY: nextOffset.y,
            scale: nextScale,
          }
          : currentCropState,
      );
      return;
    }

    if (gestureState.pointerId !== event.pointerId) {
      return;
    }

    const nextOffset = clampAvatarCropOffset(
      avatarCropState,
      {
        x: gestureState.startOffsetX + event.clientX - gestureState.initialCenterX,
        y: gestureState.startOffsetY + event.clientY - gestureState.initialCenterY,
      },
      avatarEditorSize,
    );

    setAvatarCropState((currentCropState) =>
      currentCropState
        ? {
          ...currentCropState,
          offsetX: nextOffset.x,
          offsetY: nextOffset.y,
        }
        : currentCropState,
    );
  };

  const handleAvatarCropPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    avatarPointersRef.current.delete(event.pointerId);

    const activePointerEntries = Array.from(avatarPointersRef.current.entries());

    if (!avatarCropState || activePointerEntries.length === 0) {
      avatarGestureStateRef.current = null;
      return;
    }

    const [remainingPointerId, remainingPointer] = activePointerEntries[0];

    avatarGestureStateRef.current = {
      initialCenterX: remainingPointer.x,
      initialCenterY: remainingPointer.y,
      initialDistance: 1,
      pointerId: remainingPointerId,
      startOffsetX: avatarCropState.offsetX,
      startOffsetY: avatarCropState.offsetY,
      startScale: avatarCropState.scale,
    };
  };

  const cancelAvatarCrop = () => {
    avatarPointersRef.current.clear();
    avatarGestureStateRef.current = null;
    setAvatarCropState((currentCropState) => {
      if (currentCropState) {
        URL.revokeObjectURL(currentCropState.sourceUrl);
      }

      return null;
    });
    setAvatarMessage(null);
  };

  const applyAvatarCrop = () => {
    if (!avatarCropState || isPreparingAvatar || isSubmitting) {
      return;
    }

    setAvatarMessage('사진을 프로필용 이미지로 준비하고 있어요.');
    setIsPreparingAvatar(true);
    onAvatarPreparationChange?.(true);

    void (async () => {
      try {
        const croppedFile = await createCroppedProfileAvatarFile(
          avatarCropState,
          avatarEditorSize,
        );
        const previewUrl = URL.createObjectURL(croppedFile);

        setDraftAvatarPreviewUrl((currentUrl) => {
          if (currentUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(currentUrl);
          }

          return previewUrl;
        });
        setDraftAvatarFile(croppedFile);
        setShouldRemoveAvatar(false);
        setAvatarMessage('사진이 준비되었어요. 저장을 누르면 프로필에 반영됩니다.');
        avatarPointersRef.current.clear();
        avatarGestureStateRef.current = null;
        setAvatarCropState((currentCropState) => {
          if (currentCropState) {
            URL.revokeObjectURL(currentCropState.sourceUrl);
          }

          return null;
        });
      } catch (error) {
        console.warn('Failed to crop profile avatar.', error);
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

    if (avatarCropState) {
      setAvatarMessage('사진 편집을 적용한 뒤 저장해 주세요.');
      return;
    }

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

  if (avatarCropState && avatarCropLayout) {
    return (
      <ProfileAvatarEditorScreen
        avatarCropLayout={avatarCropLayout}
        avatarCropState={avatarCropState}
        avatarEditorRef={avatarEditorRef}
        avatarHistoryItems={avatarHistoryItems}
        avatarLibraryItems={avatarLibraryItems}
        avatarMessage={avatarMessage}
        isPreparingAvatar={isPreparingAvatar}
        isSubmitting={isSubmitting}
        userTasteAccentStyle={userTasteAccentStyle}
        onAvatarChange={handleAvatarChange}
        onCancel={cancelAvatarCrop}
        onComplete={applyAvatarCrop}
        onPointerCancel={handleAvatarCropPointerEnd}
        onPointerDown={handleAvatarCropPointerDown}
        onPointerMove={handleAvatarCropPointerMove}
        onPointerUp={handleAvatarCropPointerEnd}
      />
    );
  }

  return (
    <>
      <form
        id={formId}
        className="flex flex-col gap-5"
        style={userTasteAccentStyle}
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-center gap-3 pt-1">
          <TasteProfileAvatar
            imageSrc={draftAvatarImageSrc}
            initials={initials}
            size="lg"
            style={avatarStyle}
          />

          <div className="flex items-center gap-3">
            <label
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--tb-radius-12)] px-3 text-[12px] font-semibold transition-transform active:scale-[0.99]"
              style={{
                background: 'var(--tb-user-accent-tint-surface)',
                color: 'var(--tb-user-accent-dark)',
              }}
            >
              <Camera aria-hidden="true" className="size-4" strokeWidth={2} />
              사진 편집
              <input
                accept="image/*"
                className="sr-only"
                disabled={isPreparingAvatar || isSubmitting}
                onChange={handleAvatarChange}
                type="file"
              />
            </label>
            {draftAvatarImageSrc || avatarCropState ? (
              <button
                type="button"
                className="px-1 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)]"
                onClick={() => {
                  setAvatarCropState((currentCropState) => {
                    if (currentCropState) {
                      URL.revokeObjectURL(currentCropState.sourceUrl);
                    }

                    return null;
                  });
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
              className="text-center text-[12px] leading-relaxed"
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
            label="버디네임"
            placeholder="Taste Buddy에서 사용할 이름"
            helperText="친구가 나를 찾는 고유 버디네임입니다."
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
