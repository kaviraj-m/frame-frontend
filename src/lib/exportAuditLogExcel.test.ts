import { describe, expect, it } from "vitest";
import { rowsToExportSheetData } from "./exportAuditLogExcel";
import type { AuditLogRow } from "./auditLogFilters";

describe("rowsToExportSheetData", () => {
  it("maps audit rows to export columns", () => {
    const rows: AuditLogRow[] = [
      {
        id: "aud-1",
        entityType: "order",
        entityId: "C26051",
        action: "order.dispatched",
        actorUserId: "u1",
        actorUsername: "admin",
        actorRole: "ADMIN",
        summary: "Order dispatched",
        changes: [{ field: "status", label: "Status", old: "X", new: "Y" }],
        metadata: { amount: 500 },
        createdAt: "2026-05-21T17:07:00.000Z",
      },
    ];
    const out = rowsToExportSheetData(rows);
    expect(out).toHaveLength(1);
    expect(out[0]["Entity ID"]).toBe("C26051");
    expect(out[0].Action).toBe("Dispatched");
    expect(out[0].Username).toBe("admin");
    expect(out[0].Changes).toContain("Status");
    expect(out[0].Metadata).toContain("500");
  });
});
