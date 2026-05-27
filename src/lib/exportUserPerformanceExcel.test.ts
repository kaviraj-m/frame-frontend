import { describe, expect, it } from "vitest";
import { dailyToExportRows, summaryToExportRow } from "./exportUserPerformanceExcel";

describe("exportUserPerformanceExcel", () => {
  it("maps summary and daily rows", () => {
    const summary = summaryToExportRow({
      username: "Subha",
      executiveId: "EXEC-1",
      from: "2026-04-28",
      to: "2026-05-27",
      summary: {
        ordersCreatedTotal: 3,
        ordersCompletedTotal: 0,
        queriesCreatedTotal: 2,
        ordersInProgress: 3,
      },
      daily: [],
    });
    expect(summary.User).toBe("Subha");
    expect(summary["Orders created"]).toBe(3);

    const daily = dailyToExportRows([
      { date: "2026-05-20", queriesCreated: 1, ordersCreated: 2, ordersCompleted: 0 },
    ]);
    expect(daily[0]["Date (IST)"]).toBe("2026-05-20");
    expect(daily[0].Queries).toBe(1);
  });
});
