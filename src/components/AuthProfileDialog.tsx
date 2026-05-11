import { CheckCircle2 as CheckCircle2Icon, Mail as MailIcon, ShieldCheck as ShieldCheckIcon } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

import { ICON_TOKENS } from '../constants/designTokens';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface AuthProfileDialogProps {
  isAnonymous: boolean;
  isConfigured: boolean;
  isOpen: boolean;
  message: string | null;
  status: 'idle' | 'submitting' | 'success' | 'error';
  userEmail: string | null;
  onClose: () => void;
  onRequestDeleteAccount?: () => void;
  onSubmitEmail: (email: string) => Promise<void>;
}

export default function AuthProfileDialog({
  isAnonymous,
  isConfigured,
  isOpen,
  message,
  status,
  userEmail,
  onClose,
  onRequestDeleteAccount,
  onSubmitEmail,
}: AuthProfileDialogProps) {
  const [email, setEmail] = useState(userEmail ?? '');

  useEffect(() => {
    if (isOpen) {
      setEmail(userEmail ?? '');
    }
  }, [isOpen, userEmail]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void onSubmitEmail(email.trim());
  };

  const title = isAnonymous ? '미각 프로필 보관' : userEmail ? '계정이 연결되어 있어요' : '이메일로 로그인';
  const description = isAnonymous
    ? '이메일을 연결하면 지금 만든 미각 프로필과 예약 맞춤화가 다음 식사에도 이어집니다.'
    : userEmail
      ? '현재 프로필은 이메일 계정에 연결되어 있습니다. 새 기기에서도 같은 흐름을 이어갈 수 있어요.'
      : '이메일 링크로 다시 들어오면 이전에 저장한 미각 프로필을 불러올 수 있습니다.';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[calc(100%-1rem)] rounded-[28px] border-[var(--tb-color-border-default)] bg-[var(--tb-color-bg-page)] p-0 shadow-[var(--tb-shadow-drawer)] sm:max-w-[460px]">
        <DialogHeader className="px-5 pt-5 text-left">
          <div className="mb-1 flex size-[40px] items-center justify-center rounded-[var(--tb-radius-12)] bg-[var(--tb-taste-sweet-tint-soft)] text-[var(--tb-taste-sweet-tint-surface-text)]">
            {userEmail && !isAnonymous ? (
              <CheckCircle2Icon size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
            ) : (
              <ShieldCheckIcon size={ICON_TOKENS.size.lg} strokeWidth={1.8} />
            )}
          </div>
          <DialogTitle className="text-[18px] text-[var(--tb-color-text-primary)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[var(--tb-color-text-subtle)]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 pb-5 pt-4">
          <div className="rounded-[var(--tb-radius-14)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] p-3">
            <div className="flex items-start gap-3">
              <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[var(--tb-radius-8)] bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-icon-primary)]">
                <MailIcon size={ICON_TOKENS.size.md} strokeWidth={1.8} />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                  연결하면 유지되는 것
                </p>
                <p className="text-[14px] leading-relaxed text-[var(--tb-color-text-primary)]">
                  캘리브레이션 결과, 예약 개인화, 식후 피드백 학습이 같은 프로필 위에 쌓입니다.
                </p>
              </div>
            </div>
          </div>

          {userEmail && !isAnonymous ? (
            <div className="rounded-[var(--tb-radius-14)] border border-[var(--tb-color-border-default)] bg-[var(--tb-color-surface-card)] p-3">
              <p className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                연결된 이메일
              </p>
              <p className="mt-1 break-words text-[14px] font-semibold text-[var(--tb-color-text-primary)]">
                {userEmail}
              </p>
            </div>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                  이메일
                </span>
                <input
                  autoComplete="email"
                  className="h-12 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white px-3 text-[14px] text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:text-[var(--tb-color-text-hint)] focus:border-[var(--tb-color-border-strong)]"
                  disabled={!isConfigured || status === 'submitting'}
                  inputMode="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>
              <Button
                className="h-12 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] hover:bg-[var(--tb-color-text-secondary)]"
                disabled={!isConfigured || status === 'submitting'}
                type="submit"
              >
                {status === 'submitting'
                  ? '링크 보내는 중'
                  : isAnonymous
                    ? '프로필 보관 링크 받기'
                    : '로그인 링크 받기'}
              </Button>
            </form>
          )}

          {message ? (
            <p
              className={`rounded-[var(--tb-radius-12)] px-3 py-2 text-[12px] leading-relaxed ${
                status === 'error'
                  ? 'bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-secondary)]'
                  : 'bg-[var(--tb-taste-sweet-tint-soft)] text-[var(--tb-taste-sweet-tint-surface-text)]'
              }`}
            >
              {message}
            </p>
          ) : null}

          {!isConfigured ? (
            <p className="rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-2 text-[12px] leading-relaxed text-[var(--tb-color-text-secondary)]">
              Supabase 환경 변수를 설정하면 이메일 로그인 링크를 보낼 수 있습니다.
            </p>
          ) : null}

          {userEmail && !isAnonymous ? (
            <button
              type="button"
              onClick={onRequestDeleteAccount}
              className="self-start px-1 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-secondary)]"
            >
              계정 삭제
            </button>
          ) : null}

          <Button className="h-12 rounded-[var(--tb-radius-12)]" type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
