import type { OrderListRow } from "./orderListTypes";

/** All backend order statuses in lifecycle order (see frame-backend internal/core/model_order.go). */
export const ALL_ORDER_STATUSES = [
  "DRAFT_CREATED",
  "ORDER_CONFIRMED",
  "IN_DESIGN",
  "DESIGN_SHARED_WITH_CUSTOMER",
  "DESIGN_REVISION_REQUIRED",
  "DESIGN_APPROVED",
  "IN_PRINT",
  "FRAME_READY",
  "READY_FOR_COURIER",
  "DISPATCHED",
  "PARTIALLY_PAID",
  "PAYMENT_COMPLETED",
  "ORDER_COMPLETED",
  "AMOUNT_RETURNED",
  "ORDER_CANCELLED",
] as const;

export type OrderStatusFilterValue = "all" | (typeof ALL_ORDER_STATUSES)[number];

export function formatOrderStatusLabel(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function matchesOrderStatusFilter(status: string | undefined, filter: string): boolean {
  if (filter === "all") return true;
  return (status ?? "").trim().toUpperCase() === filter.trim().toUpperCase();
}

/** Multi-select status filter — empty selection means no filter (show all). */
export function matchesOrderStatusesFilter(
  status: string | undefined,
  selected: readonly string[],
): boolean {
  if (selected.length === 0) return true;
  const raw = (status ?? "").trim().toUpperCase();
  return selected.some((s) => s.trim().toUpperCase() === raw);
}

export function countOrdersByStatus(orders: OrderListRow[]): Record<string, number> {
  const counts: Record<string, number> = { all: orders.length };
  for (const s of ALL_ORDER_STATUSES) {
    counts[s] = 0;
  }
  for (const o of orders) {
    const raw = (o.status ?? "").trim().toUpperCase();
    if (raw && raw in counts) {
      counts[raw]++;
    } else if (raw) {
      counts[raw] = (counts[raw] ?? 0) + 1;
    }
  }
  return counts;
}

export type OrderStatusFilterOption = { value: string; label: string; count: number };

/** Dropdown options: every known status (with counts), plus any extra statuses seen in data. */
export function orderStatusFilterOptions(orders: OrderListRow[]): OrderStatusFilterOption[] {
  const counts = countOrdersByStatus(orders);
  const known = new Set<string>(ALL_ORDER_STATUSES);

  const options: OrderStatusFilterOption[] = [
    { value: "all", label: "All statuses", count: counts.all },
    ...ALL_ORDER_STATUSES.map((s) => ({
      value: s,
      label: formatOrderStatusLabel(s),
      count: counts[s] ?? 0,
    })),
  ];

  for (const o of orders) {
    const raw = (o.status ?? "").trim().toUpperCase();
    if (!raw || known.has(raw)) continue;
    known.add(raw);
    options.push({
      value: raw,
      label: formatOrderStatusLabel(raw),
      count: counts[raw] ?? 0,
    });
  }

  return options;
}

/** Multi-select options — concrete statuses only (no "all"), with counts. */
export function orderStatusMultiSelectOptions(orders: OrderListRow[]): OrderStatusFilterOption[] {
  return orderStatusFilterOptions(orders).filter((o) => o.value !== "all");
}
