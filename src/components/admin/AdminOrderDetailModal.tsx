import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OrderAssetsPanel } from "@/components/orders/OrderAssetsPanel";
import { RemarkTimeline, type RemarkEntry } from "@/components/remarks/RemarkTimeline";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { api, apiBinaryGet } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import {
  auditActionLabel,
  AuditEntryDetail,
  auditEntryHasDetail,
} from "@/lib/auditLogDisplay";
import { fetchAllAuditLogs, type AuditLogFilters, type AuditLogRow } from "@/lib/auditLogFilters";
import { formatMoney, formatShortDateTime, formatTableDateTime } from "@/lib/formatDisplay";
import { fileLabelFromKey, type OrderAssetRow } from "@/lib/orderAssetLabels";
import type { OrderListRow } from "@/lib/orderListTypes";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AdminOrderDetail = {
  order: OrderListRow;
  queryRemarkHistory: RemarkEntry[];
  previewRemarkHistory: RemarkEntry[];
};

const EMPTY_AUDIT_FILTERS: AuditLogFilters = {
  search: "",
  entityType: "",
  entityId: "",
  action: "",
  dateFrom: "",
  dateTo: "",
};

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[0.68rem] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</div>
      <div className="text-sm break-words">{value || "—"}</div>
    </div>
  );
}

export function AdminOrderDetailModal({
  orderId,
  open,
  onClose,
}: {
  orderId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [assets, setAssets] = useState<OrderAssetRow[]>([]);
  const [activity, setActivity] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedAudit, setExpandedAudit] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const id = orderId.trim();
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const d = await api<AdminOrderDetail>(apiPaths.adminOrderDetail(id));
      const queryId = d.order?.queryId?.trim() ?? "";
      const [orderLogs, queryLogs, assetList] = await Promise.all([
        fetchAllAuditLogs({ ...EMPTY_AUDIT_FILTERS, entityType: "order", entityId: id }),
        queryId
          ? fetchAllAuditLogs({ ...EMPTY_AUDIT_FILTERS, entityType: "query", entityId: queryId })
          : Promise.resolve([] as AuditLogRow[]),
        api<OrderAssetRow[]>(apiPaths.adminOrderAssets(id)),
      ]);
      const merged = [...orderLogs, ...queryLogs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setDetail(d);
      setAssets(assetList ?? []);
      setActivity(merged);
      setExpandedAudit({});
    } catch (e) {
      setError((e as Error).message);
      setDetail(null);
      setAssets([]);
      setActivity([]);
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
      apiPaths.adminOrderAssetFile(oid, assetId, disposition),
    [],
  );

  async function viewAsset(assetId: string, r2Key: string) {
    const id = orderId.trim();
    if (!id) return;
    setError("");
    try {
      const blob = await apiBinaryGet(assetFilePath(id, assetId, "inline"));
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
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Query remarks (executive)</p>
                    <RemarkTimeline
                      entries={(detail?.queryRemarkHistory ?? []).map((r) => ({
                        id: r.id,
                        body: r.body,
                        imageKey: r.imageKey,
                        createdAt: r.createdAt,
                      }))}
                      imageUrl={(remarkId) =>
                        apiPaths.adminQueryRemarkImage(order.queryId, remarkId)
                      }
                      emptyMessage="No query remarks."
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Design preview remarks</p>
                    <RemarkTimeline
                      entries={detail?.previewRemarkHistory ?? []}
                      imageUrl={(remarkId) =>
                        apiPaths.adminPreviewRemarkImage(order.orderId, remarkId)
                      }
                      emptyMessage="No design preview remarks."
                    />
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold">Activity</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
                    {loading ? "Refreshing…" : "Refresh"}
                  </Button>
                </div>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                ) : (
                  <ul className="m-0 list-none p-0 space-y-0 border border-border rounded-md divide-y divide-border">
                    {activity.map((item) => {
                      const hasDetail = auditEntryHasDetail(item);
                      const isOpen = expandedAudit[item.id];
                      return (
                        <li key={item.id} className="px-3 py-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {auditActionLabel(item.action)}
                                </span>
                                <Badge variant="secondary" className="text-[0.65rem] uppercase">
                                  {item.entityType}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {item.entityId}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.summary}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.actorUsername || "—"} · {item.actorRole} ·{" "}
                                {formatShortDateTime(item.createdAt)}
                              </p>
                            </div>
                            {hasDetail ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedAudit((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                                }
                              >
                                {isOpen ? "Hide" : "Details"}
                              </Button>
                            ) : null}
                          </div>
                          {hasDetail && isOpen ? (
                            <div className="mt-3 pl-0">
                              <AuditEntryDetail item={item} compact />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
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
            <Link to={`/admin/orders/${encodeURIComponent(orderId)}`} onClick={onClose}>
              Production &amp; dispatch
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              to={`/admin/orders/patch?orderId=${encodeURIComponent(orderId)}`}
              onClick={onClose}
            >
              Update order
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
