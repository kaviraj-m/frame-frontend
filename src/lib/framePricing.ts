import type { ExecutivePricingRow } from "../pages/executive/executivePricingTypes";

/** Catalogue full price for the selected payment mode. */
export function cataloguePrice(row: ExecutivePricingRow, paymentMode: string): number {
  return paymentMode === "ONLINE" ? row.onlinePrice : row.cashPrice;
}

export function paymentModeLabel(mode: string): string {
  return mode === "ONLINE" ? "online" : "cash";
}
