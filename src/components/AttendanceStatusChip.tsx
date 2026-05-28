import { useSmartAttendanceContext } from "@/context/SmartAttendanceContext";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  offline: "Offline",
  present: "Present",
  break: "On break",
};

export function AttendanceStatusChip() {
  const { status, error, hydrated, isAway, attendanceId } = useSmartAttendanceContext();
  if (!hydrated) return null;
  if (!attendanceId) return null;

  const label =
    status === "present" && isAway
      ? "Present (away)"
      : (STATUS_LABEL[status] ?? status);

  return (
    <div className="mb-4 flex flex-col gap-1">
      <div
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
          status === "present" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
          status === "break" && "border-amber-500/40 bg-amber-500/10 text-amber-300",
          status === "offline" && "border-slate-500/40 bg-slate-500/10 text-slate-300",
        )}
        role="status"
        aria-live="polite"
      >
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            status === "present" && "bg-emerald-500",
            status === "break" && "bg-amber-500",
            status === "offline" && "bg-slate-400",
          )}
          aria-hidden
        />
        {label}
      </div>
      {status === "present" && isAway ? (
        <p className="text-xs text-muted-foreground">
          Away from tab — present pings paused. After 3 minutes without a ping, time counts as offline
          (not break).
        </p>
      ) : null}
      {status === "offline" ? (
        <p className="text-xs text-muted-foreground">
          No present ping for 3+ minutes — counted as offline. Focus the tab or wait for the next ping
          to return to present. Log out to end your session.
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          Attendance: {error}
        </p>
      ) : null}
    </div>
  );
}
