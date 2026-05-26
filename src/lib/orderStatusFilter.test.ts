import { describe, expect, it } from "vitest";
import {
  ALL_ORDER_STATUSES,
  formatOrderStatusLabel,
  matchesOrderStatusFilter,
  orderStatusFilterOptions,
} from "./orderStatusFilter";
import type { OrderListRow } from "./orderListTypes";

function row(status: string): OrderListRow {
  return { orderId: "C1", queryId: "Q1", status };
}

describe("orderStatusFilterOptions", () => {
  it("lists every backend status plus all", () => {
    const options = orderStatusFilterOptions([
      row("ORDER_CONFIRMED"),
      row("IN_DESIGN"),
    ]);
    expect(options[0]).toEqual({ value: "all", label: "All statuses", count: 2 });
    expect(options.map((o) => o.value)).toEqual(["all", ...ALL_ORDER_STATUSES]);
  });

  it("includes counts per status", () => {
    const options = orderStatusFilterOptions([
      row("ORDER_CONFIRMED"),
      row("ORDER_CONFIRMED"),
      row("IN_DESIGN"),
    ]);
    expect(options.find((o) => o.value === "ORDER_CONFIRMED")?.count).toBe(2);
    expect(options.find((o) => o.value === "IN_DESIGN")?.count).toBe(1);
    expect(options.find((o) => o.value === "IN_PRINT")?.count).toBe(0);
  });
});

describe("matchesOrderStatusFilter", () => {
  it("matches exact status case-insensitively", () => {
    expect(matchesOrderStatusFilter("order_confirmed", "ORDER_CONFIRMED")).toBe(true);
    expect(matchesOrderStatusFilter("IN_DESIGN", "ORDER_CONFIRMED")).toBe(false);
    expect(matchesOrderStatusFilter("IN_DESIGN", "all")).toBe(true);
  });
});

describe("formatOrderStatusLabel", () => {
  it("formats snake case to title words", () => {
    expect(formatOrderStatusLabel("DESIGN_SHARED_WITH_CUSTOMER")).toBe(
      "Design Shared With Customer",
    );
  });
});
