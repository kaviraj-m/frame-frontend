import { FormEvent, useEffect, useState } from "react";
import type { AdminPricingRow } from "../adminPricingTypes";
import type { AdminPricingUpsertBody } from "./useAdminPricingList";

type Props = {
  open: boolean;
  /** When set, modal is in edit mode (frame size key is read-only). */
  editingRow: AdminPricingRow | null;
  onClose: () => void;
  onSave: (body: AdminPricingUpsertBody) => Promise<boolean>;
};

export function AdminPricingEditorModal({ open, editingRow, onClose, onSave }: Props) {
  const [frameSize, setFrameSize] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEdit = editingRow != null;

  useEffect(() => {
    if (!open) return;
    if (editingRow) {
      setFrameSize(editingRow.frameSize);
      setPrice(String(editingRow.price));
      setIsActive(editingRow.isActive);
    } else {
      setFrameSize("");
      setPrice("");
      setIsActive(true);
    }
  }, [open, editingRow]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await onSave({
        frameSize: frameSize.trim(),
        price: Number(price),
        isActive,
      });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  const title = isEdit ? "Edit frame size" : "New frame size";

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-dialog"
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
        <form className="modal-body" onSubmit={handleSubmit}>
          <p className="muted" style={{ margin: "0 0 12px" }}>
            Saving uses the same key to update price or active flag.
          </p>
          <div className="field-grid field-grid--2">
            <label>
              Frame size key
              <input
                value={frameSize}
                onChange={(e) => setFrameSize(e.target.value)}
                placeholder="e.g. 12x18"
                readOnly={isEdit}
                className={isEdit ? "input-readonly" : undefined}
              />
            </label>
            <label>
              Price (full amount)
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min={0}
                step={0.01}
              />
            </label>
          </div>
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active (shown in executive catalogue)
          </label>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Save pricing"}
          </button>
        </form>
      </div>
    </div>
  );
}
