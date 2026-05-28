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
    permissions: (date?: string) => {
      const q = date?.trim() ? `?date=${encodeURIComponent(date)}` : "";
      return `${prefix}/attendance/permissions${q}`;
    },
    createPermission: `${prefix}/attendance/permissions`,
    end: (attendanceId: string) => `${prefix}/attendance/end/${encodeURIComponent(attendanceId)}`,
    break: (attendanceId: string) => `${prefix}/attendance/break/${encodeURIComponent(attendanceId)}`,
    endBreak: (breakId: string) => `${prefix}/breaks/end/${encodeURIComponent(breakId)}`,
  };
}

/** Client pings while Present at least this often; gaps without a ping count as offline after 3 minutes. */
export const PRESENT_HEARTBEAT_MS = 3 * 60 * 1000;

export const PRESENT_OFFLINE_AFTER_MS = 3 * 60 * 1000;

export const ATTENDANCE_TIMEZONE = "Asia/Kolkata";
