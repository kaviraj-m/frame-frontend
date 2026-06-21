import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OrderAssetsPanel } from "@/components/orders/OrderAssetsPanel";
import { RemarkTimeline } from "@/components/remarks/RemarkTimeline";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { api, apiBinaryGet } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { formatMoney, formatTableDateTime } from "@/lib/formatDisplay";
import { fileLabelFromKey, type OrderAssetRow } from "@/lib/orderAssetLabels";
import type { OrderListRow } from "@/lib/orderListTypes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ExecutiveOrderDetail = {
  order: OrderListRow;
  queryRemarkHistory: { id?: string; body: string; imageKey?: string; createdAt: string }[];
  previewRemarkHistory: { id?: string; body: string; imageKey?: string; createdAt: string }[];
};

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[0.68rem] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm break-words">{value || "—"}</div>
    </div>
  );
}

export function ExecutiveOrderDetailModal({
  orderId,
  open,
  onClose,
}: {
  orderId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ExecutiveOrderDetail | null>(null);
  const [assets, setAssets] = useState<OrderAssetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const id = orderId.trim();
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const [d, assetList] = await Promise.all([
        api<ExecutiveOrderDetail>(apiPaths.executiveOrderDetail(id)),
        api<OrderAssetRow[]>(apiPaths.executiveOrderAssets(id)),
      ]);
      setDetail(d);
      setAssets(assetList ?? []);
    } catch (e) {
      setError((e as Error).message);
      setDetail(null);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (open && orderId.trim()) {
      void load();
    }
  }, [open, orderId, load]);

  const order = detail?.order;
  const linesLabel = useMemo(() => {
    if (!order?.lines?.length) return order?.frameSize?.trim() || "—";
    return order.lines.map((l) => `${l.frameSize} ×${l.quantity}`).join(", ");
  }, [order]);

  const assetFilePath = useCallback(
    (oid: string, assetId: string, disposition: "inline" | "attachment") =>
      apiPaths.executiveOrderAssetFile(oid, assetId, disposition),
    [],
  );

  async function viewAsset(_assetId: string, r2Key: string) {
    const id = orderId.trim();
    if (!id) return;
    setError("");
    try {
      const blob = await apiBinaryGet(assetFilePath(id, _assetId, "inline"));
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function downloadAsset(assetId: string, r2Key: string) {
    const id = orderId.trim();
    if (!id) return;
    setError("");
    try {
      const blob = await apiBinaryGet(assetFilePath(id, assetId, "attachment"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileLabelFromKey(r2Key);
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-3xl max-h-[min(90vh,920px)] flex flex-col p-0 gap-0"
        onPointerDownOutside={onClose}
      >
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{orderId}</span>
            {order ? <OrderStatusBadge status={order.status} /> : null}
          </DialogTitle>
          {order?.queryId ? (
            <p className="text-sm text-muted-foreground font-mono">Query {order.queryId}</p>
          ) : null}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {loading && !detail ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading order details…</p>
          ) : null}

          {order ? (
            <>
              <section>
                <h3 className="text-sm font-semibold mb-3">Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  <DetailField label="Customer" value={order.customerUsername?.trim()} />
                  <DetailField label="Phone" value={order.customerPhoneNumber?.trim()} />
                  <DetailField label="Email" value={order.customerEmail?.trim()} />
                  <DetailField label="Frame / lines" value={linesLabel} />
                  <DetailField label="Payment mode" value={order.paymentMode} />
                  <DetailField
                    label="Advance"
                    value={order.advancePayment != null ? formatMoney(order.advancePayment) : undefined}
                  />
                  <DetailField
                    label="Balance"
                    value={order.balanceAmount != null ? formatMoney(order.balanceAmount) : undefined}
                  />
                  <DetailField label="Payment status" value={order.paymentStatus} />
                  <DetailField label="Design remarks" value={order.designRemarks?.trim()} />
                  <DetailField label="Design stage" value={order.designStage} />
                  <DetailField label="Print stage" value={order.printStage} />
                  <DetailField label="Courier stage" value={order.courierStage} />
                  <DetailField label="Tracking" value={order.trackingNumber?.trim()} />
                  <DetailField label="Address" value={order.addressDetails?.trim()} />
                  <DetailField label="Pincode" value={order.pincode?.trim()} />
                  <DetailField
                    label="Created"
                    value={
                      order.createdAt
                        ? `${formatTableDateTime(order.createdAt).date} ${formatTableDateTime(order.createdAt).time}`
                        : undefined
                    }
                  />
                  <DetailField
                    label="Updated"
                    value={
                      order.updatedAt
                        ? `${formatTableDateTime(order.updatedAt).date} ${formatTableDateTime(order.updatedAt).time}`
                        : undefined
                    }
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-3">Remarks</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Query remarks</p>
                    <RemarkTimeline
                      entries={(detail?.queryRemarkHistory ?? []).map((r) => ({
                        id: r.id,
                        body: r.body,
                        imageKey: r.imageKey,
                        createdAt: r.createdAt,
                      }))}
                      imageUrl={(remarkId) =>
                        apiPaths.executiveQueryRemarkImage(order.queryId, remarkId)
                      }
                      emptyMessage="No query remarks."
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Design preview remarks</p>
                    <RemarkTimeline
                      entries={detail?.previewRemarkHistory ?? []}
                      imageUrl={(remarkId) =>
                        apiPaths.executivePreviewRemarkImage(order.orderId, remarkId)
                      }
                      emptyMessage="No design preview remarks."
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-3">Assets</h3>
                <OrderAssetsPanel
                  orderId={orderId.trim()}
                  assets={assets}
                  filePath={assetFilePath}
                  showFrameSizeColumn
                  onView={viewAsset}
                  onDownload={downloadAsset}
                  emptyMessage="No files uploaded."
                />
              </section>
            </>
          ) : null}
        </div>

        <DialogFooter className="px-6 py-4 shrink-0 border-t border-border flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to={`/executive/orders/${encodeURIComponent(orderId)}/assets`} onClick={onClose}>
              Photos
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
