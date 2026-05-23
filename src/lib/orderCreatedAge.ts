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
 * - day3 (2): orange — Delayed (2 calendar days old)
 * - old (3+): red — Overdue (3+ calendar days old)
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

/** Exclude status pills, action buttons, and avatars from row text inherit. */
const ROW_TEXT_EXCLUDE =
  ":not(button):not(.status-pill):not(.status-pill_*):not(.btn):not(.btn_*):not(.pill):not(.pill_*):not(.data-board__avatar)";

/** Row text + muted variants; overrides `text-muted-foreground` on cells and nested spans. */
const ORDER_ROW_TEXT_BASE = cn(
  `[&>td_*${ROW_TEXT_EXCLUDE}]:!text-inherit`,
  "[&>td_.td-order-id]:!text-inherit",
  "[&>td_.td-muted-id]:!text-inherit",
  "[&>td_.td-strong]:!text-inherit",
  "[&>td_.td-mono]:!text-inherit",
  "[&>td_.date-cell]:!text-inherit",
  "[&>td_.remark-clip]:!text-inherit",
  "[&>td_.small]:!text-inherit",
  "[&>td_.muted]:!text-inherit",
);

const ORDER_ROW_TEXT_TODAY = cn(
  "[&>td]:!text-white",
  "[&>td.text-muted-foreground]:!text-green-100",
  "[&>td_.text-muted-foreground]:!text-green-100",
  "[&>td_.text-foreground]:!text-white",
  "[&>td_a:not(.btn):not(.small-btn):not(.inline-flex)]:!text-white",
  ORDER_ROW_TEXT_BASE,
);

const ORDER_ROW_TEXT_YESTERDAY = cn(
  "[&>td]:!text-yellow-950",
  "[&>td.text-muted-foreground]:!text-yellow-900",
  "[&>td_.text-muted-foreground]:!text-yellow-900",
  "[&>td_.text-foreground]:!text-yellow-950",
  "[&>td_a:not(.btn):not(.small-btn):not(.inline-flex)]:!text-yellow-950",
  ORDER_ROW_TEXT_BASE,
);

const ORDER_ROW_TEXT_DAY2 = cn(
  "[&>td]:!text-orange-950",
  "[&>td.text-muted-foreground]:!text-orange-900",
  "[&>td_.text-muted-foreground]:!text-orange-900",
  "[&>td_.text-foreground]:!text-orange-950",
  "[&>td_a:not(.btn):not(.small-btn):not(.inline-flex)]:!text-orange-950",
  ORDER_ROW_TEXT_BASE,
);

const ORDER_ROW_TEXT_OLD = cn(
  "[&>td]:!text-white",
  "[&>td.text-muted-foreground]:!text-red-100",
  "[&>td_.text-muted-foreground]:!text-red-100",
  "[&>td_.text-foreground]:!text-white",
  "[&>td_a:not(.btn):not(.small-btn):not(.inline-flex)]:!text-white",
  ORDER_ROW_TEXT_BASE,
);

/** Status badge on age rows — darker pill in the same hue as the row. */
const ORDER_ROW_STATUS_TODAY = cn(
  "[&>td_.status-pill]:!border-green-900 [&>td_.status-pill]:!bg-green-900 [&>td_.status-pill]:!text-green-50",
);
const ORDER_ROW_STATUS_YESTERDAY = cn(
  "[&>td_.status-pill]:!border-yellow-900 [&>td_.status-pill]:!bg-yellow-900 [&>td_.status-pill]:!text-yellow-50",
);
const ORDER_ROW_STATUS_DAY2 = cn(
  "[&>td_.status-pill]:!border-orange-900 [&>td_.status-pill]:!bg-orange-900 [&>td_.status-pill]:!text-orange-50",
);
const ORDER_ROW_STATUS_OLD = cn(
  "[&>td_.status-pill]:!border-red-900 [&>td_.status-pill]:!bg-red-900 [&>td_.status-pill]:!text-red-50",
);

/** Outline action icons — dark button, white icon (view `button` + edit `a` link-as-button). */
const ORDER_ROW_ACTION_BASE = "[&>td_button_svg]:!text-white [&>td_a.inline-flex_svg]:!text-white";

const ORDER_ROW_ACTION_TODAY = cn(
  "[&>td_button]:!border-green-800 [&>td_button]:!bg-green-950 [&>td_button]:!text-white",
  "[&>td_a.inline-flex]:!border-green-800 [&>td_a.inline-flex]:!bg-green-950 [&>td_a.inline-flex]:!text-white",
  "[&>td_button:hover]:!bg-green-900 [&>td_a.inline-flex:hover]:!bg-green-900",
  ORDER_ROW_ACTION_BASE,
);
const ORDER_ROW_ACTION_YESTERDAY = cn(
  "[&>td_button]:!border-yellow-900 [&>td_button]:!bg-yellow-950 [&>td_button]:!text-white",
  "[&>td_a.inline-flex]:!border-yellow-900 [&>td_a.inline-flex]:!bg-yellow-950 [&>td_a.inline-flex]:!text-white",
  "[&>td_button:hover]:!bg-yellow-900 [&>td_a.inline-flex:hover]:!bg-yellow-900",
  ORDER_ROW_ACTION_BASE,
);
const ORDER_ROW_ACTION_DAY2 = cn(
  "[&>td_button]:!border-orange-900 [&>td_button]:!bg-orange-950 [&>td_button]:!text-white",
  "[&>td_a.inline-flex]:!border-orange-900 [&>td_a.inline-flex]:!bg-orange-950 [&>td_a.inline-flex]:!text-white",
  "[&>td_button:hover]:!bg-orange-900 [&>td_a.inline-flex:hover]:!bg-orange-900",
  ORDER_ROW_ACTION_BASE,
);
const ORDER_ROW_ACTION_OLD = cn(
  "[&>td_button]:!border-red-900 [&>td_button]:!bg-red-950 [&>td_button]:!text-white",
  "[&>td_a.inline-flex]:!border-red-900 [&>td_a.inline-flex]:!bg-red-950 [&>td_a.inline-flex]:!text-white",
  "[&>td_button:hover]:!bg-red-900 [&>td_a.inline-flex:hover]:!bg-red-900",
  ORDER_ROW_ACTION_BASE,
);

/**
 * Body cells only (`> td`) — never `th` / table header columns.
 * Brighter solids, no hover darkening.
 */
const ORDER_ROW_TIER_TW: Record<Exclude<OrderRowAgeTier, "">, string> = {
  today: cn(
    "[&>td]:!border-b [&>td]:!border-green-200",
    "[&>td]:!bg-green-400",
    ORDER_ROW_TEXT_TODAY,
    ORDER_ROW_STATUS_TODAY,
    ORDER_ROW_ACTION_TODAY,
  ),
  day2: cn(
    "[&>td]:!border-b [&>td]:!border-yellow-200",
    "[&>td]:!bg-yellow-300",
    ORDER_ROW_TEXT_YESTERDAY,
    ORDER_ROW_STATUS_YESTERDAY,
    ORDER_ROW_ACTION_YESTERDAY,
  ),
  day3: cn(
    "[&>td]:!border-b [&>td]:!border-orange-200",
    "[&>td]:!bg-orange-300",
    ORDER_ROW_TEXT_DAY2,
    ORDER_ROW_STATUS_DAY2,
    ORDER_ROW_ACTION_DAY2,
  ),
  old: cn(
    "[&>td]:!border-b [&>td]:!border-red-200",
    "[&>td]:!bg-red-400",
    ORDER_ROW_TEXT_OLD,
    ORDER_ROW_STATUS_OLD,
    ORDER_ROW_ACTION_OLD,
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
