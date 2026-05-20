import { FormEvent, useEffect, useState } from "react";
import { FormField } from "../../../components/ui/FormField";
import {
  firstError,
  validateEmailOptional,
  validateRequired,
} from "../../../lib/fieldValidation";
import type {
  AdminUserCreateBody,
  AdminUserRow,
  AdminUserUpdateBody,
} from "./adminUserTypes";

type Props = {
  open: boolean;
  editingUser: AdminUserRow | null;
  onClose: () => void;
  onCreate: (body: AdminUserCreateBody) => Promise<boolean>;
  onUpdate: (userId: string, body: AdminUserUpdateBody) => Promise<boolean>;
  onOpenChangePassword: (user: AdminUserRow) => void;
  onRequestDelete: (user: AdminUserRow) => void;
  canDelete: boolean;
};

export function AdminUserEditorModal({
  open,
  editingUser,
  onClose,
  onCreate,
  onUpdate,
  onOpenChangePassword,
  onRequestDelete,
  canDelete,
}: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EXECUTIVE");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const isEdit = editingUser != null;
  const isAdmin = editingUser?.role === "ADMIN";

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setSubmitError("");
    if (editingUser) {
      setUsername(editingUser.username);
      setEmail(editingUser.email ?? "");
      setRole(editingUser.role);
      setIsActive(editingUser.isActive);
      setPassword("");
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("EXECUTIVE");
      setIsActive(true);
    }
  }, [open, editingUser]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const usernameErr = validateRequired(username, "Username");
    const emailErr = validateEmailOptional(email);
    const passwordErr = isEdit ? null : validateRequired(password, "Password");
    const passwordLenErr =
      !isEdit && password.trim() && password.length < 8
        ? "Password must be at least 8 characters."
        : null;
    const errors: Record<string, string> = {};
    if (usernameErr) errors.username = usernameErr;
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;
    if (passwordLenErr) errors.password = passwordLenErr;
    setFieldErrors(errors);
    const validationError = firstError(usernameErr, emailErr, passwordErr, passwordLenErr);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setSaving(true);
    try {
      let ok = false;
      if (isEdit && editingUser) {
        ok = await onUpdate(editingUser.id, {
          username: username.trim(),
          email: email.trim(),
          role,
          isActive,
        });
      } else {
        ok = await onCreate({
          username: username.trim(),
          email: email.trim(),
          password,
          role,
        });
      }
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  const title = isEdit ? "Edit user" : "New user";

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-toolbar">
          <h2 id="user-editor-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
            Cancel
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          {isEdit && editingUser ? (
            <p className="muted" style={{ margin: "0 0 12px" }}>
              User ID: <span className="td-mono">{editingUser.id}</span>
            </p>
          ) : (
            <p className="muted" style={{ margin: "0 0 12px" }}>
              Executive or Designer login. Share the password out-of-band — it is not emailed from
              here.
            </p>
          )}
          {submitError ? (
            <div className="flash flash--error" role="alert">
              {submitError}
            </div>
          ) : null}
          <div className="field-grid field-grid--2">
            <FormField label="Username" required error={fieldErrors.username}>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: "" }));
                }}
                readOnly={isAdmin}
                className={isAdmin ? "input-readonly" : undefined}
                autoComplete="off"
                aria-invalid={!!fieldErrors.username}
              />
            </FormField>
            <FormField label="Email" error={fieldErrors.email}>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                type="email"
                autoComplete="off"
                placeholder="Optional"
                aria-invalid={!!fieldErrors.email}
              />
            </FormField>
          </div>
          {!isEdit ? (
            <FormField label="Temporary password" required error={fieldErrors.password}>
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
          ) : null}
          <label>
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isAdmin}
            >
              <option>EXECUTIVE</option>
              <option>DESIGNER</option>
              {isAdmin ? <option>ADMIN</option> : null}
            </select>
          </label>
          {isEdit ? (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Account active
              </label>
              <p className="muted" style={{ margin: "0 0 12px" }}>
                Inactive users cannot log in; nothing is deleted.
              </p>
              <div className="form-actions" style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => editingUser && onOpenChangePassword(editingUser)}
                >
                  Change password
                </button>
                {canDelete && editingUser ? (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => onRequestDelete(editingUser)}
                    disabled={saving}
                  >
                    Delete user
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create user"}
          </button>
        </form>
      </div>
    </div>
  );
}
