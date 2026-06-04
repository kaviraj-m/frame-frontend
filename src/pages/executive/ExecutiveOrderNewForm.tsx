import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { FilePickField } from "@/components/ui/FilePickField";
import { FormField } from "@/components/ui/FormField";
import { formatMoney } from "@/lib/formatDisplay";
import { cataloguePrice, paymentModeLabel } from "@/lib/framePricing";
import type { DraftLine } from "@/hooks/useExecutiveOrderNew";
import type { ExecutiveOrderQuerySummary } from "./executiveOrderTypes";
import type { ExecutivePricingRow } from "./executivePricingTypes";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type Props = {
  query: ExecutiveOrderQuerySummary | null;
  pricingOptions: ExecutivePricingRow[];
  pricingLoaded: boolean;
  catalogError: string;
  lines: DraftLine[];
  addLine: () => void;
  removeLine: (id: string) => void;
  updateLine: (id: string, patch: Partial<DraftLine>) => void;
  setLineImages: (id: string, images: File[]) => void;
  orderTotalPrice: number | null;
  addressDetails: string;
  setAddressDetails: (v: string) => void;
  pincode: string;
  setPincode: (v: string) => void;
  advancePayment: string;
  setAdvancePayment: (v: string) => void;
  paymentMode: string;
  setPaymentMode: (v: string) => void;
  paymentProofFiles: File[];
  setPaymentProofFiles: (files: File[]) => void;
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
  lines,
  addLine,
  removeLine,
  updateLine,
  setLineImages,
  orderTotalPrice,
  addressDetails,
  setAddressDetails,
  pincode,
  setPincode,
  advancePayment,
  setAdvancePayment,
  paymentMode,
  setPaymentMode,
  paymentProofFiles,
  setPaymentProofFiles,
  submitting,
  fieldErrors,
  clearFieldError,
  onSubmit,
}: Props) {
  const paymentChosen = paymentMode === "CASH" || paymentMode === "ONLINE";
  const confirmDisabled =
    !query ||
    !pricingLoaded ||
    pricingOptions.length === 0 ||
    !paymentChosen ||
    lines.every((l) => !l.frameSize) ||
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
            Choose payment mode, then add one or more frame sizes. Each size has its own photos.
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
              {orderTotalPrice != null ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Order total ({paymentModeLabel(paymentMode)}):{" "}
                  <strong>{formatMoney(orderTotalPrice)}</strong>
                </p>
              ) : paymentChosen ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Add frame lines to see the order total.
                </p>
              ) : null}
            </FormField>
            <FormField
              label="Delivery address"
              required
              error={fieldErrors.address}
              hint="Full shipping address for the courier — use multiple lines."
            >
              <Textarea
                rows={4}
                value={addressDetails}
                onChange={(e) => {
                  setAddressDetails(e.target.value);
                  clearFieldError("address");
                }}
                placeholder={"Street / house no.\nArea, landmark\nCity, state"}
                disabled={submitting}
                aria-invalid={!!fieldErrors.address}
              />
            </FormField>
            <FormField label="Pincode" required error={fieldErrors.pincode}>
              <Input
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value);
                  clearFieldError("pincode");
                }}
                placeholder="e.g. 560001"
                disabled={submitting}
                aria-invalid={!!fieldErrors.pincode}
              />
            </FormField>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-semibold">Frames</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!paymentChosen || submitting || pricingOptions.length === 0}
                onClick={addLine}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden />
                Add frame
              </Button>
            </div>

            {lines.map((line, index) => {
              const row = pricingOptions.find((p) => p.frameSize === line.frameSize);
              const lineTotal =
                row && paymentChosen
                  ? cataloguePrice(row, paymentMode) * Math.max(1, line.quantity)
                  : null;
              return (
                <div
                  key={line.id}
                  className="rounded-lg border border-border bg-muted/50 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Frame {index + 1}
                    </span>
                    {lines.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={submitting}
                        onClick={() => removeLine(line.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" aria-hidden />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Frame size">
                      <select
                        value={line.frameSize}
                        onChange={(e) =>
                          updateLine(line.id, { frameSize: e.target.value })
                        }
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
                          <>
                            <option value="">Select size…</option>
                            {pricingOptions.map((p) => (
                              <option key={p.frameSize} value={p.frameSize}>
                                {p.frameSize} — {formatMoney(cataloguePrice(p, paymentMode))}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {lineTotal != null ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          Line subtotal: <strong>{formatMoney(lineTotal)}</strong>
                        </p>
                      ) : null}
                    </FormField>
                    <FormField label="Quantity">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.id, {
                            quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        disabled={submitting}
                      />
                    </FormField>
                    <div className="sm:col-span-2">
                      <FilePickField
                        label={
                          <>
                            Photos for {line.frameSize || "this frame"}{" "}
                            <span className="text-muted-foreground">(required)</span>
                          </>
                        }
                        hint="Customer photos for this frame size only. Pick several at once or add more in another round."
                        multiple
                        chooseLabel="Choose images"
                        files={line.images}
                        onFilesChange={(files) => setLineImages(line.id, files)}
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {paymentMode === "ONLINE" && (
            <div>
              <FilePickField
                label={
                  <>
                    Payment screenshots{" "}
                    <span className="text-muted-foreground">(required — one or more)</span>
                  </>
                }
                hint="JPEG or PNG proof of advance payment. Upload all screenshots before confirming."
                multiple
                chooseLabel="Choose screenshots"
                files={paymentProofFiles}
                onFilesChange={setPaymentProofFiles}
                disabled={submitting}
              />
            </div>
          )}

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
