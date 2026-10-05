import { useId } from "react";
import { X } from "lucide-react";
import BirthDatePicker, { formatBirthDate, getDaysInMonth, parseBirthDate, type BirthDateParts } from "../BirthDatePicker";
import PrimaryButton from "../PrimaryButton";
import "./wheel-date-picker.css";

export function getProfileBirthDateRange(today = new Date()) {
  const year = today.getFullYear() - 12;
  const month = today.getMonth() + 1;
  return { min: "1940-01-01", max: formatBirthDate({ year, month, day: Math.min(today.getDate(), getDaysInMonth(year, month)) }) };
}

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  onApply: (value: string) => void;
  onClose: () => void;
  title?: string;
};

/** Browser reference for the profile overlay. iOS uses the system DatePicker(.wheel). */
export default function WheelDatePicker({ value, onValueChange, onApply, onClose, title = "생년월일" }: Props) {
  const titleId = useId();
  const { min, max } = getProfileBirthDateRange();
  const clamp = (date: string) => date < min ? min : date > max ? max : date;
  const safeValue = clamp(formatBirthDate(parseBirthDate(value)));
  const parts = parseBirthDate(safeValue);
  const changePart = (field: keyof BirthDateParts, nextValue: number) => {
    const next = { ...parts, [field]: nextValue };
    next.day = Math.min(next.day, getDaysInMonth(next.year, next.month));
    onValueChange(clamp(formatBirthDate(next)));
  };
  const last = parseBirthDate(max);
  const months = Array.from({ length: parts.year === last.year ? last.month : 12 }, (_, i) => i + 1);
  const lastDay = parts.year === last.year && parts.month === last.month ? last.day : getDaysInMonth(parts.year, parts.month);
  return <section className="tb-pl-wheel" aria-labelledby={titleId}>
    <header className="tb-pl-wheel-header">
      <h3 id={titleId}>{title}</h3>
      <button type="button" className="tb-pl-wheel-close" aria-label={`${title} 선택 닫기`} onClick={onClose}><X size={20} strokeWidth={1.8} aria-hidden="true" /></button>
    </header>
    <div className="tb-pl-wheel-body">
      <BirthDatePicker appearance="ios-profile" showTitle={false} wheelHeight={216} parts={parts} days={Array.from({ length: lastDay }, (_, i) => i + 1)} months={months} years={Array.from({ length: last.year - 1939 }, (_, i) => 1940 + i)} onChange={changePart} showConfirmButton={false} />
      <PrimaryButton onClick={() => onApply(safeValue)}>적용</PrimaryButton>
    </div>
  </section>;
}
