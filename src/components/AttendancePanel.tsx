import { useSmartAttendanceContext } from "../context/SmartAttendanceContext";

export function AttendancePanel() {
  const {
    attendanceId,
    breakId,
    status,
    awaySecondsLeft,
    msg,
    error,
    hydrated,
    startAttendance,
    endAttendance,
    startBreak,
    endBreak,
  } = useSmartAttendanceContext();

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Clock in &amp; out</h3>
          <p className="muted attendance-panel__lead">
            Start when you begin work. If you switch away from this tab for more than 30 seconds, attendance
            ends automatically. Use break when you pause; break time is excluded from hours.
          </p>
        </div>
      </div>
      {!hydrated && <p className="muted">Loading attendance state…</p>}
      {status !== "idle" && (
        <p className="smart-attendance-panel-status" role="status">
          {status === "away_warning" && awaySecondsLeft != null
            ? `Tab hidden — attendance stops in ${awaySecondsLeft}s unless you return.`
            : status === "on_break"
              ? "You are on break."
              : status === "on_clock"
                ? "You are on the clock."
                : status === "stopped_tab"
                  ? "Session ended because the tab was hidden too long. Start again when you return."
                  : null}
        </p>
      )}
      {msg && (
        <div className="flash flash--success" role="status">
          {msg}
        </div>
      )}
      {error && (
        <div className="flash flash--error" role="alert">
          {error}
        </div>
      )}
      <dl className="kv attendance-panel__ids">
        <dt>Session</dt>
        <dd>
          <span className="mono">{attendanceId || "—"}</span>
        </dd>
        <dt>Active break</dt>
        <dd>
          <span className="mono">{breakId || "—"}</span>
        </dd>
      </dl>
      <div className="inline-actions attendance-panel__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={startAttendance} disabled={!hydrated}>
          Start attendance
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={endAttendance}
          disabled={!attendanceId}
        >
          End attendance
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={startBreak} disabled={!attendanceId}>
          Start break
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={endBreak} disabled={!breakId}>
          End break
        </button>
      </div>
    </div>
  );
}
