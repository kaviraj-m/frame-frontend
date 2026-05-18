import type { AttendanceApiPrefix } from "./attendanceTypes";

/** REST paths for attendance (static segments before :id params for Kvolt router). */
export function attendancePaths(prefix: AttendanceApiPrefix) {
  return {
    current: `${prefix}/attendance/current`,
    clockIn: `${prefix}/attendance/clock-in`,
    presence: `${prefix}/attendance/presence`,
    end: (attendanceId: string) => `${prefix}/attendance/end/${encodeURIComponent(attendanceId)}`,
    break: (attendanceId: string) => `${prefix}/attendance/break/${encodeURIComponent(attendanceId)}`,
    endBreak: (breakId: string) => `${prefix}/breaks/end/${encodeURIComponent(breakId)}`,
  };
}

export const TAB_HIDDEN_GRACE_MS = 30_000;
