export type AttendanceSession = {
  id: string;
  userId: string;
  role: string;
  clientIp: string;
  startedAt: string;
  endedAt?: string;
  endReason?: string;
};

export type AttendanceEndReason = "manual" | "tab_hidden" | "logout" | "page_leave";

export type BreakSource = "manual";
export type IdleSource = "tab_away";

export type BreakSession = {
  id: string;
  attendanceId: string;
  startedAt: string;
  endedAt?: string;
};

export type BreakSessionDetail = BreakSession & {
  source?: BreakSource;
};

export type IdleSession = {
  id: string;
  attendanceId: string;
  source?: IdleSource;
  startedAt: string;
  endedAt?: string;
};

export type AttendanceCurrentPayload = {
  attendance: AttendanceSession | null;
  activeBreak: BreakSession | null;
  activeIdle: IdleSession | null;
};

export type AttendanceApiPrefix = "/api/executive" | "/api/designer";

export type AttendanceSegment = {
  type: "present" | "break" | "idle" | "permission";
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  source?: BreakSource | IdleSource;
};

export type AttendanceUserDaySummary = {
  userId: string;
  username: string;
  role: string;
  workdayStart?: string;
  status: "present" | "break" | "idle" | "offline" | "permission";
  presentMinutes: number;
  breakMinutes: number;
  idleMinutes: number;
  presentSeconds: number;
  breakSeconds: number;
  idleSeconds: number;
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

export type AttendanceDayDetail = {
  date: string;
  timezone: string;
  userId: string;
  username: string;
  role: string;
  status: "present" | "break" | "idle" | "offline" | "permission";
  presentMinutes: number;
  breakMinutes: number;
  idleMinutes: number;
  presentSeconds: number;
  breakSeconds: number;
  idleSeconds: number;
  segments?: AttendanceSegment[] | null;
  sessions?: AttendanceSession[] | null;
  breaks?: BreakSessionDetail[] | null;
  idles?: IdleSession[] | null;
  permissions?: AttendancePermission[] | null;
};
