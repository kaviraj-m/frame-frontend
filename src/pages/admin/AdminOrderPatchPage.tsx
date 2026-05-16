import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";

export function AdminOrderPatchPage() {
  const [searchParams] = useSearchParams();
  const qpOrderId = searchParams.get("orderId")?.trim() ?? "";

  const [orderId, setOrderId] = useState(qpOrderId);
  const [orderStatus, setOrderStatus] = useState("DISPATCHED");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("FULLY_PAID");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (qpOrderId) setOrderId(qpOrderId);
  }, [qpOrderId]);

  async function updateOrder(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api(apiPaths.adminOrder(orderId), {
        method: "PUT",
        body: JSON.stringify({
          status: orderStatus,
          trackingNumber,
          paymentStatus,
        }),
      });
      setMsg("Order updated successfully.");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to="/admin/orders">Orders</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Update order</span>
      </nav>
      <PageHeader
        kicker="Operations · BRD §6.4–6.5"
        title="Update order"
        description="Courier, tracking, payment flags, and status. Use values that match your shop floor workflow."
      />
      {msg && <div className="flash flash--success" role="status">{msg}</div>}
      {err && <div className="flash flash--error" role="alert">{err}</div>}
      <form className="card" onSubmit={updateOrder}>
        <label>
          Order ID
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
        </label>
        <div className="field-grid field-grid--2">
          <label>
            Status
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
              <option>DESIGN_APPROVED</option>
              <option>IN_PRINT</option>
              <option>READY_FOR_COURIER</option>
              <option>DISPATCHED</option>
              <option>PARTIALLY_PAID</option>
              <option>PAYMENT_COMPLETED</option>
              <option>ORDER_COMPLETED</option>
              <option>AMOUNT_RETURNED</option>
              <option>ORDER_CANCELLED</option>
            </select>
          </label>
          <label>
            Payment status
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option>PENDING</option>
              <option>ADVANCE_RECEIVED</option>
              <option>FULLY_PAID</option>
            </select>
          </label>
        </div>
        <label>
          Tracking number
          <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="After dispatch" />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary">Apply update</button>
          <Link to="/admin/orders" className="secondary-link">All orders</Link>
          <Link to="/admin/orders/production" className="secondary-link">Production list</Link>
        </div>
      </form>
    </div>
  );
}
