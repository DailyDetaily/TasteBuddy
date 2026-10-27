import { createUserTasteAccentStyle } from '../lib/userTasteAccent';
import { TASTE_TOKENS } from '../constants/uiColorTokens';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Copy, ExternalLink, Info, Plus, X } from 'lucide-react';
import { useState } from 'react';
import InlineButton from '../components/system/InlineButton';
import type { PreviewOptions } from './componentDocumentation';

const icons = { 'chevron-right': ChevronRight, 'chevron-down': ChevronDown, 'chevron-up': ChevronUp, 'chevron-left': ChevronLeft, plus: Plus, x: X, copy: Copy, 'external-link': ExternalLink, info: Info };

export default function InlineButtonExamples({ state, label, thumbnail = false, options }: { state: string; label: string; thumbnail?: boolean; options?: PreviewOptions }) {
  const [feedback, setFeedback] = useState('');
  const Icon = icons[options?.icon as keyof typeof icons] ?? ChevronRight;
  const tone = options?.tone === 'neutral' ? 'neutral' : 'accent';
  const content = options?.content ?? 'text';
  const shared = {
    tone, disabled: state === '비활성', onClick: () => setFeedback('인라인 버튼을 눌렀어요.'),
    className: state === '누름' ? 'opacity-70' : state === '포커스' ? 'ring-2 ring-offset-2 ring-[var(--tb-color-border-strong)]' : undefined,
  } as const;
  return <div className="pl-add-stack" style={createUserTasteAccentStyle({ tasteId: 'sweet', label: TASTE_TOKENS.sweet.label, palette: TASTE_TOKENS.sweet.palette })}>
    <div className="pl-demo-row">
      {content === 'icon' ? <InlineButton {...shared} icon={Icon} iconOnly aria-label={label || '상세 보기'} />
        : <InlineButton {...shared} icon={content === 'text' ? undefined : Icon} iconPosition={content === 'leading' ? 'leading' : 'trailing'}>{label || '더보기'}</InlineButton>}
    </div>
    {!thumbnail && <>
      <div className="pl-demo-row">
        <InlineButton disabled={shared.disabled} onClick={() => setFeedback('복사 버튼 예제예요.')}>복사</InlineButton>
        <InlineButton disabled={shared.disabled} tone="neutral" icon={ChevronRight} onClick={() => setFeedback('근거 보기 버튼 예제예요.')}>근거 보기</InlineButton>
        <InlineButton disabled={shared.disabled} icon={Plus} iconPosition="leading" onClick={() => setFeedback('추가 버튼 예제예요.')}>추가</InlineButton>
        <InlineButton disabled={shared.disabled} tone="neutral" icon={X} iconOnly aria-label="선택 지우기" onClick={() => setFeedback('선택 지우기 버튼 예제예요.')} />
      </div>
      {feedback && <p role="status">{feedback}</p>}
    </>}
  </div>;
}
