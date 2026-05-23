import type { AttendanceApiPrefix } from "./attendanceTypes";

/** REST paths for attendance (static segments before :id params for Kvolt router). */
export function attendancePaths(prefix: AttendanceApiPrefix) {
  return {
    current: `${prefix}/attendance/current`,
    clockIn: `${prefix}/attendance/clock-in`,
    presence: `${prefix}/attendance/presence`,
    myDay: (date: string) =>
      `${prefix}/attendance/my-day?date=${encodeURIComponent(date)}`,
    end: (attendanceId: string) => `${prefix}/attendance/end/${encodeURIComponent(attendanceId)}`,
    break: (attendanceId: string) => `${prefix}/attendance/break/${encodeURIComponent(attendanceId)}`,
    endBreak: (breakId: string) => `${prefix}/breaks/end/${encodeURIComponent(breakId)}`,
  };
}

/** Grace before auto-break when tab/app is not active. */
export const AWAY_GRACE_MS = 10_000;

export const ATTENDANCE_TIMEZONE = "Asia/Kolkata";
