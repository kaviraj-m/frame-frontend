import { useAttendancePanel } from "../hooks/useAttendancePanel";
import type { AttendanceApiPrefix } from "../lib/attendanceTypes";

export function AttendancePanel({ apiPrefix }: { apiPrefix: AttendanceApiPrefix }) {
  const { attendanceId, breakId, msg, error, startAttendance, endAttendance, startBreak, endBreak } =
    useAttendancePanel(apiPrefix);

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Clock in & out</h3>
          <p className="muted attendance-panel__lead">
            Start when you arrive, pause for breaks, end when you leave. Break minutes do not count toward hours.
          </p>
        </div>
      </div>
      {msg && <div className="flash flash--success" role="status">{msg}</div>}
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      <dl className="kv attendance-panel__ids">
        <dt>Session</dt>
        <dd><span className="mono">{attendanceId || "—"}</span></dd>
        <dt>Active break</dt>
        <dd><span className="mono">{breakId || "—"}</span></dd>
      </dl>
      <div className="inline-actions attendance-panel__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={startAttendance}>
          Start attendance
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={endAttendance} disabled={!attendanceId}>
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
