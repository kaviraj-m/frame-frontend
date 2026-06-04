import * as XLSX from "xlsx";
import { formatMoney, formatShortDateTime } from "./formatDisplay";
import {
  fetchOrderExportContributors,
  formatContributorList,
  type OrderExportContributors,
} from "./orderAuditContributors";
import { formatOrderFrameLabel, type OrderListRow } from "./orderListTypes";

export type OrderExportRow = {
  Order: string;
  Query: string;
  Customer: string;
  Phone: string;
  Email: string;
  Address: string;
  Pincode: string;
  Frame: string;
  Status: string;
  Advance: string;
  Balance: string;
  "Pay mode": string;
  Created: string;
  Updated: string;
  Executive?: string;
  Designer?: string;
  "Production & dispatch"?: string;
};

export type ExportOrdersExcelOptions = {
  filename?: string;
  contributorsByOrderId?: Record<string, OrderExportContributors>;
  /** When true, loads contributor names from the admin API before export. */
  fetchContributors?: boolean;
};

export function rowsToExportSheetData(
  orders: OrderListRow[],
  contributorsByOrderId?: Record<string, OrderExportContributors>,
): OrderExportRow[] {
  const withWorkers = !!contributorsByOrderId;
  return orders.map((o) => {
    const frame = formatOrderFrameLabel(o);
    const row: OrderExportRow = {
      Order: o.orderId,
      Query: o.queryId,
      Customer: o.customerUsername?.trim() || "",
      Phone: o.customerPhoneNumber?.trim() || "",
      Email: o.customerEmail?.trim() || "",
      Address: o.addressDetails?.trim() || "",
      Pincode: o.pincode?.trim() || "",
      Frame: frame === "—" ? "" : frame,
      Status: (o.status ?? "").trim(),
      Advance: formatMoney(o.advancePayment),
      Balance: formatMoney(o.balanceAmount),
      "Pay mode": o.paymentMode?.trim() || "",
      Created: formatShortDateTime(o.createdAt) || "",
      Updated: formatShortDateTime(o.updatedAt) || "",
    };
    if (withWorkers) {
      const c = contributorsByOrderId[o.orderId];
      row.Executive = formatContributorList(c?.executives ?? []);
      row.Designer = formatContributorList(c?.designers ?? []);
      row["Production & dispatch"] = formatContributorList(c?.productionDispatch ?? []);
    }
    return row;
  });
}

function defaultExportFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `orders-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
}

function resolveOptions(
  options?: string | ExportOrdersExcelOptions,
): ExportOrdersExcelOptions {
  if (typeof options === "string") {
    return { filename: options };
  }
  return options ?? {};
}

/** Build and download an .xlsx file in the browser (all rows passed in — no row cap). */
export async function exportOrdersToExcel(
  orders: OrderListRow[],
  options?: string | ExportOrdersExcelOptions,
): Promise<void> {
  if (orders.length === 0) return;
  const opts = resolveOptions(options);
  let contributors = opts.contributorsByOrderId;
  if (opts.fetchContributors) {
    contributors = await fetchOrderExportContributors(orders.map((o) => o.orderId));
  }
  const data = rowsToExportSheetData(orders, contributors);
  const sheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Orders");
  XLSX.writeFile(workbook, opts.filename?.trim() || defaultExportFilename());
}
