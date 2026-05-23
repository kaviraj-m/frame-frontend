import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FormField } from "@/components/ui/FormField";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { validateRequired } from "@/lib/fieldValidation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function AdminOrderPatchPage() {
  const [searchParams] = useSearchParams();
  const qpOrderId = searchParams.get("orderId")?.trim() ?? "";

  const [orderId, setOrderId] = useState(qpOrderId);
  const [orderStatus, setOrderStatus] = useState("DISPATCHED");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("FULLY_PAID");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (qpOrderId) setOrderId(qpOrderId);
  }, [qpOrderId]);

  async function updateOrder(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const orderIdErr = validateRequired(orderId, "Order ID");
    if (orderIdErr) {
      setFieldErrors({ orderId: orderIdErr });
      setErr(orderIdErr);
      return;
    }
    setFieldErrors({});
    try {
      await api(apiPaths.adminOrder(orderId.trim()), {
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
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <nav className="breadcrumb text-sm">
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
      {msg && (
        <Alert variant="success" role="status">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}
      {err && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}
      <Card>
        <form className="space-y-4" onSubmit={updateOrder} noValidate>
          <FormField label="Order ID" required error={fieldErrors.orderId}>
            <Input
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                if (fieldErrors.orderId) setFieldErrors({});
              }}
              aria-invalid={!!fieldErrors.orderId}
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Status">
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className={selectClass}
              >
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
            </FormField>
            <FormField label="Payment status">
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className={selectClass}
              >
                <option>PENDING</option>
                <option>ADVANCE_RECEIVED</option>
                <option>FULLY_PAID</option>
              </select>
            </FormField>
          </div>
          <FormField label="Tracking number">
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="After dispatch"
            />
          </FormField>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit">Apply update</Button>
            <Link to="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
              All orders
            </Link>
            <Link to="/admin/orders/production" className="text-sm text-muted-foreground hover:text-foreground">
              Production list
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
