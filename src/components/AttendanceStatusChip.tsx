import { useSmartAttendanceContext } from "@/context/SmartAttendanceContext";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  offline: "Offline",
  present: "Present",
  break: "On break",
  away_pending: "Away — break soon",
};

export function AttendanceStatusChip() {
  const { status, awaySecondsLeft, hydrated } = useSmartAttendanceContext();
  if (!hydrated || status === "offline") return null;

  const label = STATUS_LABEL[status] ?? status;
  const showCountdown = status === "away_pending" && awaySecondsLeft != null;

  return (
    <div
      className={cn(
        "mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        status === "present" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        status === "break" && "border-amber-500/40 bg-amber-500/10 text-amber-300",
        status === "away_pending" && "border-amber-400/50 bg-amber-950/40 text-amber-200",
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          status === "present" && "bg-emerald-500",
          status === "break" && "bg-amber-500",
          status === "away_pending" && "bg-amber-400 animate-pulse",
        )}
        aria-hidden
      />
      {label}
      {showCountdown ? ` (${awaySecondsLeft}s)` : null}
    </div>
  );
}
