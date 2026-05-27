import { Link } from "react-router-dom";
import { OrderIdCell } from "@/components/orders/OrderIdCell";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { fulfillmentQueueAction } from "@/lib/adminFulfillment";
import { OrderRowAgeLegend } from "@/components/orders/OrderRowAgeLegend";
import { orderRowAgeDataAttr, orderRowClassName } from "@/lib/orderCreatedAge";
import { formatMoney, formatShortDateTime } from "@/lib/formatDisplay";
import { formatOrderFrameLabel } from "@/lib/orderListTypes";
import type { AdminOrderRow } from "./adminOrderTypes";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderBand,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
  orders: AdminOrderRow[];
  emptyMessage: string;
  patchBasePath?: string;
  showFulfillment?: boolean;
  fulfillPath?: (orderId: string) => string;
};

export function AdminOrdersTable({
  orders,
  emptyMessage,
  patchBasePath = "/admin/orders/patch",
  showFulfillment = false,
  fulfillPath = (orderId) => `/admin/orders/${encodeURIComponent(orderId)}`,
}: Props) {
  const colSpan = showFulfillment ? 15 : 13;

  return (
    <>
      <div className="mb-3 px-0.5">
        <OrderRowAgeLegend />
      </div>
      <div className="overflow-auto w-full">
        <Table>
          <TableHeaderBand>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Frame</TableHead>
              <TableHead>Status</TableHead>
              {showFulfillment && <TableHead>Print</TableHead>}
              <TableHead>Payment</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Tracking</TableHead>
              {showFulfillment && <TableHead>Next action</TableHead>}
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeaderBand>
          <TableBody>
            {orders.map((o) => (
              <TableRow
                key={o.orderId}
                className={cn(orderRowClassName(o.createdAt, o.status))}
                data-order-age={orderRowAgeDataAttr(o.createdAt, o.status)}
              >
                <TableCell className="font-mono text-xs">
                  <OrderIdCell orderId={o.orderId} />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{o.queryId}</TableCell>
                <TableCell className="font-semibold">{o.customerUsername?.trim() ? o.customerUsername : "—"}</TableCell>
                <TableCell>{o.customerPhoneNumber?.trim() ? o.customerPhoneNumber : "—"}</TableCell>
                <TableCell className="max-w-[180px] truncate" title={o.customerEmail || undefined}>
                  {o.customerEmail?.trim() ? o.customerEmail : "—"}
                </TableCell>
                <TableCell className="max-w-[160px] truncate" title={formatOrderFrameLabel(o)}>
                  {formatOrderFrameLabel(o)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                {showFulfillment && (
                  <TableCell>
                    <span className="text-xs">{o.printStage?.trim() ? o.printStage : "—"}</span>
                  </TableCell>
                )}
                <TableCell>
                  <span className="text-xs">{o.paymentStatus ?? "—"}</span>
                  {o.paymentMode ? (
                    <span className="text-muted-foreground text-xs"> · {o.paymentMode}</span>
                  ) : null}
                </TableCell>
                <TableCell>{formatMoney(o.balanceAmount)}</TableCell>
                <TableCell className="font-mono text-xs">{o.trackingNumber?.trim() ? o.trackingNumber : "—"}</TableCell>
                {showFulfillment && (
                  <TableCell className="text-xs">{fulfillmentQueueAction(o)}</TableCell>
                )}
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(o.createdAt)}</TableCell>
                <TableCell className="whitespace-nowrap text-xs">{formatShortDateTime(o.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  {showFulfillment ? (
                    <Button asChild size="sm">
                      <Link className="btn" to={fulfillPath(o.orderId)}>
                        Fulfill
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" size="sm">
                      <Link className="btn" to={`${patchBasePath}?orderId=${encodeURIComponent(o.orderId)}`}>
                        Update
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground mt-3">
          Showing <strong>{orders.length}</strong> order{orders.length === 1 ? "" : "s"}
        </p>
      </div>
    </>
  );
}
