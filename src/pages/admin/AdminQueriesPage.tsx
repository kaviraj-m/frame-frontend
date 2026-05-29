import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { exportQueriesToExcel } from "@/lib/exportQueriesExcel";
import { formatShortDateTime, truncate } from "@/lib/formatDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";
import { RESPONSIVE_SEARCH_WRAP, RESPONSIVE_TOOLBAR_ACTIONS } from "@/lib/responsive";

type AdminQuery = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  createdByExecutiveId?: string;
  executiveUsername?: string;
  linkedOrderId?: string;
  linkedOrderIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

function linkedOrderIdsForRow(q: AdminQuery): string[] {
  if (q.linkedOrderIds?.length) {
    return q.linkedOrderIds.map((id) => id.trim()).filter(Boolean);
  }
  const single = q.linkedOrderId?.trim();
  return single ? [single] : [];
}

export function AdminQueriesPage() {
  const [queries, setQueries] = useState<AdminQuery[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { confirmAction, dialogProps } = useConfirmDialog();

  const loadQueries = useCallback(async () => {
    setError("");
    try {
      const list = await api<AdminQuery[]>(apiPaths.adminQueries);
      setQueries(list);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadQueries();
  }, [loadQueries]);

  function requestDeleteQuery(row: AdminQuery) {
    confirmAction(
      {
        title: "Delete query",
        message: `Permanently delete query ${row.queryId}? Remarks and images on this query will be removed. This cannot be undone.`,
        confirmLabel: "Delete query",
        variant: "danger",
      },
      async () => {
        setError("");
        setDeletingId(row.queryId);
        try {
          await api(apiPaths.adminDeleteQuery(row.queryId), { method: "DELETE" });
          await loadQueries();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setDeletingId(null);
        }
      },
    );
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return queries;
    const q = search.toLowerCase();
    return queries.filter(
      (row) =>
        row.queryId.toLowerCase().includes(q) ||
        row.customerUsername.toLowerCase().includes(q) ||
        row.customerPhoneNumber.includes(q) ||
        (row.customerEmail ?? "").toLowerCase().includes(q) ||
        (row.remarks ?? "").toLowerCase().includes(q) ||
        (row.executiveUsername ?? "").toLowerCase().includes(q) ||
        (row.createdByExecutiveId ?? "").toLowerCase().includes(q) ||
        (row.linkedOrderId ?? "").toLowerCase().includes(q),
    );
  }, [queries, search]);

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className={RESPONSIVE_SEARCH_WRAP}>
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
            <DataBoardSearchIcon />
          </span>
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries, customer, executive…"
            aria-label="Search queries"
          />
        </div>
        <div className={RESPONSIVE_TOOLBAR_ACTIONS}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={filtered.length === 0}
            onClick={() => exportQueriesToExcel(filtered)}
          >
            Export Excel
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={loadQueries}>
            Refresh
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="w-full">
        <Table stickyFirstColumn>
          <TableHeaderBand>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Executive</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {filtered.map((q) => (
              <TableRow key={q.queryId}>
                <TableCell className="font-mono text-xs">{q.queryId}</TableCell>
                <TableCell className="font-semibold">{q.customerUsername}</TableCell>
                <TableCell>{q.customerPhoneNumber}</TableCell>
                <TableCell className="max-w-[180px] truncate" title={q.customerEmail || undefined}>
                  {q.customerEmail?.trim() ? q.customerEmail : "—"}
                </TableCell>
                <TableCell title={q.createdByExecutiveId || undefined}>
                  {q.executiveUsername?.trim() ? q.executiveUsername : q.createdByExecutiveId || "—"}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {linkedOrderIdsForRow(q).length > 0 ? (
                    <span className="flex flex-wrap gap-x-1.5 gap-y-0.5 font-mono text-xs">
                      {linkedOrderIdsForRow(q).map((orderId, i) => (
                        <span key={orderId}>
                          {i > 0 ? <span className="text-muted-foreground">,</span> : null}
                          <Link
                            to={`/admin/orders/${encodeURIComponent(orderId)}`}
                            className="text-primary hover:underline"
                          >
                            {orderId}
                          </Link>
                        </span>
                      ))}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="max-w-[220px] truncate" title={q.remarks || undefined}>
                  {truncate(q.remarks || "—", 48)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(q.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(q.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    title={
                      q.linkedOrderId?.trim()
                        ? "Delete linked order first"
                        : "Delete query"
                    }
                    disabled={deletingId === q.queryId || linkedOrderIdsForRow(q).length > 0}
                    onClick={() => requestDeleteQuery(q)}
                    aria-label="Delete query"
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  {queries.length === 0 ? "No queries yet." : "No rows match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-3">
          Showing <strong>{filtered.length}</strong> quer{filtered.length === 1 ? "y" : "ies"}
          {search.trim() ? ` (of ${queries.length})` : ""}
        </p>
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
