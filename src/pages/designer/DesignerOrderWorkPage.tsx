import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DesignerWorkflowStepper } from "../../components/designer/DesignerWorkflowStepper";
import { OrderAssetsPanel } from "../../components/orders/OrderAssetsPanel";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { api, apiBinaryGet, apiUpload } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import {
  canRecordCustomerResponse,
  canTakeOrder,
  canUploadPreview,
  isOrderGoneError,
} from "../../lib/designerWorkflow";
import { fileLabelFromKey, isExecutiveSourceAsset, type OrderAssetRow } from "../../lib/orderAssetLabels";
import type { OrderListRow } from "../../lib/orderListTypes";

export function DesignerOrderWorkPage() {
  const nav = useNavigate();
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdParam ? decodeURIComponent(orderIdParam) : "";

  const [order, setOrder] = useState<OrderListRow | null>(null);
  const [assets, setAssets] = useState<OrderAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderGone, setOrderGone] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [downloadAllBusy, setDownloadAllBusy] = useState(false);
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
    const o = await api<OrderListRow>(apiPaths.designerOrder(orderId));
    setOrder(o);
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
    const sourceAssets = assets.filter((a) => isExecutiveSourceAsset(a.assetType));
    if (sourceAssets.length === 0) return;
    setDownloadAllBusy(true);
    setError("");
    try {
      for (const a of sourceAssets) {
        await downloadAsset(a.id, a.r2Key);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloadAllBusy(false);
    }
  }

  async function uploadPreview(e: FormEvent) {
    e.preventDefault();
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

  async function decide(decision: "APPROVE" | "REJECT") {
    const msg =
      decision === "APPROVE"
        ? "Mark this design as approved and send the order to admin for production?"
        : "Mark that the customer requested a revision? You can upload a new preview after taking the order again.";
    if (!window.confirm(msg)) return;

    setBusy(true);
    setError("");
    setStatus("");
    try {
      const o = await api<OrderListRow>(apiPaths.designerOrderDecision(orderId), {
        method: "POST",
        body: JSON.stringify({ decision, remarks }),
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
  }

  if (!orderId) {
    return (
      <div className="card">
        <p className="error">Missing order id.</p>
        <Link to="/designer/queue">← Queue</Link>
      </div>
    );
  }

  if (orderGone) {
    return (
      <div className="page-stack">
        <nav className="breadcrumb">
          <Link to="/designer/queue">Queue</Link>
        </nav>
        <div className="card">
          <h3>Order no longer in your queue</h3>
          <p className="muted">
            This order may have been approved and moved to production, or you no longer have access to it.
          </p>
          <Link className="btn btn--primary" to="/designer/queue">
            Back to queue
          </Link>
        </div>
      </div>
    );
  }

  const sourceAssets = assets.filter((a) => isExecutiveSourceAsset(a.assetType));
  const previewAssets = assets.filter((a) => a.assetType === "DESIGN_PREVIEW");
  const orderStatus = order?.status ?? "";
  const isRevision = orderStatus.toUpperCase() === "DESIGN_REVISION_REQUIRED";

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/designer/queue">Queue</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="mono">{orderId}</span>
      </nav>

      <PageHeader
        kicker="Design workflow"
        title="Work on order"
        description="Take the order, download executive photos, upload your preview for the customer, then record approve or revision when they respond."
        actions={
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh} disabled={loading || busy}>
            Refresh
          </button>
        }
      />

      {loading && !order ? (
        <p className="muted">
          <span className="spinner spinner--sm" aria-hidden /> Loading order…
        </p>
      ) : null}

      {order ? (
        <>
          <DesignerWorkflowStepper status={orderStatus} />

          <div className="card">
            <div className="inline-actions" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <strong>{order.customerUsername || "Customer"}</strong>
                <span className="muted"> · Query {order.queryId}</span>
                <span className="muted"> · Frame {order.frameSize || "—"}</span>
                <div className="muted small" style={{ marginTop: 4 }}>
                  {order.customerPhoneNumber}
                  {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                </div>
                {order.addressDetails?.trim() ? (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    <strong>Delivery:</strong> {order.addressDetails}
                  </p>
                ) : null}
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            {isRevision ? (
              <div className="designer-revision-banner" role="status">
                <strong>Revision requested.</strong>{" "}
                {order.designRemarks?.trim()
                  ? order.designRemarks
                  : "Take the order again and upload an updated preview for the customer."}
              </div>
            ) : order.designRemarks?.trim() ? (
              <p className="muted" style={{ marginTop: 12 }}>
                Last note: {order.designRemarks}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      {status && (
        <div className="flash flash--success" role="status">
          {status}
        </div>
      )}
      {error && (
        <div className="flash flash--error" role="alert">
          {error}
        </div>
      )}

      {canTakeOrder(orderStatus) ? (
        <div className="card">
          <h3>1. Take order</h3>
          <p className="muted">Claim this order from the queue so you can work on it.</p>
          <button type="button" className="btn btn--primary" disabled={busy || uploadBusy} onClick={takeOrder}>
            Take order
          </button>
        </div>
      ) : null}

      <div className="card">
        <h3>2. Executive photos</h3>
        <p className="muted">Source and customer images uploaded when the order was confirmed.</p>
        <OrderAssetsPanel
          orderId={orderId}
          assets={assets}
          filePath={filePath}
          filter={(a) => isExecutiveSourceAsset(a.assetType)}
          showThumbnailGrid
          onView={viewAsset}
          onDownload={downloadAsset}
          onDownloadAll={sourceAssets.length > 0 ? downloadAllSources : undefined}
          downloadAllBusy={downloadAllBusy}
          emptyMessage="No executive photos yet."
        />
      </div>

      <div className="card">
        <h3>3. Design preview</h3>
        <p className="muted">
          Upload what you send the customer. Status becomes <strong>DESIGN_SHARED_WITH_CUSTOMER</strong> automatically.
        </p>
        {canUploadPreview(orderStatus) ? (
          <form className="stack" onSubmit={uploadPreview}>
            <input
              type="file"
              accept="image/*,.pdf"
              disabled={uploadBusy || busy}
              onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)}
            />
            <button type="submit" className="btn btn--primary" disabled={uploadBusy || busy || !previewFile}>
              {uploadBusy ? (
                <>
                  <span className="spinner spinner--sm" aria-hidden /> Uploading…
                </>
              ) : (
                "Upload preview"
              )}
            </button>
          </form>
        ) : (
          <p className="muted">Take the order first, or wait until revision is needed again.</p>
        )}
        {previewAssets.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <OrderAssetsPanel
              orderId={orderId}
              assets={assets}
              filePath={filePath}
              filter={(a) => a.assetType === "DESIGN_PREVIEW"}
              showTypeColumn={false}
              onView={viewAsset}
              onDownload={downloadAsset}
              emptyMessage=""
            />
          </div>
        ) : null}
      </div>

      {canRecordCustomerResponse(orderStatus) ? (
        <div className="card">
          <h3>4. Customer response</h3>
          <p className="muted">
            After the customer replies (outside this app), record the outcome. Approve sends the order to admin production.
          </p>
          <label>
            Remarks (optional)
            <input
              placeholder="e.g. Customer approved layout"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={busy || uploadBusy}
            />
          </label>
          <div className="inline-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || uploadBusy}
              onClick={() => decide("APPROVE")}
            >
              Design approved
            </button>
            <button
              type="button"
              className="btn btn--danger"
              disabled={busy || uploadBusy}
              onClick={() => decide("REJECT")}
            >
              Revision required
            </button>
          </div>
        </div>
      ) : null}

      <Link to="/designer/queue" className="secondary-link">
        ← Back to queue
      </Link>

      {imagePreviewLoading ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-dialog preview-dialog">
            <span className="spinner" aria-hidden />
            <p className="muted">Loading preview…</p>
          </div>
        </div>
      ) : null}

      {imagePreview ? (
        <div className="modal-backdrop" role="presentation" onClick={closeImagePreview}>
          <div
            className="modal-dialog preview-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{imagePreview.title}</h3>
            <img src={imagePreview.url} alt={imagePreview.title} style={{ maxWidth: "100%", maxHeight: "70vh" }} />
            <button type="button" className="btn btn--secondary" onClick={closeImagePreview}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
