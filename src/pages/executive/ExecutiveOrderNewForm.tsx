import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { FilePickField } from "@/components/ui/FilePickField";
import { FormField } from "@/components/ui/FormField";
import { formatMoney } from "@/lib/formatDisplay";
import { cataloguePrice, paymentModeLabel } from "@/lib/framePricing";
import type { ExecutiveOrderQuerySummary } from "./executiveOrderTypes";
import type { ExecutivePricingRow } from "./executivePricingTypes";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

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
        <Card muted>
          <h3 className="text-lg font-semibold mb-3">Customer</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{query.customerUsername}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{query.customerPhoneNumber}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{query.customerEmail?.trim() ? query.customerEmail : "—"}</dd>
            <dt className="text-muted-foreground">Query ID</dt>
            <dd className="font-mono text-xs">{query.queryId}</dd>
            <dt className="text-muted-foreground">Remarks</dt>
            <dd>{query.remarks || "—"}</dd>
          </dl>
        </Card>
      )}

      <Card>
        <form className="space-y-4" onSubmit={onSubmit} aria-busy={submitting} noValidate>
          <h3 className="text-lg font-semibold">Order details</h3>
          <p className="text-sm text-muted-foreground">
            Choose how the customer paid first, then pick a frame size — the catalogue price follows that payment mode.
          </p>
          {catalogError ? <p className="text-sm text-destructive">{catalogError}</p> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Payment mode" required error={fieldErrors.paymentMode}>
              <select
                value={paymentMode}
                onChange={(e) => {
                  setPaymentMode(e.target.value);
                  clearFieldError("paymentMode");
                }}
                disabled={submitting}
                className={selectClass}
                aria-invalid={!!fieldErrors.paymentMode}
              >
                <option value="">Select payment mode…</option>
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
              </select>
            </FormField>
            <FormField label="Frame size">
              <select
                value={frameSize}
                onChange={(e) => setFrameSize(e.target.value)}
                disabled={
                  !paymentChosen ||
                  !pricingLoaded ||
                  pricingOptions.length === 0 ||
                  submitting
                }
                className={selectClass}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Full price ({paymentModeLabel(paymentMode)}):{" "}
                  <strong>{formatMoney(fullPrice)}</strong>
                </p>
              ) : paymentChosen ? (
                <p className="text-xs text-muted-foreground mt-1">Select a frame size to see the full price.</p>
              ) : null}
            </FormField>
            <FormField label="Advance payment" required error={fieldErrors.advance}>
              <Input
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
              className="sm:col-span-2"
            >
              <Textarea
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
            <div className="sm:col-span-2">
              <FilePickField
                label={
                  <>
                    Framing images <span className="text-muted-foreground">(required — add one or more)</span>
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
              <div className="sm:col-span-2">
                <FilePickField
                  label={
                    <>
                      Payment screenshot <span className="text-muted-foreground">(required for online)</span>
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
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={confirmDisabled}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Uploading…
                </>
              ) : (
                "Confirm order"
              )}
            </Button>
            <Link to="/executive/queries" className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </>
  );
}
