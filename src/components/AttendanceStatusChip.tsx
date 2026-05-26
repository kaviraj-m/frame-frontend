import { useSmartAttendanceContext } from "@/context/SmartAttendanceContext";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  offline: "Offline",
  present: "Present",
  idle: "Idle",
  break: "On break",
};

export function AttendanceStatusChip() {
  const { status, error, hydrated } = useSmartAttendanceContext();
  if (!hydrated || status === "offline") return null;

  const label = STATUS_LABEL[status] ?? status;

  return (
    <div className="mb-4 flex flex-col gap-1">
      <div
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
          status === "present" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
          status === "idle" && "border-sky-500/40 bg-sky-500/10 text-sky-300",
          status === "break" && "border-amber-500/40 bg-amber-500/10 text-amber-300",
        )}
        role="status"
        aria-live="polite"
      >
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            status === "present" && "bg-emerald-500",
            status === "idle" && "bg-sky-500",
            status === "break" && "bg-amber-500",
          )}
          aria-hidden
        />
        {label}
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          Attendance: {error}
        </p>
      ) : null}
    </div>
  );
}
