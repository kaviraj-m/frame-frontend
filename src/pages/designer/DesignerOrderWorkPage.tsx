import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DesignerWorkflowStepper } from "@/components/designer/DesignerWorkflowStepper";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { OrderAssetsPanel } from "@/components/orders/OrderAssetsPanel";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { RemarkTimeline, type RemarkEntry } from "@/components/remarks/RemarkTimeline";
import { FilePickField } from "@/components/ui/FilePickField";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, apiBinaryGet, apiUpload } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import {
  canRecordCustomerResponse,
  canTakeOrder,
  canUploadPreview,
  isOrderGoneError,
} from "@/lib/designerWorkflow";
import { fileLabelFromKey, type OrderAssetRow } from "@/lib/orderAssetLabels";
import { validateRemarkOrImage } from "@/lib/fieldValidation";
import type { OrderListRow } from "@/lib/orderListTypes";

export function DesignerOrderWorkPage() {
  const nav = useNavigate();
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdParam ? decodeURIComponent(orderIdParam) : "";

  const [order, setOrder] = useState<OrderListRow | null>(null);
  const [assets, setAssets] = useState<OrderAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderGone, setOrderGone] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewFilesByLine, setPreviewFilesByLine] = useState<Record<string, File[]>>({});
  const [previewRemarkHistory, setPreviewRemarkHistory] = useState<RemarkEntry[]>([]);
  const [newPreviewRemark, setNewPreviewRemark] = useState("");
  const [previewRemarkImage, setPreviewRemarkImage] = useState<File | null>(null);
  const [previewRemarkSaving, setPreviewRemarkSaving] = useState(false);
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { confirmAction, dialogProps } = useConfirmDialog();
  const [uploadBusy, setUploadBusy] = useState(false);
  const [downloadAllBusy, setDownloadAllBusy] = useState(false);
  const [waBusy, setWaBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [imagePreviewLoading, setImagePreviewLoading] = useState(false);
  const imagePreviewUrlRef = useRef<string | null>(null);

  const closeImagePreview = useCallback(() => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }
    setImagePreview(null);
    setImagePreviewLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!imagePreview && !imagePreviewLoading) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeImagePreview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imagePreview, imagePreviewLoading, closeImagePreview]);

  const loadOrder = useCallback(async () => {
    if (!orderId.trim()) return;
    const detail = await api<OrderListRow & { previewRemarkHistory?: RemarkEntry[] }>(
      apiPaths.designerOrder(orderId),
    );
    setOrder(detail);
    setPreviewRemarkHistory(detail.previewRemarkHistory ?? []);
    setOrderGone(false);
  }, [orderId]);

  const loadAssets = useCallback(async () => {
    if (!orderId.trim()) return;
    const list = await api<OrderAssetRow[]>(apiPaths.designerOrderAssets(orderId));
    setAssets(list);
  }, [orderId]);

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      await Promise.all([loadOrder(), loadAssets()]);
    } catch (e) {
      const msg = (e as Error).message;
      if (isOrderGoneError(msg)) {
        setOrderGone(true);
        setOrder(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [loadOrder, loadAssets]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filePath = useCallback(
    (oid: string, assetId: string, disposition: "inline" | "attachment") =>
      apiPaths.designerOrderAssetFile(oid, assetId, disposition),
    [],
  );

  async function takeOrder() {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const o = await api<OrderListRow>(apiPaths.designerTakeOrder(orderId), { method: "POST" });
      setOrder(o);
      setStatus("Order taken — status is now IN_DESIGN.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function viewAsset(assetId: string, r2Key: string) {
    closeImagePreview();
    setError("");
    setImagePreviewLoading(true);
    try {
      const blob = await apiBinaryGet(filePath(orderId, assetId, "inline"));
      const url = URL.createObjectURL(blob);
      imagePreviewUrlRef.current = url;
      setImagePreview({ url, title: fileLabelFromKey(r2Key) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImagePreviewLoading(false);
    }
  }

  async function downloadAsset(assetId: string, r2Key: string) {
    setError("");
    try {
      const blob = await apiBinaryGet(filePath(orderId, assetId, "attachment"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileLabelFromKey(r2Key);
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function downloadAllSources() {
    const sourceOnly = assets.filter((a) => a.assetType === "SOURCE_PHOTO");
    if (sourceOnly.length === 0) return;
    setDownloadAllBusy(true);
    setError("");
    try {
      for (const a of sourceOnly) {
        await downloadAsset(a.id, a.r2Key);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloadAllBusy(false);
    }
  }

  async function openWhatsAppToCustomer() {
    if (!orderId.trim()) return;
    setWaBusy(true);
    setError("");
    try {
      const link = await api<{ redirectUrl: string }>(apiPaths.designerOrderWhatsApp(orderId));
      window.open(link.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWaBusy(false);
    }
  }

  async function savePreviewRemark(e: FormEvent) {
    e.preventDefault();
    const text = newPreviewRemark.trim();
    const remarkErr = validateRemarkOrImage(newPreviewRemark, !!previewRemarkImage);
    if (remarkErr) {
      setError(remarkErr);
      return;
    }
    setPreviewRemarkSaving(true);
    setError("");
    try {
      let imageKey = "";
      if (previewRemarkImage) {
        const fd = new FormData();
        fd.append("file", previewRemarkImage);
        const up = await apiUpload<{ r2Key: string }>(apiPaths.designerUploads, fd);
        imageKey = up.r2Key;
      }
      const detail = await api<OrderListRow & { previewRemarkHistory: RemarkEntry[] }>(
        apiPaths.designerPreviewRemarks(orderId),
        {
          method: "PUT",
          body: JSON.stringify({ remarks: text, imageKey }),
        },
      );
      setOrder(detail);
      setPreviewRemarkHistory(detail.previewRemarkHistory ?? []);
      setNewPreviewRemark("");
      setPreviewRemarkImage(null);
      setStatus("Remark saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPreviewRemarkSaving(false);
    }
  }

  async function uploadPreview(e: FormEvent) {
    e.preventDefault();
    const lines = order?.lines ?? [];
    if (lines.length > 0) {
      const pending = lines.filter((l) => (previewFilesByLine[l.lineItemId] ?? []).length > 0);
      if (pending.length === 0) {
        setError("Choose at least one preview file for a frame size.");
        return;
      }
      setUploadBusy(true);
      setError("");
      setStatus("");
      try {
        let lastOrder: OrderListRow | null = null;
        for (const line of pending) {
          for (const file of previewFilesByLine[line.lineItemId] ?? []) {
            const fd = new FormData();
            fd.append("file", file);
            lastOrder = await apiUpload<OrderListRow>(
              apiPaths.designerLinePreviewAssets(orderId, line.lineItemId),
              fd,
            );
          }
        }
        if (lastOrder) setOrder(lastOrder);
        setPreviewFilesByLine({});
        setStatus("Preview(s) uploaded — design marked as sent to customer.");
        await loadAssets();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploadBusy(false);
      }
      return;
    }
    if (!previewFile) {
      setError("Choose a preview file to upload.");
      return;
    }
    setUploadBusy(true);
    setError("");
    setStatus("");
    try {
      const fd = new FormData();
      fd.append("file", previewFile);
      const o = await apiUpload<OrderListRow>(apiPaths.designerPreviewAssets(orderId), fd);
      setOrder(o);
      setPreviewFile(null);
      setStatus("Preview uploaded — design marked as sent to customer.");
      await loadAssets();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadBusy(false);
    }
  }

  function decide(decision: "APPROVE" | "REJECT") {
    const isApprove = decision === "APPROVE";
    confirmAction(
      {
        title: isApprove ? "Approve design" : "Request revision",
        message: isApprove
          ? "Mark this design as approved and send the order to admin for production?"
          : "Mark that the customer requested a revision? You can upload a new preview after taking the order again.",
        confirmLabel: isApprove ? "Approve" : "Request revision",
        variant: isApprove ? "default" : "danger",
      },
      async () => {
        setBusy(true);
        setError("");
        setStatus("");
        try {
          const o = await api<OrderListRow>(apiPaths.designerOrderDecision(orderId), {
            method: "POST",
            body: JSON.stringify({ decision, remarks: decisionRemarks }),
          });
          setOrder(o);
          if (decision === "APPROVE") {
            setStatus("Design approved — order moves to admin for print and dispatch.");
            setTimeout(() => nav("/designer/queue"), 1200);
          } else {
            setStatus("Revision required — take the order again, then upload a new preview.");
            await loadAssets();
          }
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      },
    );
  }

  if (!orderId) {
    return (
      <Card>
        <p className="text-destructive">Missing order id.</p>
        <Link to="/designer/queue" className="text-sm text-primary hover:underline">
          ← Queue
        </Link>
      </Card>
    );
  }

  if (orderGone) {
    return (
      <div className="flex flex-col gap-6 min-w-0 w-full">
        <nav className="breadcrumb text-sm">
          <Link to="/designer/queue">Queue</Link>
        </nav>
        <Card>
          <h3 className="text-lg font-semibold">Order no longer in your queue</h3>
          <p className="text-sm text-muted-foreground">
            This order may have been approved and moved to production, or you no longer have access to it.
          </p>
          <Button asChild className="mt-4">
            <Link to="/designer/queue">Back to queue</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const sourceOnlyAssets = assets.filter((a) => a.assetType === "SOURCE_PHOTO");
  const customerAssets = assets.filter((a) => a.assetType === "CUSTOMER_PHOTO");
  const customerGroups = (() => {
    const map = new Map<string, OrderAssetRow[]>();
    for (const a of customerAssets) {
      const label = a.frameSize?.trim() || "Customer photos (ungrouped)";
      const list = map.get(label) ?? [];
      list.push(a);
      map.set(label, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();
  const previewAssets = assets.filter((a) => a.assetType === "DESIGN_PREVIEW");
  const frameLines = order?.lines ?? [];
  const previewGroups = (() => {
    const map = new Map<string, OrderAssetRow[]>();
    for (const a of previewAssets) {
      const label = a.frameSize?.trim() || "Design preview (ungrouped)";
      const list = map.get(label) ?? [];
      list.push(a);
      map.set(label, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();
  const hasPendingLinePreviews = frameLines.some(
    (l) => (previewFilesByLine[l.lineItemId] ?? []).length > 0,
  );
  const orderStatus = order?.status ?? "";
  const isRevision = orderStatus.toUpperCase() === "DESIGN_REVISION_REQUIRED";

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <nav className="breadcrumb text-sm">
        <Link to="/designer/queue">Queue</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="font-mono text-xs">{orderId}</span>
      </nav>

      <PageHeader
        kicker="Design workflow"
        title="Work on order"
        description="Take the order, download executive photos, upload your preview for the customer, then record approve or revision when they respond."
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={refresh} disabled={loading || busy}>
            Refresh
          </Button>
        }
      />

      {loading && !order ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading order…
        </p>
      ) : null}

      {order ? (
        <>
          <DesignerWorkflowStepper status={orderStatus} />

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong>{order.customerUsername || "Customer"}</strong>
                <span className="text-muted-foreground"> · Query {order.queryId}</span>
                <span className="text-muted-foreground"> · Frame {order.frameSize || "—"}</span>
                <div className="text-sm text-muted-foreground mt-1">
                  {order.customerPhoneNumber}
                  {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                </div>
                {order.addressDetails?.trim() ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Delivery:</strong> {order.addressDetails}
                  </p>
                ) : null}
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            {isRevision ? (
              <div
                className="rounded-md border border-[var(--warn)]/40 bg-[var(--warn)]/10 px-4 py-3 text-sm mt-4"
                role="status"
              >
                <strong>Revision requested.</strong>{" "}
                {order.designRemarks?.trim()
                  ? order.designRemarks
                  : "Take the order again and upload an updated preview for the customer."}
              </div>
            ) : order.designRemarks?.trim() ? (
              <p className="text-sm text-muted-foreground mt-3">
                Last note: {order.designRemarks}
              </p>
            ) : null}
          </Card>
        </>
      ) : null}

      {status && (
        <Alert variant="success" role="status">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {canTakeOrder(orderStatus) ? (
        <Card>
          <h3 className="text-lg font-semibold mb-2">1. Take order</h3>
          <p className="text-sm text-muted-foreground mb-4">Claim this order from the queue so you can work on it.</p>
          <Button type="button" disabled={busy || uploadBusy} onClick={takeOrder}>
            Take order
          </Button>
        </Card>
      ) : null}

      <Card>
        <h3 className="text-lg font-semibold mb-2">2. Executive photos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customer images are grouped by frame size. Source photos (if any) are listed separately.
        </p>
        {sourceOnlyAssets.length > 0 ? (
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-2">Source photos (print)</h4>
            <OrderAssetsPanel
              orderId={orderId}
              assets={sourceOnlyAssets}
              filePath={filePath}
              showThumbnailGrid
              onView={viewAsset}
              onDownload={downloadAsset}
              onDownloadAll={downloadAllSources}
              downloadAllBusy={downloadAllBusy}
              emptyMessage="No source photos."
            />
          </div>
        ) : null}
        {customerGroups.length > 0 ? (
          <div className="space-y-6">
            {customerGroups.map(([label, groupAssets]) => (
              <div key={label}>
                <h4 className="text-sm font-semibold mb-2">{label}</h4>
                <OrderAssetsPanel
                  orderId={orderId}
                  assets={groupAssets}
                  filePath={filePath}
                  showThumbnailGrid
                  onView={viewAsset}
                  onDownload={downloadAsset}
                  emptyMessage="No photos for this frame."
                />
              </div>
            ))}
          </div>
        ) : sourceOnlyAssets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No executive photos yet.</p>
        ) : null}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-2">3. Design preview</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {frameLines.length > 0
            ? "Upload a preview for each frame size you send the customer. Status becomes DESIGN_SHARED_WITH_CUSTOMER after upload."
            : "Upload what you send the customer. Status becomes DESIGN_SHARED_WITH_CUSTOMER automatically."}
        </p>
        {canUploadPreview(orderStatus) ? (
          <form className="space-y-4" onSubmit={uploadPreview}>
            {frameLines.length > 0 ? (
              <div className="space-y-6">
                {frameLines.map((line) => (
                  <div key={line.lineItemId} className="rounded-md border border-border p-4 space-y-3">
                    <h4 className="text-sm font-semibold">
                      {line.frameSize}
                      {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                    </h4>
                    <FilePickField
                      label="Preview files"
                      hint="Images or PDF for this frame size. You can add more than one."
                      chooseLabel="Add preview"
                      files={previewFilesByLine[line.lineItemId] ?? []}
                      onFilesChange={(files) =>
                        setPreviewFilesByLine((prev) => ({ ...prev, [line.lineItemId]: files }))
                      }
                      disabled={uploadBusy || busy}
                      multiple
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*,.pdf"
                disabled={uploadBusy || busy}
                onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)}
              />
            )}
            <Button
              type="submit"
              disabled={
                uploadBusy ||
                busy ||
                (frameLines.length > 0 ? !hasPendingLinePreviews : !previewFile)
              }
            >
              {uploadBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Uploading…
                </>
              ) : frameLines.length > 0 ? (
                "Upload preview(s)"
              ) : (
                "Upload preview"
              )}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Take the order first, or wait until revision is needed again.</p>
        )}
        <div className="space-y-4 mt-5">
          <h4 className="font-semibold">Follow-up remarks</h4>
          <p className="text-xs text-muted-foreground">Notes while sharing previews with the customer. Each save adds a dated entry.</p>
          <RemarkTimeline
            entries={previewRemarkHistory}
            imageUrl={(remarkId) => apiPaths.designerPreviewRemarkImage(orderId, remarkId)}
            emptyMessage="No remarks yet."
          />
          <form className="space-y-4" onSubmit={savePreviewRemark}>
            <label className="block space-y-2 text-sm font-medium">
              New remark
              <Textarea
                rows={3}
                value={newPreviewRemark}
                onChange={(e) => setNewPreviewRemark(e.target.value)}
                placeholder="What did you share or discuss with the customer?"
                disabled={previewRemarkSaving || busy || uploadBusy}
              />
            </label>
            <FilePickField
              label={
                <>
                  Photo <span className="text-muted-foreground">(optional)</span>
                </>
              }
              hint="Optional reference image for this note."
              chooseLabel="Choose image"
              files={previewRemarkImage ? [previewRemarkImage] : []}
              onFilesChange={(files) => setPreviewRemarkImage(files[0] ?? null)}
              disabled={previewRemarkSaving || busy || uploadBusy}
            />
            <Button
              type="submit"
              disabled={previewRemarkSaving || busy || uploadBusy || !order}
            >
              {previewRemarkSaving ? "Saving…" : "Save"}
            </Button>
          </form>
        </div>
        {previewAssets.length > 0 ? (
          <div className="mt-5 space-y-6">
            {previewGroups.map(([label, groupAssets]) => (
              <div key={label}>
                <h4 className="text-sm font-semibold mb-2">{label}</h4>
                <OrderAssetsPanel
                  orderId={orderId}
                  assets={groupAssets}
                  filePath={filePath}
                  showTypeColumn={false}
                  onView={viewAsset}
                  onDownload={downloadAsset}
                  emptyMessage=""
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={waBusy || busy || uploadBusy || !order?.customerPhoneNumber?.trim()}
              title={
                order?.customerPhoneNumber?.trim()
                  ? `Open WhatsApp for ${order.customerUsername || "customer"} (new tab). Attach preview files in chat.`
                  : "Customer phone missing"
              }
              onClick={openWhatsAppToCustomer}
            >
              {waBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Opening…
                </>
              ) : (
                "Open WhatsApp"
              )}
            </Button>
          </div>
        ) : null}
      </Card>

      {canRecordCustomerResponse(orderStatus) ? (
        <Card>
          <h3 className="text-lg font-semibold mb-2">4. Customer response</h3>
          <p className="text-sm text-muted-foreground mb-4">
            After the customer replies (outside this app), record the outcome. Approve sends the order to admin production.
          </p>
          <label className="block space-y-2 text-sm font-medium">
            Remarks (optional)
            <Input
              placeholder="e.g. Customer approved layout"
              value={decisionRemarks}
              onChange={(e) => setDecisionRemarks(e.target.value)}
              disabled={busy || uploadBusy}
            />
          </label>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              type="button"
              disabled={busy || uploadBusy}
              onClick={() => decide("APPROVE")}
            >
              Design approved
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || uploadBusy}
              onClick={() => decide("REJECT")}
            >
              Revision required
            </Button>
          </div>
        </Card>
      ) : null}

      <Link to="/designer/queue" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to queue
      </Link>

      <Dialog
        open={imagePreviewLoading || !!imagePreview}
        onOpenChange={(v) => !v && closeImagePreview()}
      >
        <DialogContent className="sm:max-w-3xl" onPointerDownOutside={closeImagePreview}>
          <DialogHeader>
            <DialogTitle className="truncate">{imagePreview?.title ?? "Loading preview…"}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[200px]">
            {imagePreviewLoading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading preview…
              </p>
            )}
            {imagePreview && (
              <img
                src={imagePreview.url}
                alt={imagePreview.title}
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
