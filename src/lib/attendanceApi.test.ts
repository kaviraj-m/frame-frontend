import { describe, expect, it } from "vitest";
import { attendancePaths, TAB_HIDDEN_GRACE_MS } from "./attendanceApi";

describe("attendanceApi", () => {
  it("builds paths with static segments before ids", () => {
    const p = attendancePaths("/api/executive");
    expect(p.clockIn).toBe("/api/executive/attendance/clock-in");
    expect(p.presence).toBe("/api/executive/attendance/presence");
    expect(p.end("att-1")).toBe("/api/executive/attendance/end/att-1");
    expect(p.break("att-1")).toBe("/api/executive/attendance/break/att-1");
    expect(p.endBreak("brk-1")).toBe("/api/executive/breaks/end/brk-1");
  });

  it("uses 30 second tab hidden grace", () => {
    expect(TAB_HIDDEN_GRACE_MS).toBe(30_000);
  });
});
