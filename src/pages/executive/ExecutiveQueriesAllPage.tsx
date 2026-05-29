import { useCallback, useEffect, useMemo, useState } from "react";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
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

type OrgQuery = {
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

function linkedOrderIdsForRow(q: OrgQuery): string[] {
  if (q.linkedOrderIds?.length) {
    return q.linkedOrderIds.map((id) => id.trim()).filter(Boolean);
  }
  const single = q.linkedOrderId?.trim();
  return single ? [single] : [];
}

export function ExecutiveQueriesAllPage() {
  const [queries, setQueries] = useState<OrgQuery[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadQueries = useCallback(async () => {
    setError("");
    try {
      const list = await api<OrgQuery[]>(apiPaths.executiveQueriesAll);
      setQueries(list);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void loadQueries();
  }, [loadQueries]);

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
        linkedOrderIdsForRow(row).some((id) => id.toLowerCase().includes(q)),
    );
  }, [queries, search]);

  return (
    <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
      <Alert>
        <AlertDescription>
          Read-only view of every customer query in the organisation. To add remarks or confirm
          orders, use <strong>Queries</strong> for your own queries.
        </AlertDescription>
      </Alert>
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
            aria-label="Search all queries"
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
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadQueries()}>
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
                <TableCell className="max-w-[200px] font-mono text-xs">
                  {linkedOrderIdsForRow(q).length > 0
                    ? linkedOrderIdsForRow(q).join(", ")
                    : "—"}
                </TableCell>
                <TableCell className="max-w-[220px] truncate" title={q.remarks || undefined}>
                  {truncate(q.remarks || "—", 48)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(q.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(q.updatedAt)}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
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
    </div>
  );
}
