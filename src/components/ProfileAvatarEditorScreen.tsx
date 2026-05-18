import type {
  ChangeEvent,
  CSSProperties,
  PointerEventHandler,
  RefObject,
} from 'react';

interface ProfileAvatarCropState {
  sourceUrl: string;
}

interface ProfileAvatarCropLayout {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface ProfileAvatarLibraryItem {
  id: string;
  isEditing?: boolean;
  isRemovable?: boolean;
  label: string;
  onSelect?: () => void;
  onRemove?: () => void;
  src: string;
}

interface ProfileAvatarEditorScreenProps {
  avatarCropLayout: ProfileAvatarCropLayout;
  avatarCropState: ProfileAvatarCropState;
  avatarEditorRef: RefObject<HTMLDivElement | null>;
  avatarHistoryItems: ProfileAvatarLibraryItem[];
  avatarLibraryItems: ProfileAvatarLibraryItem[];
  avatarMessage: string | null;
  isPreparingAvatar: boolean;
  isSubmitting: boolean;
  userTasteAccentStyle: CSSProperties;
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onComplete: () => void;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
}

export default function ProfileAvatarEditorScreen({
  avatarCropLayout,
  avatarCropState,
  avatarEditorRef,
  avatarHistoryItems,
  avatarLibraryItems,
  avatarMessage,
  isPreparingAvatar,
  isSubmitting,
  userTasteAccentStyle,
  onAvatarChange,
  onCancel,
  onComplete,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ProfileAvatarEditorScreenProps) {
  return (
    <section
      className="pointer-events-auto absolute inset-0 z-[90] flex min-h-0 flex-col bg-[var(--tb-color-bg-page)]"
      style={userTasteAccentStyle}
    >
      <div className="flex h-[calc(56px+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-focus)] px-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          className="min-w-12 text-left text-[14px] font-semibold text-[var(--tb-color-text-primary)]"
          onClick={onCancel}
        >
          취소
        </button>
        <label className="cursor-pointer px-3 text-center text-[15px] font-bold text-[var(--tb-color-text-primary)]">
          프로필 사진 추가
          <input
            accept="image/*"
            className="sr-only"
            disabled={isPreparingAvatar || isSubmitting}
            multiple
            onChange={onAvatarChange}
            type="file"
          />
        </label>
        <button
          type="button"
          className="min-w-12 text-right text-[14px] font-bold text-[var(--tb-color-text-primary)] disabled:opacity-45"
          disabled={isPreparingAvatar || isSubmitting}
          onClick={onComplete}
        >
          완료
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          ref={avatarEditorRef}
          className="relative w-full touch-none overflow-hidden bg-black"
          style={{ aspectRatio: '1 / 1' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <img
            alt=""
            className="pointer-events-none absolute max-w-none select-none"
            draggable={false}
            src={avatarCropState.sourceUrl}
            style={{
              height: avatarCropLayout.height,
              left: avatarCropLayout.left,
              top: avatarCropLayout.top,
              width: avatarCropLayout.width,
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.58)]" />
        </div>

        <div className="px-5 py-4">
          {avatarMessage ? (
            <p className="text-center text-[12px] leading-relaxed text-[var(--tb-color-text-muted)]">
              {avatarMessage}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-4 gap-2">
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[var(--tb-radius-12)] border border-dashed border-[var(--tb-color-border-strong)] bg-[var(--tb-color-bg-focus)] text-[11px] font-semibold text-[var(--tb-color-text-muted)]">
              추가
              <input
                accept="image/*"
                className="sr-only"
                disabled={isPreparingAvatar || isSubmitting}
                multiple
                onChange={onAvatarChange}
                type="file"
              />
            </label>
            {avatarLibraryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="relative aspect-square overflow-hidden rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)]"
                aria-label={item.label}
                onClick={item.onSelect}
              >
                <img alt="" className="size-full object-cover" src={item.src} />
                {item.isEditing ? (
                  <span className="absolute inset-x-1 bottom-1 rounded-full bg-black/55 px-1 py-[2px] text-[9px] font-semibold text-white">
                    편집 중
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {avatarHistoryItems.length > 0 ? (
            <div className="mt-5">
              <p className="text-[12px] font-bold text-[var(--tb-color-text-primary)]">
                이미 추가했던 프로필 이미지
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {avatarHistoryItems.map((item) => (
                  <div
                    key={`history-${item.id}`}
                    className="relative size-16 shrink-0 p-1"
                    aria-label={item.label}
                  >
                    <div className="size-full overflow-hidden rounded-full bg-[var(--tb-color-surface-muted)]">
                      <img alt="" className="size-full object-cover" src={item.src} />
                    </div>
                    {item.isRemovable && item.onRemove ? (
                      <button
                        type="button"
                        className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full bg-black text-[13px] font-bold leading-none text-white shadow-[0_1px_5px_rgba(0,0,0,0.22)]"
                        aria-label={`${item.label} 제거`}
                        onClick={item.onRemove}
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
