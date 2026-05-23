import { describe, expect, it } from "vitest";
import {
  auditDateRangeValid,
  buildAuditLogQueryParams,
  dateRangeToApiParams,
} from "./auditLogFilters";

describe("auditDateRangeValid", () => {
  it("rejects from after to", () => {
    expect(auditDateRangeValid("2026-05-20", "2026-05-18")).toBe(false);
  });

  it("accepts valid range", () => {
    expect(auditDateRangeValid("2026-05-18", "2026-05-20")).toBe(true);
  });
});

describe("dateRangeToApiParams", () => {
  it("returns ISO bounds for date inputs", () => {
    const { from, to } = dateRangeToApiParams("2026-05-18", "2026-05-18");
    expect(from).toBeTruthy();
    expect(to).toBeTruthy();
    expect(new Date(from!).toISOString()).toBe(from);
    expect(new Date(to!).getTime()).toBeGreaterThan(new Date(from!).getTime());
  });

  it("returns empty when no dates", () => {
    expect(dateRangeToApiParams("", "")).toEqual({});
  });
});

describe("buildAuditLogQueryParams", () => {
  it("includes filter and date query keys", () => {
    const params = buildAuditLogQueryParams(2, 50, {
      search: "admin",
      entityType: "order",
      entityId: "C26051",
      action: "order.dispatched",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-31",
    });
    expect(params.get("page")).toBe("2");
    expect(params.get("pageSize")).toBe("50");
    expect(params.get("q")).toBe("admin");
    expect(params.get("entityType")).toBe("order");
    expect(params.get("entityId")).toBe("C26051");
    expect(params.get("action")).toBe("order.dispatched");
    expect(params.get("from")).toBeTruthy();
    expect(params.get("to")).toBeTruthy();
  });
});
