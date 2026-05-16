/**
 * BRD §6.4–6.5: after customer design approval — print, courier, dispatch, payment, completion.
 * Aligns with backend OrderStatus in internal/core/model_order.go
 */
export const POST_DESIGN_APPROVAL_STATUSES = new Set<string>([
  "DESIGN_APPROVED",
  "IN_PRINT",
  "READY_FOR_COURIER",
  "DISPATCHED",
  "PARTIALLY_PAID",
  "PAYMENT_COMPLETED",
  "ORDER_COMPLETED",
  "AMOUNT_RETURNED",
]);

export function isPostDesignApprovalStatus(status: string): boolean {
  return POST_DESIGN_APPROVAL_STATUSES.has(status);
}
