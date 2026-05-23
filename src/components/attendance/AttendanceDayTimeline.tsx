import type { AttendanceDayDetail, AttendanceSegment } from "@/lib/attendanceTypes";
import { formatMinutesAsHours } from "@/lib/attendanceIst";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function segmentLabel(seg: AttendanceSegment): string {
  return `${seg.startLabel} – ${seg.endLabel}`;
}

export function AttendanceDayTimeline({ detail }: { detail: AttendanceDayDetail }) {
  if (detail.segments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">No present or break intervals on this day.</p>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-muted-foreground">
        Times in IST (India) · Present {formatMinutesAsHours(detail.presentMinutes)} · Break{" "}
        {formatMinutesAsHours(detail.breakMinutes)}
      </p>
      <ul className="space-y-2">
        {detail.segments.map((seg, i) => (
          <li
            key={`${seg.type}-${seg.start}-${i}`}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm",
              seg.type === "present"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5",
            )}
          >
            <span className="font-mono text-xs tabular-nums">{segmentLabel(seg)}</span>
            <Badge variant={seg.type === "present" ? "secondary" : "outline"}>
              {seg.type === "present" ? "Present" : "Break"}
            </Badge>
            {seg.type === "break" && seg.source === "auto_away" ? (
              <span className="text-[0.65rem] text-muted-foreground">Auto (away)</span>
            ) : null}
            {seg.type === "break" && seg.source === "manual" ? (
              <span className="text-[0.65rem] text-muted-foreground">Manual</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
