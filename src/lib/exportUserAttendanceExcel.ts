import * as XLSX from "xlsx";
import { formatSecondsAsHms } from "./attendanceIst";
import type { UserAttendanceDayRow, UserAttendanceSummary } from "./attendanceTypes";

export type UserAttendanceExportInput = {
  username: string;
  role: string;
  from: string;
  to: string;
  summary: UserAttendanceSummary;
  daily: UserAttendanceDayRow[];
};

export type UserAttendanceSummaryExportRow = {
  User: string;
  Role: string;
  "From (IST)": string;
  "To (IST)": string;
  "Days in range": number;
  "Days with activity": number;
  "Present (total)": string;
  "Break (total)": string;
  "Offline (total)": string;
  "Permission (total)": string;
};

export type UserAttendanceDailyExportRow = {
  "Date (IST)": string;
  Status: string;
  Started: string;
  Present: string;
  Break: string;
  Offline: string;
  Permission: string;
  Segments: number;
};

function formatWorkdayStart(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function summaryToExportRow(input: UserAttendanceExportInput): UserAttendanceSummaryExportRow {
  const s = input.summary;
  return {
    User: input.username?.trim() || "",
    Role: input.role?.trim() || "",
    "From (IST)": input.from?.trim() || "",
    "To (IST)": input.to?.trim() || "",
    "Days in range": s.daysInRange,
    "Days with activity": s.daysWithActivity,
    "Present (total)": formatSecondsAsHms(s.presentSeconds),
    "Break (total)": formatSecondsAsHms(s.breakSeconds),
    "Offline (total)": formatSecondsAsHms(s.offlineSeconds),
    "Permission (total)": formatSecondsAsHms(s.permissionSeconds ?? 0),
  };
}

export function dailyToExportRows(daily: UserAttendanceDayRow[]): UserAttendanceDailyExportRow[] {
  return daily.map((row) => ({
    "Date (IST)": row.date,
    Status: row.status,
    Started: formatWorkdayStart(row.workdayStart),
    Present: formatSecondsAsHms(row.presentSeconds ?? 0),
    Break: formatSecondsAsHms(row.breakSeconds ?? 0),
    Offline: formatSecondsAsHms(row.offlineSeconds ?? 0),
    Permission: formatSecondsAsHms(row.permissionSeconds ?? 0),
    Segments: row.segmentCount,
  }));
}

function defaultExportFilename(username: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const safe = (username || "user").replace(/[^\w.-]+/g, "_").slice(0, 40);
  return `attendance-${safe}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`;
}

export function exportUserAttendanceToExcel(input: UserAttendanceExportInput, filename?: string): void {
  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet([summaryToExportRow(input)]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const dailyRows = dailyToExportRows(input.daily);
  const dailySheet =
    dailyRows.length > 0
      ? XLSX.utils.json_to_sheet(dailyRows)
      : XLSX.utils.aoa_to_sheet([
          ["Date (IST)", "Status", "Started", "Present", "Break", "Offline", "Permission", "Segments"],
        ]);
  XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily breakdown");

  XLSX.writeFile(workbook, filename?.trim() || defaultExportFilename(input.username));
}
