import { Link } from "react-router-dom";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { fulfillmentQueueAction } from "../../lib/adminFulfillment";
import { formatMoney, formatShortDateTime } from "../../lib/formatDisplay";
import type { AdminOrderRow } from "./adminOrderTypes";

type Props = {
  orders: AdminOrderRow[];
  emptyMessage: string;
  patchBasePath?: string;
  showFulfillment?: boolean;
};

export function AdminOrdersTable({
  orders,
  emptyMessage,
  patchBasePath = "/admin/orders/patch",
  showFulfillment = false,
}: Props) {
  const colSpan = showFulfillment ? 15 : 13;

  return (
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
            {showFulfillment && <th>Print</th>}
            <th>Payment</th>
            <th>Balance</th>
            <th>Tracking</th>
            {showFulfillment && <th>Next action</th>}
            <th>Created</th>
            <th>Updated</th>
            <th className="td-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
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
              {showFulfillment && (
                <td>
                  <span className="small">{o.printStage?.trim() ? o.printStage : "—"}</span>
                </td>
              )}
              <td>
                <span className="small">{o.paymentStatus ?? "—"}</span>
                {o.paymentMode ? (
                  <span className="muted small"> · {o.paymentMode}</span>
                ) : null}
              </td>
              <td>{formatMoney(o.balanceAmount)}</td>
              <td className="td-mono">{o.trackingNumber?.trim() ? o.trackingNumber : "—"}</td>
              {showFulfillment && (
                <td className="small">{fulfillmentQueueAction(o)}</td>
              )}
              <td className="date-cell">{formatShortDateTime(o.createdAt)}</td>
              <td className="date-cell">{formatShortDateTime(o.updatedAt)}</td>
              <td className="td-actions">
                {showFulfillment ? (
                  <Link
                    className="btn btn--primary btn--sm"
                    to={`/admin/orders/${encodeURIComponent(o.orderId)}`}
                  >
                    Fulfill
                  </Link>
                ) : (
                  <Link
                    className="btn btn--secondary btn--sm"
                    to={`${patchBasePath}?orderId=${encodeURIComponent(o.orderId)}`}
                  >
                    Update
                  </Link>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr className="empty-row">
              <td colSpan={colSpan}>{emptyMessage}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="table-footer">
        <p className="total-info">
          Showing <strong>{orders.length}</strong> order{orders.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
