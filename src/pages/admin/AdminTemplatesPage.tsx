import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";

export function AdminTemplatesPage() {
  const [templateUseCase, setTemplateUseCase] = useState("ORDER_CONFIRMED");
  const [templateBody, setTemplateBody] = useState("Hi {customerName}, order {orderId} is {status}");
  const [templateRecipient, setTemplateRecipient] = useState("CUSTOM");
  const [templateActive, setTemplateActive] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function createTemplate(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const out = await api<{ id: string }>(apiPaths.adminTemplates, {
        method: "POST",
        body: JSON.stringify({
          useCase: templateUseCase,
          body: templateBody,
          recipientType: templateRecipient,
          isActive: templateActive,
        }),
      });
      setMsg(`Template created. ID: ${out.id}`);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Templates</span>
      </nav>
      <PageHeader
        kicker="Comms"
        title="Templates"
        description="Snippets for manual sends. Tokens like {orderId} fill in when the message is generated."
      />
      {msg && <div className="flash flash--success" role="status">{msg}</div>}
      {err && <div className="flash flash--error" role="alert">{err}</div>}
      <form className="card" onSubmit={createTemplate}>
        <label>
          Use case / trigger
          <input value={templateUseCase} onChange={(e) => setTemplateUseCase(e.target.value)} />
        </label>
        <label>
          Body
          <textarea className="textarea" rows={5} value={templateBody} onChange={(e) => setTemplateBody(e.target.value)} />
        </label>
        <label>
          Recipient type
          <select value={templateRecipient} onChange={(e) => setTemplateRecipient(e.target.value)}>
            <option>CUSTOM</option>
            <option>EXECUTIVE</option>
            <option>DESIGNER</option>
            <option>ADMIN</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={templateActive} onChange={(e) => setTemplateActive(e.target.checked)} />
          Template active
        </label>
        <button type="submit" className="btn btn--primary">Create template</button>
      </form>
    </div>
  );
}
