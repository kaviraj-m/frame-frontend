import type { OrderListRow } from "./orderListTypes";

export type FulfillmentQueueFilter = "all" | "print_due" | "awaiting_payment" | "ready_to_ship" | "done";

export type FulfillmentStepId = "print" | "balance" | "dispatch";

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

export function hasPrintImage(order: Pick<OrderListRow, "printedFrameImage">): boolean {
  return Boolean((order.printedFrameImage ?? "").trim());
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
  if (status === "DISPATCHED") return "View";
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
  const shipped = status === "DISPATCHED" || status === "ORDER_COMPLETED";

  return {
    print:
      status === "DESIGN_APPROVED" || (status === "IN_PRINT" && !printDone)
        ? "active"
        : printDone
          ? "done"
          : "locked",
    balance: !printDone ? "locked" : !paid ? "active" : "done",
    dispatch: !paid ? "locked" : !shipped ? "active" : "done",
  };
}

export function canUploadPrintImage(order: OrderListRow): boolean {
  const s = (order.status ?? "").toUpperCase();
  return (s === "DESIGN_APPROVED" || s === "IN_PRINT") && !isPrintDone(order);
}

export function canMarkPrintDone(order: OrderListRow): boolean {
  return canUploadPrintImage(order) && hasPrintImage(order);
}

export function canCollectBalance(order: OrderListRow): boolean {
  return isPrintDone(order) && !isFullyPaid(order) && (order.balanceAmount ?? 0) > 0;
}

export function canDispatch(order: OrderListRow): boolean {
  return isFullyPaid(order) && (order.status ?? "").toUpperCase() !== "DISPATCHED" && (order.status ?? "").toUpperCase() !== "ORDER_COMPLETED";
}

/** Print-step WhatsApp — during print phase before dispatch/completion. */
export function canWhatsAppPrint(order: OrderListRow): boolean {
  const status = (order.status ?? "").toUpperCase();
  if (status === "AMOUNT_RETURNED" || status === "DISPATCHED" || status === "ORDER_COMPLETED") {
    return false;
  }
  if (status === "DESIGN_APPROVED" || status === "IN_PRINT") {
    return true;
  }
  return isPrintDone(order);
}

export function hasSavedTracking(order: Pick<OrderListRow, "trackingNumber">): boolean {
  return Boolean((order.trackingNumber ?? "").trim());
}

/** Save tracking — fully paid, not yet dispatched/completed. */
export function canSaveTracking(order: OrderListRow): boolean {
  return canDispatch(order);
}

/** Dispatch WhatsApp — after tracking is saved, before dispatch/completion. */
export function canWhatsAppDispatch(order: OrderListRow): boolean {
  const status = (order.status ?? "").toUpperCase();
  if (status === "AMOUNT_RETURNED" || status === "DISPATCHED" || status === "ORDER_COMPLETED") {
    return false;
  }
  return hasSavedTracking(order);
}
