import { forwardRef, useId, type InputHTMLAttributes } from "react";
import FormField, { type FieldCopy } from "./FormField";

type Props = FieldCopy & InputHTMLAttributes<HTMLInputElement>;
const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput({ label, helperText, error, id: suppliedId, className = "", ...props }, ref) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return <FormField {...{ id, label, helperText, error }}>
    <input {...props} ref={ref} id={id} className={`tb-form-control ${className}`} aria-invalid={Boolean(error)} aria-describedby={error || helperText ? `${id}-help` : undefined} />
  </FormField>;
});
export default TextInput;
