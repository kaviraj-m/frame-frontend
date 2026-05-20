import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { FilePickField } from "../../components/ui/FilePickField";
import { FormField } from "../../components/ui/FormField";
import { formatMoney } from "../../lib/formatDisplay";
import { cataloguePrice, paymentModeLabel } from "../../lib/framePricing";
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
  setFramingImages: (files: File[]) => void;
  paymentProofFile: File | null;
  setPaymentProofFile: (f: File | null) => void;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  clearFieldError: (key: string) => void;
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
  setFramingImages,
  paymentProofFile,
  setPaymentProofFile,
  submitting,
  fieldErrors,
  clearFieldError,
  onSubmit,
}: Props) {
  const paymentChosen = paymentMode === "CASH" || paymentMode === "ONLINE";
  const selectedRow = pricingOptions.find((p) => p.frameSize === frameSize);
  const fullPrice =
    selectedRow && paymentChosen ? cataloguePrice(selectedRow, paymentMode) : null;
  const confirmDisabled =
    !query ||
    !pricingLoaded ||
    pricingOptions.length === 0 ||
    !paymentChosen ||
    !frameSize ||
    submitting;

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

      <form className="card" onSubmit={onSubmit} aria-busy={submitting} noValidate>
        <h3>Order details</h3>
        <p className="muted">
          Choose how the customer paid first, then pick a frame size — the catalogue price follows that payment mode.
        </p>
        {catalogError ? <p className="error">{catalogError}</p> : null}
        <div className="form-row">
          <FormField label="Payment mode" required error={fieldErrors.paymentMode}>
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                clearFieldError("paymentMode");
              }}
              disabled={submitting}
              aria-invalid={!!fieldErrors.paymentMode}
            >
              <option value="">Select payment mode…</option>
              <option value="CASH">Cash</option>
              <option value="ONLINE">Online</option>
            </select>
          </FormField>
          <label>
            Frame size
            <select
              value={frameSize}
              onChange={(e) => setFrameSize(e.target.value)}
              disabled={
                !paymentChosen ||
                !pricingLoaded ||
                pricingOptions.length === 0 ||
                submitting
              }
            >
              {!paymentChosen ? (
                <option value="">Select payment mode first</option>
              ) : !pricingLoaded ? (
                <option value="">Loading catalogue…</option>
              ) : pricingOptions.length === 0 ? (
                <option value="">No sizes available</option>
              ) : (
                pricingOptions.map((p) => (
                  <option key={p.frameSize} value={p.frameSize}>
                    {p.frameSize} — {formatMoney(cataloguePrice(p, paymentMode))}
                  </option>
                ))
              )}
            </select>
            {fullPrice != null ? (
              <p className="muted small field-hint">
                Full price ({paymentModeLabel(paymentMode)}):{" "}
                <strong>{formatMoney(fullPrice)}</strong>
              </p>
            ) : paymentChosen ? (
              <p className="muted small field-hint">Select a frame size to see the full price.</p>
            ) : null}
          </label>
          <FormField label="Advance payment" required error={fieldErrors.advance} className="">
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={advancePayment}
              onChange={(e) => {
                setAdvancePayment(e.target.value);
                clearFieldError("advance");
              }}
              disabled={submitting}
              aria-invalid={!!fieldErrors.advance}
            />
          </FormField>
          <FormField
            label="Delivery address"
            required
            error={fieldErrors.address}
            hint="Full shipping address for the courier — use multiple lines."
            className="span-2"
          >
            <textarea
              className="textarea"
              rows={4}
              value={addressDetails}
              onChange={(e) => {
                setAddressDetails(e.target.value);
                clearFieldError("address");
              }}
              placeholder={"Street / house no.\nArea, landmark\nCity, state\nPIN code"}
              disabled={submitting}
              aria-invalid={!!fieldErrors.address}
            />
          </FormField>
          <div className="span-2">
            <FilePickField
              label={
                <>
                  Framing images <span className="muted">(required — add one or more)</span>
                </>
              }
              hint="Photos from the customer used for framing and print. Pick several at once or add more in another round. Files upload when you confirm the order."
              multiple
              chooseLabel="Choose images"
              files={framingImages}
              onFilesChange={setFramingImages}
              disabled={submitting}
            />
          </div>
          {paymentMode === "ONLINE" && (
            <div className="span-2">
              <FilePickField
                label={
                  <>
                    Payment screenshot <span className="muted">(required for online)</span>
                  </>
                }
                hint="JPEG or PNG proof of advance payment, up to about 32MB."
                chooseLabel="Choose screenshot"
                files={paymentProofFile ? [paymentProofFile] : []}
                onFilesChange={(files) => setPaymentProofFile(files[0] ?? null)}
                disabled={submitting}
              />
            </div>
          )}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={confirmDisabled}>
            {submitting ? (
              <>
                <span className="spinner" aria-hidden />
                Uploading…
              </>
            ) : (
              "Confirm order"
            )}
          </button>
          <Link to="/executive/queries" className="secondary-link">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
