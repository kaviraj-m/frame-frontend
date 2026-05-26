import type { AttendanceDayDetail, AttendanceSegment } from "@/lib/attendanceTypes";
import { formatSecondsAsHms } from "@/lib/attendanceIst";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function segmentLabel(seg: AttendanceSegment): string {
  return `${seg.startLabel} – ${seg.endLabel}`;
}

export function AttendanceDayTimeline({ detail }: { detail: AttendanceDayDetail }) {
  const segments = detail.segments ?? [];
  if (segments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">No attendance intervals on this day.</p>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-muted-foreground">
        Times in IST (India) · Present {formatSecondsAsHms(detail.presentSeconds ?? 0)} · Break{" "}
        {formatSecondsAsHms(detail.breakSeconds ?? 0)} · Idle {formatSecondsAsHms(detail.idleSeconds ?? 0)}
      </p>
      <ul className="space-y-2">
        {segments.map((seg, i) => (
          <li
            key={`${seg.type}-${seg.start}-${i}`}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm",
              seg.type === "present"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : seg.type === "break"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : seg.type === "idle"
                    ? "border-sky-500/30 bg-sky-500/5"
                    : "border-violet-500/30 bg-violet-500/5",
            )}
          >
            <span className="font-mono text-xs tabular-nums">{segmentLabel(seg)}</span>
            <Badge variant={seg.type === "present" ? "secondary" : "outline"}>
              {seg.type === "present"
                ? "Present"
                : seg.type === "break"
                  ? "Break"
                  : seg.type === "idle"
                    ? "Idle"
                    : "Permission"}
            </Badge>
            {seg.type === "break" && seg.source === "manual" ? (
              <span className="text-[0.65rem] text-muted-foreground">Manual</span>
            ) : null}
            {seg.type === "idle" ? (
              <span className="text-[0.65rem] text-muted-foreground">Auto (tab/window away)</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
