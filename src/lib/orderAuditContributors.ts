import { api } from "./api";
import { apiPaths } from "./apiPaths";

export type ContributorBucket = "executive" | "designer" | "production";

export type OrderExportContributors = {
  executives: string[];
  designers: string[];
  productionDispatch: string[];
};

const DESIGN_ACTIONS = new Set([
  "order.design_taken",
  "order.design_shared",
  "order.design_preview_remarks_updated",
  "order.design_decision",
]);

const PRODUCTION_ACTIONS = new Set([
  "order.print_done",
  "order.frame_ready",
  "order.balance_payment_recorded",
  "order.balance_fully_paid",
  "order.tracking_saved",
  "order.dispatched",
  "order.completed",
  "order.admin_patch",
]);

function assetKind(metadata?: Record<string, unknown>): string {
  const v = metadata?.assetKind;
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

/** Maps an order audit action to an export column bucket (mirrors backend classifier). */
export function classifyAuditActionForExport(
  action: string,
  actorRole: string,
  metadata?: Record<string, unknown>,
): ContributorBucket | null {
  const a = action.trim();
  const role = actorRole.trim().toUpperCase();

  if (a === "order.confirmed") return "executive";
  if (DESIGN_ACTIONS.has(a)) return "designer";
  if (PRODUCTION_ACTIONS.has(a)) return "production";

  if (a === "order.asset_uploaded") {
    const kind = assetKind(metadata);
    if (kind === "customer" || kind === "source") return "executive";
    if (kind === "preview") return "designer";
    if (kind === "print-proof") return "production";
    return null;
  }

  if (a === "order.asset_deleted") {
    if (role === "DESIGNER") return "designer";
    if (role === "EXECUTIVE") return "executive";
    if (role === "ADMIN") return "production";
    return null;
  }

  return null;
}

export function formatContributorList(names: string[]): string {
  return names.filter((n) => n.trim()).join(", ");
}

export async function fetchOrderExportContributors(
  orderIds: string[],
): Promise<Record<string, OrderExportContributors>> {
  const ids = [...new Set(orderIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return {};
  const res = await api<{ contributors: Record<string, OrderExportContributors> }>(
    apiPaths.adminOrderExportContributors,
    {
      method: "POST",
      body: JSON.stringify({ orderIds: ids }),
    },
  );
  return res.contributors ?? {};
}
