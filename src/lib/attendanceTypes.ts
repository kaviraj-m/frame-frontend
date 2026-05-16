export type AttendanceSession = {
  id: string;
  userId: string;
  role: string;
  clientIp: string;
  startedAt: string;
  endedAt?: string;
};

export type BreakSession = {
  id: string;
  attendanceId: string;
  startedAt: string;
  endedAt?: string;
};

export type AttendanceCurrentPayload = {
  attendance: AttendanceSession | null;
  activeBreak: BreakSession | null;
};

export type AttendanceApiPrefix = "/api/executive" | "/api/designer";
