import type { OrderAssetRow } from "./orderAssetLabels";
import type { OrderListRow } from "./orderListTypes";

export type FulfillmentQueueFilter =
  | "all"
  | "print_due"
  | "frame_due"
  | "awaiting_payment"
  | "ready_to_ship"
  | "done";

export type FulfillmentStepId = "print" | "frameReady" | "balance" | "dispatch";

export type StepState = "done" | "active" | "locked";

const QUEUE_PRIORITY: Record<string, number> = {
  DESIGN_APPROVED: 0,
  IN_PRINT: 1,
  FRAME_READY: 2,
  PARTIALLY_PAID: 3,
  PAYMENT_COMPLETED: 4,
  READY_FOR_COURIER: 5,
  DISPATCHED: 6,
  ORDER_COMPLETED: 7,
};

export function isPrintDone(order: Pick<OrderListRow, "status">): boolean {
  const s = (order.status ?? "").toUpperCase();
  return s === "IN_PRINT" || s === "FRAME_READY" || s === "PAYMENT_COMPLETED" || s === "DISPATCHED" || s === "ORDER_COMPLETED";
}

export function isFrameReady(order: Pick<OrderListRow, "status">): boolean {
  return (order.status ?? "").toUpperCase() === "FRAME_READY";
}

export function hasPrintImage(
  order: Pick<OrderListRow, "printedFrameImage">,
  assets?: OrderAssetRow[],
  lines?: OrderListRow["lines"],
): boolean {
  if ((lines?.length ?? 0) > 0) {
    if (!assets?.length) {
      return Boolean((order.printedFrameImage ?? "").trim());
    }
    return lines!.every((line) =>
      assets.some(
        (a) => a.assetType === "PRINT_PROOF" && a.lineItemId === line.lineItemId,
      ),
    );
  }
  return (
    Boolean((order.printedFrameImage ?? "").trim()) ||
    Boolean(assets?.some((a) => a.assetType === "PRINT_PROOF"))
  );
}

export function isFullyPaid(order: Pick<OrderListRow, "paymentStatus" | "balanceAmount">): boolean {
  return (
    (order.paymentStatus ?? "").toUpperCase() === "FULLY_PAID" ||
    (order.balanceAmount ?? 0) <= 0
  );
}

export function fulfillmentQueueAction(
  order: Pick<OrderListRow, "status" | "balanceAmount" | "paymentStatus">,
): string {
  const status = (order.status ?? "").toUpperCase();
  if (status === "ORDER_COMPLETED" || status === "AMOUNT_RETURNED") return "View";
  if (status === "DISPATCHED") return "View";
  if (isFullyPaid(order)) return "Dispatch";
  if (status === "FRAME_READY" && (order.balanceAmount ?? 0) > 0) return "Collect balance";
  if (status === "IN_PRINT") return "Mark frame ready";
  if (status === "DESIGN_APPROVED") return "Mark print done";
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
      return status === "DESIGN_APPROVED";
    case "frame_due":
      return status === "IN_PRINT";
    case "awaiting_payment":
      return status === "FRAME_READY" && !isFullyPaid(order);
    case "ready_to_ship":
      return (
        isFullyPaid(order) &&
        status !== "DISPATCHED" &&
        status !== "ORDER_COMPLETED" &&
        status !== "AMOUNT_RETURNED"
      );
    case "done":
      return status === "ORDER_COMPLETED" || status === "AMOUNT_RETURNED";
    default:
      return true;
  }
}

export function fulfillmentStepStates(order: OrderListRow): Record<FulfillmentStepId, StepState> {
  const status = (order.status ?? "").toUpperCase();
  const printDone = isPrintDone(order);
  const frameReady = isFrameReady(order) || status === "PAYMENT_COMPLETED" || status === "DISPATCHED" || status === "ORDER_COMPLETED";
  const paid = isFullyPaid(order);
  const shipped = status === "DISPATCHED" || status === "ORDER_COMPLETED";

  return {
    print: status === "DESIGN_APPROVED" ? "active" : printDone ? "done" : "locked",
    frameReady:
      status === "IN_PRINT" ? "active" : frameReady ? "done" : printDone ? "locked" : "locked",
    balance: !frameReady ? "locked" : !paid ? "active" : "done",
    dispatch: !paid ? "locked" : !shipped ? "active" : "done",
  };
}

export function canMarkPrintDone(order: OrderListRow): boolean {
  return (order.status ?? "").toUpperCase() === "DESIGN_APPROVED";
}

export function canUploadPrintImage(order: OrderListRow): boolean {
  return (order.status ?? "").toUpperCase() === "IN_PRINT";
}

export function canMarkFrameReady(
  order: OrderListRow,
  assets?: OrderAssetRow[],
): boolean {
  return (
    (order.status ?? "").toUpperCase() === "IN_PRINT" &&
    hasPrintImage(order, assets, order.lines)
  );
}

export function canCollectBalance(order: OrderListRow): boolean {
  return isFrameReady(order) && !isFullyPaid(order) && (order.balanceAmount ?? 0) > 0;
}

export function canDispatch(order: OrderListRow): boolean {
  return (
    isFullyPaid(order) &&
    (order.status ?? "").toUpperCase() !== "DISPATCHED" &&
    (order.status ?? "").toUpperCase() !== "ORDER_COMPLETED"
  );
}

/** Print-step WhatsApp — during print/frame phase before dispatch/completion. */
export function canWhatsAppPrint(order: OrderListRow): boolean {
  const status = (order.status ?? "").toUpperCase();
  if (status === "AMOUNT_RETURNED" || status === "DISPATCHED" || status === "ORDER_COMPLETED") {
    return false;
  }
  if (status === "DESIGN_APPROVED" || status === "IN_PRINT" || status === "FRAME_READY") {
    return true;
  }
  return false;
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
