import { describe, expect, it } from "vitest";
import { rowsToQueryExportSheetData } from "./exportQueriesExcel";

describe("rowsToQueryExportSheetData", () => {
  it("maps order created flag and order id", () => {
    const rows = rowsToQueryExportSheetData([
      {
        queryId: "Q1",
        customerUsername: "Alex",
        customerPhoneNumber: "999",
        remarks: "",
        linkedOrderId: "ORD-1",
      },
      {
        queryId: "Q2",
        customerUsername: "Sam",
        customerPhoneNumber: "888",
        remarks: "no order yet",
      },
    ]);
    expect(rows[0]["Order created"]).toBe(true);
    expect(rows[0]["Order ID"]).toBe("ORD-1");
    expect(rows[1]["Order created"]).toBe(false);
    expect(rows[1]["Order ID"]).toBe("");
  });

  it("joins multiple order ids", () => {
    const rows = rowsToQueryExportSheetData([
      {
        queryId: "Q1",
        customerUsername: "A",
        customerPhoneNumber: "1",
        remarks: "",
        linkedOrderIds: ["ORD-2", "ORD-1"],
      },
    ]);
    expect(rows[0]["Order created"]).toBe(true);
    expect(rows[0]["Order ID"]).toBe("ORD-1, ORD-2");
  });
});
