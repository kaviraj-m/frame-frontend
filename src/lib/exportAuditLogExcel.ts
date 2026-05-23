import * as XLSX from "xlsx";
import { formatShortDateTime } from "./formatDisplay";
import type { AuditLogRow } from "./auditLogFilters";

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "query.created": "Query created",
  "query.remarks_updated": "Remark added",
  "order.confirmed": "Order confirmed",
  "order.asset_uploaded": "Asset uploaded",
  "order.asset_deleted": "Asset deleted",
  "order.design_taken": "Design taken",
  "order.design_shared": "Design shared",
  "order.design_preview_remarks_updated": "Preview remark",
  "order.design_decision": "Design decision",
  "order.print_done": "Print done",
  "order.balance_payment_recorded": "Balance payment",
  "order.balance_fully_paid": "Balance fully paid",
  "order.tracking_saved": "Tracking saved",
  "order.dispatched": "Dispatched",
  "order.completed": "Completed",
  "order.admin_patch": "Order patched",
};

function actionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

function formatChanges(changes: AuditLogRow["changes"]): string {
  if (!changes?.length) return "";
  return changes.map((c) => `${c.label}: ${c.old || "—"} → ${c.new || "—"}`).join("; ");
}

export type AuditLogExportRow = {
  Time: string;
  "Entity type": string;
  "Entity ID": string;
  Action: string;
  Username: string;
  Role: string;
  Summary: string;
  Changes: string;
  Metadata: string;
};

export function rowsToExportSheetData(rows: AuditLogRow[]): AuditLogExportRow[] {
  return rows.map((r) => ({
    Time: formatShortDateTime(r.createdAt) || "",
    "Entity type": r.entityType,
    "Entity ID": r.entityId,
    Action: actionLabel(r.action),
    Username: r.actorUsername || "",
    Role: r.actorRole || "",
    Summary: r.summary || "",
    Changes: formatChanges(r.changes),
    Metadata: r.metadata && Object.keys(r.metadata).length > 0 ? JSON.stringify(r.metadata) : "",
  }));
}

function defaultExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `audit-log-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
}

export function exportAuditLogsToExcel(rows: AuditLogRow[], filename?: string): void {
  if (rows.length === 0) return;
  const data = rowsToExportSheetData(rows);
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Audit log");
  XLSX.writeFile(workbook, filename?.trim() || defaultExportFilename());
}
