import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { PageHeader } from "../../components/ui/PageHeader";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import {
  fulfillmentQueueAction,
  matchesFulfillmentFilter,
  sortFulfillmentOrders,
  type FulfillmentQueueFilter,
} from "../../lib/adminFulfillment";
import { isPostDesignApprovalStatus } from "../../lib/orderStatusGroups";
import type { AdminOrderRow } from "./adminOrderTypes";
import { AdminOrdersTable } from "./AdminOrdersTable";

const FILTERS: { id: FulfillmentQueueFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "print_due", label: "Print due" },
  { id: "awaiting_payment", label: "Awaiting payment" },
  { id: "ready_to_ship", label: "Ready to ship" },
  { id: "done", label: "Done" },
];

export function AdminOrdersProductionPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FulfillmentQueueFilter>("all");

  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const all = await api<AdminOrderRow[]>(apiPaths.orders);
      const production = all.filter((o) => isPostDesignApprovalStatus(o.status));
      setOrders(sortFulfillmentOrders(production));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

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
      awaiting_payment: 0,
      ready_to_ship: 0,
      done: 0,
    };
    for (const o of orders) {
      if (matchesFulfillmentFilter(o, "print_due")) counts.print_due++;
      if (matchesFulfillmentFilter(o, "awaiting_payment")) counts.awaiting_payment++;
      if (matchesFulfillmentFilter(o, "ready_to_ship")) counts.ready_to_ship++;
      if (matchesFulfillmentFilter(o, "done")) counts.done++;
    }
    return counts;
  }, [orders]);

  return (
    <div className="page-stack">
      <PageHeader
        kicker="Admin"
        title="Production & dispatch"
        description="Orders after design approval — print, balance, courier, and completion."
      />

      <div className="workflow-filter-chips" role="tablist" aria-label="Production filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === f.id}
            className={`workflow-filter-chip${statusFilter === f.id ? " workflow-filter-chip--active" : ""}`}
            onClick={() => setStatusFilter(f.id)}
          >
            {f.label}
            <span className="workflow-filter-chip__count">{filterCounts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="data-board">
        <div className="data-board__toolbar">
          <div className="data-board__search-wrap">
            <span className="data-board__search-icon">
              <DataBoardSearchIcon />
            </span>
            <input
              className="data-board__search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search production queue…"
              aria-label="Search orders"
            />
          </div>
          <div className="data-board__toolbar-actions">
            <button type="button" className="btn btn--secondary btn--sm" onClick={refresh} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
        {error && (
          <div className="flash flash--error" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p className="muted">Loading production queue…</p>
        ) : (
          <AdminOrdersTable
            orders={filtered}
            emptyMessage="No orders in this view. They appear here once status is DESIGN_APPROVED or later."
            showFulfillment
          />
        )}
        <p className="data-board__footer-note">
          <Link to="/admin/orders">← All orders</Link>
          {" · "}
          <Link to="/admin/orders/patch">Advanced patch</Link>
        </p>
      </div>
    </div>
  );
}
