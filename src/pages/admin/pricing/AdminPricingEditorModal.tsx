import { FormEvent, useEffect, useState } from "react";
import { FormField } from "@/components/ui/FormField";
import {
  firstError,
  validatePositiveNumber,
  validateRequired,
} from "@/lib/fieldValidation";
import type { AdminPricingRow } from "../adminPricingTypes";
import type { AdminPricingUpsertBody } from "./useAdminPricingList";
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

function priceInputValue(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return String(n);
}

type Props = {
  open: boolean;
  editingRow: AdminPricingRow | null;
  onClose: () => void;
  onSave: (body: AdminPricingUpsertBody) => Promise<boolean>;
  onDelete?: () => void;
};

export function AdminPricingEditorModal({ open, editingRow, onClose, onSave, onDelete }: Props) {
  const [frameSize, setFrameSize] = useState("");
  const [onlinePrice, setOnlinePrice] = useState("");
  const [cashPrice, setCashPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const isEdit = editingRow != null;

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setSubmitError("");
    if (editingRow) {
      setFrameSize(editingRow.frameSize);
      setOnlinePrice(priceInputValue(editingRow.onlinePrice));
      setCashPrice(priceInputValue(editingRow.cashPrice));
      setIsActive(editingRow.isActive);
    } else {
      setFrameSize("");
      setOnlinePrice("");
      setCashPrice("");
      setIsActive(true);
    }
  }, [open, editingRow]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const frameSizeErr = isEdit ? null : validateRequired(frameSize, "Frame size");
    const onlineErr = validatePositiveNumber(onlinePrice, "Online price");
    const cashErr = validatePositiveNumber(cashPrice, "Cash price");
    const errors: Record<string, string> = {};
    if (frameSizeErr) errors.frameSize = frameSizeErr;
    if (onlineErr) errors.onlinePrice = onlineErr;
    if (cashErr) errors.cashPrice = cashErr;
    setFieldErrors(errors);
    const validationError = firstError(frameSizeErr, onlineErr, cashErr);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave({
        frameSize: frameSize.trim(),
        onlinePrice: Number(onlinePrice),
        cashPrice: Number(cashPrice),
        isActive,
      });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  const title = isEdit ? "Edit frame size" : "New frame size";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={onClose}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <p className="text-sm text-muted-foreground">
            Executives pick payment mode first; the catalogue uses the matching online or cash price for this size.
          </p>
          {submitError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <FormField
            label="Frame size"
            required={!isEdit}
            error={fieldErrors.frameSize}
            className="sm:col-span-2"
            hint={isEdit ? "Size key cannot be changed after creation." : "e.g. 12x18 — must match what executives select."}
          >
            <Input
              value={frameSize}
              onChange={(e) => {
                setFrameSize(e.target.value);
                if (fieldErrors.frameSize) setFieldErrors((p) => ({ ...p, frameSize: "" }));
              }}
              placeholder="e.g. 12x18"
              readOnly={isEdit}
              className={cn(isEdit && "opacity-70")}
              aria-invalid={!!fieldErrors.frameSize}
            />
          </FormField>

          <div>
            <p className="text-sm font-semibold mb-3">Prices</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Online price" required error={fieldErrors.onlinePrice}>
                <Input
                  value={onlinePrice}
                  onChange={(e) => {
                    setOnlinePrice(e.target.value);
                    if (fieldErrors.onlinePrice) setFieldErrors((p) => ({ ...p, onlinePrice: "" }));
                  }}
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  aria-invalid={!!fieldErrors.onlinePrice}
                />
              </FormField>
              <FormField label="Cash price" required error={fieldErrors.cashPrice}>
                <Input
                  value={cashPrice}
                  onChange={(e) => {
                    setCashPrice(e.target.value);
                    if (fieldErrors.cashPrice) setFieldErrors((p) => ({ ...p, cashPrice: "" }));
                  }}
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="0.00"
                  aria-invalid={!!fieldErrors.cashPrice}
                />
              </FormField>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Active — shown in executive catalogue</span>
          </label>

          <DialogFooter
            className={cn(
              "gap-2 sm:gap-0",
              isEdit && onDelete ? "sm:justify-between" : "",
            )}
          >
            {isEdit && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={saving}
              >
                Delete frame size
              </Button>
            ) : null}
            <div className="flex gap-2 sm:ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save pricing"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
