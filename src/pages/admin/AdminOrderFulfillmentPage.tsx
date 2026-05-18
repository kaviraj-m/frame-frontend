import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminFulfillmentStepper } from "../../components/admin/AdminFulfillmentStepper";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import {
  canCollectBalance,
  canComplete,
  canDispatch,
  canMarkPrintDone,
} from "../../lib/adminFulfillment";
import { formatMoney } from "../../lib/formatDisplay";
import type { AdminOrderRow } from "./adminOrderTypes";

export function AdminOrderFulfillmentPage() {
  const { orderId: orderIdParam } = useParams();
  const orderId = orderIdParam ? decodeURIComponent(orderIdParam) : "";

  const [order, setOrder] = useState<AdminOrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const loadOrder = useCallback(async () => {
    if (!orderId.trim()) return;
    const o = await api<AdminOrderRow>(apiPaths.adminOrder(orderId));
    setOrder(o);
    setTrackingNumber(o.trackingNumber ?? "");
  }, [orderId]);

  const refresh = useCallback(async () => {
    setError("");
    setStatus("");
    setLoading(true);
    try {
      await loadOrder();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadOrder]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function runAction(action: () => Promise<AdminOrderRow>, successMsg: string) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const o = await action();
      setOrder(o);
      setTrackingNumber(o.trackingNumber ?? "");
      setStatus(successMsg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onPrintDone() {
    if (!window.confirm("Mark print as done for this order?")) return;
    void runAction(
      () => api<AdminOrderRow>(apiPaths.adminOrderPrintDone(orderId), { method: "POST" }),
      "Print marked done.",
    );
  }

  function onApplyPayment(e: FormEvent) {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    void runAction(
      () =>
        api<AdminOrderRow>(apiPaths.adminOrderBalancePayment(orderId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        }),
      "Balance payment recorded.",
    ).then(() => setPaymentAmount(""));
  }

  function onMarkFullyPaid() {
    if (!window.confirm("Mark the full remaining balance as paid?")) return;
    void runAction(
      () => api<AdminOrderRow>(apiPaths.adminOrderBalancePaid(orderId), { method: "POST" }),
      "Balance marked fully paid.",
    );
  }

  function onDispatch(e: FormEvent) {
    e.preventDefault();
    const tracking = trackingNumber.trim();
    if (!tracking) {
      setError("Tracking number is required.");
      return;
    }
    if (!window.confirm(`Mark dispatched with tracking ${tracking}?`)) return;
    void runAction(
      () =>
        api<AdminOrderRow>(apiPaths.adminOrderDispatch(orderId), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber: tracking }),
        }),
      "Order dispatched.",
    );
  }

  function onComplete() {
    if (!window.confirm("Mark this order as completed?")) return;
    void runAction(
      () => api<AdminOrderRow>(apiPaths.adminOrderComplete(orderId), { method: "POST" }),
      "Order completed.",
    );
  }

  if (!orderId.trim()) {
    return (
      <div className="page-stack">
        <p className="flash flash--error">Missing order id.</p>
        <Link to="/admin/orders/production">Back to production queue</Link>
      </div>
    );
  }

  return (
    <div className="page-stack admin-fulfillment-page">
      <PageHeader
        kicker="Admin · Fulfillment"
        title={orderId}
        description="Print, balance collection, dispatch, and completion."
        actions={
          <Link className="btn btn--secondary btn--sm" to="/admin/orders/production">
            Production queue
          </Link>
        }
      />

      {loading && <p className="muted">Loading order…</p>}
      {error && (
        <div className="flash flash--error" role="alert">
          {error}
        </div>
      )}
      {status && (
        <div className="flash flash--success" role="status">
          {status}
        </div>
      )}

      {order && !loading && (
        <>
          <div className="workflow-order-meta">
            <OrderStatusBadge status={order.status} />
            <span className="muted small">
              Query <span className="td-mono">{order.queryId}</span>
              {order.customerUsername ? ` · ${order.customerUsername}` : ""}
            </span>
          </div>

          <AdminFulfillmentStepper order={order} />

          <div className="workflow-cards">
            <section className="card workflow-card">
              <h2 className="workflow-card__title">1. Print</h2>
              <p className="muted small">
                Print stage: <strong>{order.printStage?.trim() ? order.printStage : "—"}</strong>
              </p>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy || !canMarkPrintDone(order)}
                onClick={onPrintDone}
              >
                Mark print done
              </button>
            </section>

            <section className="card workflow-card">
              <h2 className="workflow-card__title">2. Balance</h2>
              <dl className="workflow-payment-summary">
                <div>
                  <dt>Advance</dt>
                  <dd>{formatMoney(order.advancePayment)}</dd>
                </div>
                <div>
                  <dt>Full price</dt>
                  <dd>{formatMoney(order.fullPayment)}</dd>
                </div>
                <div>
                  <dt>Balance remaining</dt>
                  <dd>{formatMoney(order.balanceAmount)}</dd>
                </div>
              </dl>
              <form className="workflow-inline-form" onSubmit={onApplyPayment}>
                <label className="field">
                  <span className="field__label">Amount collected</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    disabled={busy || !canCollectBalance(order)}
                  />
                </label>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={busy || !canCollectBalance(order)}
                >
                  Apply payment
                </button>
              </form>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy || !canCollectBalance(order)}
                onClick={onMarkFullyPaid}
              >
                Mark full balance paid
              </button>
            </section>

            <section className="card workflow-card">
              <h2 className="workflow-card__title">3. Dispatch</h2>
              <form className="workflow-inline-form" onSubmit={onDispatch}>
                <label className="field">
                  <span className="field__label">Tracking number</span>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    disabled={busy || !canDispatch(order)}
                    placeholder="Courier tracking ID"
                  />
                </label>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={busy || !canDispatch(order)}
                >
                  Mark dispatched
                </button>
              </form>
              {!canDispatch(order) && (
                <p className="muted small">Dispatch is available after the balance is fully paid.</p>
              )}
            </section>

            <section className="card workflow-card">
              <h2 className="workflow-card__title">4. Complete</h2>
              <p className="muted small">
                Tracking:{" "}
                <strong>{order.trackingNumber?.trim() ? order.trackingNumber : "—"}</strong>
              </p>
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy || !canComplete(order)}
                onClick={onComplete}
              >
                Mark order completed
              </button>
            </section>
          </div>

          {order.addressDetails?.trim() && (
            <section className="card">
              <h2 className="workflow-card__title">Delivery address</h2>
              <p>{order.addressDetails}</p>
            </section>
          )}

          <p className="muted small">
            <Link to={`/admin/orders/patch?orderId=${encodeURIComponent(orderId)}`}>
              Advanced override (patch)
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
