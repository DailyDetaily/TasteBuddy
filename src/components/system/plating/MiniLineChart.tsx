import TasteLineChart, { type TasteLineChartEntry } from '../TasteLineChart';
import { COMPONENT_TOKENS } from '../../../constants/designTokens';

export interface MiniLineChartProps {
  entries: TasteLineChartEntry[];
  /** Omit when the containing card already provides the data summary. */
  label?: string;
  /** Use for a rising/falling pair inside the same 132 × 56 container. */
  compact?: boolean;
}

/** A compact specimen of the exact graph used by TasteInsightSummaryCard. */
export default function MiniLineChart({ entries, label, compact = false }: MiniLineChartProps) {
  return <div style={{ width: COMPONENT_TOKENS.miniChart.width, height: COMPONENT_TOKENS.miniChart.height, display: 'flex', alignItems: 'center', flexShrink: 0 }} role={label ? 'img' : undefined}
    aria-label={label} aria-hidden={label ? undefined : true}>
    <TasteLineChart plotWidth={COMPONENT_TOKENS.miniChart.width} plotHeight={COMPONENT_TOKENS.miniChart.height} entries={entries} compact={compact} />
  </div>;
}
