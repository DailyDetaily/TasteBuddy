import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Textarea } from "../../ui/textarea";
import "./primitives.css";

type FieldCopy = { label: string; hint?: string; error?: string };

function FieldFrame({ id, label, hint, error, children }: FieldCopy & { id: string; children: ReactNode }) {
  return <div className="tb-pl-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {(error || hint) && <p id={`${id}-help`} className={error ? "tb-pl-error" : "tb-pl-hint"}>{error || hint}</p>}
  </div>;
}

export function TextareaField({ label, hint, error, id: suppliedId, className = "", ...props }: FieldCopy & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return <FieldFrame {...{ id, label, hint, error }}>
    <Textarea {...props} id={id} className={`tb-pl-input tb-pl-textarea ${className}`} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-help` : undefined} />
  </FieldFrame>;
}

export { default as SelectField, type SelectOption } from "../SelectField";

export function DateField({ label, hint, error, id: suppliedId, className = "", ...props }: FieldCopy & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return <FieldFrame {...{ id, label, hint, error }}>
    <input {...props} id={id} type="date" className={`tb-pl-input ${className}`} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${id}-help` : undefined} />
  </FieldFrame>;
}
