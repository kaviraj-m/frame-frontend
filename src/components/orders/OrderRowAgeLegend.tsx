/** IST order-age row colors — matches orderRowClassName tiers. */
export function OrderRowAgeLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.72rem] text-[var(--muted)]"
      aria-label="Order age row colors (India time)"
    >
      <span className="font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Age (IST)</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-950 ring-1 ring-emerald-700/60" aria-hidden />
        Today
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-yellow-950 ring-1 ring-yellow-700/60" aria-hidden />
        Yesterday
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-amber-950 ring-1 ring-amber-700/60" aria-hidden />
        2 days
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-rose-950 ring-1 ring-rose-700/60" aria-hidden />
        3+ days
      </span>
      <span className="text-[var(--muted)]">· Completed / returned = normal row</span>
    </div>
  );
}
