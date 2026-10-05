import { forwardRef, useId, type ButtonHTMLAttributes, type Ref, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import FormField, { type FieldCopy } from "./FormField";

export type SelectOption = { value: string; label: string; disabled?: boolean };
type Common = FieldCopy & { placeholder?: string };
type PickerProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "children"> & {
  mode?: "picker";
  value?: string;
};
type MenuProps = Common & Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  mode: "menu";
  options: SelectOption[];
};
export type SelectFieldProps = PickerProps | MenuProps;

/** The field displays a value. Picker presentation and draft/commit behavior belong to its caller. */
const SelectField = forwardRef<HTMLButtonElement | HTMLSelectElement, SelectFieldProps>(function SelectField(props, ref) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const { label, helperText, error, placeholder = "선택해 주세요", className = "" } = props;
  const describedBy = error || helperText ? `${id}-help` : undefined;
  if (props.mode === "menu") {
    const { mode, options, label: _label, helperText: _helper, error: _error, placeholder: _placeholder, ...selectProps } = props;
    return <FormField {...{ id, label, helperText, error }}>
      <div className="tb-form-select-wrap">
        <select {...selectProps} ref={ref as Ref<HTMLSelectElement>} id={id} className={`tb-form-control tb-form-select ${className}`} aria-invalid={Boolean(error)} aria-describedby={describedBy}>
          <option value="" disabled>{placeholder}</option>
          {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select>
        <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
      </div>
    </FormField>;
  }
  const { mode, value, label: _label, helperText: _helper, error: _error, placeholder: _placeholder, ...buttonProps } = props;
  const hasValue = Boolean(value && value !== placeholder);
  return <FormField {...{ id, label, helperText, error }}>
    <button {...buttonProps} ref={ref as Ref<HTMLButtonElement>} id={id} type="button" className={`tb-form-control tb-form-picker ${className}`} aria-label={buttonProps["aria-label"] ?? `${label}, ${hasValue ? value : placeholder}`} aria-invalid={Boolean(error)} aria-describedby={describedBy} aria-haspopup={buttonProps["aria-haspopup"] ?? "dialog"}>
      <span className={hasValue ? undefined : "tb-form-placeholder"}>{hasValue ? value : placeholder}</span>
      <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
    </button>
  </FormField>;
});
export default SelectField;
