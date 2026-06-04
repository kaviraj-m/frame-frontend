import * as XLSX from "xlsx";
import { formatMoney } from "./formatDisplay";
import { formatOrderStatusLabel } from "./orderStatusFilter";
import type { AdminAnalyticsOverview } from "@/pages/admin/analytics/adminAnalyticsTypes";

type MetricRow = { Metric: string; Value: string | number };

function formatConversionPct(pct: number): string {
  if (!Number.isFinite(pct) || pct === 0) return "—";
  return `${pct.toFixed(1)}%`;
}

/** @internal Exported for unit tests. */
export function overviewRows(data: AdminAnalyticsOverview): MetricRow[] {
  const s = data.summary;
  return [
    { Metric: "From (IST)", Value: data.from },
    { Metric: "To (IST)", Value: data.to },
    { Metric: "Queries created", Value: s.queriesCreated },
    { Metric: "Orders created", Value: s.ordersCreated },
    { Metric: "Orders completed", Value: s.ordersCompleted },
    { Metric: "Orders cancelled", Value: s.ordersCancelled },
    { Metric: "Orders in progress (snapshot)", Value: s.ordersInProgress },
    { Metric: "Conversion (orders ÷ queries)", Value: formatConversionPct(s.conversionPercent) },
    { Metric: "Advance collected", Value: formatMoney(s.advanceCollected) },
    { Metric: "Full payment", Value: formatMoney(s.fullPaymentTotal) },
    { Metric: "", Value: "" },
    { Metric: "Notes", Value: "Advance on orders created in range; full payment on orders completed in range." },
    {
      Metric: "Pipeline sheet",
      Value: "Current order counts by status (not limited to date range).",
    },
    {
      Metric: "Frame sizes sheet",
      Value: "Line quantities on orders created in the selected range.",
    },
  ];
}

function dailyExportRows(data: AdminAnalyticsOverview) {
  return data.daily.map((row) => ({
    "Date (IST)": row.date,
    Queries: row.queriesCreated,
    "Orders created": row.ordersCreated,
    Completed: row.ordersCompleted,
    Advance: formatMoney(row.advanceCollected),
    "Full payment": formatMoney(row.fullPaymentTotal),
  }));
}

function pipelineExportRows(data: AdminAnalyticsOverview) {
  return data.statusBreakdown.map((row) => ({
    Status: formatOrderStatusLabel(row.status),
    "Status code": row.status,
    Count: row.count,
  }));
}

function frameSizeExportRows(data: AdminAnalyticsOverview) {
  return data.topFrameSizes.map((row) => ({
    "Frame size": row.frameSize,
    Quantity: row.quantity,
  }));
}

function executiveExportRows(data: AdminAnalyticsOverview) {
  return data.executiveLeaderboard.map((row, i) => ({
    Rank: i + 1,
    Executive: row.username,
    "User ID": row.userId,
    Queries: row.queriesCreated,
    "Orders created": row.ordersCreated,
    Completed: row.ordersCompleted,
  }));
}

function defaultExportFilename(from: string, to: string): string {
  const safe = (d: string) => d.replace(/[^\d-]/g, "") || "range";
  return `analytics-${safe(from)}_${safe(to)}.xlsx`;
}

/** Export full analytics overview to a multi-sheet workbook. */
export function exportAdminAnalyticsToExcel(
  data: AdminAnalyticsOverview,
  filename?: string,
): void {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(overviewRows(data)),
    "Overview",
  );

  const dailyRows = dailyExportRows(data);
  const dailySheet = XLSX.utils.json_to_sheet(
    dailyRows.length > 0
      ? dailyRows
      : [{ "Date (IST)": "", Queries: "", "Orders created": "", Completed: "", Advance: "", "Full payment": "" }],
  );
  XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily");

  const pipelineSheet = XLSX.utils.json_to_sheet(
    pipelineExportRows(data).length > 0
      ? pipelineExportRows(data)
      : [{ Status: "", "Status code": "", Count: "" }],
  );
  XLSX.utils.book_append_sheet(workbook, pipelineSheet, "Pipeline");

  const framesSheet = XLSX.utils.json_to_sheet(
    frameSizeExportRows(data).length > 0
      ? frameSizeExportRows(data)
      : [{ "Frame size": "", Quantity: "" }],
  );
  XLSX.utils.book_append_sheet(workbook, framesSheet, "Frame sizes");

  const execSheet = XLSX.utils.json_to_sheet(
    executiveExportRows(data).length > 0
      ? executiveExportRows(data)
      : [{ Rank: "", Executive: "", "User ID": "", Queries: "", "Orders created": "", Completed: "" }],
  );
  XLSX.utils.book_append_sheet(workbook, execSheet, "Executives");

  XLSX.writeFile(workbook, filename?.trim() || defaultExportFilename(data.from, data.to));
}
