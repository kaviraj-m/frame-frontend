import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RemarkTimeline } from "@/components/remarks/RemarkTimeline";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { formatShortDateTime } from "@/lib/formatDisplay";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QueryDetail = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  remarkHistory: { id?: string; body: string; imageKey?: string; createdAt: string }[];
  createdAt?: string;
  updatedAt?: string;
};

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[0.68rem] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm break-words">{value || "—"}</div>
    </div>
  );
}

export function ExecutiveQueryDetailModal({
  queryId,
  open,
  onClose,
}: {
  queryId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<QueryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const id = queryId.trim();
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const d = await api<QueryDetail>(apiPaths.executiveQueryDetail(id));
      setDetail(d);
    } catch (e) {
      setError((e as Error).message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [queryId]);

  useEffect(() => {
    if (open && queryId.trim()) {
      void load();
    }
  }, [open, queryId, load]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl max-h-[min(90vh,820px)] flex flex-col p-0 gap-0"
        onPointerDownOutside={onClose}
      >
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border">
          <DialogTitle className="font-mono">{queryId}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {loading && !detail ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading query details…</p>
          ) : null}

          {detail ? (
            <>
              <section>
                <h3 className="text-sm font-semibold mb-3">Customer</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <DetailField label="Name" value={detail.customerUsername?.trim()} />
                  <DetailField label="Phone" value={detail.customerPhoneNumber?.trim()} />
                  <DetailField label="Email" value={detail.customerEmail?.trim()} />
                  <DetailField label="Created" value={formatShortDateTime(detail.createdAt)} />
                  <DetailField label="Updated" value={formatShortDateTime(detail.updatedAt)} />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-3">Remarks</h3>
                <RemarkTimeline
                  entries={(detail.remarkHistory ?? []).map((r) => ({
                    id: r.id,
                    body: r.body,
                    imageKey: r.imageKey,
                    createdAt: r.createdAt,
                  }))}
                  imageUrl={(remarkId) => apiPaths.executiveQueryRemarkImage(detail.queryId, remarkId)}
                  emptyMessage={detail.remarks?.trim() || "No remarks yet."}
                />
              </section>
            </>
          ) : null}
        </div>

        <DialogFooter className="px-6 py-4 shrink-0 border-t border-border flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button asChild size="sm">
            <Link to={`/executive/queries/${encodeURIComponent(queryId)}/remarks`} onClick={onClose}>
              Remarks
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
