/** Mirrors backend placeholders in `internal/core/whatsapp.go`. */
export const WHATSAPP_DRAFT_PLACEHOLDERS = [
  { token: "{customerName}", desc: "Customer name from the query" },
  { token: "{customerPhone}", desc: "Customer phone number" },
  { token: "{customerEmail}", desc: "Customer email (or —)" },
  { token: "{queryId}", desc: "Query reference ID" },
  { token: "{orderId}", desc: "Order ID" },
  { token: "{trackingId}", desc: "Courier tracking ID (dispatch draft; from field or saved order)" },
  { token: "{status}", desc: "Order status (print draft)" },
  { token: "{printStage}", desc: "Print stage (print draft; or —)" },
  { token: "{remarks}", desc: "Latest remarks on the query" },
  { token: "{date}", desc: "Current date when the executive opens WhatsApp" },
  { token: "{time}", desc: "Current time when the executive opens WhatsApp" },
  { token: "{dateTime}", desc: "Current date and time combined" },
] as const;

const LOCALE = "en-US";
const TIMEZONE = "Asia/Kolkata";

function sampleNow(): Date {
  return new Date();
}

/** Client-side preview for the admin editor (approximates server rendering). */
export function previewWhatsAppDraftBody(template: string): string {
  const now = sampleNow();
  const date = now.toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString(LOCALE, {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateTime = now.toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  let body = template.trim() || "Hi {customerName},\n\n(Ref: {queryId})\n{date} at {time}";
  const repl: Record<string, string> = {
    "{customerName}": "Sample Customer",
    "{customerPhone}": "+91 98765 43210",
    "{customerEmail}": "customer@example.com",
    "{queryId}": "qry-sample-001",
    "{orderId}": "ord-sample-001",
    "{trackingId}": "TRK-SAMPLE-001",
    "{status}": "IN_PRINT",
    "{printStage}": "DONE",
    "{remarks}": "12×18 wooden frame, matte finish",
    "{date}": date,
    "{time}": time,
    "{dateTime}": dateTime,
  };
  for (const [k, v] of Object.entries(repl)) {
    body = body.split(k).join(v);
  }
  return body;
}
