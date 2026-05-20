import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { apiPaths } from "../../lib/apiPaths";
import { validateRequired } from "../../lib/fieldValidation";
import { WHATSAPP_DRAFT_PLACEHOLDERS, previewWhatsAppDraftBody } from "../../lib/whatsappDraft";
import { FormField } from "../../components/ui/FormField";
import { PageHeader } from "../../components/ui/PageHeader";

type DraftConfig = { body: string; isActive: boolean };

const QUERY_DEFAULT_BODY = `Hi {customerName},

Thank you for your enquiry (Ref: {queryId}).

— Frame team
{date} at {time}`;

const DESIGN_SHARED_DEFAULT_BODY = `Hi {customerName},

Your design preview for order {orderId} is ready. Please review and share your feedback.

— Frame team
{date} at {time}`;

const DISPATCH_DEFAULT_BODY = `Hi {customerName},

Your order {orderId} has been dispatched. Tracking ID: {trackingId}

— Frame team
{date} at {time}`;

const PRINT_DEFAULT_BODY = `Hi {customerName},

Update on your order {orderId}: print status is {printStage} (order status: {status}).

— Frame team
{date} at {time}`;

type DraftSectionProps = {
  title: string;
  description: string;
  activeLabel: string;
  savedMessage: string;
  defaultBody: string;
  apiPath: string;
  onError: (msg: string) => void;
};

function WhatsAppDraftSection({
  title,
  description,
  activeLabel,
  savedMessage,
  defaultBody,
  apiPath,
  onError,
}: DraftSectionProps) {
  const [body, setBody] = useState(defaultBody);
  const [isActive, setIsActive] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [bodyError, setBodyError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      onError("");
      try {
        const cfg = await api<DraftConfig>(apiPath);
        if (cancelled) return;
        if (cfg.body?.trim()) setBody(cfg.body);
        setIsActive(cfg.isActive);
      } catch (e) {
        if (!cancelled) onError((e as Error).message);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiPath, onError]);

  async function saveDraft(e: FormEvent) {
    e.preventDefault();
    onError("");
    setMsg("");
    const bodyErr = validateRequired(body, "Message body");
    if (bodyErr) {
      setBodyError(bodyErr);
      onError(bodyErr);
      return;
    }
    setBodyError("");
    setSaving(true);
    try {
      const cfg = await api<DraftConfig>(apiPath, {
        method: "PUT",
        body: JSON.stringify({ body: body.trim(), isActive }),
      });
      setBody(cfg.body);
      setIsActive(cfg.isActive);
      setMsg(savedMessage);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const preview = previewWhatsAppDraftBody(body);

  return (
    <form className="card" onSubmit={saveDraft} noValidate>
      <h3>{title}</h3>
      <p className="muted small">{description}</p>
      {msg && <DraftSuccessFlash msg={msg} />}
      <FormField label="Message body" required error={bodyError}>
        <textarea
          className="textarea"
          rows={8}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (bodyError) setBodyError("");
          }}
          disabled={!loaded || saving}
          placeholder={defaultBody}
          aria-invalid={!!bodyError}
        />
      </FormField>
      <label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={!loaded || saving}
        />
        {activeLabel}
      </label>
      <div className="card card--muted">
        <h4>Preview (sample data, live date/time)</h4>
        <pre className="whatsapp-draft-preview">{preview}</pre>
      </div>
      <button type="submit" className="btn btn--primary" disabled={!loaded || saving}>
        {saving ? "Saving…" : "Save draft"}
      </button>
    </form>
  );
}

function DraftSuccessFlash({ msg }: { msg: string }) {
  return (
    <div className="flash flash--success" role="status">
      {msg}
    </div>
  );
}

export function AdminWhatsAppDraftPage() {
  const [err, setErr] = useState("");

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>WhatsApp draft</span>
      </nav>
      <PageHeader
        kicker="Customer comms"
        title="WhatsApp message drafts"
        description="Pre-filled WhatsApp messages for enquiries, design preview, print updates, and dispatch tracking. Date and time are filled when someone opens WhatsApp."
      />
      {err && <div className="flash flash--error" role="alert">{err}</div>}

      <div className="card card--muted">
        <h4>Placeholders</h4>
        <ul className="muted small" style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {WHATSAPP_DRAFT_PLACEHOLDERS.map((p) => (
            <li key={p.token}>
              <code>{p.token}</code> — {p.desc}
            </li>
          ))}
        </ul>
      </div>

      <WhatsAppDraftSection
        title="Executive enquiry draft"
        description="Used when executives tap WhatsApp on a customer query."
        activeLabel="Draft active (executives can open WhatsApp with this message)"
        savedMessage="Enquiry draft saved. Executives will see this message when they tap WhatsApp on a query."
        defaultBody={QUERY_DEFAULT_BODY}
        apiPath={apiPaths.adminWhatsAppDraft}
        onError={setErr}
      />

      <WhatsAppDraftSection
        title="Design shared with customer (DESIGN_SHARED_WITH_CUSTOMER)"
        description="Used when designers tap WhatsApp on the preview step after uploading a design. {orderId} is the order reference."
        activeLabel="Draft active (designers can open WhatsApp with this message on preview upload)"
        savedMessage="Design-shared draft saved. Designers will see this message when they tap WhatsApp on a preview."
        defaultBody={DESIGN_SHARED_DEFAULT_BODY}
        apiPath={apiPaths.adminWhatsAppDesignSharedDraft}
        onError={setErr}
      />

      <WhatsAppDraftSection
        title="Print / production (fulfillment step 1)"
        description="Used when admins tap WhatsApp on the Print card in fulfillment. {status} and {printStage} come from the order."
        activeLabel="Draft active (admins can open WhatsApp with this message on the print step)"
        savedMessage="Print draft saved. Admins will see this message when they tap WhatsApp on fulfillment step 1."
        defaultBody={PRINT_DEFAULT_BODY}
        apiPath={apiPaths.adminWhatsAppPrintDraft}
        onError={setErr}
      />

      <WhatsAppDraftSection
        title="Dispatch / tracking (fulfillment step 3)"
        description="Used when admins tap WhatsApp on Production & dispatch. {trackingId} comes from the tracking field or the saved order."
        activeLabel="Draft active (admins can open WhatsApp with this message on dispatch)"
        savedMessage="Dispatch draft saved. Admins will see this message when they tap WhatsApp on fulfillment."
        defaultBody={DISPATCH_DEFAULT_BODY}
        apiPath={apiPaths.adminWhatsAppDispatchDraft}
        onError={setErr}
      />
    </div>
  );
}
