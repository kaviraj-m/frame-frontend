import { describe, expect, it } from "vitest";
import { dailyToExportRows, summaryToExportRow } from "./exportUserAttendanceExcel";

describe("exportUserAttendanceExcel", () => {
  it("maps summary and daily rows", () => {
    const summary = summaryToExportRow({
      username: "Subha",
      role: "EXECUTIVE",
      from: "2026-04-28",
      to: "2026-05-27",
      summary: {
        daysInRange: 30,
        daysWithActivity: 5,
        presentSeconds: 3600,
        breakSeconds: 600,
        offlineSeconds: 120,
        permissionSeconds: 1800,
        presentMinutes: 60,
        breakMinutes: 10,
        offlineMinutes: 2,
        permissionMinutes: 30,
      },
      daily: [],
    });
    expect(summary.User).toBe("Subha");
    expect(summary["Present (total)"]).toBeTruthy();
    expect(summary["Permission (total)"]).toBeTruthy();

    const daily = dailyToExportRows([
      {
        date: "2026-05-20",
        userId: "u1",
        username: "Subha",
        role: "EXECUTIVE",
        status: "present",
        presentMinutes: 60,
        breakMinutes: 0,
        offlineMinutes: 0,
        permissionMinutes: 0,
        presentSeconds: 3600,
        breakSeconds: 0,
        offlineSeconds: 0,
        permissionSeconds: 0,
        segmentCount: 2,
      },
    ]);
    expect(daily[0]["Date (IST)"]).toBe("2026-05-20");
    expect(daily[0].Segments).toBe(2);
    expect(daily[0].Permission).toBeTruthy();
  });
});
