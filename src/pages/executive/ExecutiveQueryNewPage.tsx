import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";

export function ExecutiveQueryNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function createQuery(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      await api(apiPaths.executiveQueries, {
        method: "POST",
        body: JSON.stringify({
          customerUsername: name,
          customerPhoneNumber: phone,
          customerEmail: email.trim(),
          remarks,
        }),
      });
      setStatus("Query created successfully.");
      navigate("/executive/queries");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/executive/queries">Queries</Link>
        <span className="breadcrumb-sep">/</span>
        <span>New query</span>
      </nav>
      <PageHeader
        kicker="New lead"
        title="Log a query"
        description="Name, phone, email (optional), and a short note. You will get a stable ID to track until they pay and confirm."
      />
      {status && <div className="flash flash--success" role="status">{status}</div>}
      {error && <div className="flash flash--error" role="alert">{error}</div>}
      <form className="card" onSubmit={createQuery}>
        <div className="field-grid field-grid--3">
          <label>
            Customer name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Username or display name" required />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" required />
          </label>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </label>
        </div>
        <label>
          Initial remarks
          <textarea className="textarea" rows={4} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Requirement notes, source, next step…" />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary">Create query</button>
          <Link to="/executive/queries" className="secondary-link">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
