import { describe, expect, it } from "vitest";
import { overviewRows } from "./exportAdminAnalyticsExcel";
import type { AdminAnalyticsOverview } from "@/pages/admin/analytics/adminAnalyticsTypes";

// overviewRows is not exported - test via re-import pattern or export for test
// Actually overviewRows is private - test export function doesn't write file easily
// Test data shape through a minimal public helper - export overviewRows for test or test full export with mock

describe("exportAdminAnalyticsExcel", () => {
  const sample: AdminAnalyticsOverview = {
    from: "2026-05-01",
    to: "2026-05-31",
    summary: {
      queriesCreated: 10,
      ordersCreated: 8,
      ordersCompleted: 5,
      ordersCancelled: 1,
      ordersInProgress: 3,
      conversionPercent: 80,
      advanceCollected: 1000,
      fullPaymentTotal: 5000,
    },
    daily: [
      {
        date: "2026-05-20",
        queriesCreated: 2,
        ordersCreated: 1,
        ordersCompleted: 1,
        advanceCollected: 100,
        fullPaymentTotal: 500,
      },
    ],
    statusBreakdown: [{ status: "IN_PRINT", count: 2 }],
    executiveLeaderboard: [
      {
        userId: "u1",
        username: "Subha",
        queriesCreated: 5,
        ordersCreated: 4,
        ordersCompleted: 2,
      },
    ],
    topFrameSizes: [{ frameSize: "12*18", quantity: 10 }],
  };

  it("builds overview metrics including date range", () => {
    const rows = overviewRows(sample);
    expect(rows.find((r) => r.Metric === "From (IST)")?.Value).toBe("2026-05-01");
    expect(rows.find((r) => r.Metric === "Queries created")?.Value).toBe(10);
    expect(rows.find((r) => r.Metric === "Conversion (orders ÷ queries)")?.Value).toBe("80.0%");
  });
});
