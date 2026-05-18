import { useSmartAttendanceContext } from "../context/SmartAttendanceContext";

const STATUS_LABEL: Record<string, string> = {
  idle: "",
  on_clock: "On the clock",
  on_break: "On break",
  away_warning: "Away — attendance stops soon",
  stopped_tab: "Attendance stopped (left tab)",
};

export function SmartAttendanceBanner() {
  const { status, awaySecondsLeft } = useSmartAttendanceContext();
  if (status === "idle") return null;

  const label = STATUS_LABEL[status] ?? "";
  const showCountdown = status === "away_warning" && awaySecondsLeft != null;

  return (
    <div
      className={`smart-attendance-banner smart-attendance-banner--${status}`}
      role="status"
      aria-live="polite"
    >
      <span className="smart-attendance-banner__dot" aria-hidden />
      {label}
      {showCountdown ? ` (${awaySecondsLeft}s)` : null}
    </div>
  );
}
