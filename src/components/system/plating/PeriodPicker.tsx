import CapsuleTabs from './CapsuleTabs';
import type { TasteId } from '../../../constants/designTokens';

export const PERIOD_OPTIONS = [
  { value: 1, label: '1개월' },
  { value: 3, label: '3개월' },
  { value: 6, label: '6개월' },
  { value: 12, label: '1년' },
  { value: 0, label: '전체' },
] as const;

export type TasteDetailPeriod = (typeof PERIOD_OPTIONS)[number]['value'];

/** Selects a month range; the screen owns date bounds and data filtering. */
export default function PeriodPicker({ value, onValueChange, axis, label = '기간', menu = false, disabled = false }: {
  value: TasteDetailPeriod;
  onValueChange: (value: TasteDetailPeriod) => void;
  axis?: TasteId;
  label?: string;
  menu?: boolean;
  disabled?: boolean;
}) {
  return <CapsuleTabs label={label} options={PERIOD_OPTIONS} value={value}
    onValueChange={onValueChange} axis={axis} menu={menu} disabled={disabled} collapseToMenu />;
}
