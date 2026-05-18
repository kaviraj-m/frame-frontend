import { mapOrderStatus } from "./orderStatusUi";
import type { OrderListRow } from "./orderListTypes";

export type DesignerQueueFilter = "all" | "new" | "in_design" | "awaiting" | "revision";

export type WorkflowStepId = "take" | "sources" | "preview" | "signoff";

export type StepState = "done" | "active" | "locked";

const QUEUE_PRIORITY: Record<string, number> = {
  DESIGN_REVISION_REQUIRED: 0,
  ORDER_CONFIRMED: 1,
  IN_DESIGN: 2,
  DESIGN_SHARED_WITH_CUSTOMER: 3,
};

export function designerQueueAction(status: string): string {
  switch (status.toUpperCase()) {
    case "ORDER_CONFIRMED":
      return "Take order";
    case "DESIGN_REVISION_REQUIRED":
      return "Re-upload preview";
    case "IN_DESIGN":
      return "Upload preview";
    case "DESIGN_SHARED_WITH_CUSTOMER":
      return "Record response";
    default:
      return "Open";
  }
}

export function sortQueueOrders(orders: OrderListRow[]): OrderListRow[] {
  return [...orders].sort((a, b) => {
    const pa = QUEUE_PRIORITY[a.status.toUpperCase()] ?? 99;
    const pb = QUEUE_PRIORITY[b.status.toUpperCase()] ?? 99;
    if (pa !== pb) return pa - pb;
    return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
  });
}

export function matchesDesignerFilter(status: string, filter: DesignerQueueFilter): boolean {
  if (filter === "all") return true;
  const s = status.toUpperCase();
  switch (filter) {
    case "new":
      return s === "ORDER_CONFIRMED";
    case "in_design":
      return s === "IN_DESIGN";
    case "awaiting":
      return s === "DESIGN_SHARED_WITH_CUSTOMER";
    case "revision":
      return s === "DESIGN_REVISION_REQUIRED";
    default:
      return true;
  }
}

export function orderMatchesSearch(o: OrderListRow, query: string): boolean {
  const q = query.toLowerCase();
  const uiLabel = mapOrderStatus(o.status ?? "").toLowerCase();
  return (
    o.orderId.toLowerCase().includes(q) ||
    o.queryId.toLowerCase().includes(q) ||
    (o.customerUsername ?? "").toLowerCase().includes(q) ||
    (o.customerPhoneNumber ?? "").includes(q) ||
    (o.customerEmail ?? "").toLowerCase().includes(q) ||
    (o.status ?? "").toLowerCase().includes(q) ||
    uiLabel.includes(q) ||
    designerQueueAction(o.status).toLowerCase().includes(q)
  );
}

export function canTakeOrder(status: string): boolean {
  const s = status.toUpperCase();
  return s === "ORDER_CONFIRMED" || s === "DESIGN_REVISION_REQUIRED";
}

export function canUploadPreview(status: string): boolean {
  const s = status.toUpperCase();
  return s === "IN_DESIGN" || s === "DESIGN_REVISION_REQUIRED";
}

export function canRecordCustomerResponse(status: string): boolean {
  return status.toUpperCase() === "DESIGN_SHARED_WITH_CUSTOMER";
}

export function isOrderGoneError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("forbidden") || m.includes("not found");
}

export function designerStepStates(status: string): Record<WorkflowStepId, StepState> {
  const s = status.toUpperCase();
  const takeActive = s === "ORDER_CONFIRMED" || s === "DESIGN_REVISION_REQUIRED";
  const takeDone = !takeActive && s !== "";
  const previewActive = s === "IN_DESIGN" || s === "DESIGN_REVISION_REQUIRED";
  const previewDone = s === "DESIGN_SHARED_WITH_CUSTOMER" || s === "DESIGN_APPROVED";
  const signoffActive = s === "DESIGN_SHARED_WITH_CUSTOMER";

  return {
    take: takeActive ? "active" : takeDone ? "done" : "locked",
    sources: takeActive ? "locked" : "active",
    preview: previewActive ? "active" : previewDone ? "done" : "locked",
    signoff: signoffActive ? "active" : "locked",
  };
}
