import type { ShippingFromAddress, ShippingLabelParty } from "./shippingFromTypes";
import { isShippingFromConfigured } from "./shippingFromTypes";

export type PrintShippingLabelInput = {
  orderId: string;
  from: ShippingFromAddress;
  to: ShippingLabelParty;
};

export type LabelDensityTier = "normal" | "compact" | "tight";

/** Estimate how many printed lines an address will occupy (explicit breaks + wrap). */
export function estimateAddressLineCount(address: string): number {
  const trimmed = address.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const charsPerLine = 18;
  let total = 0;
  for (const part of parts) {
    total += Math.max(1, Math.ceil(part.length / charsPerLine));
  }
  return total;
}

/** Lines per block: name, phone, pincode + wrapped address lines. */
export function estimateBlockLineCount(party: ShippingLabelParty): number {
  return 3 + estimateAddressLineCount(party.address);
}

/** Pick label typography tier from combined from+to content volume. */
export function resolveLabelDensityTier(from: ShippingLabelParty, to: ShippingLabelParty): LabelDensityTier {
  const fromLines = estimateBlockLineCount(from);
  const toLines = estimateBlockLineCount(to);
  const totalLines = fromLines + toLines;
  const maxAddrLines = Math.max(estimateAddressLineCount(from.address), estimateAddressLineCount(to.address));
  const totalChars =
    from.address.length +
    to.address.length +
    from.name.length +
    to.name.length +
    (from.pincode?.length ?? 0) +
    (to.pincode?.length ?? 0);

  if (totalLines >= 16 || maxAddrLines >= 6 || totalChars >= 220) return "tight";
  if (totalLines >= 10 || maxAddrLines >= 4 || totalChars >= 120) return "compact";
  return "normal";
}

/** Min/max scale multipliers applied after measuring free space on the label. */
export const LABEL_DENSITY_SCALE: Record<LabelDensityTier, { min: number; max: number }> = {
  normal: { min: 1, max: 1.55 },
  compact: { min: 0.88, max: 1.3 },
  tight: { min: 0.72, max: 1.08 },
};

export const SHIPPING_LABEL_FIT_SCRIPT = `
function fitLabelScale() {
  var label = document.querySelector(".label");
  if (!label) return;
  var min = parseFloat(label.getAttribute("data-scale-min") || "0.8");
  var max = parseFloat(label.getAttribute("data-scale-max") || "1.4");
  function labelOverflows() {
    if (label.scrollHeight > label.clientHeight + 2) return true;
    var main = label.querySelector(".label-main");
    if (main && main.scrollHeight > main.clientHeight + 2) return true;
    var sections = label.querySelector(".sections");
    if (sections && sections.scrollHeight > sections.clientHeight + 2) return true;
    return false;
  }
  var lo = min, hi = max, best = min;
  for (var i = 0; i < 14; i++) {
    var mid = (lo + hi) / 2;
    label.style.setProperty("--label-scale", String(mid));
    if (labelOverflows()) {
      hi = mid;
    } else {
      best = mid;
      lo = mid;
    }
  }
  label.style.setProperty("--label-scale", String(best));
}
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFooter(footer: string): string {
  const trimmed = footer.trim();
  if (!trimmed) return "";
  return escapeHtml(trimmed).replace(/\n/g, "<br/>");
}

function formatFooterBlock(footer: string | undefined): string {
  const html = formatFooter(footer ?? "");
  if (!html) return "";
  return `<p class="label-footer">${html}</p>`;
}

function formatPincodeLabel(pincode: string): string {
  const p = pincode.trim();
  return p ? `Pincode : ${p}` : "Pincode : —";
}

function formatBlock(title: string, party: ShippingLabelParty, side: "from" | "to"): string {
  const entries = [
    escapeHtml(party.name || "—"),
    escapeHtml(party.phone || "—"),
    escapeHtml(party.address || "—").replace(/\n/g, "<br/>"),
    escapeHtml(formatPincodeLabel(party.pincode ?? "")),
  ];
  return `
    <section class="block block-${side}">
      <h2>${escapeHtml(title)}</h2>
      <div class="lines">
        ${entries.map((text) => `<p class="line-detail">${text}</p>`).join("")}
      </div>
    </section>`;
}

/**
 * Fills the entire printed page (A6 when selected in the print dialog, or full sheet otherwise).
 * Uses viewport units so content scales with paper size instead of staying a small mm box.
 */
export const SHIPPING_LABEL_PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .label {
    --label-scale: 1;
    width: 100%;
    height: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: calc(4vh * var(--label-scale)) calc(5vw * var(--label-scale)) calc(5vh * var(--label-scale));
    display: flex;
    flex-direction: column;
  }
  .order-id {
    flex: 0 0 auto;
    max-height: 18vh;
    padding-bottom: calc(1vh * var(--label-scale));
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: calc(clamp(15pt, 6vw, 32pt) * var(--label-scale));
    font-weight: 800;
    text-align: center;
    word-break: break-word;
    line-height: 1.1;
  }
  .label-main {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .sections {
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: calc(1.6vh * var(--label-scale));
  }
  .block {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    flex: 0 0 auto;
    width: 48%;
    max-width: 48%;
  }
  .block-from {
    align-self: flex-start;
  }
  .block-to {
    align-self: flex-end;
    margin-left: auto;
  }
  .block h2 {
    font-size: calc(clamp(16pt, 5.5vw, 34pt) * var(--label-scale));
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: calc(0.7vh * var(--label-scale));
    font-weight: 800;
    flex: 0 0 auto;
  }
  .lines {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: calc(0.45vh * var(--label-scale));
  }
  .lines p {
    font-size: calc(clamp(10pt, 3.2vw, 20pt) * var(--label-scale));
    line-height: 1.35;
    font-weight: 600;
    word-break: break-word;
  }
  .label-spacer {
    flex: 1 1 auto;
    min-height: 0;
  }
  .label.has-footer .label-spacer {
    min-height: calc(0.8vh * var(--label-scale));
  }
  .label-footer {
    flex: 0 0 auto;
    padding-top: calc(1.2vh * var(--label-scale));
    text-align: center;
    font-size: calc(clamp(10pt, 3.2vw, 17pt) * var(--label-scale));
    line-height: 1.35;
    font-weight: 600;
    word-break: break-word;
  }
  @page {
    size: A6 portrait;
    margin: 0;
  }
  @media print {
    html, body, .label {
      width: 100%;
      height: 100%;
      min-height: 100%;
    }
    .label {
      page-break-after: avoid;
      page-break-inside: avoid;
    }
  }
`;

export type BuildShippingLabelOptions = {
  /** When true (default), auto-opens the browser print dialog on load. */
  autoPrint?: boolean;
};

/** Map list/fulfillment order fields to the shipping label recipient block. */
export function shippingLabelPartyFromOrder(order: {
  customerUsername?: string;
  customerPhoneNumber?: string;
  addressDetails?: string;
  pincode?: string;
}): ShippingLabelParty {
  return {
    name: order.customerUsername?.trim() ?? "",
    phone: order.customerPhoneNumber?.trim() ?? "",
    address: order.addressDetails?.trim() ?? "",
    pincode: order.pincode?.trim() ?? "",
  };
}

/** Export for tests. */
export function buildShippingLabelHtml(
  { orderId, from, to }: PrintShippingLabelInput,
  options?: BuildShippingLabelOptions,
): string {
  const autoPrint = options?.autoPrint !== false;
  const order = escapeHtml(orderId);
  const density = resolveLabelDensityTier(from, to);
  const scale = LABEL_DENSITY_SCALE[density];
  const footerHtml = formatFooterBlock(from.labelFooter);
  const hasFooter = footerHtml.trim() !== "";
  const onLoad = autoPrint
    ? `window.addEventListener("load", function () {
      fitLabelScale();
      setTimeout(function () {
        window.focus();
        window.print();
      }, 150);
    });`
    : "window.addEventListener(\"load\", fitLabelScale);";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Shipping label ${order}</title>
  <style>${SHIPPING_LABEL_PRINT_CSS}</style>
</head>
<body>
  <div class="label density-${density}${hasFooter ? " has-footer" : ""}" data-scale-min="${scale.min}" data-scale-max="${scale.max}">
    <p class="order-id">Order ${order}</p>
    <div class="label-main">
      <div class="sections">
        ${formatBlock("From", from, "from")}
        ${formatBlock("To", to, "to")}
      </div>
      <div class="label-spacer" aria-hidden="true"></div>
      ${footerHtml}
    </div>
  </div>
  <script>
    ${SHIPPING_LABEL_FIT_SCRIPT}
    ${onLoad}
  </script>
</body>
</html>`;
}

export function canPrintShippingLabel(
  from: ShippingFromAddress | null | undefined,
  to: ShippingLabelParty,
): boolean {
  if (!isShippingFromConfigured(from)) return false;
  return to.name.trim() !== "" && to.address.trim() !== "";
}

function printViaHiddenIframe(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Shipping label print");
  iframe.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;border:0;opacity:0;pointer-events:none;z-index:-1";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    throw new Error("Could not open print preview.");
  }

  iframe.srcdoc = html;

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };

  const removeFrame = () => {
    if (iframe.parentNode) iframe.remove();
  };

  iframe.onload = () => runPrint();
  setTimeout(runPrint, 600);
  win.addEventListener("afterprint", removeFrame, { once: true });
  setTimeout(removeFrame, 120_000);
}

/** A6 portrait at 96 DPI — used for client-side PDF rasterization. */
export const SHIPPING_LABEL_PDF_VIEWPORT = { widthPx: 397, heightPx: 559 } as const;

/** Saves label as A6 PDF (generated in the browser from the same HTML layout as print). */
export async function downloadShippingLabel(input: PrintShippingLabelInput): Promise<void> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const html = buildShippingLabelHtml(input, { autoPrint: false });
  const { widthPx, heightPx } = SHIPPING_LABEL_PDF_VIEWPORT;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Shipping label PDF");
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${widthPx}px;height:${heightPx}px;border:0;opacity:0;pointer-events:none`;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      throw new Error("Could not prepare label for PDF export.");
    }

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      setTimeout(resolve, 400);
    });

    const fitScript = doc.createElement("script");
    fitScript.textContent = `${SHIPPING_LABEL_FIT_SCRIPT}\nfitLabelScale();\nfitLabelScale();`;
    doc.body.appendChild(fitScript);
    await new Promise((resolve) => setTimeout(resolve, 200));

    const labelEl = doc.querySelector(".label");
    if (!labelEl || !(labelEl instanceof win.HTMLElement)) {
      throw new Error("Could not render shipping label.");
    }

    const canvas = await html2canvas(labelEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      width: widthPx,
      height: heightPx,
      windowWidth: widthPx,
      windowHeight: heightPx,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a6" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 105, 148);
    pdf.save(`shipping-label-${input.orderId.replace(/[^\w.-]+/g, "_")}.pdf`);
  } finally {
    iframe.remove();
  }
}

/** Opens print dialog; label HTML fills the selected paper size (choose A6, 100% scale, no headers). */
export function printShippingLabel(input: PrintShippingLabelInput): void {
  const html = buildShippingLabelHtml(input, { autoPrint: true });
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    printViaHiddenIframe(html);
    return;
  }

  const cleanup = () => URL.revokeObjectURL(url);
  win.addEventListener("load", cleanup, { once: true });
  setTimeout(cleanup, 60_000);
  win.addEventListener("afterprint", () => {
    cleanup();
    win.close();
  }, { once: true });
}
