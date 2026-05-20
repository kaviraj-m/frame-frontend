import { FormEvent, useEffect, useState } from "react";
import { FormField } from "../../../components/ui/FormField";
import {
  firstError,
  validatePositiveNumber,
  validateRequired,
} from "../../../lib/fieldValidation";
import type { AdminPricingRow } from "../adminPricingTypes";
import type { AdminPricingUpsertBody } from "./useAdminPricingList";

function priceInputValue(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return String(n);
}

type Props = {
  open: boolean;
  /** When set, modal is in edit mode (frame size key is read-only). */
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

  if (!open) return null;

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
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-dialog modal-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-editor-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-toolbar">
          <h2 id="pricing-editor-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
            Cancel
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} noValidate>
          <p className="muted" style={{ margin: 0 }}>
            Executives pick payment mode first; the catalogue uses the matching online or cash price for this size.
          </p>
          {submitError ? (
            <div className="flash flash--error" role="alert">
              {submitError}
            </div>
          ) : null}

          <div className="field-grid field-grid--2">
            <FormField
              label="Frame size"
              required={!isEdit}
              error={fieldErrors.frameSize}
              className="span-2"
              hint={isEdit ? "Size key cannot be changed after creation." : "e.g. 12x18 — must match what executives select."}
            >
              <input
                value={frameSize}
                onChange={(e) => {
                  setFrameSize(e.target.value);
                  if (fieldErrors.frameSize) setFieldErrors((p) => ({ ...p, frameSize: "" }));
                }}
                placeholder="e.g. 12x18"
                readOnly={isEdit}
                className={isEdit ? "input-readonly" : undefined}
                aria-invalid={!!fieldErrors.frameSize}
              />
            </FormField>
          </div>

          <div>
            <p className="modal-body__section-title">Prices</p>
            <div className="field-grid field-grid--2">
              <FormField label="Online price" required error={fieldErrors.onlinePrice}>
                <input
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
                <input
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

          <label className="modal-body__checkbox">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Active — shown in executive catalogue</span>
          </label>

          <div
            className={
              isEdit && onDelete ? "modal-footer" : "modal-footer modal-footer--end"
            }
          >
            {isEdit && onDelete ? (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={onDelete}
                disabled={saving}
              >
                Delete frame size
              </button>
            ) : null}
            <div className="modal-footer__primary">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? "Saving…" : "Save pricing"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
