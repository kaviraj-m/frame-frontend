import { FormEvent, useEffect, useState } from "react";
import { FormField } from "../../../components/ui/FormField";
import { firstError, validateRequired } from "../../../lib/fieldValidation";
import type { AdminUserRow } from "./adminUserTypes";

type Props = {
  open: boolean;
  user: AdminUserRow | null;
  onClose: () => void;
  onSave: (userId: string, password: string) => Promise<boolean>;
};

export function AdminUserPasswordModal({ open, user, onClose, onSave }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setConfirm("");
    setFieldErrors({});
    setSubmitError("");
  }, [open, user]);

  if (!open || !user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const passwordErr = validateRequired(password, "New password");
    const confirmErr = validateRequired(confirm, "Confirm password");
    const lenErr =
      password.trim() && password.length < 8
        ? "Password must be at least 8 characters."
        : null;
    const matchErr =
      password && confirm && password !== confirm ? "Passwords do not match." : null;
    const errors: Record<string, string> = {};
    if (passwordErr) errors.password = passwordErr;
    if (confirmErr) errors.confirm = confirmErr;
    if (lenErr) errors.password = lenErr;
    if (matchErr) errors.confirm = matchErr;
    setFieldErrors(errors);
    const validationError = firstError(passwordErr, confirmErr, lenErr, matchErr);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave(user.id, password);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-password-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-toolbar">
          <h2 id="user-password-title" className="modal-title">
            Change password
          </h2>
          <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
            Cancel
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <p className="muted" style={{ margin: "0 0 12px" }}>
            Set a new password for <strong>{user.username}</strong>. Share it out-of-band — it is
            not emailed from here.
          </p>
          {submitError ? (
            <div className="flash flash--error" role="alert">
              {submitError}
            </div>
          ) : null}
          <FormField label="New password" required error={fieldErrors.password}>
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
              }}
              type="password"
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
            />
          </FormField>
          <FormField label="Confirm password" required error={fieldErrors.confirm}>
            <input
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: "" }));
              }}
              type="password"
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.confirm}
            />
          </FormField>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
