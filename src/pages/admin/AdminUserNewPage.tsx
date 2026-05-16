import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";

export function AdminUserNewPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EXECUTIVE");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api<{ id: string; username: string }>(apiPaths.adminUsers, {
        method: "POST",
        body: JSON.stringify({ username, password, role }),
      });
      setMsg("User created.");
      navigate("/admin/users");
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/admin/users">Directory</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Add user</span>
      </nav>
      <PageHeader
        kicker="Directory"
        title="New account"
        description="Executive or Designer login. Share the password out-of-band — it is not emailed from here."
      />
      {msg && <div className="flash flash--success" role="status">{msg}</div>}
      {err && <div className="flash flash--error" role="alert">{err}</div>}
      <form className="card" onSubmit={createUser}>
        <div className="field-grid field-grid--2">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" required />
          </label>
          <label>
            Temporary password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required />
          </label>
        </div>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>EXECUTIVE</option>
            <option>DESIGNER</option>
          </select>
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary">Create user</button>
          <Link to="/admin/users" className="secondary-link">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
