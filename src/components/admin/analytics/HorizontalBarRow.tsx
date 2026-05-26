import { cn } from "@/lib/utils";

export function HorizontalBarRow({
  label,
  value,
  max,
  suffix,
  className,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate text-foreground">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/50 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
