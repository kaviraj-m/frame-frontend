import { orderCreatedCalendarDayKey, orderRowAgeTier } from "./orderCreatedAge";
import { mapOrderStatus } from "./orderStatusUi";
import type { OrderListRow } from "./orderListTypes";

export type ExecutiveStatusFilter =
  | "all"
  | "open"
  | "new"
  | "in_progress"
  | "ready"
  | "delivered"
  | "cancelled";

export type ExecutiveAgeFilter = "all" | "today" | "day2" | "day3" | "old";

/** Created dropdown: age presets or custom IST date range. */
export type CreatedFilterPreset = ExecutiveAgeFilter | "custom";

export type CreatedDateRange = { from: string; to: string };

export function createdPresetToFilters(preset: CreatedFilterPreset, range: CreatedDateRange): {
  ageFilter: ExecutiveAgeFilter;
  dateRange: CreatedDateRange;
} {
  if (preset === "custom") {
    return { ageFilter: "all", dateRange: range };
  }
  return { ageFilter: preset, dateRange: { from: "", to: "" } };
}

const TERMINAL_STATUSES = new Set([
  "ORDER_COMPLETED",
  "AMOUNT_RETURNED",
  "ORDER_CANCELLED",
]);

export function sortOrdersNewestFirst(orders: OrderListRow[]): OrderListRow[] {
  return [...orders].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return b.orderId.localeCompare(a.orderId);
  });
}

export function matchesExecutiveStatusFilter(
  status: string,
  filter: ExecutiveStatusFilter,
): boolean {
  if (filter === "all") return true;
  const s = (status ?? "").trim().toUpperCase();
  if (filter === "open") return !TERMINAL_STATUSES.has(s);
  const ui = mapOrderStatus(status);
  switch (filter) {
    case "new":
      return ui === "New";
    case "in_progress":
      return ui === "In Progress";
    case "ready":
      return ui === "Ready";
    case "delivered":
      return ui === "Delivered";
    case "cancelled":
      return ui === "Cancelled";
    default:
      return true;
  }
}

export function matchesExecutiveAgeFilter(
  createdAt: string | undefined,
  status: string | undefined,
  filter: ExecutiveAgeFilter,
): boolean {
  if (filter === "all") return true;
  const tier = orderRowAgeTier(createdAt, status);
  return tier === filter;
}

export function isValidDateRange(range: CreatedDateRange): boolean {
  const from = range.from.trim();
  const to = range.to.trim();
  if (from && to && from > to) return false;
  return true;
}

export function matchesCreatedDateRange(
  createdAt: string | undefined,
  range: CreatedDateRange,
): boolean {
  const from = range.from.trim();
  const to = range.to.trim();
  if (!from && !to) return true;
  const day = orderCreatedCalendarDayKey(createdAt);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function distinctFrameSizes(orders: OrderListRow[]): string[] {
  const set = new Set<string>();
  for (const o of orders) {
    const s = o.frameSize?.trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function matchesFrameSizeFilter(
  frameSize: string | undefined,
  filter: string,
): boolean {
  if (filter === "all") return true;
  return (frameSize ?? "").trim() === filter;
}

export function distinctPaymentModes(orders: OrderListRow[]): string[] {
  const set = new Set<string>();
  for (const o of orders) {
    const m = o.paymentMode?.trim();
    if (m) set.add(m);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function matchesPaymentModeFilter(
  paymentMode: string | undefined,
  filter: string,
): boolean {
  if (filter === "all") return true;
  return (paymentMode ?? "").trim() === filter;
}

export function orderMatchesSearch(o: OrderListRow, query: string): boolean {
  if (!query.trim()) return true;
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
    (o.frameSize ?? "").toLowerCase().includes(q) ||
    (o.paymentMode ?? "").toLowerCase().includes(q)
  );
}

export function countByStatusFilter(
  orders: OrderListRow[],
): Record<ExecutiveStatusFilter, number> {
  const counts: Record<ExecutiveStatusFilter, number> = {
    all: orders.length,
    open: 0,
    new: 0,
    in_progress: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of orders) {
    if (matchesExecutiveStatusFilter(o.status, "open")) counts.open++;
    if (matchesExecutiveStatusFilter(o.status, "new")) counts.new++;
    if (matchesExecutiveStatusFilter(o.status, "in_progress")) counts.in_progress++;
    if (matchesExecutiveStatusFilter(o.status, "ready")) counts.ready++;
    if (matchesExecutiveStatusFilter(o.status, "delivered")) counts.delivered++;
    if (matchesExecutiveStatusFilter(o.status, "cancelled")) counts.cancelled++;
  }
  return counts;
}

export function filterExecutiveOrders(
  orders: OrderListRow[],
  opts: {
    statusFilter: ExecutiveStatusFilter;
    ageFilter: ExecutiveAgeFilter;
    dateRange: CreatedDateRange;
    frameFilter: string;
    payModeFilter: string;
    search: string;
  },
): OrderListRow[] {
  const dateOk = isValidDateRange(opts.dateRange);
  return orders.filter((o) => {
    if (!matchesExecutiveStatusFilter(o.status, opts.statusFilter)) return false;
    if (!matchesExecutiveAgeFilter(o.createdAt, o.status, opts.ageFilter)) return false;
    if (dateOk && !matchesCreatedDateRange(o.createdAt, opts.dateRange)) return false;
    if (!matchesFrameSizeFilter(o.frameSize, opts.frameFilter)) return false;
    if (!matchesPaymentModeFilter(o.paymentMode, opts.payModeFilter)) return false;
    if (!orderMatchesSearch(o, opts.search)) return false;
    return true;
  });
}

export function hasActiveExecutiveFilters(opts: {
  statusFilter: ExecutiveStatusFilter;
  createdPreset: CreatedFilterPreset;
  dateRange: CreatedDateRange;
  frameFilter: string;
  payModeFilter: string;
  search: string;
}): boolean {
  return (
    opts.statusFilter !== "all" ||
    opts.createdPreset !== "all" ||
    opts.frameFilter !== "all" ||
    opts.payModeFilter !== "all" ||
    !!opts.search.trim()
  );
}
