import { FormEvent, useEffect, useState } from "react";
import { FormField } from "@/components/ui/FormField";
import {
  firstError,
  validateEmailOptional,
  validateRequired,
} from "@/lib/fieldValidation";
import type {
  AdminUserCreateBody,
  AdminUserRow,
  AdminUserUpdateBody,
} from "./adminUserTypes";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={onClose}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {isEdit && editingUser ? (
            <p className="text-sm text-muted-foreground">
              User ID: <span className="font-mono text-xs">{editingUser.id}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Executive or Designer login. Share the password out-of-band — it is not emailed from
              here.
            </p>
          )}
          {submitError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Username" required error={fieldErrors.username}>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: "" }));
                }}
                readOnly={isAdmin}
                className={cn(isAdmin && "opacity-70")}
                autoComplete="off"
                aria-invalid={!!fieldErrors.username}
              />
            </FormField>
            <FormField label="Email" error={fieldErrors.email}>
              <Input
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
              <Input
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
          <FormField label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isAdmin}
              className={selectClass}
            >
              <option>EXECUTIVE</option>
              <option>DESIGNER</option>
              {isAdmin ? <option>ADMIN</option> : null}
            </select>
          </FormField>
          {isEdit ? (
            <>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Account active
              </label>
              <p className="text-sm text-muted-foreground">
                Inactive users cannot log in; nothing is deleted.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => editingUser && onOpenChangePassword(editingUser)}
                >
                  Change password
                </Button>
                {canDelete && editingUser ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onRequestDelete(editingUser)}
                    disabled={saving}
                  >
                    Delete user
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
