import type { ReactNode } from "react";
import "./form-field.css";

export type FieldCopy = { label: string; helperText?: string; error?: string };
export default function FormField({ id, label, helperText, error, children }: FieldCopy & { id: string; children: ReactNode }) {
  return <div className="tb-form-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {(error || helperText) && <p id={`${id}-help`} className={error ? "tb-form-error" : "tb-form-helper"}>{error || helperText}</p>}
  </div>;
}
