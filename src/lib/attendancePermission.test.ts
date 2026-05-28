import { describe, expect, it } from "vitest";
import {
  permissionIntervalsOverlap,
  permissionTimeToMinutes,
  validateSelfApplyPermission,
} from "./attendancePermission";
import { todayISTDateString } from "./attendanceIst";

describe("attendancePermission", () => {
  it("detects overlap", () => {
    expect(permissionIntervalsOverlap(540, 720, 660, 840)).toBe(true);
    expect(permissionIntervalsOverlap(540, 720, 720, 840)).toBe(false);
  });

  it("rejects end before start", () => {
    const err = validateSelfApplyPermission({
      applyDate: todayISTDateString(),
      startTime: "23:00",
      endTime: "22:00",
      existing: [],
    });
    expect(err).toMatch(/after start/i);
  });

  it("parses HH:MM", () => {
    expect(permissionTimeToMinutes("09:30")).toBe(570);
  });
});
