import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { FilePickField } from "../../components/ui/FilePickField";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { api, apiBinaryGet, apiUpload } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { formatShortDateTime } from "../../lib/formatDisplay";
import { PageHeader } from "../../components/ui/PageHeader";

type OrderAssetRow = {
  id: string;
  orderId: string;
  r2Key: string;
  assetType: string;
  isFinal: boolean;
  createdAt?: string;
};

function fileLabelFromKey(key: string): string {
  const i = key.lastIndexOf("/");
  return i >= 0 ? key.slice(i + 1) : key;
}

function assetTypeLabel(t: string): string {
  switch (t) {
    case "SOURCE_PHOTO":
      return "Source photo (print)";
    case "CUSTOMER_PHOTO":
      return "Customer image (frame)";
    case "DESIGN_PREVIEW":
      return "Design preview";
    case "FINAL_IMAGE":
      return "Final image";
    default:
      return t;
  }
}

export function ExecutiveOrderAssetsPage() {
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdParam ? decodeURIComponent(orderIdParam) : "";
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [assets, setAssets] = useState<OrderAssetRow[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [imagePreviewLoading, setImagePreviewLoading] = useState(false);
  const imagePreviewUrlRef = useRef<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const { confirmAction, dialogProps } = useConfirmDialog();

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

  const loadAssets = useCallback(async () => {
    if (!orderId.trim()) return;
    setError("");
    try {
      const list = await api<OrderAssetRow[]>(apiPaths.executiveOrderAssets(orderId));
      setAssets(list);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [orderId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  function canExecutiveDeleteAsset(assetType: string): boolean {
    return assetType === "SOURCE_PHOTO" || assetType === "CUSTOMER_PHOTO";
  }

  async function viewAsset(assetId: string, r2Key: string) {
    closeImagePreview();
    setError("");
    setImagePreviewLoading(true);
    try {
      const path = apiPaths.executiveOrderAssetFile(orderId, assetId, "inline");
      const blob = await apiBinaryGet(path);
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
      const path = apiPaths.executiveOrderAssetFile(orderId, assetId, "attachment");
      const blob = await apiBinaryGet(path);
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

  function deleteAsset(assetId: string, assetType: string) {
    if (!canExecutiveDeleteAsset(assetType)) return;
    confirmAction(
      {
        title: "Delete file",
        message: "Delete this file from the order and from storage? This cannot be undone.",
        confirmLabel: "Delete file",
        variant: "danger",
      },
      async () => {
        setError("");
        setStatus("");
        setDeletingAssetId(assetId);
        try {
          await api(apiPaths.executiveOrderAssetDelete(orderId, assetId), { method: "DELETE" });
          setStatus("File removed.");
          await loadAssets();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setDeletingAssetId(null);
        }
      },
    );
  }

  function clearSourceFileSelection() {
    setSourceFiles([]);
  }

  async function uploadSourceFile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const files = sourceFiles;
    if (!orderId.trim() || files.length === 0) {
      setError("Choose one or more images to upload.");
      return;
    }
    setUploadBusy(true);
    setUploadProgress({ current: 0, total: files.length });
    const failures: string[] = [];
    let ok = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        const file = files[i];
        try {
          const fd = new FormData();
          fd.append("file", file);
          await apiUpload(apiPaths.executiveOrderAsset(orderId, "source"), fd);
          ok++;
        } catch (err) {
          failures.push(`${file.name}: ${(err as Error).message}`);
        }
      }
    } finally {
      setUploadBusy(false);
      setUploadProgress(null);
    }
    await loadAssets();
    if (ok > 0) {
      setStatus(
        failures.length === 0
          ? `Uploaded ${ok} image${ok === 1 ? "" : "s"} successfully.`
          : `Uploaded ${ok} of ${files.length}. Some could not be uploaded — see the error below.`,
      );
    }
    if (failures.length > 0) {
      setError(failures.join(" "));
    }
    if (ok === files.length) {
      clearSourceFileSelection();
    }
  }

  if (!orderId) {
    return (
      <div className="card">
        <p className="error">Missing order id.</p>
        <Link to="/executive/orders">← Orders</Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/executive/orders">Orders</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="mono">{orderId}</span>
        <span className="breadcrumb-sep">/</span>
        <span>Source photos</span>
      </nav>
      <PageHeader
        kicker="Print files"
        title="Source photos"
        description="Everything the lab needs before design starts. Files already on this order (including the customer frame image from confirm) appear below. Add more from your computer."
        actions={
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadAssets()}>
            Refresh list
          </button>
        }
      />
      {status && <div className="flash flash--success" role="status">{status}</div>}
      {error && <div className="flash flash--error" role="alert">{error}</div>}

      <div className="card">
        <h3>Files on this order</h3>
        <p className="muted">Framing images from confirm order show as &quot;Customer image (frame)&quot; (there may be several). Source uploads show as &quot;Source photo (print)&quot;.</p>
        <div className="table-wrap table-wrap--scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Storage key</th>
                <th>Added</th>
                <th className="td-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td className="td-strong">{assetTypeLabel(a.assetType)}</td>
                  <td className="td-mono">{a.r2Key}</td>
                  <td className="date-cell">{formatShortDateTime(a.createdAt)}</td>
                  <td className="td-actions">
                    <div className="inline-actions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => viewAsset(a.id, a.r2Key)}>
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => downloadAsset(a.id, a.r2Key)}
                      >
                        Download
                      </button>
                      {canExecutiveDeleteAsset(a.assetType) && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={deletingAssetId !== null}
                          onClick={() => deleteAsset(a.id, a.assetType)}
                        >
                          {deletingAssetId === a.id ? (
                            <>
                              <span className="spinner spinner--sm" aria-hidden />
                              Deleting…
                            </>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={4}>No files yet. Confirm the order with a customer image, or upload a source photo below.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="table-footer">
            <p className="total-info">
              Showing <strong>{assets.length}</strong> file{assets.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Upload from computer</h3>
        <form className="stack" onSubmit={uploadSourceFile} aria-busy={uploadBusy}>
          <FilePickField
            label="Source photos"
            hint="JPEG / PNG / WebP, up to about 32MB each. Pick several at once, or use Choose images again to add more — previous picks stay in the list."
            multiple
            chooseLabel="Choose images"
            files={sourceFiles}
            onFilesChange={setSourceFiles}
            disabled={uploadBusy}
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={uploadBusy || sourceFiles.length === 0}>
            {uploadBusy && uploadProgress ? (
              <>
                <span className="spinner" aria-hidden />
                Uploading {uploadProgress.current} / {uploadProgress.total}…
              </>
            ) : (
              `Upload${sourceFiles.length > 1 ? ` ${sourceFiles.length} images` : sourceFiles.length === 1 ? " image" : ""}`
            )}
          </button>
        </form>
      </div>
      <Link to="/executive/orders" className="secondary-link">← Back to orders</Link>

      {(imagePreviewLoading || imagePreview) && (
        <div
          className="image-preview-backdrop"
          role="presentation"
          onClick={closeImagePreview}
        >
          <div
            className="image-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={imagePreview ? `Preview: ${imagePreview.title}` : "Loading preview"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="image-preview-toolbar">
              <span className="image-preview-title td-mono small">{imagePreview?.title ?? "…"}</span>
              <button type="button" className="btn btn--secondary btn--sm" onClick={closeImagePreview}>
                Close
              </button>
            </div>
            <div className="image-preview-body">
              {imagePreviewLoading && <p className="muted image-preview-loading">Loading image…</p>}
              {imagePreview && (
                <img src={imagePreview.url} alt={imagePreview.title} className="image-preview-img" />
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
