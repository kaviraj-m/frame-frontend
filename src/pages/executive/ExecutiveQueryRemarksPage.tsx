import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";
import { formatShortDateTime } from "../../lib/formatDisplay";

type RemarkEntry = { id?: string; queryId: string; body: string; createdAt: string };

type QueryDetail = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  remarkHistory: RemarkEntry[];
};

export function ExecutiveQueryRemarksPage() {
  const { queryId: queryIdParam } = useParams();
  const queryId = queryIdParam ? decodeURIComponent(queryIdParam) : "";
  const [detail, setDetail] = useState<QueryDetail | null>(null);
  const [newRemark, setNewRemark] = useState("");
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
      setError("Enter a remark to save.");
      return;
    }
    try {
      await api(apiPaths.executiveQueryRemarks(queryId), {
        method: "PUT",
        body: JSON.stringify({ remarks: text }),
      });
      setNewRemark("");
      setStatus("Remark saved with date and time.");
      await loadDetail();
    } catch (e) {
      setError((e as Error).message);
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
                <div className="remark-timeline__body">{row.body}</div>
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
            placeholder="What happened on this contact? This will be saved with the current date and time."
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={!detail}>
            Save remark
          </button>
          <Link to="/executive/queries" className="secondary-link">
            Back to list
          </Link>
        </div>
      </form>
    </div>
  );
}
