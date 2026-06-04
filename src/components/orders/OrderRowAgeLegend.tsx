/** IST order-age row colors — matches orderRowClassName tiers (body rows only). */
export function OrderRowAgeLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground"
      aria-label="Order age row colors (India time)"
    >
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-foreground/70">
        Row colours (IST)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-green-400 ring-1 ring-green-200" aria-hidden />
        Today
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-yellow-300 ring-1 ring-yellow-200" aria-hidden />
        Yesterday
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-orange-300 ring-1 ring-orange-200" aria-hidden />
        Delayed
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-red-400 ring-1 ring-red-200" aria-hidden />
        Overdue
      </span>
      <span className="text-muted-foreground">· Completed / returned = normal row</span>
    </div>
  );
}
