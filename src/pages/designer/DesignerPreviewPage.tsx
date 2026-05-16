import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiUpload } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";

export function DesignerPreviewPage() {
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdParam ? decodeURIComponent(orderIdParam) : "";
  const [previewKey, setPreviewKey] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function uploadPreview(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      await api(apiPaths.designerPreviewAssets(orderId), {
        method: "POST",
        body: JSON.stringify({ r2Key: previewKey }),
      });
      setStatus("Preview key linked.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function uploadPreviewFile(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!orderId.trim() || !previewFile) {
      setError("Choose a file to upload.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", previewFile);
      await apiUpload(apiPaths.designerPreviewAssets(orderId), fd);
      setStatus(`Uploaded (${previewFile.name}).`);
      setPreviewFile(null);
    } catch (e) {
      setError((e as Error).message);
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

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/designer/queue">Queue</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="mono">{orderId}</span>
        <span className="breadcrumb-sep">/</span>
        <span>Preview</span>
      </nav>
      <PageHeader
        kicker="Customer-facing"
        title="Preview asset"
        description="What the customer signs off on. Upload here, then send it however you already share proofs. Approve / Reject stays on the queue."
      />
      {status && <div className="flash flash--success" role="status">{status}</div>}
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      <div className="card">
        <h3>Upload</h3>
        <p className="muted">Flat image or PDF-style artwork the customer will see.</p>
        <form className="stack" onSubmit={uploadPreviewFile}>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)} />
          <button type="submit" className="btn btn--primary">
            Upload
          </button>
        </form>
      </div>
      <div className="card">
        <h3>Link existing key</h3>
        <form className="stack" onSubmit={uploadPreview}>
          <input placeholder="Object key" value={previewKey} onChange={(e) => setPreviewKey(e.target.value)} />
          <button type="submit" className="btn btn--secondary">
            Register
          </button>
        </form>
      </div>
      <Link to="/designer/queue" className="secondary-link">← Back to queue</Link>
    </div>
  );
}
