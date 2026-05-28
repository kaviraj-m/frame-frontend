/** Shared order shape for list tables (matches backend Order JSON subset). */
export type OrderListRow = {
  orderId: string;
  queryId: string;
  customerUsername?: string;
  customerPhoneNumber?: string;
  customerEmail?: string;
  addressDetails?: string;
  designRemarks?: string;
  designStage?: string;
  status: string;
  frameSize?: string;
  lines?: { lineItemId: string; frameSize: string; quantity: number; sortOrder: number }[];
  paymentMode?: string;
  advancePayment?: number;
  balanceAmount?: number;
  fullPayment?: number;
  paymentStatus?: string;
  printStage?: string;
  printedFrameImage?: string;
  courierStage?: string;
  trackingNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  createdByExecutiveId?: string;
};

/** Merge API order updates without dropping line items or customer fields omitted from the response. */
export function mergeOrderFromApi(prev: OrderListRow | null, next: OrderListRow): OrderListRow {
  return {
    ...next,
    lines: (next.lines?.length ? next.lines : prev?.lines) ?? next.lines,
    customerUsername: next.customerUsername ?? prev?.customerUsername,
    customerPhoneNumber: next.customerPhoneNumber ?? prev?.customerPhoneNumber,
    customerEmail: next.customerEmail ?? prev?.customerEmail,
  };
}

/** Frame size(s) for list tables and Excel — uses line items when present. */
export function formatOrderFrameLabel(order: Pick<OrderListRow, "frameSize" | "lines">): string {
  const lines = order.lines ?? [];
  if (lines.length > 0) {
    return [...lines]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((l) => (l.quantity > 1 ? `${l.frameSize} ×${l.quantity}` : l.frameSize))
      .join(", ");
  }
  const single = order.frameSize?.trim();
  return single || "—";
}
