import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AdminFulfillmentStepper } from "@/components/admin/AdminFulfillmentStepper";
import { OrderAssetsPanel } from "@/components/orders/OrderAssetsPanel";
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
  canMarkFrameReady,
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
  fileLabelFromKey,
  groupAssetsByFrameSize,
  sortFrameSizeGroups,
  type OrderAssetRow,
} from "@/lib/orderAssetLabels";
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
  const [assets, setAssets] = useState<OrderAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProofFiles, setPaymentProofFiles] = useState<File[]>([]);
  const [printImageFiles, setPrintImageFiles] = useState<File[]>([]);
  const [printImageFilesByLine, setPrintImageFilesByLine] = useState<Record<string, File[]>>({});
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

  const loadAssets = useCallback(async () => {
    if (!orderId.trim()) return;
    const list = await api<OrderAssetRow[]>(portal.orderAssets(orderId));
    setAssets(list);
  }, [orderId, portal]);

  const refresh = useCallback(async () => {
    setError("");
    setStatus("");
    setLoading(true);
    try {
      await Promise.all([loadOrder(), loadAssets()]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadOrder, loadAssets]);

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

  const filePath = useCallback(
    (oid: string, assetId: string, disposition: "inline" | "attachment") =>
      portal.orderAssetFile(oid, assetId, disposition),
    [portal],
  );

  async function viewDesignAsset(assetId: string, r2Key: string) {
    setError("");
    try {
      const blob = await apiBinaryGet(filePath(orderId, assetId, "inline"));
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function downloadDesignAsset(assetId: string, r2Key: string) {
    setError("");
    try {
      const blob = await apiBinaryGet(filePath(orderId, assetId, "attachment"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileLabelFromKey(r2Key);
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

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
    const lines = order?.lines ?? [];
    if (lines.length > 0) {
      const pending = lines.filter((l) => (printImageFilesByLine[l.lineItemId] ?? []).length > 0);
      if (pending.length === 0) {
        setError("Choose at least one framed photo for a frame size.");
        return;
      }
      setBusy(true);
      setError("");
      setStatus("");
      try {
        let lastOrder: AdminOrderRow | null = null;
        for (const line of pending) {
          for (const file of printImageFilesByLine[line.lineItemId] ?? []) {
            const fd = new FormData();
            fd.append("file", file);
            lastOrder = await apiUpload<AdminOrderRow>(
              portal.linePrintImageUpload(orderId, line.lineItemId),
              fd,
            );
          }
        }
        if (lastOrder) {
          setOrder((prev) => mergeOrderCustomer(prev, lastOrder!));
          setTrackingNumber(lastOrder.trackingNumber ?? "");
        }
        setPrintImageFilesByLine({});
        setStatus("Framed photo(s) saved.");
        await loadAssets();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (printImageFiles.length === 0) {
      setError("Choose at least one framed photo to upload.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      let lastOrder: AdminOrderRow | null = null;
      for (const file of printImageFiles) {
        const fd = new FormData();
        fd.append("file", file);
        lastOrder = await apiUpload<AdminOrderRow>(portal.printImageUpload(orderId), fd);
      }
      if (lastOrder) {
        setOrder((prev) => mergeOrderCustomer(prev, lastOrder!));
        setTrackingNumber(lastOrder.trackingNumber ?? "");
      }
      setPrintImageFiles([]);
      setStatus("Framed photo(s) saved.");
      await loadAssets();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
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

  function onFrameReady() {
    confirmAction(
      {
        title: "Mark frame ready",
        message: "Mark the framed photo as ready for this order?",
        confirmLabel: "Mark frame ready",
      },
      () =>
        runAction(
          () => api<AdminOrderRow>(portal.frameReady(orderId), { method: "POST" }),
          "Frame marked ready.",
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

  const previewAssets = assets.filter((a) => a.assetType === "DESIGN_PREVIEW");
  const previewByFrame = sortFrameSizeGroups(
    groupAssetsByFrameSize(previewAssets, "Design preview (ungrouped)"),
    order?.lines,
  );
  const showPreviewByFrame =
    (order?.lines?.length ?? 0) > 0 ||
    previewByFrame.length > 1 ||
    previewAssets.some((a) => Boolean(a.frameSize?.trim()));
  const frameLines = order?.lines ?? [];
  const printProofAssets = assets.filter((a) => a.assetType === "PRINT_PROOF");
  const printProofByFrame = sortFrameSizeGroups(
    groupAssetsByFrameSize(printProofAssets, "Framed photo (ungrouped)"),
    order?.lines,
  );
  const showPrintByFrame =
    frameLines.length > 0 ||
    printProofByFrame.length > 1 ||
    printProofAssets.some((a) => Boolean(a.frameSize?.trim()));
  const hasPendingLinePrints = frameLines.some(
    (l) => (printImageFilesByLine[l.lineItemId] ?? []).length > 0,
  );
  const printReady = order ? hasPrintImage(order, assets, order.lines) : false;

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <PageHeader
        kicker={`${portal.kicker} · Fulfillment`}
        title={orderId}
        description="In print, frame ready, balance collection, and dispatch."
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h2 className="text-lg font-semibold mb-2">1. In print</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {showPreviewByFrame
                  ? "Design previews are grouped by frame size. Mark print done when all sizes are printed."
                  : "Review the approved design preview, then mark print done when printing is complete."}
              </p>
              {showPreviewByFrame ? (
                <div className="space-y-6">
                  {previewByFrame.map(([label, groupAssets]) => (
                    <div key={label}>
                      <h3 className="text-sm font-semibold mb-2">{label}</h3>
                      <OrderAssetsPanel
                        orderId={orderId}
                        assets={groupAssets}
                        filePath={filePath}
                        showTypeColumn={false}
                        onView={viewDesignAsset}
                        onDownload={downloadDesignAsset}
                        emptyMessage=""
                      />
                    </div>
                  ))}
                  {previewAssets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No design preview uploaded yet.</p>
                  ) : null}
                </div>
              ) : (
                <OrderAssetsPanel
                  orderId={orderId}
                  assets={assets}
                  filePath={filePath}
                  filter={(a) => a.assetType === "DESIGN_PREVIEW"}
                  showTypeColumn={false}
                  onView={viewDesignAsset}
                  onDownload={downloadDesignAsset}
                  emptyMessage="No design preview uploaded yet."
                />
              )}
              <div className="flex flex-wrap gap-2 mt-4">
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
                  onClick={onPrintDone}
                >
                  Mark print done
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">2. Frame ready</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {showPrintByFrame
                  ? "Upload framed photos for each frame size before marking frame ready. You can add more than one image per size."
                  : "Upload a photo of the finished frame before marking frame ready. Balance collection unlocks after frame ready."}
              </p>
              {showPrintByFrame ? (
                <div className="space-y-6">
                  {frameLines.map((line) => (
                    <div key={line.lineItemId} className="rounded-md border border-border p-4 space-y-3">
                      <h3 className="text-sm font-semibold">
                        {line.frameSize}
                        {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                      </h3>
                      <FilePickField
                        label="Framed photos"
                        hint="At least one image required for this frame size. You can add more than one."
                        files={printImageFilesByLine[line.lineItemId] ?? []}
                        onFilesChange={(files) =>
                          setPrintImageFilesByLine((prev) => ({ ...prev, [line.lineItemId]: files }))
                        }
                        disabled={busy || !canUploadPrintImage(order)}
                        chooseLabel="Add photo"
                        accept="image/*"
                        multiple
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <FilePickField
                  label="Framed photos (required before marking frame ready)"
                  hint="You can add more than one image."
                  files={printImageFiles}
                  onFilesChange={setPrintImageFiles}
                  disabled={busy || !canUploadPrintImage(order)}
                  chooseLabel="Add photo"
                  accept="image/*"
                  multiple
                />
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    busy ||
                    !canUploadPrintImage(order) ||
                    (showPrintByFrame ? !hasPendingLinePrints : printImageFiles.length === 0)
                  }
                  onClick={() => void onSavePrintImage()}
                >
                  {showPrintByFrame ? "Save framed photo(s)" : "Save framed photo"}
                </Button>
                {!showPrintByFrame && printReady ? (
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
              {printPreviewLoading && !showPrintByFrame ? (
                <p className="text-xs text-muted-foreground mt-2">Loading preview…</p>
              ) : null}
              {printPreviewUrl && !printPreviewLoading && !showPrintByFrame ? (
                <img
                  src={printPreviewUrl}
                  alt="Framed photo preview"
                  className="mt-3 max-h-48 rounded-md border border-border object-contain"
                />
              ) : null}
              {printProofByFrame.length > 0 ? (
                <div className="mt-5 space-y-6">
                  {printProofByFrame.map(([label, groupAssets]) => (
                    <div key={label}>
                      <h3 className="text-sm font-semibold mb-2">{label}</h3>
                      <OrderAssetsPanel
                        orderId={orderId}
                        assets={groupAssets}
                        filePath={filePath}
                        showTypeColumn={false}
                        onView={viewDesignAsset}
                        onDownload={downloadDesignAsset}
                        emptyMessage=""
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              {!printReady && canUploadPrintImage(order) ? (
                <p className="text-xs text-muted-foreground mt-2">
                  {showPrintByFrame
                    ? "Save at least one framed photo for every frame size before marking frame ready."
                    : "Save at least one framed photo before marking frame ready."}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  disabled={busy || !canMarkFrameReady(order, assets)}
                  title={printReady ? "Mark frame as ready" : "Save framed photo(s) first"}
                  onClick={onFrameReady}
                >
                  Mark frame ready
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">3. Balance</h2>
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
              <h2 className="text-lg font-semibold mb-2">4. Dispatch</h2>
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
