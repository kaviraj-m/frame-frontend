import type { ShippingFromAddress, ShippingLabelParty } from "./shippingFromTypes";
import { isShippingFromConfigured } from "./shippingFromTypes";

export type PrintShippingLabelInput = {
  orderId: string;
  from: ShippingFromAddress;
  to: ShippingLabelParty;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBlock(title: string, party: ShippingLabelParty): string {
  const lines = [
    escapeHtml(party.name || "—"),
    escapeHtml(party.phone || "—"),
    escapeHtml(party.address || "—").replace(/\n/g, "<br/>"),
    escapeHtml(party.pincode || "—"),
  ];
  return `
    <section class="block">
      <h2>${escapeHtml(title)}</h2>
      <div class="lines">
        ${lines.map((l) => `<p>${l}</p>`).join("")}
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
    width: 100%;
    height: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 5vh 6vw 6vh;
    display: flex;
    flex-direction: column;
  }
  .order-id {
    flex: 0 0 20vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-monospace, "Courier New", monospace;
    font-size: clamp(22pt, 9vw, 36pt);
    font-weight: 800;
    text-align: center;
    border-bottom: 0.5vh solid #000;
    word-break: break-word;
    line-height: 1.1;
    padding-bottom: 2vh;
  }
  .sections {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 0;
    gap: 2vh;
    padding-top: 2vh;
  }
  .block {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 0;
  }
  .block h2 {
    font-size: clamp(14pt, 5vw, 22pt);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 2.5vh;
    font-weight: 800;
    border-bottom: 0.35vh solid #000;
    padding-bottom: 1.5vh;
  }
  .lines {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    gap: 1.5vh;
  }
  .lines p {
    font-size: clamp(16pt, 5.5vw, 26pt);
    line-height: 1.4;
    font-weight: 600;
    word-break: break-word;
  }
  .divider {
    flex: 0 0 auto;
    border-top: 0.4vh dashed #333;
    margin: 1vh 0;
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

/** Export for tests. */
export function buildShippingLabelHtml({ orderId, from, to }: PrintShippingLabelInput): string {
  const order = escapeHtml(orderId);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Shipping label ${order}</title>
  <style>${SHIPPING_LABEL_PRINT_CSS}</style>
</head>
<body>
  <div class="label">
    <p class="order-id">Order ${order}</p>
    <div class="sections">
      ${formatBlock("From", from)}
      <div class="divider" aria-hidden="true"></div>
      ${formatBlock("To", to)}
    </div>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 150);
    });
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

/** Opens print dialog; label HTML fills the selected paper size (choose A6, 100% scale, no headers). */
export function printShippingLabel(input: PrintShippingLabelInput): void {
  const html = buildShippingLabelHtml(input);
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
