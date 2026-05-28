import type { AttendancePermission } from "./attendanceTypes";
import { todayISTDateString } from "./attendanceIst";

export function permissionTimeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function permissionIntervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function currentISTTimeHHMM(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

export function defaultPermissionStartEnd(now = new Date()): { startTime: string; endTime: string } {
  const startTime = currentISTTimeHHMM(now);
  const startMin = permissionTimeToMinutes(startTime) ?? 0;
  const endMin = Math.min(startMin + 60, 23 * 60 + 59);
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  return { startTime, endTime };
}

export type ValidateSelfPermissionInput = {
  applyDate: string;
  startTime: string;
  endTime: string;
  existing: AttendancePermission[];
};

export function validateSelfApplyPermission(input: ValidateSelfPermissionInput): string | null {
  const today = todayISTDateString();
  if (input.applyDate !== today) {
    return "Permission can only be applied for today";
  }
  const startMin = permissionTimeToMinutes(input.startTime);
  const endMin = permissionTimeToMinutes(input.endTime);
  if (startMin === null || endMin === null) {
    return "Times must be HH:MM";
  }
  if (endMin <= startMin) {
    return "End time must be after start time";
  }
  const nowMin = permissionTimeToMinutes(currentISTTimeHHMM());
  if (nowMin !== null && startMin < nowMin) {
    return "Start time cannot be in the past";
  }
  for (const p of input.existing) {
    if (p.date !== today) continue;
    const existStart = permissionTimeToMinutes(p.startTime);
    const existEnd = permissionTimeToMinutes(p.endTime);
    if (existStart === null || existEnd === null) continue;
    if (permissionIntervalsOverlap(startMin, endMin, existStart, existEnd)) {
      return `Permission overlaps an existing window (${p.startTime}–${p.endTime})`;
    }
  }
  return null;
}
