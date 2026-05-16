import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { formatMoney } from "../../lib/formatDisplay";
import type { ExecutiveOrderQuerySummary } from "./executiveOrderTypes";
import type { ExecutivePricingRow } from "./executivePricingTypes";

type Props = {
  query: ExecutiveOrderQuerySummary | null;
  pricingOptions: ExecutivePricingRow[];
  pricingLoaded: boolean;
  catalogError: string;
  frameSize: string;
  setFrameSize: (v: string) => void;
  addressDetails: string;
  setAddressDetails: (v: string) => void;
  advancePayment: string;
  setAdvancePayment: (v: string) => void;
  paymentMode: string;
  setPaymentMode: (v: string) => void;
  framingImages: File[];
  addFramingImages: (files: FileList | null) => void;
  removeFramingImage: (index: number) => void;
  paymentProofFile: File | null;
  setPaymentProofFile: (f: File | null) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ExecutiveOrderNewForm({
  query,
  pricingOptions,
  pricingLoaded,
  catalogError,
  frameSize,
  setFrameSize,
  addressDetails,
  setAddressDetails,
  advancePayment,
  setAdvancePayment,
  paymentMode,
  setPaymentMode,
  framingImages,
  addFramingImages,
  removeFramingImage,
  paymentProofFile,
  setPaymentProofFile,
  onSubmit,
}: Props) {
  const selectedRow = pricingOptions.find((p) => p.frameSize === frameSize);
  const confirmDisabled = !query || !pricingLoaded || pricingOptions.length === 0 || !frameSize;

  return (
    <>
      {query && (
        <div className="card card--muted">
          <h3>Customer</h3>
          <dl className="kv">
            <dt>Name</dt>
            <dd>{query.customerUsername}</dd>
            <dt>Phone</dt>
            <dd>{query.customerPhoneNumber}</dd>
            <dt>Email</dt>
            <dd>{query.customerEmail?.trim() ? query.customerEmail : "—"}</dd>
            <dt>Query ID</dt>
            <dd className="mono">{query.queryId}</dd>
            <dt>Remarks</dt>
            <dd>{query.remarks || "—"}</dd>
          </dl>
        </div>
      )}

      <form className="card" onSubmit={onSubmit}>
        <h3>Order details</h3>
        <p className="muted">Advance, how they paid, and where the frame ships.</p>
        {catalogError ? <p className="error">{catalogError}</p> : null}
        <div className="form-row">
          <label>
            Frame size
            <select
              value={frameSize}
              onChange={(e) => setFrameSize(e.target.value)}
              disabled={!pricingLoaded || pricingOptions.length === 0}
            >
              {!pricingLoaded ? (
                <option value="">Loading catalogue…</option>
              ) : pricingOptions.length === 0 ? (
                <option value="">No sizes available</option>
              ) : (
                pricingOptions.map((p) => (
                  <option key={p.frameSize} value={p.frameSize}>
                    {p.frameSize}
                  </option>
                ))
              )}
            </select>
            {selectedRow ? (
              <p className="muted small field-hint">
                Full price (catalogue): <strong>{formatMoney(selectedRow.price)}</strong>
              </p>
            ) : null}
          </label>
          <label>
            Advance payment
            <input
              type="number"
              min={0}
              step={0.01}
              value={advancePayment}
              onChange={(e) => setAdvancePayment(e.target.value)}
            />
          </label>
          <label>
            Payment mode
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setPaymentProofFile(null);
              }}
            >
              <option>CASH</option>
              <option>ONLINE</option>
            </select>
          </label>
          <label className="span-2">
            Delivery address
            <input
              value={addressDetails}
              onChange={(e) => setAddressDetails(e.target.value)}
              placeholder="Full address for courier"
            />
          </label>
          <div className="span-2 stack">
            <label>
              Framing images <span className="muted">(required — add one or more)</span>
            </label>
            <input
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={(e) => {
                addFramingImages(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="muted small">
              Photos from the customer used for framing and print. Choose several at once (Ctrl/Cmd+click) or add more in another pick. Each file is stored on the order when you confirm.
            </p>
            {framingImages.length > 0 && (
              <ul className="file-pick-list">
                {framingImages.map((f, i) => (
                  <li key={`${f.name}-${i}-${f.lastModified}`}>
                    <span className="small">{f.name}</span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeFramingImage(i)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {paymentMode === "ONLINE" && (
            <label className="span-2">
              Payment screenshot <span className="muted">(required for online)</span>
              <input
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setPaymentProofFile(e.target.files?.[0] ?? null)}
              />
              <span className="muted small">
                Upload proof of advance payment. JPEG/PNG, same limits as other uploads.
                {paymentProofFile ? ` Selected: ${paymentProofFile.name}` : null}
              </span>
            </label>
          )}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={confirmDisabled}>
            Confirm order
          </button>
          <Link to="/executive/queries" className="secondary-link">Cancel</Link>
        </div>
      </form>
    </>
  );
}
