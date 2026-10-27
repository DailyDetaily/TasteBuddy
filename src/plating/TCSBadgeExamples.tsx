import TCSBadge from '../components/system/TCSBadge';
import type { TasteAdjustmentLike } from '../constants/tasteColors';
import './tcs-badge-examples.css';

export const TCS_BADGE_EXAMPLES: { state: string; adjustments: TasteAdjustmentLike[]; disabled?: boolean }[] = [
  { state: '단색', adjustments: [{ taste: '단맛', change: 12 }] },
  { state: '두 가지 맛', adjustments: [{ taste: '단맛', change: 20 }, { taste: '감칠맛', change: 5 }] },
  { state: '세 가지 맛', adjustments: [{ taste: '신맛', change: 10 }, { taste: '지방맛', change: 6 }, { taste: '쓴맛', change: 3 }] },
  { state: '빈 데이터', adjustments: [] },
  { state: '비활성', adjustments: [], disabled: true },
];

export default function TCSBadgeExamples({ state = '두 가지 맛', label, thumbnail = false }: { state?: string; label?: string; thumbnail?: boolean }) {
  const selected = TCS_BADGE_EXAMPLES.find(example => example.state === state) ?? TCS_BADGE_EXAMPLES[1];
  if (thumbnail) return <TCSBadge adjustments={selected.adjustments} label={label || 'TCS'} disabled={selected.disabled} />;
  return <div className="pl-tcs-examples">
    {(['light', 'dark'] as const).map(mode => <section key={mode} data-tb-theme={mode} className="pl-tcs-mode" aria-label={`TCS 배지 ${mode}`}>
      <h3>{mode === 'light' ? 'Light' : 'Dark'}</h3>
      <div className="pl-tcs-state-row">{TCS_BADGE_EXAMPLES.map(example => <figure key={example.state}>
        <TCSBadge adjustments={example.adjustments} label={label || 'TCS'} disabled={example.disabled} />
        <figcaption>{example.state}</figcaption>
      </figure>)}</div>
      <div className="pl-tcs-card-example"><div><TCSBadge adjustments={selected.adjustments} label={label || 'TCS'} disabled={selected.disabled} /><strong>다이닝 준비</strong></div><p>{selected.disabled ? 'TCS 준비 중' : selected.adjustments.length ? selected.adjustments.map(a => `${a.taste} +${a.change}%`).join(' · ') : '아직 조정 데이터가 없어요.'}</p></div>
    </section>)}
  </div>;
}
