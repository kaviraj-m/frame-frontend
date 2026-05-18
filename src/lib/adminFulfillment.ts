import type { OrderListRow } from "./orderListTypes";

export type FulfillmentQueueFilter = "all" | "print_due" | "awaiting_payment" | "ready_to_ship" | "done";

export type FulfillmentStepId = "print" | "balance" | "dispatch" | "complete";

export type StepState = "done" | "active" | "locked";

const QUEUE_PRIORITY: Record<string, number> = {
  DESIGN_APPROVED: 0,
  IN_PRINT: 1,
  PARTIALLY_PAID: 2,
  PAYMENT_COMPLETED: 3,
  READY_FOR_COURIER: 4,
  DISPATCHED: 5,
  ORDER_COMPLETED: 6,
};

export function isPrintDone(order: Pick<OrderListRow, "printStage">): boolean {
  return (order.printStage ?? "").toUpperCase() === "DONE";
}

export function isFullyPaid(order: Pick<OrderListRow, "paymentStatus" | "balanceAmount">): boolean {
  return (
    (order.paymentStatus ?? "").toUpperCase() === "FULLY_PAID" ||
    (order.balanceAmount ?? 0) <= 0
  );
}

export function fulfillmentQueueAction(order: Pick<OrderListRow, "status" | "printStage" | "balanceAmount" | "paymentStatus">): string {
  const status = (order.status ?? "").toUpperCase();
  if (status === "ORDER_COMPLETED" || status === "AMOUNT_RETURNED") return "View";
  if (status === "DISPATCHED") return "Mark completed";
  if (isFullyPaid(order)) return "Dispatch";
  if (isPrintDone(order) && (order.balanceAmount ?? 0) > 0) return "Collect balance";
  if (status === "DESIGN_APPROVED" || status === "IN_PRINT") return "Mark print done";
  if (status === "PAYMENT_COMPLETED") return "Dispatch";
  return "Fulfill";
}

export function sortFulfillmentOrders(orders: OrderListRow[]): OrderListRow[] {
  return [...orders].sort((a, b) => {
    const pa = QUEUE_PRIORITY[a.status.toUpperCase()] ?? 99;
    const pb = QUEUE_PRIORITY[b.status.toUpperCase()] ?? 99;
    if (pa !== pb) return pa - pb;
    return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
  });
}

export function matchesFulfillmentFilter(order: OrderListRow, filter: FulfillmentQueueFilter): boolean {
  if (filter === "all") return true;
  const status = (order.status ?? "").toUpperCase();
  switch (filter) {
    case "print_due":
      return status === "DESIGN_APPROVED" || (status === "IN_PRINT" && !isPrintDone(order));
    case "awaiting_payment":
      return isPrintDone(order) && !isFullyPaid(order) && status !== "ORDER_COMPLETED";
    case "ready_to_ship":
      return isFullyPaid(order) && status !== "DISPATCHED" && status !== "ORDER_COMPLETED" && status !== "AMOUNT_RETURNED";
    case "done":
      return status === "ORDER_COMPLETED" || status === "AMOUNT_RETURNED";
    default:
      return true;
  }
}

export function fulfillmentStepStates(order: OrderListRow): Record<FulfillmentStepId, StepState> {
  const status = (order.status ?? "").toUpperCase();
  const printDone = isPrintDone(order);
  const paid = isFullyPaid(order);
  const dispatched = status === "DISPATCHED" || status === "ORDER_COMPLETED";
  const completed = status === "ORDER_COMPLETED";

  return {
    print:
      status === "DESIGN_APPROVED" || (status === "IN_PRINT" && !printDone)
        ? "active"
        : printDone
          ? "done"
          : "locked",
    balance: !printDone ? "locked" : !paid ? "active" : "done",
    dispatch: !paid ? "locked" : !dispatched ? "active" : "done",
    complete: !dispatched ? "locked" : !completed ? "active" : "done",
  };
}

export function canMarkPrintDone(order: OrderListRow): boolean {
  const s = (order.status ?? "").toUpperCase();
  return (s === "DESIGN_APPROVED" || s === "IN_PRINT") && !isPrintDone(order);
}

export function canCollectBalance(order: OrderListRow): boolean {
  return isPrintDone(order) && !isFullyPaid(order) && (order.balanceAmount ?? 0) > 0;
}

export function canDispatch(order: OrderListRow): boolean {
  return isFullyPaid(order) && (order.status ?? "").toUpperCase() !== "DISPATCHED" && (order.status ?? "").toUpperCase() !== "ORDER_COMPLETED";
}

export function canComplete(order: OrderListRow): boolean {
  return (order.status ?? "").toUpperCase() === "DISPATCHED" && Boolean(order.trackingNumber?.trim());
}
