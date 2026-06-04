import { describe, expect, it } from "vitest";
import {
  isTerminalOrderStatus,
  matchesOrderAgeTiersFilter,
  orderAgeDayOffset,
  orderRowAgeClass,
  orderRowAgeTier,
  orderRowAgeDataAttr,
  orderRowClassName,
} from "./orderCreatedAge";

/** Fixed "now" = 2026-05-20 15:00 UTC (same calendar day in IST as 20 May) */
const NOW = new Date("2026-05-20T15:00:00.000Z");

describe("orderCreatedAge", () => {
  it("marks terminal statuses as normal (no age tier)", () => {
    expect(isTerminalOrderStatus("ORDER_COMPLETED")).toBe(true);
    expect(orderRowAgeTier("2026-05-20T08:00:00.000Z", "ORDER_COMPLETED", NOW)).toBe("");
    expect(orderRowAgeTier("2026-05-01T08:00:00.000Z", "AMOUNT_RETURNED", NOW)).toBe("");
    expect(orderRowAgeClass("2026-05-20T08:00:00.000Z", "ORDER_COMPLETED", NOW)).toBe("");
  });

  it("computes calendar day offset in India", () => {
    expect(orderAgeDayOffset("2026-05-20T08:00:00.000Z", NOW)).toBe(0);
    expect(orderAgeDayOffset("2026-05-19T10:00:00.000Z", NOW)).toBe(1);
    expect(orderAgeDayOffset("2026-05-18T10:00:00.000Z", NOW)).toBe(2);
    expect(orderAgeDayOffset("2026-05-15T10:00:00.000Z", NOW)).toBe(5);
  });

  it("maps tiers to Tailwind full-row classes", () => {
    const today = orderRowAgeClass("2026-05-20T08:00:00.000Z", "IN_DESIGN", NOW);
    expect(orderRowAgeTier("2026-05-20T08:00:00.000Z", "IN_DESIGN", NOW)).toBe("today");
    expect(today).toContain("bg-green-400");
    expect(today).toContain("text-white");
    expect(today).toContain("text-green-100");
    expect(today).toContain("status-pill");
    expect(today).toContain("[&>td]");
    expect(today).toContain("text-inherit");

    const yesterday = orderRowAgeClass("2026-05-19T10:00:00.000Z", "IN_PRINT", NOW);
    expect(orderRowAgeTier("2026-05-19T10:00:00.000Z", "IN_PRINT", NOW)).toBe("day2");
    expect(yesterday).toContain("bg-yellow-300");
    expect(yesterday).toContain("text-yellow-950");
    expect(yesterday).toContain("text-yellow-900");

    const twoDays = orderRowAgeClass("2026-05-18T10:00:00.000Z", "ORDER_CONFIRMED", NOW);
    expect(orderRowAgeTier("2026-05-18T10:00:00.000Z", "ORDER_CONFIRMED", NOW)).toBe("day3");
    expect(twoDays).toContain("bg-orange-300");
    expect(twoDays).toContain("text-orange-950");

    const old = orderRowAgeClass("2026-05-15T10:00:00.000Z", "IN_DESIGN", NOW);
    expect(orderRowAgeTier("2026-05-15T10:00:00.000Z", "IN_DESIGN", NOW)).toBe("old");
    expect(old).toContain("bg-red-400");
    expect(old).toContain("text-white");
  });

  it("returns normal for missing or invalid createdAt", () => {
    expect(orderRowAgeTier(undefined, "IN_DESIGN", NOW)).toBe("");
    expect(orderRowAgeTier("not-a-date", "IN_DESIGN", NOW)).toBe("");
  });

  it("merges extra row classes and selection ring on age rows", () => {
    const row = orderRowClassName("2026-05-20T08:00:00.000Z", "IN_DESIGN", "is-selected", NOW);
    expect(row).toContain("bg-green-400");
    expect(row).not.toContain("hover:");
    expect(row).toContain("is-selected");
    expect(row).toContain("shadow-[inset");
  });

  it("exposes data-order-age tier for table rows", () => {
    expect(orderRowAgeDataAttr("2026-05-20T08:00:00.000Z", "IN_DESIGN", NOW)).toBe("today");
    expect(orderRowAgeDataAttr("2026-05-19T10:00:00.000Z", "IN_PRINT", NOW)).toBe("day2");
    expect(orderRowAgeDataAttr("2026-05-20T08:00:00.000Z", "ORDER_COMPLETED", NOW)).toBeUndefined();
  });
});

describe("matchesOrderAgeTiersFilter", () => {
  it("shows all when selection is empty", () => {
    expect(matchesOrderAgeTiersFilter("2026-05-20T08:00:00.000Z", "IN_DESIGN", [], NOW)).toBe(true);
    expect(
      matchesOrderAgeTiersFilter("2026-05-20T08:00:00.000Z", "ORDER_COMPLETED", [], NOW),
    ).toBe(true);
  });

  it("matches a single tier", () => {
    expect(matchesOrderAgeTiersFilter("2026-05-20T08:00:00.000Z", "IN_DESIGN", ["today"], NOW)).toBe(
      true,
    );
    expect(matchesOrderAgeTiersFilter("2026-05-19T10:00:00.000Z", "IN_PRINT", ["today"], NOW)).toBe(
      false,
    );
  });

  it("matches any selected tier (OR)", () => {
    expect(
      matchesOrderAgeTiersFilter("2026-05-20T08:00:00.000Z", "IN_DESIGN", ["today", "old"], NOW),
    ).toBe(true);
    expect(
      matchesOrderAgeTiersFilter("2026-05-15T10:00:00.000Z", "IN_DESIGN", ["today", "old"], NOW),
    ).toBe(true);
    expect(
      matchesOrderAgeTiersFilter("2026-05-18T10:00:00.000Z", "ORDER_CONFIRMED", ["today", "old"], NOW),
    ).toBe(false);
  });

  it("excludes terminal orders when any age tier is selected", () => {
    expect(
      matchesOrderAgeTiersFilter("2026-05-20T08:00:00.000Z", "ORDER_COMPLETED", ["today"], NOW),
    ).toBe(false);
  });
});
