import { describe, expect, it } from "vitest";
import { rowsToExportSheetData } from "./exportOrdersExcel";
import type { OrderListRow } from "./orderListTypes";

describe("rowsToExportSheetData", () => {
  it("maps order fields to export columns", () => {
    const rows = rowsToExportSheetData([
      {
        orderId: "C26051",
        queryId: "Q26051",
        customerUsername: "Alex",
        customerPhoneNumber: "9876543210",
        customerEmail: "a@example.com",
        frameSize: "12x18",
        status: "ORDER_CONFIRMED",
        advancePayment: 500,
        balanceAmount: 200,
        paymentMode: "CASH",
        createdAt: "2026-05-20T10:00:00Z",
        updatedAt: "2026-05-20T12:00:00Z",
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].Order).toBe("C26051");
    expect(rows[0].Status).toBe("ORDER_CONFIRMED");
    expect(rows[0].Frame).toBe("12x18");
    expect(rows[0]["Pay mode"]).toBe("CASH");
  });
});
