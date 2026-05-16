import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { formatMoney, formatShortDateTime } from "../../lib/formatDisplay";
import { mapOrderStatus } from "../../lib/orderStatusUi";
import type { OrderListRow } from "../../lib/orderListTypes";

export function DesignerQueuePage() {
  const [queue, setQueue] = useState<OrderListRow[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [search, setSearch] = useState("");

  async function refresh() {
    setError("");
    try {
      const out = await api<OrderListRow[]>(apiPaths.designerQueue);
      setQueue(out);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function decide(orderId: string, decision: "APPROVE" | "REJECT") {
    setError("");
    setStatus("");
    try {
      await api(apiPaths.designerOrderDecision(orderId), {
        method: "POST",
        body: JSON.stringify({ decision, remarks }),
      });
      setStatus(`${decision === "APPROVE" ? "Approved" : "Revision requested"} for ${orderId}.`);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return queue;
    const q = search.toLowerCase();
    return queue.filter(
      (o) =>
        o.orderId.toLowerCase().includes(q) ||
        o.queryId.toLowerCase().includes(q) ||
        (o.customerUsername ?? "").toLowerCase().includes(q) ||
        (o.customerPhoneNumber ?? "").includes(q) ||
        (o.customerEmail ?? "").toLowerCase().includes(q) ||
        (o.status ?? "").toLowerCase().includes(q),
    );
  }, [queue, search]);

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
            placeholder="Search queue, customer, order…"
            aria-label="Search queue"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh}>
            Refresh
          </button>
        </div>
      </div>
      {status && <div className="flash flash--success" role="status">{status}</div>}
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      <div className="card">
        <h3>Notes for the next decision</h3>
        <p className="muted">Optional. Sent with the next Approve or Reject on any row.</p>
        <input
          placeholder="e.g. Customer asked for warmer tones"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>
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
                    <Link className="btn btn--secondary btn--sm" to={`/designer/orders/${encodeURIComponent(o.orderId)}/preview`}>
                      Preview
                    </Link>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => decide(o.orderId, "APPROVE")}>
                      Approve
                    </button>
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => decide(o.orderId, "REJECT")}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={13}>
                  {queue.length === 0 ? "No items in the queue." : "No rows match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            Showing <strong>{filtered.length}</strong> item{filtered.length === 1 ? "" : "s"}
            {search.trim() ? ` (of ${queue.length})` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
