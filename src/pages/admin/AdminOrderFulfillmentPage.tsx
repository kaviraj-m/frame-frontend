import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { AdminFulfillmentStepper } from "../../components/admin/AdminFulfillmentStepper";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { FilePickField } from "../../components/ui/FilePickField";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { api, apiUpload } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import {
  canCollectBalance,
  canDispatch,
  canMarkPrintDone,
  canSaveTracking,
  canWhatsAppDispatch,
  canWhatsAppPrint,
  hasSavedTracking,
} from "../../lib/adminFulfillment";
import { ExternalLinkIcon } from "../../components/ui/ExternalLinkIcon";
import { formatMoney } from "../../lib/formatDisplay";
import {
  validatePositiveNumber,
  validateRequired,
} from "../../lib/fieldValidation";
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
  const [paymentProofFiles, setPaymentProofFiles] = useState<File[]>([]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [waBusy, setWaBusy] = useState(false);
  const { confirmAction, dialogProps } = useConfirmDialog();

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

  function mergeOrderCustomer(prev: AdminOrderRow | null, next: AdminOrderRow): AdminOrderRow {
    return {
      ...next,
      customerUsername: next.customerUsername ?? prev?.customerUsername,
      customerPhoneNumber: next.customerPhoneNumber ?? prev?.customerPhoneNumber,
      customerEmail: next.customerEmail ?? prev?.customerEmail,
    };
  }

  async function runAction(action: () => Promise<AdminOrderRow>, successMsg: string) {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const o = await action();
      setOrder((prev) => mergeOrderCustomer(prev, o));
      setTrackingNumber(o.trackingNumber ?? "");
      setStatus(successMsg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onPrintDone() {
    confirmAction(
      {
        title: "Mark print done",
        message: "Mark print as done for this order?",
        confirmLabel: "Mark print done",
      },
      () =>
        runAction(
          () => api<AdminOrderRow>(apiPaths.adminOrderPrintDone(orderId), { method: "POST" }),
          "Print marked done.",
        ),
    );
  }

  function onApplyPayment(e: FormEvent) {
    e.preventDefault();
    const amountErr = validatePositiveNumber(paymentAmount, "Payment amount");
    if (amountErr) {
      setError(amountErr);
      return;
    }
    const proof = paymentProofFiles[0];
    if (!proof) {
      setError("Payment proof image is required.");
      return;
    }
    const amount = Number(paymentAmount);
    void runAction(async () => {
      const fd = new FormData();
      fd.append("file", proof);
      fd.append("amount", String(amount));
      return apiUpload<AdminOrderRow>(apiPaths.adminOrderBalancePayment(orderId), fd);
    }, "Balance payment recorded.").then(() => {
      setPaymentAmount("");
      setPaymentProofFiles([]);
    });
  }

  function onMarkFullyPaid(e: FormEvent) {
    e.preventDefault();
    const proof = paymentProofFiles[0];
    if (!proof) {
      setError("Payment proof image is required.");
      return;
    }
    confirmAction(
      {
        title: "Mark balance paid",
        message: "Mark the full remaining balance as paid?",
        confirmLabel: "Mark fully paid",
      },
      async () => {
        await runAction(async () => {
          const fd = new FormData();
          fd.append("file", proof);
          return apiUpload<AdminOrderRow>(apiPaths.adminOrderBalancePaid(orderId), fd);
        }, "Balance marked fully paid.");
        setPaymentProofFiles([]);
      },
    );
  }

  function onSaveTracking(e: FormEvent) {
    e.preventDefault();
    const trackingErr = validateRequired(trackingNumber, "Tracking number");
    if (trackingErr) {
      setError(trackingErr);
      return;
    }
    void runAction(
      () =>
        api<AdminOrderRow>(apiPaths.adminOrderSaveTracking(orderId), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingNumber: trackingNumber.trim() }),
        }),
      "Tracking number saved.",
    );
  }

  function onDispatch(e: FormEvent) {
    e.preventDefault();
    if (!hasSavedTracking(order ?? {})) {
      setError("Save the tracking number before marking dispatched.");
      return;
    }
    const tracking = order?.trackingNumber?.trim() ?? "";
    confirmAction(
      {
        title: "Dispatch order",
        message: `Mark dispatched and complete this order? Tracking: ${tracking}`,
        confirmLabel: "Dispatch & complete",
      },
      () =>
        runAction(
          () =>
            api<AdminOrderRow>(apiPaths.adminOrderDispatch(orderId), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }),
          "Order dispatched and completed.",
        ),
    );
  }

  async function openPrintWhatsApp() {
    setError("");
    setWaBusy(true);
    try {
      const link = await api<{ redirectUrl: string }>(apiPaths.adminOrderPrintWhatsApp(orderId));
      window.open(link.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWaBusy(false);
    }
  }

  async function openDispatchWhatsApp() {
    setError("");
    setWaBusy(true);
    try {
      const link = await api<{ redirectUrl: string }>(
        apiPaths.adminOrderWhatsApp(orderId, order?.trackingNumber?.trim() || undefined),
      );
      window.open(link.redirectUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWaBusy(false);
    }
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
        description="Print, balance collection, and dispatch (marks the order completed)."
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
              <div className="workflow-dispatch-actions" style={{ marginTop: 12 }}>
                {canWhatsAppPrint(order) ? (
                  <button
                    type="button"
                    className="btn btn--sm btn--whatsapp-action"
                    disabled={busy || waBusy || !order.customerPhoneNumber?.trim()}
                    title={
                      order.customerPhoneNumber?.trim()
                        ? "Open WhatsApp with the print draft"
                        : "Customer phone missing on the linked query"
                    }
                    onClick={() => void openPrintWhatsApp()}
                  >
                    <ExternalLinkIcon />
                    {waBusy ? "Opening…" : "WhatsApp"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={busy || !canMarkPrintDone(order)}
                  onClick={onPrintDone}
                >
                  Mark print done
                </button>
              </div>
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
              <FilePickField
                label="Payment proof (required)"
                files={paymentProofFiles}
                onFilesChange={setPaymentProofFiles}
                disabled={busy || !canCollectBalance(order)}
                chooseLabel="Choose image"
              />
              <form className="workflow-inline-form" onSubmit={onApplyPayment} style={{ marginTop: 12 }}>
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
                    disabled={
                      busy ||
                      !canCollectBalance(order) ||
                      !paymentProofFiles[0] ||
                      !paymentAmount.trim()
                    }
                  >
                    Apply payment
                  </button>
              </form>
              <form onSubmit={onMarkFullyPaid} style={{ marginTop: 12 }}>
                <button
                  type="submit"
                  className="btn btn--secondary"
                  disabled={busy || !canCollectBalance(order) || !paymentProofFiles[0]}
                >
                  Mark full balance paid
                </button>
              </form>
            </section>

            <section className="card workflow-card">
              <h2 className="workflow-card__title">3. Dispatch</h2>
              <form className="workflow-inline-form" onSubmit={onSaveTracking}>
                <label className="field">
                  <span className="field__label">Tracking number</span>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    disabled={busy || !canSaveTracking(order)}
                    placeholder="Courier tracking ID"
                    required
                  />
                </label>
                <div className="workflow-dispatch-actions">
                  <button
                    type="submit"
                    className="btn btn--secondary"
                    disabled={busy || !canSaveTracking(order) || !trackingNumber.trim()}
                  >
                    Save tracking
                  </button>
                  {canWhatsAppDispatch(order) ? (
                    <button
                      type="button"
                      className="btn btn--sm btn--whatsapp-action"
                      disabled={busy || waBusy || !order.customerPhoneNumber?.trim()}
                      title={
                        order.customerPhoneNumber?.trim()
                          ? "Open WhatsApp with the dispatch tracking message (new tab)."
                          : "Customer phone is missing on the linked query — add it on the enquiry first."
                      }
                      onClick={() => void openDispatchWhatsApp()}
                    >
                      {waBusy ? "Opening…" : "WhatsApp"}
                      <ExternalLinkIcon />
                    </button>
                  ) : null}
                </div>
              </form>
              <form className="workflow-inline-form" onSubmit={onDispatch} style={{ marginTop: 12 }}>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={busy || !canDispatch(order) || !hasSavedTracking(order)}
                >
                  Mark dispatched & complete
                </button>
              </form>
              {!canDispatch(order) && !canWhatsAppDispatch(order) && (
                <p className="muted small">Dispatch is available after the balance is fully paid.</p>
              )}
              {canDispatch(order) && !hasSavedTracking(order) && (
                <p className="muted small">
                  Enter a tracking ID and tap <strong>Save tracking</strong>. WhatsApp will be available
                  after the tracking number is saved.
                </p>
              )}
              {canWhatsAppDispatch(order) && !order.customerPhoneNumber?.trim() && (
                <p className="muted small flash flash--error" role="alert">
                  Tracking is saved, but this order has no customer phone on the linked query. WhatsApp cannot
                  open until a phone number is added on the enquiry.
                </p>
              )}
              {canWhatsAppDispatch(order) && order.customerPhoneNumber?.trim() && (
                <p className="muted small">
                  Message text is configured under{" "}
                  <Link to="/admin/whatsapp-draft">WhatsApp draft</Link> (dispatch section). Saved tracking{" "}
                  <strong>{order.trackingNumber}</strong> is included in the message.
                </p>
              )}
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
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
