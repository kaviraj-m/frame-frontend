export type AttendanceSession = {
  id: string;
  userId: string;
  role: string;
  clientIp: string;
  startedAt: string;
  lastSeenAt?: string;
  endedAt?: string;
  endReason?: string;
};

export type AttendanceEndReason = "manual" | "tab_hidden" | "logout" | "page_leave";

export type BreakSource = "manual" | "auto_away";

export type BreakSession = {
  id: string;
  attendanceId: string;
  startedAt: string;
  endedAt?: string;
};

export type BreakSessionDetail = BreakSession & {
  source?: BreakSource;
};

export type AttendanceCurrentPayload = {
  attendance: AttendanceSession | null;
  activeBreak: BreakSession | null;
};

export type AttendanceApiPrefix = "/api/executive" | "/api/designer";

export type AttendanceSegment = {
  type: "present" | "break" | "permission" | "offline";
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  source?: BreakSource;
  /** Permission reason (from admin or self-apply note). */
  note?: string;
};

export type AttendanceUserDaySummary = {
  userId: string;
  username: string;
  role: string;
  workdayStart?: string;
  status: "present" | "break" | "offline" | "permission";
  presentMinutes: number;
  breakMinutes: number;
  offlineMinutes: number;
  permissionMinutes: number;
  presentSeconds: number;
  breakSeconds: number;
  offlineSeconds: number;
  permissionSeconds: number;
  segmentCount: number;
};

export type AttendancePermission = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
  createdBy: string;
  createdAt: string;
};

export type UserAttendanceSummary = {
  daysInRange: number;
  daysWithActivity: number;
  presentSeconds: number;
  breakSeconds: number;
  offlineSeconds: number;
  permissionSeconds: number;
  presentMinutes: number;
  breakMinutes: number;
  offlineMinutes: number;
  permissionMinutes: number;
};

export type UserAttendanceDayRow = {
  date: string;
  userId: string;
  username: string;
  role: string;
  workdayStart?: string;
  status: "present" | "break" | "offline" | "permission";
  presentMinutes: number;
  breakMinutes: number;
  offlineMinutes: number;
  permissionMinutes: number;
  presentSeconds: number;
  breakSeconds: number;
  offlineSeconds: number;
  permissionSeconds: number;
  segmentCount: number;
};

export type UserAttendanceRangeUser = {
  id: string;
  username: string;
  role: string;
  email?: string;
};

export type UserAttendanceRangeResponse = {
  user: UserAttendanceRangeUser;
  from: string;
  to: string;
  summary: UserAttendanceSummary;
  daily: UserAttendanceDayRow[];
};

export type AttendanceDayDetail = {
  date: string;
  timezone: string;
  userId: string;
  username: string;
  role: string;
  status: "present" | "break" | "offline" | "permission";
  presentMinutes: number;
  breakMinutes: number;
  offlineMinutes: number;
  permissionMinutes: number;
  presentSeconds: number;
  breakSeconds: number;
  offlineSeconds: number;
  permissionSeconds: number;
  segments?: AttendanceSegment[] | null;
  sessions?: AttendanceSession[] | null;
  breaks?: BreakSessionDetail[] | null;
  permissions?: AttendancePermission[] | null;
};
