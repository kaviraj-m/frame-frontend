import { describe, expect, it } from "vitest";
import { attendancePaths, AWAY_GRACE_MS, ATTENDANCE_TIMEZONE } from "./attendanceApi";

describe("attendancePaths", () => {
  it("builds executive paths", () => {
    const p = attendancePaths("/api/executive");
    expect(p.current).toBe("/api/executive/attendance/current");
    expect(p.clockIn).toBe("/api/executive/attendance/clock-in");
    expect(p.myDay("2026-05-20")).toBe("/api/executive/attendance/my-day?date=2026-05-20");
    expect(p.end("att_1")).toBe("/api/executive/attendance/end/att_1");
    expect(p.break("att_1")).toBe("/api/executive/attendance/break/att_1");
    expect(p.endBreak("brk_1")).toBe("/api/executive/breaks/end/brk_1");
  });

  it("uses 10s away grace", () => {
    expect(AWAY_GRACE_MS).toBe(10_000);
  });

  it("uses IST timezone constant", () => {
    expect(ATTENDANCE_TIMEZONE).toBe("Asia/Kolkata");
  });
});
