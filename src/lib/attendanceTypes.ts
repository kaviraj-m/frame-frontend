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
  type: "present" | "break";
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  source?: BreakSource;
};

export type AttendanceUserDaySummary = {
  userId: string;
  username: string;
  role: string;
  workdayStart?: string;
  status: "present" | "break" | "offline";
  presentMinutes: number;
  breakMinutes: number;
  segmentCount: number;
};

export type AttendanceDayDetail = {
  date: string;
  timezone: string;
  userId: string;
  username: string;
  role: string;
  status: "present" | "break" | "offline";
  presentMinutes: number;
  breakMinutes: number;
  segments: AttendanceSegment[];
  sessions: AttendanceSession[];
  breaks: BreakSessionDetail[];
};
