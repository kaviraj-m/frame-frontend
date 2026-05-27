import type { AttendanceApiPrefix } from "./attendanceTypes";

/** REST paths for attendance (static segments before :id params for Kvolt router). */
export function attendancePaths(prefix: AttendanceApiPrefix) {
  return {
    current: `${prefix}/attendance/current`,
    clockIn: `${prefix}/attendance/clock-in`,
    presence: `${prefix}/attendance/presence`,
    heartbeat: `${prefix}/attendance/heartbeat`,
    myDay: (date: string) =>
      `${prefix}/attendance/my-day?date=${encodeURIComponent(date)}`,
    end: (attendanceId: string) => `${prefix}/attendance/end/${encodeURIComponent(attendanceId)}`,
    break: (attendanceId: string) => `${prefix}/attendance/break/${encodeURIComponent(attendanceId)}`,
    endBreak: (breakId: string) => `${prefix}/breaks/end/${encodeURIComponent(breakId)}`,
  };
}

/** Client pings while Present at least this often; backend ends session as offline if missed. */
export const PRESENT_HEARTBEAT_MS = 5 * 60 * 1000;

export const ATTENDANCE_TIMEZONE = "Asia/Kolkata";
