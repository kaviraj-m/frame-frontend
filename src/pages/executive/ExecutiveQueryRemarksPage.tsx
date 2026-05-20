import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiBinaryGet } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";
import { formatShortDateTime } from "../../lib/formatDisplay";

type RemarkEntry = {
  id?: string;
  queryId: string;
  body: string;
  imageKey?: string;
  createdAt: string;
};

type QueryDetail = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  remarkHistory: RemarkEntry[];
};

function RemarkImage({ queryId, remarkId }: { queryId: string; remarkId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const blob = await apiBinaryGet(apiPaths.executiveQueryRemarkImage(queryId, remarkId));
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [queryId, remarkId]);

  if (failed) return <p className="small muted">Could not load image.</p>;
  if (!src) return <p className="small muted">Loading image…</p>;
  return <img className="remark-timeline__image" src={src} alt="Remark attachment" />;
}

export function ExecutiveQueryRemarksPage() {
  const { queryId: queryIdParam } = useParams();
  const queryId = queryIdParam ? decodeURIComponent(queryIdParam) : "";
  const [detail, setDetail] = useState<QueryDetail | null>(null);
  const [newRemark, setNewRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!queryId) return;
    const d = await api<QueryDetail>(apiPaths.executiveQueryDetail(queryId));
    setDetail(d);
  }, [queryId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!queryId) return;
      setError("");
      try {
        await loadDetail();
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryId, loadDetail]);

  async function appendRemark(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const text = newRemark.trim();
    if (!text) {
      setError("Enter a remark.");
      return;
    }
    setSaving(true);
    try {
      await api(apiPaths.executiveQueryRemarks(queryId), {
        method: "PUT",
        body: JSON.stringify({ remarks: text }),
      });
      setNewRemark("");
      setStatus("Saved.");
      await loadDetail();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!queryId) {
    return (
      <div className="card">
        <p className="error">Missing query id.</p>
        <Link to="/executive/queries">← Queries</Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/executive/queries">Queries</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Remarks</span>
      </nav>
      <PageHeader
        kicker="Query"
        title="Remarks history"
        description="Each save adds a new dated entry. The queries table shows the latest note only."
      />
      {status && <div className="flash flash--success" role="status">{status}</div>}
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      {detail ? (
        <div className="card card--muted">
          <h3>On file</h3>
          <dl className="kv">
            <dt>Customer</dt>
            <dd>{detail.customerUsername}</dd>
            <dt>Phone</dt>
            <dd>{detail.customerPhoneNumber}</dd>
            <dt>Email</dt>
            <dd>{detail.customerEmail?.trim() ? detail.customerEmail : "—"}</dd>
            <dt>Query ID</dt>
            <dd className="mono">{detail.queryId}</dd>
          </dl>
        </div>
      ) : null}

      <section className="card">
        <h3>Timeline</h3>
        {detail && detail.remarkHistory.length > 0 ? (
          <ul className="remark-timeline">
            {detail.remarkHistory.map((row) => (
              <li
                key={row.id || `${row.createdAt}-${row.body.slice(0, 24)}`}
                className="remark-timeline__item"
              >
                <div className="remark-timeline__time small">{formatShortDateTime(row.createdAt)}</div>
                {row.body ? <div className="remark-timeline__body">{row.body}</div> : null}
                {row.imageKey && row.id ? (
                  <RemarkImage queryId={queryId} remarkId={row.id} />
                ) : row.imageKey ? (
                  <p className="small muted">(Photo attached)</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">No remarks yet. Add the first note below.</p>
        )}
      </section>

      <form className="card" onSubmit={appendRemark}>
        <label>
          New follow-up note
          <textarea
            className="textarea"
            rows={5}
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            placeholder="What happened on this contact? Saved with date and time."
            disabled={saving}
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={!detail || saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <Link to="/executive/queries" className="secondary-link">
            Back to list
          </Link>
        </div>
      </form>
    </div>
  );
}
