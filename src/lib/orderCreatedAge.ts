import { cn } from "./cn";

const ORDER_AGE_TZ = "Asia/Kolkata";

/** Finished orders keep default row styling (no age colors). */
export function isTerminalOrderStatus(status: string | undefined): boolean {
  const s = (status ?? "").trim().toUpperCase();
  return s === "ORDER_COMPLETED" || s === "AMOUNT_RETURNED";
}

function calendarDayKey(iso: string, timeZone: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA", { timeZone });
}

/** `YYYY-MM-DD` calendar day for order createdAt in IST (matches age row colors). */
export function orderCreatedCalendarDayKey(iso: string | undefined): string | null {
  if (!iso?.trim()) return null;
  return calendarDayKey(iso, ORDER_AGE_TZ);
}

/** Whole calendar days between created date and today (IST). 0 = today, 1 = yesterday, etc. */
export function orderAgeDayOffset(
  createdAt: string | undefined,
  now: Date = new Date(),
): number | null {
  const created = createdAt ? calendarDayKey(createdAt, ORDER_AGE_TZ) : null;
  if (!created) return null;
  const today = calendarDayKey(now.toISOString(), ORDER_AGE_TZ);
  if (!today) return null;
  const createdMs = new Date(`${created}T12:00:00`).getTime();
  const todayMs = new Date(`${today}T12:00:00`).getTime();
  const diff = Math.floor((todayMs - createdMs) / (24 * 60 * 60 * 1000));
  return diff < 0 ? 0 : diff;
}

export type OrderRowAgeTier = "" | "today" | "day2" | "day3" | "old";

/**
 * Age tier from created date (IST calendar days):
 * - today (0): green
 * - day2 (1): yellow — yesterday
 * - day3 (2): amber — 2 days ago
 * - old (3+): red
 */
export function orderRowAgeTier(
  createdAt: string | undefined,
  status: string | undefined,
  now?: Date,
): OrderRowAgeTier {
  if (isTerminalOrderStatus(status)) return "";
  const offset = orderAgeDayOffset(createdAt, now);
  if (offset === null) return "";
  if (offset === 0) return "today";
  if (offset === 1) return "day2";
  if (offset === 2) return "day3";
  return "old";
}

/** Keep status pills / action buttons on their own colors. */
const ROW_TEXT_EXCLUDE =
  ":not(.status-pill):not(.status-pill_*):not(.btn):not(.btn_*):not(.pill):not(.pill_*):not(.data-board__avatar)";

/** Force every cell label to use the row tier text color (overrides data-table / data-board CSS). */
const ORDER_ROW_TEXT_INHERIT = cn(
  `[&_td_*${ROW_TEXT_EXCLUDE}]:!text-inherit`,
  "[&_td_a:not(.btn):not(.small-btn)]:!text-inherit",
  "[&_.td-order-id]:!text-inherit",
  "[&_.td-muted-id]:!text-inherit",
  "[&_.td-strong]:!text-inherit",
  "[&_.td-mono]:!text-inherit",
  "[&_.date-cell]:!text-inherit",
  "[&_.remark-clip]:!text-inherit",
  "[&_.small]:!text-inherit",
  "[&_.muted]:!text-inherit",
  "[&_.data-board__cust-name]:!text-inherit",
  "[&_.data-board__cust-email]:!text-inherit",
  "[&_.data-board__dt-main]:!text-inherit",
  "[&_.data-board__dt-sub]:!text-inherit",
  "[&_.data-board__remark]:!text-inherit",
);

/** Full-row Tailwind — background + text on every column for all role order tables. */
const ORDER_ROW_TIER_TW: Record<Exclude<OrderRowAgeTier, "">, string> = {
  today: cn(
    "[&_td]:!border-b [&_td]:!border-emerald-900/40",
    "[&_td]:!bg-emerald-950/75 [&_td]:!text-emerald-100",
    "hover:[&_td]:!bg-emerald-900/80 hover:[&_td]:!text-emerald-50",
    ORDER_ROW_TEXT_INHERIT,
  ),
  day2: cn(
    "[&_td]:!border-b [&_td]:!border-yellow-900/40",
    "[&_td]:!bg-yellow-950/75 [&_td]:!text-yellow-100",
    "hover:[&_td]:!bg-yellow-900/80 hover:[&_td]:!text-yellow-50",
    ORDER_ROW_TEXT_INHERIT,
  ),
  day3: cn(
    "[&_td]:!border-b [&_td]:!border-amber-900/40",
    "[&_td]:!bg-amber-950/80 [&_td]:!text-amber-100",
    "hover:[&_td]:!bg-amber-900/85 hover:[&_td]:!text-amber-50",
    ORDER_ROW_TEXT_INHERIT,
  ),
  old: cn(
    "[&_td]:!border-b [&_td]:!border-rose-900/40",
    "[&_td]:!bg-rose-950/75 [&_td]:!text-rose-100",
    "hover:[&_td]:!bg-rose-900/80 hover:[&_td]:!text-rose-50",
    ORDER_ROW_TEXT_INHERIT,
  ),
};

export function orderRowAgeClass(
  createdAt: string | undefined,
  status: string | undefined,
  now?: Date,
): string {
  const tier = orderRowAgeTier(createdAt, status, now);
  if (!tier) return "";
  return ORDER_ROW_TIER_TW[tier];
}

/** Visible selection ring on age-colored rows (keeps tier bg/text). */
const ORDER_ROW_SELECTED_TW =
  "is-selected:[&_td]:!shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]";

export function orderRowClassName(
  createdAt: string | undefined,
  status: string | undefined,
  extra?: string,
  now?: Date,
): string | undefined {
  const tier = orderRowAgeTier(createdAt, status, now);
  const extraTrim = extra?.trim();
  const merged = cn(
    orderRowAgeClass(createdAt, status, now),
    tier && extraTrim?.includes("is-selected") ? ORDER_ROW_SELECTED_TW : undefined,
    extraTrim,
  );
  return merged || undefined;
}

/** For debugging / testing — `today`, `day2`, `day3`, `old`, or empty. */
export function orderRowAgeDataAttr(
  createdAt: string | undefined,
  status: string | undefined,
  now?: Date,
): OrderRowAgeTier | undefined {
  const tier = orderRowAgeTier(createdAt, status, now);
  return tier || undefined;
}

/** Order ID — typography only; row tier sets color on the parent tr. */
export function orderIdCellClassName(): string {
  return "td-order-id font-mono text-[0.8rem] font-bold";
}
