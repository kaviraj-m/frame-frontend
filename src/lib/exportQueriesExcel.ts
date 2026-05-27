import * as XLSX from "xlsx";
import { formatShortDateTime } from "./formatDisplay";

export type AdminQueryExportSource = {
  queryId: string;
  customerUsername: string;
  customerPhoneNumber: string;
  customerEmail?: string;
  remarks: string;
  createdByExecutiveId?: string;
  executiveUsername?: string;
  linkedOrderId?: string;
  linkedOrderIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export function formatLinkedOrderIds(q: AdminQueryExportSource): string {
  const ids = q.linkedOrderIds?.length
    ? q.linkedOrderIds
    : q.linkedOrderId?.trim()
      ? [q.linkedOrderId.trim()]
      : [];
  return [...ids]
    .map((id) => id.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(", ");
}

export function queryHasLinkedOrder(q: AdminQueryExportSource): boolean {
  return formatLinkedOrderIds(q).length > 0;
}

export type QueryExportRow = {
  Query: string;
  Customer: string;
  Phone: string;
  Email: string;
  Executive: string;
  "Executive ID": string;
  "Order created": boolean;
  "Order ID": string;
  Remarks: string;
  Created: string;
  Updated: string;
};

export function rowsToQueryExportSheetData(queries: AdminQueryExportSource[]): QueryExportRow[] {
  return queries.map((q) => {
    const orderIds = formatLinkedOrderIds(q);
    return {
      Query: q.queryId?.trim() || "",
      Customer: q.customerUsername?.trim() || "",
      Phone: q.customerPhoneNumber?.trim() || "",
      Email: q.customerEmail?.trim() || "",
      Executive: q.executiveUsername?.trim() || "",
      "Executive ID": q.createdByExecutiveId?.trim() || "",
      "Order created": queryHasLinkedOrder(q),
      "Order ID": orderIds,
      Remarks: q.remarks?.trim() || "",
      Created: formatShortDateTime(q.createdAt) || "",
      Updated: formatShortDateTime(q.updatedAt) || "",
    };
  });
}

function defaultExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `queries-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
}

export function exportQueriesToExcel(queries: AdminQueryExportSource[], filename?: string): void {
  if (queries.length === 0) return;
  const data = rowsToQueryExportSheetData(queries);
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Queries");
  XLSX.writeFile(workbook, filename?.trim() || defaultExportFilename());
}
