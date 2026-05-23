import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiBinaryGet } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatShortDateTime } from "@/lib/formatDisplay";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  if (failed) return <p className="text-xs text-muted-foreground">Could not load image.</p>;
  if (!src) return <p className="text-xs text-muted-foreground">Loading image…</p>;
  return <img className="max-w-full rounded-md border border-border mt-2" src={src} alt="Remark attachment" />;
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
      <Card>
        <p className="text-destructive">Missing query id.</p>
        <Link to="/executive/queries" className="text-sm text-primary hover:underline">
          ← Queries
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <nav className="breadcrumb text-sm">
        <Link to="/executive/queries">Queries</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Remarks</span>
      </nav>
      <PageHeader
        kicker="Query"
        title="Remarks history"
        description="Each save adds a new dated entry. The queries table shows the latest note only."
      />
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
      {detail ? (
        <Card muted>
          <h3 className="text-lg font-semibold mb-3">On file</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Customer</dt>
            <dd>{detail.customerUsername}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{detail.customerPhoneNumber}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{detail.customerEmail?.trim() ? detail.customerEmail : "—"}</dd>
            <dt className="text-muted-foreground">Query ID</dt>
            <dd className="font-mono text-xs">{detail.queryId}</dd>
          </dl>
        </Card>
      ) : null}

      <Card>
        <h3 className="text-lg font-semibold mb-3">Timeline</h3>
        {detail && detail.remarkHistory.length > 0 ? (
          <ul className="space-y-4 border-l-2 border-border pl-4">
            {detail.remarkHistory.map((row) => (
              <li
                key={row.id || `${row.createdAt}-${row.body.slice(0, 24)}`}
                className="space-y-1"
              >
                <div className="text-xs text-muted-foreground">{formatShortDateTime(row.createdAt)}</div>
                {row.body ? <div className="text-sm">{row.body}</div> : null}
                {row.imageKey && row.id ? (
                  <RemarkImage queryId={queryId} remarkId={row.id} />
                ) : row.imageKey ? (
                  <p className="text-xs text-muted-foreground">(Photo attached)</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No remarks yet. Add the first note below.</p>
        )}
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={appendRemark}>
          <label className="block space-y-2 text-sm font-medium">
            New follow-up note
            <Textarea
              rows={5}
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              placeholder="What happened on this contact? Saved with date and time."
              disabled={saving}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!detail || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Link to="/executive/queries" className="text-sm text-muted-foreground hover:text-foreground">
              Back to list
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
