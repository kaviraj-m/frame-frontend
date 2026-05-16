import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { PageHeader } from "../../components/ui/PageHeader";

export function AdminNotifyPage() {
  const [notifyOrderId, setNotifyOrderId] = useState("");
  const [notifyTemplateId, setNotifyTemplateId] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function triggerNotify(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const out = await api<{ redirectUrl: string }>(apiPaths.adminOrderManualNotify(notifyOrderId), {
        method: "POST",
        body: JSON.stringify({ templateId: notifyTemplateId }),
      });
      setMsg(out.redirectUrl);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Manual notify</span>
      </nav>
      <PageHeader
        kicker="Messaging"
        title="Manual notify"
        description="Builds a one-off link you can paste into WhatsApp, SMS, or email. You still send the message yourself."
      />
      {msg ? (
        <div className="flash flash--success" role="status">
          <strong>Redirect URL</strong>
          <div className="mono copy-block">{msg}</div>
        </div>
      ) : null}
      {err && <div className="flash flash--error" role="alert">{err}</div>}
      <form className="card" onSubmit={triggerNotify}>
        <div className="field-grid field-grid--2">
          <label>
            Order ID
            <input value={notifyOrderId} onChange={(e) => setNotifyOrderId(e.target.value)} required />
          </label>
          <label>
            Template ID
            <input value={notifyTemplateId} onChange={(e) => setNotifyTemplateId(e.target.value)} required />
          </label>
        </div>
        <button type="submit" className="btn btn--secondary">Generate redirect</button>
      </form>
    </div>
  );
}
