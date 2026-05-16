import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";

export function AdminUserStatusPage() {
  const [statusUserId, setStatusUserId] = useState("");
  const [statusActive, setStatusActive] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function updateUserStatus(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api(apiPaths.adminUserStatus(statusUserId), {
        method: "PUT",
        body: JSON.stringify({ isActive: statusActive }),
      });
      setMsg(`User is now ${statusActive ? "active" : "inactive"}.`);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/admin/users">Directory</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Access control</span>
      </nav>
      <PageHeader
        kicker="Directory"
        title="Access"
        description="Flip the switch on an existing ID. Inactive users are blocked at login; nothing is deleted."
      />
      {msg && <div className="flash flash--success" role="status">{msg}</div>}
      {err && <div className="flash flash--error" role="alert">{err}</div>}
      <form className="card" onSubmit={updateUserStatus}>
        <label>
          User ID
          <input value={statusUserId} onChange={(e) => setStatusUserId(e.target.value)} placeholder="Paste UUID from directory" required />
        </label>
        <label>
          <input type="checkbox" checked={statusActive} onChange={(e) => setStatusActive(e.target.checked)} />
          Account active
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--secondary">Update status</button>
          <Link to="/admin/users" className="secondary-link">Back to directory</Link>
        </div>
      </form>
    </div>
  );
}
