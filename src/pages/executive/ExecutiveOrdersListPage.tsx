import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { formatMoney, formatShortDateTime } from "../../lib/formatDisplay";
import { mapOrderStatus } from "../../lib/orderStatusUi";
import type { OrderListRow } from "../../lib/orderListTypes";

export function ExecutiveOrdersListPage() {
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function refresh() {
    setError("");
    try {
      const all = await api<OrderListRow[]>(apiPaths.orders);
      setOrders(all);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const raw = (o.status ?? "").toLowerCase();
      const uiLabel = mapOrderStatus(o.status ?? "").toLowerCase();
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.queryId.toLowerCase().includes(q) ||
        (o.customerUsername ?? "").toLowerCase().includes(q) ||
        (o.customerPhoneNumber ?? "").includes(q) ||
        (o.customerEmail ?? "").toLowerCase().includes(q) ||
        raw.includes(q) ||
        uiLabel.includes(q) ||
        (o.frameSize ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  return (
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
            placeholder="Search orders, customer, phone…"
            aria-label="Search orders"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Query</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Frame</th>
              <th>Status</th>
              <th>Advance</th>
              <th>Balance</th>
              <th>Pay mode</th>
              <th>Created</th>
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
                <td className="remark-clip" title={o.customerEmail || undefined}>
                  {o.customerEmail?.trim() ? o.customerEmail : "—"}
                </td>
                <td>{o.frameSize ?? "—"}</td>
                <td>
                  <OrderStatusBadge status={o.status} />
                </td>
                <td>{formatMoney(o.advancePayment)}</td>
                <td>{formatMoney(o.balanceAmount)}</td>
                <td>{o.paymentMode ?? "—"}</td>
                <td className="date-cell">{formatShortDateTime(o.createdAt)}</td>
                <td className="date-cell">{formatShortDateTime(o.updatedAt)}</td>
                <td className="td-actions">
                  <div className="inline-actions">
                    <Link
                      className="btn btn--secondary btn--sm"
                      to={`/executive/orders/${encodeURIComponent(o.orderId)}/assets`}
                    >
                      Photos
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={13}>
                  {orders.length === 0
                    ? "No orders yet. Confirm an order from Queries."
                    : "No rows match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            Showing <strong>{filtered.length}</strong> order{filtered.length === 1 ? "" : "s"}
            {search.trim() ? ` (of ${orders.length})` : ""}
          </p>
        </div>
      </div>
      <p className="data-board__footer-note">
        Nothing here? Start from <Link to="/executive/queries">Queries</Link> and use <strong>Confirm order</strong> on a row.
      </p>
    </div>
  );
}
