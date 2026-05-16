/** UI buckets for order lifecycle — maps backend `OrderStatus` strings (see core model_order). */
export type FrameworksUiStatus = "New" | "In Progress" | "Ready" | "Delivered" | "Cancelled";

export function mapOrderStatus(status: string): FrameworksUiStatus {
  const s = status.toUpperCase();
  if (s === "ORDER_CONFIRMED" || s === "DRAFT_CREATED") return "New";
  if (s === "READY_FOR_COURIER") return "Ready";
  if (s === "ORDER_CANCELLED" || s === "AMOUNT_RETURNED") return "Cancelled";
  if (s === "DISPATCHED" || s === "PAYMENT_COMPLETED" || s === "ORDER_COMPLETED") return "Delivered";
  return "In Progress";
}
