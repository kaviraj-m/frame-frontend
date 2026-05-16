import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataBoardSearchIcon } from "../../components/ui/DataBoardSearchIcon";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";

export function AdminAttendanceReportPage() {
  const [attendanceReport, setAttendanceReport] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  async function loadAttendanceReport() {
    setErr("");
    setMsg("");
    try {
      const out = await api<Record<string, number>>(apiPaths.adminAttendanceReport);
      setAttendanceReport(out);
      setMsg("Report loaded.");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const entries = useMemo(() => Object.entries(attendanceReport), [attendanceReport]);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(([userId]) => userId.toLowerCase().includes(q));
  }, [entries, search]);

  return (
    <div className="data-board">
      <nav className="breadcrumb" style={{ marginBottom: 12 }}>
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Attendance report</span>
      </nav>
      <div className="data-board__toolbar">
        <div className="data-board__search-wrap">
          <span className="data-board__search-icon">
            <DataBoardSearchIcon />
          </span>
          <input
            className="data-board__search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by user ID…"
            aria-label="Filter report"
          />
        </div>
        <div className="data-board__toolbar-actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={loadAttendanceReport}>
            Load report
          </button>
        </div>
      </div>
      {msg && <div className="flash flash--success" role="status">{msg}</div>}
      {err && <div className="flash flash--error" role="alert">{err}</div>}
      <div className="table-wrap table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th className="td-actions">Hours</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(([userId, hours]) => (
              <tr key={userId}>
                <td className="td-mono td-muted-id">{userId}</td>
                <td className="td-actions td-strong">{hours.toFixed(2)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="empty-row">
                <td colSpan={2}>
                  {entries.length === 0 ? "No data. Choose Load report." : "No rows match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-footer">
          <p className="total-info">
            Showing <strong>{filtered.length}</strong> entr
            {filtered.length === 1 ? "y" : "ies"}
            {search.trim() ? ` (of ${entries.length})` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
