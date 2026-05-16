import type { AdminOrderRow } from "./adminOrderTypes";
import type { FrameworksUiStatus } from "../../lib/orderStatusUi";
import { mapOrderStatus } from "../../lib/orderStatusUi";

export type { FrameworksUiStatus };
export { mapOrderStatus };

export const FRAMEWORKS_FILTERS = ["all", "New", "In Progress", "Ready", "Delivered", "Cancelled"] as const;

export const AVATAR_COLORS = [
  "#C0152A",
  "#8B0E1E",
  "#B06000",
  "#2E7D32",
  "#3730A3",
  "#0E7490",
  "#7C3AED",
  "#BE185D",
  "#065F46",
  "#92400E",
] as const;

export function customerKey(o: Pick<AdminOrderRow, "customerUsername" | "customerPhoneNumber">): string {
  return `${(o.customerUsername ?? "").trim().toLowerCase()}|${(o.customerPhoneNumber ?? "").trim()}`;
}

export function orderRemark(o: AdminOrderRow): string {
  const d = o.designRemarks?.trim();
  if (d) return d;
  const parts = [o.frameSize, o.paymentMode].filter(Boolean);
  return parts.length ? parts.join(" · ") : o.status ?? "—";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColorIndex(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % AVATAR_COLORS.length;
}

export function isActiveUiStatus(s: FrameworksUiStatus): boolean {
  return s === "New" || s === "In Progress" || s === "Ready";
}
