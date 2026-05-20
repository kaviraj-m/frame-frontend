import type { ReactNode } from "react";

type Props = {
  label: ReactNode;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, required, error, hint, children, className }: Props) {
  return (
    <label className={className ? `form-field ${className}` : "form-field"}>
      <span className="form-field__label">
        {label}
        {required ? <span className="form-field__required" aria-hidden> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
      {hint && !error ? <span className="field-hint muted small">{hint}</span> : null}
    </label>
  );
}
