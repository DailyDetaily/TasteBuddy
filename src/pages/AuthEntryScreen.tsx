import { FormEvent, useState } from 'react';
import { Button } from '../components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '../components/ui/input-otp';

interface AuthEntryScreenProps {
  formId?: string;
  isConfigured: boolean;
  isSubmitting: boolean;
  message: string | null;
  pendingEmail: string | null;
  status: 'idle' | 'submitting' | 'success' | 'error';
  step: 'email' | 'code';
  onBackToEmail: () => void;
  onContinueAsGuest: () => void;
  onDevBypass?: () => void;
  onSubmitCode: (code: string) => Promise<void>;
  onSubmitEmail: (email: string) => Promise<void>;
}

type AuthEntryFormProps = Omit<AuthEntryScreenProps, 'onBackToEmail' | 'onContinueAsGuest'> & {
  className?: string;
};

export function AuthEntryForm({
  className = '',
  formId = 'auth-entry-email-form',
  isConfigured,
  isSubmitting,
  message,
  pendingEmail,
  status,
  step,
  onSubmitCode,
  onSubmitEmail,
}: AuthEntryFormProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isCodeOptionOpen, setIsCodeOptionOpen] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 'code') {
      void onSubmitCode(code.trim());
      return;
    }

    void onSubmitEmail(email.trim());
  };

  const handleResendCode = () => {
    if (!pendingEmail || isSubmitting) {
      return;
    }

    setIsCodeOptionOpen(false);
    setCode('');
    void onSubmitEmail(pendingEmail);
  };

  return (
    <section className={`flex flex-col justify-center ${className}`}>
      <form id={formId} className="flex flex-col gap-3" onSubmit={handleSubmit}>
        {step === 'email' ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[var(--tb-color-text-muted)]">
                이메일
              </span>
              <input
                autoComplete="email"
                className="h-12 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white px-3 text-[14px] text-[var(--tb-color-text-primary)] outline-none transition-colors placeholder:text-[var(--tb-color-text-hint)] focus:border-[var(--tb-color-border-strong)]"
                disabled={!isConfigured || isSubmitting}
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일을 입력해주세요"
                type="email"
                value={email}
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[18px] font-bold leading-snug text-[var(--tb-color-text-primary)]">
                이메일을 확인하세요.
              </h2>
              <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                <p className="text-[12px] leading-relaxed text-[var(--tb-color-text-subtle)]">
                  {pendingEmail ?? '입력한 이메일'}(으)로 인증 코드를 보냈습니다.
                </p>
              </div>
            </div>
            <InputOTP
              containerClassName="w-full justify-start gap-1"
              disabled={!isConfigured || isSubmitting}
              maxLength={6}
              onChange={setCode}
              value={code}
            >
              <InputOTPGroup className="justify-start gap-1">
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-12 w-11 rounded-[var(--tb-radius-12)] border border-[var(--tb-color-border-default)] bg-white text-[16px] font-semibold text-[var(--tb-color-text-primary)] first:rounded-[var(--tb-radius-12)] first:border last:rounded-[var(--tb-radius-12)]"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <p className="text-[11px] leading-relaxed text-[var(--tb-color-text-faint)]">
              코드를 받지 못했습니다.{' '}
              <button
                type="button"
                onClick={() => setIsCodeOptionOpen(true)}
                className="font-semibold text-[var(--tb-color-text-muted)] transition-colors hover:text-[var(--tb-color-text-primary)]"
              >
                옵션보기
              </button>
            </p>
          </div>
        )}
      </form>

      {message ? (
        <p
          className={`mt-3 rounded-[var(--tb-radius-12)] px-3 py-2 text-[12px] leading-relaxed ${status === 'error'
            ? 'bg-[var(--tb-color-surface-muted)] text-[var(--tb-color-text-secondary)]'
            : 'bg-[var(--tb-taste-sweet-tint-soft)] text-[var(--tb-taste-sweet-tint-surface-text)]'
            }`}
        >
          {message}
        </p>
      ) : null}

      {!isConfigured ? (
        <p className="mt-3 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-3 py-2 text-[12px] leading-relaxed text-[var(--tb-color-text-secondary)]">
          Supabase 환경 변수를 설정하면 이메일 로그인 링크를 보낼 수 있습니다.
        </p>
      ) : null}

      {isCodeOptionOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-5"
          onClick={() => setIsCodeOptionOpen(false)}
        >
          <div
            className="w-full max-w-[320px] rounded-[20px] bg-[var(--tb-color-bg-focus)] p-4 shadow-[var(--tb-shadow-drawer)]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-[16px] font-bold text-[var(--tb-color-text-primary)]">
              도움이 필요하세요?
            </h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!pendingEmail || isSubmitting}
                className="h-11 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-opacity hover:bg-[var(--tb-color-border-subtle)] disabled:opacity-45"
              >
                코드 다시 전송하기
              </button>
              <button
                type="button"
                className="h-11 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-border-subtle)]"
              >
                비밀번호로 로그인하기
              </button>
              <button
                type="button"
                onClick={() => setIsCodeOptionOpen(false)}
                className="h-11 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-surface-muted)] px-4 text-[13px] font-semibold text-[var(--tb-color-text-primary)] transition-colors hover:bg-[var(--tb-color-border-subtle)]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function AuthEntryScreen({
  formId = 'auth-entry-email-form',
  isConfigured,
  isSubmitting,
  message,
  pendingEmail,
  status,
  step,
  onBackToEmail,
  onContinueAsGuest,
  onDevBypass,
  onSubmitCode,
  onSubmitEmail,
}: AuthEntryScreenProps) {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div
        aria-hidden="true"
        className="shrink-0 bg-white"
        style={{ paddingTop: 'var(--tb-safe-area-top)' }}
      >
        <div className="min-h-[var(--tb-size-top-app-bar-height)]" />
      </div>

      <main className="flex flex-1 flex-col justify-between px-5 pb-[calc(20px+var(--tb-safe-area-bottom))] pt-4">
        <AuthEntryForm
          className="flex-1"
          formId={formId}
          isConfigured={isConfigured}
          isSubmitting={isSubmitting}
          message={message}
          pendingEmail={pendingEmail}
          status={status}
          step={step}
          onSubmitCode={onSubmitCode}
          onSubmitEmail={onSubmitEmail}
        />

        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="h-12 rounded-[var(--tb-radius-12)] bg-[var(--tb-color-text-primary)] text-[var(--tb-color-text-inverse)] hover:bg-[var(--tb-color-text-secondary)]"
            disabled={!isConfigured || isSubmitting}
            form={formId}
            type="submit"
          >
            {isSubmitting
              ? step === 'code'
                ? '확인 중'
                : '코드 보내는 중'
              : step === 'code'
                ? '인증 코드 확인'
                : '이메일 인증 코드 받기'}
          </Button>
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="self-center px-2 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-muted)]"
          >
            나중에하기
          </button>
          {import.meta.env.DEV && onDevBypass ? (
            <button
              type="button"
              onClick={onDevBypass}
              className="self-center px-2 py-1 text-[12px] font-semibold text-[var(--tb-color-text-faint)] transition-colors hover:text-[var(--tb-color-text-muted)]"
            >
              개발용으로 인증 건너뛰기
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
