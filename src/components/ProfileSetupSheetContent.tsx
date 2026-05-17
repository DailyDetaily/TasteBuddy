import { FormEvent, useState } from 'react';

interface ProfileSetupSheetContentProps {
  formId: string;
  isSubmitting: boolean;
  message: string | null;
  status: 'idle' | 'submitting' | 'success' | 'error';
  onSubmit: (input: { displayName: string; nickname: string }) => Promise<void>;
}

export default function ProfileSetupSheetContent({
  formId,
  isSubmitting,
  message,
  status,
  onSubmit,
}: ProfileSetupSheetContentProps) {
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void onSubmit({
      displayName: displayName.trim(),
      nickname: nickname.trim(),
    });
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
          이제 나의 프로필을 설정해보세요.
        </h2>
        <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
          어떻게 부르면 될까요?
        </p>
      </div>

      <form id={formId} className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
            이름
          </span>
          <input
            autoComplete="name"
            className="h-12 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white px-3 text-[14px] text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:text-[var(--tb-color-text-hint)] focus:border-[var(--tb-color-border-strong)]"
            disabled={isSubmitting}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="이름을 입력해주세요"
            type="text"
            value={displayName}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
            닉네임
          </span>
          <input
            autoComplete="nickname"
            className="h-12 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white px-3 text-[14px] text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:text-[var(--tb-color-text-hint)] focus:border-[var(--tb-color-border-strong)]"
            disabled={isSubmitting}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Taste Buddy에서 사용할 이름"
            type="text"
            value={nickname}
          />
          <span className="text-[11px] leading-relaxed text-[var(--tb-color-text-faint)]">
            닉네임은 친구가 나를 찾는 고유 이름으로 사용됩니다.
          </span>
        </label>
      </form>

      {message ? (
        <p
          className={`rounded-[var(--tb-radius-12)] px-3 py-2 text-[12px] leading-relaxed ${status === 'error'
            ? 'bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-secondary)]'
            : 'bg-[var(--tb-taste-sweet-tint-soft)] text-[var(--tb-taste-sweet-tint-surface-text)]'
            }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
