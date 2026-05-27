import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "@/components/ui/DataBoardSearchIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/lib/api";
import {
  adminFulfillmentPortal,
  type FulfillmentPortalConfig,
} from "@/lib/fulfillmentPortal";
import {
  fulfillmentQueueAction,
  matchesFulfillmentFilter,
  sortFulfillmentOrders,
  type FulfillmentQueueFilter,
} from "@/lib/adminFulfillment";
import { isProductionDispatchQueueStatus } from "@/lib/orderStatusGroups";
import type { AdminOrderRow } from "./adminOrderTypes";
import { AdminOrdersTable } from "./AdminOrdersTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const FILTERS: { id: FulfillmentQueueFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "print_due", label: "Print due" },
  { id: "frame_due", label: "Frame due" },
  { id: "awaiting_payment", label: "Awaiting payment" },
  { id: "ready_to_ship", label: "Ready to ship" },
];

export function OrdersProductionPage({
  portal = adminFulfillmentPortal,
}: {
  portal?: FulfillmentPortalConfig;
}) {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FulfillmentQueueFilter>("all");

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const all = await api<AdminOrderRow[]>(portal.productionOrdersApi);
      const production = all.filter((o) => isProductionDispatchQueueStatus(o.status));
      setOrders(sortFulfillmentOrders(production));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [portal.productionOrdersApi]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (!matchesFulfillmentFilter(o, statusFilter)) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.queryId.toLowerCase().includes(q) ||
        (o.customerUsername ?? "").toLowerCase().includes(q) ||
        (o.customerPhoneNumber ?? "").includes(q) ||
        (o.customerEmail ?? "").toLowerCase().includes(q) ||
        (o.status ?? "").toLowerCase().includes(q) ||
        fulfillmentQueueAction(o).toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<FulfillmentQueueFilter, number> = {
      all: orders.length,
      print_due: 0,
      frame_due: 0,
      awaiting_payment: 0,
      ready_to_ship: 0,
      done: 0,
    };
    for (const o of orders) {
      if (matchesFulfillmentFilter(o, "print_due")) counts.print_due++;
      if (matchesFulfillmentFilter(o, "frame_due")) counts.frame_due++;
      if (matchesFulfillmentFilter(o, "awaiting_payment")) counts.awaiting_payment++;
      if (matchesFulfillmentFilter(o, "ready_to_ship")) counts.ready_to_ship++;
    }
    return counts;
  }, [orders]);

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <PageHeader
        kicker={portal.kicker}
        title="Production & dispatch"
        description="Active production queue after design approval. Completed and returned orders are not listed here."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Production filters">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === f.id}
            variant={statusFilter === f.id ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f.id)}
          >
            {f.label}
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[0.65rem]">
              {filterCounts[f.id]}
            </Badge>
          </Button>
        ))}
      </div>

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
              placeholder="Search production queue…"
              aria-label="Search orders"
            />
          </div>
          <div className="ml-auto flex flex-wrap gap-2 items-center">
            <Button type="button" variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading production queue…</p>
        ) : (
          <AdminOrdersTable
            orders={filtered}
            emptyMessage="No orders in this view. They appear here once status is DESIGN_APPROVED or later."
            showFulfillment
            fulfillPath={portal.fulfillPath}
          />
        )}
        <p className="text-sm text-muted-foreground mt-3.5">
          <Link to={portal.ordersListPath} className="text-primary font-semibold hover:underline">← All orders</Link>
          {portal.patchPath ? (
            <>
              {" · "}
              <Link to={portal.patchPath} className="text-primary font-semibold hover:underline">
                Advanced patch
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function AdminOrdersProductionPage() {
  return <OrdersProductionPage portal={adminFulfillmentPortal} />;
}
