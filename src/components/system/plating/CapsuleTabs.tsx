import { useId } from 'react';
import { TASTE_TOKENS, type TasteId } from '../../../constants/designTokens';
import './CapsuleTabs.css';

export type CapsuleTabOption<Value extends string | number> = {
  value: Value;
  label: string;
  disabled?: boolean;
};
export type CapsuleTabsProps<Value extends string | number> = {
  label: string;
  options: readonly CapsuleTabOption<Value>[];
  value: Value;
  onValueChange: (value: Value) => void;
  axis?: TasteId;
  disabled?: boolean;
  menu?: boolean;
  collapseToMenu?: boolean;
};

/** A controlled single selection. Screens own navigation, date ranges and filtering. */
export default function CapsuleTabs<Value extends string | number>({
  label, options, value, onValueChange, axis, disabled = false, menu = false, collapseToMenu = false,
}: CapsuleTabsProps<Value>) {
  const name = useId();
  const palette = axis ? TASTE_TOKENS[axis].palette : undefined;
  return <div className={`tb-capsule-tabs${menu ? ' is-menu' : ''}${collapseToMenu ? ' is-responsive' : ''}`} data-tone={axis || 'neutral'}
    style={palette ? {
      '--tb-capsule-foreground': palette.tintSurfaceText,
      '--tb-capsule-background': palette.tintSurface,
      '--tb-capsule-border': palette.tintSoftBorder,
    } : undefined}>
    <fieldset className="tb-capsule-options" disabled={disabled}>
      <legend className="tb-capsule-sr-only">{label}</legend>
      {options.map((option, index) => <label className="tb-capsule-option" key={`${typeof option.value}:${option.value}`}>
        <input type="radio" name={name} value={index} checked={value === option.value}
          disabled={option.disabled} onChange={() => onValueChange(option.value)} />
        <span>{option.label}</span>
      </label>)}
    </fieldset>
    <label className="tb-capsule-menu">
      <span className="tb-capsule-sr-only">{label}</span>
      <select value={options.findIndex(option => option.value === value)} disabled={disabled}
        onChange={event => {
          const option = options[Number(event.target.value)];
          if (option && !option.disabled) onValueChange(option.value);
        }}>
        {options.map((option, index) => <option key={`${typeof option.value}:${option.value}`} value={index} disabled={option.disabled}>{option.label}</option>)}
      </select>
    </label>
  </div>;
}
