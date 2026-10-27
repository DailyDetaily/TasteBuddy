import { SPACING_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/designTokens';
import { COLOR_TOKENS } from '../../constants/uiColorTokens';

export type SummaryCardLegendItem = {
  /** Stable source-series ID when labels are not unique. */
  id?: string;
  label: string;
  /** Use the same semantic color as the corresponding graph series. */
  color?: string;
};

export function SummaryCardLegend({ items }: { items: readonly SummaryCardLegendItem[] }) {
  if (!items.length) return null;
  return <div role="list" aria-label="그래프 범례" data-summary-legend style={{
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACING_TOKENS[8],
    color: COLOR_TOKENS.text.body, fontSize: TYPOGRAPHY_TOKENS.fontSize[10], fontWeight: 500, lineHeight: '14px',
  }}>
    {items.map((item, index) => <span role="listitem" key={item.id ?? `${item.label}-${index}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: SPACING_TOKENS[4], minWidth: 0, maxWidth: '100%',
    }}>
      {item.color && <span aria-hidden="true" style={{ width: 5, height: 5, flexShrink: 0, borderRadius: '50%', background: item.color }} />}
      <span style={{ overflowWrap: 'anywhere' }}>{item.label}</span>
    </span>)}
  </div>;
}

/** Place in the summary card's 12px content stack. Empty legends add no divider. */
export default function SummaryCardFooter({ items }: { items: readonly SummaryCardLegendItem[] }) {
  if (!items.length) return null;
  return <div data-summary-footer style={{ display: 'flex', flexDirection: 'column', gap: SPACING_TOKENS[12], width: '100%' }}>
    <div aria-hidden="true" data-summary-divider style={{ height: 0.5, flexShrink: 0, background: COLOR_TOKENS.border.subtle }} />
    <SummaryCardLegend items={items} />
  </div>;
}
