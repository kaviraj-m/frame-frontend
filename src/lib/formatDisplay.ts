/** US locale + hour12 gives AM/PM everywhere (avoids 24h “railway” time from system locale). */
const LOCALE = "en-US";

function parseISO(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatMoney(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

/** Calendar date only (no time). */
export function formatShortDate(iso: string | undefined): string {
  const d = parseISO(iso);
  if (!d) return iso ? iso.slice(0, 10) : "—";
  return d.toLocaleDateString(LOCALE, { year: "2-digit", month: "short", day: "numeric" });
}

/** Date and time with 12-hour clock and AM/PM. */
export function formatShortDateTime(iso: string | undefined): string {
  const d = parseISO(iso);
  if (!d) return iso ? iso.slice(0, 10) : "—";
  return d.toLocaleString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Split date/time for table rows (matches AM/PM locale). */
export function formatTableDateTime(iso: string | undefined): { date: string; time: string } {
  const d = parseISO(iso);
  if (!d) return { date: iso ? iso.slice(0, 10) : "—", time: "" };
  return {
    date: d.toLocaleDateString(LOCALE, { year: "numeric", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

export function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Opens WhatsApp chat (web or app). Uses wa.me; existing chats open in the same thread. */
export function whatsappChatUrl(phone: string | undefined): string | null {
  if (!phone?.trim()) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) digits = `91${digits}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}
