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
import { RESPONSIVE_SEARCH_WRAP, RESPONSIVE_TOOLBAR_ACTIONS } from "@/lib/responsive";
type Query = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
};

export function ExecutiveQueriesPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  async function loadQueries() {
    setError("");
    try {
      const list = await api<Query[]>(apiPaths.executiveQueries);
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
        (row.remarks ?? "").toLowerCase().includes(q),
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
            placeholder="Search queries, customer, phone…"
            aria-label="Search queries"
          />
        </div>
        <div className={RESPONSIVE_TOOLBAR_ACTIONS}>
          <Button asChild size="sm">
            <Link to="/executive/queries/new">New query</Link>
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
                <TableCell className="max-w-[220px] truncate" title={q.remarks || undefined}>
                  {truncate(q.remarks || "—", 48)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(q.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(q.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/executive/queries/${encodeURIComponent(q.queryId)}/remarks`}>
                        Remarks
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link to={`/executive/orders/new/${encodeURIComponent(q.queryId)}`}>
                        Confirm order
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {queries.length === 0 ? "No queries yet. Create one with New query." : "No rows match your search."}
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
