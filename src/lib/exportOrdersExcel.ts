import * as XLSX from "xlsx";
import { formatMoney, formatShortDateTime } from "./formatDisplay";
import { formatOrderFrameLabel, type OrderListRow } from "./orderListTypes";

export type OrderExportRow = {
  Order: string;
  Query: string;
  Customer: string;
  Phone: string;
  Email: string;
  Frame: string;
  Status: string;
  Advance: string;
  Balance: string;
  "Pay mode": string;
  Created: string;
  Updated: string;
};

export function rowsToExportSheetData(orders: OrderListRow[]): OrderExportRow[] {
  return orders.map((o) => {
    const frame = formatOrderFrameLabel(o);
    return {
    Order: o.orderId,
    Query: o.queryId,
    Customer: o.customerUsername?.trim() || "",
    Phone: o.customerPhoneNumber?.trim() || "",
    Email: o.customerEmail?.trim() || "",
    Frame: frame === "—" ? "" : frame,
    Status: (o.status ?? "").trim(),
    Advance: formatMoney(o.advancePayment),
    Balance: formatMoney(o.balanceAmount),
    "Pay mode": o.paymentMode?.trim() || "",
    Created: formatShortDateTime(o.createdAt) || "",
    Updated: formatShortDateTime(o.updatedAt) || "",
  };
  });
}

function defaultExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `orders-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
}

/** Build and download an .xlsx file in the browser (all rows passed in — no row cap). */
export function exportOrdersToExcel(orders: OrderListRow[], filename?: string): void {
  if (orders.length === 0) return;
  const data = rowsToExportSheetData(orders);
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Orders");
  XLSX.writeFile(workbook, filename?.trim() || defaultExportFilename());
}
