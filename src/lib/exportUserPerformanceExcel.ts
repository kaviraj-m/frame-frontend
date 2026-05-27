import * as XLSX from "xlsx";
import type {
  UserPerformanceDayRow,
  UserPerformanceSummary,
} from "@/pages/admin/users/adminUserPerformanceTypes";

export type UserPerformanceExportInput = {
  username: string;
  executiveId?: string;
  from: string;
  to: string;
  summary: UserPerformanceSummary;
  daily: UserPerformanceDayRow[];
};

export type UserPerformanceSummaryExportRow = {
  User: string;
  "Executive ID": string;
  "From (IST)": string;
  "To (IST)": string;
  "Orders created": number;
  "Orders completed": number;
  "Queries created": number;
  "In progress": number;
};

export type UserPerformanceDailyExportRow = {
  "Date (IST)": string;
  Queries: number;
  "Orders created": number;
  "Orders completed": number;
};

export function summaryToExportRow(input: UserPerformanceExportInput): UserPerformanceSummaryExportRow {
  return {
    User: input.username?.trim() || "",
    "Executive ID": input.executiveId?.trim() || "",
    "From (IST)": input.from?.trim() || "",
    "To (IST)": input.to?.trim() || "",
    "Orders created": input.summary.ordersCreatedTotal,
    "Orders completed": input.summary.ordersCompletedTotal,
    "Queries created": input.summary.queriesCreatedTotal,
    "In progress": input.summary.ordersInProgress,
  };
}

export function dailyToExportRows(daily: UserPerformanceDayRow[]): UserPerformanceDailyExportRow[] {
  return daily.map((row) => ({
    "Date (IST)": row.date,
    Queries: row.queriesCreated,
    "Orders created": row.ordersCreated,
    "Orders completed": row.ordersCompleted,
  }));
}

function defaultExportFilename(username: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const safe = (username || "user").replace(/[^\w.-]+/g, "_").slice(0, 40);
  return `performance-${safe}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.xlsx`;
}

export function exportUserPerformanceToExcel(input: UserPerformanceExportInput, filename?: string): void {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([summaryToExportRow(input)]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const dailyRows = dailyToExportRows(input.daily);
  const dailySheet =
    dailyRows.length > 0
      ? XLSX.utils.json_to_sheet(dailyRows)
      : XLSX.utils.aoa_to_sheet([["Date (IST)", "Queries", "Orders created", "Orders completed"]]);
  XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily breakdown");

  XLSX.writeFile(workbook, filename?.trim() || defaultExportFilename(input.username));
}
