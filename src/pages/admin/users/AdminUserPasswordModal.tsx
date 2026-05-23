import { FormEvent, useEffect, useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { firstError, validateRequired } from "@/lib/fieldValidation";
import type { AdminUserRow } from "./adminUserTypes";
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

  if (!user) return null;

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={onClose}>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <p className="text-sm text-muted-foreground">
            Set a new password for <strong>{user.username}</strong>. Share it out-of-band — it is
            not emailed from here.
          </p>
          {submitError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
          <FormField label="New password" required error={fieldErrors.password}>
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
          <FormField label="Confirm password" required error={fieldErrors.confirm}>
            <Input
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
