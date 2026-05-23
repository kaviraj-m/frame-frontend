import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { OrderIdCell } from "@/components/orders/OrderIdCell";
import { OrderRowAgeLegend } from "@/components/orders/OrderRowAgeLegend";
import { orderRowAgeDataAttr, orderRowClassName } from "@/lib/orderCreatedAge";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import {
  designerQueueAction,
  matchesDesignerFilter,
  orderMatchesSearch,
  sortQueueOrders,
  type DesignerQueueFilter,
} from "@/lib/designerWorkflow";
import { formatShortDateTime } from "@/lib/formatDisplay";
import type { OrderListRow } from "@/lib/orderListTypes";
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
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const FILTERS: { id: DesignerQueueFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "revision", label: "Revision" },
  { id: "new", label: "New" },
  { id: "in_design", label: "In design" },
  { id: "awaiting", label: "Awaiting customer" },
];

export function DesignerQueuePage() {
  const [queue, setQueue] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DesignerQueueFilter>("all");

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const out = await api<OrderListRow[]>(apiPaths.designerQueue);
      setQueue(sortQueueOrders(out));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return queue.filter((o) => {
      if (!matchesDesignerFilter(o.status, statusFilter)) return false;
      if (!search.trim()) return true;
      return orderMatchesSearch(o, search);
    });
  }, [queue, search, statusFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<DesignerQueueFilter, number> = {
      all: queue.length,
      new: 0,
      in_design: 0,
      awaiting: 0,
      revision: 0,
    };
    for (const o of queue) {
      if (matchesDesignerFilter(o.status, "new")) counts.new++;
      if (matchesDesignerFilter(o.status, "in_design")) counts.in_design++;
      if (matchesDesignerFilter(o.status, "awaiting")) counts.awaiting++;
      if (matchesDesignerFilter(o.status, "revision")) counts.revision++;
    }
    return counts;
  }, [queue]);

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <PageHeader
        kicker="Designer"
        title="Work queue"
        description="Orders ready for design work, sorted by urgency."
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col gap-4 min-w-0 w-full max-w-full">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              type="button"
              variant={statusFilter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
              {f.id !== "all" ? ` (${filterCounts[f.id]})` : ` (${filterCounts.all})`}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <div className="relative flex-1 min-w-[180px] max-w-[320px]">
            <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex">
              <DataBoardSearchIcon />
            </span>
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queue, customer, order…"
              aria-label="Search queue"
            />
          </div>
        </div>

        <div className="mb-3 px-0.5">
          <OrderRowAgeLegend />
        </div>

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2 py-6">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading queue…
          </p>
        ) : (
          <div className="overflow-auto w-full">
            <Table>
              <TableHeaderBand>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Query</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Frame</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next action</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeaderBand>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow
                    key={o.orderId}
                    className={cn(orderRowClassName(o.createdAt, o.status))}
                    data-order-age={orderRowAgeDataAttr(o.createdAt, o.status)}
                  >
                    <TableCell className="font-mono text-xs">
                      <OrderIdCell orderId={o.orderId} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{o.queryId}</TableCell>
                    <TableCell className="font-semibold">{o.customerUsername?.trim() ? o.customerUsername : "—"}</TableCell>
                    <TableCell>{o.customerPhoneNumber?.trim() ? o.customerPhoneNumber : "—"}</TableCell>
                    <TableCell>{o.frameSize ?? "—"}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{designerQueueAction(o.status)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(o.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm">
                        <Link to={`/designer/orders/${encodeURIComponent(o.orderId)}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {queue.length === 0
                        ? "No items in the queue."
                        : "No rows match your search or filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground mt-3">
              Showing <strong>{filtered.length}</strong> item{filtered.length === 1 ? "" : "s"}
              {search.trim() || statusFilter !== "all" ? ` (of ${queue.length})` : ""}
            </p>
          </div>
        )}

        {!loading && queue.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground mt-3.5">
            Orders appear here after an executive confirms payment. Check back after new orders are confirmed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
