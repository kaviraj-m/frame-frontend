import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import {
  designerQueueAction,
  matchesDesignerFilter,
  orderMatchesSearch,
  sortQueueOrders,
  type DesignerQueueFilter,
} from "../../lib/designerWorkflow";
import { formatShortDateTime } from "../../lib/formatDisplay";
import type { OrderListRow } from "../../lib/orderListTypes";

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
    <div className="page-stack">
      <PageHeader
        kicker="Designer"
        title="Work queue"
        description="Orders ready for design work, sorted by urgency."
        actions={
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        }
      />

      <div className="data-board">
        <div className="designer-filter-chips" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`designer-filter-chip${statusFilter === f.id ? " designer-filter-chip--active" : ""}`}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
              {f.id !== "all" ? ` (${filterCounts[f.id]})` : ` (${filterCounts.all})`}
            </button>
          ))}
        </div>

        <div className="data-board__toolbar">
          <div className="data-board__search-wrap">
            <span className="data-board__search-icon">
              <DataBoardSearchIcon />
            </span>
            <input
              className="data-board__search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queue, customer, order…"
              aria-label="Search queue"
            />
          </div>
        </div>

        {error && (
          <div className="flash flash--error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="muted" style={{ padding: "24px 0" }}>
            <span className="spinner spinner--sm" aria-hidden /> Loading queue…
          </p>
        ) : (
          <div className="table-wrap table-wrap--scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Query</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Frame</th>
                  <th>Status</th>
                  <th>Next action</th>
                  <th>Updated</th>
                  <th className="td-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.orderId}>
                    <td className="td-mono td-order-id">{o.orderId}</td>
                    <td className="td-mono td-muted-id">{o.queryId}</td>
                    <td className="td-strong">{o.customerUsername?.trim() ? o.customerUsername : "—"}</td>
                    <td>{o.customerPhoneNumber?.trim() ? o.customerPhoneNumber : "—"}</td>
                    <td>{o.frameSize ?? "—"}</td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="muted">{designerQueueAction(o.status)}</td>
                    <td className="date-cell">{formatShortDateTime(o.updatedAt)}</td>
                    <td className="td-actions">
                      <Link className="btn btn--primary btn--sm" to={`/designer/orders/${encodeURIComponent(o.orderId)}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={9}>
                      {queue.length === 0
                        ? "No items in the queue."
                        : "No rows match your search or filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="table-footer">
              <p className="total-info">
                Showing <strong>{filtered.length}</strong> item{filtered.length === 1 ? "" : "s"}
                {search.trim() || statusFilter !== "all" ? ` (of ${queue.length})` : ""}
              </p>
            </div>
          </div>
        )}

        {!loading && queue.length === 0 && !error ? (
          <p className="data-board__footer-note">
            Orders appear here after an executive confirms payment. Check back after new orders are confirmed.
          </p>
        ) : null}
      </div>
    </div>
  );
}
