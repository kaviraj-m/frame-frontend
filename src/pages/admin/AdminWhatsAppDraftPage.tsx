import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { validateRequired } from "@/lib/fieldValidation";
import { WHATSAPP_DRAFT_PLACEHOLDERS, previewWhatsAppDraftBody } from "@/lib/whatsappDraft";
import { FormField } from "@/components/ui/FormField";
import { PageHeader } from "@/components/ui/PageHeader";
import { BRAND_WHATSAPP_SIGNOFF } from "@/lib/brand";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DraftConfig = { body: string; isActive: boolean };

const QUERY_DEFAULT_BODY = `Hi {customerName},

Thank you for confirming your order (Ref: {orderId}).

${BRAND_WHATSAPP_SIGNOFF}
{date} at {time}`;

const DESIGN_SHARED_DEFAULT_BODY = `Hi {customerName},

Your design preview for order {orderId} is ready. Please review and share your feedback.

${BRAND_WHATSAPP_SIGNOFF}
{date} at {time}`;

const DISPATCH_DEFAULT_BODY = `Hi {customerName},

Your order {orderId} has been dispatched. Tracking ID: {trackingId}

${BRAND_WHATSAPP_SIGNOFF}
{date} at {time}`;

const PRINT_DEFAULT_BODY = `Hi {customerName},

Update on your order {orderId}: print status is {printStage} (order status: {status}).

${BRAND_WHATSAPP_SIGNOFF}
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
    <Card>
      <form className="space-y-4" onSubmit={saveDraft} noValidate>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
        {msg && (
          <Alert variant="success" role="status">
            <AlertDescription>{msg}</AlertDescription>
          </Alert>
        )}
        <FormField label="Message body" required error={bodyError}>
          <Textarea
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
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={!loaded || saving}
          />
          {activeLabel}
        </label>
        <Card muted>
          <h4 className="text-sm font-semibold mb-2">Preview (sample data, live date/time)</h4>
          <pre className="text-xs whitespace-pre-wrap font-mono bg-background/50 p-3 rounded-md border border-border">
            {preview}
          </pre>
        </Card>
        <Button type="submit" disabled={!loaded || saving}>
          {saving ? "Saving…" : "Save draft"}
        </Button>
      </form>
    </Card>
  );
}

export function AdminWhatsAppDraftPage() {
  const [err, setErr] = useState("");

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <nav className="breadcrumb text-sm">
        <Link to="/admin/users">Admin</Link>
        <span className="breadcrumb-sep">/</span>
        <span>WhatsApp draft</span>
      </nav>
      <PageHeader
        kicker="Customer comms"
        title="WhatsApp message drafts"
        description="Pre-filled WhatsApp messages for enquiries, design preview, print updates, and dispatch tracking. Date and time are filled when someone opens WhatsApp."
      />
      {err && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <Card muted>
        <h4 className="text-sm font-semibold mb-2">Placeholders</h4>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
          {WHATSAPP_DRAFT_PLACEHOLDERS.map((p) => (
            <li key={p.token}>
              <code className="font-mono">{p.token}</code> — {p.desc}
            </li>
          ))}
        </ul>
      </Card>

      <WhatsAppDraftSection
        title="Executive order confirmed draft"
        description="Used when executives tap WhatsApp on an order with status ORDER_CONFIRMED. {orderId} is the order reference."
        activeLabel="Draft active (executives can open WhatsApp with this message on confirmed orders)"
        savedMessage="Order-confirmed draft saved. Executives will see this message when they tap WhatsApp on a confirmed order."
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
