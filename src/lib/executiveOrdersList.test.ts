import { describe, expect, it } from "vitest";
import {
  createdPresetToFilters,
  filterExecutiveOrders,
  isValidDateRange,
  matchesCreatedDateRange,
  matchesExecutiveAgeFilter,
  matchesExecutiveStatusFilter,
  sortOrdersNewestFirst,
} from "./executiveOrdersList";
import type { OrderListRow } from "./orderListTypes";

function row(partial: Partial<OrderListRow> & Pick<OrderListRow, "orderId">): OrderListRow {
  return {
    queryId: "Q1",
    status: "ORDER_CONFIRMED",
    ...partial,
  };
}

describe("sortOrdersNewestFirst", () => {
  it("sorts by createdAt descending", () => {
    const sorted = sortOrdersNewestFirst([
      row({ orderId: "C1", createdAt: "2026-05-18T10:00:00Z" }),
      row({ orderId: "C2", createdAt: "2026-05-20T10:00:00Z" }),
      row({ orderId: "C3", createdAt: "2026-05-19T10:00:00Z" }),
    ]);
    expect(sorted.map((o) => o.orderId)).toEqual(["C2", "C3", "C1"]);
  });
});

describe("matchesExecutiveStatusFilter", () => {
  it("open excludes terminal statuses", () => {
    expect(matchesExecutiveStatusFilter("ORDER_CONFIRMED", "open")).toBe(true);
    expect(matchesExecutiveStatusFilter("ORDER_COMPLETED", "open")).toBe(false);
    expect(matchesExecutiveStatusFilter("ORDER_CANCELLED", "open")).toBe(false);
  });
});

describe("matchesCreatedDateRange", () => {
  it("validates from <= to", () => {
    expect(isValidDateRange({ from: "2026-05-20", to: "2026-05-18" })).toBe(false);
    expect(isValidDateRange({ from: "2026-05-18", to: "2026-05-20" })).toBe(true);
  });

  it("filters inclusive range on IST calendar day", () => {
    const created = "2026-05-19T06:00:00Z";
    expect(matchesCreatedDateRange(created, { from: "", to: "" })).toBe(true);
    expect(matchesCreatedDateRange(created, { from: "2026-05-19", to: "2026-05-19" })).toBe(
      true,
    );
    expect(matchesCreatedDateRange(created, { from: "2026-05-20", to: "" })).toBe(false);
  });
});

describe("filterExecutiveOrders", () => {
  it("combines frame and pay mode filters", () => {
    const orders = [
      row({ orderId: "A", frameSize: "12x18", paymentMode: "CASH" }),
      row({ orderId: "B", frameSize: "8x10", paymentMode: "ONLINE" }),
    ];
    const out = filterExecutiveOrders(orders, {
      statusFilter: "all",
      ageFilter: "all",
      dateRange: { from: "", to: "" },
      frameFilter: "12x18",
      payModeFilter: "all",
      search: "",
    });
    expect(out.map((o) => o.orderId)).toEqual(["A"]);
  });
});

describe("matchesExecutiveAgeFilter", () => {
  it("all ages passes any tier", () => {
    expect(matchesExecutiveAgeFilter("2026-05-19T10:00:00Z", "ORDER_CONFIRMED", "all")).toBe(
      true,
    );
  });
});

describe("createdPresetToFilters", () => {
  it("maps custom preset to date range only", () => {
    const { ageFilter, dateRange } = createdPresetToFilters("custom", {
      from: "2026-05-01",
      to: "2026-05-31",
    });
    expect(ageFilter).toBe("all");
    expect(dateRange.from).toBe("2026-05-01");
  });

  it("maps today preset to age filter", () => {
    const { ageFilter, dateRange } = createdPresetToFilters("today", {
      from: "2026-05-01",
      to: "",
    });
    expect(ageFilter).toBe("today");
    expect(dateRange).toEqual({ from: "", to: "" });
  });
});
