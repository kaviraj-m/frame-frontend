import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { isShippingFromConfigured } from "@/lib/shippingFromTypes";
import type { ShippingFromAddress } from "@/lib/shippingFromTypes";
import {
  canPrintShippingLabel,
  downloadShippingLabel,
  printShippingLabel,
  shippingLabelPartyFromOrder,
} from "@/lib/printShippingLabel";

export type ShippingLabelOrderFields = {
  customerUsername?: string;
  customerPhoneNumber?: string;
  addressDetails?: string;
  pincode?: string;
};

export type ShippingLabelActionDialogProps = {
  open: boolean;
  orderId: string;
  order: ShippingLabelOrderFields | null;
  shippingFrom: ShippingFromAddress | null;
  shippingFromLoaded: boolean;
  roleLabel: "Admin" | "Executive";
  onClose: () => void;
  onError?: (message: string) => void;
};

export function ShippingLabelActionDialog({
  open,
  orderId,
  order,
  shippingFrom,
  shippingFromLoaded,
  roleLabel,
  onClose,
  onError,
}: ShippingLabelActionDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const to = order ? shippingLabelPartyFromOrder(order) : null;
  const configured = isShippingFromConfigured(shippingFrom);
  const ready = shippingFromLoaded && !!to && canPrintShippingLabel(shippingFrom, to);

  function runPrint() {
    if (!shippingFrom || !to) return;
    try {
      printShippingLabel({ orderId, from: shippingFrom, to });
      onClose();
    } catch (e) {
      onError?.((e as Error).message);
    }
  }

  async function runDownload() {
    if (!shippingFrom || !to) return;
    setDownloading(true);
    try {
      await downloadShippingLabel({ orderId, from: shippingFrom, to });
      onClose();
    } catch (e) {
      onError?.((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(visible) => !visible && onClose()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={onClose}>
        <DialogHeader>
          <DialogTitle>Shipping label</DialogTitle>
          <DialogDescription>
            Order <span className="font-mono">{orderId}</span>. Print opens the label in a new tab (choose A6 paper,
            turn off headers and footers). Download saves an A6 PDF generated in your browser.
          </DialogDescription>
        </DialogHeader>

        {!shippingFromLoaded ? (
          <p className="text-sm text-muted-foreground">Loading sender address…</p>
        ) : !configured ? (
          <p className="text-sm text-muted-foreground">
            {roleLabel === "Admin" ? (
              <>
                Configure the sender address first under{" "}
                <Link to="/admin/settings/shipping-from" className="font-semibold text-primary hover:underline">
                  Admin → Settings → From address
                </Link>
                .
              </>
            ) : (
              "Ask an admin to configure the shipping from address (Admin → Settings → From address)."
            )}
          </p>
        ) : !ready ? (
          <p className="text-sm text-muted-foreground">
            Customer name and delivery address are required before a label can be generated.
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={downloading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!ready || downloading}
            onClick={() => void runDownload()}
          >
            {downloading ? "Generating PDF…" : "Download PDF"}
          </Button>
          <Button type="button" disabled={!ready || downloading} onClick={runPrint}>
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
