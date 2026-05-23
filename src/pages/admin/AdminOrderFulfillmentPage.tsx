import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminFulfillmentStepper } from "@/components/admin/AdminFulfillmentStepper";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { FilePickField } from "@/components/ui/FilePickField";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, apiBinaryGet, apiUpload } from "@/lib/api";
import {
  adminFulfillmentPortal,
  type FulfillmentPortalConfig,
} from "@/lib/fulfillmentPortal";
import {
  canCollectBalance,
  canDispatch,
  canMarkPrintDone,
  canSaveTracking,
  canUploadPrintImage,
  canWhatsAppDispatch,
  canWhatsAppPrint,
  hasPrintImage,
  hasSavedTracking,
} from "@/lib/adminFulfillment";
import { ExternalLinkIcon } from "@/components/ui/ExternalLinkIcon";
import { formatMoney } from "@/lib/formatDisplay";
import {
  validatePositiveNumber,
  validateRequired,
} from "@/lib/fieldValidation";
import type { AdminOrderRow } from "./adminOrderTypes";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const WHATSAPP_BTN =
  "border border-[rgba(37,211,102,0.55)] bg-[rgba(37,211,102,0.14)] text-[#d4f5e0] font-semibold hover:border-[rgba(37,211,102,0.85)] hover:bg-[rgba(37,211,102,0.22)] hover:text-[#f0fff5]";

export function OrderFulfillmentPage({
  portal = adminFulfillmentPortal,
}: {
  portal?: FulfillmentPortalConfig;
}) {
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdParam ? decodeURIComponent(orderIdParam) : "";

  const [order, setOrder] = useState<AdminOrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProofFiles, setPaymentProofFiles] = useState<File[]>([]);
  const [printImageFiles, setPrintImageFiles] = useState<File[]>([]);
  const [printPreviewUrl, setPrintPreviewUrl] = useState<string | null>(null);
  const [printPreviewLoading, setPrintPreviewLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [waBusy, setWaBusy] = useState(false);
  const printPreviewObjectUrl = useRef<string | null>(null);
  const { confirmAction, dialogProps } = useConfirmDialog();

  const clearPrintPreview = useCallback(() => {
    if (printPreviewObjectUrl.current) {
      URL.revokeObjectURL(printPreviewObjectUrl.current);
      printPreviewObjectUrl.current = null;
    }
    setPrintPreviewUrl(null);
  }, []);

  const loadOrder = useCallback(async () => {
    if (!orderId.trim()) return;
    const o = await api<AdminOrderRow>(portal.getOrder(orderId));
    setOrder(o);
    setTrackingNumber(o.trackingNumber ?? "");
  }, [orderId, portal]);

  const refresh = useCallback(async () => {
    setError("");
    setStatus("");
    setLoading(true);
    try {
      await loadOrder();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadOrder]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!orderId.trim() || !order?.printedFrameImage?.trim()) {
      clearPrintPreview();
      return;
    }
    let cancelled = false;
    setPrintPreviewLoading(true);
    void apiBinaryGet(portal.printImage(orderId, "inline"))
      .then((blob) => {
        if (cancelled) return;
        clearPrintPreview();
        const url = URL.createObjectURL(blob);
        printPreviewObjectUrl.current = url;
        setPrintPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) clearPrintPreview();
      })
      .finally(() => {
        if (!cancelled) setPrintPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, order?.printedFrameImage, clearPrintPreview, portal]);

  useEffect(() => () => clearPrintPreview(), [clearPrintPreview]);

  function mergeOrderCustomer(prev: AdminOrderRow | null, next: AdminOrderRow): AdminOrderRow {
    return {
      ...next,
      customerUsername: next.customerUsername ?? prev?.customerUsername,
      customerPhoneNumber: next.customerPhoneNumber ?? prev?.customerPhoneNumber,
      customerEmail: next.customerEmail ?? prev?.customerEmail,
    };
  }

  async function runAction(action: () => Promise<AdminOrderRow>, successMsg: string) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const o = await action();
      setOrder((prev) => mergeOrderCustomer(prev, o));
      setTrackingNumber(o.trackingNumber ?? "");
      setStatus(successMsg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onSavePrintImage() {
    const file = printImageFiles[0];
    if (!file) {
      setError("Choose a print image to upload.");
      return;
    }
    await runAction(async () => {
      const fd = new FormData();
      fd.append("file", file);
      return apiUpload<AdminOrderRow>(portal.printImageUpload(orderId), fd);
    }, "Print image saved.");
    setPrintImageFiles([]);
  }

  async function openPrintImageView() {
    setError("");
    try {
      const blob = await apiBinaryGet(portal.printImage(orderId, "inline"));
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function downloadPrintImage() {
    setError("");
    try {
      const blob = await apiBinaryGet(portal.printImage(orderId, "attachment"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `print-${orderId}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onPrintDone() {
    confirmAction(
      {
        title: "Mark print done",
        message: "Mark print as done for this order?",
        confirmLabel: "Mark print done",
      },
      () =>
        runAction(
          () => api<AdminOrderRow>(portal.printDone(orderId), { method: "POST" }),
          "Print marked done.",
        ),
    );
  }

  function onApplyPayment(e: FormEvent) {
    e.preventDefault();
    const amountErr = validatePositiveNumber(paymentAmount, "Payment amount");
    if (amountErr) {
      setError(amountErr);
      return;
    }
    const proof = paymentProofFiles[0];
    if (!proof) {
      setError("Payment proof image is required.");
      return;
    }
    const amount = Number(paymentAmount);
    void runAction(async () => {
      const fd = new FormData();
      fd.append("file", proof);
      fd.append("amount", String(amount));
      return apiUpload<AdminOrderRow>(portal.balancePayment(orderId), fd);
    }, "Balance payment recorded.").then(() => {
      setPaymentAmount("");
      setPaymentProofFiles([]);
    });
  }

  function onMarkFullyPaid(e: FormEvent) {
    e.preventDefault();
    const proof = paymentProofFiles[0];
    if (!proof) {
      setError("Payment proof image is required.");
      return;
    }
    confirmAction(
      {
        title: "Mark balance paid",
        message: "Mark the full remaining balance as paid?",
        confirmLabel: "Mark fully paid",
      },
      async () => {
        await runAction(async () => {
          const fd = new FormData();
          fd.append("file", proof);
          return apiUpload<AdminOrderRow>(portal.balancePaid(orderId), fd);
        }, "Balance marked fully paid.");
        setPaymentProofFiles([]);
      },
    );
  }

  function onSaveTracking(e: FormEvent) {
    e.preventDefault();
    const trackingErr = validateRequired(trackingNumber, "Tracking number");
    if (trackingErr) {
      setError(trackingErr);
      return;
    }
    void runAction(
      () =>
        api<AdminOrderRow>(portal.saveTracking(orderId), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber: trackingNumber.trim() }),
        }),
      "Tracking number saved.",
    );
  }

  function onDispatch(e: FormEvent) {
    e.preventDefault();
    if (!hasSavedTracking(order ?? {})) {
      setError("Save the tracking number before marking dispatched.");
      return;
    }
    const tracking = order?.trackingNumber?.trim() ?? "";
    confirmAction(
      {
        title: "Dispatch order",
        message: `Mark dispatched and complete this order? Tracking: ${tracking}`,
        confirmLabel: "Dispatch & complete",
      },
      () =>
        runAction(
          () =>
            api<AdminOrderRow>(portal.dispatch(orderId), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }),
          "Order dispatched and completed.",
        ),
    );
  }

  async function openPrintWhatsApp() {
    setError("");
    setWaBusy(true);
    try {
      const link = await api<{ redirectUrl: string }>(portal.whatsappPrint(orderId));
      window.open(link.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWaBusy(false);
    }
  }

  async function openDispatchWhatsApp() {
    setError("");
    setWaBusy(true);
    try {
      const link = await api<{ redirectUrl: string }>(
        portal.whatsappDispatch(orderId, order?.trackingNumber?.trim() || undefined),
      );
      window.open(link.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWaBusy(false);
    }
  }

  if (!orderId.trim()) {
    return (
      <div className="flex flex-col gap-6 min-w-0 w-full">
        <Alert variant="destructive">Missing order id.</Alert>
        <Link to={portal.productionPath} className="text-sm text-primary hover:underline">
          Back to production queue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <PageHeader
        kicker={`${portal.kicker} · Fulfillment`}
        title={orderId}
        description="Print, balance collection, and dispatch (marks the order completed)."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to={portal.productionPath}>Production queue</Link>
          </Button>
        }
      />

      {loading && <p className="text-sm text-muted-foreground">Loading order…</p>}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {status && (
        <Alert variant="success" role="status">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      {order && !loading && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <span className="text-sm text-muted-foreground">
              Query <span className="font-mono text-xs">{order.queryId}</span>
              {order.customerUsername ? ` · ${order.customerUsername}` : ""}
            </span>
          </div>

          <AdminFulfillmentStepper order={order} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <h2 className="text-lg font-semibold mb-2">1. Print</h2>
              <p className="text-sm text-muted-foreground">
                Print stage: <strong>{order.printStage?.trim() ? order.printStage : "—"}</strong>
              </p>
              <FilePickField
                label="Printed frame image (required before marking done)"
                files={printImageFiles}
                onFilesChange={setPrintImageFiles}
                disabled={busy || !canUploadPrintImage(order)}
                chooseLabel="Choose image"
                accept="image/*"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || !canUploadPrintImage(order) || !printImageFiles[0]}
                  onClick={() => void onSavePrintImage()}
                >
                  Save print image
                </Button>
                {hasPrintImage(order) ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy || printPreviewLoading}
                      onClick={() => void openPrintImageView()}
                    >
                      View image
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy || printPreviewLoading}
                      onClick={() => void downloadPrintImage()}
                    >
                      Download
                    </Button>
                  </>
                ) : null}
              </div>
              {printPreviewLoading && (
                <p className="text-xs text-muted-foreground mt-2">Loading preview…</p>
              )}
              {printPreviewUrl && !printPreviewLoading ? (
                <img
                  src={printPreviewUrl}
                  alt="Printed frame preview"
                  className="mt-3 max-h-48 rounded-md border border-border object-contain"
                />
              ) : null}
              {!hasPrintImage(order) && canUploadPrintImage(order) ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Upload and save a print image before marking print done. Balance collection unlocks after print is done.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-3">
                {canWhatsAppPrint(order) ? (
                  <Button
                    type="button"
                    size="sm"
                    className={cn(WHATSAPP_BTN)}
                    disabled={busy || waBusy || !order.customerPhoneNumber?.trim()}
                    title={
                      order.customerPhoneNumber?.trim()
                        ? "Open WhatsApp with the print draft"
                        : "Customer phone missing on the linked query"
                    }
                    onClick={() => void openPrintWhatsApp()}
                  >
                    <ExternalLinkIcon />
                    {waBusy ? "Opening…" : "WhatsApp"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={busy || !canMarkPrintDone(order)}
                  title={
                    hasPrintImage(order)
                      ? "Mark print as complete"
                      : "Save a print image first"
                  }
                  onClick={onPrintDone}
                >
                  Mark print done
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">2. Balance</h2>
              <dl className="grid grid-cols-3 gap-3 text-sm mb-4">
                <div>
                  <dt className="text-muted-foreground text-xs">Advance</dt>
                  <dd className="font-medium">{formatMoney(order.advancePayment)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Full price</dt>
                  <dd className="font-medium">{formatMoney(order.fullPayment)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Balance remaining</dt>
                  <dd className="font-medium">{formatMoney(order.balanceAmount)}</dd>
                </div>
              </dl>
              <FilePickField
                label="Payment proof (required)"
                files={paymentProofFiles}
                onFilesChange={setPaymentProofFiles}
                disabled={busy || !canCollectBalance(order)}
                chooseLabel="Choose image"
              />
              <form className="flex flex-wrap items-end gap-3 mt-3" onSubmit={onApplyPayment}>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Amount collected</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    disabled={busy || !canCollectBalance(order)}
                    className="w-32"
                  />
                </label>
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    !canCollectBalance(order) ||
                    !paymentProofFiles[0] ||
                    !paymentAmount.trim()
                  }
                >
                  Apply payment
                </Button>
              </form>
              <form onSubmit={onMarkFullyPaid} className="mt-3">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={busy || !canCollectBalance(order) || !paymentProofFiles[0]}
                >
                  Mark full balance paid
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">3. Dispatch</h2>
              <form className="space-y-3" onSubmit={onSaveTracking}>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Tracking number</span>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    disabled={busy || !canSaveTracking(order)}
                    placeholder="Courier tracking ID"
                    required
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={busy || !canSaveTracking(order) || !trackingNumber.trim()}
                  >
                    Save tracking
                  </Button>
                  {canWhatsAppDispatch(order) ? (
                    <Button
                      type="button"
                      size="sm"
                      className={cn(WHATSAPP_BTN)}
                      disabled={busy || waBusy || !order.customerPhoneNumber?.trim()}
                      title={
                        order.customerPhoneNumber?.trim()
                          ? "Open WhatsApp with the dispatch tracking message (new tab)."
                          : "Customer phone is missing on the linked query — add it on the enquiry first."
                      }
                      onClick={() => void openDispatchWhatsApp()}
                    >
                      {waBusy ? "Opening…" : "WhatsApp"}
                      <ExternalLinkIcon />
                    </Button>
                  ) : null}
                </div>
              </form>
              <form onSubmit={onDispatch} className="mt-3">
                <Button
                  type="submit"
                  disabled={busy || !canDispatch(order) || !hasSavedTracking(order)}
                >
                  Mark dispatched & complete
                </Button>
              </form>
              {!canDispatch(order) && !canWhatsAppDispatch(order) && (
                <p className="text-xs text-muted-foreground mt-2">Dispatch is available after the balance is fully paid.</p>
              )}
              {canDispatch(order) && !hasSavedTracking(order) && (
                <p className="text-xs text-muted-foreground mt-2">
                  Enter a tracking ID and tap <strong>Save tracking</strong>. WhatsApp will be available
                  after the tracking number is saved.
                </p>
              )}
              {canWhatsAppDispatch(order) && !order.customerPhoneNumber?.trim() && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>
                    Tracking is saved, but this order has no customer phone on the linked query. WhatsApp cannot
                    open until a phone number is added on the enquiry.
                  </AlertDescription>
                </Alert>
              )}
              {canWhatsAppDispatch(order) && order.customerPhoneNumber?.trim() && (
                <p className="text-xs text-muted-foreground mt-2">
                  Message text is configured under{" "}
                  <Link to="/admin/whatsapp-draft" className="text-primary hover:underline">WhatsApp draft</Link> (dispatch section). Saved tracking{" "}
                  <strong>{order.trackingNumber}</strong> is included in the message.
                </p>
              )}
            </Card>
          </div>

          {order.addressDetails?.trim() && (
            <Card>
              <h2 className="text-lg font-semibold mb-2">Delivery address</h2>
              <p className="text-sm whitespace-pre-wrap">{order.addressDetails}</p>
            </Card>
          )}

          {portal.patchPath ? (
            <p className="text-sm text-muted-foreground">
              <Link
                to={`${portal.patchPath}?orderId=${encodeURIComponent(orderId)}`}
                className="text-primary hover:underline"
              >
                Advanced override (patch)
              </Link>
            </p>
          ) : null}
        </>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

export function AdminOrderFulfillmentPage() {
  return <OrderFulfillmentPage portal={adminFulfillmentPortal} />;
}
