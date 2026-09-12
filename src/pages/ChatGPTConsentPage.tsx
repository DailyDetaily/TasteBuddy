import { useEffect, useState } from 'react';
import type { OAuthAuthorizationDetails, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthEntryForm } from './AuthEntryScreen';
import { Button } from '../components/ui/button';

const clientID = import.meta.env.VITE_TB_CHATGPT_CLIENT_ID as string | undefined;

function returnToChatGPT(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'chatgpt.com' || url.username || url.password || url.port) {
    throw new Error('연결 주소를 확인하지 못했습니다.');
  }
  window.location.assign(url.href);
}

export default function ChatGPTConsentPage() {
  const authorizationID = new URLSearchParams(window.location.search).get('authorization_id');
  const configured = Boolean(supabase && clientID && authorizationID);
  const [session, setSession] = useState<Session | null>(null);
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [approvedRedirect, setApprovedRedirect] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const signedIn = Boolean(session && !session.user.is_anonymous);

  useEffect(() => {
    if (!supabase || !configured) { setLoading(false); return; }
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      if (error) setMessage('로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      if (active) { setSession(value); setLoading(false); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [configured]);

  useEffect(() => {
    setDetails(null);
    setApprovedRedirect(null);
    if (!signedIn || !supabase || !authorizationID || !clientID) { setBusy(false); return; }
    let active = true;
    setBusy(true);
    setMessage(null);
    void supabase.auth.oauth.getAuthorizationDetails(authorizationID).then(({ data, error }) => {
      if (!active) return;
      if (error || !data) throw new Error('연결 요청이 만료되었거나 유효하지 않습니다. ChatGPT에서 다시 연결해 주세요.');
      if ('redirect_url' in data) { setApprovedRedirect(data.redirect_url); return; }
      if (data.client.id !== clientID || data.authorization_id !== authorizationID || data.user.id !== session?.user.id) {
        throw new Error('Taste Buddy의 ChatGPT 연결 요청이 아닙니다.');
      }
      setDetails(data);
    }).catch(error => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [signedIn, session?.user.id, authorizationID]);

  async function submitEmail(email: string) {
    if (!supabase) return;
    setBusy(true); setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setPendingEmail(email);
    } catch { setMessage('코드를 보내지 못했습니다. Taste Buddy에 연결한 이메일을 확인해 주세요.'); }
    finally { setBusy(false); }
  }

  async function submitCode(token: string) {
    if (!supabase || !pendingEmail) return;
    setBusy(true); setMessage(null);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: pendingEmail, token, type: 'email' });
      if (error) throw error;
    } catch { setMessage('인증 코드를 확인해 주세요.'); }
    finally { setBusy(false); }
  }

  async function consent(approve: boolean) {
    if (!supabase || !authorizationID || !signedIn || (!details && !approvedRedirect)) return;
    if (details && details.user.id !== session?.user.id) return;
    setBusy(true); setMessage(null);
    try {
      if (approvedRedirect) {
        if (approve) returnToChatGPT(approvedRedirect);
        else setMessage('이 창을 닫으면 됩니다. 기존 연결 해제는 ChatGPT 설정에서 할 수 있어요.');
        return;
      }
      const { data, error } = await (approve
        ? supabase.auth.oauth.approveAuthorization(authorizationID, { skipBrowserRedirect: true })
        : supabase.auth.oauth.denyAuthorization(authorizationID, { skipBrowserRedirect: true }));
      if (error || !data) throw new Error('연결을 완료하지 못했습니다. ChatGPT에서 다시 시도해 주세요.');
      returnToChatGPT(data.redirect_url);
    } catch { setMessage('연결을 완료하지 못했습니다. ChatGPT에서 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-dvh bg-[var(--tb-color-surface-base)] px-6 py-12 text-[var(--tb-color-text-primary)]">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <p className="text-sm font-semibold">Taste Buddy</p>
        <h1 className="text-2xl font-semibold">ChatGPT에 내 입맛 기록 연결</h1>
        {!configured ? <p role="alert">연결 요청을 열 수 없습니다. ChatGPT의 Taste Buddy에서 다시 연결해 주세요.</p>
          : loading ? <p role="status">로그인 상태를 확인하고 있어요.</p>
          : !signedIn ? <>
            <p className="text-sm leading-6">Taste Buddy 앱에 연결한 이메일로 로그인해 주세요. 새 계정이 필요하면 먼저 앱에서 계정을 연결해 주세요.</p>
            <AuthEntryForm isConfigured isSubmitting={busy} message={message} pendingEmail={pendingEmail}
              status={message ? 'error' : busy ? 'submitting' : 'idle'} step={pendingEmail ? 'code' : 'email'}
              onSubmitEmail={submitEmail} onSubmitCode={submitCode} />
            <Button type="submit" form="auth-entry-email-form" disabled={busy}>{pendingEmail ? '인증 코드 확인' : '인증 코드 받기'}</Button>
            {pendingEmail && <Button variant="ghost" disabled={busy} onClick={() => setPendingEmail(null)}>이메일 다시 입력</Button>}
          </> : <>
            <p className="text-sm font-semibold">{session?.user.email}</p>
            <p className="text-sm leading-6">ChatGPT가 앱에서 분석을 요청하며 저장한 최근 최대 20개 기록의 음식 이름, 감각 평가, 작성한 원문을 읽고 입맛을 해석할 수 있어요.</p>
            <p className="text-sm leading-6">공유 자료는 저장 후 24시간 동안 조회할 수 있습니다. 앱에서 공유 자료를 삭제하거나 ChatGPT에서 연결을 해제할 수 있어요. 이미 받은 답변은 남을 수 있습니다.</p>
            <p className="text-sm leading-6">기록을 수정·삭제한 뒤에는 앱에서 다시 분석을 요청해 주세요. 이 연결에는 기록을 수정하거나 계정을 삭제하는 권한이 없습니다.</p>
            <Button disabled={busy || (!details && !approvedRedirect)} onClick={() => void consent(true)}>{busy ? '연결 확인 중' : approvedRedirect ? 'ChatGPT로 돌아가기' : '읽기 허용하고 ChatGPT로 돌아가기'}</Button>
            <Button variant="outline" disabled={busy || (!details && !approvedRedirect)} onClick={() => void consent(false)}>취소</Button>
            <Button variant="ghost" disabled={busy} onClick={() => void supabase?.auth.signOut({ scope: 'local' })}>다른 계정으로 로그인</Button>
            {message && <p role="alert" className="text-sm">{message}</p>}
          </>}
      </div>
    </main>
  );
}
