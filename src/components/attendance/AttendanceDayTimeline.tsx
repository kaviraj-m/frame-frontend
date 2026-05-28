import type { AttendanceDayDetail, AttendancePermission, AttendanceSegment } from "@/lib/attendanceTypes";
import { formatSecondsAsHms } from "@/lib/attendanceIst";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function segmentDurationSeconds(seg: AttendanceSegment): number {
  const start = new Date(seg.start).getTime();
  const end = new Date(seg.end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function segmentLabel(seg: AttendanceSegment): string {
  return `${seg.startLabel} – ${seg.endLabel}`;
}

function sortSegments(segments: AttendanceSegment[]): AttendanceSegment[] {
  return [...segments].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

function permissionNote(
  seg: AttendanceSegment,
  permissions?: AttendancePermission[] | null,
): string | null {
  const fromSeg = seg.note?.trim();
  if (fromSeg) return fromSeg;
  if (!permissions?.length || seg.type !== "permission") return null;
  const match = permissions.find(
    (p) => p.startTime === seg.startLabel && p.endTime === seg.endLabel,
  );
  return match?.note?.trim() || null;
}

export function AttendanceDayTimeline({ detail }: { detail: AttendanceDayDetail }) {
  const segments = sortSegments(detail.segments ?? []);
  const permissions = detail.permissions ?? [];

  if (segments.length === 0 && permissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">No attendance intervals on this day.</p>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-muted-foreground">
        Times in IST (India) · Present {formatSecondsAsHms(detail.presentSeconds ?? 0)} · Break{" "}
        {formatSecondsAsHms(detail.breakSeconds ?? 0)} · Offline{" "}
        {formatSecondsAsHms(detail.offlineSeconds ?? 0)} · Permission{" "}
        {formatSecondsAsHms(detail.permissionSeconds ?? 0)}
      </p>

      {permissions.length > 0 ? (
        <div className="rounded-md border border-violet-500/25 bg-violet-500/5 px-3 py-2 space-y-1.5">
          <p className="text-xs font-medium text-violet-300/90">Permission windows this day</p>
          <ul className="text-sm space-y-1">
            {permissions.map((p) => (
              <li key={p.id} className="text-muted-foreground">
                <span className="font-mono text-foreground tabular-nums">
                  {p.startTime}–{p.endTime}
                </span>
                {p.note?.trim() ? (
                  <span className="text-foreground"> · Reason: {p.note.trim()}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {segments.length > 0 ? (
        <ul className="space-y-2">
          {segments.map((seg, i) => {
            const durationSec = segmentDurationSeconds(seg);
            const reason = permissionNote(seg, permissions);
            return (
              <li
                key={`${seg.type}-${seg.start}-${i}`}
                className={cn(
                  "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-sm",
                  seg.type === "present"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : seg.type === "break"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : seg.type === "offline"
                        ? "border-slate-500/30 bg-slate-500/5"
                        : "border-violet-500/30 bg-violet-500/5",
                )}
              >
                <span className="font-mono text-xs tabular-nums">{segmentLabel(seg)}</span>
                <Badge variant={seg.type === "present" ? "secondary" : "outline"}>
                  {seg.type === "present"
                    ? "Present"
                    : seg.type === "break"
                      ? "Break"
                      : seg.type === "offline"
                        ? "Offline"
                        : "Permission"}
                </Badge>
                {durationSec > 0 ? (
                  <span className="text-[0.65rem] text-muted-foreground tabular-nums">
                    {formatSecondsAsHms(durationSec)}
                  </span>
                ) : null}
                {seg.type === "break" && seg.source === "manual" ? (
                  <span className="text-[0.65rem] text-muted-foreground">Manual</span>
                ) : null}
                {seg.type === "permission" && reason ? (
                  <span className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1 sm:min-w-[8rem]">
                    Reason: <span className="text-foreground">{reason}</span>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
