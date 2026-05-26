import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
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

type AdminQuery = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  createdByExecutiveId?: string;
  executiveUsername?: string;
  linkedOrderId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function AdminQueriesPage() {
  const [queries, setQueries] = useState<AdminQuery[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadQueries() {
    setError("");
    try {
      const list = await api<AdminQuery[]>(apiPaths.adminQueries);
      setQueries(list);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    loadQueries();
  }, []);

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
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
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
        <div className="ml-auto flex flex-wrap gap-2 items-center">
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
      <div className="overflow-auto w-full">
        <Table>
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
                <TableCell>
                  {q.linkedOrderId?.trim() ? (
                    <Link
                      to={`/admin/orders/${encodeURIComponent(q.linkedOrderId)}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {q.linkedOrderId}
                    </Link>
                  ) : (
                    "—"
                  )}
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
